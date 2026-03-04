from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from utils.i18n import success_response, error_response, get_message
from models.user import User
from models.settings import SystemSetting
from models.settings_extended import (
    AdvancedUserRole, AdvancedPermission, AdvancedRolePermission,
    AdvancedUserRoleAssignment, AuditLog, SystemConfiguration, BackupConfiguration
)
from datetime import datetime, timedelta
import json
import os
import subprocess
import shutil
from sqlalchemy import text
from utils.timezone import get_local_now, get_local_today

settings_extended_bp = Blueprint('settings_extended', __name__)

# System Configuration Endpoints
@settings_extended_bp.route('/system-config', methods=['GET'])
@jwt_required()
def get_system_config():
    """Get system configuration settings"""
    try:
        # Default system configurations
        default_configs = {
            'general': {
                'system_name': 'ERP System',
                'system_version': '1.0.0',
                'timezone': 'Asia/Jakarta',
                'date_format': 'DD/MM/YYYY',
                'currency': 'IDR',
                'language': 'id'
            },
            'database': {
                'connection_pool_size': 10,
                'connection_timeout': 30,
                'query_timeout': 60,
                'backup_retention_days': 30
            },
            'security': {
                'session_timeout': 3600,
                'password_min_length': 8,
                'password_require_special': True,
                'max_login_attempts': 5,
                'account_lockout_duration': 900
            },
            'performance': {
                'cache_enabled': True,
                'cache_timeout': 300,
                'pagination_size': 20,
                'max_file_size': 10485760
            },
            'logging': {
                'log_level': 'INFO',
                'log_retention_days': 90,
                'audit_enabled': True,
                'debug_mode': False
            }
        }
        
        # Get existing settings from database
        settings = SystemSetting.query.all()
        
        # Merge with defaults
        for setting in settings:
            try:
                keys = setting.key.split('.')
                if len(keys) == 2:
                    category, key = keys
                    if category in default_configs and key in default_configs[category]:
                        # Parse value based on type
                        if isinstance(default_configs[category][key], bool):
                            default_configs[category][key] = setting.value.lower() == 'true'
                        elif isinstance(default_configs[category][key], int):
                            default_configs[category][key] = int(setting.value)
                        else:
                            default_configs[category][key] = setting.value
            except:
                continue
        
        return jsonify({
            'success': True,
            'configurations': default_configs
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to load system configurations: {str(e)}'
        }), 500

@settings_extended_bp.route('/system-config', methods=['POST'])
@jwt_required()
def save_system_config():
    """Save system configuration settings"""
    try:
        data = request.get_json()
        configurations = data.get('configurations', {})
        
        # Save each configuration to database
        for category, settings in configurations.items():
            for key, value in settings.items():
                setting_key = f"{category}.{key}"
                
                # Find existing setting or create new
                setting = SystemSetting.query.filter_by(key=setting_key).first()
                if not setting:
                    setting = SystemSetting(key=setting_key)
                    db.session.add(setting)
                
                # Convert value to string for storage
                setting.value = str(value)
                setting.updated_at = get_local_now()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'System configurations saved successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to save system configurations: {str(e)}'
        }), 500

# Role and Permission Management
@settings_extended_bp.route('/roles', methods=['GET'])
@jwt_required()
def get_roles():
    """Get all user roles"""
    try:
        # For now, return basic roles - can be extended with proper Role model
        roles = [
            {
                'id': 1,
                'name': 'Administrator',
                'description': 'Full system access',
                'permissions': ['all'],
                'user_count': User.query.filter_by(is_admin=True).count(),
                'created_at': get_local_now().isoformat()
            },
            {
                'id': 2,
                'name': 'Manager',
                'description': 'Management level access',
                'permissions': ['read', 'write', 'manage_users'],
                'user_count': 0,
                'created_at': get_local_now().isoformat()
            },
            {
                'id': 3,
                'name': 'User',
                'description': 'Standard user access',
                'permissions': ['read', 'write'],
                'user_count': User.query.filter_by(is_admin=False).count(),
                'created_at': get_local_now().isoformat()
            }
        ]
        
        return jsonify({
            'success': True,
            'roles': roles
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to load roles: {str(e)}'
        }), 500

@settings_extended_bp.route('/permissions', methods=['GET'])
@jwt_required()
def get_permissions():
    """Get all available permissions"""
    try:
        permissions = [
            {
                'id': 1,
                'name': 'all',
                'description': 'Full system access',
                'category': 'system'
            },
            {
                'id': 2,
                'name': 'read',
                'description': 'Read access to data',
                'category': 'data'
            },
            {
                'id': 3,
                'name': 'write',
                'description': 'Write access to data',
                'category': 'data'
            },
            {
                'id': 4,
                'name': 'delete',
                'description': 'Delete access to data',
                'category': 'data'
            },
            {
                'id': 5,
                'name': 'manage_users',
                'description': 'Manage user accounts',
                'category': 'user_management'
            },
            {
                'id': 6,
                'name': 'manage_settings',
                'description': 'Manage system settings',
                'category': 'system'
            }
        ]
        
        return jsonify({
            'success': True,
            'permissions': permissions
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to load permissions: {str(e)}'
        }), 500

