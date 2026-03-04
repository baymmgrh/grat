"""
Product Changeover Routes
Menangani pergantian produk di tengah produksi
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import db
from models.production import WorkOrder, ProductChangeover, Machine, ShiftProduction
from utils.helpers import generate_number
from utils.timezone import get_local_now, get_local_today

product_changeover_bp = Blueprint('product_changeover', __name__)


@product_changeover_bp.route('/changeovers', methods=['GET'])
@jwt_required()
def get_changeovers():
    """Get list of product changeovers"""
    try:
        status = request.args.get('status')
        machine_id = request.args.get('machine_id', type=int)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = ProductChangeover.query
        
        if status:
            query = query.filter(ProductChangeover.status == status)
        
        if machine_id:
            query = query.filter(ProductChangeover.machine_id == machine_id)
        
        query = query.order_by(ProductChangeover.created_at.desc())
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'changeovers': [c.to_dict() for c in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page,
            'summary': {
                'in_progress': ProductChangeover.query.filter_by(status='in_progress').count(),
                'completed_today': ProductChangeover.query.filter(
                    ProductChangeover.status == 'completed',
                    db.func.date(ProductChangeover.changeover_end) == get_local_now().date()
                ).count()
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@product_changeover_bp.route('/changeovers/<int:id>', methods=['GET'])
@jwt_required()
def get_changeover_detail(id):
    """Get changeover detail"""
    try:
        changeover = ProductChangeover.query.get(id)
        if not changeover:
            return jsonify({'error': 'Changeover tidak ditemukan'}), 404
        
        return jsonify({'changeover': changeover.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@product_changeover_bp.route('/work-orders/<int:wo_id>/changeover', methods=['POST'])
@jwt_required()
def initiate_changeover(wo_id):
    """
    Initiate product changeover - Pause current WO and optionally start another
    
    Request body:
    {
        "reason": "material_shortage|target_exceeded|priority_change|quality_issue|customer_request|other",
        "reason_detail": "Detail alasan (optional)",
        "to_work_order_id": 123 (optional - WO yang akan dijalankan selanjutnya),
        "notes": "Catatan tambahan (optional)"
    }
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        # Validate current work order
        from_wo = WorkOrder.query.get(wo_id)
        if not from_wo:
            return jsonify({'error': 'Work Order tidak ditemukan'}), 404
        
        if from_wo.status != 'in_progress':
            return jsonify({'error': 'Hanya Work Order dengan status in_progress yang bisa di-changeover'}), 400
        
        if not from_wo.machine_id:
            return jsonify({'error': 'Work Order tidak memiliki mesin yang di-assign'}), 400
        
        # Validate reason
        valid_reasons = ['material_shortage', 'target_exceeded', 'priority_change', 'quality_issue', 'customer_request', 'other']
        reason = data.get('reason')
        if not reason or reason not in valid_reasons:
            return jsonify({'error': f'Reason harus salah satu dari: {", ".join(valid_reasons)}'}), 400
        
        # Validate to_work_order if provided
        to_wo = None
        to_work_order_id = data.get('to_work_order_id')
        if to_work_order_id:
            to_wo = WorkOrder.query.get(to_work_order_id)
            if not to_wo:
                return jsonify({'error': 'Work Order tujuan tidak ditemukan'}), 404
            if to_wo.status not in ['pending', 'paused']:
                return jsonify({'error': 'Work Order tujuan harus berstatus pending atau paused'}), 400
        
        # Calculate current progress
        current_progress = float(from_wo.quantity_produced or 0)
        target_qty = float(from_wo.quantity or 0)
        
        # Create changeover record
        changeover = ProductChangeover(
            changeover_number=generate_number('CO', ProductChangeover, 'changeover_number'),
            from_work_order_id=wo_id,
            to_work_order_id=to_work_order_id,
            machine_id=from_wo.machine_id,
            reason=reason,
            reason_detail=data.get('reason_detail'),
            from_wo_status=from_wo.status,
            from_wo_progress=current_progress,
            from_wo_target=target_qty,
            changeover_start=get_local_now(),
            status='in_progress',
            initiated_by=user_id,
            notes=data.get('notes')
        )
        
        # Pause current work order
        from_wo.status = 'paused'
        from_wo.updated_at = get_local_now()
        
        # Note: DowntimeRecord requires shift_production_id which may not exist yet
        # Store changeover downtime info in the changeover record itself
        # The downtime will be recorded when production input is submitted
        
        db.session.add(changeover)
        db.session.commit()
        
        response_data = {
            'message': 'Changeover berhasil dimulai',
            'changeover': changeover.to_dict(),
            'from_work_order': {
                'id': from_wo.id,
                'wo_number': from_wo.wo_number,
                'status': from_wo.status,
                'progress': current_progress,
                'target': target_qty,
                'progress_percentage': round((current_progress / target_qty * 100) if target_qty > 0 else 0, 1)
            }
        }
        
        if to_wo:
            response_data['to_work_order'] = {
                'id': to_wo.id,
                'wo_number': to_wo.wo_number,
                'status': to_wo.status
            }
        
        return jsonify(response_data), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@product_changeover_bp.route('/changeovers/<int:id>/complete', methods=['POST'])
