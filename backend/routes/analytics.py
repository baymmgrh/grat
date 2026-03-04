from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, KPI, MetricData, AnalyticsReport
from utils.i18n import success_response, error_response, get_message
from utils import generate_number
from datetime import datetime

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/kpis', methods=['GET'])
@jwt_required()
def get_kpis():
    try:
        kpis = KPI.query.filter_by(is_active=True).all()
        return jsonify({
            'kpis': [{
                'id': k.id,
                'kpi_code': k.kpi_code,
                'kpi_name': k.kpi_name,
                'category': k.category,
                'measurement_unit': k.measurement_unit,
                'target_value': float(k.target_value) if k.target_value else None,
                'frequency': k.frequency
            } for k in kpis]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/kpis', methods=['POST'])
@jwt_required()
def create_kpi():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        kpi = KPI(
            kpi_code=data['kpi_code'],
            kpi_name=data['kpi_name'],
            category=data['category'],
            measurement_unit=data['measurement_unit'],
            target_value=data.get('target_value'),
            frequency=data['frequency'],
            owner_id=user_id
        )
        
        db.session.add(kpi)
        db.session.commit()
        return jsonify({'message': 'KPI created', 'kpi_id': kpi.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/metrics', methods=['POST'])
@jwt_required()
def create_metric():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        metric = MetricData(
            kpi_id=data['kpi_id'],
            metric_date=datetime.fromisoformat(data['metric_date']),
            actual_value=data['actual_value'],
            target_value=data.get('target_value'),
            status=data.get('status', 'on_target'),
            created_by=user_id
        )
        
        db.session.add(metric)
        db.session.commit()
        return jsonify(success_response('api.success')), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/reports', methods=['GET'])
@jwt_required()
def get_reports():
    try:
        reports = AnalyticsReport.query.order_by(AnalyticsReport.created_at.desc()).all()
        return jsonify({
            'reports': [{
                'id': r.id,
                'report_number': r.report_number,
                'report_name': r.report_name,
                'report_type': r.report_type,
                'status': r.status,
                'generated_at': r.generated_at.isoformat() if r.generated_at else None
            } for r in reports]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
