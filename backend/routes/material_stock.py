"""
Material Stock Management Routes
Handles material inventory operations
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Material, Inventory, WarehouseLocation, InventoryMovement, User
from utils import generate_number
from datetime import datetime
from sqlalchemy import func, or_
from utils.timezone import get_local_now, get_local_today

material_stock_bp = Blueprint('material_stock', __name__)

@material_stock_bp.route('/materials/inventory', methods=['GET'])
@jwt_required()
def get_material_inventory():
    """Get all materials with their inventory levels"""
    try:
        # Query materials with aggregated inventory
        materials = db.session.query(
            Material.id,
            Material.code,
            Material.name,
            Material.material_type,
            Material.category,
            Material.primary_uom,
            Material.cost_per_unit,
            Material.min_stock_level,
            Material.max_stock_level,
            Material.reorder_point,
            func.coalesce(func.sum(Inventory.quantity_on_hand), 0).label('total_stock'),
            func.coalesce(func.sum(Inventory.quantity_available), 0).label('available_stock'),
            func.coalesce(func.sum(Inventory.quantity_reserved), 0).label('reserved_stock')
        ).outerjoin(
            Inventory, Material.id == Inventory.material_id
        ).filter(
            Material.is_active == True
        ).group_by(
            Material.id,
            Material.code,
            Material.name,
            Material.material_type,
            Material.category,
            Material.primary_uom,
            Material.cost_per_unit,
            Material.min_stock_level,
            Material.max_stock_level,
            Material.reorder_point
        ).all()
        
        result = []
        for m in materials:
            total_stock = float(m.total_stock or 0)
            min_stock = float(m.min_stock_level or 0)
            reorder_point = float(m.reorder_point or 0)
            
            # Determine stock status
            if total_stock == 0:
                status = 'out_of_stock'
            elif total_stock < min_stock:
                status = 'low_stock'
            elif total_stock < reorder_point:
                status = 'reorder'
            else:
                status = 'in_stock'
            
            result.append({
                'id': m.id,
                'code': m.code,
                'name': m.name,
                'material_type': m.material_type,
                'category': m.category,
                'uom': m.primary_uom,
                'cost_per_unit': float(m.cost_per_unit or 0),
                'min_stock_level': min_stock,
                'max_stock_level': float(m.max_stock_level or 0),
                'reorder_point': reorder_point,
                'total_stock': total_stock,
                'available_stock': float(m.available_stock or 0),
                'reserved_stock': float(m.reserved_stock or 0),
                'status': status
            })
        
        return jsonify({
            'materials': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@material_stock_bp.route('/materials/<int:material_id>/inventory', methods=['GET'])
@jwt_required()
def get_material_inventory_detail(material_id):
    """Get detailed inventory for a specific material"""
    try:
        material = Material.query.get(material_id)
        if not material:
            return jsonify({'error': 'Material not found'}), 404
        
        # Get inventory by location
        inventory_items = Inventory.query.filter_by(
            material_id=material_id,
            is_active=True
        ).all()
        
        locations = []
        for inv in inventory_items:
            locations.append({
                'inventory_id': inv.id,
                'location_id': inv.location_id,
                'location_code': inv.location.location_code if inv.location else None,
                'location_name': inv.location.name if inv.location else None,
                'quantity_on_hand': float(inv.quantity_on_hand or 0),
                'quantity_available': float(inv.quantity_available or 0),
                'quantity_reserved': float(inv.quantity_reserved or 0),
                'batch_number': inv.batch_number,
                'lot_number': inv.lot_number,
                'production_date': inv.production_date.isoformat() if inv.production_date else None,
                'expiry_date': inv.expiry_date.isoformat() if inv.expiry_date else None,
                'last_stock_check': inv.last_stock_check.isoformat() if inv.last_stock_check else None
            })
        
        total_stock = sum(float(inv.quantity_on_hand or 0) for inv in inventory_items)
        
        return jsonify({
            'material': {
                'id': material.id,
                'code': material.code,
                'name': material.name,
                'material_type': material.material_type,
                'category': material.category,
                'uom': material.primary_uom,
                'cost_per_unit': float(material.cost_per_unit or 0),
                'min_stock_level': float(material.min_stock_level or 0),
                'max_stock_level': float(material.max_stock_level or 0),
                'reorder_point': float(material.reorder_point or 0)
            },
            'total_stock': total_stock,
            'locations': locations
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@material_stock_bp.route('/materials/stock/add', methods=['POST'])
@jwt_required()
def add_material_stock():
    """Add stock for a material"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Validate required fields
        required_fields = ['material_id', 'location_id', 'quantity']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        material_id = data['material_id']
        location_id = data['location_id']
        quantity = float(data['quantity'])
        
        if quantity <= 0:
            return jsonify({'error': 'Quantity must be greater than 0'}), 400
        
        # Check opname lock
        from utils.opname_lock import check_opname_lock
        lock = check_opname_lock(location_id=location_id, material_id=material_id)
        if lock['locked']:
            return jsonify({'error': lock['message']}), 423
        
        # Verify material exists
        material = Material.query.get(material_id)
        if not material:
            return jsonify({'error': 'Material not found'}), 404
        
        # Verify location exists
        location = WarehouseLocation.query.get(location_id)
        if not location:
            return jsonify({'error': 'Location not found'}), 404
        
        # Check if inventory record exists for this material-location combination
        inventory = Inventory.query.filter_by(
            material_id=material_id,
            location_id=location_id,
            batch_number=data.get('batch_number'),
            is_active=True
        ).first()
        
        if inventory:
            # Update existing inventory
            old_quantity = float(inventory.quantity_on_hand)
            inventory.quantity_on_hand = old_quantity + quantity
            inventory.quantity_available = float(inventory.quantity_available or 0) + quantity
            inventory.updated_at = get_local_now()
            
            movement_type = 'stock_in'
            reference = f'Stock Addition - {data.get("reference", "Manual Entry")}'
        else:
            # Create new inventory record
            inventory = Inventory(
                material_id=material_id,
                location_id=location_id,
                quantity_on_hand=quantity,
                quantity_available=quantity,
                quantity_reserved=0,
                min_stock_level=material.min_stock_level,
                max_stock_level=material.max_stock_level,
                batch_number=data.get('batch_number'),
                lot_number=data.get('lot_number'),
                serial_number=data.get('serial_number'),
                production_date=datetime.fromisoformat(data['production_date']) if data.get('production_date') else None,
                expiry_date=datetime.fromisoformat(data['expiry_date']) if data.get('expiry_date') else None,
                last_stock_check=get_local_now(),
                created_by=user_id,
                is_active=True
            )
            db.session.add(inventory)
            db.session.flush()
            
            old_quantity = 0
            movement_type = 'stock_in'
            reference = f'Initial Stock - {data.get("reference", "Manual Entry")}'
        
        # Create inventory movement record
        movement = InventoryMovement(
            inventory_id=inventory.id,
            movement_type=movement_type,
            quantity=quantity,
            quantity_before=old_quantity,
            quantity_after=float(inventory.quantity_on_hand),
            reference_type='manual_entry',
            reference_number=data.get('reference', 'MANUAL'),
            notes=data.get('notes'),
            created_by=user_id,
            movement_date=get_local_now()
        )
        db.session.add(movement)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Stock added successfully',
            'inventory_id': inventory.id,
            'material_code': material.code,
            'material_name': material.name,
            'location': location.location_code,
            'quantity_added': quantity,
            'new_total': float(inventory.quantity_on_hand)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@material_stock_bp.route('/materials/stock/adjust', methods=['POST'])
