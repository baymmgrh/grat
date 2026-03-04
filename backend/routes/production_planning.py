"""
Production Planning Routes (Master Production Schedule)
Handles production planning, MPS, and work order generation
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
from sqlalchemy import and_, or_, func
from decimal import Decimal

from models import db
from models.production import ProductionPlan, WorkOrder, Machine
from models.sales import SalesForecast, SalesOrder, SalesOrderItem
from models.product import Product
from models.user import User
from utils.i18n import success_response, error_response
from utils import generate_number
from utils.timezone import get_local_now, get_local_today

planning_bp = Blueprint('production_planning', __name__)

# ===============================
# PRODUCTION PLAN CRUD
# ===============================

@planning_bp.route('/production-plans', methods=['GET'])
@jwt_required()
def get_production_plans():
    """Get all production plans with filters"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status', '')
        plan_type = request.args.get('plan_type', '')
        product_id = request.args.get('product_id', type=int)
        search = request.args.get('search', '')
        
        query = ProductionPlan.query
        
        # Filters
        if status:
            query = query.filter(ProductionPlan.status == status)
        if plan_type:
            query = query.filter(ProductionPlan.plan_type == plan_type)
        if product_id:
            query = query.filter(ProductionPlan.product_id == product_id)
        if search:
            query = query.join(Product).filter(
                or_(
                    ProductionPlan.plan_number.ilike(f'%{search}%'),
                    ProductionPlan.plan_name.ilike(f'%{search}%'),
                    Product.name.ilike(f'%{search}%'),
                    Product.code.ilike(f'%{search}%')
                )
            )
        
        plans = query.order_by(ProductionPlan.period_start.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'plans': [{
                'id': plan.id,
                'plan_number': plan.plan_number,
                'plan_name': plan.plan_name,
                'plan_type': plan.plan_type,
                'period_start': plan.period_start.isoformat(),
                'period_end': plan.period_end.isoformat(),
                'product_id': plan.product_id,
                'product_name': plan.product.name,
                'product_code': plan.product.code,
                'planned_quantity': float(plan.planned_quantity),
                'actual_quantity': float(plan.actual_quantity),
                'completion_percentage': float(plan.completion_percentage) if plan.completion_percentage else 0,
                'uom': plan.uom,
                'status': plan.status,
                'priority': plan.priority,
                'based_on': plan.based_on,
                'machine_name': plan.machine.name if plan.machine else None,
                'created_at': plan.created_at.isoformat(),
                'created_by': plan.created_by_user.username if plan.created_by_user else None
            } for plan in plans.items],
            'total': plans.total,
            'pages': plans.pages,
            'current_page': plans.page
        }), 200
        
    except Exception as e:
        return error_response(str(e)), 500


@planning_bp.route('/production-plans/<int:plan_id>', methods=['GET'])
@jwt_required()
def get_production_plan(plan_id):
    """Get single production plan details"""
    try:
        plan = ProductionPlan.query.get_or_404(plan_id)
        
        # Get related work orders
        work_orders = [{
            'id': wo.id,
            'wo_number': wo.wo_number,
            'quantity': float(wo.quantity),
            'quantity_produced': float(wo.quantity_produced),
            'status': wo.status,
            'priority': wo.priority,
            'scheduled_start_date': wo.scheduled_start_date.isoformat() if wo.scheduled_start_date else None,
            'scheduled_end_date': wo.scheduled_end_date.isoformat() if wo.scheduled_end_date else None,
        } for wo in plan.work_orders]
        
        return jsonify({
            'plan': {
                'id': plan.id,
                'plan_number': plan.plan_number,
                'plan_name': plan.plan_name,
                'plan_type': plan.plan_type,
                'period_start': plan.period_start.isoformat(),
                'period_end': plan.period_end.isoformat(),
                'product_id': plan.product_id,
                'product_name': plan.product.name,
                'product_code': plan.product.code,
                'planned_quantity': float(plan.planned_quantity),
                'actual_quantity': float(plan.actual_quantity),
                'completion_percentage': float(plan.completion_percentage) if plan.completion_percentage else 0,
                'uom': plan.uom,
                'machine_id': plan.machine_id,
                'machine_name': plan.machine.name if plan.machine else None,
                'estimated_duration_hours': float(plan.estimated_duration_hours) if plan.estimated_duration_hours else None,
                'required_operators': plan.required_operators,
                'status': plan.status,
                'priority': plan.priority,
                'based_on': plan.based_on,
                'sales_forecast_id': plan.sales_forecast_id,
                'notes': plan.notes,
                'work_orders': work_orders,
                'created_at': plan.created_at.isoformat(),
                'created_by': plan.created_by_user.username if plan.created_by_user else None,
                'approved_by': plan.approved_by_user.username if plan.approved_by_user else None,
                'approved_at': plan.approved_at.isoformat() if plan.approved_at else None
            }
        }), 200
        
    except Exception as e:
        return error_response(str(e)), 500


