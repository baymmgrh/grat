from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, MaintenanceSchedule, MaintenanceRecord, MaintenanceTask, EquipmentHistory
from models.production import Machine
from models.hr import Employee
from utils.i18n import success_response, error_response, get_message
from utils import generate_number
from datetime import datetime
from sqlalchemy import func, desc

maintenance_extended_bp = Blueprint('maintenance_extended', __name__)

# Work Order Management Endpoints
@maintenance_extended_bp.route('/work-orders', methods=['GET'])
@jwt_required()
def get_work_orders():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        status = request.args.get('status', '')
        
        query = MaintenanceRecord.query
        if status:
            query = query.filter(MaintenanceRecord.status == status)
        
        work_orders = query.order_by(desc(MaintenanceRecord.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'work_orders': [{
                'id': wo.id,
                'work_order_number': wo.maintenance_number,
                'title': wo.description[:50] + '...' if len(wo.description) > 50 else wo.description,
                'machine_name': wo.machine.name if wo.machine else 'N/A',
                'priority': wo.priority,
                'status': wo.status,
                'assigned_to': wo.assigned_technician.full_name if wo.assigned_technician else 'Unassigned',
                'scheduled_date': wo.scheduled_date.isoformat() if wo.scheduled_date else None,
                'created_at': wo.created_at.isoformat(),
                'estimated_hours': wo.estimated_completion_time,
                'actual_hours': wo.actual_completion_time
            } for wo in work_orders.items],
            'total': work_orders.total,
            'pages': work_orders.pages,
            'current_page': work_orders.page
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@maintenance_extended_bp.route('/work-orders', methods=['POST'])
@jwt_required()
def create_work_order():
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())
        
        work_order_number = generate_number('WO', MaintenanceRecord, 'maintenance_number')
        
        work_order = MaintenanceRecord(
            maintenance_number=work_order_number,
            machine_id=data['machine_id'],
            maintenance_type=data['maintenance_type'],
            priority=data['priority'],
            description=data['description'],
            scheduled_date=datetime.fromisoformat(data['scheduled_date']) if data.get('scheduled_date') else None,
            assigned_technician_id=data.get('assigned_technician_id'),
            estimated_completion_time=data.get('estimated_hours', 0),
            status='pending',
            requested_by=user_id
        )
        
        db.session.add(work_order)
        db.session.commit()
        
        return jsonify({
            'message': 'Work order created successfully',
            'work_order_id': work_order.id,
            'work_order_number': work_order_number
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@maintenance_extended_bp.route('/work-orders/<int:work_order_id>', methods=['GET'])
@jwt_required()
def get_work_order(work_order_id):
    try:
        work_order = MaintenanceRecord.query.get_or_404(work_order_id)
        
        return jsonify({
            'work_order': {
                'id': work_order.id,
                'work_order_number': work_order.maintenance_number,
                'machine_id': work_order.machine_id,
                'machine_name': work_order.machine.name if work_order.machine else 'N/A',
                'maintenance_type': work_order.maintenance_type,
                'priority': work_order.priority,
                'status': work_order.status,
                'description': work_order.description,
                'scheduled_date': work_order.scheduled_date.isoformat() if work_order.scheduled_date else None,
                'completion_date': work_order.completion_date.isoformat() if work_order.completion_date else None,
                'assigned_technician_id': work_order.assigned_technician_id,
                'assigned_technician': work_order.assigned_technician.full_name if work_order.assigned_technician else None,
                'estimated_hours': work_order.estimated_completion_time,
                'actual_hours': work_order.actual_completion_time,
                'cost': work_order.cost,
                'notes': work_order.notes,
                'created_at': work_order.created_at.isoformat()
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@maintenance_extended_bp.route('/work-orders/<int:work_order_id>', methods=['PUT'])
@jwt_required()
def update_work_order(work_order_id):
    try:
        work_order = MaintenanceRecord.query.get_or_404(work_order_id)
        data = request.get_json()
        
        # Update fields
        if 'machine_id' in data:
            work_order.machine_id = data['machine_id']
        if 'maintenance_type' in data:
            work_order.maintenance_type = data['maintenance_type']
        if 'priority' in data:
            work_order.priority = data['priority']
        if 'description' in data:
            work_order.description = data['description']
        if 'scheduled_date' in data:
            work_order.scheduled_date = datetime.fromisoformat(data['scheduled_date']) if data['scheduled_date'] else None
        if 'assigned_technician_id' in data:
            work_order.assigned_technician_id = data['assigned_technician_id']
        if 'estimated_hours' in data:
            work_order.estimated_completion_time = data['estimated_hours']
        if 'actual_hours' in data:
            work_order.actual_completion_time = data['actual_hours']
        if 'cost' in data:
            work_order.cost = data['cost']
        if 'notes' in data:
            work_order.notes = data['notes']
        if 'status' in data:
            work_order.status = data['status']
            if data['status'] == 'completed':
                work_order.completion_date = datetime.utcnow()
        
        db.session.commit()
        return jsonify({'message': 'Work order updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Parts Request Management Endpoints
@maintenance_extended_bp.route('/parts-requests', methods=['GET'])
@jwt_required()
def get_parts_requests():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        # Mock data for now - will be replaced with actual model
        parts_requests = []
        
        return jsonify({
            'parts_requests': parts_requests,
            'total': 0,
            'pages': 0,
            'current_page': 1
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@maintenance_extended_bp.route('/parts-requests', methods=['POST'])
@jwt_required()
def create_parts_request():
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())
        
        # Mock response for now - will be replaced with actual implementation
        request_number = generate_number('PR', MaintenanceRecord, 'maintenance_number')
        
        return jsonify({
            'message': 'Parts request created successfully',
            'request_id': 1,
            'request_number': request_number
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@maintenance_extended_bp.route('/parts-requests/<int:request_id>', methods=['GET'])
@jwt_required()
def get_parts_request(request_id):
    try:
        # Mock response for now
        return jsonify({
            'parts_request': {
                'id': request_id,
                'request_number': f'PR-{request_id:06d}',
                'machine_id': 1,
                'requested_by': 1,
                'request_date': datetime.utcnow().isoformat(),
                'urgency': 'medium',
                'work_order_id': None,
                'parts': [],
                'justification': '',
                'notes': '',
                'status': 'pending'
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@maintenance_extended_bp.route('/parts-requests/<int:request_id>', methods=['PUT'])
@jwt_required()
def update_parts_request(request_id):
    try:
        data = request.get_json()
        
        # Mock response for now
        return jsonify({'message': 'Parts request updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Analytics Endpoints
@maintenance_extended_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_maintenance_analytics():
    try:
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        machine_id = request.args.get('machine_id')
        maintenance_type = request.args.get('maintenance_type')
        report_type = request.args.get('report_type', 'overview')
        
        # Base query
        query = MaintenanceRecord.query
        
        if date_from:
            query = query.filter(MaintenanceRecord.created_at >= datetime.fromisoformat(date_from))
        if date_to:
            query = query.filter(MaintenanceRecord.created_at <= datetime.fromisoformat(date_to))
        if machine_id:
            query = query.filter(MaintenanceRecord.machine_id == machine_id)
        if maintenance_type:
            query = query.filter(MaintenanceRecord.maintenance_type == maintenance_type)
        
        records = query.all()
        
        # Calculate summary metrics
        total_work_orders = len(records)
        completed_work_orders = len([r for r in records if r.status == 'completed'])
        pending_work_orders = len([r for r in records if r.status == 'pending'])
        total_cost = sum([r.cost or 0 for r in records])
        
        # Calculate MTTR (Mean Time To Repair)
        completed_records = [r for r in records if r.status == 'completed' and r.actual_completion_time]
        mttr = sum([r.actual_completion_time for r in completed_records]) / len(completed_records) if completed_records else 0
        
        # Mock additional data
        availability_rate = 85.5
        mtbf = 168.0  # Mean Time Between Failures
        
        # Generate chart data
        maintenance_by_type = [
            {'name': 'Preventive', 'value': len([r for r in records if r.maintenance_type == 'preventive']), 'color': '#3B82F6'},
            {'name': 'Corrective', 'value': len([r for r in records if r.maintenance_type == 'corrective']), 'color': '#10B981'},
            {'name': 'Emergency', 'value': len([r for r in records if r.maintenance_type == 'emergency']), 'color': '#EF4444'},
        ]
        
        # Monthly trends (mock data)
        monthly_trends = [
            {'month': 'Jan', 'work_orders': 12, 'cost': 15000000, 'mttr': 4.2},
            {'month': 'Feb', 'work_orders': 15, 'cost': 18500000, 'mttr': 3.8},
            {'month': 'Mar', 'work_orders': 10, 'cost': 12000000, 'mttr': 4.5},
            {'month': 'Apr', 'work_orders': 18, 'cost': 22000000, 'mttr': 3.9},
            {'month': 'May', 'work_orders': 14, 'cost': 16800000, 'mttr': 4.1},
            {'month': 'Jun', 'work_orders': 16, 'cost': 19200000, 'mttr': 3.7}
        ]
        
        machine_performance = []
        cost_breakdown = [
            {'category': 'Labor', 'amount': total_cost * 0.4, 'percentage': 40},
            {'category': 'Parts', 'amount': total_cost * 0.35, 'percentage': 35},
            {'category': 'Tools', 'amount': total_cost * 0.15, 'percentage': 15},
            {'category': 'External Services', 'amount': total_cost * 0.1, 'percentage': 10}
        ]
        
        downtime_analysis = [
            {'reason': 'Equipment Failure', 'hours': 24.5, 'frequency': 8},
            {'reason': 'Scheduled Maintenance', 'hours': 16.0, 'frequency': 12},
            {'reason': 'Parts Shortage', 'hours': 8.5, 'frequency': 5},
            {'reason': 'Operator Error', 'hours': 4.2, 'frequency': 3}
        ]
        
        return jsonify({
            'summary': {
                'total_work_orders': total_work_orders,
                'completed_work_orders': completed_work_orders,
                'pending_work_orders': pending_work_orders,
                'total_cost': total_cost,
                'average_completion_time': mttr,
                'mttr': mttr,
                'mtbf': mtbf,
                'availability_rate': availability_rate
            },
            'charts': {
                'maintenance_by_type': maintenance_by_type,
                'monthly_trends': monthly_trends,
                'machine_performance': machine_performance,
                'cost_breakdown': cost_breakdown,
                'downtime_analysis': downtime_analysis
            },
            'kpis': {
                'preventive_ratio': (len([r for r in records if r.maintenance_type == 'preventive']) / total_work_orders * 100) if total_work_orders > 0 else 0,
                'emergency_ratio': (len([r for r in records if r.maintenance_type == 'emergency']) / total_work_orders * 100) if total_work_orders > 0 else 0,
                'cost_per_hour': total_cost / sum([r.actual_completion_time or 0 for r in records]) if sum([r.actual_completion_time or 0 for r in records]) > 0 else 0,
                'parts_cost_ratio': 35.0,
                'labor_cost_ratio': 40.0,
                'schedule_compliance': 92.5
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@maintenance_extended_bp.route('/analytics/export', methods=['GET'])
@jwt_required()
def export_maintenance_analytics():
    try:
        format_type = request.args.get('format', 'excel')
        
        # Mock response - actual implementation would generate file
        return jsonify({
            'message': f'Analytics export in {format_type} format would be generated here',
            'download_url': f'/downloads/maintenance_analytics.{format_type}'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
