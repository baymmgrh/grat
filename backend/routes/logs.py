from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
import os
from datetime import datetime
from utils.timezone import get_local_now, get_local_today

logs_bp = Blueprint('logs', __name__)

@logs_bp.route('/frontend', methods=['POST'])
def receive_frontend_logs():
    """Receive and store frontend error logs"""
    try:
        # Optional auth - log user if authenticated
        user_id = None
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except:
            pass
        
        data = request.get_json()
        logs = data.get('logs', [])
        
        if not logs:
            return jsonify({'message': 'No logs to process'}), 200
        
        # Create logs directory if needed
        log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
        
        frontend_log = os.path.join(log_dir, 'frontend.log')
        
        # Write logs to file
        with open(frontend_log, 'a', encoding='utf-8') as f:
            for log in logs:
                timestamp = log.get('timestamp', get_local_now().isoformat())
                log_type = log.get('type', 'error').upper()
                message = log.get('message', '')
                url = log.get('url', '')
                stack = log.get('stack', '')
                log_user = log.get('userId') or user_id or 'anonymous'
                
                f.write(f'[{timestamp}] {log_type} [User:{log_user}] {url}\n')
                f.write(f'  Message: {message}\n')
                if stack:
                    f.write(f'  Stack: {stack[:500]}\n')
                f.write('\n')
        
        return jsonify({'message': f'Logged {len(logs)} entries'}), 200
        
    except Exception as e:
        current_app.logger.error(f'Error saving frontend logs: {e}')
        return jsonify({'error': str(e)}), 500


@logs_bp.route('/view', methods=['GET'])
@jwt_required()
def view_logs():
    """View recent logs (admin only)"""
    try:
        from models.user import User
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user or not (user.is_admin or user.is_super_admin):
            return jsonify({'error': 'Admin access required'}), 403
        
        log_type = request.args.get('type', 'error')  # error, access, app, frontend
        lines = int(request.args.get('lines', 100))
        
        log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
        log_file = os.path.join(log_dir, f'{log_type}.log')
        
        if not os.path.exists(log_file):
            return jsonify({'logs': [], 'message': 'Log file not found'}), 200
        
        # Read last N lines
        with open(log_file, 'r', encoding='utf-8') as f:
            all_lines = f.readlines()
            recent_lines = all_lines[-lines:] if len(all_lines) > lines else all_lines
        
        return jsonify({
            'logs': recent_lines,
            'total_lines': len(all_lines),
            'showing': len(recent_lines)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