@planning_bp.route('/production-plans', methods=['POST'])
@jwt_required()
def create_production_plan():
    """Create new production plan"""
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())
        
        # Generate plan number if not provided
        plan_number = data.get('plan_number')
        if not plan_number:
            plan_number = generate_number('PP', ProductionPlan, 'plan_number')
        
        # Create production plan
        plan = ProductionPlan(
            plan_number=plan_number,
            plan_name=data['plan_name'],
            plan_type=data.get('plan_type', 'weekly'),
            period_start=datetime.fromisoformat(data['period_start']).date(),
            period_end=datetime.fromisoformat(data['period_end']).date(),
            sales_forecast_id=data.get('sales_forecast_id'),
            based_on=data.get('based_on', 'manual'),
            product_id=data['product_id'],
            planned_quantity=data['planned_quantity'],
            uom=data['uom'],
            machine_id=data.get('machine_id'),
            estimated_duration_hours=data.get('estimated_duration_hours'),
            required_operators=data.get('required_operators'),
            status=data.get('status', 'draft'),
            priority=data.get('priority', 'normal'),
            notes=data.get('notes', ''),
            created_by=user_id
        )
        
        db.session.add(plan)
        db.session.commit()
        
        return success_response('Production plan created successfully', {
            'plan_id': plan.id,
            'plan_number': plan.plan_number
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e)), 500


@planning_bp.route('/production-plans/<int:plan_id>', methods=['PUT'])
@jwt_required()
def update_production_plan(plan_id):
    """Update production plan"""
    try:
        plan = ProductionPlan.query.get_or_404(plan_id)
        data = request.get_json()
        
        # Update fields
        plan.plan_name = data.get('plan_name', plan.plan_name)
        plan.plan_type = data.get('plan_type', plan.plan_type)
        plan.period_start = datetime.fromisoformat(data['period_start']).date() if data.get('period_start') else plan.period_start
        plan.period_end = datetime.fromisoformat(data['period_end']).date() if data.get('period_end') else plan.period_end
        plan.product_id = data.get('product_id', plan.product_id)
        plan.planned_quantity = data.get('planned_quantity', plan.planned_quantity)
        plan.uom = data.get('uom', plan.uom)
        plan.machine_id = data.get('machine_id', plan.machine_id)
        plan.estimated_duration_hours = data.get('estimated_duration_hours', plan.estimated_duration_hours)
        plan.required_operators = data.get('required_operators', plan.required_operators)
        plan.status = data.get('status', plan.status)
        plan.priority = data.get('priority', plan.priority)
        plan.based_on = data.get('based_on', plan.based_on)
        plan.sales_forecast_id = data.get('sales_forecast_id', plan.sales_forecast_id)
        plan.notes = data.get('notes', plan.notes)
        plan.updated_at = get_local_now()
        
        db.session.commit()
        
        return success_response('Production plan updated successfully'), 200
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e)), 500


@planning_bp.route('/production-plans/<int:plan_id>', methods=['DELETE'])
@jwt_required()
def delete_production_plan(plan_id):
    """Delete production plan"""
    try:
        plan = ProductionPlan.query.get_or_404(plan_id)
        
        # Check if plan has work orders
        if plan.work_orders:
            return error_response('Cannot delete plan with existing work orders'), 400
        
        db.session.delete(plan)
        db.session.commit()
        
        return success_response('Production plan deleted successfully'), 200
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e)), 500


@planning_bp.route('/production-plans/<int:plan_id>/approve', methods=['POST'])
@jwt_required()
def approve_production_plan(plan_id):
    """Approve production plan"""
    try:
        plan = ProductionPlan.query.get_or_404(plan_id)
        user_id = int(get_jwt_identity())
        
        plan.status = 'approved'
        plan.approved_by = user_id
        plan.approved_at = get_local_now()
        
        db.session.commit()
        
        return success_response('Production plan approved successfully'), 200
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e)), 500


