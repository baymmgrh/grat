"""
Audit Trail Middleware
Tracks all user activities except admin
"""
from flask import request, g, current_app
from functools import wraps
from models import db, User
from models.settings_extended import AuditLog
from datetime import datetime
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
import json
import time
import traceback

def should_track_request():
    """Determine if request should be tracked"""
    # Skip certain paths
    skip_paths = [
        '/api/auth/login',
        '/api/auth/logout',
        '/api/auth/refresh',
        '/api/system/metrics',
        '/api/notifications',
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
        # Skip JWT verification for OPTIONS requests (CORS preflight)
        if request.method == 'OPTIONS':
            return None, False
        
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        
        if user_id:
            # Convert to int if string
            if isinstance(user_id, str):
                user_id = int(user_id)
            
            user = User.query.get(user_id)
            if user:
                # Skip tracking for admin users
                if user.username == 'admin' or (hasattr(user, 'role') and user.role == 'admin'):
                    return None, True  # user_id, is_admin
                return user_id, False
        return None, False
    except Exception as e:
        # Silently handle JWT errors for unauthenticated requests
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
    # Reset g values at start of each request to prevent stale data
    g.user_id = None
    g.start_time = None
    
    # Check if should track
    if not should_track_request():
        return
    
    # Get user info - fresh for each request
    user_id, is_admin = get_user_info()
    
    # Skip if admin
    if is_admin:
        return
    
    # Only track if user is logged in
    if not user_id:
        return
    
    # Store start time and user_id for this request
    g.start_time = time.time()
    g.user_id = user_id

def log_response(response):
    """Log response after request completes"""
    # Check if tracking is enabled for this request
    if not hasattr(g, 'user_id') or g.user_id is None:
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
        
        # Try to get resource_id from URL path (e.g., /api/production/work-orders/123)
        path_parts = request.path.split('/')
        for i, part in enumerate(path_parts):
            if part.isdigit():
                resource_id = part
                break
        
        try:
            if response.is_json:
                response_data = response.get_json()
                if isinstance(response_data, dict):
                    # Try to extract ID and name from common patterns
                    for id_key in ['id', 'order_id', 'product_id', 'customer_id', 'user_id', 'wo_id']:
                        if id_key in response_data and not resource_id:
                            resource_id = response_data[id_key]
                            break
                    
                    for name_key in ['wo_number', 'name', 'order_number', 'code', 'title', 'machine_name', 'product_name']:
                        if name_key in response_data:
                            resource_name = response_data[name_key]
                            break
                    
                    # For work orders, try to get more specific info
                    if 'work-orders' in request.path or 'work_order' in request.path:
                        if 'wo_number' in response_data:
                            resource_name = f"WO: {response_data['wo_number']}"
                        elif 'work_order' in response_data and isinstance(response_data['work_order'], dict):
                            wo = response_data['work_order']
                            resource_name = f"WO: {wo.get('wo_number', '')}"
                            if not resource_id:
                                resource_id = wo.get('id')
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


def audit_log_action(action, resource_type, get_resource_id=None, get_resource_name=None, get_old_values=None):
    """
    Decorator for detailed audit logging with old values tracking.
    
    Usage:
        @audit_log_action('update', 'work_order', 
                          get_resource_id=lambda: request.view_args.get('id'),
                          get_resource_name=lambda wo: wo.wo_number,
                          get_old_values=lambda wo: {'status': wo.status, 'quantity': wo.quantity_target})
        def update_work_order(id):
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            start_time = time.time()
            user_id = None
            old_values = None
            resource_id = None
            resource_name = None
            
            try:
                # Get user info
                verify_jwt_in_request(optional=True)
                user_id = get_jwt_identity()
                
                # Skip if admin
                if user_id:
                    user = User.query.get(user_id)
                    if user and (user.username == 'admin' or (hasattr(user, 'role') and user.role == 'admin')):
                        return f(*args, **kwargs)
                
                # Get resource ID
                if get_resource_id:
                    resource_id = get_resource_id()
                
                # Get old values before update (for update/delete actions)
                if get_old_values and action in ['update', 'delete'] and resource_id:
                    try:
                        # This function should return the model instance
                        old_values = get_old_values(resource_id)
                    except Exception as e:
                        print(f"Error getting old values: {e}")
                
            except Exception as e:
                print(f"Error in audit pre-processing: {e}")
            
            # Execute the actual function
            result = f(*args, **kwargs)
            
            # Log after execution
            try:
                if user_id:
                    duration_ms = int((time.time() - start_time) * 1000)
                    
                    # Get new values from request
                    new_values = None
                    if request.method in ['POST', 'PUT', 'PATCH']:
                        try:
                            new_values = request.get_json(silent=True)
                        except:
                            pass
                    
                    # Determine status from response
                    status = 'success'
                    if hasattr(result, 'status_code') and result.status_code >= 400:
                        status = 'failed'
                    elif isinstance(result, tuple) and len(result) > 1 and result[1] >= 400:
                        status = 'failed'
                    
                    # Get resource name from response if available
                    if get_resource_name and not resource_name:
                        try:
                            if hasattr(result, 'get_json'):
                                resp_data = result.get_json()
                                if isinstance(resp_data, dict):
                                    resource_name = resp_data.get('wo_number') or resp_data.get('name') or resp_data.get('code')
                        except:
                            pass
                    
                    log_audit_trail(
                        user_id=user_id,
                        action=action,
                        resource_type=resource_type,
                        resource_id=resource_id,
                        resource_name=resource_name,
                        old_values=old_values,
                        new_values=new_values,
                        status=status,
                        duration_ms=duration_ms
                    )
            except Exception as e:
                print(f"Error in audit post-processing: {e}")
                traceback.print_exc()
            
            return result
        return decorated_function
    return decorator
