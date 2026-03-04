"""
Weekly Production Plan Routes
PPIC creates weekly production schedules with material shortage checking
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, WeeklyProductionPlan, WeeklyProductionPlanItem, Product, Machine, WorkOrder, BillOfMaterials, BOMItem, Inventory, User
from datetime import datetime, timedelta
from sqlalchemy import func, and_
import json
from utils.timezone import get_local_now, get_local_today

weekly_plan_bp = Blueprint('weekly_plan', __name__)


def get_week_dates(year, week_number):
    """Get start and end date of a week"""
    # First day of the year
    first_day = datetime(year, 1, 1)
    # Find first Monday
    first_monday = first_day + timedelta(days=(7 - first_day.weekday()) % 7)
    if first_day.weekday() == 0:
        first_monday = first_day
    # Calculate week start
    week_start = first_monday + timedelta(weeks=week_number - 1)
    week_end = week_start + timedelta(days=6)
    return week_start.date(), week_end.date()


def generate_plan_number():
    """Generate unique plan number"""
    today = get_local_now()
    prefix = f"WPP-{today.strftime('%Y%m')}"
    
    last_plan = WeeklyProductionPlan.query.filter(
        WeeklyProductionPlan.plan_number.like(f"{prefix}%")
    ).order_by(WeeklyProductionPlan.id.desc()).first()
    
    if last_plan:
        try:
            last_num = int(last_plan.plan_number.split('-')[-1])
            new_num = last_num + 1
        except:
            new_num = 1
    else:
        new_num = 1
    
    return f"{prefix}-{new_num:04d}"


def check_material_availability(product_id, quantity):
    """Check if materials are available for production"""
    shortages = []
    
    # Get BOM for product
    bom = BillOfMaterials.query.filter_by(product_id=product_id, is_active=True).first()
    if not bom:
        return 'no_bom', []
    
    # Check each BOM item
    bom_items = BOMItem.query.filter_by(bom_id=bom.id).all()
    for item in bom_items:
        required_qty = float(item.quantity or 0) * float(quantity)
        
        # Get current stock
        inventory = Inventory.query.filter_by(product_id=item.material_id).first()
        available_qty = float(inventory.quantity or 0) if inventory else 0
        
        if available_qty < required_qty:
            shortage = {
                'material_id': item.material_id,
                'material_code': item.material.code if item.material else None,
                'material_name': item.material.name if item.material else None,
                'required': required_qty,
                'available': available_qty,
                'shortage': required_qty - available_qty
            }
            shortages.append(shortage)
    
    if shortages:
        return 'shortage', shortages
    return 'available', []


# ============= WEEKLY PRODUCTION PLANS =============

@weekly_plan_bp.route('/weekly-plans', methods=['GET'])
@jwt_required()
def get_weekly_plans():
    """Get all weekly production plans"""
    try:
        year = request.args.get('year', type=int)
        week = request.args.get('week', type=int)
        status = request.args.get('status')
        
        query = WeeklyProductionPlan.query
        
        if year:
            query = query.filter(WeeklyProductionPlan.year == year)
        if week:
            query = query.filter(WeeklyProductionPlan.week_number == week)
        if status:
            query = query.filter(WeeklyProductionPlan.status == status)
        
        plans = query.order_by(WeeklyProductionPlan.year.desc(), WeeklyProductionPlan.week_number.desc()).all()
        
        return jsonify({
            'weekly_plans': [plan.to_dict(include_items=False) for plan in plans]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@weekly_plan_bp.route('/weekly-plans/<int:id>', methods=['GET'])
@jwt_required()
def get_weekly_plan(id):
    """Get single weekly production plan with items"""
    try:
        plan = WeeklyProductionPlan.query.get_or_404(id)
        return jsonify({'weekly_plan': plan.to_dict(include_items=True)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@weekly_plan_bp.route('/weekly-plans', methods=['POST'])
@jwt_required()
def create_weekly_plan():
    """Create new weekly production plan"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        year = data.get('year')
        week_number = data.get('week_number')
        
        if not year or not week_number:
            return jsonify({'error': 'Year and week_number are required'}), 400
        
        # Check if plan already exists for this week
        existing = WeeklyProductionPlan.query.filter_by(year=year, week_number=week_number).first()
        if existing:
            return jsonify({'error': f'Plan already exists for week {week_number}/{year}', 'existing_id': existing.id}), 400
        
        # Get week dates
        week_start, week_end = get_week_dates(year, week_number)
        
        plan = WeeklyProductionPlan(
            plan_number=generate_plan_number(),
            year=year,
            week_number=week_number,
            week_start=week_start,
            week_end=week_end,
            status='draft',
            created_by=current_user_id,
            notes=data.get('notes')
        )
        
        db.session.add(plan)
        db.session.commit()
        
        return jsonify({
            'message': 'Weekly plan created successfully',
            'weekly_plan': plan.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@weekly_plan_bp.route('/weekly-plans/<int:id>', methods=['PUT'])
@jwt_required()
def update_weekly_plan(id):
    """Update weekly production plan"""
    try:
        plan = WeeklyProductionPlan.query.get_or_404(id)
        data = request.get_json()
        
        if plan.status not in ['draft']:
            return jsonify({'error': 'Can only edit draft plans'}), 400
        
        if 'notes' in data:
            plan.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Weekly plan updated',
            'weekly_plan': plan.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@weekly_plan_bp.route('/weekly-plans/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_weekly_plan(id):
    """Delete weekly production plan"""
    try:
        plan = WeeklyProductionPlan.query.get_or_404(id)
        
        if plan.status not in ['draft']:
            return jsonify({'error': 'Can only delete draft plans'}), 400
        
        db.session.delete(plan)
        db.session.commit()
        
        return jsonify({'message': 'Weekly plan deleted'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============= PLAN ITEMS =============

@weekly_plan_bp.route('/weekly-plans/<int:plan_id>/items', methods=['POST'])
@jwt_required()
def add_plan_item(plan_id):
    """Add item to weekly production plan"""
    try:
        plan = WeeklyProductionPlan.query.get_or_404(plan_id)
        
        if plan.status not in ['draft']:
            return jsonify({'error': 'Can only add items to draft plans'}), 400
        
        data = request.get_json()
        product_id = data.get('product_id')
        planned_quantity = data.get('planned_quantity')
        
        if not product_id or not planned_quantity:
            return jsonify({'error': 'product_id and planned_quantity are required'}), 400
        
        # Check product exists
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Check material availability
        material_status, shortages = check_material_availability(product_id, planned_quantity)
        
        item = WeeklyProductionPlanItem(
            plan_id=plan_id,
            product_id=product_id,
            planned_quantity=planned_quantity,
            uom=data.get('uom', product.uom or 'pcs'),
            priority=data.get('priority', 1),
            planned_date=datetime.strptime(data['planned_date'], '%Y-%m-%d').date() if data.get('planned_date') else None,
            machine_id=data.get('machine_id'),
            material_status=material_status,
            shortage_items=json.dumps(shortages) if shortages else None,
            notes=data.get('notes')
        )
        
        db.session.add(item)
        db.session.commit()
        
        return jsonify({
            'message': 'Item added to plan',
            'item': item.to_dict(),
            'material_status': material_status,
            'shortages': shortages
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@weekly_plan_bp.route('/weekly-plans/<int:plan_id>/items/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_plan_item(plan_id, item_id):
    """Update plan item"""
    try:
        item = WeeklyProductionPlanItem.query.filter_by(id=item_id, plan_id=plan_id).first_or_404()
        
        if item.plan.status not in ['draft']:
            return jsonify({'error': 'Can only edit items in draft plans'}), 400
        
        data = request.get_json()
        
        if 'planned_quantity' in data:
            item.planned_quantity = data['planned_quantity']
            # Re-check material availability
            material_status, shortages = check_material_availability(item.product_id, data['planned_quantity'])
            item.material_status = material_status
            item.shortage_items = json.dumps(shortages) if shortages else None
        
        if 'priority' in data:
            item.priority = data['priority']
        if 'planned_date' in data:
            item.planned_date = datetime.strptime(data['planned_date'], '%Y-%m-%d').date() if data['planned_date'] else None
        if 'machine_id' in data:
            item.machine_id = data['machine_id']
        if 'notes' in data:
            item.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Item updated',
            'item': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@weekly_plan_bp.route('/weekly-plans/<int:plan_id>/items/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_plan_item(plan_id, item_id):
    """Delete plan item"""
    try:
        item = WeeklyProductionPlanItem.query.filter_by(id=item_id, plan_id=plan_id).first_or_404()
        
        if item.plan.status not in ['draft']:
            return jsonify({'error': 'Can only delete items from draft plans'}), 400
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'Item deleted'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============= PLAN ACTIONS =============

@weekly_plan_bp.route('/weekly-plans/<int:id>/check-materials', methods=['POST'])
@jwt_required()
def check_plan_materials(id):
    """Re-check material availability for all items in plan"""
    try:
        plan = WeeklyProductionPlan.query.get_or_404(id)
        
        results = []
        for item in plan.items.all():
            material_status, shortages = check_material_availability(item.product_id, item.planned_quantity)
            item.material_status = material_status
            item.shortage_items = json.dumps(shortages) if shortages else None
            results.append({
                'item_id': item.id,
                'product_name': item.product.name if item.product else None,
                'material_status': material_status,
                'shortages': shortages
            })
        
        db.session.commit()
        
        # Summary
        total_items = len(results)
        available_count = sum(1 for r in results if r['material_status'] == 'available')
        shortage_count = sum(1 for r in results if r['material_status'] == 'shortage')
        no_bom_count = sum(1 for r in results if r['material_status'] == 'no_bom')
        
        return jsonify({
            'message': 'Material check completed',
            'summary': {
                'total_items': total_items,
                'available': available_count,
                'shortage': shortage_count,
                'no_bom': no_bom_count
            },
            'results': results
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@weekly_plan_bp.route('/weekly-plans/<int:id>/submit', methods=['POST'])
@jwt_required()
def submit_plan(id):
    """Submit plan for approval"""
    try:
        plan = WeeklyProductionPlan.query.get_or_404(id)
        
        if plan.status != 'draft':
            return jsonify({'error': 'Only draft plans can be submitted'}), 400
        
        if plan.items.count() == 0:
            return jsonify({'error': 'Cannot submit empty plan'}), 400
        
        plan.status = 'submitted'
        db.session.commit()
        
        return jsonify({
            'message': 'Plan submitted for approval',
            'weekly_plan': plan.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@weekly_plan_bp.route('/weekly-plans/<int:id>/approve', methods=['POST'])
@jwt_required()
def approve_plan(id):
    """Approve weekly plan"""
    try:
        current_user_id = get_jwt_identity()
        plan = WeeklyProductionPlan.query.get_or_404(id)
        
        if plan.status != 'submitted':
            return jsonify({'error': 'Only submitted plans can be approved'}), 400
        
        plan.status = 'approved'
        plan.approved_by = current_user_id
        plan.approved_at = get_local_now()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Plan approved',
            'weekly_plan': plan.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@weekly_plan_bp.route('/weekly-plans/<int:id>/reject', methods=['POST'])
@jwt_required()
def reject_plan(id):
    """Reject weekly plan"""
    try:
        current_user_id = get_jwt_identity()
        plan = WeeklyProductionPlan.query.get_or_404(id)
        
        if plan.status != 'submitted':
            return jsonify({'error': 'Only submitted plans can be rejected'}), 400
        
        data = request.get_json() or {}
        rejection_reason = data.get('reason', '')
        
        plan.status = 'rejected'
        plan.approved_by = current_user_id
        plan.approved_at = get_local_now()
        plan.notes = f"[DITOLAK] {rejection_reason}\n\n{plan.notes or ''}"
        
        db.session.commit()
        
        return jsonify({
            'message': 'Plan rejected',
            'weekly_plan': plan.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@weekly_plan_bp.route('/weekly-plans/pending-approval', methods=['GET'])
@jwt_required()
def get_pending_approval_plans():
    """Get all plans pending approval for manager"""
    try:
        # Get submitted plans (pending approval)
        pending_plans = WeeklyProductionPlan.query.filter(
            WeeklyProductionPlan.status == 'submitted'
        ).order_by(WeeklyProductionPlan.created_at.desc()).all()
        
        # Get recently approved/rejected plans
        recent_reviewed = WeeklyProductionPlan.query.filter(
            WeeklyProductionPlan.status.in_(['approved', 'rejected'])
        ).order_by(WeeklyProductionPlan.approved_at.desc()).limit(20).all()
        
        # Summary counts
        summary = {
            'pending': WeeklyProductionPlan.query.filter_by(status='submitted').count(),
            'approved': WeeklyProductionPlan.query.filter_by(status='approved').count(),
            'rejected': WeeklyProductionPlan.query.filter_by(status='rejected').count(),
            'in_progress': WeeklyProductionPlan.query.filter_by(status='in_progress').count()
        }
        
        return jsonify({
            'pending_plans': [p.to_dict(include_items=False) for p in pending_plans],
            'recent_reviewed': [p.to_dict(include_items=False) for p in recent_reviewed],
            'summary': summary
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@weekly_plan_bp.route('/weekly-plans/<int:id>/generate-work-orders', methods=['POST'])
@jwt_required()
def generate_work_orders(id):
    """Generate work orders from approved plan"""
    try:
        current_user_id = get_jwt_identity()
        plan = WeeklyProductionPlan.query.get_or_404(id)
        
        if plan.status != 'approved':
            return jsonify({'error': 'Only approved plans can generate work orders'}), 400
        
        data = request.get_json() or {}
        item_ids = data.get('item_ids')  # Optional: specific items to generate WO for
        
        created_wos = []
        
        items = plan.items.all()
        if item_ids:
            items = [i for i in items if i.id in item_ids]
        
        for item in items:
            if item.work_order_id:
                continue  # Already has WO
            
            # Generate WO number
            today = get_local_now()
            wo_prefix = f"WO-{today.strftime('%Y%m%d')}"
            last_wo = WorkOrder.query.filter(
                WorkOrder.wo_number.like(f"{wo_prefix}%")
            ).order_by(WorkOrder.id.desc()).first()
            
            if last_wo:
                try:
                    last_num = int(last_wo.wo_number.split('-')[-1])
                    wo_num = last_num + 1
                except:
                    wo_num = 1
            else:
                wo_num = 1
            
            wo_number = f"{wo_prefix}-{wo_num:04d}"
            
            # Create Work Order with in_progress status
            wo = WorkOrder(
                wo_number=wo_number,
                product_id=item.product_id,
                quantity=item.planned_quantity,
                uom=item.uom,
                status='in_progress',
                priority='normal',
                start_date=item.planned_date or plan.week_start,
                end_date=plan.week_end,
                machine_id=item.machine_id,
                notes=f"Generated from Weekly Plan {plan.plan_number}"
            )
            
            db.session.add(wo)
            db.session.flush()  # Get WO id
            
            item.work_order_id = wo.id
            
            created_wos.append({
                'item_id': item.id,
                'product_name': item.product.name if item.product else None,
                'wo_id': wo.id,
                'wo_number': wo.wo_number
            })
        
        plan.status = 'in_progress'
        db.session.commit()
        
        return jsonify({
            'message': f'{len(created_wos)} work orders created',
            'work_orders': created_wos
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============= UTILITIES =============

@weekly_plan_bp.route('/current-week', methods=['GET'])
@jwt_required()
def get_current_week():
    """Get current week info"""
    today = get_local_now()
    week_number = today.isocalendar()[1]
    year = today.year
    week_start, week_end = get_week_dates(year, week_number)
    
    # Check if plan exists
    existing_plan = WeeklyProductionPlan.query.filter_by(year=year, week_number=week_number).first()
    
    return jsonify({
        'year': year,
        'week_number': week_number,
        'week_start': week_start.isoformat(),
        'week_end': week_end.isoformat(),
        'existing_plan': existing_plan.to_dict(include_items=False) if existing_plan else None
    }), 200