# ===============================
# AUTO-GENERATE WORK ORDERS
# ===============================

@planning_bp.route('/production-plans/<int:plan_id>/generate-work-orders', methods=['POST'])
@jwt_required()
def generate_work_orders_from_plan(plan_id):
    """Auto-generate work orders from production plan"""
    try:
        plan = ProductionPlan.query.get_or_404(plan_id)
        data = request.get_json()
        user_id = int(get_jwt_identity())
        
        # Check if plan is approved
        if plan.status != 'approved':
            return error_response('Plan must be approved before generating work orders'), 400
        
        # Get split strategy
        split_by = data.get('split_by', 'week')  # week, day, batch
        batch_size = data.get('batch_size', plan.planned_quantity)
        
        work_orders_created = []
        
        if split_by == 'single':
            # Create single work order for entire plan
            wo = _create_work_order(plan, plan.planned_quantity, plan.period_start, user_id)
            work_orders_created.append(wo)
            
        elif split_by == 'week':
            # Split by weeks
            current_date = plan.period_start
            weeks = []
            
            while current_date <= plan.period_end:
                week_end = min(current_date + timedelta(days=6), plan.period_end)
                weeks.append((current_date, week_end))
                current_date = week_end + timedelta(days=1)
            
            qty_per_week = plan.planned_quantity / len(weeks)
            
            for week_start, week_end in weeks:
                wo = _create_work_order(plan, qty_per_week, week_start, user_id)
                work_orders_created.append(wo)
                
        elif split_by == 'batch':
            # Split by batch size
            remaining_qty = float(plan.planned_quantity)
            batch_count = int(remaining_qty / float(batch_size)) + (1 if remaining_qty % float(batch_size) > 0 else 0)
            
            for i in range(batch_count):
                qty = min(float(batch_size), remaining_qty)
                wo = _create_work_order(plan, qty, plan.period_start, user_id)
                work_orders_created.append(wo)
                remaining_qty -= qty
        
        # Update plan status
        plan.status = 'released'
        db.session.commit()
        
        return success_response(f'{len(work_orders_created)} work orders generated successfully', {
            'work_orders': [{'id': wo.id, 'wo_number': wo.wo_number} for wo in work_orders_created]
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e)), 500


def _create_work_order(plan, quantity, scheduled_date, user_id):
    """Helper function to create work order"""
    wo_number = generate_number('WO', WorkOrder, 'wo_number')
    
    wo = WorkOrder(
        wo_number=wo_number,
        product_id=plan.product_id,
        production_plan_id=plan.id,
        quantity=quantity,
        uom=plan.uom,
        required_date=plan.period_end,
        scheduled_start_date=scheduled_date,
        machine_id=plan.machine_id,
        status='planned',
        priority=plan.priority,
        created_by=user_id
    )
    
    db.session.add(wo)
    return wo


# ===============================
# PLANNING FROM FORECAST
# ===============================

@planning_bp.route('/production-plans/from-forecast/<int:forecast_id>', methods=['POST'])
@jwt_required()
def create_plan_from_forecast(forecast_id):
    """Create production plan from sales forecast"""
    try:
        forecast = SalesForecast.query.get_or_404(forecast_id)
        user_id = int(get_jwt_identity())
        
        # Check if forecast is approved
        if forecast.status != 'approved':
            return error_response('Forecast must be approved'), 400
        
        # Use most_likely as planned quantity
        planned_qty = forecast.most_likely
        
        plan_number = generate_number('PP', ProductionPlan, 'plan_number')
        
        plan = ProductionPlan(
            plan_number=plan_number,
            plan_name=f"Plan from {forecast.forecast_number}",
            plan_type='monthly',
            period_start=forecast.period_start,
            period_end=forecast.period_end,
            sales_forecast_id=forecast.id,
            based_on='forecast',
            product_id=forecast.product_id,
            planned_quantity=planned_qty,
            uom=forecast.product.primary_uom,
            status='draft',
            priority='normal',
            created_by=user_id
        )
        
        db.session.add(plan)
        db.session.commit()
        
        return success_response('Production plan created from forecast', {
            'plan_id': plan.id,
            'plan_number': plan.plan_number
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e)), 500