@jwt_required()
def complete_changeover(id):
    """
    Complete changeover - Start the new work order
    
    Request body:
    {
        "to_work_order_id": 123 (required if not set during initiation),
        "setup_time_minutes": 30 (waktu setup mesin),
        "notes": "Catatan tambahan"
    }
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        changeover = ProductChangeover.query.get(id)
        if not changeover:
            return jsonify({'error': 'Changeover tidak ditemukan'}), 404
        
        if changeover.status != 'in_progress':
            return jsonify({'error': 'Changeover sudah selesai atau dibatalkan'}), 400
        
        # Get or validate to_work_order
        to_work_order_id = data.get('to_work_order_id') or changeover.to_work_order_id
        if not to_work_order_id:
            return jsonify({'error': 'Work Order tujuan harus ditentukan'}), 400
        
        to_wo = WorkOrder.query.get(to_work_order_id)
        if not to_wo:
            return jsonify({'error': 'Work Order tujuan tidak ditemukan'}), 404
        
        if to_wo.status not in ['pending', 'paused']:
            return jsonify({'error': 'Work Order tujuan harus berstatus pending atau paused'}), 400
        
        # Calculate setup time
        setup_time = data.get('setup_time_minutes', 0)
        if not setup_time:
            # Auto calculate from changeover duration
            duration = get_local_now() - changeover.changeover_start
            setup_time = int(duration.total_seconds() / 60)
        
        # Update changeover
        changeover.to_work_order_id = to_work_order_id
        changeover.changeover_end = get_local_now()
        changeover.setup_time_minutes = setup_time
        changeover.status = 'completed'
        changeover.completed_by = user_id
        if data.get('notes'):
            changeover.notes = (changeover.notes or '') + '\n' + data.get('notes')
        
        # Start the new work order
        to_wo.status = 'in_progress'
        to_wo.machine_id = changeover.machine_id  # Assign same machine
        if not to_wo.actual_start_date:
            to_wo.actual_start_date = get_local_now()
        to_wo.updated_at = get_local_now()
        
        # Record changeover downtime to the PREVIOUS WO's ShiftProduction
        from_wo = WorkOrder.query.get(changeover.from_work_order_id)
        if from_wo:
            # Find or create ShiftProduction for the previous WO on today's date
            today = get_local_now().date()
            current_hour = get_local_now().hour
            # Determine shift based on current time (shift 1: 06-14, shift 2: 14-22, shift 3: 22-06)
            if 6 <= current_hour < 14:
                shift = '1'
            elif 14 <= current_hour < 22:
                shift = '2'
            else:
                shift = '3'
            
            shift_production = ShiftProduction.query.filter_by(
                work_order_id=from_wo.id,
                machine_id=changeover.machine_id,
                production_date=today,
                shift=shift
            ).first()
            
            if shift_production:
                # Add changeover downtime to design category
                shift_production.downtime_design = (shift_production.downtime_design or 0) + setup_time
                
                # Add to issues string
                to_product_name = to_wo.product.name if to_wo.product else f'WO-{to_wo.id}'
                changeover_issue = f"{setup_time} menit - Changeover ke {to_product_name} [design]"
                if shift_production.issues:
                    shift_production.issues = shift_production.issues + '; ' + changeover_issue
                else:
                    shift_production.issues = changeover_issue
                
                # Recalculate total downtime
                shift_production.downtime_minutes = (
                    (shift_production.downtime_mesin or 0) +
                    (shift_production.downtime_operator or 0) +
                    (shift_production.downtime_material or 0) +
                    (shift_production.downtime_design or 0) +
                    (shift_production.downtime_others or 0)
                )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Changeover selesai, Work Order baru sudah dimulai',
            'changeover': changeover.to_dict(),
            'new_work_order': {
                'id': to_wo.id,
                'wo_number': to_wo.wo_number,
                'product_name': to_wo.product.name if to_wo.product else None,
                'status': to_wo.status,
                'machine': changeover.machine.name if changeover.machine else None
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@product_changeover_bp.route('/changeovers/<int:id>/cancel', methods=['POST'])
@jwt_required()
def cancel_changeover(id):
    """
    Cancel changeover - Resume the original work order
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json() or {}
        
        changeover = ProductChangeover.query.get(id)
        if not changeover:
            return jsonify({'error': 'Changeover tidak ditemukan'}), 404
        
        if changeover.status != 'in_progress':
            return jsonify({'error': 'Changeover sudah selesai atau dibatalkan'}), 400
        
        # Resume original work order
        from_wo = changeover.from_work_order
        if from_wo:
            from_wo.status = 'in_progress'
            from_wo.updated_at = get_local_now()
        
        # Calculate cancelled changeover duration
        cancel_time = get_local_now()
        duration = cancel_time - changeover.changeover_start
        setup_time = int(duration.total_seconds() / 60)
        
        # Update changeover
        changeover.status = 'cancelled'
        changeover.changeover_end = cancel_time
        changeover.setup_time_minutes = setup_time
        changeover.completed_by = user_id
        changeover.notes = (changeover.notes or '') + f'\nDibatalkan: {data.get("reason", "Tidak ada alasan")}'
        
        # Record cancelled changeover downtime to the WO's ShiftProduction
        if from_wo and setup_time > 0:
            today = get_local_now().date()
            current_hour = get_local_now().hour
            # Determine shift based on current time
            if 6 <= current_hour < 14:
                shift = '1'
            elif 14 <= current_hour < 22:
                shift = '2'
            else:
                shift = '3'
            
            shift_production = ShiftProduction.query.filter_by(
                work_order_id=from_wo.id,
                machine_id=changeover.machine_id,
                production_date=today,
                shift=shift
            ).first()
            
            if shift_production:
                # Add cancelled changeover downtime to design category
                shift_production.downtime_design = (shift_production.downtime_design or 0) + setup_time
                
                # Add to issues string with CANCELLED note
                changeover_issue = f"{setup_time} menit - Changeover dibatalkan [design]"
                if shift_production.issues:
                    shift_production.issues = shift_production.issues + '; ' + changeover_issue
                else:
                    shift_production.issues = changeover_issue
                
                # Recalculate total downtime
                shift_production.downtime_minutes = (
                    (shift_production.downtime_mesin or 0) +
                    (shift_production.downtime_operator or 0) +
                    (shift_production.downtime_material or 0) +
                    (shift_production.downtime_design or 0) +
                    (shift_production.downtime_others or 0)
                )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Changeover dibatalkan, Work Order dilanjutkan',
            'changeover': changeover.to_dict(),
            'resumed_work_order': {
                'id': from_wo.id,
                'wo_number': from_wo.wo_number,
                'status': from_wo.status
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@product_changeover_bp.route('/machines/<int:machine_id>/available-work-orders', methods=['GET'])
@jwt_required()
def get_available_work_orders_for_changeover(machine_id):
    """
    Get work orders available for changeover on a specific machine
    Returns pending and paused work orders
    """
    try:
        machine = Machine.query.get(machine_id)
        if not machine:
            return jsonify({'error': 'Mesin tidak ditemukan'}), 404
        
        # Get pending and paused work orders
        work_orders = WorkOrder.query.filter(
            WorkOrder.status.in_(['pending', 'paused']),
            db.or_(
                WorkOrder.machine_id == machine_id,
                WorkOrder.machine_id.is_(None)
            )
        ).order_by(
            WorkOrder.priority.desc(),
            WorkOrder.start_date.asc()
        ).all()
        
        return jsonify({
            'machine': {
                'id': machine.id,
                'name': machine.name,
                'code': machine.code
            },
            'available_work_orders': [{
                'id': wo.id,
                'wo_number': wo.wo_number,
                'product_name': wo.product.name if wo.product else None,
                'product_code': wo.product.code if wo.product else None,
                'quantity': float(wo.quantity or 0),
                'status': wo.status,
                'priority': wo.priority,
                'start_date': wo.start_date.isoformat() if wo.start_date else None,
                'end_date': wo.end_date.isoformat() if wo.end_date else None
            } for wo in work_orders]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
