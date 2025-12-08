"""
Audit Trail Middleware
Tracks all user activities except admin
"""
from flask import request, g
from functools import wraps
from models import db, User
from models.settings_extended import AuditLog
from datetime import datetime
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
import json
import time

def should_track_request():
    """Determine if request should be tracked"""
    # Skip certain paths
    skip_paths = [
        '/api/auth/login',
        '/api/auth/logout',
        '/api/auth/refresh',
        '/api/system/metrics',
        '/static/',
        '/favicon.ico'
    ]
    
    for path in skip_paths:
        if request.path.startswith(path):
            return False
    
    return True

def get_user_info():
    """Get current user information"""
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        
        if user_id:
            user = User.query.get(user_id)
            if user:
                # Skip tracking for admin users
                if user.username == 'admin' or (hasattr(user, 'role') and user.role == 'admin'):
                    return None, True  # user_id, is_admin
                return user_id, False
        return None, False
    except:
        return None, False

def determine_action(method, path):
    """Determine action type from HTTP method and path"""
    if method == 'GET':
        if '/list' in path or '/all' in path:
            return 'list'
        return 'view'
    elif method == 'POST':
        return 'create'
    elif method == 'PUT' or method == 'PATCH':
        return 'update'
    elif method == 'DELETE':
        return 'delete'
    return 'other'

def determine_resource_type(path):
    """Extract resource type from path"""
    # Remove /api/ prefix
    if path.startswith('/api/'):
        path = path[5:]
    
    # Extract first segment as resource type
    segments = path.split('/')
    if segments:
        return segments[0]
    return 'unknown'

def log_audit_trail(user_id, action, resource_type, resource_id=None, resource_name=None, 
                   old_values=None, new_values=None, status='success', error_message=None, duration_ms=None):
    """Log audit trail entry"""
    try:
        audit_log = AuditLog(
            user_id=user_id,
            session_id=request.cookies.get('session_id'),
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            resource_name=resource_name,
            old_values=json.dumps(old_values) if old_values else None,
            new_values=json.dumps(new_values) if new_values else None,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            request_method=request.method,
            request_url=request.url,
            status=status,
            error_message=error_message,
            duration_ms=duration_ms,
            timestamp=datetime.utcnow()
        )
        db.session.add(audit_log)
        db.session.commit()
    except Exception as e:
        print(f"Error logging audit trail: {e}")
        db.session.rollback()

def track_request():
    """Middleware to track all requests"""
    # Check if should track
    if not should_track_request():
        return
    
    # Get user info
    user_id, is_admin = get_user_info()
    
    # Skip if admin
    if is_admin:
        return
    
    # Only track if user is logged in
    if not user_id:
        return
    
    # Store start time
    g.start_time = time.time()
    g.user_id = user_id

def log_response(response):
    """Log response after request completes"""
    # Check if tracking is enabled for this request
    if not hasattr(g, 'user_id'):
        return response
    
    try:
        # Calculate duration
        duration_ms = None
        if hasattr(g, 'start_time'):
            duration_ms = int((time.time() - g.start_time) * 1000)
        
        # Determine action and resource
        action = determine_action(request.method, request.path)
        resource_type = determine_resource_type(request.path)
        
        # Get request data
        request_data = None
        if request.method in ['POST', 'PUT', 'PATCH']:
            try:
                request_data = request.get_json(silent=True)
            except:
                pass
        
        # Determine status
        status = 'success' if response.status_code < 400 else 'failed'
        
        # Extract resource info from response
        resource_id = None
        resource_name = None
        
        try:
            if response.is_json:
                response_data = response.get_json()
                if isinstance(response_data, dict):
                    # Try to extract ID and name from common patterns
                    for id_key in ['id', 'order_id', 'product_id', 'customer_id', 'user_id']:
                        if id_key in response_data:
                            resource_id = response_data[id_key]
                            break
                    
                    for name_key in ['name', 'order_number', 'code', 'title']:
                        if name_key in response_data:
                            resource_name = response_data[name_key]
                            break
        except:
            pass
        
        # Log audit trail
        log_audit_trail(
            user_id=g.user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            resource_name=resource_name,
            old_values=None,  # Could be enhanced to track old values
            new_values=request_data,
            status=status,
            error_message=None if status == 'success' else f'HTTP {response.status_code}',
            duration_ms=duration_ms
        )
    except Exception as e:
        print(f"Error in log_response: {e}")
    
    return response

def init_audit_middleware(app):
    """Initialize audit middleware"""
    app.before_request(track_request)
    app.after_request(log_response)
