from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Product, Machine, User, Employee
from utils.i18n import success_response, error_response, get_message
from models.quality import QualityInspection, QualityTest, CAPA
from models.quality_enhanced import (
    QualityMetrics, QualityAlert, QualityTarget, QualityAnalytics, 
    QualityAudit, QualityTraining, QualityCompetency
)
from utils.helpers import generate_number
from datetime import datetime, date, timedelta
from sqlalchemy import func, desc, and_, or_
import json
from utils.timezone import get_local_now, get_local_today

quality_enhanced_bp = Blueprint('quality_enhanced', __name__)

@quality_enhanced_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_quality_dashboard():
    """Enhanced quality dashboard with comprehensive metrics"""
    try:
        # Date ranges
        today = get_local_today()
        week_start = today - timedelta(days=7)
        month_start = today.replace(day=1)
        
        # Basic quality metrics
        total_inspections_today = QualityInspection.query.filter(
            func.date(QualityInspection.inspection_date) == today
        ).count()
        
        total_inspections_week = QualityInspection.query.filter(
            QualityInspection.inspection_date >= week_start
        ).count()
        
        passed_inspections_week = QualityInspection.query.filter(
            QualityInspection.inspection_date >= week_start,
            QualityInspection.result == 'accepted'
        ).count()
        
        pass_rate = (passed_inspections_week / total_inspections_week * 100) if total_inspections_week > 0 else 0
        
        # Active alerts
        active_alerts = QualityAlert.query.filter_by(status='active').count()
        critical_alerts = QualityAlert.query.filter(
            QualityAlert.status == 'active',
            QualityAlert.severity.in_(['high', 'critical'])
        ).count()
        
        # CAPA metrics
        open_capas = CAPA.query.filter_by(status='open').count()
        overdue_capas = CAPA.query.filter(
            CAPA.status.in_(['open', 'in_progress']),
            CAPA.target_date < today
        ).count()
        
        # Quality costs (simplified)
        total_defects_week = db.session.query(func.sum(QualityInspection.defect_count)).filter(
            QualityInspection.inspection_date >= week_start
        ).scalar() or 0
        
        # Trend data - last 7 days pass rate
        pass_rate_trend = []
        for i in range(7):
            trend_date = today - timedelta(days=6-i)
            daily_inspections = QualityInspection.query.filter(
                func.date(QualityInspection.inspection_date) == trend_date
            ).count()
            daily_passed = QualityInspection.query.filter(
                func.date(QualityInspection.inspection_date) == trend_date,
                QualityInspection.result == 'accepted'
            ).count()
            daily_pass_rate = (daily_passed / daily_inspections * 100) if daily_inspections > 0 else 0
            
            pass_rate_trend.append({
                'date': trend_date.isoformat(),
                'pass_rate': round(daily_pass_rate, 2),
                'inspections': daily_inspections
            })
        
        # Top defect types (from recent inspections)
        recent_inspections = QualityInspection.query.filter(
            QualityInspection.inspection_date >= week_start,
            QualityInspection.findings.isnot(None)
        ).all()
        
        # Machine performance - get real data from database
        machine_performance = []
        try:
            # Get machines that have quality inspections
            machines_with_inspections = db.session.query(Machine).join(
                Product, Machine.id == Product.machine_id
            ).join(
                QualityInspection, Product.id == QualityInspection.product_id
            ).filter(
                QualityInspection.inspection_date >= week_start
            ).distinct().all()
            
            for machine in machines_with_inspections:
                # Get inspections for products made by this machine
                machine_inspections = db.session.query(QualityInspection).join(
                    Product, QualityInspection.product_id == Product.id
                ).filter(
                    Product.machine_id == machine.id,
                    QualityInspection.inspection_date >= week_start
                ).all()
                
                if machine_inspections:
                    total_inspections = len(machine_inspections)
                    passed_inspections = len([i for i in machine_inspections if i.result == 'accepted'])
                    machine_pass_rate = (passed_inspections / total_inspections * 100) if total_inspections > 0 else 0
                    
                    machine_performance.append({
                        'machine': machine.name,
                        'pass_rate': round(machine_pass_rate, 2),
                        'total_inspections': total_inspections
                    })
        except Exception as e:
            print(f"Error getting machine performance: {e}")
            # If error, return empty list instead of dummy data
            machine_performance = []
        
        return jsonify({
            'summary': {
                'inspections_today': total_inspections_today,
                'inspections_this_week': total_inspections_week,
                'pass_rate': round(pass_rate, 2),
                'active_alerts': active_alerts,
                'critical_alerts': critical_alerts,
                'open_capas': open_capas,
                'overdue_capas': overdue_capas,
                'total_defects_week': int(total_defects_week)
            },
            'trends': {
                'pass_rate': pass_rate_trend
            },
            'machine_performance': machine_performance,
            'last_updated': get_local_now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@quality_enhanced_bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_quality_alerts():
    """Get quality alerts with filtering"""
    try:
        status = request.args.get('status', 'active')
        severity = request.args.get('severity')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = QualityAlert.query
        
        if status:
            query = query.filter(QualityAlert.status == status)
        
        if severity:
            query = query.filter(QualityAlert.severity == severity)
        
        alerts = query.order_by(desc(QualityAlert.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'alerts': [{
                'id': alert.id,
                'alert_number': alert.alert_number,
                'alert_type': alert.alert_type,
                'severity': alert.severity,
                'title': alert.title,
                'message': alert.message,
                'product_name': alert.product.name if alert.product else None,
                'machine_name': alert.machine.name if alert.machine else None,
                'threshold_value': float(alert.threshold_value) if alert.threshold_value else None,
                'actual_value': float(alert.actual_value) if alert.actual_value else None,
                'status': alert.status,
                'created_at': alert.created_at.isoformat(),
                'acknowledged_by': alert.acknowledged_by_user.username if alert.acknowledged_by_user else None,
                'acknowledged_at': alert.acknowledged_at.isoformat() if alert.acknowledged_at else None
            } for alert in alerts.items],
            'pagination': {
                'page': alerts.page,
                'pages': alerts.pages,
                'per_page': alerts.per_page,
                'total': alerts.total
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@quality_enhanced_bp.route('/alerts/<int:alert_id>/acknowledge', methods=['PUT'])
@jwt_required()
def acknowledge_alert(alert_id):
    """Acknowledge a quality alert"""
    try:
        current_user_id = get_jwt_identity()
        alert = QualityAlert.query.get_or_404(alert_id)
        
        alert.status = 'acknowledged'
        alert.acknowledged_by = current_user_id
        alert.acknowledged_at = get_local_now()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Alert acknowledged successfully',
            'alert_id': alert_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@quality_enhanced_bp.route('/alerts/<int:alert_id>/resolve', methods=['PUT'])
@jwt_required()
def resolve_alert(alert_id):
    """Resolve a quality alert"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        alert = QualityAlert.query.get_or_404(alert_id)
        
        alert.status = 'resolved'
        alert.resolved_by = current_user_id
        alert.resolved_at = get_local_now()
        alert.resolution_notes = data.get('resolution_notes', '')
        
        db.session.commit()
        
        return jsonify({
            'message': 'Alert resolved successfully',
            'alert_id': alert_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@quality_enhanced_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_quality_analytics():
    """Get quality analytics and KPIs"""
    try:
        period = request.args.get('period', 'monthly')  # daily, weekly, monthly
        product_id = request.args.get('product_id', type=int)
        
        # Date range based on period
        today = get_local_today()
        if period == 'daily':
            start_date = today - timedelta(days=30)
        elif period == 'weekly':
            start_date = today - timedelta(weeks=12)
        else:  # monthly
            start_date = today - timedelta(days=365)
        
        query = QualityAnalytics.query.filter(
            QualityAnalytics.analysis_date >= start_date,
            QualityAnalytics.period_type == period
        )
        
        if product_id:
            query = query.filter(QualityAnalytics.product_id == product_id)
        
        analytics = query.order_by(QualityAnalytics.analysis_date).all()
        
        # Calculate summary metrics
        total_production = sum(a.total_production for a in analytics)
        total_inspected = sum(a.total_inspected for a in analytics)
        total_passed = sum(a.total_passed for a in analytics)
        
        overall_pass_rate = (total_passed / total_inspected * 100) if total_inspected > 0 else 0
        inspection_coverage = (total_inspected / total_production * 100) if total_production > 0 else 0
        
        return jsonify({
            'summary': {
                'period': period,
                'total_production': total_production,
                'total_inspected': total_inspected,
                'total_passed': total_passed,
                'overall_pass_rate': round(overall_pass_rate, 2),
                'inspection_coverage': round(inspection_coverage, 2)
            },
            'analytics': [{
                'date': a.analysis_date.isoformat(),
                'total_production': a.total_production,
                'total_inspected': a.total_inspected,
                'pass_rate': float(a.overall_pass_rate),
                'defect_density': float(a.defect_density),
                'first_pass_yield': float(a.first_pass_yield),
                'cost_of_poor_quality': float(a.cost_of_poor_quality),
                'pass_rate_trend': a.pass_rate_trend,
                'target_achievement': float(a.target_achievement)
            } for a in analytics]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@quality_enhanced_bp.route('/targets', methods=['GET'])
@jwt_required()
def get_quality_targets():
    """Get quality targets"""
    try:
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        
        query = QualityTarget.query
        if active_only:
            query = query.filter(QualityTarget.is_active == True)
        
        targets = query.order_by(QualityTarget.created_at.desc()).all()
        
        return jsonify({
            'targets': [{
                'id': target.id,
                'target_name': target.target_name,
                'target_type': target.target_type,
                'product_name': target.product.name if target.product else 'All Products',
                'machine_name': target.machine.name if target.machine else 'All Machines',
                'target_value': float(target.target_value),
                'warning_threshold': float(target.warning_threshold) if target.warning_threshold else None,
                'critical_threshold': float(target.critical_threshold) if target.critical_threshold else None,
                'period_type': target.period_type,
                'start_date': target.start_date.isoformat(),
                'end_date': target.end_date.isoformat() if target.end_date else None,
                'is_active': target.is_active,
                'created_by': target.created_by_user.username if target.created_by_user else None
            } for target in targets]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@quality_enhanced_bp.route('/targets', methods=['POST'])
@jwt_required()
def create_quality_target():
    """Create a new quality target"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        target = QualityTarget(
            target_name=data['target_name'],
            target_type=data['target_type'],
            product_id=data.get('product_id'),
            machine_id=data.get('machine_id'),
            target_value=data['target_value'],
            warning_threshold=data.get('warning_threshold'),
            critical_threshold=data.get('critical_threshold'),
            period_type=data['period_type'],
            start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date(),
            end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data.get('end_date') else None,
            created_by=current_user_id
        )
        
        db.session.add(target)
        db.session.commit()
        
        return jsonify({
            'message': 'Quality target created successfully',
            'target_id': target.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@quality_enhanced_bp.route('/audits', methods=['GET'])
@jwt_required()
def get_quality_audits():
    """Get quality audits"""
    try:
        status = request.args.get('status')
        audit_type = request.args.get('audit_type')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = QualityAudit.query
        
        if status:
            query = query.filter(QualityAudit.status == status)
        
        if audit_type:
            query = query.filter(QualityAudit.audit_type == audit_type)
        
        audits = query.order_by(desc(QualityAudit.planned_date)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'audits': [{
                'id': audit.id,
                'audit_number': audit.audit_number,
                'audit_type': audit.audit_type,
                'audit_scope': audit.audit_scope,
                'planned_date': audit.planned_date.isoformat(),
                'actual_date': audit.actual_date.isoformat() if audit.actual_date else None,
                'status': audit.status,
                'overall_rating': audit.overall_rating,
                'total_findings': audit.total_findings,
                'critical_findings': audit.critical_findings,
                'major_findings': audit.major_findings,
                'minor_findings': audit.minor_findings,
                'lead_auditor': audit.lead_auditor.username if audit.lead_auditor else None,
                'follow_up_date': audit.follow_up_date.isoformat() if audit.follow_up_date else None
            } for audit in audits.items],
            'pagination': {
                'page': audits.page,
                'pages': audits.pages,
                'per_page': audits.per_page,
                'total': audits.total
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@quality_enhanced_bp.route('/training/competency', methods=['GET'])
@jwt_required()
def get_quality_competency():
    """Get quality training competency status"""
    try:
        employee_id = request.args.get('employee_id', type=int)
        
        query = db.session.query(
            QualityCompetency,
            QualityTraining.training_name,
            Employee.name.label('employee_name')
        ).join(
            QualityTraining, QualityCompetency.training_id == QualityTraining.id
        ).join(
            Employee, QualityCompetency.employee_id == Employee.id
        )
        
        if employee_id:
            query = query.filter(QualityCompetency.employee_id == employee_id)
        
        # Filter for current competencies (not expired)
        query = query.filter(
            or_(
                QualityCompetency.valid_until.is_(None),
                QualityCompetency.valid_until >= get_local_today()
            )
        )
        
        competencies = query.all()
        
        return jsonify({
            'competencies': [{
                'id': comp.QualityCompetency.id,
                'employee_name': comp.employee_name,
                'training_name': comp.training_name,
                'completion_date': comp.QualityCompetency.completion_date.isoformat(),
                'competency_level': comp.QualityCompetency.competency_level,
                'score': float(comp.QualityCompetency.score) if comp.QualityCompetency.score else None,
                'valid_until': comp.QualityCompetency.valid_until.isoformat() if comp.QualityCompetency.valid_until else None,
                'renewal_required': comp.QualityCompetency.renewal_required,
                'certificate_number': comp.QualityCompetency.certificate_number
            } for comp in competencies]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
