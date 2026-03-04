from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from utils.i18n import success_response, error_response, get_message
from models.integration_extended import (
    ExternalConnector, APIEndpoint, DataSyncJob, SyncJobExecution,
    Webhook, WebhookDelivery
)
from datetime import datetime, timedelta
import json
from utils.timezone import get_local_now, get_local_today

integration_bp = Blueprint('integration', __name__)

# External Connectors
@integration_bp.route('/connectors', methods=['GET'])
@jwt_required()
def get_connectors():
    """Get list of external connectors"""
    try:
        # Mock connectors data
        connectors = [
            {
                'id': 1,
                'name': 'SAP Integration',
                'type': 'erp',
                'endpoint_url': 'https://sap.company.com/api/v1',
                'is_active': True,
                'last_sync': (get_local_now() - timedelta(hours=2)).isoformat(),
                'sync_status': 'success',
                'request_count': 1250,
                'created_at': get_local_now().isoformat()
            },
            {
                'id': 2,
                'name': 'Salesforce CRM',
                'type': 'crm',
                'endpoint_url': 'https://company.salesforce.com/services/data/v50.0',
                'is_active': True,
                'last_sync': (get_local_now() - timedelta(minutes=30)).isoformat(),
                'sync_status': 'success',
                'request_count': 850,
                'created_at': get_local_now().isoformat()
            },
            {
                'id': 3,
                'name': 'Accounting System',
                'type': 'accounting',
                'endpoint_url': 'https://accounting.company.com/api',
                'is_active': False,
                'last_sync': (get_local_now() - timedelta(days=1)).isoformat(),
                'sync_status': 'failed',
                'error_message': 'Connection timeout',
                'request_count': 320,
                'created_at': get_local_now().isoformat()
            }
        ]
        
        return jsonify({
            'success': True,
            'connectors': connectors
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to load connectors: {str(e)}'
        }), 500

@integration_bp.route('/connectors', methods=['POST'])
@jwt_required()
def create_connector():
    """Create new external connector"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'type', 'endpoint_url']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Mock connector creation
        new_connector = {
            'id': 4,  # In real implementation, get from database
            'name': data['name'],
            'type': data['type'],
            'endpoint_url': data['endpoint_url'],
            'api_key': data.get('api_key'),
            'username': data.get('username'),
            'is_active': data.get('is_active', True),
            'sync_status': 'never',
            'request_count': 0,
            'created_at': get_local_now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'message': 'Connector created successfully',
            'connector': new_connector
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to create connector: {str(e)}'
        }), 500

@integration_bp.route('/connectors/<int:connector_id>', methods=['PUT'])
@jwt_required()
def update_connector(connector_id):
    """Update external connector"""
    try:
        data = request.get_json()
        
        # Mock connector update
        return jsonify({
            'success': True,
            'message': 'Connector updated successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to update connector: {str(e)}'
        }), 500

@integration_bp.route('/connectors/<int:connector_id>', methods=['PATCH'])
@jwt_required()
def toggle_connector(connector_id):
    """Toggle connector active status"""
    try:
        data = request.get_json()
        is_active = data.get('is_active')
        
        return jsonify({
            'success': True,
            'message': f'Connector {"activated" if is_active else "deactivated"} successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to toggle connector: {str(e)}'
        }), 500

@integration_bp.route('/connectors/<int:connector_id>', methods=['DELETE'])
@jwt_required()
def delete_connector(connector_id):
    """Delete external connector"""
    try:
        return jsonify({
            'success': True,
            'message': 'Connector deleted successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to delete connector: {str(e)}'
        }), 500

@integration_bp.route('/connectors/<int:connector_id>/test', methods=['POST'])
@jwt_required()
def test_connector(connector_id):
    """Test connector connection"""
    try:
        # Mock connection test
        import random
        success = random.choice([True, False])
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Connection test successful'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Connection timeout - unable to reach endpoint'
            })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Connection test failed: {str(e)}'
        }), 500

# API Gateway
@integration_bp.route('/api-gateway/endpoints', methods=['GET'])
@jwt_required()
def get_api_endpoints():
    """Get API Gateway endpoints"""
    try:
        endpoints = [
            {
                'id': 1,
                'path': '/api/v1/products',
                'method': 'GET',
                'description': 'Get products list',
                'is_active': True,
                'rate_limit': 100,
                'auth_required': True,
                'roles_allowed': ['admin', 'user'],
                'request_count': 2500,
                'last_accessed': (get_local_now() - timedelta(minutes=5)).isoformat()
            },
            {
                'id': 2,
                'path': '/api/v1/orders',
                'method': 'POST',
                'description': 'Create new order',
                'is_active': True,
                'rate_limit': 50,
                'auth_required': True,
                'roles_allowed': ['admin', 'manager'],
                'request_count': 850,
                'last_accessed': (get_local_now() - timedelta(minutes=2)).isoformat()
            },
            {
                'id': 3,
                'path': '/api/v1/reports',
                'method': 'GET',
                'description': 'Generate reports',
                'is_active': False,
                'rate_limit': 20,
                'auth_required': True,
                'roles_allowed': ['admin'],
                'request_count': 120,
                'last_accessed': (get_local_now() - timedelta(hours=2)).isoformat()
            }
        ]
        
        return jsonify({
            'success': True,
            'endpoints': endpoints
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to load API endpoints: {str(e)}'
        }), 500

@integration_bp.route('/api-gateway/endpoints', methods=['POST'])
@jwt_required()
def create_api_endpoint():
    """Create new API endpoint"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['path', 'method', 'description']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Mock endpoint creation
        new_endpoint = {
            'id': 4,
            'path': data['path'],
            'method': data['method'],
            'description': data['description'],
            'is_active': data.get('is_active', True),
            'rate_limit': data.get('rate_limit', 100),
            'auth_required': data.get('auth_required', True),
            'roles_allowed': data.get('roles_allowed', []),
            'request_count': 0,
            'created_at': get_local_now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'message': 'API endpoint created successfully',
            'endpoint': new_endpoint
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to create API endpoint: {str(e)}'
        }), 500

