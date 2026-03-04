from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, SalesOrder, WorkOrder, Inventory, Machine, Product, User, Customer, Supplier, PurchaseOrder
from utils.i18n import success_response, error_response, get_message
from models.oee import OEERecord, OEEAlert
from models.quality import QualityInspection
from models.maintenance import MaintenanceRecord, MaintenanceSchedule
from models.finance import Invoice, Payment
from models.hr import Employee, EmployeeRoster
from models.returns import CustomerReturn
from models.waste import WasteRecord
from models.rd import ResearchProject
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta, date
import json
from utils.timezone import get_local_now, get_local_today

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_overview():
    try:
        # Sales metrics - simplified
        today = get_local_now().date()
        month_start = today.replace(day=1)
        
        try:
            sales_today = db.session.query(func.sum(SalesOrder.total_amount)).filter(
                func.date(SalesOrder.order_date) == today
            ).scalar() or 0
        except:
            sales_today = 0
        
        try:
            sales_this_month = db.session.query(func.sum(SalesOrder.total_amount)).filter(
                SalesOrder.order_date >= month_start
            ).scalar() or 0
        except:
            sales_this_month = 0
        
        # Production metrics - simplified
        try:
            active_work_orders = WorkOrder.query.filter_by(status='in_progress').count()
        except:
            active_work_orders = 0
            
        try:
            completed_today = WorkOrder.query.filter(
                func.date(WorkOrder.actual_end_date) == today,
                WorkOrder.status == 'completed'
            ).count()
        except:
            completed_today = 0
        
        # Inventory metrics - simplified to avoid complex joins
        try:
            total_products = Product.query.count()
            total_inventory = Inventory.query.count()
            low_stock_items = 0  # Simplified for now
        except:
            total_products = 0
            total_inventory = 0
            low_stock_items = 0
        
        # Machine status - simplified
        try:
            machines_running = Machine.query.filter_by(status='running').count()
            machines_idle = Machine.query.filter_by(status='idle').count()
            machines_maintenance = Machine.query.filter_by(status='maintenance').count()
        except:
            machines_running = 0
            machines_idle = 0
            machines_maintenance = 0
        
        return jsonify({
            'sales': {
                'today': float(sales_today),
                'this_month': float(sales_this_month)
            },
            'production': {
                'active_work_orders': active_work_orders,
                'completed_today': completed_today
            },
            'inventory': {
                'low_stock_items': low_stock_items,
                'total_products': total_products,
                'total_inventory': total_inventory
            },
            'machines': {
                'running': machines_running,
                'idle': machines_idle,
                'maintenance': machines_maintenance
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/charts/sales', methods=['GET'])
@jwt_required()
def get_sales_chart():
    try:
        days = request.args.get('days', 30, type=int)
        start_date = get_local_now() - timedelta(days=days)
        
        results = db.session.query(
            func.date(SalesOrder.order_date).label('date'),
            func.sum(SalesOrder.total_amount).label('total')
        ).filter(
            SalesOrder.order_date >= start_date
        ).group_by(func.date(SalesOrder.order_date)).all()
        
        return jsonify({
            'data': [{
                'date': r.date.isoformat(),
                'total': float(r.total)
            } for r in results]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/charts/production', methods=['GET'])
@jwt_required()
def get_production_chart():
    try:
        days = request.args.get('days', 30, type=int)
        start_date = get_local_now() - timedelta(days=days)
        
        results = db.session.query(
            func.date(WorkOrder.actual_end_date).label('date'),
            func.sum(WorkOrder.quantity_produced).label('quantity')
        ).filter(
            WorkOrder.actual_end_date >= start_date,
            WorkOrder.status == 'completed'
        ).group_by(func.date(WorkOrder.actual_end_date)).all()
        
        return jsonify({
            'data': [{
                'date': r.date.isoformat(),
                'quantity': float(r.quantity)
            } for r in results]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/executive', methods=['GET'])
@jwt_required()
def get_executive_dashboard():
    """Comprehensive executive dashboard with all modules KPIs"""
    try:
        from models.production import ShiftProduction
        
        # Date ranges
        today = get_local_today()
        week_start = today - timedelta(days=7)
        month_start = today.replace(day=1)
        
        # Basic metrics that we know work
        sales_today = db.session.query(func.coalesce(func.sum(SalesOrder.total_amount), 0)).filter(
            func.date(SalesOrder.order_date) == today
        ).scalar() or 0
        
        sales_this_month = db.session.query(func.coalesce(func.sum(SalesOrder.total_amount), 0)).filter(
            SalesOrder.order_date >= month_start
        ).scalar() or 0
        
        # Sales orders count
        sales_orders_count = SalesOrder.query.filter(
            SalesOrder.order_date >= month_start
        ).count()
        
        active_work_orders = WorkOrder.query.filter_by(status='in_progress').count()
        completed_today = WorkOrder.query.filter(
            func.date(WorkOrder.actual_end_date) == today,
            WorkOrder.status == 'completed'
        ).count()
        
        machines_running = Machine.query.filter_by(status='running', is_active=True).count()
        total_machines = Machine.query.filter_by(is_active=True).count()
        machine_utilization = (machines_running / total_machines * 100) if total_machines > 0 else 0
        
        # OEE from ShiftProduction (more accurate)
        try:
            avg_oee = db.session.query(func.coalesce(func.avg(ShiftProduction.oee_score), 0)).filter(
                ShiftProduction.production_date >= week_start
            ).scalar() or 0
        except:
            try:
                avg_oee = db.session.query(func.coalesce(func.avg(OEERecord.oee), 0)).filter(
                    OEERecord.record_date >= week_start
                ).scalar() or 0
            except:
                avg_oee = 0
        
        # Machines with OEE below 75%
        try:
            low_oee_machines = db.session.query(func.count(func.distinct(ShiftProduction.machine_id))).filter(
                ShiftProduction.production_date >= week_start,
                ShiftProduction.oee_score < 75
            ).scalar() or 0
        except:
            low_oee_machines = 0
        
        try:
            critical_alerts = OEEAlert.query.filter(
                OEEAlert.status == 'active',
                OEEAlert.severity.in_(['high', 'critical'])
            ).count()
        except:
            critical_alerts = 0
        
        # Production output from ShiftProduction
        try:
            production_output = db.session.query(func.coalesce(func.sum(ShiftProduction.actual_quantity), 0)).filter(
                ShiftProduction.production_date >= month_start
            ).scalar() or 0
        except:
            production_output = 0
        
        # Quality pass rate from ShiftProduction
        try:
            total_produced = db.session.query(func.coalesce(func.sum(ShiftProduction.actual_quantity), 0)).filter(
                ShiftProduction.production_date >= month_start
            ).scalar() or 0
            total_good = db.session.query(func.coalesce(func.sum(ShiftProduction.good_quantity), 0)).filter(
                ShiftProduction.production_date >= month_start
            ).scalar() or 0
            quality_pass_rate = (total_good / total_produced * 100) if total_produced > 0 else 0
        except:
            quality_pass_rate = 0
        
        # Quality inspections
        try:
            inspections_today = QualityInspection.query.filter(
                func.date(QualityInspection.inspection_date) == today
            ).count()
        except:
            inspections_today = 0
        
        # Inventory
        try:
            low_stock_items = Inventory.query.filter(
                Inventory.quantity <= Inventory.min_quantity
            ).count()
        except:
            low_stock_items = 0
        
        try:
            inventory_value = db.session.query(func.coalesce(func.sum(Inventory.quantity * Inventory.unit_cost), 0)).scalar() or 0
        except:
            inventory_value = 0
        
        # Purchasing
        try:
            pending_po = PurchaseOrder.query.filter(
                PurchaseOrder.status.in_(['pending', 'approved'])
            ).count()
        except:
            pending_po = 0
        
        # HR
        try:
            total_employees = Employee.query.filter_by(status='active').count()
        except:
            total_employees = 0
        
        try:
            today_roster = EmployeeRoster.query.filter(
                EmployeeRoster.date == today
            ).count()
        except:
            today_roster = 0
        
        # Maintenance
        try:
            overdue_maintenance = MaintenanceSchedule.query.filter(
                MaintenanceSchedule.scheduled_date < today,
                MaintenanceSchedule.status.in_(['pending', 'scheduled'])
            ).count()
        except:
            overdue_maintenance = 0
        
        # Customers
        try:
            active_customers = Customer.query.filter_by(is_active=True).count()
        except:
            active_customers = 0
        
        try:
            returns_this_month = CustomerReturn.query.filter(
                CustomerReturn.return_date >= month_start
            ).count()
        except:
            returns_this_month = 0
        
        # R&D
        try:
            active_projects = ResearchProject.query.filter(
                ResearchProject.status.in_(['planning', 'in_progress', 'testing'])
            ).count()
        except:
            active_projects = 0
        
        # Waste
        try:
            waste_this_week = db.session.query(func.coalesce(func.sum(WasteRecord.quantity), 0)).filter(
                WasteRecord.record_date >= week_start
            ).scalar() or 0
        except:
            waste_this_week = 0
        
        # Revenue growth calculation
        prev_month_start = (month_start - timedelta(days=1)).replace(day=1)
        prev_month_end = month_start - timedelta(days=1)
        try:
            prev_month_sales = db.session.query(func.coalesce(func.sum(SalesOrder.total_amount), 0)).filter(
                SalesOrder.order_date >= prev_month_start,
                SalesOrder.order_date <= prev_month_end
            ).scalar() or 0
            revenue_growth = ((sales_this_month - prev_month_sales) / prev_month_sales * 100) if prev_month_sales > 0 else 0
        except:
            revenue_growth = 0
        
        # Outstanding invoices
        try:
            outstanding_invoices = db.session.query(func.coalesce(func.sum(Invoice.total_amount - Invoice.paid_amount), 0)).filter(
                Invoice.status.in_(['pending', 'partial'])
            ).scalar() or 0
        except:
            outstanding_invoices = 0
        
        # Simple trend data
        sales_trend = []
        for i in range(7):
            trend_date = today - timedelta(days=6-i)
            daily_sales = db.session.query(func.coalesce(func.sum(SalesOrder.total_amount), 0)).filter(
                func.date(SalesOrder.order_date) == trend_date
            ).scalar() or 0
            sales_trend.append({
                'date': trend_date.isoformat(),
                'value': float(daily_sales)
            })
        
        # Critical issues
        critical_issues = []
        if low_oee_machines > 0:
            critical_issues.append({
                'type': 'oee_alert',
                'message': f'{low_oee_machines} machines with OEE below 75%',
                'severity': 'high',
                'module': 'OEE'
            })
        if low_stock_items > 0:
            critical_issues.append({
                'type': 'inventory_alert',
                'message': f'{low_stock_items} items below minimum stock',
                'severity': 'medium',
                'module': 'Inventory'
            })
        if overdue_maintenance > 0:
            critical_issues.append({
                'type': 'maintenance_alert',
                'message': f'{overdue_maintenance} overdue maintenance schedules',
                'severity': 'high',
                'module': 'Maintenance'
            })
        
        return jsonify({
            'financial': {
                'sales_today': float(sales_today),
                'sales_this_month': float(sales_this_month),
                'revenue_growth': round(revenue_growth, 1),
                'outstanding_invoices': float(outstanding_invoices)
            },
            'production': {
                'active_work_orders': active_work_orders,
                'completed_today': completed_today,
                'efficiency': round(float(avg_oee), 1),
                'output': int(production_output)
            },
            'oee': {
                'average_oee': round(float(avg_oee), 1),
                'critical_alerts': low_oee_machines,
                'machine_utilization': round(machine_utilization, 1)
            },
            'quality': {
                'inspections_today': inspections_today,
                'pass_rate': round(quality_pass_rate, 1)
            },
            'inventory': {
                'low_stock_items': low_stock_items,
                'total_value': float(inventory_value)
            },
            'purchasing': {
                'pending_orders': pending_po
            },
            'hr': {
                'total_employees': total_employees,
                'today_roster': today_roster
            },
            'maintenance': {
                'overdue': overdue_maintenance
            },
            'customers': {
                'active_customers': active_customers,
                'returns_this_month': returns_this_month
            },
            'rd': {
                'active_projects': active_projects
            },
            'waste': {
                'this_week_kg': float(waste_this_week)
            },
            'trends': {
                'sales': sales_trend
            },
            'critical_issues': critical_issues,
            'summary': {
                'total_modules': 11,
                'last_updated': get_local_now().isoformat()
            },
            'sales_orders': {
                'count': sales_orders_count
            }
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
