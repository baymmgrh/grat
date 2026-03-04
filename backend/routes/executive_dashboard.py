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
from utils.timezone import get_local_now, get_local_today

executive_dashboard_bp = Blueprint('executive_dashboard', __name__)

@executive_dashboard_bp.route('/overview', methods=['GET'])
@jwt_required(optional=True)
def get_executive_overview():
    """
    Get comprehensive executive overview with all key metrics
    """
    try:
        # Get date range (default: current month)
        end_date = get_local_now().date()
        start_date = (get_local_now() - timedelta(days=30)).date()
        
        # Previous period for comparison
        prev_end_date = start_date - timedelta(days=1)
        prev_start_date = prev_end_date - timedelta(days=30)
        
        # ===== FINANCIAL METRICS =====
        # Current period revenue - try Invoice first, fallback to SalesOrder
        current_revenue = db.session.query(func.sum(Invoice.total_amount))\
            .filter(
                Invoice.invoice_date >= start_date,
                Invoice.invoice_date <= end_date,
                Invoice.status.in_(['paid', 'partial'])
            ).scalar() or 0
        
        # If no invoice data, use SalesOrder total_amount
        if current_revenue == 0:
            current_revenue = db.session.query(func.sum(SalesOrder.total_amount))\
                .filter(
                    SalesOrder.order_date >= start_date,
                    SalesOrder.order_date <= end_date
                ).scalar() or 0
        
        # Previous period revenue
        prev_revenue = db.session.query(func.sum(Invoice.total_amount))\
            .filter(
                Invoice.invoice_date >= prev_start_date,
                Invoice.invoice_date <= prev_end_date,
                Invoice.status.in_(['paid', 'partial'])
            ).scalar() or 0
        
        # If no invoice data, use SalesOrder
        if prev_revenue == 0:
            prev_revenue = db.session.query(func.sum(SalesOrder.total_amount))\
                .filter(
                    SalesOrder.order_date >= prev_start_date,
                    SalesOrder.order_date <= prev_end_date
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
        end_date = get_local_now().date()
        start_date = (get_local_now() - timedelta(days=365)).date()
        
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
        end_date = get_local_now().date()
        start_date = (get_local_now() - timedelta(days=30)).date()
        
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
                achievement = (float(actual) / float(target) * 100) if target > 0 else 0
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
        end_date = get_local_now().date()
        start_date = (get_local_now() - timedelta(days=30)).date()
        
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
                Invoice.due_date < get_local_now().date()
            ).scalar() or 0
        
        if overdue_invoices > 0:
            alerts.append({
                'type': 'overdue_payment',
                'severity': 'high',
                'title': 'Overdue Invoices',
                'message': f'{overdue_invoices} invoices are overdue',
                'action_required': True
            })
        
        # Low OEE machines - check both oee_score and efficiency_rate
        # Use COALESCE to handle NULL values, prioritize oee_score then efficiency_rate
        low_oee_machines = db.session.query(
            ShiftProduction.machine_id,
            func.avg(func.coalesce(ShiftProduction.oee_score, ShiftProduction.efficiency_rate, 0)).label('avg_oee')
        ).filter(
            ShiftProduction.production_date >= (get_local_now() - timedelta(days=30)).date()
        ).group_by(ShiftProduction.machine_id)\
        .having(func.avg(func.coalesce(ShiftProduction.oee_score, ShiftProduction.efficiency_rate, 0)) < 75)\
        .all()
        
        # Debug: print count
        print(f"[DEBUG] Low OEE machines found: {len(low_oee_machines)}")
        for m in low_oee_machines:
            print(f"  - Machine ID: {m.machine_id}, Avg OEE: {m.avg_oee}")
        
        if low_oee_machines:
            alerts.append({
                'type': 'low_oee',
                'severity': 'high',
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
        
        now = get_local_now()
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


@executive_dashboard_bp.route('/production-executive', methods=['GET'])
@jwt_required()
def get_production_executive_dashboard():
    """
    Executive Production Dashboard - Monthly Target vs Actual with Downtime Analysis
    For Top Management and Superadmin
    """
    try:
        from routes.schedule_grid import MonthlySchedule, ScheduleGridItem
        from models.production import ProductionRecord
        
        # Get parameters
        year = request.args.get('year', get_local_now().year, type=int)
        month = request.args.get('month', get_local_now().month, type=int)
        
        # Calculate date range for the month
        start_date = datetime(year, month, 1).date()
        if month == 12:
            end_date = datetime(year + 1, 1, 1).date() - timedelta(days=1)
        else:
            end_date = datetime(year, month + 1, 1).date() - timedelta(days=1)
        
        month_names = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                       'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
        
        # ===== 1. GET MONTHLY TARGETS =====
        monthly_schedules = MonthlySchedule.query.filter_by(year=year, month=month).all()
        
        # Build target data per product
        targets_by_product = {}
        total_target_ctn = 0
        total_target_pcs = 0
        
        for ms in monthly_schedules:
            # Get product data via raw SQL (MonthlySchedule uses products_new table)
            product_data = db.session.execute(
                db.text("SELECT code, name, pack_per_karton FROM products WHERE id = :id"),
                {'id': ms.product_id}
            ).fetchone()
            
            product_name = product_data[1] if product_data else f"Product {ms.product_id}"
            machine_name = ms.machine.name if ms.machine else "Unassigned"
            
            pack_per_ctn = 50  # Default
            if product_data and product_data[2]:
                pack_per_ctn = int(product_data[2])
            
            target_ctn = float(ms.target_ctn or 0)
            target_pcs = target_ctn * pack_per_ctn
            
            if product_name not in targets_by_product:
                targets_by_product[product_name] = {
                    'product_id': ms.product_id,
                    'product_name': product_name,
                    'target_ctn': 0,
                    'target_pcs': 0,
                    'actual_ctn': 0,
                    'actual_pcs': 0,
                    'good_pcs': 0,
                    'reject_pcs': 0,
                    'machines': [],
                    'pack_per_ctn': pack_per_ctn
                }
            
            targets_by_product[product_name]['target_ctn'] += target_ctn
            targets_by_product[product_name]['target_pcs'] += target_pcs
            targets_by_product[product_name]['machines'].append({
                'machine_id': ms.machine_id,
                'machine_name': machine_name,
                'target_ctn': target_ctn
            })
            
            total_target_ctn += target_ctn
            total_target_pcs += target_pcs
        
        # ===== 2. GET ACTUAL PRODUCTION =====
        # From ShiftProduction for the month
        shift_productions = ShiftProduction.query.filter(
            ShiftProduction.production_date >= start_date,
            ShiftProduction.production_date <= end_date
        ).all()
        
        total_actual_pcs = 0
        total_good_pcs = 0
        total_reject_pcs = 0
        total_downtime_minutes = 0
        
        # Downtime analysis
        downtime_by_category = {
            'mesin': 0,
            'operator': 0,
            'material': 0,
            'design': 0,
            'idle': 0,
            'others': 0
        }
        
        # Downtime reasons aggregation
        downtime_reasons = {}
        
        # Machine performance
        machine_performance = {}
        
        for sp in shift_productions:
            # Get product name
            product_name = None
            if sp.product:
                product_name = sp.product.name
            elif sp.work_order and sp.work_order.product:
                product_name = sp.work_order.product.name
            
            actual_qty = float(sp.actual_quantity or 0)
            good_qty = float(sp.good_quantity or 0)
            reject_qty = float(sp.reject_quantity or 0)
            
            total_actual_pcs += actual_qty
            total_good_pcs += good_qty
            total_reject_pcs += reject_qty
            total_downtime_minutes += float(sp.downtime_minutes or 0)
            
            # Aggregate by product
            if product_name and product_name in targets_by_product:
                targets_by_product[product_name]['actual_pcs'] += actual_qty
                targets_by_product[product_name]['good_pcs'] += good_qty
                targets_by_product[product_name]['reject_pcs'] += reject_qty
                pack_per_ctn = targets_by_product[product_name]['pack_per_ctn']
                targets_by_product[product_name]['actual_ctn'] = targets_by_product[product_name]['actual_pcs'] / pack_per_ctn
            
            # Downtime by category
            downtime_by_category['mesin'] += float(sp.downtime_mesin or 0)
            downtime_by_category['operator'] += float(sp.downtime_operator or 0)
            downtime_by_category['material'] += float(sp.downtime_material or 0)
            downtime_by_category['design'] += float(sp.downtime_design or 0)
            downtime_by_category['idle'] += float(sp.idle_time or 0)
            downtime_by_category['others'] += float(sp.downtime_others or 0)
            
            # Parse downtime reasons from issues
            if sp.issues:
                import re
                from utils import detect_downtime_category
                
                issue_parts = sp.issues.split(';')
                for idx, part in enumerate(issue_parts):
                    part = part.strip()
                    if not part:
                        continue
                    # Match pattern: "XX menit - reason [category]" or "XX menit - reason"
                    match = re.match(r'(\d+)\s*menit\s*-\s*(.+?)(?:\s*\[([^\]]+)\])?\s*$', part, re.IGNORECASE)
                    if match:
                        duration = int(match.group(1))
                        reason = match.group(2).strip()
                        explicit_category = match.group(3).strip() if match.group(3) else None
                        
                        # Clean reason from any remaining brackets
                        reason = re.sub(r'\s*\[.+\]\s*$', '', reason).strip()
                        
                        # Skip biological needs
                        excluded = ['istirahat', 'sholat', 'solat', 'toilet', 'makan', 'minum']
                        if any(kw in reason.lower() for kw in excluded):
                            continue
                        
                        # Auto-detect category if not explicitly provided
                        if explicit_category:
                            category = explicit_category.lower()
                        else:
                            # Pass is_first_entry parameter for proper categorization
                            is_first_entry = (idx == 0)
                            category = detect_downtime_category(reason, is_first_entry)
                        
                        # Always re-check: if auto-detect says 'idle', override explicit tag
                        auto_cat = detect_downtime_category(reason.lower())
                        if auto_cat == 'idle':
                            category = 'idle'
                        
                        # Use reason + category as unique key
                        key = f"{reason}|{category}"
                        if key not in downtime_reasons:
                            downtime_reasons[key] = {'reason': reason, 'category': category, 'count': 0, 'total_minutes': 0}
                        downtime_reasons[key]['count'] += 1
                        downtime_reasons[key]['total_minutes'] += duration
            
            # Machine performance
            machine_name = sp.machine.name if sp.machine else f"Machine {sp.machine_id}"
            if machine_name not in machine_performance:
                machine_performance[machine_name] = {
                    'machine_id': sp.machine_id,
                    'machine_name': machine_name,
                    'total_produced': 0,
                    'total_good': 0,
                    'total_reject': 0,
                    'total_downtime': 0,
                    'shift_count': 0,
                    'avg_oee': 0,
                    'oee_sum': 0
                }
            
            machine_performance[machine_name]['total_produced'] += actual_qty
            machine_performance[machine_name]['total_good'] += good_qty
            machine_performance[machine_name]['total_reject'] += reject_qty
            machine_performance[machine_name]['total_downtime'] += float(sp.downtime_minutes or 0)
            machine_performance[machine_name]['shift_count'] += 1
            machine_performance[machine_name]['oee_sum'] += float(sp.oee_score or 0)
        
        # Calculate averages for machines
        for machine in machine_performance.values():
            if machine['shift_count'] > 0:
                machine['avg_oee'] = round(machine['oee_sum'] / machine['shift_count'], 2)
            machine['quality_rate'] = round((machine['total_good'] / machine['total_produced'] * 100), 2) if machine['total_produced'] > 0 else 0
        
        # ===== 3. CALCULATE ACHIEVEMENT =====
        # Sum actual_ctn from each product (already calculated with correct pack_per_ctn)
        total_actual_ctn = sum(p['actual_ctn'] for p in targets_by_product.values())
        achievement_pct = round((total_actual_ctn / total_target_ctn * 100), 2) if total_target_ctn > 0 else 0
        gap_pcs = total_target_pcs - total_actual_pcs
        gap_ctn = total_target_ctn - total_actual_ctn
        
        # ===== 4. TOP DOWNTIME REASONS =====
        top_downtime = sorted(
            list(downtime_reasons.values()),
            key=lambda x: x['total_minutes'],
            reverse=True
        )[:10]
        
        # ===== 5. PRODUCTS BY ACHIEVEMENT =====
        products_list = []
        for product_name, data in targets_by_product.items():
            achievement = round((data['actual_pcs'] / data['target_pcs'] * 100), 2) if data['target_pcs'] > 0 else 0
            gap = data['target_pcs'] - data['actual_pcs']
            products_list.append({
                **data,
                'achievement_pct': achievement,
                'gap_pcs': gap,
                'gap_ctn': gap / data['pack_per_ctn'] if data['pack_per_ctn'] > 0 else 0,
                'quality_rate': round((data['good_pcs'] / data['actual_pcs'] * 100), 2) if data['actual_pcs'] > 0 else 0
            })
        
        # Sort by gap (worst first)
        products_list.sort(key=lambda x: x['achievement_pct'])
        
        # ===== 6. MACHINES BY PERFORMANCE =====
        machines_list = sorted(
            list(machine_performance.values()),
            key=lambda x: x['avg_oee']
        )
        
        # ===== 7. DAILY TREND =====
        daily_trend = {}
        for sp in shift_productions:
            date_str = sp.production_date.isoformat() if sp.production_date else None
            if date_str:
                if date_str not in daily_trend:
                    daily_trend[date_str] = {'date': date_str, 'produced': 0, 'good': 0, 'reject': 0, 'downtime': 0}
                daily_trend[date_str]['produced'] += float(sp.actual_quantity or 0)
                daily_trend[date_str]['good'] += float(sp.good_quantity or 0)
                daily_trend[date_str]['reject'] += float(sp.reject_quantity or 0)
                daily_trend[date_str]['downtime'] += float(sp.downtime_minutes or 0)
        
        daily_trend_list = sorted(daily_trend.values(), key=lambda x: x['date'])
        
        return jsonify({
            'success': True,
            'data': {
                'period': {
                    'year': year,
                    'month': month,
                    'month_name': month_names[month],
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat()
                },
                'summary': {
                    'target_ctn': round(total_target_ctn, 2),
                    'target_pcs': round(total_target_pcs, 2),
                    'actual_ctn': round(total_actual_ctn, 2),
                    'actual_pcs': round(total_actual_pcs, 2),
                    'good_pcs': round(total_good_pcs, 2),
                    'reject_pcs': round(total_reject_pcs, 2),
                    'achievement_pct': achievement_pct,
                    'gap_pcs': round(gap_pcs, 2),
                    'gap_ctn': round(gap_ctn, 2),
                    'quality_rate': round((total_good_pcs / total_actual_pcs * 100), 2) if total_actual_pcs > 0 else 0,
                    'total_downtime_minutes': round(total_downtime_minutes, 2),
                    'total_downtime_hours': round(total_downtime_minutes / 60, 2)
                },
                'downtime_by_category': downtime_by_category,
                'top_downtime_reasons': top_downtime,
                'products': products_list,
                'machines': machines_list,
                'daily_trend': daily_trend_list
            }
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@executive_dashboard_bp.route('/production-monitoring', methods=['GET'])
@jwt_required(optional=True)
def get_production_monitoring():
    """
    Production Monitoring Dashboard - Weekly/Monthly target vs actual
    With Grade A/B/C, Runtime/Downtime/IdleTime breakdown per day per product
    Data sourced from Work Orders and ShiftProduction
    """
    try:
        from routes.schedule_grid import MonthlySchedule
        from models.production import Machine
        import re
        from utils import detect_downtime_category
        
        # Get parameters
        year = request.args.get('year', get_local_now().year, type=int)
        month = request.args.get('month', get_local_now().month, type=int)
        view_mode = request.args.get('view', 'monthly')  # 'weekly' or 'monthly'
        week_number = request.args.get('week', 0, type=int)  # 1-5 for weekly view
        
        month_names = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                       'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
        
        # Calculate date range
        start_date = datetime(year, month, 1).date()
        if month == 12:
            end_date = datetime(year + 1, 1, 1).date() - timedelta(days=1)
        else:
            end_date = datetime(year, month + 1, 1).date() - timedelta(days=1)
        
        # For weekly view, calculate week boundaries
        if view_mode == 'weekly' and week_number > 0:
            week_start = start_date + timedelta(days=(week_number - 1) * 7)
            week_end = min(week_start + timedelta(days=6), end_date)
            start_date = week_start
            end_date = week_end
        
        # Calculate weeks in the month
        weeks_in_month = []
        temp_date = datetime(year, month, 1).date()
        month_end = end_date
        week_num = 1
        while temp_date <= month_end:
            w_start = temp_date
            w_end = min(temp_date + timedelta(days=6), month_end)
            weeks_in_month.append({
                'week': week_num,
                'start_date': w_start.isoformat(),
                'end_date': w_end.isoformat(),
                'label': f"Week {week_num} ({w_start.strftime('%d %b')} - {w_end.strftime('%d %b')})"
            })
            temp_date = w_end + timedelta(days=1)
            week_num += 1
        
        # ===== 1. GET MONTHLY TARGETS =====
        monthly_schedules = MonthlySchedule.query.filter_by(year=year, month=month).all()
        
        targets_by_product = {}
        total_target_ctn = 0
        
        for ms in monthly_schedules:
            product_data = db.session.execute(
                db.text("SELECT code, name, pack_per_karton FROM products WHERE id = :id"),
                {'id': ms.product_id}
            ).fetchone()
            
            product_name = product_data[1] if product_data else f"Product {ms.product_id}"
            product_code = product_data[0] if product_data else ''
            pack_per_ctn = int(product_data[2]) if product_data and product_data[2] else 50
            
            target_ctn = float(ms.target_ctn or 0)
            
            if product_name not in targets_by_product:
                targets_by_product[product_name] = {
                    'product_id': ms.product_id,
                    'product_code': product_code,
                    'product_name': product_name,
                    'target_ctn_monthly': 0,
                    'pack_per_ctn': pack_per_ctn,
                    'machines': []
                }
            
            targets_by_product[product_name]['target_ctn_monthly'] += target_ctn
            machine_name = ms.machine.name if ms.machine else "Unassigned"
            targets_by_product[product_name]['machines'].append({
                'machine_id': ms.machine_id,
                'machine_name': machine_name,
                'target_ctn': target_ctn
            })
            total_target_ctn += target_ctn
        
        # ===== 2. GET SHIFT PRODUCTIONS =====
        shift_productions = ShiftProduction.query.filter(
            ShiftProduction.production_date >= start_date,
            ShiftProduction.production_date <= end_date
        ).all()
        
        # ===== 3. BUILD DAILY DETAIL PER PRODUCT =====
        daily_product_data = {}  # {date: {product_name: {grade_a, grade_b, grade_c, ...}}}
        product_totals = {}  # Aggregated per product
        
        # Time tracking
        total_runtime = 0
        total_downtime = 0
        total_idle_time = 0
        total_planned = 0
        
        # Downtime details
        downtime_reasons = {}
        downtime_by_category = {
            'mesin': 0, 'operator': 0, 'material': 0, 'design': 0, 'others': 0
        }
        
        # Daily downtime records for expanded view
        daily_downtime_records = {}  # {date: [{reason, category, duration, shift, machine, product, wo}]}
        
        # Machine tracking
        machine_data = {}
        
        for sp in shift_productions:
            date_str = sp.production_date.isoformat() if sp.production_date else None
            if not date_str:
                continue
            
            # Get product name
            product_name = None
            product_code = ''
            if sp.product:
                product_name = sp.product.name
                product_code = sp.product.code or ''
            elif sp.work_order and sp.work_order.product:
                product_name = sp.work_order.product.name
                product_code = sp.work_order.product.code or ''
            
            if not product_name:
                product_name = f"Unknown Product {sp.product_id}"
            
            # Grade quantities
            grade_a = float(sp.good_quantity or 0)
            grade_b = float(sp.rework_quantity or 0)
            grade_c = float(sp.reject_quantity or 0)
            total_qty = float(sp.actual_quantity or 0)
            
            # Time metrics
            planned_rt = int(sp.planned_runtime or 480)
            dt_mesin = int(sp.downtime_mesin or 0)
            dt_operator = int(sp.downtime_operator or 0)
            dt_material = int(sp.downtime_material or 0)
            dt_design = int(sp.downtime_design or 0)
            dt_others = int(sp.downtime_others or 0)
            idle_min = int(sp.idle_time or 0)
            total_dt = dt_mesin + dt_operator + dt_material + dt_design + dt_others
            runtime_min = max(0, planned_rt - total_dt - idle_min)
            
            total_runtime += runtime_min
            total_downtime += total_dt
            total_idle_time += idle_min
            total_planned += planned_rt
            
            # Downtime categories
            downtime_by_category['mesin'] += dt_mesin
            downtime_by_category['operator'] += dt_operator
            downtime_by_category['material'] += dt_material
            downtime_by_category['design'] += dt_design
            downtime_by_category['others'] += dt_others
            
            # Get pack_per_ctn for carton calculation
            pack_per_ctn = 50  # Default
            if product_name in targets_by_product:
                pack_per_ctn = targets_by_product[product_name]['pack_per_ctn']
            elif sp.pack_per_carton and sp.pack_per_carton > 0:
                pack_per_ctn = sp.pack_per_carton
            elif sp.work_order and sp.work_order.pack_per_carton and sp.work_order.pack_per_carton > 0:
                pack_per_ctn = sp.work_order.pack_per_carton
            
            # Daily product data
            if date_str not in daily_product_data:
                daily_product_data[date_str] = {}
            
            if product_name not in daily_product_data[date_str]:
                daily_product_data[date_str][product_name] = {
                    'product_name': product_name,
                    'product_code': product_code,
                    'grade_a': 0, 'grade_b': 0, 'grade_c': 0,
                    'total_pcs': 0, 'total_ctn': 0,
                    'runtime': 0, 'downtime': 0, 'idle_time': 0,
                    'planned_runtime': 0,
                    'pack_per_ctn': pack_per_ctn,
                    'shifts': []
                }
            
            dpd = daily_product_data[date_str][product_name]
            dpd['grade_a'] += grade_a
            dpd['grade_b'] += grade_b
            dpd['grade_c'] += grade_c
            dpd['total_pcs'] += total_qty
            dpd['total_ctn'] = dpd['total_pcs'] / pack_per_ctn if pack_per_ctn > 0 else 0
            dpd['runtime'] += runtime_min
            dpd['downtime'] += total_dt
            dpd['idle_time'] += idle_min
            dpd['planned_runtime'] += planned_rt
            
            shift_num = 1
            if sp.shift:
                shift_match = re.search(r'(\d+)', str(sp.shift))
                if shift_match:
                    shift_num = int(shift_match.group(1))
            
            dpd['shifts'].append({
                'shift': shift_num,
                'grade_a': int(grade_a),
                'grade_b': int(grade_b),
                'grade_c': int(grade_c),
                'total': int(total_qty),
                'runtime': runtime_min,
                'downtime': total_dt,
                'idle_time': idle_min,
                'machine': sp.machine.name if sp.machine else 'N/A',
                'wo_number': sp.work_order.wo_number if sp.work_order else 'N/A'
            })
            
            # Product totals
            if product_name not in product_totals:
                product_totals[product_name] = {
                    'product_name': product_name,
                    'product_code': product_code,
                    'grade_a': 0, 'grade_b': 0, 'grade_c': 0,
                    'total_pcs': 0, 'total_ctn': 0,
                    'runtime': 0, 'downtime': 0, 'idle_time': 0,
                    'pack_per_ctn': pack_per_ctn,
                    'target_ctn': targets_by_product.get(product_name, {}).get('target_ctn_monthly', 0),
                    'shift_count': 0
                }
            
            pt = product_totals[product_name]
            pt['grade_a'] += grade_a
            pt['grade_b'] += grade_b
            pt['grade_c'] += grade_c
            pt['total_pcs'] += total_qty
            pt['total_ctn'] = pt['total_pcs'] / pack_per_ctn if pack_per_ctn > 0 else 0
            pt['runtime'] += runtime_min
            pt['downtime'] += total_dt
            pt['idle_time'] += idle_min
            pt['shift_count'] += 1
            
            # Machine data
            machine_name = sp.machine.name if sp.machine else f"Machine {sp.machine_id}"
            if machine_name not in machine_data:
                machine_data[machine_name] = {
                    'machine_name': machine_name,
                    'total_produced': 0, 'grade_a': 0, 'grade_b': 0, 'grade_c': 0,
                    'runtime': 0, 'downtime': 0, 'idle_time': 0,
                    'shift_count': 0, 'oee_sum': 0
                }
            md = machine_data[machine_name]
            md['total_produced'] += total_qty
            md['grade_a'] += grade_a
            md['grade_b'] += grade_b
            md['grade_c'] += grade_c
            md['runtime'] += runtime_min
            md['downtime'] += total_dt
            md['idle_time'] += idle_min
            md['shift_count'] += 1
            md['oee_sum'] += float(sp.oee_score or 0)
            
            # Parse downtime reasons from issues
            if sp.issues:
                issue_parts = sp.issues.split(';')
                for idx, part in enumerate(issue_parts):
                    part = part.strip()
                    if not part:
                        continue
                    match = re.match(r'(\d+)\s*menit\s*-\s*(.+?)(?:\s*\[([^\]]+)\])?\s*$', part, re.IGNORECASE)
                    if match:
                        duration = int(match.group(1))
                        reason = match.group(2).strip()
                        explicit_cat = match.group(3).strip() if match.group(3) else None
                        reason = re.sub(r'\s*\[.+\]\s*$', '', reason).strip()
                        
                        excluded = ['istirahat', 'sholat', 'solat', 'toilet', 'makan', 'minum']
                        if any(kw in reason.lower() for kw in excluded):
                            continue
                        
                        if explicit_cat:
                            category = explicit_cat.lower()
                        else:
                            try:
                                is_first = (idx == 0)
                                category = detect_downtime_category(reason, is_first)
                            except TypeError:
                                category = detect_downtime_category(reason)
                        
                        # Always re-check: if auto-detect says 'idle', override explicit tag
                        auto_cat = detect_downtime_category(reason.lower())
                        if auto_cat == 'idle':
                            category = 'idle'
                        
                        key = f"{reason}|{category}"
                        if key not in downtime_reasons:
                            downtime_reasons[key] = {'reason': reason, 'category': category, 'count': 0, 'total_minutes': 0}
                        downtime_reasons[key]['count'] += 1
                        downtime_reasons[key]['total_minutes'] += duration
                        
                        # Add to daily downtime records for expanded view
                        dt_shift_num = 1
                        if sp.shift:
                            dt_shift_match = re.search(r'(\d+)', str(sp.shift))
                            if dt_shift_match:
                                dt_shift_num = int(dt_shift_match.group(1))
                        
                        if date_str not in daily_downtime_records:
                            daily_downtime_records[date_str] = []
                        
                        # PIC mapping based on category
                        pic_mapping = {
                            'mesin': 'MTC',
                            'operator': 'Operator',
                            'material': 'Warehouse',
                            'design': 'Design',
                            'idle': 'Supervisor',
                            'others': 'Supervisor'
                        }
                        
                        daily_downtime_records[date_str].append({
                            'reason': reason,
                            'category': category,
                            'duration_minutes': duration,
                            'shift': dt_shift_num,
                            'machine_name': sp.machine.name if sp.machine else 'N/A',
                            'product_name': product_name,
                            'wo_number': sp.work_order.wo_number if sp.work_order else 'N/A',
                            'pic': pic_mapping.get(category, 'Supervisor')
                        })
        
        # ===== 4. BUILD DAILY TABLE =====
        all_dates = sorted(daily_product_data.keys())
        daily_table = []
        cumulative_by_product = {}
        
        # Calculate daily target (monthly target / working days)
        total_days_in_range = len(all_dates) if len(all_dates) > 0 else 1
        
        for date_str in all_dates:
            products_for_day = []
            day_total_a = 0
            day_total_b = 0
            day_total_c = 0
            day_total_pcs = 0
            day_total_ctn = 0
            day_runtime = 0
            day_downtime = 0
            day_idle = 0
            
            for pname, pdata in daily_product_data[date_str].items():
                # Cumulative tracking
                if pname not in cumulative_by_product:
                    cumulative_by_product[pname] = {'pcs': 0, 'ctn': 0}
                cumulative_by_product[pname]['pcs'] += pdata['total_pcs']
                cumulative_by_product[pname]['ctn'] += pdata['total_ctn']
                
                target_monthly = targets_by_product.get(pname, {}).get('target_ctn_monthly', 0)
                
                products_for_day.append({
                    **pdata,
                    'total_ctn': round(pdata['total_ctn'], 2),
                    'cumulative_ctn': round(cumulative_by_product[pname]['ctn'], 2),
                    'target_monthly_ctn': round(target_monthly, 2),
                    'gap_ctn': round(target_monthly - cumulative_by_product[pname]['ctn'], 2),
                    'shifts': pdata['shifts']
                })
                
                day_total_a += pdata['grade_a']
                day_total_b += pdata['grade_b']
                day_total_c += pdata['grade_c']
                day_total_pcs += pdata['total_pcs']
                day_total_ctn += pdata['total_ctn']
                day_runtime += pdata['runtime']
                day_downtime += pdata['downtime']
                day_idle += pdata['idle_time']
            
            daily_table.append({
                'date': date_str,
                'day_name': datetime.strptime(date_str, '%Y-%m-%d').strftime('%A'),
                'products': products_for_day,
                'day_summary': {
                    'grade_a': int(day_total_a),
                    'grade_b': int(day_total_b),
                    'grade_c': int(day_total_c),
                    'total_pcs': int(day_total_pcs),
                    'total_ctn': round(day_total_ctn, 2),
                    'runtime': day_runtime,
                    'downtime': day_downtime,
                    'idle_time': day_idle
                },
                'downtime_records': daily_downtime_records.get(date_str, [])
            })
        
        # ===== 5. PRODUCT ACHIEVEMENT TABLE =====
        products_achievement = []
        total_actual_ctn = 0
        for pname, pt in product_totals.items():
            target = pt['target_ctn']
            actual = pt['total_ctn']
            total_actual_ctn += actual
            achievement = round((actual / target * 100), 2) if target > 0 else 0
            gap = target - actual
            quality = round((pt['grade_a'] / pt['total_pcs'] * 100), 2) if pt['total_pcs'] > 0 else 0
            
            products_achievement.append({
                'product_name': pname,
                'product_code': pt['product_code'],
                'target_ctn': round(target, 2),
                'actual_ctn': round(actual, 2),
                'gap_ctn': round(gap, 2),
                'achievement_pct': achievement,
                'grade_a': int(pt['grade_a']),
                'grade_b': int(pt['grade_b']),
                'grade_c': int(pt['grade_c']),
                'total_pcs': int(pt['total_pcs']),
                'quality_rate': quality,
                'runtime': pt['runtime'],
                'downtime': pt['downtime'],
                'idle_time': pt['idle_time'],
                'pack_per_ctn': pt['pack_per_ctn']
            })
        
        products_achievement.sort(key=lambda x: x['achievement_pct'])
        
        # ===== 6. MACHINE SUMMARY =====
        machines_list = []
        for mname, md in machine_data.items():
            avg_oee = round(md['oee_sum'] / md['shift_count'], 2) if md['shift_count'] > 0 else 0
            quality = round((md['grade_a'] / md['total_produced'] * 100), 2) if md['total_produced'] > 0 else 0
            machines_list.append({
                'machine_name': mname,
                'total_produced': int(md['total_produced']),
                'grade_a': int(md['grade_a']),
                'grade_b': int(md['grade_b']),
                'grade_c': int(md['grade_c']),
                'runtime': md['runtime'],
                'downtime': md['downtime'],
                'idle_time': md['idle_time'],
                'shift_count': md['shift_count'],
                'avg_oee': avg_oee,
                'quality_rate': quality
            })
        machines_list.sort(key=lambda x: x['avg_oee'], reverse=True)
        
        # ===== 7. TOP DOWNTIME REASONS =====
        top_downtime = sorted(
            list(downtime_reasons.values()),
            key=lambda x: x['total_minutes'],
            reverse=True
        )[:15]
        
        # ===== 8. WORK ORDER STATUS SUMMARY =====
        work_orders = WorkOrder.query.filter(
            WorkOrder.created_at >= datetime(year, month, 1),
            WorkOrder.created_at <= datetime(year, month, end_date.day, 23, 59, 59)
        ).all()
        
        wo_summary = {
            'total': len(work_orders),
            'planned': sum(1 for wo in work_orders if wo.status == 'planned'),
            'in_progress': sum(1 for wo in work_orders if wo.status == 'in_progress'),
            'completed': sum(1 for wo in work_orders if wo.status == 'completed'),
            'cancelled': sum(1 for wo in work_orders if wo.status == 'cancelled'),
        }
        
        # ===== 9. OVERALL SUMMARY =====
        overall_achievement = round((total_actual_ctn / total_target_ctn * 100), 2) if total_target_ctn > 0 else 0
        
        # 22 working days per month tracking
        TOTAL_WORKING_DAYS = 22
        days_elapsed = len(all_dates)  # days with actual production data
        daily_target_pct = round(100 / TOTAL_WORKING_DAYS, 2)  # ~4.55% per day
        expected_achievement_pct = round(days_elapsed * daily_target_pct, 2)  # expected cumulative %
        daily_target_ctn = round(total_target_ctn / TOTAL_WORKING_DAYS, 2) if total_target_ctn > 0 else 0
        is_behind = overall_achievement < expected_achievement_pct and total_target_ctn > 0
        behind_pct = round(expected_achievement_pct - overall_achievement, 2) if is_behind else 0
        
        return jsonify({
            'success': True,
            'data': {
                'period': {
                    'year': year,
                    'month': month,
                    'month_name': month_names[month],
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'view_mode': view_mode,
                    'week_number': week_number,
                    'weeks': weeks_in_month
                },
                'summary': {
                    'target_ctn': round(total_target_ctn, 2),
                    'actual_ctn': round(total_actual_ctn, 2),
                    'gap_ctn': round(total_target_ctn - total_actual_ctn, 2),
                    'achievement_pct': overall_achievement,
                    'total_grade_a': int(sum(p['grade_a'] for p in products_achievement)),
                    'total_grade_b': int(sum(p['grade_b'] for p in products_achievement)),
                    'total_grade_c': int(sum(p['grade_c'] for p in products_achievement)),
                    'total_pcs': int(sum(p['total_pcs'] for p in products_achievement)),
                    'quality_rate': round(
                        (sum(p['grade_a'] for p in products_achievement) / 
                         sum(p['total_pcs'] for p in products_achievement) * 100)
                        if sum(p['total_pcs'] for p in products_achievement) > 0 else 0, 2
                    ),
                    'runtime_minutes': total_runtime,
                    'runtime_hours': round(total_runtime / 60, 1),
                    'downtime_minutes': total_downtime,
                    'downtime_hours': round(total_downtime / 60, 1),
                    'idle_time_minutes': total_idle_time,
                    'idle_time_hours': round(total_idle_time / 60, 1),
                    'planned_runtime_minutes': total_planned,
                    'utilization_pct': round((total_runtime / total_planned * 100), 2) if total_planned > 0 else 0,
                    'working_days': days_elapsed,
                    'total_working_days': TOTAL_WORKING_DAYS,
                    'daily_target_pct': daily_target_pct,
                    'daily_target_ctn': daily_target_ctn,
                    'expected_achievement_pct': expected_achievement_pct,
                    'is_behind': is_behind,
                    'behind_pct': behind_pct
                },
                'downtime_by_category': downtime_by_category,
                'top_downtime_reasons': top_downtime,
                'products': products_achievement,
                'machines': machines_list,
                'daily_table': daily_table,
                'work_orders': wo_summary
            }
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@executive_dashboard_bp.route('/production-output-details', methods=['GET'])
@jwt_required(optional=True)
def get_production_output_details():
    """
    Get detailed production output breakdown by machine, product, and shift
    Returns pack count and carton count
    """
    try:
        from models.production import Machine
        from models.product import ProductPackaging
        
        # Get date range from query params
        days = request.args.get('days', 30, type=int)
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        if start_date_str and end_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = get_local_now().date()
            start_date = end_date - timedelta(days=days)
        
        # Get all shift productions in date range
        shift_productions = db.session.query(
            ShiftProduction.production_date,
            ShiftProduction.shift,
            ShiftProduction.machine_id,
            Machine.name.label('machine_name'),
            Machine.code.label('machine_code'),
            ShiftProduction.product_id,
            Product.name.label('product_name'),
            Product.code.label('product_code'),
            ProductPackaging.packs_per_karton,
            func.sum(ShiftProduction.good_quantity).label('total_pack'),
            func.sum(ShiftProduction.actual_quantity).label('total_actual'),
            func.sum(ShiftProduction.reject_quantity).label('total_reject'),
            func.avg(ShiftProduction.oee_score).label('avg_oee')
        ).join(
            Machine, ShiftProduction.machine_id == Machine.id, isouter=True
        ).join(
            Product, ShiftProduction.product_id == Product.id
        ).outerjoin(
            ProductPackaging, Product.id == ProductPackaging.product_id
        ).filter(
            ShiftProduction.production_date >= start_date,
            ShiftProduction.production_date <= end_date
        ).group_by(
            ShiftProduction.production_date,
            ShiftProduction.shift,
            ShiftProduction.machine_id,
            Machine.name,
            Machine.code,
            ShiftProduction.product_id,
            Product.name,
            Product.code,
            ProductPackaging.packs_per_karton
        ).order_by(
            ShiftProduction.production_date.desc(),
            ShiftProduction.shift,
            Machine.name
        ).all()
        
        # Format results
        details = []
        total_pack = 0
        total_carton = 0
        
        # Group by machine
        machine_summary = {}
        product_summary = {}
        shift_summary = {'shift_1': 0, 'shift_2': 0, 'shift_3': 0}
        
        for sp in shift_productions:
            pack_count = float(sp.total_pack or 0)
            packs_per_karton = float(sp.packs_per_karton or 1) if sp.packs_per_karton else 1
            carton_count = pack_count / packs_per_karton if packs_per_karton > 0 else 0
            
            total_pack += pack_count
            total_carton += carton_count
            
            # Machine summary
            machine_key = sp.machine_name or 'Unknown'
            if machine_key not in machine_summary:
                machine_summary[machine_key] = {'pack': 0, 'carton': 0, 'code': sp.machine_code}
            machine_summary[machine_key]['pack'] += pack_count
            machine_summary[machine_key]['carton'] += carton_count
            
            # Product summary
            product_key = sp.product_name or 'Unknown'
            if product_key not in product_summary:
                product_summary[product_key] = {'pack': 0, 'carton': 0, 'code': sp.product_code, 'packs_per_karton': packs_per_karton}
            product_summary[product_key]['pack'] += pack_count
            product_summary[product_key]['carton'] += carton_count
            
            # Shift summary
            shift_key = sp.shift or 'shift_1'
            if shift_key in shift_summary:
                shift_summary[shift_key] += pack_count
            
            details.append({
                'date': sp.production_date.isoformat(),
                'shift': sp.shift,
                'machine_id': sp.machine_id,
                'machine_name': sp.machine_name or 'Unknown',
                'machine_code': sp.machine_code,
                'product_id': sp.product_id,
                'product_name': sp.product_name,
                'product_code': sp.product_code,
                'pack_count': round(pack_count, 2),
                'carton_count': round(carton_count, 2),
                'packs_per_karton': packs_per_karton,
                'reject_count': float(sp.total_reject or 0),
                'oee': round(float(sp.avg_oee or 0), 2)
            })
        
        # Format summaries
        machines_list = [
            {'name': k, 'code': v['code'], 'pack': round(v['pack'], 2), 'carton': round(v['carton'], 2)}
            for k, v in sorted(machine_summary.items(), key=lambda x: x[1]['pack'], reverse=True)
        ]
        
        products_list = [
            {'name': k, 'code': v['code'], 'pack': round(v['pack'], 2), 'carton': round(v['carton'], 2), 'packs_per_karton': v['packs_per_karton']}
            for k, v in sorted(product_summary.items(), key=lambda x: x[1]['pack'], reverse=True)
        ]
        
        return jsonify({
            'success': True,
            'data': {
                'period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days': days
                },
                'summary': {
                    'total_pack': round(total_pack, 2),
                    'total_carton': round(total_carton, 2),
                    'total_records': len(details)
                },
                'by_machine': machines_list,
                'by_product': products_list,
                'by_shift': {
                    'shift_1': round(shift_summary['shift_1'], 2),
                    'shift_2': round(shift_summary['shift_2'], 2),
                    'shift_3': round(shift_summary['shift_3'], 2)
                },
                'details': details
            }
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
