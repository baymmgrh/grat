import logging
import os
from datetime import datetime
from logging.handlers import RotatingFileHandler

def setup_logging(app):
    """Setup application logging to file"""
    
    # Create logs directory if it doesn't exist
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # Log file paths
    error_log = os.path.join(log_dir, 'error.log')
    access_log = os.path.join(log_dir, 'access.log')
    app_log = os.path.join(log_dir, 'app.log')
    
    # Format for log messages
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    detailed_formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s [%(name)s:%(lineno)d] - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Error log handler (errors and exceptions)
    error_handler = RotatingFileHandler(
        error_log,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(detailed_formatter)
    
    # App log handler (info and above)
    app_handler = RotatingFileHandler(
        app_log,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    app_handler.setLevel(logging.INFO)
    app_handler.setFormatter(formatter)
    
    # Access log handler (requests)
    access_handler = RotatingFileHandler(
        access_log,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    access_handler.setLevel(logging.INFO)
    access_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    ))
    
    # Add handlers to app logger
    app.logger.addHandler(error_handler)
    app.logger.addHandler(app_handler)
    app.logger.setLevel(logging.INFO)
    
    # Create access logger
    access_logger = logging.getLogger('access')
    access_logger.addHandler(access_handler)
    access_logger.setLevel(logging.INFO)
    
    # Also log to console in development
    if app.debug:
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.DEBUG)
        console_handler.setFormatter(formatter)
        app.logger.addHandler(console_handler)
    
    return app.logger, access_logger


def log_request(access_logger):
    """Middleware to log all requests"""
    from flask import request, g
    import time
    
    def before_request():
        g.start_time = time.time()
    
    def after_request(response):
        # Check if start_time exists and is not None
        start_time = getattr(g, 'start_time', None)
        if start_time is not None:
            duration = (time.time() - start_time) * 1000  # ms
            
            # Get user info if available
            user_info = ''
            try:
                from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
                verify_jwt_in_request(optional=True)
                user_id = get_jwt_identity()
                if user_id:
                    user_info = f' [User:{user_id}]'
            except:
                pass
            
            # Log the request
            log_msg = f'{request.remote_addr}{user_info} - "{request.method} {request.path}" {response.status_code} {duration:.2f}ms'
            
            if response.status_code >= 400:
                access_logger.warning(log_msg)
            else:
                access_logger.info(log_msg)
        
        return response
    
    return before_request, after_request


def log_exception(app_logger):
    """Log unhandled exceptions"""
    from flask import request
    import traceback
    
    def handle_exception(e):
        # Log the full traceback
        tb = traceback.format_exc()
        app_logger.error(f'Unhandled Exception on {request.method} {request.path}:\n{tb}')
        
        # Return error response
        from flask import jsonify
        return jsonify({
            'error': 'Internal server error',
            'message': str(e) if app_logger.level <= logging.DEBUG else 'An unexpected error occurred'
        }), 500
    
    return handle_exception
