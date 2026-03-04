from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, ThirdPartyAPI, IntegrationLog
from utils.i18n import success_response, error_response, get_message

integration_bp = Blueprint('integration', __name__)

@integration_bp.route('/apis', methods=['GET'])
@jwt_required()
def get_apis():
    try:
        apis = ThirdPartyAPI.query.filter_by(is_active=True).all()
        return jsonify({
            'apis': [{
                'id': a.id,
                'api_name': a.api_name,
                'api_type': a.api_type,
                'provider': a.provider,
                'is_active': a.is_active
            } for a in apis]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@integration_bp.route('/logs', methods=['GET'])
@jwt_required()
def get_logs():
    try:
        logs = IntegrationLog.query.order_by(IntegrationLog.log_date.desc()).limit(100).all()
        return jsonify({
            'logs': [{
                'id': l.id,
                'api_name': l.api.api_name,
                'request_method': l.request_method,
                'response_status_code': l.response_status_code,
                'status': l.status,
                'log_date': l.log_date.isoformat()
            } for l in logs]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