# Data Synchronization
@integration_bp.route('/data-sync/jobs', methods=['GET'])
@jwt_required()
def get_sync_jobs():
    """Get data synchronization jobs"""
    try:
        jobs = [
            {
                'id': 1,
                'name': 'Product Sync - SAP to ERP',
                'source_system': 'SAP',
                'target_system': 'ERP Database',
                'sync_type': 'incremental',
                'schedule': 'Every 4 hours',
                'is_active': True,
                'last_run': (get_local_now() - timedelta(hours=3)).isoformat(),
                'next_run': (get_local_now() + timedelta(hours=1)).isoformat(),
                'status': 'success',
                'records_synced': 1250
            },
            {
                'id': 2,
                'name': 'Customer Data - CRM to ERP',
                'source_system': 'Salesforce',
                'target_system': 'ERP Database',
                'sync_type': 'full',
                'schedule': 'Daily at 2:00 AM',
                'is_active': True,
                'last_run': (get_local_now() - timedelta(hours=18)).isoformat(),
                'next_run': (get_local_now() + timedelta(hours=6)).isoformat(),
                'status': 'success',
                'records_synced': 850
            },
            {
                'id': 3,
                'name': 'Inventory Sync - Warehouse',
                'source_system': 'Warehouse System',
                'target_system': 'ERP Database',
                'sync_type': 'incremental',
                'schedule': 'Every hour',
                'is_active': False,
                'last_run': (get_local_now() - timedelta(days=1)).isoformat(),
                'status': 'failed',
                'error_message': 'Connection refused by source system',
                'records_synced': 0
            }
        ]
        
        return jsonify({
            'success': True,
            'jobs': jobs
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to load sync jobs: {str(e)}'
        }), 500

@integration_bp.route('/data-sync/jobs/<int:job_id>/run', methods=['POST'])
@jwt_required()
def run_sync_job(job_id):
    """Run data synchronization job manually"""
    try:
        # Mock job execution
        return jsonify({
            'success': True,
            'message': 'Sync job started successfully',
            'job_id': job_id,
            'started_at': get_local_now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to start sync job: {str(e)}'
        }), 500

