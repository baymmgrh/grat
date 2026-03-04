from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, WorkOrder, ShippingOrder, Machine, ProductionRecord, EmployeeRoster, Employee
from utils.i18n import success_response, error_response, get_message
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from utils.timezone import get_local_now, get_local_today

tv_display_bp = Blueprint('tv_display', __name__)

@tv_display_bp.route('/fullscreen', methods=['GET'])
def get_fullscreen_display():
    """Fullscreen TV Display combining all views"""
    try:
        display_type = request.args.get('type', 'overview')  # overview, production, shipping, roster

        if display_type == 'production':
            return get_production_display()
        elif display_type == 'shipping':
            return get_shipping_display()
        elif display_type == 'roster':
            return get_roster_display()
        else:
            return get_overview_display()
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tv_display_bp.route('/roster', methods=['GET'])
def get_roster_display():
    """TV Display for Machine Roster Assignment"""
    try:
        # Get today's date
        today = get_local_now().date()

        # Get all active machines
        machines = Machine.query.filter_by(is_active=True).all()

        # Get all shifts for today
        from models import ShiftSchedule
        shifts = ShiftSchedule.query.all()

        # Get today's roster assignments
        today_rosters = EmployeeRoster.query.filter(
            EmployeeRoster.roster_date == today,
            EmployeeRoster.is_off_day == False
        ).all()

        # Structure roster data by machine and shift
        roster_display = {
            'date': today.isoformat(),
            'machines': {}
        }

        for machine in machines:
            roster_display['machines'][machine.id] = {
                'machine_id': machine.id,
                'machine_code': machine.code,
                'machine_name': machine.name,
                'machine_type': machine.machine_type,
                'status': machine.status,
                'shifts': {}
            }

            for shift in shifts:
                roster_display['machines'][machine.id]['shifts'][shift.id] = {
                    'shift_id': shift.id,
                    'shift_name': shift.name,
                    'start_time': shift.start_time,
                    'end_time': shift.end_time,
                    'assigned_employees': []
                }

        # Assign employees to machines and shifts
        for roster in today_rosters:
            if roster.machine_id and roster.shift_id:
                machine_id = roster.machine_id
                shift_id = roster.shift_id

                if machine_id in roster_display['machines'] and shift_id in roster_display['machines'][machine_id]['shifts']:
                    roster_display['machines'][machine_id]['shifts'][shift_id]['assigned_employees'].append({
                        'employee_id': roster.employee_id,
                        'employee_name': roster.employee.full_name,
                        'employee_number': roster.employee.employee_number,
                        'department': roster.employee.department.name if roster.employee.department else None
                    })

        return jsonify({
            'type': 'roster',
            'timestamp': get_local_now().isoformat(),
            'date': today.isoformat(),
            'roster_data': roster_display,
            'summary': {
                'total_machines': len(machines),
                'total_assignments': len(today_rosters),
                'machines_with_assignments': len([m for m in machines if any(
                    len(shift['assigned_employees']) > 0
                    for shift in roster_display['machines'][m.id]['shifts'].values()
                )])
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_overview_display():
    """Combined overview display for TV"""
    try:
        # Production data
        active_wos = WorkOrder.query.filter_by(status='in_progress').all()
        machines = Machine.query.filter_by(is_active=True).all()
        today = get_local_now().date()
        today_production = db.session.query(
            func.sum(ProductionRecord.quantity_produced)
        ).filter(
            func.date(ProductionRecord.production_date) == today
        ).scalar() or 0

        # Shipping data
        active_shipments = ShippingOrder.query.filter(
            ShippingOrder.status.in_(['preparing', 'packed', 'shipped', 'in_transit'])
        ).order_by(ShippingOrder.shipping_date).limit(5).all()

        # Roster data (today's assignments)
        today_rosters = EmployeeRoster.query.filter(
            EmployeeRoster.roster_date == today,
            EmployeeRoster.is_off_day == False
        ).all()

        # Calculate summary stats
        total_assignments = len(today_rosters)
        machines_with_operators = len(set([r.machine_id for r in today_rosters if r.machine_id]))

        return jsonify({
            'type': 'overview',
            'timestamp': get_local_now().isoformat(),
            'production': {
                'active_work_orders': len(active_wos),
                'active_machines': len([m for m in machines if m.status == 'running']),
                'today_production': float(today_production),
                'efficiency_avg': sum([float(m.efficiency) for m in machines]) / len(machines) if machines else 0
            },
            'shipping': {
                'active_shipments': len(active_shipments),
                'preparing_count': len([s for s in active_shipments if s.status == 'preparing']),
                'shipped_count': len([s for s in active_shipments if s.status == 'shipped'])
            },
            'roster': {
                'total_assignments': total_assignments,
                'machines_with_operators': machines_with_operators,
                'unassigned_machines': len(machines) - machines_with_operators
            },
            'top_active_shipments': [{
                'shipping_number': s.shipping_number,
                'customer_name': s.customer.company_name,
                'status': s.status,
                'shipping_date': s.shipping_date.isoformat()
            } for s in active_shipments[:3]]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tv_display_bp.route('/production', methods=['GET'])
def get_production_display():
    """TV Display for Production Floor"""
    try:
        # Active work orders
        active_wos = WorkOrder.query.filter_by(status='in_progress').all()

        # Machine status
        machines = Machine.query.filter_by(is_active=True).all()

        # Today's production
        today = get_local_now().date()
        today_production = db.session.query(
            func.sum(ProductionRecord.quantity_produced)
        ).filter(
            func.date(ProductionRecord.production_date) == today
        ).scalar() or 0

        return jsonify({
            'type': 'production',
            'timestamp': get_local_now().isoformat(),
            'active_work_orders': [{
                'wo_number': wo.wo_number,
                'product_name': wo.product.name,
                'quantity': float(wo.quantity),
                'quantity_produced': float(wo.quantity_produced),
                'progress': (float(wo.quantity_produced) / float(wo.quantity) * 100) if wo.quantity > 0 else 0,
                'machine': wo.machine.name if wo.machine else None,
                'status': wo.status
            } for wo in active_wos],
            'machines': [{
                'code': m.code,
                'name': m.name,
                'status': m.status,
                'efficiency': float(m.efficiency)
            } for m in machines],
            'today_production': float(today_production)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tv_display_bp.route('/shipping', methods=['GET'])
def get_shipping_display():
    """TV Display for Shipping Department"""
    try:
        # Active shipments
        active_shipments = ShippingOrder.query.filter(
            ShippingOrder.status.in_(['preparing', 'packed', 'shipped', 'in_transit'])
        ).order_by(ShippingOrder.shipping_date).all()

        # Today's shipments
        today = get_local_now().date()
        today_shipments = ShippingOrder.query.filter(
            func.date(ShippingOrder.shipping_date) == today
        ).all()

        return jsonify({
            'type': 'shipping',
            'timestamp': get_local_now().isoformat(),
            'active_shipments': [{
                'shipping_number': s.shipping_number,
                'customer_name': s.customer.company_name,
                'shipping_date': s.shipping_date.isoformat(),
                'expected_delivery': s.expected_delivery_date.isoformat() if s.expected_delivery_date else None,
                'status': s.status,
                'tracking_number': s.tracking_number,
                'driver_name': s.driver_name
            } for s in active_shipments],
            'today_shipments_count': len(today_shipments),
            'preparing_count': len([s for s in active_shipments if s.status == 'preparing']),
            'shipped_count': len([s for s in active_shipments if s.status == 'shipped'])
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