@jwt_required()
def adjust_material_stock():
    """Adjust material stock (increase or decrease)"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Validate required fields
        required_fields = ['inventory_id', 'adjustment_quantity', 'adjustment_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        inventory_id = data['inventory_id']
        adjustment_quantity = float(data['adjustment_quantity'])
        adjustment_type = data['adjustment_type']  # 'increase' or 'decrease'
        
        if adjustment_quantity <= 0:
            return jsonify({'error': 'Adjustment quantity must be greater than 0'}), 400
        
        # Get inventory record
        inventory = Inventory.query.get(inventory_id)
        if not inventory:
            return jsonify({'error': 'Inventory record not found'}), 404
        
        # Check opname lock
        from utils.opname_lock import check_opname_lock
        lock = check_opname_lock(
            location_id=inventory.location_id,
            material_id=inventory.material_id,
            product_id=inventory.product_id
        )
        if lock['locked']:
            return jsonify({'error': lock['message']}), 423
        
        old_quantity = float(inventory.quantity_on_hand)
        
        if adjustment_type == 'increase':
            new_quantity = old_quantity + adjustment_quantity
            inventory.quantity_on_hand = new_quantity
            inventory.quantity_available = float(inventory.quantity_available or 0) + adjustment_quantity
            movement_type = 'adjustment_in'
        elif adjustment_type == 'decrease':
            if adjustment_quantity > old_quantity:
                return jsonify({'error': 'Adjustment quantity exceeds available stock'}), 400
            new_quantity = old_quantity - adjustment_quantity
            inventory.quantity_on_hand = new_quantity
            inventory.quantity_available = float(inventory.quantity_available or 0) - adjustment_quantity
            movement_type = 'adjustment_out'
        else:
            return jsonify({'error': 'Invalid adjustment type. Use "increase" or "decrease"'}), 400
        
        inventory.updated_at = get_local_now()
        inventory.last_stock_check = get_local_now()
        
        # Create inventory movement record
        movement = InventoryMovement(
            inventory_id=inventory.id,
            movement_type=movement_type,
            quantity=adjustment_quantity,
            quantity_before=old_quantity,
            quantity_after=new_quantity,
            reference_type='stock_adjustment',
            reference_number=data.get('reference', 'ADJ'),
            notes=data.get('reason'),
            created_by=user_id,
            movement_date=get_local_now()
        )
        db.session.add(movement)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Stock adjusted successfully',
            'inventory_id': inventory.id,
            'material_code': inventory.material.code if inventory.material else None,
            'material_name': inventory.material.name if inventory.material else None,
            'adjustment_type': adjustment_type,
            'adjustment_quantity': adjustment_quantity,
            'old_quantity': old_quantity,
            'new_quantity': new_quantity
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@material_stock_bp.route('/materials/stock/movements', methods=['GET'])
@jwt_required()
def get_material_movements():
    """Get material stock movements history"""
    try:
        material_id = request.args.get('material_id', type=int)
        location_id = request.args.get('location_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        limit = request.args.get('limit', 50, type=int)
        
        # Build query
        query = db.session.query(InventoryMovement).join(Inventory)
        
        if material_id:
            query = query.filter(Inventory.material_id == material_id)
        
        if location_id:
            query = query.filter(Inventory.location_id == location_id)
        
        if start_date:
            query = query.filter(InventoryMovement.movement_date >= datetime.fromisoformat(start_date))
        
        if end_date:
            query = query.filter(InventoryMovement.movement_date <= datetime.fromisoformat(end_date))
        
        movements = query.order_by(InventoryMovement.movement_date.desc()).limit(limit).all()
        
        result = []
        for mov in movements:
            result.append({
                'id': mov.id,
                'movement_date': mov.movement_date.isoformat() if mov.movement_date else None,
                'movement_type': mov.movement_type,
                'material_code': mov.inventory.material.code if mov.inventory and mov.inventory.material else None,
                'material_name': mov.inventory.material.name if mov.inventory and mov.inventory.material else None,
                'location': mov.inventory.location.location_code if mov.inventory and mov.inventory.location else None,
                'quantity': float(mov.quantity or 0),
                'quantity_before': float(mov.quantity_before or 0),
                'quantity_after': float(mov.quantity_after or 0),
                'reference_type': mov.reference_type,
                'reference_number': mov.reference_number,
                'notes': mov.notes,
                'created_by': mov.created_by_user.full_name if mov.created_by_user else None
            })
        
        return jsonify({
            'movements': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@material_stock_bp.route('/materials/locations', methods=['GET'])
@jwt_required()
def get_warehouse_locations():
    """Get all warehouse locations for material storage"""
    try:
        locations = WarehouseLocation.query.filter_by(is_active=True).all()
        
        result = []
        for loc in locations:
            result.append({
                'id': loc.id,
                'location_code': loc.location_code,
                'name': loc.name,
                'location_type': loc.location_type,
                'warehouse_id': loc.warehouse_id,
                'warehouse_name': loc.warehouse.name if loc.warehouse else None
            })
        
        return jsonify({
            'locations': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@material_stock_bp.route('/materials/initialize-inventory', methods=['POST'])
@jwt_required()
def initialize_material_inventory():
    """Initialize inventory records for all materials without inventory"""
    try:
        user_id = get_jwt_identity()
        
        # Get default location (first active location)
        default_location = WarehouseLocation.query.filter_by(is_active=True).first()
        if not default_location:
            return jsonify({'error': 'No active warehouse location found. Please create a warehouse location first.'}), 400
        
        # Get all materials that don't have inventory records yet
        materials_without_inventory = db.session.query(Material).outerjoin(
            Inventory, Material.id == Inventory.material_id
        ).filter(
            Material.is_active == True,
            Inventory.id == None
        ).all()
        
        if not materials_without_inventory:
            return jsonify({'message': 'All materials already have inventory records'}), 200
        
        created_count = 0
        for material in materials_without_inventory:
            # Create inventory record with 0 quantity
            inventory = Inventory(
                material_id=material.id,
                location_id=default_location.id,
                quantity_on_hand=0,
                quantity_available=0,
                quantity_reserved=0,
                min_stock_level=material.min_stock_level or 0,
                max_stock_level=material.max_stock_level or 0,
                last_stock_check=get_local_now(),
                created_by=user_id,
                is_active=True
            )
            db.session.add(inventory)
            created_count += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully initialized inventory for {created_count} materials',
            'created_count': created_count,
            'location': default_location.location_code
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
