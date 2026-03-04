"""
Email Notification Routes
=========================
API endpoints for sending email notifications.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.email_service import get_email_service
from models import User

notifications_email_bp = Blueprint('notifications_email', __name__)


@notifications_email_bp.route('/status', methods=['GET'])
@jwt_required()
def get_email_status():
    """Check if email service is configured"""
    email_service = get_email_service()
    return jsonify({
        'configured': email_service.is_configured(),
        'from_email': email_service.from_email if email_service.is_configured() else None
    }), 200


@notifications_email_bp.route('/test', methods=['POST'])
@jwt_required()
def send_test_email():
    """Send a test email to current user"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        email_service = get_email_service()
        
        if not email_service.is_configured():
            return jsonify({'error': 'Email service not configured. Set RESEND_API_KEY in .env'}), 503
        
        result = email_service.send_custom_notification(
            to=user.email,
            subject='Test Email - ERP System',
            title='🧪 Test Email',
            message='This is a test email from your ERP system. If you received this, email notifications are working correctly!',
            button_text='Go to Dashboard',
            button_url=email_service.app_url + '/app/dashboard',
            box_type='success'
        )
        
        if result.get('error'):
            return jsonify({'error': result['error']}), 500
        
        return jsonify({
            'message': f'Test email sent to {user.email}',
            'email_id': result.get('id')
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@notifications_email_bp.route('/send', methods=['POST'])
@jwt_required()
def send_notification():
    """Send custom email notification"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['to', 'subject', 'title', 'message']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        email_service = get_email_service()
        
        if not email_service.is_configured():
            return jsonify({'error': 'Email service not configured'}), 503
        
        result = email_service.send_custom_notification(
            to=data['to'],
            subject=data['subject'],
            title=data['title'],
            message=data['message'],
            button_text=data.get('button_text'),
            button_url=data.get('button_url'),
            box_type=data.get('box_type', 'info')
        )
        
        if result.get('error'):
            return jsonify({'error': result['error']}), 500
        
        return jsonify({
            'message': 'Email sent successfully',
            'email_id': result.get('id')
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@notifications_email_bp.route('/low-stock-alert', methods=['POST'])
@jwt_required()
def send_low_stock_alert():
    """Send low stock alert email"""
    try:
        data = request.get_json()
        
        if not data.get('to'):
            return jsonify({'error': 'Recipient email(s) required'}), 400
        
        if not data.get('items') or len(data['items']) == 0:
            return jsonify({'error': 'Items list required'}), 400
        
        email_service = get_email_service()
        
        if not email_service.is_configured():
            return jsonify({'error': 'Email service not configured'}), 503
        
        result = email_service.send_low_stock_alert(
            to=data['to'],
            items=data['items']
        )
        
        if result.get('error'):
            return jsonify({'error': result['error']}), 500
        
        return jsonify({
            'message': 'Low stock alert sent',
            'email_id': result.get('id')
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@notifications_email_bp.route('/approval-request', methods=['POST'])
@jwt_required()
def send_approval_request():
    """Send approval request email"""
    try:
        data = request.get_json()
        
        required = ['to', 'approver_name', 'request_type', 'request_number', 'requester', 'description']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        email_service = get_email_service()
        
        if not email_service.is_configured():
            return jsonify({'error': 'Email service not configured'}), 503
        
        result = email_service.send_approval_request(
            to=data['to'],
            approver_name=data['approver_name'],
            request_type=data['request_type'],
            request_number=data['request_number'],
            requester=data['requester'],
            description=data['description'],
            amount=data.get('amount')
        )
        
        if result.get('error'):
            return jsonify({'error': result['error']}), 500
        
        return jsonify({
            'message': 'Approval request email sent',
            'email_id': result.get('id')
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@notifications_email_bp.route('/order-confirmation', methods=['POST'])
@jwt_required()
def send_order_confirmation():
    """Send order confirmation email"""
    try:
        data = request.get_json()
        
        required = ['to', 'order_number', 'customer_name', 'items', 'total']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        email_service = get_email_service()
        
        if not email_service.is_configured():
            return jsonify({'error': 'Email service not configured'}), 503
        
        result = email_service.send_order_confirmation(
            to=data['to'],
            order_number=data['order_number'],
            customer_name=data['customer_name'],
            items=data['items'],
            total=data['total']
        )
        
        if result.get('error'):
            return jsonify({'error': result['error']}), 500
        
        return jsonify({
            'message': 'Order confirmation email sent',
            'email_id': result.get('id')
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