@integration_bp.route('/data-sync/jobs/<int:job_id>', methods=['PATCH'])
@jwt_required()
def toggle_sync_job(job_id):
    """Toggle sync job active status"""
    try:
        data = request.get_json()
        is_active = data.get('is_active')
        
        return jsonify({
            'success': True,
            'message': f'Sync job {"activated" if is_active else "deactivated"} successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to toggle sync job: {str(e)}'
        }), 500

# Webhook Management
@integration_bp.route('/webhooks', methods=['GET'])
@jwt_required()
def get_webhooks():
    """Get webhook endpoints"""
    try:
        webhooks = [
            {
                'id': 1,
                'name': 'Order Notifications',
                'url': 'https://company.com/webhooks/orders',
                'events': ['order.created', 'order.updated', 'order.completed'],
                'is_active': True,
                'retry_count': 3,
                'timeout_seconds': 30,
                'last_triggered': (get_local_now() - timedelta(minutes=15)).isoformat(),
                'success_count': 1250,
                'failure_count': 5,
                'created_at': get_local_now().isoformat()
            },
            {
                'id': 2,
                'name': 'Inventory Alerts',
                'url': 'https://warehouse.company.com/api/alerts',
                'events': ['inventory.low_stock', 'inventory.updated'],
                'is_active': True,
                'retry_count': 5,
                'timeout_seconds': 45,
                'last_triggered': (get_local_now() - timedelta(hours=2)).isoformat(),
                'success_count': 850,
                'failure_count': 12,
                'created_at': get_local_now().isoformat()
            },
            {
                'id': 3,
                'name': 'User Management',
                'url': 'https://auth.company.com/webhooks/users',
                'events': ['user.created', 'user.updated', 'user.deleted'],
                'is_active': False,
                'retry_count': 3,
                'timeout_seconds': 30,
                'success_count': 120,
                'failure_count': 8,
                'created_at': get_local_now().isoformat()
            }
        ]
        
        return jsonify({
            'success': True,
            'webhooks': webhooks
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to load webhooks: {str(e)}'
        }), 500

@integration_bp.route('/webhooks', methods=['POST'])
@jwt_required()
def create_webhook():
    """Create new webhook"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'url', 'events']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Mock webhook creation
        new_webhook = {
            'id': 4,
            'name': data['name'],
            'url': data['url'],
            'events': data['events'],
            'is_active': data.get('is_active', True),
            'retry_count': data.get('retry_count', 3),
            'timeout_seconds': data.get('timeout_seconds', 30),
            'success_count': 0,
            'failure_count': 0,
            'created_at': get_local_now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'message': 'Webhook created successfully',
            'webhook': new_webhook
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to create webhook: {str(e)}'
        }), 500

@integration_bp.route('/webhooks/<int:webhook_id>/test', methods=['POST'])
@jwt_required()
def test_webhook(webhook_id):
    """Test webhook endpoint"""
    try:
        # Mock webhook test
        import random
        success = random.choice([True, False])
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Webhook test successful'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Webhook endpoint returned HTTP 404'
            })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Webhook test failed: {str(e)}'
        }), 500

@integration_bp.route('/webhooks/<int:webhook_id>', methods=['PATCH'])
@jwt_required()
def toggle_webhook(webhook_id):
    """Toggle webhook active status"""
    try:
        data = request.get_json()
        is_active = data.get('is_active')
        
        return jsonify({
            'success': True,
            'message': f'Webhook {"activated" if is_active else "deactivated"} successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to toggle webhook: {str(e)}'
        }), 500

@integration_bp.route('/webhooks/<int:webhook_id>', methods=['DELETE'])
@jwt_required()
def delete_webhook(webhook_id):
    """Delete webhook"""
    try:
        return jsonify({
            'success': True,
            'message': 'Webhook deleted successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to delete webhook: {str(e)}'
        }), 500