# ===============================
# DASHBOARD & ANALYTICS
# ===============================

@planning_bp.route('/production-plans/dashboard', methods=['GET'])
@jwt_required()
def get_planning_dashboard():
    """Get production planning dashboard data"""
    try:
        # Get date range
        start_date = request.args.get('start_date', get_local_today().isoformat())
        end_date = request.args.get('end_date', (get_local_today() + timedelta(days=30)).isoformat())
        
        start = datetime.fromisoformat(start_date).date()
        end = datetime.fromisoformat(end_date).date()
        
        # Plans by status
        plans_by_status = db.session.query(
            ProductionPlan.status,
            func.count(ProductionPlan.id).label('count')
        ).filter(
            and_(
                ProductionPlan.period_start >= start,
                ProductionPlan.period_end <= end
            )
        ).group_by(ProductionPlan.status).all()
        
        # Plans by priority
        plans_by_priority = db.session.query(
            ProductionPlan.priority,
            func.count(ProductionPlan.id).label('count')
        ).filter(
            and_(
                ProductionPlan.period_start >= start,
                ProductionPlan.period_end <= end
            )
        ).group_by(ProductionPlan.priority).all()
        
        # Total planned vs actual
        totals = db.session.query(
            func.sum(ProductionPlan.planned_quantity).label('total_planned'),
            func.sum(ProductionPlan.actual_quantity).label('total_actual')
        ).filter(
            and_(
                ProductionPlan.period_start >= start,
                ProductionPlan.period_end <= end
            )
        ).first()
        
        # Upcoming plans
        upcoming_plans = ProductionPlan.query.filter(
            and_(
                ProductionPlan.period_start >= get_local_today(),
                ProductionPlan.status.in_(['approved', 'released'])
            )
        ).order_by(ProductionPlan.period_start).limit(10).all()
        
        return jsonify({
            'summary': {
                'total_planned': float(totals.total_planned) if totals.total_planned else 0,
                'total_actual': float(totals.total_actual) if totals.total_actual else 0,
                'completion_rate': (float(totals.total_actual) / float(totals.total_planned) * 100) if totals.total_planned else 0
            },
            'by_status': {status: count for status, count in plans_by_status},
            'by_priority': {priority: count for priority, count in plans_by_priority},
            'upcoming_plans': [{
                'id': plan.id,
                'plan_number': plan.plan_number,
                'plan_name': plan.plan_name,
                'product_name': plan.product.name,
                'planned_quantity': float(plan.planned_quantity),
                'period_start': plan.period_start.isoformat(),
                'period_end': plan.period_end.isoformat(),
                'status': plan.status,
                'priority': plan.priority
            } for plan in upcoming_plans]
        }), 200
        
    except Exception as e:
        return error_response(str(e)), 500


# ===============================
# HELPER ENDPOINTS
# ===============================

@planning_bp.route('/production-plans/products', methods=['GET'])
@jwt_required()
def get_products_for_planning():
    """Get products for production planning"""
    try:
        search = request.args.get('search', '')
        
        query = Product.query.filter(Product.is_active == True)
        
        if search:
            query = query.filter(
                or_(
                    Product.name.ilike(f'%{search}%'),
                    Product.code.ilike(f'%{search}%')
                )
            )
        
        products = query.order_by(Product.name).all()
        
        return jsonify({
            'products': [{
                'id': p.id,
                'code': p.code,
                'name': p.name,
                'primary_uom': p.primary_uom,
                'is_producible': p.is_producible
            } for p in products]
        }), 200
        
    except Exception as e:
        return error_response(str(e)), 500


@planning_bp.route('/production-plans/forecasts', methods=['GET'])
@jwt_required()
def get_forecasts_for_planning():
    """Get approved forecasts for planning"""
    try:
        forecasts = SalesForecast.query.filter(
            SalesForecast.status == 'approved'
        ).order_by(SalesForecast.period_start.desc()).all()
        
        return jsonify({
            'forecasts': [{
                'id': f.id,
                'forecast_number': f.forecast_number,
                'name': f.name,
                'product_name': f.product.name if f.product else 'All Products',
                'period_start': f.period_start.isoformat(),
                'period_end': f.period_end.isoformat(),
                'most_likely': float(f.most_likely)
            } for f in forecasts]
        }), 200
        
    except Exception as e:
        return error_response(str(e)), 500