# Audit Trail
@settings_extended_bp.route('/audit-logs', methods=['GET'])
@jwt_required()
def get_audit_logs():
    """Get audit trail logs - REAL DATA from database"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        # Get filters
        user_id = request.args.get('user_id', type=int)
        action = request.args.get('action')
        resource_type = request.args.get('resource_type')
        resource_id = request.args.get('resource_id')
        url_contains = request.args.get('url_contains')
        exclude_actions = request.args.get('exclude_actions')  # comma-separated list
        status = request.args.get('status')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Build query - EXCLUDE ADMIN USERS
        query = AuditLog.query.join(User, AuditLog.user_id == User.id).filter(
            User.username != 'admin'  # Exclude admin
        )
        
        # Apply filters
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if action:
            query = query.filter(AuditLog.action == action)
        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)
        if resource_id:
            query = query.filter(AuditLog.resource_id == str(resource_id))
        if url_contains:
            query = query.filter(AuditLog.request_url.ilike(f'%{url_contains}%'))
        if exclude_actions:
            excluded = [a.strip() for a in exclude_actions.split(',')]
            query = query.filter(~AuditLog.action.in_(excluded))
        if status:
            query = query.filter(AuditLog.status == status)
        if start_date:
            query = query.filter(AuditLog.timestamp >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.filter(AuditLog.timestamp <= datetime.fromisoformat(end_date))
        
        # Get total count
        total = query.count()
        total_pages = (total + per_page - 1) // per_page
        
        # Get paginated results
        audit_logs = query.order_by(AuditLog.timestamp.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Format results
        logs = []
        for log in audit_logs.items:
            logs.append({
                'id': log.id,
                'user_id': log.user_id,
                'user_name': log.user.full_name if log.user else 'Unknown',
                'action': log.action,
                'resource_type': log.resource_type,
                'resource_id': log.resource_id,
                'resource_name': log.resource_name,
                'old_values': json.loads(log.old_values) if log.old_values else None,
                'new_values': json.loads(log.new_values) if log.new_values else None,
                'ip_address': log.ip_address,
                'user_agent': log.user_agent,
                'request_method': log.request_method,
                'request_url': log.request_url,
                'timestamp': log.timestamp.isoformat() if log.timestamp else None,
                'status': log.status,
                'error_message': log.error_message,
                'duration_ms': log.duration_ms
            })
        
        return jsonify({
            'success': True,
            'logs': logs,
            'total': total,
            'total_pages': total_pages,
            'current_page': page
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to load audit logs: {str(e)}'
        }), 500

@settings_extended_bp.route('/audit-logs/export', methods=['GET'])
@jwt_required()
def export_audit_logs():
    """Export audit logs to CSV - REAL DATA"""
    try:
        # Get filters (same as get_audit_logs)
        user_id = request.args.get('user_id', type=int)
        action = request.args.get('action')
        resource_type = request.args.get('resource_type')
        status = request.args.get('status')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Build query - EXCLUDE ADMIN USERS
        query = AuditLog.query.join(User, AuditLog.user_id == User.id).filter(
            User.username != 'admin'  # Exclude admin
        )
        
        # Apply filters
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if action:
            query = query.filter(AuditLog.action == action)
        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)
        if status:
            query = query.filter(AuditLog.status == status)
        if start_date:
            query = query.filter(AuditLog.timestamp >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.filter(AuditLog.timestamp <= datetime.fromisoformat(end_date))
        
        # Get all results (no pagination for export)
        audit_logs = query.order_by(AuditLog.timestamp.desc()).all()
        
        # Build CSV
        csv_content = "ID,Timestamp,User,Action,Resource Type,Resource ID,Status,IP Address,Duration (ms)\n"
        
        for log in audit_logs:
            timestamp = log.timestamp.strftime('%Y-%m-%d %H:%M:%S') if log.timestamp else ''
            user_name = log.user.full_name if log.user else 'Unknown'
            csv_content += f"{log.id},{timestamp},{user_name},{log.action},{log.resource_type},{log.resource_id or ''},{log.status},{log.ip_address or ''},{log.duration_ms or ''}\n"
        
        from flask import Response
        return Response(
            csv_content,
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment; filename=audit_logs_{get_local_now().strftime("%Y%m%d_%H%M%S")}.csv'}
        )
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to export audit logs: {str(e)}'
        }), 500

# Backup Management - MOVED TO routes/backup.py
# All backup endpoints are now handled by the dedicated backup blueprint
