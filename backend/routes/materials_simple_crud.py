from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Material, Inventory
from datetime import datetime

materials_simple_crud_bp = Blueprint('materials_simple_crud', __name__)

@materials_simple_crud_bp.route('/<int:material_id>/force-delete', methods=['DELETE'])
@jwt_required()
def force_delete_material(material_id):
    """Force delete material - using raw SQL to bypass relationships"""
    try:
        # Get material info first
        material = Material.query.get_or_404(material_id)
        material_name = material.name
        material_code = material.code
        
        # Use raw SQL to delete without triggering relationships
        db.session.execute(db.text("DELETE FROM materials WHERE id = :id"), {"id": material_id})
        db.session.commit()
        
        return jsonify({
            'message': f'Material {material_code} - {material_name} deleted successfully (force delete)',
            'material_id': material_id,
            'can_delete': True
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@materials_simple_crud_bp.route('/<int:material_id>/simple-delete', methods=['DELETE'])
@jwt_required()
def simple_delete_material(material_id):
    """Simple delete material - only check inventory"""
    try:
        material = Material.query.get_or_404(material_id)
        
        # Only check if material is used in inventory
        inventory_count = db.session.query(Inventory).filter_by(material_id=material_id).count()
        if inventory_count > 0:
            return jsonify({
                'error': 'Cannot delete material. It has inventory records.',
                'inventory_count': inventory_count,
                'can_delete': False
            }), 400
        
        # Safe to delete
        material_name = material.name
        material_code = material.code
        
        db.session.delete(material)
        db.session.commit()
        
        return jsonify({
            'message': f'Material {material_code} - {material_name} deleted successfully',
            'material_id': material_id,
            'can_delete': True
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
