from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.warehouse import Inventory, InventoryMovement, WarehouseLocation
from models.product import Product, Material
from models.purchasing import Supplier
from utils.i18n import success_response, error_response
from utils import generate_number
from datetime import datetime, date
from sqlalchemy import func
from utils.timezone import get_local_now, get_local_today

stock_input_bp = Blueprint('stock_input', __name__)

@stock_input_bp.route('/stock-input', methods=['POST'])
@jwt_required()
def create_stock_input():
    """Create manual stock input with multiple items"""
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())
        
        # Validate required fields
        if not data.get('items') or len(data['items']) == 0:
            return error_response('At least one stock item is required'), 400
        
        # Generate reference number if not provided
        reference_number = data.get('reference_number')
        if not reference_number:
            reference_number = generate_number('SI', InventoryMovement, 'reference_number')
        
        movement_date = datetime.fromisoformat(data['movement_date']).date() if data.get('movement_date') else get_local_today()
        
        created_movements = []
        
        # Process each stock item
        for item_data in data['items']:
            # Validate item data
            if not item_data.get('quantity') or item_data['quantity'] <= 0:
                continue
                
            if not item_data.get('location_id'):
                return error_response('Location is required for all items'), 400
            
            # Determine if it's product or material
            product_id = item_data.get('product_id')
            material_id = item_data.get('material_id')
            
            if not product_id and not material_id:
                return error_response('Either product_id or material_id is required'), 400
            
            # Get or create inventory record
            inventory = None
            if product_id:
                inventory = Inventory.query.filter_by(
                    product_id=product_id,
                    location_id=item_data['location_id']
                ).first()
                
                if not inventory:
                    # Create new inventory record for product
                    inventory = Inventory(
                        product_id=product_id,
                        location_id=item_data['location_id'],
                        quantity_on_hand=0,
                        quantity_reserved=0,
                        quantity_available=0,
                        min_stock_level=0,
                        max_stock_level=0,
                        is_active=True,
                        created_by=user_id
                    )
                    db.session.add(inventory)
                    db.session.flush()
            
            elif material_id:
                inventory = Inventory.query.filter_by(
                    material_id=material_id,
                    location_id=item_data['location_id'],
                    batch_number=item_data.get('batch_number')
                ).first()
                
                if not inventory:
                    # Create new inventory record for material
                    inventory = Inventory(
                        material_id=material_id,
                        location_id=item_data['location_id'],
                        quantity_on_hand=0,
                        quantity_reserved=0,
                        quantity_available=0,
                        min_stock_level=0,
                        max_stock_level=0,
                        batch_number=item_data.get('batch_number'),
                        stock_status='available',  # Material default status
                        supplier_batch=item_data.get('supplier_batch'),
                        is_active=True,
                        created_by=user_id
                    )
                    db.session.add(inventory)
                    db.session.flush()
            
            # Update inventory quantities
            quantity = float(item_data['quantity'])
            inventory.quantity_on_hand += quantity
            inventory.quantity_available += quantity
            inventory.updated_at = get_local_now()
            
            # Create inventory movement record
            movement = InventoryMovement(
                inventory_id=inventory.id,
                movement_type='stock_in',
                movement_date=movement_date,
                quantity=quantity,
                reference_number=reference_number,
                reference_type='manual_input',
                batch_number=item_data.get('batch_number', ''),
                expiry_date=datetime.fromisoformat(item_data['expiry_date']).date() if item_data.get('expiry_date') else None,
                notes=item_data.get('notes', ''),
                created_by=user_id
            )
            
            db.session.add(movement)
            created_movements.append(movement)
        
        # Create main movement record for tracking
        main_movement = InventoryMovement(
            movement_type='stock_in',
            movement_date=movement_date,
            reference_number=reference_number,
            reference_type='manual_input',
            notes=data.get('notes', ''),
            created_by=user_id
        )
        db.session.add(main_movement)
        
        db.session.commit()
        
        return success_response('Stock input created successfully', {
            'reference_number': reference_number,
            'total_items': len(created_movements),
            'movement_date': movement_date.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e)), 500

