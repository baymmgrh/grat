"""
BOM Management Routes with Versioning
Handles BOM CRUD operations, versioning, and history tracking
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Product, Material, BillOfMaterials, BOMItem, User
from models.bom_history import BOMHistory, BOMImportLog
from utils import generate_number
from utils.i18n import success_response, error_response
from datetime import datetime, date
from sqlalchemy import or_, desc
from utils.timezone import get_local_now, get_local_today

bom_management_bp = Blueprint('bom_management', __name__)

@bom_management_bp.route('/boms', methods=['GET'])
@jwt_required()
def get_boms():
    """Get all BOMs with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        product_id = request.args.get('product_id', type=int)
        is_active = request.args.get('is_active', type=str)
        
        # Build query
        query = BillOfMaterials.query
        
        # Filter by product
        if product_id:
            query = query.filter_by(product_id=product_id)
        
        # Filter by active status
        if is_active == 'true':
            query = query.filter_by(is_active=True)
        elif is_active == 'false':
            query = query.filter_by(is_active=False)
        
        # Search
        if search:
            query = query.join(Product).filter(
                or_(
                    BillOfMaterials.bom_number.ilike(f'%{search}%'),
                    Product.code.ilike(f'%{search}%'),
                    Product.name.ilike(f'%{search}%')
                )
            )
        
        # Order by created date (newest first)
        query = query.order_by(desc(BillOfMaterials.created_at))
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        boms = []
        for bom in pagination.items:
            boms.append({
                'id': bom.id,
                'bom_number': bom.bom_number,
                'product_id': bom.product_id,
                'product_code': bom.product.code if bom.product else None,
                'product_name': bom.product.name if bom.product else None,
                'version': bom.version,
                'is_active': bom.is_active,
                'effective_date': bom.effective_date.isoformat() if bom.effective_date else None,
                'expiry_date': bom.expiry_date.isoformat() if bom.expiry_date else None,
                'batch_size': float(bom.batch_size),
                'batch_uom': bom.batch_uom,
                'total_materials': bom.total_materials,
                'total_cost': float(bom.total_cost) if bom.total_cost else 0,
                'created_by': bom.created_by_user.full_name if bom.created_by_user else None,
                'approved_by': bom.approved_by_user.full_name if bom.approved_by_user else None,
                'approved_at': bom.approved_at.isoformat() if bom.approved_at else None,
                'created_at': bom.created_at.isoformat() if bom.created_at else None,
                'updated_at': bom.updated_at.isoformat() if bom.updated_at else None
            })
        
        return jsonify({
            'boms': boms,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return error_response(str(e), 500)

@bom_management_bp.route('/boms/<int:bom_id>', methods=['GET'])
@jwt_required()
def get_bom_detail(bom_id):
    """Get detailed BOM with all items"""
    try:
        bom = BillOfMaterials.query.get(bom_id)
        if not bom:
            return error_response('BOM not found', 404)
        
        # Get BOM items
        items = []
        for item in bom.items:
            items.append({
                'id': item.id,
                'line_number': item.line_number,
                'material_id': item.material_id,
                'material_code': item.material.code if item.material else None,
                'material_name': item.material.name if item.material else None,
                'quantity': float(item.quantity),
                'uom': item.uom,
                'scrap_percent': float(item.scrap_percent) if item.scrap_percent else 0,
                'unit_cost': float(item.unit_cost) if item.unit_cost else 0,
                'total_cost': float(item.total_cost) if item.total_cost else 0,
                'percentage': float(item.percentage) if item.percentage else 0,
                'is_critical': item.is_critical,
                'supplier_id': item.supplier_id,
                'lead_time_days': item.lead_time_days,
                'notes': item.notes
            })
        
        return jsonify({
            'bom': {
                'id': bom.id,
                'bom_number': bom.bom_number,
                'product_id': bom.product_id,
                'product_code': bom.product.code if bom.product else None,
                'product_name': bom.product.name if bom.product else None,
                'version': bom.version,
                'is_active': bom.is_active,
                'effective_date': bom.effective_date.isoformat() if bom.effective_date else None,
                'expiry_date': bom.expiry_date.isoformat() if bom.expiry_date else None,
                'batch_size': float(bom.batch_size),
                'batch_uom': bom.batch_uom,
                'pack_per_carton': bom.pack_per_carton,
                'notes': bom.notes,
                'total_materials': bom.total_materials,
                'total_cost': float(bom.total_cost) if bom.total_cost else 0,
                'critical_materials': bom.critical_materials,
                'created_by': bom.created_by_user.full_name if bom.created_by_user else None,
                'approved_by': bom.approved_by_user.full_name if bom.approved_by_user else None,
                'approved_at': bom.approved_at.isoformat() if bom.approved_at else None,
                'created_at': bom.created_at.isoformat() if bom.created_at else None,
                'updated_at': bom.updated_at.isoformat() if bom.updated_at else None,
                'items': items
            }
        }), 200
        
    except Exception as e:
        return error_response(str(e), 500)

@bom_management_bp.route('/boms', methods=['POST'])
@jwt_required()
def create_bom():
    """Create new BOM"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Validate required fields
        if 'product_id' not in data:
            return error_response('Product ID is required', 400)
        
        # Check if product exists
        product = Product.query.get(data['product_id'])
        if not product:
            return error_response('Product not found', 404)
        
        # Check if active BOM exists
        existing_bom = BillOfMaterials.query.filter_by(
            product_id=data['product_id'],
            is_active=True
        ).first()
        
        if existing_bom:
            return error_response('Active BOM already exists for this product. Please deactivate it first or create a new version.', 400)
        
        # Generate BOM number
        bom_number = generate_number('BOM', BillOfMaterials, 'bom_number')
        
        # Create BOM
        bom = BillOfMaterials(
            bom_number=bom_number,
            product_id=data['product_id'],
            version=data.get('version', '1.0'),
            is_active=data.get('is_active', True),
            effective_date=datetime.fromisoformat(data['effective_date']) if data.get('effective_date') else get_local_today(),
            batch_size=data.get('batch_size', 1),
            batch_uom=data.get('batch_uom', product.primary_uom),
            pack_per_carton=data.get('pack_per_carton', 1),
            notes=data.get('notes'),
            created_by=user_id,
            created_at=get_local_now()
        )
        db.session.add(bom)
        db.session.flush()
        
        # Add BOM items
        if 'items' in data and data['items']:
            for idx, item_data in enumerate(data['items'], 1):
                bom_item = BOMItem(
                    bom_id=bom.id,
                    line_number=idx,
                    material_id=item_data.get('material_id'),
                    quantity=item_data['quantity'],
                    uom=item_data['uom'],
                    scrap_percent=item_data.get('scrap_percent', 0),
                    unit_cost=item_data.get('unit_cost', 0),
                    percentage=item_data.get('percentage', 0),
                    is_critical=item_data.get('is_critical', False),
                    supplier_id=item_data.get('supplier_id'),
                    lead_time_days=item_data.get('lead_time_days', 0),
                    notes=item_data.get('notes'),
                    created_at=get_local_now()
                )
                db.session.add(bom_item)
        
        # Create history record
        history = BOMHistory(
            bom_id=bom.id,
            version=bom.version,
            change_type='created',
            change_description='BOM created',
            changed_by=user_id,
            changed_at=get_local_now()
        )
        db.session.add(history)
        
        db.session.commit()
        
        return success_response('BOM created successfully', {
            'bom_id': bom.id,
            'bom_number': bom.bom_number,
            'version': bom.version
        }, 201)
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@bom_management_bp.route('/boms/<int:bom_id>', methods=['PUT'])
@jwt_required()
def update_bom(bom_id):
    """Update BOM - creates new version"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Get existing BOM
        old_bom = BillOfMaterials.query.get(bom_id)
        if not old_bom:
            return error_response('BOM not found', 404)
        
        # Deactivate old BOM
        old_bom.is_active = False
        old_bom.expiry_date = get_local_today()
        
        # Create history for old BOM
        old_history = BOMHistory(
            bom_id=old_bom.id,
            version=old_bom.version,
            change_type='deactivated',
            change_description='Deactivated due to update',
            changed_by=user_id,
            changed_at=get_local_now(),
            snapshot_data={
                'bom_number': old_bom.bom_number,
                'version': old_bom.version,
                'items_count': len(old_bom.items),
                'total_cost': float(old_bom.total_cost) if old_bom.total_cost else 0
            }
        )
        db.session.add(old_history)
        
        # Increment version
        version_parts = old_bom.version.split('.')
        major = int(version_parts[0])
        minor = int(version_parts[1]) if len(version_parts) > 1 else 0
        new_version = f"{major}.{minor + 1}"
        
        # Generate new BOM number
        bom_number = generate_number('BOM', BillOfMaterials, 'bom_number')
        
        # Create new BOM
        new_bom = BillOfMaterials(
            bom_number=bom_number,
            product_id=old_bom.product_id,
            version=new_version,
            is_active=True,
            effective_date=get_local_today(),
            batch_size=data.get('batch_size', old_bom.batch_size),
            batch_uom=data.get('batch_uom', old_bom.batch_uom),
            pack_per_carton=data.get('pack_per_carton', old_bom.pack_per_carton),
            notes=data.get('notes', old_bom.notes),
            created_by=user_id,
            created_at=get_local_now()
        )
        db.session.add(new_bom)
        db.session.flush()
        
        # Add BOM items
        if 'items' in data and data['items']:
            for idx, item_data in enumerate(data['items'], 1):
                bom_item = BOMItem(
                    bom_id=new_bom.id,
                    line_number=idx,
                    material_id=item_data.get('material_id'),
                    quantity=item_data['quantity'],
                    uom=item_data['uom'],
                    scrap_percent=item_data.get('scrap_percent', 0),
                    unit_cost=item_data.get('unit_cost', 0),
                    percentage=item_data.get('percentage', 0),
                    is_critical=item_data.get('is_critical', False),
                    supplier_id=item_data.get('supplier_id'),
                    lead_time_days=item_data.get('lead_time_days', 0),
                    notes=item_data.get('notes'),
                    created_at=get_local_now()
                )
                db.session.add(bom_item)
        
        # Create history for new BOM
        new_history = BOMHistory(
            bom_id=new_bom.id,
            version=new_version,
            change_type='updated',
            change_description=data.get('change_description', 'BOM updated'),
            changed_by=user_id,
            changed_at=get_local_now()
        )
        db.session.add(new_history)
        
        db.session.commit()
        
        return success_response('BOM updated successfully (new version created)', {
            'old_bom_id': old_bom.id,
            'old_version': old_bom.version,
            'new_bom_id': new_bom.id,
            'new_bom_number': new_bom.bom_number,
            'new_version': new_version
        })
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@bom_management_bp.route('/boms/<int:bom_id>', methods=['DELETE'])
@jwt_required()
def delete_bom(bom_id):
    """Delete BOM (soft delete - deactivate)"""
    try:
        user_id = get_jwt_identity()
        
        bom = BillOfMaterials.query.get(bom_id)
        if not bom:
            return error_response('BOM not found', 404)
        
        # Soft delete - deactivate
        bom.is_active = False
        bom.expiry_date = get_local_today()
        
        # Create history record
        history = BOMHistory(
            bom_id=bom.id,
            version=bom.version,
            change_type='deleted',
            change_description='BOM deleted (deactivated)',
            changed_by=user_id,
            changed_at=get_local_now()
        )
        db.session.add(history)
        
        db.session.commit()
        
        return success_response('BOM deleted successfully')
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@bom_management_bp.route('/boms/<int:bom_id>/items/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_bom_item(bom_id, item_id):
    """Delete a BOM item"""
    try:
        user_id = get_jwt_identity()
        
        # Check if BOM exists
        bom = BillOfMaterials.query.get(bom_id)
        if not bom:
            return error_response('BOM not found', 404)
        
        # Check if item exists
        item = BOMItem.query.filter_by(id=item_id, bom_id=bom_id).first()
        if not item:
            return error_response('BOM item not found', 404)
        
        # Delete the item
        db.session.delete(item)
        
        # Create history record
        history = BOMHistory(
            bom_id=bom.id,
            version=bom.version,
            change_type='item_deleted',
            change_description=f'Deleted item: {item.material.name if item.material else item.product.name}',
            changed_by=user_id,
            changed_at=get_local_now()
        )
        db.session.add(history)
        
        db.session.commit()
        
        return success_response('BOM item deleted successfully')
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@bom_management_bp.route('/boms/<int:bom_id>/history', methods=['GET'])
@jwt_required()
def get_bom_history(bom_id):
    """Get BOM version history"""
    try:
        bom = BillOfMaterials.query.get(bom_id)
        if not bom:
            return error_response('BOM not found', 404)
        
        # Get all history for this BOM
        history = BOMHistory.query.filter_by(bom_id=bom_id).order_by(desc(BOMHistory.changed_at)).all()
        
        history_data = []
        for h in history:
            history_data.append({
                'id': h.id,
                'version': h.version,
                'change_type': h.change_type,
                'change_description': h.change_description,
                'changed_by': h.changed_by_user.full_name if h.changed_by_user else None,
                'changed_at': h.changed_at.isoformat() if h.changed_at else None,
                'snapshot_data': h.snapshot_data
            })
        
        return jsonify({
            'bom_id': bom_id,
            'bom_number': bom.bom_number,
            'current_version': bom.version,
            'history': history_data
        }), 200
        
    except Exception as e:
        return error_response(str(e), 500)

@bom_management_bp.route('/boms/product/<int:product_id>/versions', methods=['GET'])
@jwt_required()
def get_product_bom_versions(product_id):
    """Get all BOM versions for a product"""
    try:
        product = Product.query.get(product_id)
        if not product:
            return error_response('Product not found', 404)
        
        # Get all BOMs for this product
        boms = BillOfMaterials.query.filter_by(product_id=product_id).order_by(desc(BillOfMaterials.created_at)).all()
        
        versions = []
        for bom in boms:
            versions.append({
                'id': bom.id,
                'bom_number': bom.bom_number,
                'version': bom.version,
                'is_active': bom.is_active,
                'effective_date': bom.effective_date.isoformat() if bom.effective_date else None,
                'expiry_date': bom.expiry_date.isoformat() if bom.expiry_date else None,
                'total_materials': bom.total_materials,
                'total_cost': float(bom.total_cost) if bom.total_cost else 0,
                'created_at': bom.created_at.isoformat() if bom.created_at else None
            })
        
        return jsonify({
            'product_id': product_id,
            'product_code': product.code,
            'product_name': product.name,
            'versions': versions,
            'total_versions': len(versions)
        }), 200
        
    except Exception as e:
        return error_response(str(e), 500)

@bom_management_bp.route('/boms/import-logs', methods=['GET'])
@jwt_required()
def get_import_logs():
    """Get BOM import history"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        pagination = BOMImportLog.query.order_by(desc(BOMImportLog.import_date)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        logs = []
        for log in pagination.items:
            logs.append({
                'id': log.id,
                'import_date': log.import_date.isoformat() if log.import_date else None,
                'imported_by': log.imported_by_user.full_name if log.imported_by_user else None,
                'file_name': log.file_name,
                'products_added': log.products_added,
                'products_updated': log.products_updated,
                'materials_added': log.materials_added,
                'materials_updated': log.materials_updated,
                'boms_created': log.boms_created,
                'boms_updated': log.boms_updated,
                'status': log.status,
                'error_message': log.error_message
            })
        
        return jsonify({
            'logs': logs,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return error_response(str(e), 500)
