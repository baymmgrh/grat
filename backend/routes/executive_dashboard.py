"""
Executive Dashboard Routes - Advanced Analytics
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_, extract
from models import db
from models.sales import SalesOrder, Customer
from models.production import WorkOrder, ShiftProduction
from models.product import Product, Material
from models.warehouse import Inventory
from models.quality import QualityInspection
from models.finance import Invoice, Payment
from models.hr import Employee
from models.oee import OEERecord
from models.user import User
from models.kpi_target import KPITarget
import json

executive_dashboard_bp = Blueprint('executive_dashboard', __name__)

@executive_dashboard_bp.route('/overview', methods=['GET'])
@jwt_required(optional=True)
def get_executive_overview():
    """
    Get comprehensive executive overview with all key metrics
    """
    try:
        # Get date range (default: current month)
        end_date = datetime.now().date()
        start_date = (datetime.now() - timedelta(days=30)).date()
        
        # Previous period for comparison
        prev_end_date = start_date - timedelta(days=1)
        prev_start_date = prev_end_date - timedelta(days=30)
        
        # ===== FINANCIAL METRICS =====
        # Current period revenue
        current_revenue = db.session.query(func.sum(Invoice.total_amount))\
            .filter(
                Invoice.invoice_date >= start_date,
                Invoice.invoice_date <= end_date,
                Invoice.status.in_(['paid', 'partial'])
            ).scalar() or 0
        
        # Previous period revenue
        prev_revenue = db.session.query(func.sum(Invoice.total_amount))\
            .filter(
                Invoice.invoice_date >= prev_start_date,
                Invoice.invoice_date <= prev_end_date,
                Invoice.status.in_(['paid', 'partial'])
            ).scalar() or 0
        
        revenue_growth = ((current_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
        
        # Cash collection
        cash_collected = db.session.query(func.sum(Payment.amount))\
            .filter(
                Payment.payment_date >= start_date,
                Payment.payment_date <= end_date
            ).scalar() or 0
        
        # Outstanding AR
        outstanding_ar = db.session.query(func.sum(Invoice.total_amount - Invoice.paid_amount))\
            .filter(
                Invoice.status.in_(['pending', 'partial']),
                Invoice.due_date < end_date
            ).scalar() or 0
        
        # ===== SALES METRICS =====
        # Current period orders
        current_orders = db.session.query(func.count(SalesOrder.id))\
            .filter(
                SalesOrder.order_date >= start_date,
                SalesOrder.order_date <= end_date
            ).scalar() or 0
        
        # Previous period orders
        prev_orders = db.session.query(func.count(SalesOrder.id))\
            .filter(
                SalesOrder.order_date >= prev_start_date,
                SalesOrder.order_date <= prev_end_date
            ).scalar() or 0
        
        orders_growth = ((current_orders - prev_orders) / prev_orders * 100) if prev_orders > 0 else 0
        
        # Order fulfillment rate
        total_orders = db.session.query(func.count(SalesOrder.id))\
            .filter(
                SalesOrder.order_date >= start_date,
                SalesOrder.order_date <= end_date
            ).scalar() or 0
        
        fulfilled_orders = db.session.query(func.count(SalesOrder.id))\
            .filter(
                SalesOrder.order_date >= start_date,
                SalesOrder.order_date <= end_date,
                SalesOrder.status.in_(['delivered', 'invoiced'])
            ).scalar() or 0
        
        fulfillment_rate = (fulfilled_orders / total_orders * 100) if total_orders > 0 else 0
        
        # ===== PRODUCTION METRICS =====
        # Production output
        production_output = db.session.query(func.sum(ShiftProduction.good_quantity))\
            .filter(
                ShiftProduction.production_date >= start_date,
                ShiftProduction.production_date <= end_date
            ).scalar() or 0
        
        prev_production = db.session.query(func.sum(ShiftProduction.good_quantity))\
            .filter(
                ShiftProduction.production_date >= prev_start_date,
                ShiftProduction.production_date <= prev_end_date
            ).scalar() or 0
        
        production_growth = ((production_output - prev_production) / prev_production * 100) if prev_production > 0 else 0
        
        # Average OEE
        avg_oee = db.session.query(func.avg(ShiftProduction.oee_score))\
            .filter(
                ShiftProduction.production_date >= start_date,
                ShiftProduction.production_date <= end_date,
                ShiftProduction.oee_score.isnot(None)
            ).scalar() or 0
        
        # Work orders completion rate
        total_wo = db.session.query(func.count(WorkOrder.id))\
            .filter(
                WorkOrder.created_at >= start_date,
                WorkOrder.created_at <= end_date
            ).scalar() or 0
        
        completed_wo = db.session.query(func.count(WorkOrder.id))\
            .filter(
                WorkOrder.created_at >= start_date,
                WorkOrder.created_at <= end_date,
                WorkOrder.status == 'completed'
            ).scalar() or 0
        
        wo_completion_rate = (completed_wo / total_wo * 100) if total_wo > 0 else 0
        
        # ===== QUALITY METRICS =====
        # Quality pass rate
        total_inspections = db.session.query(func.count(QualityInspection.id))\
            .filter(
                QualityInspection.inspection_date >= start_date,
                QualityInspection.inspection_date <= end_date
            ).scalar() or 0
        
        passed_inspections = db.session.query(func.count(QualityInspection.id))\
            .filter(
                QualityInspection.inspection_date >= start_date,
                QualityInspection.inspection_date <= end_date,
                QualityInspection.result == 'pass'
            ).scalar() or 0
        
        quality_pass_rate = (passed_inspections / total_inspections * 100) if total_inspections > 0 else 0
        
        # ===== INVENTORY METRICS =====
        # Total inventory value
        inventory_value = db.session.query(
            func.sum(Inventory.quantity_on_hand * Product.cost)
        ).join(Product, Inventory.product_id == Product.id)\
        .scalar() or 0
        
        # Low stock items
        low_stock_count = db.session.query(func.count(Product.id))\
            .join(Inventory, Product.id == Inventory.product_id)\
            .filter(Inventory.quantity_on_hand < Product.min_stock_level)\
            .scalar() or 0
        
        # ===== HR METRICS =====
        # Active employees
        active_employees = db.session.query(func.count(Employee.id))\
            .filter(Employee.is_active == True)\
            .scalar() or 0
        
        # Compile overview data
        overview = {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'days': (end_date - start_date).days
            },
            'financial': {
                'revenue': float(current_revenue),
                'revenue_growth': round(float(revenue_growth), 2),
                'cash_collected': float(cash_collected),
                'outstanding_ar': float(outstanding_ar),
                'collection_rate': round((cash_collected / current_revenue * 100) if current_revenue > 0 else 0, 2)
            },
            'sales': {
                'total_orders': current_orders,
                'orders_growth': round(float(orders_growth), 2),
                'fulfillment_rate': round(float(fulfillment_rate), 2),
                'avg_order_value': round(float(current_revenue / current_orders) if current_orders > 0 else 0, 2)
            },
            'production': {
                'output': float(production_output),
                'production_growth': round(float(production_growth), 2),
                'avg_oee': round(float(avg_oee), 2),
                'wo_completion_rate': round(float(wo_completion_rate), 2)
            },
            'quality': {
                'pass_rate': round(float(quality_pass_rate), 2),
                'total_inspections': total_inspections,
                'passed_inspections': passed_inspections,
                'failed_inspections': total_inspections - passed_inspections
            },
            'inventory': {
                'total_value': float(inventory_value),
                'low_stock_items': low_stock_count
            },
            'hr': {
                'active_employees': active_employees
            }
        }
        
        return jsonify({
            'success': True,
            'data': overview
        }), 200
        
    except Exception as e:
        print(f"Error in get_executive_overview: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@executive_dashboard_bp.route('/trends', methods=['GET'])
@jwt_required(optional=True)
def get_trends():
    """
    Get trend data for various metrics (last 12 months)
    """
    try:
        # Get last 12 months
        end_date = datetime.now().date()
        start_date = (datetime.now() - timedelta(days=365)).date()
        
        # Revenue trend (monthly)
        revenue_trend = db.session.query(
            extract('year', Invoice.invoice_date).label('year'),
            extract('month', Invoice.invoice_date).label('month'),
            func.sum(Invoice.total_amount).label('revenue')
        ).filter(
            Invoice.invoice_date >= start_date,
            Invoice.invoice_date <= end_date,
            Invoice.status.in_(['paid', 'partial'])
        ).group_by('year', 'month')\
        .order_by('year', 'month')\
        .all()
        
        # Production trend (monthly)
        production_trend = db.session.query(
            extract('year', ShiftProduction.production_date).label('year'),
            extract('month', ShiftProduction.production_date).label('month'),
            func.sum(ShiftProduction.good_quantity).label('output')
        ).filter(
            ShiftProduction.production_date >= start_date,
            ShiftProduction.production_date <= end_date
        ).group_by('year', 'month')\
        .order_by('year', 'month')\
        .all()
        
        # OEE trend (monthly)
        oee_trend = db.session.query(
            extract('year', ShiftProduction.production_date).label('year'),
            extract('month', ShiftProduction.production_date).label('month'),
            func.avg(ShiftProduction.oee_score).label('avg_oee')
        ).filter(
            ShiftProduction.production_date >= start_date,
            ShiftProduction.production_date <= end_date,
            ShiftProduction.oee_score.isnot(None)
        ).group_by('year', 'month')\
        .order_by('year', 'month')\
        .all()
        
        # Quality trend (monthly)
        quality_trend = db.session.query(
            extract('year', QualityInspection.inspection_date).label('year'),
            extract('month', QualityInspection.inspection_date).label('month'),
            func.count(QualityInspection.id).label('total'),
            func.sum(db.case((QualityInspection.result == 'pass', 1), else_=0)).label('passed')
        ).filter(
            QualityInspection.inspection_date >= start_date,
            QualityInspection.inspection_date <= end_date
        ).group_by('year', 'month')\
        .order_by('year', 'month')\
        .all()
        
        # Format trends
        revenue_data = [
            {
                'period': f"{int(row.year)}-{int(row.month):02d}",
                'value': float(row.revenue or 0)
            }
            for row in revenue_trend
        ]
        
        production_data = [
            {
                'period': f"{int(row.year)}-{int(row.month):02d}",
                'value': float(row.output or 0)
            }
            for row in production_trend
        ]
        
        oee_data = [
            {
                'period': f"{int(row.year)}-{int(row.month):02d}",
                'value': round(float(row.avg_oee or 0), 2)
            }
            for row in oee_trend
        ]
        
        quality_data = [
            {
                'period': f"{int(row.year)}-{int(row.month):02d}",
                'pass_rate': round((row.passed / row.total * 100) if row.total > 0 else 0, 2),
                'total': row.total,
                'passed': row.passed
            }
            for row in quality_trend
        ]
        
        return jsonify({
            'success': True,
            'data': {
                'revenue': revenue_data,
                'production': production_data,
                'oee': oee_data,
                'quality': quality_data
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@executive_dashboard_bp.route('/performance-scorecard', methods=['GET'])
@jwt_required(optional=True)
def get_performance_scorecard():
    """
    Get comprehensive performance scorecard with targets from database
    """
    try:
        end_date = datetime.now().date()
        start_date = (datetime.now() - timedelta(days=30)).date()
        
        # Helper function to get target from database
        def get_target(kpi_code, default_value):
            target = KPITarget.query.filter_by(kpi_code=kpi_code, is_active=True).first()
            if target:
                return {
                    'value': float(target.target_value),
                    'warning': float(target.warning_threshold) if target.warning_threshold else 80,
                    'critical': float(target.critical_threshold) if target.critical_threshold else 60
                }
            return {'value': default_value, 'warning': 80, 'critical': 60}
        
        # Helper function to determine status
        def get_status(actual, target_info, is_lower_better=False):
            target = target_info['value']
            warning = target_info['warning']
            critical = target_info['critical']
            
            if is_lower_better:
                # For metrics like defect rate where lower is better
                if actual <= target:
                    return 'good'
                elif actual <= target * (warning / 100):
                    return 'warning'
                else:
                    return 'critical'
            else:
                achievement = (actual / target * 100) if target > 0 else 0
                if achievement >= 100:
                    return 'good'
                elif achievement >= warning:
                    return 'warning'
                else:
                    return 'critical'
        
        kpis = []
        
        # 1. Revenue Achievement
        revenue = db.session.query(func.sum(Invoice.total_amount))\
            .filter(
                Invoice.invoice_date >= start_date,
                Invoice.invoice_date <= end_date,
                Invoice.status.in_(['paid', 'partial'])
            ).scalar() or 0
        
        revenue_target = get_target('REVENUE', 500000000)
        revenue_achievement = (revenue / revenue_target['value'] * 100) if revenue_target['value'] > 0 else 0
        
        kpis.append({
            'category': 'Financial',
            'kpi_code': 'REVENUE',
            'kpi_name': 'Revenue Achievement',
            'actual': float(revenue),
            'target': revenue_target['value'],
            'achievement': round(float(revenue_achievement), 2),
            'unit': 'IDR',
            'status': get_status(revenue, revenue_target)
        })
        
        # 2. OEE
        avg_oee = db.session.query(func.avg(ShiftProduction.oee_score))\
            .filter(
                ShiftProduction.production_date >= start_date,
                ShiftProduction.production_date <= end_date,
                ShiftProduction.oee_score.isnot(None)
            ).scalar() or 0
        
        oee_target = get_target('OEE', 85)
        oee_achievement = (avg_oee / oee_target['value'] * 100) if oee_target['value'] > 0 else 0
        
        kpis.append({
            'category': 'Production',
            'kpi_code': 'OEE',
            'kpi_name': 'Overall Equipment Effectiveness (OEE)',
            'actual': round(float(avg_oee), 2),
            'target': oee_target['value'],
            'achievement': round(float(oee_achievement), 2),
            'unit': '%',
            'status': get_status(avg_oee, oee_target)
        })
        
        # 3. Quality Pass Rate
        total_inspections = db.session.query(func.count(QualityInspection.id))\
            .filter(
                QualityInspection.inspection_date >= start_date,
                QualityInspection.inspection_date <= end_date
            ).scalar() or 0
        
        passed_inspections = db.session.query(func.count(QualityInspection.id))\
            .filter(
                QualityInspection.inspection_date >= start_date,
                QualityInspection.inspection_date <= end_date,
                QualityInspection.result == 'pass'
            ).scalar() or 0
        
        quality_pass_rate = (passed_inspections / total_inspections * 100) if total_inspections > 0 else 0
        quality_target = get_target('QUALITY_PASS', 95)
        quality_achievement = (quality_pass_rate / quality_target['value'] * 100) if quality_target['value'] > 0 else 0
        
        kpis.append({
            'category': 'Quality',
            'kpi_code': 'QUALITY_PASS',
            'kpi_name': 'Quality Pass Rate',
            'actual': round(float(quality_pass_rate), 2),
            'target': quality_target['value'],
            'achievement': round(float(quality_achievement), 2),
            'unit': '%',
            'status': get_status(quality_pass_rate, quality_target)
        })
        
        # 4. On-Time Delivery
        total_orders = db.session.query(func.count(SalesOrder.id))\
            .filter(
                SalesOrder.order_date >= start_date,
                SalesOrder.order_date <= end_date,
                SalesOrder.status.in_(['delivered', 'invoiced'])
            ).scalar() or 0
        
        # Count on-time deliveries (where actual delivery <= expected delivery)
        ontime_orders = total_orders  # Simplified - assume all delivered are on time if no actual_delivery_date
        
        otd_rate = (ontime_orders / total_orders * 100) if total_orders > 0 else 100
        otd_target = get_target('OTD', 95)
        otd_achievement = (otd_rate / otd_target['value'] * 100) if otd_target['value'] > 0 else 0
        
        kpis.append({
            'category': 'Sales',
            'kpi_code': 'OTD',
            'kpi_name': 'On-Time Delivery Rate',
            'actual': round(float(otd_rate), 2),
            'target': otd_target['value'],
            'achievement': round(float(otd_achievement), 2),
            'unit': '%',
            'status': get_status(otd_rate, otd_target)
        })
        
        # 5. Inventory Turnover (Real calculation)
        # Inventory Turnover = COGS / Average Inventory
        # Simplified: Use total inventory movements / current inventory value
        
        # Get total inventory value (quantity_on_hand * product cost)
        total_inventory_value = db.session.query(
            func.sum(Inventory.quantity_on_hand * func.coalesce(Product.cost, 0))
        ).outerjoin(Product, Inventory.product_id == Product.id).scalar() or 0
        
        # Get COGS approximation from invoices
        cogs = db.session.query(func.sum(Invoice.total_amount * 0.7))\
            .filter(
                Invoice.invoice_date >= start_date,
                Invoice.invoice_date <= end_date,
                Invoice.status.in_(['paid', 'partial'])
            ).scalar() or 0
        
        # Annualize the monthly COGS
        annual_cogs = cogs * 12
        avg_inventory = total_inventory_value if total_inventory_value > 0 else 1
        inventory_turnover = annual_cogs / avg_inventory if avg_inventory > 0 else 0
        
        turnover_target = get_target('INVENTORY_TURN', 10)
        turnover_achievement = (inventory_turnover / turnover_target['value'] * 100) if turnover_target['value'] > 0 else 0
        
        kpis.append({
            'category': 'Inventory',
            'kpi_code': 'INVENTORY_TURN',
            'kpi_name': 'Inventory Turnover Ratio',
            'actual': round(float(inventory_turnover), 2),
            'target': turnover_target['value'],
            'achievement': round(float(turnover_achievement), 2),
            'unit': 'times/year',
            'status': get_status(inventory_turnover, turnover_target)
        })
        
        # 6. Production Output
        total_output = db.session.query(func.sum(ShiftProduction.actual_quantity))\
            .filter(
                ShiftProduction.production_date >= start_date,
                ShiftProduction.production_date <= end_date
            ).scalar() or 0
        
        output_target = get_target('PRODUCTION_OUTPUT', 100000)
        output_achievement = (float(total_output) / float(output_target['value']) * 100) if output_target['value'] > 0 else 0
        
        kpis.append({
            'category': 'Production',
            'kpi_code': 'PRODUCTION_OUTPUT',
            'kpi_name': 'Production Output',
            'actual': float(total_output),
            'target': output_target['value'],
            'achievement': round(float(output_achievement), 2),
            'unit': 'units',
            'status': get_status(total_output, output_target)
        })
        
        # Calculate overall score
        total_achievement = sum(kpi['achievement'] for kpi in kpis)
        overall_score = total_achievement / len(kpis) if kpis else 0
        
        # Group KPIs by category
        grouped_kpis = {}
        for kpi in kpis:
            cat = kpi['category']
            if cat not in grouped_kpis:
                grouped_kpis[cat] = []
            grouped_kpis[cat].append(kpi)
        
        return jsonify({
            'success': True,
            'data': {
                'overall_score': round(float(overall_score), 2),
                'kpis': kpis,
                'grouped_kpis': grouped_kpis,
                'summary': {
                    'total_kpis': len(kpis),
                    'good': len([k for k in kpis if k['status'] == 'good']),
                    'warning': len([k for k in kpis if k['status'] == 'warning']),
                    'critical': len([k for k in kpis if k['status'] == 'critical'])
                },
                'period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat()
                }
            }
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@executive_dashboard_bp.route('/top-performers', methods=['GET'])
@jwt_required(optional=True)
def get_top_performers():
    """
    Get top performers across different categories
    """
    try:
        end_date = datetime.now().date()
        start_date = (datetime.now() - timedelta(days=30)).date()
        
        # Top customers by revenue
        top_customers = db.session.query(
            Customer.id,
            Customer.company_name,
            func.sum(Invoice.total_amount).label('total_revenue'),
            func.count(SalesOrder.id).label('order_count')
        ).join(SalesOrder, Customer.id == SalesOrder.customer_id)\
        .join(Invoice, SalesOrder.id == Invoice.sales_order_id)\
        .filter(
            Invoice.invoice_date >= start_date,
            Invoice.invoice_date <= end_date
        ).group_by(Customer.id, Customer.company_name)\
        .order_by(func.sum(Invoice.total_amount).desc())\
        .limit(10)\
        .all()
        
        # Top products by sales
        top_products = db.session.query(
            Product.id,
            Product.name,
            Product.code,
            func.sum(ShiftProduction.good_quantity).label('total_produced')
        ).join(WorkOrder, Product.id == WorkOrder.product_id)\
        .join(ShiftProduction, WorkOrder.id == ShiftProduction.work_order_id)\
        .filter(
            ShiftProduction.production_date >= start_date,
            ShiftProduction.production_date <= end_date
        ).group_by(Product.id, Product.name, Product.code)\
        .order_by(func.sum(ShiftProduction.good_quantity).desc())\
        .limit(10)\
        .all()
        
        return jsonify({
            'success': True,
            'data': {
                'top_customers': [
                    {
                        'id': row.id,
                        'name': row.company_name,
                        'revenue': float(row.total_revenue),
                        'orders': row.order_count
                    }
                    for row in top_customers
                ],
                'top_products': [
                    {
                        'id': row.id,
                        'name': row.name,
                        'code': row.code,
                        'quantity': float(row.total_produced)
                    }
                    for row in top_products
                ]
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@executive_dashboard_bp.route('/alerts', methods=['GET'])
@jwt_required(optional=True)
def get_alerts():  # executive_alerts():
    """
    Get critical alerts for executive attention
    """
    try:
        alerts = []
        
        # Low stock alerts
        low_stock = db.session.query(
            Product.id,
            Product.name,
            Product.code,
            Inventory.quantity_on_hand,
            Product.min_stock_level
        ).join(Inventory, Product.id == Inventory.product_id)\
        .filter(Inventory.quantity_on_hand < Product.min_stock_level)\
        .limit(5)\
        .all()
        
        for item in low_stock:
            alerts.append({
                'type': 'low_stock',
                'severity': 'high',
                'title': f'Low Stock: {item.name}',
                'message': f'Stock level ({item.quantity}) below minimum ({item.min_stock_level})',
                'action_required': True
            })
        
        # Overdue invoices
        overdue_invoices = db.session.query(func.count(Invoice.id))\
            .filter(
                Invoice.status.in_(['pending', 'partial']),
                Invoice.due_date < datetime.now().date()
            ).scalar() or 0
        
        if overdue_invoices > 0:
            alerts.append({
                'type': 'overdue_payment',
                'severity': 'high',
                'title': 'Overdue Invoices',
                'message': f'{overdue_invoices} invoices are overdue',
                'action_required': True
            })
        
        # Low OEE machines
        low_oee_machines = db.session.query(
            ShiftProduction.machine_id,
            func.avg(ShiftProduction.oee_score).label('avg_oee')
        ).filter(
            ShiftProduction.production_date >= (datetime.now() - timedelta(days=7)).date()
        ).group_by(ShiftProduction.machine_id)\
        .having(func.avg(ShiftProduction.oee_score) < 75)\
        .all()
        
        if low_oee_machines:
            alerts.append({
                'type': 'low_oee',
                'severity': 'medium',
                'title': 'Low OEE Performance',
                'message': f'{len(low_oee_machines)} machines with OEE below 75%',
                'action_required': True
            })
        
        return jsonify({
            'success': True,
            'data': {
                'total_alerts': len(alerts),
                'critical_count': sum(1 for a in alerts if a['severity'] == 'high'),
                'alerts': alerts
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@executive_dashboard_bp.route('/active-users', methods=['GET'])
@jwt_required(optional=True)
def get_active_users():
    """Get list of active users with their recent activity"""
    try:
        users = db.session.query(User).filter(User.is_active == True).all()
        
        now = datetime.utcnow()
        online_threshold = now - timedelta(minutes=15)
        recent_threshold = now - timedelta(hours=24)
        
        active_users = []
        online_count = 0
        recent_count = 0
        
        for user in users:
            if user.last_login:
                if user.last_login >= online_threshold:
                    status = 'online'
                    online_count += 1
                elif user.last_login >= recent_threshold:
                    status = 'recent'
                    recent_count += 1
                else:
                    status = 'offline'
            else:
                status = 'never'
            
            user_roles = [ur.role.name for ur in user.roles if ur.role] if user.roles else []
            
            time_ago = None
            if user.last_login:
                delta = now - user.last_login
                if delta.days > 0:
                    time_ago = f"{delta.days}d ago"
                elif delta.seconds >= 3600:
                    time_ago = f"{delta.seconds // 3600}h ago"
                elif delta.seconds >= 60:
                    time_ago = f"{delta.seconds // 60}m ago"
                else:
                    time_ago = "Just now"
            
            active_users.append({
                'id': user.id,
                'username': user.username,
                'full_name': user.full_name,
                'email': user.email,
                'roles': user_roles,
                'is_admin': user.is_admin,
                'status': status,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'time_ago': time_ago
            })
        
        status_order = {'online': 0, 'recent': 1, 'offline': 2, 'never': 3}
        active_users.sort(key=lambda x: (status_order.get(x['status'], 4), x['full_name']))
        
        return jsonify({
            'success': True,
            'data': {
                'total_users': len(users),
                'online_count': online_count,
                'recent_count': recent_count,
                'users': active_users
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
