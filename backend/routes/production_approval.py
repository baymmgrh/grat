"""
Production Approval Routes
Manager Produksi approval workflow sebelum forward ke Finance
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import db
from models.production import WorkOrder, ProductionApproval
from models.wip_job_costing import WIPBatch, JobCostEntry
from models.user import User
from utils.helpers import generate_number
from utils.i18n import success_response, error_response

production_approval_bp = Blueprint('production_approval', __name__)


@production_approval_bp.route('/production-approvals', methods=['GET'])
@jwt_required()
def get_production_approvals():
    """Get list of production approvals"""
    try:
        status = request.args.get('status')
        work_order_id = request.args.get('work_order_id', type=int)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = ProductionApproval.query
        
        if status:
            query = query.filter(ProductionApproval.status == status)
        
        if work_order_id:
            query = query.filter(ProductionApproval.work_order_id == work_order_id)
        
        query = query.order_by(ProductionApproval.created_at.desc())
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'approvals': [a.to_dict() for a in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page,
            'summary': {
                'pending': ProductionApproval.query.filter_by(status='pending').count(),
                'approved': ProductionApproval.query.filter_by(status='approved').count(),
                'rejected': ProductionApproval.query.filter_by(status='rejected').count(),
                'forwarded': ProductionApproval.query.filter_by(forwarded_to_finance=True).count()
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@production_approval_bp.route('/production-approvals/<int:id>', methods=['GET'])
@jwt_required()
def get_production_approval_detail(id):
    """Get production approval detail with full data"""
    try:
        approval = ProductionApproval.query.get(id)
        if not approval:
            return jsonify({'error': 'Approval tidak ditemukan'}), 404
        
        # Get WIP batch details
        wip_batch = None
        job_costs = []
        if approval.wip_batch_id:
            wip = WIPBatch.query.get(approval.wip_batch_id)
            if wip:
                wip_batch = {
                    'id': wip.id,
                    'wip_batch_no': wip.wip_batch_no,
                    'current_stage': wip.current_stage,
                    'qty_started': float(wip.qty_started),
                    'qty_completed': float(wip.qty_completed),
                    'qty_rejected': float(wip.qty_rejected),
                    'material_cost': float(wip.material_cost),
                    'labor_cost': float(wip.labor_cost),
                    'overhead_cost': float(wip.overhead_cost),
                    'total_wip_value': float(wip.total_wip_value)
                }
                
                # Get job cost entries
                entries = JobCostEntry.query.filter_by(wip_batch_id=wip.id).all()
                job_costs = [{
                    'id': e.id,
                    'cost_type': e.cost_type,
                    'cost_category': e.cost_category,
                    'description': e.description,
                    'quantity': float(e.quantity),
                    'unit_cost': float(e.unit_cost),
                    'total_cost': float(e.total_cost),
                    'cost_date': e.cost_date.isoformat() if e.cost_date else None
                } for e in entries]
        
        # Get work order details
        wo = approval.work_order
        work_order_data = {
            'id': wo.id,
            'wo_number': wo.wo_number,
            'product_name': wo.product.name if wo.product else None,
            'quantity': float(wo.quantity),
            'quantity_produced': float(wo.quantity_produced or 0),
            'quantity_good': float(wo.quantity_good or 0),
            'quantity_scrap': float(wo.quantity_scrap or 0),
            'status': wo.status,
            'machine_name': wo.machine.name if wo.machine else None,
            'start_date': wo.start_date.isoformat() if wo.start_date else None,
            'actual_start_date': wo.actual_start_date.isoformat() if wo.actual_start_date else None,
            'actual_end_date': wo.actual_end_date.isoformat() if wo.actual_end_date else None
        }
        
        result = approval.to_dict()
        result['work_order'] = work_order_data
        result['wip_batch'] = wip_batch
        result['job_cost_entries'] = job_costs
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@production_approval_bp.route('/production-approvals', methods=['POST'])
@jwt_required()
def create_production_approval():
    """Create production approval request from completed work order"""
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        work_order_id = data.get('work_order_id')
        if not work_order_id:
            return jsonify({'error': 'Work Order ID diperlukan'}), 400
        
        wo = WorkOrder.query.get(work_order_id)
        if not wo:
            return jsonify({'error': 'Work Order tidak ditemukan'}), 404
        
        # Check if approval already exists
        existing = ProductionApproval.query.filter_by(work_order_id=work_order_id).first()
        if existing:
            return jsonify({'error': 'Approval sudah ada untuk Work Order ini', 'approval_id': existing.id}), 400
        
        # Get WIP batch
        wip_batch = WIPBatch.query.filter_by(work_order_id=work_order_id).first()
        
        # Calculate costs
        material_cost = float(wip_batch.material_cost) if wip_batch else 0
        labor_cost = float(wip_batch.labor_cost) if wip_batch else 0
        overhead_cost = float(wip_batch.overhead_cost) if wip_batch else 0
        total_cost = material_cost + labor_cost + overhead_cost
        
        quantity_good = float(wo.quantity_good or 0)
        cost_per_unit = total_cost / quantity_good if quantity_good > 0 else 0
        
        # Create approval
        approval = ProductionApproval(
            approval_number=generate_number('PA', ProductionApproval, 'approval_number'),
            work_order_id=work_order_id,
            wip_batch_id=wip_batch.id if wip_batch else None,
            quantity_produced=float(wo.quantity_produced or 0),
            quantity_good=quantity_good,
            quantity_reject=float(wo.quantity_scrap or 0),
            material_cost=material_cost,
            labor_cost=labor_cost,
            overhead_cost=overhead_cost,
            total_cost=total_cost,
            cost_per_unit=cost_per_unit,
            original_quantity_good=quantity_good,
            original_total_cost=total_cost,
            status='pending',
            submitted_by=user_id,
            submitted_at=datetime.utcnow()
        )
        
        db.session.add(approval)
        db.session.commit()
        
        return jsonify({
            'message': 'Approval request berhasil dibuat',
            'approval': approval.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@production_approval_bp.route('/production-approvals/<int:id>', methods=['PUT'])
@jwt_required()
def update_production_approval(id):
    """Manager can edit approval data before approving"""
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        approval = ProductionApproval.query.get(id)
        if not approval:
            return jsonify({'error': 'Approval tidak ditemukan'}), 404
        
        if approval.status != 'pending':
            return jsonify({'error': 'Hanya approval pending yang bisa diedit'}), 400
        
        # Track if manager made changes
        changes_made = False
        
        # Update editable fields
        if 'quantity_good' in data:
            new_qty = float(data['quantity_good'])
            if new_qty != float(approval.quantity_good):
                changes_made = True
            approval.quantity_good = new_qty
        
        if 'quantity_reject' in data:
            approval.quantity_reject = float(data['quantity_reject'])
        
        if 'material_cost' in data:
            approval.material_cost = float(data['material_cost'])
            changes_made = True
        
        if 'labor_cost' in data:
            approval.labor_cost = float(data['labor_cost'])
            changes_made = True
        
        if 'overhead_cost' in data:
            approval.overhead_cost = float(data['overhead_cost'])
            changes_made = True
        
        # Recalculate totals
        approval.total_cost = float(approval.material_cost) + float(approval.labor_cost) + float(approval.overhead_cost)
        if float(approval.quantity_good) > 0:
            approval.cost_per_unit = approval.total_cost / float(approval.quantity_good)
        
        if 'manager_notes' in data:
            approval.manager_notes = data['manager_notes']
        
        if changes_made and 'adjustment_reason' in data:
            approval.adjustment_reason = data['adjustment_reason']
        
        approval.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Data approval berhasil diupdate',
            'approval': approval.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@production_approval_bp.route('/production-approvals/<int:id>/approve', methods=['PUT'])
@jwt_required()
def approve_production(id):
    """Manager approves production - ready to forward to finance"""
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json() or {}
        
        approval = ProductionApproval.query.get(id)
        if not approval:
            return jsonify({'error': 'Approval tidak ditemukan'}), 404
        
        if approval.status != 'pending':
            return jsonify({'error': 'Approval sudah diproses'}), 400
        
        approval.status = 'approved'
        approval.reviewed_by = user_id
        approval.reviewed_at = datetime.utcnow()
        approval.manager_notes = data.get('notes', approval.manager_notes)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Produksi disetujui. Siap diteruskan ke Finance.',
            'approval': approval.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@production_approval_bp.route('/production-approvals/<int:id>/reject', methods=['PUT'])
@jwt_required()
def reject_production(id):
    """Manager rejects production approval"""
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        approval = ProductionApproval.query.get(id)
        if not approval:
            return jsonify({'error': 'Approval tidak ditemukan'}), 404
        
        if approval.status != 'pending':
            return jsonify({'error': 'Approval sudah diproses'}), 400
        
        if not data.get('reason'):
            return jsonify({'error': 'Alasan penolakan diperlukan'}), 400
        
        approval.status = 'rejected'
        approval.reviewed_by = user_id
        approval.reviewed_at = datetime.utcnow()
        approval.manager_notes = data.get('reason')
        
        db.session.commit()
        
        return jsonify({
            'message': 'Produksi ditolak',
            'approval': approval.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@production_approval_bp.route('/production-approvals/<int:id>/forward-to-finance', methods=['PUT'])
@jwt_required()
def forward_to_finance(id):
    """Forward approved production to finance module"""
    try:
        from models.finance import Invoice, InvoiceItem
        
        user_id = int(get_jwt_identity())
        
        approval = ProductionApproval.query.get(id)
        if not approval:
            return jsonify({'error': 'Approval tidak ditemukan'}), 404
        
        if approval.status != 'approved':
            return jsonify({'error': 'Hanya approval yang sudah disetujui yang bisa diteruskan'}), 400
        
        if approval.forwarded_to_finance:
            return jsonify({'error': 'Sudah diteruskan ke Finance'}), 400
        
        wo = approval.work_order
        
        # Create production cost record in finance
        # This creates internal costing record, not customer invoice
        invoice = Invoice(
            invoice_number=generate_number('PC', Invoice, 'invoice_number'),  # Production Cost
            invoice_type='production_cost',
            customer_id=None,  # Internal cost, no customer
            work_order_id=wo.id,
            production_approval_id=approval.id,
            invoice_date=datetime.utcnow().date(),
            due_date=datetime.utcnow().date(),
            subtotal=approval.total_cost,
            tax_amount=0,
            total_amount=approval.total_cost,
            status='posted',
            notes=f'Production cost for WO {wo.wo_number}',
            created_by=user_id
        )
        
        db.session.add(invoice)
        db.session.flush()
        
        # Add cost breakdown as invoice items
        line_number = 1
        
        if float(approval.material_cost) > 0:
            db.session.add(InvoiceItem(
                invoice_id=invoice.id,
                line_number=line_number,
                description=f'Material Cost - {wo.product.name if wo.product else "N/A"}',
                quantity=float(approval.quantity_good),
                unit_price=float(approval.material_cost) / float(approval.quantity_good) if float(approval.quantity_good) > 0 else 0,
                amount=float(approval.material_cost)
            ))
            line_number += 1
        
        if float(approval.labor_cost) > 0:
            db.session.add(InvoiceItem(
                invoice_id=invoice.id,
                line_number=line_number,
                description='Labor Cost',
                quantity=float(approval.quantity_good),
                unit_price=float(approval.labor_cost) / float(approval.quantity_good) if float(approval.quantity_good) > 0 else 0,
                amount=float(approval.labor_cost)
            ))
            line_number += 1
        
        if float(approval.overhead_cost) > 0:
            db.session.add(InvoiceItem(
                invoice_id=invoice.id,
                line_number=line_number,
                description='Overhead Cost',
                quantity=float(approval.quantity_good),
                unit_price=float(approval.overhead_cost) / float(approval.quantity_good) if float(approval.quantity_good) > 0 else 0,
                amount=float(approval.overhead_cost)
            ))
        
        # Update approval
        approval.forwarded_to_finance = True
        approval.forwarded_at = datetime.utcnow()
        approval.invoice_id = invoice.id
        
        db.session.commit()
        
        return jsonify({
            'message': 'Berhasil diteruskan ke Finance',
            'invoice_id': invoice.id,
            'invoice_number': invoice.invoice_number,
            'approval': approval.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@production_approval_bp.route('/work-orders/<int:wo_id>/submit-for-approval', methods=['POST'])
@jwt_required()
def submit_wo_for_approval(wo_id):
    """Submit completed work order for manager approval"""
    try:
        user_id = int(get_jwt_identity())
        
        wo = WorkOrder.query.get(wo_id)
        if not wo:
            return jsonify({'error': 'Work Order tidak ditemukan'}), 404
        
        if wo.status != 'completed':
            return jsonify({'error': 'Work Order harus completed untuk submit approval'}), 400
        
        # Check if already submitted
        existing = ProductionApproval.query.filter_by(work_order_id=wo_id).first()
        if existing:
            return jsonify({
                'error': 'Work Order sudah disubmit untuk approval',
                'approval_id': existing.id,
                'status': existing.status
            }), 400
        
        # Get WIP batch
        wip_batch = WIPBatch.query.filter_by(work_order_id=wo_id).first()
        
        # Calculate costs
        material_cost = float(wip_batch.material_cost) if wip_batch else 0
        labor_cost = float(wip_batch.labor_cost) if wip_batch else 0
        overhead_cost = float(wip_batch.overhead_cost) if wip_batch else 0
        total_cost = material_cost + labor_cost + overhead_cost
        
        quantity_good = float(wo.quantity_good or 0)
        cost_per_unit = total_cost / quantity_good if quantity_good > 0 else 0
        
        # Create approval
        approval = ProductionApproval(
            approval_number=generate_number('PA', ProductionApproval, 'approval_number'),
            work_order_id=wo_id,
            wip_batch_id=wip_batch.id if wip_batch else None,
            quantity_produced=float(wo.quantity_produced or 0),
            quantity_good=quantity_good,
            quantity_reject=float(wo.quantity_scrap or 0),
            material_cost=material_cost,
            labor_cost=labor_cost,
            overhead_cost=overhead_cost,
            total_cost=total_cost,
            cost_per_unit=cost_per_unit,
            original_quantity_good=quantity_good,
            original_total_cost=total_cost,
            status='pending',
            submitted_by=user_id,
            submitted_at=datetime.utcnow()
        )
        
        db.session.add(approval)
        db.session.commit()
        
        return jsonify({
            'message': 'Work Order berhasil disubmit untuk approval Manager Produksi',
            'approval': approval.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
