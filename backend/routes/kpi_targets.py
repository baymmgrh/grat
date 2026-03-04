from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, KPITarget, seed_kpi_targets
from datetime import datetime
from utils.timezone import get_local_now, get_local_today

kpi_targets_bp = Blueprint('kpi_targets', __name__)


@kpi_targets_bp.route('', methods=['GET'])
@jwt_required()
def get_kpi_targets():
    """Get all KPI targets"""
    try:
        targets = KPITarget.query.filter_by(is_active=True).order_by(KPITarget.category, KPITarget.kpi_name).all()
        
        # Group by category
        grouped = {}
        for target in targets:
            if target.category not in grouped:
                grouped[target.category] = []
            grouped[target.category].append(target.to_dict())
        
        return jsonify({
            'success': True,
            'data': {
                'targets': [t.to_dict() for t in targets],
                'grouped': grouped,
                'total': len(targets)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@kpi_targets_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_kpi_target(id):
    """Get single KPI target"""
    try:
        target = KPITarget.query.get(id)
        if not target:
            return jsonify({'success': False, 'error': 'KPI target not found'}), 404
        
        return jsonify({
            'success': True,
            'data': target.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@kpi_targets_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_kpi_target(id):
    """Update KPI target"""
    try:
        target = KPITarget.query.get(id)
        if not target:
            return jsonify({'success': False, 'error': 'KPI target not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'target_value' in data:
            target.target_value = data['target_value']
        if 'warning_threshold' in data:
            target.warning_threshold = data['warning_threshold']
        if 'critical_threshold' in data:
            target.critical_threshold = data['critical_threshold']
        if 'description' in data:
            target.description = data['description']
        if 'is_active' in data:
            target.is_active = data['is_active']
        if 'period_type' in data:
            target.period_type = data['period_type']
        
        target.updated_at = get_local_now()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'KPI target updated successfully',
            'data': target.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@kpi_targets_bp.route('', methods=['POST'])
@jwt_required()
def create_kpi_target():
    """Create new KPI target"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['kpi_code', 'kpi_name', 'category', 'target_value', 'unit']
        for field in required:
            if field not in data:
                return jsonify({'success': False, 'error': f'{field} is required'}), 400
        
        # Check if kpi_code already exists
        existing = KPITarget.query.filter_by(kpi_code=data['kpi_code']).first()
        if existing:
            return jsonify({'success': False, 'error': 'KPI code already exists'}), 400
        
        user_id = get_jwt_identity()
        
        target = KPITarget(
            kpi_code=data['kpi_code'],
            kpi_name=data['kpi_name'],
            category=data['category'],
            target_value=data['target_value'],
            unit=data['unit'],
            warning_threshold=data.get('warning_threshold', 80),
            critical_threshold=data.get('critical_threshold', 60),
            description=data.get('description'),
            period_type=data.get('period_type', 'monthly'),
            created_by=int(user_id) if user_id else None
        )
        
        db.session.add(target)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'KPI target created successfully',
            'data': target.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@kpi_targets_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_kpi_target(id):
    """Delete KPI target (soft delete)"""
    try:
        target = KPITarget.query.get(id)
        if not target:
            return jsonify({'success': False, 'error': 'KPI target not found'}), 404
        
        target.is_active = False
        target.updated_at = get_local_now()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'KPI target deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@kpi_targets_bp.route('/seed', methods=['POST'])
@jwt_required()
def seed_defaults():
    """Seed default KPI targets"""
    try:
        seed_kpi_targets()
        return jsonify({
            'success': True,
            'message': 'Default KPI targets seeded successfully'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@kpi_targets_bp.route('/by-code/<string:code>', methods=['GET'])
@jwt_required()
def get_kpi_by_code(code):
    """Get KPI target by code"""
    try:
        target = KPITarget.query.filter_by(kpi_code=code, is_active=True).first()
        if not target:
            return jsonify({'success': False, 'error': 'KPI target not found'}), 404
        
        return jsonify({
            'success': True,
            'data': target.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
