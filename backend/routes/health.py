"""
Health Check Endpoints for Docker and Monitoring
"""
from flask import Blueprint, jsonify
from datetime import datetime
import psycopg2
import redis
import os
from utils.timezone import get_local_now, get_local_today

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    """
    Basic health check endpoint
    Returns 200 if application is running
    """
    return jsonify({
        'status': 'healthy',
        'timestamp': get_local_now().isoformat(),
        'service': 'ERP Backend',
        'version': '1.0.0'
    }), 200


@health_bp.route('/health/detailed', methods=['GET'])
def detailed_health_check():
    """
    Detailed health check including database and redis
    """
    health_status = {
        'status': 'healthy',
        'timestamp': get_local_now().isoformat(),
        'service': 'ERP Backend',
        'version': '1.0.0',
        'checks': {}
    }
    
    # Check Database
    try:
        from app import db
        db.session.execute('SELECT 1')
        health_status['checks']['database'] = {
            'status': 'healthy',
            'message': 'Database connection successful'
        }
    except Exception as e:
        health_status['status'] = 'unhealthy'
        health_status['checks']['database'] = {
            'status': 'unhealthy',
            'message': str(e)
        }
    
    # Check Redis
    try:
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
        r = redis.from_url(redis_url)
        r.ping()
        health_status['checks']['redis'] = {
            'status': 'healthy',
            'message': 'Redis connection successful'
        }
    except Exception as e:
        health_status['checks']['redis'] = {
            'status': 'unhealthy',
            'message': str(e)
        }
    
    # Determine overall status
    if health_status['status'] == 'unhealthy':
        return jsonify(health_status), 503
    
    return jsonify(health_status), 200


@health_bp.route('/ready', methods=['GET'])
def readiness_check():
    """
    Readiness check for Kubernetes/Docker
    Returns 200 when application is ready to serve traffic
    """
    try:
        from app import db
        db.session.execute('SELECT 1')
        return jsonify({
            'status': 'ready',
            'timestamp': get_local_now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'not ready',
            'error': str(e),
            'timestamp': get_local_now().isoformat()
        }), 503


@health_bp.route('/live', methods=['GET'])
def liveness_check():
    """
    Liveness check for Kubernetes/Docker
    Returns 200 if application is alive
    """
    return jsonify({
        'status': 'alive',
        'timestamp': get_local_now().isoformat()
    }), 200
