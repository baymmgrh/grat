"""
Custom BOM Routes - Edit BOM per transaction without affecting master BOM
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.custom_bom import CustomBOM, CustomBOMItem
from models.production import BillOfMaterials

custom_bom_bp = Blueprint('custom_bom', __name__)


@custom_bom_bp.route('/custom-boms', methods=['GET'])
@jwt_required()
def get_custom_boms():
    """Get custom BOMs with optional filtering"""
    try:
        reference_type = request.args.get('reference_type')
        reference_id = request.args.get('reference_id', type=int)
        product_id = request.args.get('product_id', type=int)
        
        query = CustomBOM.query.filter_by(is_active=True)
        
        if reference_type:
            query = query.filter_by(reference_type=reference_type)
        if reference_id:
            query = query.filter_by(reference_id=reference_id)
        if product_id:
            query = query.filter_by(product_id=product_id)
        
        custom_boms = query.order_by(CustomBOM.created_at.desc()).all()
        
        return jsonify({
            'custom_boms': [bom.to_dict() for bom in custom_boms]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@custom_bom_bp.route('/custom-boms/<int:id>', methods=['GET'])
@jwt_required()
def get_custom_bom(id):
    """Get single custom BOM detail"""
    try:
        custom_bom = CustomBOM.query.get_or_404(id)
        return jsonify({'custom_bom': custom_bom.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@custom_bom_bp.route('/custom-boms/create-from-master', methods=['POST'])
@jwt_required()
def create_custom_bom_from_master():
    """Create a custom BOM by copying from master BOM"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        master_bom_id = data.get('master_bom_id')
        reference_type = data.get('reference_type')  # sales_order, schedule, forecast, work_order
        reference_id = data.get('reference_id')
        
        if not all([master_bom_id, reference_type, reference_id]):
            return jsonify({'error': 'master_bom_id, reference_type, and reference_id are required'}), 400
        
        # Check if custom BOM already exists for this reference
        existing = CustomBOM.query.filter_by(
            reference_type=reference_type,
            reference_id=reference_id,
            is_active=True
        ).first()
        
        if existing:
            return jsonify({
                'message': 'Custom BOM already exists for this reference',
                'custom_bom': existing.to_dict()
            }), 200
        
        # Create custom BOM from master
        custom_bom = CustomBOM.create_from_master(
            master_bom_id=master_bom_id,
            reference_type=reference_type,
            reference_id=reference_id,
            created_by=user_id
        )
        
        if not custom_bom:
            return jsonify({'error': 'Master BOM not found'}), 404
        
        db.session.commit()
        
        return jsonify({
            'message': 'Custom BOM created successfully',
            'custom_bom': custom_bom.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@custom_bom_bp.route('/custom-boms/<int:id>/items', methods=['PUT'])
@jwt_required()
def update_custom_bom_items(id):
    """Update custom BOM items"""
    try:
        custom_bom = CustomBOM.query.get_or_404(id)
        data = request.get_json()
        items = data.get('items', [])
        
        for item_data in items:
            item_id = item_data.get('id')
            
            if item_id:
                # Update existing item
                item = CustomBOMItem.query.get(item_id)
                if item and item.custom_bom_id == id:
                    if 'quantity' in item_data:
                        item.quantity = item_data['quantity']
                        item.is_modified = True
                    if 'scrap_percent' in item_data:
                        item.scrap_percent = item_data['scrap_percent']
                        item.is_modified = True
                    if 'is_critical' in item_data:
                        item.is_critical = item_data['is_critical']
                    if 'is_removed' in item_data:
                        item.is_removed = item_data['is_removed']
                    if 'modification_reason' in item_data:
                        item.modification_reason = item_data['modification_reason']
                    if 'notes' in item_data:
                        item.notes = item_data['notes']
            else:
                # Add new item
                max_line = db.session.query(db.func.max(CustomBOMItem.line_number)).filter_by(
                    custom_bom_id=id
                ).scalar() or 0
                
                new_item = CustomBOMItem(
                    custom_bom_id=id,
                    line_number=max_line + 1,
                    item_type=item_data.get('item_type', 'raw_materials'),
                    item_code=item_data.get('item_code', ''),
                    item_name=item_data.get('item_name', ''),
                    material_id=item_data.get('material_id'),
                    quantity=item_data.get('quantity', 0),
                    uom=item_data.get('uom', 'pcs'),
                    scrap_percent=item_data.get('scrap_percent', 0),
                    is_critical=item_data.get('is_critical', False),
                    is_added=True,
                    unit_cost=item_data.get('unit_cost', 0),
                    notes=item_data.get('notes')
                )
                db.session.add(new_item)
        
        # Update BOM header if provided
        if 'batch_size' in data:
            custom_bom.batch_size = data['batch_size']
        if 'pack_per_carton' in data:
            custom_bom.pack_per_carton = data['pack_per_carton']
        if 'notes' in data:
            custom_bom.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Custom BOM updated successfully',
            'custom_bom': custom_bom.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@custom_bom_bp.route('/custom-boms/<int:id>/items/<int:item_id>', methods=['DELETE'])
@jwt_required()
def remove_custom_bom_item(id, item_id):
    """Mark a custom BOM item as removed (soft delete)"""
    try:
        item = CustomBOMItem.query.get_or_404(item_id)
        
        if item.custom_bom_id != id:
            return jsonify({'error': 'Item does not belong to this custom BOM'}), 400
        
        if item.is_added:
            # If item was added (not from master), hard delete
            db.session.delete(item)
        else:
            # If item was from master, soft delete
            item.is_removed = True
        
        db.session.commit()
        
        return jsonify({'message': 'Item removed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@custom_bom_bp.route('/custom-boms/<int:id>/reset', methods=['POST'])
@jwt_required()
def reset_custom_bom(id):
    """Reset custom BOM to match master BOM"""
    try:
        custom_bom = CustomBOM.query.get_or_404(id)
        
        if not custom_bom.master_bom_id:
            return jsonify({'error': 'No master BOM linked'}), 400
        
        # Delete all current items
        CustomBOMItem.query.filter_by(custom_bom_id=id).delete()
        
        # Re-copy from master
        master = BillOfMaterials.query.get(custom_bom.master_bom_id)
        if master:
            custom_bom.batch_size = master.batch_size
            custom_bom.batch_uom = master.batch_uom
            custom_bom.pack_per_carton = master.pack_per_carton
            
            for master_item in master.items:
                custom_item = CustomBOMItem(
                    custom_bom_id=id,
                    line_number=master_item.line_number,
                    item_type=master_item.item_type,
                    item_code=master_item.item_code,
                    item_name=master_item.item_name,
                    material_id=master_item.material_id,
                    quantity=master_item.quantity,
                    uom=master_item.uom,
                    scrap_percent=master_item.scrap_percent,
                    is_critical=master_item.is_critical,
                    unit_cost=master_item.unit_cost,
                    notes=master_item.notes
                )
                db.session.add(custom_item)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Custom BOM reset to master',
            'custom_bom': custom_bom.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@custom_bom_bp.route('/custom-boms/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_custom_bom(id):
    """Soft delete custom BOM"""
    try:
        custom_bom = CustomBOM.query.get_or_404(id)
        custom_bom.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Custom BOM deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