@stock_input_bp.route('/stock-input/history', methods=['GET'])
@jwt_required()
def get_stock_input_history():
    """Get stock input history with pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = InventoryMovement.query.filter(
            InventoryMovement.movement_type == 'stock_in',
            InventoryMovement.reference_type == 'manual_input'
        )
        
        if search:
            query = query.filter(
                db.or_(
                    InventoryMovement.reference_number.ilike(f'%{search}%'),
                    InventoryMovement.notes.ilike(f'%{search}%')
                )
            )
        
        movements = query.order_by(InventoryMovement.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Group movements by reference number
        grouped_movements = {}
        for movement in movements.items:
            ref_num = movement.reference_number
            if ref_num not in grouped_movements:
                grouped_movements[ref_num] = {
                    'reference_number': ref_num,
                    'movement_date': movement.movement_date.isoformat() if movement.movement_date else None,
                    'notes': movement.notes,
                    'created_at': movement.created_at.isoformat(),
                    'created_by': movement.created_by_user.username if movement.created_by_user else None,
                    'items': []
                }
            
            # Add item details if inventory exists
            if movement.inventory:
                item_info = {
                    'quantity': float(movement.quantity),
                    'batch_number': movement.batch_number,
                    'expiry_date': movement.expiry_date.isoformat() if movement.expiry_date else None,
                    'location_name': movement.inventory.location.name if movement.inventory.location else None
                }
                
                if movement.inventory.product:
                    item_info.update({
                        'item_type': 'product',
                        'item_name': movement.inventory.product.name,
                        'item_code': movement.inventory.product.code,
                        'uom': movement.inventory.product.primary_uom
                    })
                elif movement.inventory.material:
                    item_info.update({
                        'item_type': 'material',
                        'item_name': movement.inventory.material.name,
                        'item_code': movement.inventory.material.code,
                        'uom': movement.inventory.material.primary_uom
                    })
                
                grouped_movements[ref_num]['items'].append(item_info)
        
        return jsonify({
            'stock_inputs': list(grouped_movements.values()),
            'total': movements.total,
            'pages': movements.pages,
            'current_page': movements.page
        }), 200
        
    except Exception as e:
        return error_response(str(e)), 500

@stock_input_bp.route('/stock-input/validate-location', methods=['POST'])
@jwt_required()
def validate_location_capacity():
    """Validate if location has enough capacity for stock input"""
    try:
        data = request.get_json()
        location_id = data.get('location_id')
        additional_quantity = float(data.get('quantity', 0))
        
        if not location_id:
            return error_response('Location ID is required'), 400
        
        location = WarehouseLocation.query.get(location_id)
        if not location:
            return error_response('Location not found'), 404
        
        # Calculate current usage
        current_usage = db.session.query(func.sum(Inventory.quantity_on_hand)).filter(
            Inventory.location_id == location_id,
            Inventory.is_active == True
        ).scalar() or 0
        
        available_capacity = location.capacity - current_usage
        
        return jsonify({
            'location_name': location.name,
            'zone_name': location.zone.name if location.zone else None,
            'total_capacity': float(location.capacity),
            'current_usage': float(current_usage),
            'available_capacity': float(available_capacity),
            'can_accommodate': additional_quantity <= available_capacity,
            'usage_percentage': (current_usage / location.capacity * 100) if location.capacity > 0 else 0
        }), 200
        
    except Exception as e:
        return error_response(str(e)), 500

@stock_input_bp.route('/stock-input/quick-add', methods=['POST'])
@jwt_required()
def quick_stock_add():
    """Quick add single item to stock"""
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())
        
        # Validate required fields
        required_fields = ['quantity', 'location_id']
        for field in required_fields:
            if not data.get(field):
                return error_response(f'{field} is required'), 400
        
        product_id = data.get('product_id')
        material_id = data.get('material_id')
        
        if not product_id and not material_id:
            return error_response('Either product_id or material_id is required'), 400
        
        # Generate reference number
        reference_number = generate_number('QA', InventoryMovement, 'reference_number')
        
        # Get or create inventory record
        inventory = None
        if product_id:
            inventory = Inventory.query.filter_by(
                product_id=product_id,
                location_id=data['location_id']
            ).first()
            
            if not inventory:
                inventory = Inventory(
                    product_id=product_id,
                    location_id=data['location_id'],
                    quantity_on_hand=0,
                    quantity_reserved=0,
                    quantity_available=0,
                    is_active=True,
                    created_by=user_id
                )
                db.session.add(inventory)
                db.session.flush()
        
        elif material_id:
            inventory = Inventory.query.filter_by(
                material_id=material_id,
                location_id=data['location_id']
            ).first()
            
            if not inventory:
                inventory = Inventory(
                    material_id=material_id,
                    location_id=data['location_id'],
                    quantity_on_hand=0,
                    quantity_reserved=0,
                    quantity_available=0,
                    is_active=True,
                    created_by=user_id
                )
                db.session.add(inventory)
                db.session.flush()
        
        # Update inventory
        quantity = float(data['quantity'])
        inventory.quantity_on_hand += quantity
        inventory.quantity_available += quantity
        inventory.updated_at = get_local_now()
        
        # Create movement record
        movement = InventoryMovement(
            inventory_id=inventory.id,
            movement_type='stock_in',
            movement_date=get_local_today(),
            quantity=quantity,
            reference_number=reference_number,
            reference_type='quick_add',
            batch_number=data.get('batch_number', ''),
            notes=data.get('notes', 'Quick add via API'),
            created_by=user_id
        )
        
        db.session.add(movement)
        db.session.commit()
        
        return success_response('Stock added successfully', {
            'reference_number': reference_number,
            'new_stock_level': float(inventory.quantity_on_hand)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e)), 500

@stock_input_bp.route('/stock-input/templates', methods=['GET'])
@jwt_required()
def get_stock_input_templates():
    """Get common stock input templates"""
    try:
        # Get most frequently used materials
        frequent_materials = db.session.query(
            Material.id,
            Material.code,
            Material.name,
            Material.material_type,
            Material.primary_uom,
            func.count(InventoryMovement.id).label('usage_count')
        ).join(
            Inventory, Material.id == Inventory.material_id
        ).join(
            InventoryMovement, Inventory.id == InventoryMovement.inventory_id
        ).filter(
            InventoryMovement.movement_type == 'stock_in'
        ).group_by(
            Material.id
        ).order_by(
            func.count(InventoryMovement.id).desc()
        ).limit(10).all()
        
        # Get most frequently used locations
        frequent_locations = db.session.query(
            WarehouseLocation.id,
            WarehouseLocation.code,
            WarehouseLocation.name,
            WarehouseLocation.zone_id,
            func.count(InventoryMovement.id).label('usage_count')
        ).join(
            Inventory, WarehouseLocation.id == Inventory.location_id
        ).join(
            InventoryMovement, Inventory.id == InventoryMovement.inventory_id
        ).filter(
            InventoryMovement.movement_type == 'stock_in'
        ).group_by(
            WarehouseLocation.id
        ).order_by(
            func.count(InventoryMovement.id).desc()
        ).limit(5).all()
        
        return jsonify({
            'frequent_materials': [{
                'id': material.id,
                'code': material.code,
                'name': material.name,
                'material_type': material.material_type,
                'primary_uom': material.primary_uom,
                'usage_count': material.usage_count
            } for material in frequent_materials],
            'frequent_locations': [{
                'id': location.id,
                'code': location.code,
                'name': location.name,
                'zone_id': location.zone_id,
                'usage_count': location.usage_count
            } for location in frequent_locations]
        }), 200
        
    except Exception as e:
        return error_response(str(e)), 500
