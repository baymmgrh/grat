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
from models.notification import Notification
from utils.helpers import generate_number
from utils.i18n import success_response, error_response
from sqlalchemy import or_
from utils.timezone import get_local_now, get_local_today

production_approval_bp = Blueprint('production_approval', __name__)

def create_approval_notification(user_ids, notification_type, title, message, reference_type=None, reference_id=None, priority='normal', action_url=None):
    """Create notifications for approval events"""
    try:
        for user_id in user_ids:
            notification = Notification(
                user_id=user_id,
                notification_type=notification_type,
                category='production',
                title=title,
                message=message,
                reference_type=reference_type,
                reference_id=reference_id,
                priority=priority,
                action_url=action_url
            )
            db.session.add(notification)
        db.session.commit()
    except Exception as e:
        print(f"Error creating approval notification: {e}")

def get_manager_user_ids():
    """Get user IDs of all active users for notifications"""
    try:
        users = User.query.filter(User.is_active == True).all()
        return [u.id for u in users]
    except:
        return []


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
    """Get production approval detail with full data including material usage"""
    try:
        from models.production import ShiftProduction, BillOfMaterials, BOMItem
        
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
        
        # Get work order details - handle case where WO might be None
        wo = approval.work_order
        work_order_data = None
        material_usage = []
        production_summary = {}
        shift_productions = []
        
        if wo:
            work_order_data = {
                'id': wo.id,
                'wo_number': wo.wo_number,
                'product_name': wo.product.name if wo.product else None,
                'product_code': wo.product.code if wo.product else None,
                'quantity': float(wo.quantity) if wo.quantity else 0,
                'quantity_produced': float(wo.quantity_produced or 0),
                'quantity_good': float(wo.quantity_good or 0),
                'quantity_scrap': float(wo.quantity_scrap or 0),
                'uom': wo.uom,
                'status': wo.status,
                'machine_name': wo.machine.name if wo.machine else None,
                'scheduled_start_date': wo.scheduled_start_date.isoformat() if wo.scheduled_start_date else None,
                'actual_start_date': wo.actual_start_date.isoformat() if wo.actual_start_date else None,
                'actual_end_date': wo.actual_end_date.isoformat() if wo.actual_end_date else None
            }
            
            # Get BOM and calculate material usage based on production
            # Try to get BOM from WO first, then fallback to product's active BOM
            bom = None
            if wo.bom_id:
                bom = BillOfMaterials.query.get(wo.bom_id)
            
            # Fallback: get active BOM for product
            if not bom and wo.product_id:
                bom = BillOfMaterials.query.filter_by(
                    product_id=wo.product_id, 
                    is_active=True
                ).first()
            
            # Second fallback: get any BOM for product
            if not bom and wo.product_id:
                bom = BillOfMaterials.query.filter_by(
                    product_id=wo.product_id
                ).first()
            
            if bom:
                from models.product import ProductPackaging
                from sqlalchemy import text
                
                # Get packs_per_karton - PRIORITY: BOM > products_new > ProductPackaging
                packs_per_karton = 1
                consumption_data = {
                    'berat_kering_per_pack': 0,
                    'volume_per_pack': 0,
                    'berat_akhir_per_pack': 0
                }
                
                # PRIORITY 1: Use BOM pack_per_carton (user has set this when creating BOM)
                if bom.pack_per_carton and bom.pack_per_carton > 1:
                    packs_per_karton = bom.pack_per_carton
                
                # Get consumption data from products_new (berat_kering, ingredient per karton)
                if wo.product:
                    product_code = wo.product.code
                    product_name = wo.product.name
                    product_new_data = None
                    
                    # Try by code first
                    if product_code:
                        product_new_data = db.session.execute(
                            text('SELECT berat_kering, ingredient, pack_per_karton FROM products WHERE code = :code'),
                            {'code': product_code}
                        ).fetchone()
                    
                    # If not found by code, try matching by name (remove WIP prefix)
                    if not product_new_data and product_name:
                        search_name = product_name
                        # Remove WIP prefix if present
                        if search_name.upper().startswith('WIP '):
                            search_name = search_name[4:]
                        
                        product_new_data = db.session.execute(
                            text('SELECT berat_kering, ingredient, pack_per_karton FROM products WHERE name LIKE :name ORDER BY LENGTH(name) LIMIT 1'),
                            {'name': f'%{search_name}%'}
                        ).fetchone()
                    
                    if product_new_data:
                        berat_kering = float(product_new_data[0]) if product_new_data[0] else 0
                        ingredient = float(product_new_data[1]) if product_new_data[1] else 0
                        packs_from_products_new = int(product_new_data[2]) if product_new_data[2] else 1
                        
                        # Use pack_per_karton from products_new ONLY if BOM doesn't have it
                        if packs_per_karton == 1 and packs_from_products_new > 1:
                            packs_per_karton = packs_from_products_new
                        
                        # Calculate consumption per pack using packs_per_karton (from BOM or products_new)
                        consumption_data['berat_kering_per_pack'] = berat_kering / packs_per_karton if packs_per_karton > 0 else 0
                        consumption_data['volume_per_pack'] = ingredient / packs_per_karton if packs_per_karton > 0 else 0
                
                # PRIORITY 3: Fallback to ProductPackaging
                if packs_per_karton == 1 and wo.product_id:
                    packaging = ProductPackaging.query.filter_by(product_id=wo.product_id).first()
                    if packaging and packaging.packs_per_karton:
                        packs_per_karton = packaging.packs_per_karton
                        if packaging.berat_kering_per_karton:
                            consumption_data['berat_kering_per_pack'] = float(packaging.berat_kering_per_karton) / 1000 / packs_per_karton
                        if packaging.volume_per_pack:
                            consumption_data['volume_per_pack'] = float(packaging.volume_per_pack) / 1000
                        if packaging.berat_akhir_per_karton:
                            consumption_data['berat_akhir_per_pack'] = float(packaging.berat_akhir_per_karton) / 1000 / packs_per_karton
                
                # Production quantities
                qty_good = float(wo.quantity_good or 0)  # Grade A
                qty_rework = 0  # Grade B
                qty_reject = float(wo.quantity_scrap or 0)  # Grade C
                qty_setting = 0  # Setting/Waste
                qty_produced_packs = float(wo.quantity_produced or 0)
                qty_produced_kartons = qty_produced_packs / packs_per_karton if packs_per_karton > 0 else qty_produced_packs
                
                # Get rework and setting from ShiftProduction records
                shift_records = ShiftProduction.query.filter_by(work_order_id=wo.id).all()
                for shift in shift_records:
                    qty_rework += float(shift.rework_quantity or 0)
                    # Setting is calculated as: actual_quantity - good_quantity - reject_quantity - rework_quantity
                    shift_actual = float(shift.actual_quantity or 0)
                    shift_good = float(shift.good_quantity or 0)
                    shift_reject = float(shift.reject_quantity or 0)
                    shift_rework = float(shift.rework_quantity or 0)
                    shift_setting = shift_actual - shift_good - shift_reject - shift_rework
                    if shift_setting > 0:
                        qty_setting += shift_setting
                
                # Calculate waste
                qty_waste = qty_reject + qty_setting
                
                # BOM items
                bom_items = BOMItem.query.filter_by(bom_id=bom.id).all()
                for item in bom_items:
                    qty_per_karton = float(item.quantity) if item.quantity else 0
                    qty_per_pack = qty_per_karton / packs_per_karton if packs_per_karton > 0 else qty_per_karton
                    scrap_percent = float(item.scrap_percent) if item.scrap_percent else 0
                    
                    # Calculate qty needed based on production
                    qty_needed = qty_per_pack * qty_produced_packs
                    qty_effective = qty_needed * (1 + scrap_percent / 100)
                    
                    # Get material info
                    mat_name = 'Unknown'
                    mat_code = ''
                    mat_category = ''
                    mat_type = ''
                    if item.material:
                        mat_name = item.material.name
                        mat_code = item.material.code or ''
                        mat_category = item.material.category or ''
                        mat_type = item.material.category or 'material'
                    elif item.product:
                        mat_name = item.product.name
                        mat_code = item.product.code or ''
                        mat_category = item.product.category or ''
                        mat_type = 'product'
                    
                    material_usage.append({
                        'material_name': mat_name,
                        'material_code': mat_code,
                        'category': mat_category,
                        'material_type': mat_type,
                        'qty_per_karton': round(qty_per_karton, 4),
                        'qty_per_pack': round(qty_per_pack, 4),
                        'qty_needed': round(qty_needed, 4),
                        'scrap_percent': scrap_percent,
                        'qty_effective': round(qty_effective, 4),
                        'uom': item.uom or 'pcs',
                        'unit_cost': float(item.unit_cost) if item.unit_cost else 0,
                        'total_cost': round(qty_effective * (float(item.unit_cost) if item.unit_cost else 0), 2),
                        'is_critical': item.is_critical,
                        'packs_per_karton': packs_per_karton,
                        'qty_produced_packs': qty_produced_packs,
                        'qty_produced_kartons': round(qty_produced_kartons, 2)
                    })
                
                # Calculate Consumption per Grade based on BOM items
                # Categorize BOM items by type
                total_kain_per_pack = 0
                total_ingredient_per_pack = 0
                total_packaging_per_pack = 0
                total_stiker_per_pack = 0
                
                for item in bom_items:
                    qty_per_pack = float(item.quantity) / packs_per_karton if packs_per_karton > 0 else float(item.quantity)
                    
                    # Get material info for categorization
                    mat_category = ''
                    mat_name = ''
                    item_type = (item.item_type or '').lower()
                    
                    if item.material:
                        mat_category = (item.material.category or '').lower()
                        mat_name = (item.material.name or '').lower()
                    elif item.product:
                        mat_category = (item.product.category or '').lower()
                        mat_name = (item.product.name or '').lower()
                    
                    # Stiker materials - CHECK FIRST (before packaging, since STC has packaging_materials type)
                    if ('stiker' in mat_category or 'sticker' in mat_category or 'label' in mat_category or
                        'stc' in mat_name or 'stiker' in mat_name or 'removable' in mat_name):
                        total_stiker_per_pack += qty_per_pack
                    # Kain/Fabric materials
                    elif ('kain' in mat_category or 'fabric' in mat_category or 'spunlace' in mat_category or 
                          'jumbo' in mat_category or 'roll' in mat_category or
                          'jr ' in mat_name or 'jumbo' in mat_name or 
                          item_type == 'wip'):
                        total_kain_per_pack += qty_per_pack
                    # Chemical/Ingredient materials
                    elif ('chemical' in mat_category or 'ingredient' in mat_category or 'parfum' in mat_category or
                          'chemical' in item_type or 'ingredient' in item_type):
                        total_ingredient_per_pack += qty_per_pack
                    # Packaging materials
                    elif ('packaging' in mat_category or 'kemasan' in mat_category or
                          'packaging' in item_type):
                        total_packaging_per_pack += qty_per_pack
                
                # If no categorization found, use products_new data as fallback
                if total_kain_per_pack == 0:
                    total_kain_per_pack = consumption_data.get('berat_kering_per_pack', 0)
                if total_ingredient_per_pack == 0:
                    total_ingredient_per_pack = consumption_data.get('volume_per_pack', 0)
                if total_packaging_per_pack == 0:
                    total_packaging_per_pack = 1  # Default 1 packaging per pack
                if total_stiker_per_pack == 0:
                    total_stiker_per_pack = 1  # Default 1 stiker per pack
                
                consumption_per_grade = []
                grades = [
                    {'grade': 'Grade A (Good)', 'qty_pack': qty_good, 'color': 'green'},
                    {'grade': 'Grade B (Rework)', 'qty_pack': qty_rework, 'color': 'yellow'},
                    {'grade': 'Grade C (Reject)', 'qty_pack': qty_reject, 'color': 'red'},
                    {'grade': 'Setting (Waste)', 'qty_pack': qty_setting, 'color': 'gray'},
                ]
                
                for grade_info in grades:
                    grade_qty = grade_info['qty_pack']
                    consumption_per_grade.append({
                        'grade': grade_info['grade'],
                        'qty_pack': grade_qty,
                        'kain_kg': round(total_kain_per_pack * grade_qty, 4),
                        'ingredient_kg': round(total_ingredient_per_pack * grade_qty, 4),
                        'packaging_pcs': round(total_packaging_per_pack * grade_qty, 0),
                        'stiker_pcs': round(total_stiker_per_pack * grade_qty, 0),
                        'color': grade_info['color']
                    })
                
                # Add totals row
                total_qty = qty_good + qty_rework + qty_reject + qty_setting
                consumption_per_grade.append({
                    'grade': 'TOTAL',
                    'qty_pack': total_qty,
                    'kain_kg': round(total_kain_per_pack * total_qty, 4),
                    'ingredient_kg': round(total_ingredient_per_pack * total_qty, 4),
                    'packaging_pcs': round(total_packaging_per_pack * total_qty, 0),
                    'stiker_pcs': round(total_stiker_per_pack * total_qty, 0),
                    'color': 'blue'
                })
                
                # Store consumption summary
                production_summary['consumption_per_grade'] = consumption_per_grade
                production_summary['consumption_totals'] = {
                    'total_kain_kg': round(total_kain_per_pack * total_qty, 4),
                    'total_ingredient_kg': round(total_ingredient_per_pack * total_qty, 4),
                    'total_packaging_pcs': round(total_packaging_per_pack * total_qty, 0),
                    'total_stiker_pcs': round(total_stiker_per_pack * total_qty, 0)
                }
                production_summary['grade_breakdown'] = {
                    'grade_a': qty_good,
                    'grade_b': qty_rework,
                    'grade_c': qty_reject,
                    'setting': qty_setting,
                    'waste': qty_waste
                }
            
            # Get ShiftProduction records for this WO
            shifts = ShiftProduction.query.filter_by(work_order_id=wo.id).order_by(ShiftProduction.production_date.desc()).all()
            
            total_runtime = 0
            total_downtime = 0
            total_downtime_mesin = 0
            total_downtime_operator = 0
            total_downtime_material = 0
            total_downtime_design = 0
            total_downtime_others = 0
            
            for sp in shifts:
                total_runtime += sp.actual_runtime or 0
                total_downtime += sp.downtime_minutes or 0
                total_downtime_mesin += sp.downtime_mesin or 0
                total_downtime_operator += sp.downtime_operator or 0
                total_downtime_material += sp.downtime_material or 0
                total_downtime_design += sp.downtime_design or 0
                total_downtime_others += sp.downtime_others or 0
                
                shift_productions.append({
                    'id': sp.id,
                    'production_date': sp.production_date.isoformat() if sp.production_date else None,
                    'shift': sp.shift,
                    'target_quantity': float(sp.target_quantity) if sp.target_quantity else 0,
                    'actual_quantity': float(sp.actual_quantity) if sp.actual_quantity else 0,
                    'good_quantity': float(sp.good_quantity) if sp.good_quantity else 0,
                    'reject_quantity': float(sp.reject_quantity) if sp.reject_quantity else 0,
                    'efficiency_rate': float(sp.efficiency_rate) if sp.efficiency_rate else 0,
                    'quality_rate': float(sp.quality_rate) if sp.quality_rate else 0,
                    'oee_score': float(sp.oee_score) if sp.oee_score else 0,
                    'downtime_minutes': sp.downtime_minutes or 0,
                    'operator_name': sp.operator.full_name if sp.operator else None,
                    'notes': sp.notes,
                    'issues': sp.issues
                })
            
            # Production summary with downtime breakdown
            production_summary['total_shifts'] = len(shifts)
            production_summary['total_runtime_minutes'] = total_runtime
            production_summary['total_downtime_minutes'] = total_downtime
            production_summary['downtime_breakdown'] = {
                'mesin': total_downtime_mesin,
                'operator': total_downtime_operator,
                'material': total_downtime_material,
                'design': total_downtime_design,
                'others': total_downtime_others
            }
            production_summary['grade_summary'] = {
                'grade_a': float(wo.quantity_good or 0),
                'grade_b': 0,  # Rework - if tracked
                'grade_c': float(wo.quantity_scrap or 0)
            }
        
        result = approval.to_dict()
        result['work_order'] = work_order_data
        result['wip_batch'] = wip_batch
        result['job_cost_entries'] = job_costs
        result['material_usage'] = material_usage
        result['production_summary'] = production_summary
        result['shift_productions'] = shift_productions
        
        return jsonify(result), 200
        
    except Exception as e:
        import traceback
        print(f"Error in get_production_approval_detail: {str(e)}")
        traceback.print_exc()
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
            submitted_at=get_local_now()
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
        
        approval.updated_at = get_local_now()
        
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
        approval.reviewed_at = get_local_now()
        approval.manager_notes = data.get('notes', approval.manager_notes)
        
        db.session.commit()
        
        # Send notification for approval
        try:
            wo = approval.work_order
            product_name = wo.product.name if wo and wo.product else 'Unknown'
            manager_ids = get_manager_user_ids()
            create_approval_notification(
                user_ids=manager_ids,
                notification_type='success',
                title='Approval Disetujui',
                message=f'Approval {approval.approval_number} untuk {wo.wo_number if wo else "N/A"} - {product_name} telah disetujui',
                reference_type='production_approval',
                reference_id=approval.id,
                priority='normal',
                action_url=f'/app/production/approvals/{approval.id}'
            )
        except Exception as notif_err:
            print(f"Notification error: {notif_err}")
        
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
        approval.reviewed_at = get_local_now()
        approval.manager_notes = data.get('reason')
        
        db.session.commit()
        
        # Send notification for rejection
        try:
            wo = approval.work_order
            product_name = wo.product.name if wo and wo.product else 'Unknown'
            # Notify the submitter and managers
            notify_ids = [approval.submitted_by] if approval.submitted_by else []
            notify_ids.extend(get_manager_user_ids())
            notify_ids = list(set(notify_ids))  # Remove duplicates
            
            create_approval_notification(
                user_ids=notify_ids,
                notification_type='error',
                title='Approval Ditolak',
                message=f'Approval {approval.approval_number} untuk {wo.wo_number if wo else "N/A"} - {product_name} ditolak. Alasan: {data.get("reason")}',
                reference_type='production_approval',
                reference_id=approval.id,
                priority='high',
                action_url=f'/app/production/approvals/{approval.id}'
            )
        except Exception as notif_err:
            print(f"Notification error: {notif_err}")
        
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
            invoice_date=get_local_now().date(),
            due_date=get_local_now().date(),
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
        approval.forwarded_at = get_local_now()
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
            submitted_at=get_local_now()
        )
        
        db.session.add(approval)
        db.session.commit()
        
        # Send notification to managers
        try:
            manager_ids = get_manager_user_ids()
            product_name = wo.product.name if wo.product else 'Unknown'
            create_approval_notification(
                user_ids=manager_ids,
                notification_type='warning',
                title='Approval Produksi Baru',
                message=f'Work Order {wo.wo_number} - {product_name} menunggu approval. Qty: {quantity_good:,.0f} pcs, Total Cost: Rp {total_cost:,.0f}',
                reference_type='production_approval',
                reference_id=approval.id,
                priority='high',
                action_url=f'/app/production/approvals/{approval.id}'
            )
        except Exception as notif_err:
            print(f"Notification error: {notif_err}")
        
        return jsonify({
            'message': 'Work Order berhasil disubmit untuk approval Manager Produksi',
            'approval': approval.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
