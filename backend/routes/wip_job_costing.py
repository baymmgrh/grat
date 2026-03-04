from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.wip_job_costing import WIPBatch, WIPStageMovement, JobCostEntry, WIPSummary, WIPWorkflowIntegration
from models.production import WorkOrder, Machine
from models.product import Product
from models.hr import Employee
from utils.i18n import success_response, error_response
from utils import generate_number
from datetime import datetime, date, timedelta
from sqlalchemy import func, and_, or_
from utils.timezone import get_local_now, get_local_today

wip_job_costing_bp = Blueprint('wip_job_costing', __name__)

# ===============================
# WIP BATCH MANAGEMENT
# ===============================

@wip_job_costing_bp.route('/wip-batches', methods=['GET'])
@jwt_required()
def get_wip_batches():
    """Get all WIP batches with filtering"""
    try:
        # Query parameters
        status = request.args.get('status')
        stage = request.args.get('stage')
        work_order_id = request.args.get('work_order_id')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        query = db.session.query(WIPBatch).outerjoin(WorkOrder).outerjoin(Product)
        
        # Apply filters
        if status:
            # Handle multiple status values (e.g., "open,in_progress")
            if ',' in status:
                status_list = [s.strip() for s in status.split(',')]
                query = query.filter(WIPBatch.status.in_(status_list))
            else:
                query = query.filter(WIPBatch.status == status)
        if stage:
            query = query.filter(WIPBatch.current_stage == stage)
        if work_order_id:
            query = query.filter(WIPBatch.work_order_id == work_order_id)
        if date_from:
            query = query.filter(WIPBatch.created_at >= datetime.strptime(date_from, '%Y-%m-%d'))
        if date_to:
            query = query.filter(WIPBatch.created_at <= datetime.strptime(date_to, '%Y-%m-%d'))
        
        wip_batches = query.order_by(WIPBatch.created_at.desc()).all()
        
        result = []
        for batch in wip_batches:
            result.append({
                'id': batch.id,
                'wip_batch_no': batch.wip_batch_no,
                'work_order_no': batch.work_order.wo_number if batch.work_order else f"WO-{batch.work_order_id}",
                'product_name': batch.product.name if batch.product else f"Product-{batch.product_id}",
                'current_stage': batch.current_stage,
                'machine_name': batch.machine.name if batch.machine else None,
                'line_name': batch.line_name,
                'qty_started': float(batch.qty_started),
                'qty_completed': float(batch.qty_completed),
                'qty_rejected': float(batch.qty_rejected),
                'qty_in_process': float(batch.qty_in_process),
                'completion_percentage': batch.completion_percentage,
                'rejection_rate': batch.rejection_rate,
                'material_cost': float(batch.material_cost),
                'labor_cost': float(batch.labor_cost),
                'overhead_cost': float(batch.overhead_cost),
                'total_wip_value': float(batch.total_wip_value),
                'status': batch.status,
                'operator_name': batch.operator.full_name if batch.operator else None,
                'shift': batch.shift,
                'started_at': batch.started_at.isoformat() if batch.started_at else None,
                'completed_at': batch.completed_at.isoformat() if batch.completed_at else None,
                'duration_minutes': batch.duration_minutes
            })
        
        return jsonify({
            'wip_batches': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        return jsonify(error_response(str(e))), 500

@wip_job_costing_bp.route('/wip-batches/<int:wip_batch_id>', methods=['GET'])
@jwt_required()
def get_wip_batch_detail(wip_batch_id):
    """Get detailed WIP batch information"""
    try:
        wip_batch = WIPBatch.query.get_or_404(wip_batch_id)
        
        # Get stage movements
        movements = WIPStageMovement.query.filter_by(wip_batch_id=wip_batch_id).order_by(WIPStageMovement.movement_date).all()
        
        # Get job cost entries
        job_costs = JobCostEntry.query.filter_by(wip_batch_id=wip_batch_id).order_by(JobCostEntry.cost_date).all()
        
        result = {
            'id': wip_batch.id,
            'wip_batch_no': wip_batch.wip_batch_no,
            'work_order': {
                'id': wip_batch.work_order.id,
                'wo_number': wip_batch.work_order.wo_number,
                'status': wip_batch.work_order.status
            },
            'product': {
                'id': wip_batch.product.id,
                'name': wip_batch.product.name,
                'sku': wip_batch.product.sku
            },
            'current_stage': wip_batch.current_stage,
            'machine': {
                'id': wip_batch.machine.id,
                'name': wip_batch.machine.name
            } if wip_batch.machine else None,
            'line_name': wip_batch.line_name,
            'quantities': {
                'started': float(wip_batch.qty_started),
                'completed': float(wip_batch.qty_completed),
                'rejected': float(wip_batch.qty_rejected),
                'in_process': float(wip_batch.qty_in_process),
                'completion_percentage': wip_batch.completion_percentage,
                'rejection_rate': wip_batch.rejection_rate
            },
            'costs': {
                'material_cost': float(wip_batch.material_cost),
                'labor_cost': float(wip_batch.labor_cost),
                'overhead_cost': float(wip_batch.overhead_cost),
                'total_wip_value': float(wip_batch.total_wip_value)
            },
            'status': wip_batch.status,
            'operator': {
                'id': wip_batch.operator.id,
                'name': wip_batch.operator.full_name
            } if wip_batch.operator else None,
            'shift': wip_batch.shift,
            'timing': {
                'started_at': wip_batch.started_at.isoformat() if wip_batch.started_at else None,
                'completed_at': wip_batch.completed_at.isoformat() if wip_batch.completed_at else None,
                'duration_minutes': wip_batch.duration_minutes
            },
            'stage_movements': [{
                'id': mov.id,
                'from_stage': mov.from_stage,
                'to_stage': mov.to_stage,
                'qty_moved': float(mov.qty_moved),
                'qty_good': float(mov.qty_good),
                'qty_rejected': float(mov.qty_rejected),
                'processing_time_minutes': mov.processing_time_minutes,
                'stage_cost': float(mov.stage_cost),
                'movement_date': mov.movement_date.isoformat(),
                'machine_name': mov.machine.name if mov.machine else None,
                'operator_name': mov.operator.full_name if mov.operator else None,
                'shift': mov.shift,
                'rejection_reason': mov.rejection_reason,
                'notes': mov.notes
            } for mov in movements],
            'job_cost_entries': [{
                'id': jc.id,
                'job_cost_no': jc.job_cost_no,
                'cost_type': jc.cost_type,
                'cost_category': jc.cost_category,
                'description': jc.description,
                'quantity': float(jc.quantity),
                'unit_cost': float(jc.unit_cost),
                'total_cost': float(jc.total_cost),
                'production_stage': jc.production_stage,
                'cost_date': jc.cost_date.isoformat(),
                'shift': jc.shift,
                'status': jc.status
            } for jc in job_costs]
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify(error_response(str(e))), 500

@wip_job_costing_bp.route('/wip-batches', methods=['POST'])
@jwt_required()
def create_wip_batch():
    """Create WIP batch manually from work order"""
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        work_order_id = data.get('work_order_id')
        if not work_order_id:
            return jsonify({'message': 'Work order ID is required'}), 400
        
        # Check if WIP batch already exists for this work order
        existing_wip = WIPBatch.query.filter_by(work_order_id=work_order_id).first()
        if existing_wip:
            return jsonify({'message': 'WIP batch sudah ada untuk Work Order ini'}), 400
        
        # Get work order
        work_order = WorkOrder.query.get(work_order_id)
        if not work_order:
            return jsonify({'message': 'Work Order tidak ditemukan'}), 404
        
        # Create WIP batch
        wip_batch = WIPBatch(
            wip_batch_no=f"WIP-{work_order.wo_number}",
            work_order_id=work_order_id,
            product_id=work_order.product_id,
            current_stage=data.get('current_stage', 'ready_to_start'),
            machine_id=work_order.machine_id,
            qty_started=float(work_order.quantity),
            qty_in_process=float(work_order.quantity),
            shift=data.get('shift', 'shift_1'),
            status='open',
            created_by=user_id
        )
        
        db.session.add(wip_batch)
        db.session.commit()
        
        return jsonify({
            'message': 'WIP Batch berhasil dibuat',
            'wip_batch_id': wip_batch.id,
            'wip_batch_no': wip_batch.wip_batch_no
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@wip_job_costing_bp.route('/wip-batches/create-from-work-order', methods=['POST'])
@jwt_required()
def create_wip_batch_from_work_order():
    """Create WIP batch from work order"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        work_order_id = data.get('work_order_id')
        if not work_order_id:
            return jsonify(error_response('Work order ID is required')), 400
        
        # Check if WIP batch already exists for this work order
        existing_wip = WIPBatch.query.filter_by(work_order_id=work_order_id).first()
        if existing_wip:
            return jsonify(error_response('WIP batch already exists for this work order')), 400
        
        wip_batch = WIPWorkflowIntegration.create_wip_batch_from_work_order(work_order_id, user_id)
        
        if not wip_batch:
            return jsonify(error_response('Failed to create WIP batch')), 500
        
        db.session.commit()
        
        return jsonify({
            'message': 'WIP batch created successfully',
            'wip_batch_id': wip_batch.id,
            'wip_batch_no': wip_batch.wip_batch_no
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify(error_response(str(e))), 500

# ===============================
# WIP STAGE MOVEMENTS
# ===============================

@wip_job_costing_bp.route('/wip-batches/<int:wip_batch_id>/move-stage', methods=['POST'])
@jwt_required()
def move_wip_to_stage(wip_batch_id):
    """Move WIP batch to next production stage"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        to_stage = data.get('to_stage')
        qty_moved = data.get('qty_moved')
        machine_id = data.get('machine_id')
        operator_id = data.get('operator_id')
        
        if not to_stage or not qty_moved:
            return jsonify(error_response('Stage and quantity are required')), 400
        
        movement = WIPWorkflowIntegration.move_wip_to_stage(
            wip_batch_id, to_stage, qty_moved, machine_id, operator_id, user_id
        )
        
        if not movement:
            return jsonify(error_response('Failed to move WIP to stage')), 500
        
        db.session.commit()
        
        return jsonify({
            'message': 'WIP moved to stage successfully',
            'movement_id': movement.id,
            'from_stage': movement.from_stage,
            'to_stage': movement.to_stage
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify(error_response(str(e))), 500

@wip_job_costing_bp.route('/wip-batches/<int:wip_batch_id>/complete-stage', methods=['POST'])
@jwt_required()
def complete_wip_stage(wip_batch_id):
    """Complete current WIP stage with results"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        qty_good = data.get('qty_good', 0)
        qty_rejected = data.get('qty_rejected', 0)
        processing_time = data.get('processing_time_minutes', 0)
        stage_cost = data.get('stage_cost', 0)
        rejection_reason = data.get('rejection_reason')
        notes = data.get('notes')
        
        wip_batch = WIPWorkflowIntegration.complete_wip_stage(
            wip_batch_id, qty_good, qty_rejected, processing_time, stage_cost, user_id
        )
        
        if not wip_batch:
            return jsonify(error_response('Failed to complete WIP stage')), 500
        
        db.session.commit()
        
        return jsonify({
            'message': 'WIP stage completed successfully',
            'wip_batch_id': wip_batch.id,
            'status': wip_batch.status,
            'completion_percentage': wip_batch.completion_percentage,
            'total_wip_value': float(wip_batch.total_wip_value)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify(error_response(str(e))), 500

# ===============================
# JOB COSTING
# ===============================

@wip_job_costing_bp.route('/job-costs', methods=['GET'])
@jwt_required()
def get_job_costs():
    """Get job cost entries with filtering"""
    try:
        # Query parameters
        wip_batch_id = request.args.get('wip_batch_id')
        work_order_id = request.args.get('work_order_id')
        cost_type = request.args.get('cost_type')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        query = db.session.query(JobCostEntry).join(WIPBatch).join(WorkOrder)
        
        # Apply filters
        if wip_batch_id:
            query = query.filter(JobCostEntry.wip_batch_id == wip_batch_id)
        if work_order_id:
            query = query.filter(JobCostEntry.work_order_id == work_order_id)
        if cost_type:
            query = query.filter(JobCostEntry.cost_type == cost_type)
        if date_from:
            query = query.filter(JobCostEntry.cost_date >= datetime.strptime(date_from, '%Y-%m-%d'))
        if date_to:
            query = query.filter(JobCostEntry.cost_date <= datetime.strptime(date_to, '%Y-%m-%d'))
        
        job_costs = query.order_by(JobCostEntry.cost_date.desc()).all()
        
        result = []
        for jc in job_costs:
            result.append({
                'id': jc.id,
                'job_cost_no': jc.job_cost_no,
                'wip_batch_no': jc.wip_batch.wip_batch_no,
                'work_order_no': jc.work_order.wo_number,
                'cost_type': jc.cost_type,
                'cost_category': jc.cost_category,
                'description': jc.description,
                'quantity': float(jc.quantity),
                'unit_cost': float(jc.unit_cost),
                'total_cost': float(jc.total_cost),
                'production_stage': jc.production_stage,
                'cost_date': jc.cost_date.isoformat(),
                'shift': jc.shift,
                'status': jc.status
            })
        
        # Calculate summary by cost type
        cost_summary = {}
        for jc in job_costs:
            if jc.cost_type not in cost_summary:
                cost_summary[jc.cost_type] = 0
            cost_summary[jc.cost_type] += jc.total_cost
        
        return jsonify({
            'job_costs': result,
            'total': len(result),
            'cost_summary': cost_summary
        }), 200
        
    except Exception as e:
        return jsonify(error_response(str(e))), 500

@wip_job_costing_bp.route('/job-costs', methods=['POST'])
@jwt_required()
def create_job_cost_entry():
    """Create manual job cost entry"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        job_cost = JobCostEntry(
            job_cost_no=generate_number('JC', JobCostEntry, 'job_cost_no'),
            wip_batch_id=data.get('wip_batch_id'),
            work_order_id=data.get('work_order_id'),
            cost_type=data.get('cost_type'),
            cost_category=data.get('cost_category'),
            description=data.get('description'),
            quantity=data.get('quantity', 1),
            unit_cost=data.get('unit_cost', 0),
            production_stage=data.get('production_stage'),
            shift=data.get('shift'),
            created_by=user_id
        )
        
        job_cost.calculate_total_cost()
        
        db.session.add(job_cost)
        db.session.commit()
        
        return jsonify({
            'message': 'Job cost entry created successfully',
            'job_cost_id': job_cost.id,
            'job_cost_no': job_cost.job_cost_no,
            'total_cost': float(job_cost.total_cost)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify(error_response(str(e))), 500

# ===============================
# WIP DASHBOARD & ANALYTICS
# ===============================

@wip_job_costing_bp.route('/wip-dashboard', methods=['GET'])
@jwt_required()
def get_wip_dashboard():
    """Get WIP dashboard data for monitoring"""
    try:
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Convert string dates to datetime
        date_from_dt = datetime.strptime(date_from, '%Y-%m-%d') if date_from else None
        date_to_dt = datetime.strptime(date_to, '%Y-%m-%d') if date_to else None
        
        dashboard_data = WIPWorkflowIntegration.get_wip_dashboard_data(date_from_dt, date_to_dt)
        
        # Additional analytics
        today = get_local_today()
        
        # WIP Trend (last 7 days)
        wip_trend = []
        for i in range(7):
            trend_date = today - timedelta(days=i)
            daily_wip = db.session.query(func.sum(WIPBatch.total_wip_value)).filter(
                and_(
                    WIPBatch.created_at >= trend_date,
                    WIPBatch.created_at < trend_date + timedelta(days=1),
                    WIPBatch.status != 'completed'
                )
            ).scalar() or 0
            
            wip_trend.append({
                'date': trend_date.isoformat(),
                'wip_value': float(daily_wip)
            })
        
        # Stage Performance
        stage_performance = db.session.query(
            WIPStageMovement.to_stage,
            func.avg(WIPStageMovement.processing_time_minutes).label('avg_time'),
            func.sum(WIPStageMovement.qty_good).label('total_good'),
            func.sum(WIPStageMovement.qty_rejected).label('total_rejected')
        ).group_by(WIPStageMovement.to_stage).all()
        
        stage_perf_data = []
        for stage, avg_time, total_good, total_rejected in stage_performance:
            total_processed = (total_good or 0) + (total_rejected or 0)
            rejection_rate = (total_rejected / total_processed * 100) if total_processed > 0 else 0
            
            stage_perf_data.append({
                'stage': stage,
                'avg_processing_time': float(avg_time or 0),
                'total_good': float(total_good or 0),
                'total_rejected': float(total_rejected or 0),
                'rejection_rate': rejection_rate
            })
        
        # Cost Breakdown
        cost_breakdown = db.session.query(
            JobCostEntry.cost_type,
            func.sum(JobCostEntry.total_cost).label('total_cost')
        ).filter(JobCostEntry.status == 'active').group_by(JobCostEntry.cost_type).all()
        
        cost_data = {cost_type: float(total_cost) for cost_type, total_cost in cost_breakdown}
        
        result = {
            'summary': {
                'total_wip_value': dashboard_data['total_wip_value'],
                'total_batches': dashboard_data['total_batches'],
                'active_batches': dashboard_data['active_batches'],
                'completed_batches': dashboard_data['completed_batches']
            },
            'stage_distribution': dashboard_data['stage_distribution'],
            'wip_trend': wip_trend,
            'stage_performance': stage_perf_data,
            'cost_breakdown': cost_data
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify(error_response(str(e))), 500

@wip_job_costing_bp.route('/wip-analytics/bottleneck', methods=['GET'])
@jwt_required()
def get_bottleneck_analysis():
    """Analyze production bottlenecks based on WIP accumulation"""
    try:
        # Find stages with high WIP accumulation
        stage_wip = db.session.query(
            WIPBatch.current_stage,
            func.count(WIPBatch.id).label('batch_count'),
            func.sum(WIPBatch.total_wip_value).label('total_value'),
            func.avg(WIPBatch.qty_in_process).label('avg_qty')
        ).filter(WIPBatch.status.in_(['open', 'in_progress'])).group_by(WIPBatch.current_stage).all()
        
        bottlenecks = []
        for stage, count, value, avg_qty in stage_wip:
            # Consider a stage as bottleneck if it has more than 3 batches or high value
            is_bottleneck = count > 3 or (value or 0) > 1000000  # IDR 1M
            
            bottlenecks.append({
                'stage': stage,
                'batch_count': count,
                'total_wip_value': float(value or 0),
                'avg_qty_in_process': float(avg_qty or 0),
                'is_bottleneck': is_bottleneck,
                'severity': 'high' if count > 5 else 'medium' if count > 3 else 'low'
            })
        
        # Sort by severity
        bottlenecks.sort(key=lambda x: x['batch_count'], reverse=True)
        
        return jsonify({
            'bottleneck_analysis': bottlenecks,
            'total_bottlenecks': len([b for b in bottlenecks if b['is_bottleneck']])
        }), 200
        
    except Exception as e:
        return jsonify(error_response(str(e))), 500

# ===============================
# HELPER ENDPOINTS
# ===============================

@wip_job_costing_bp.route('/production-stages', methods=['GET'])
@jwt_required()
def get_production_stages():
    """Get available production stages"""
    stages = [
        {'value': 'ready_to_start', 'label': 'Ready to Start'},
        {'value': 'cutting', 'label': 'Cutting'},
        {'value': 'filling', 'label': 'Filling'},
        {'value': 'sealing', 'label': 'Sealing'},
        {'value': 'packing', 'label': 'Packing'},
        {'value': 'quality_check', 'label': 'Quality Check'},
        {'value': 'finished', 'label': 'Finished'}
    ]
    
    return jsonify({'stages': stages}), 200

@wip_job_costing_bp.route('/cost-categories', methods=['GET'])
@jwt_required()
def get_cost_categories():
    """Get available cost categories"""
    categories = {
        'material': [
            {'value': 'raw_material', 'label': 'Raw Material'},
            {'value': 'packaging_material', 'label': 'Packaging Material'},
            {'value': 'consumables', 'label': 'Consumables'}
        ],
        'labor': [
            {'value': 'direct_labor', 'label': 'Direct Labor'},
            {'value': 'indirect_labor', 'label': 'Indirect Labor'},
            {'value': 'overtime', 'label': 'Overtime'}
        ],
        'overhead': [
            {'value': 'machine_overhead', 'label': 'Machine Overhead'},
            {'value': 'facility_overhead', 'label': 'Facility Overhead'},
            {'value': 'utilities', 'label': 'Utilities'},
            {'value': 'maintenance', 'label': 'Maintenance'}
        ]
    }
    
    return jsonify({'cost_categories': categories}), 200
