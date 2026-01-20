from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, WarehouseZone, WarehouseLocation, Inventory, InventoryMovement, Product
from models.product import Material
from utils.i18n import success_response, error_response, get_message
from sqlalchemy import or_, func
from sqlalchemy.orm import joinedload
from datetime import datetime
from utils.timezone import get_local_now, get_local_today

warehouse_bp = Blueprint('warehouse', __name__)

@warehouse_bp.route('/zones', methods=['GET'])
@jwt_required()
def get_zones():
    """Get all warehouse zones"""
    try:
        zones = WarehouseZone.query.filter_by(is_active=True).all()
        
        return jsonify({
            'zones': [{
                'id': z.id,
                'code': z.code,
                'name': z.name,
                'material_type': z.material_type,
                'capacity': float(z.capacity) if z.capacity else None,
                'capacity_uom': z.capacity_uom,
                'location_count': len(z.locations)
            } for z in zones]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@warehouse_bp.route('/zones', methods=['POST'])
@jwt_required()
def create_zone():
    """Create warehouse zone"""
    try:
        data = request.get_json()
        zone = WarehouseZone(
            code=data['code'],
            name=data['name'],
            description=data.get('description'),
            material_type=data['material_type'],
            capacity=data.get('capacity'),
            capacity_uom=data.get('capacity_uom')
        )
        db.session.add(zone)
        db.session.commit()
        
        return jsonify({'message': 'Zone created', 'zone_id': zone.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@warehouse_bp.route('/locations', methods=['GET'])
@jwt_required()
def get_locations():
    """Get all warehouse locations"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        zone_id = request.args.get('zone_id', type=int)
        material_type = request.args.get('material_type')  # finished_goods, raw_materials, etc.
        search = request.args.get('search', '')
        available_only = request.args.get('available_only', 'false').lower() == 'true'
        
        query = WarehouseLocation.query.join(WarehouseZone)
        
        if zone_id:
            query = query.filter(WarehouseLocation.zone_id == zone_id)
        
        if material_type:
            query = query.filter(WarehouseZone.material_type == material_type)
        
        if available_only:
            query = query.filter(WarehouseLocation.is_available == True, WarehouseLocation.is_active == True)
        
        if search:
            query = query.filter(WarehouseLocation.location_code.ilike(f'%{search}%'))
        
        locations = query.paginate(page=page, per_page=per_page)
        
        return jsonify({
            'locations': [{
                'id': l.id,
                'location_code': l.location_code,
                'zone_id': l.zone_id,
                'zone_name': l.zone.name,
                'zone_material_type': l.zone.material_type,
                'rack': l.rack,
                'level': l.level,
                'position': l.position,
                'capacity': float(l.capacity),
                'occupied': float(l.occupied),
                'available': float(l.capacity - l.occupied),
                'is_available': l.is_available
            } for l in locations.items],
            'total': locations.total,
            'pages': locations.pages,
            'current_page': locations.page
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@warehouse_bp.route('/locations', methods=['POST'])
@jwt_required()
def create_location():
    """Create warehouse location"""
    try:
        data = request.get_json()
        
        location = WarehouseLocation(
            zone_id=data['zone_id'],
            location_code=data['location_code'],
            rack=data['rack'],
            level=data['level'],
            position=data['position'],
            capacity=data.get('capacity', 0),
            capacity_uom=data.get('capacity_uom', 'KG')
        )
        db.session.add(location)
        db.session.commit()
        
        return jsonify({'message': 'Location created', 'location_id': location.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@warehouse_bp.route('/inventory', methods=['GET'])
@jwt_required()
def get_inventory():
    """Get inventory - supports both products and materials"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        product_id = request.args.get('product_id', type=int)
        material_id = request.args.get('material_id', type=int)
        location_id = request.args.get('location_id', type=int)
        zone_id = request.args.get('zone_id', type=int)
        item_type = request.args.get('item_type')  # 'product', 'material', or None for all
        stock_status = request.args.get('stock_status')  # released, quarantine, reject
        category_group = request.args.get('category_group')  # packaging, aksesoris, chemical, lainnya
        search = request.args.get('search', '')
        
        query = db.session.query(Inventory).filter(Inventory.is_active == True)
        
        # Filter by item type
        if item_type == 'product':
            query = query.filter(Inventory.product_id.isnot(None))
        elif item_type == 'material':
            query = query.filter(Inventory.material_id.isnot(None))
        
        if product_id:
            query = query.filter(Inventory.product_id == product_id)
        
        if material_id:
            query = query.filter(Inventory.material_id == material_id)
        
        if location_id:
            query = query.filter(Inventory.location_id == location_id)
        
        if zone_id:
            query = query.join(WarehouseLocation).filter(WarehouseLocation.zone_id == zone_id)
        
        # Filter by stock status (quantity-based)
        if stock_status:
            if stock_status == 'available':
                query = query.filter(Inventory.quantity_on_hand > 0)
            elif stock_status == 'out_of_stock':
                query = query.filter(Inventory.quantity_on_hand <= 0)
            elif stock_status == 'low_stock':
                query = query.filter(
                    Inventory.quantity_on_hand > 0,
                    Inventory.quantity_on_hand <= Inventory.min_stock_level,
                    Inventory.min_stock_level > 0
                )
        
        # Search by product/material code or name
        if search:
            query = query.outerjoin(Product, Inventory.product_id == Product.id)\
                         .outerjoin(Material, Inventory.material_id == Material.id)\
                         .filter(
                             db.or_(
                                 Product.code.ilike(f'%{search}%'),
                                 Product.name.ilike(f'%{search}%'),
                                 Material.code.ilike(f'%{search}%'),
                                 Material.name.ilike(f'%{search}%'),
                                 Inventory.batch_number.ilike(f'%{search}%')
                             )
                         )
        
        # Filter by category group
        if category_group:
            # Category mappings
            kain_categories = ['main_roll', 'jumbo_roll', 'spunbond', 'meltblown', 'kain', 'nonwoven']
            packaging_categories = ['packaging', 'carton_box', 'inner_box', 'jerigen', 'botol']
            aksesoris_categories = ['stc', 'fliptop', 'plastik']
            chemical_categories = ['parfum', 'chemical']
            
            # Join Material if not already joined
            if not search:
                query = query.outerjoin(Material, Inventory.material_id == Material.id)
            
            if category_group == 'kain':
                query = query.filter(Material.category.in_(kain_categories))
            elif category_group == 'packaging':
                query = query.filter(Material.category.in_(packaging_categories))
            elif category_group == 'aksesoris':
                query = query.filter(Material.category.in_(aksesoris_categories))
            elif category_group == 'chemical':
                query = query.filter(Material.category.in_(chemical_categories))
            elif category_group == 'lainnya':
                all_known = kain_categories + packaging_categories + aksesoris_categories + chemical_categories
                query = query.filter(
                    db.or_(
                        Material.category.notin_(all_known),
                        Material.category.is_(None),
                        Inventory.product_id.isnot(None)  # Products go to "lainnya"
                    )
                )
        
        inventory = query.order_by(Inventory.updated_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
        
        inventory_list = []
        for i in inventory.items:
            try:
                product = None
                material = None
                location = None
                
                if i.product_id:
                    product = Product.query.get(i.product_id)
                
                if i.material_id:
                    material = Material.query.get(i.material_id)
                
                if i.location_id:
                    location = WarehouseLocation.query.get(i.location_id)
                
                item_data = {
                    'id': i.id,
                    'item_type': 'product' if product else 'material',
                    'product_id': i.product_id,
                    'material_id': i.material_id,
                    'item_code': product.code if product else (material.code if material else 'N/A'),
                    'item_name': product.name if product else (material.name if material else 'N/A'),
                    'material_type': material.material_type if material else None,
                    'category': material.category if material else None,
                    'location_id': i.location_id,
                    'location_code': location.location_code if location else 'N/A',
                    'zone_name': location.zone.name if location and location.zone else 'N/A',
                    'quantity_on_hand': float(i.quantity_on_hand) if i.quantity_on_hand else 0,
                    'quantity_reserved': float(i.quantity_reserved) if i.quantity_reserved else 0,
                    'quantity_available': float(i.quantity_available) if i.quantity_available else 0,
                    'min_stock_level': float(i.min_stock_level) if i.min_stock_level else 0,
                    'max_stock_level': float(i.max_stock_level) if i.max_stock_level else 0,
                    'batch_number': i.batch_number or '',
                    'lot_number': i.lot_number or '',
                    'production_date': i.production_date.isoformat() if i.production_date else None,
                    'expiry_date': i.expiry_date.isoformat() if i.expiry_date else None,
                    'stock_status': i.stock_status or 'released',
                    'uom': product.primary_uom if product else (material.primary_uom if material else 'PCS'),
                    'last_stock_check': i.last_stock_check.isoformat() if i.last_stock_check else None,
                    'updated_at': i.updated_at.isoformat() if i.updated_at else None
                }
                inventory_list.append(item_data)
            except Exception as e:
                print(f"Error processing inventory item {i.id}: {str(e)}")
                continue
        
        return jsonify({
            'inventory': inventory_list,
            'total': inventory.total,
            'pages': inventory.pages,
            'current_page': inventory.page
        }), 200
            
    except Exception as e:
        print(f"Inventory error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@warehouse_bp.route('/inventory/add', methods=['POST'])
@jwt_required()
def add_to_inventory():
    """Add product or material to inventory"""
    try:
        from flask_jwt_extended import get_jwt_identity
        data = request.get_json()
        user_id = int(get_jwt_identity())
        
        # Validate required fields
        if not data.get('location_id'):
            return error_response('Location is required'), 400
        
        if not data.get('quantity') or float(data['quantity']) <= 0:
            return error_response('Quantity must be greater than 0'), 400
        
        product_id = data.get('product_id')
        material_id = data.get('material_id')
        
        if not product_id and not material_id:
            return error_response('Either product_id or material_id is required'), 400
        
        quantity = float(data['quantity'])
        location_id = data['location_id']
        
        # Get or create inventory record
        if product_id:
            inventory = Inventory.query.filter_by(
                product_id=product_id,
                location_id=location_id,
                batch_number=data.get('batch_number')
            ).first()
            
            if not inventory:
                inventory = Inventory(
                    product_id=product_id,
                    location_id=location_id,
                    quantity_on_hand=0,
                    quantity_reserved=0,
                    quantity_available=0,
                    batch_number=data.get('batch_number'),
                    lot_number=data.get('lot_number'),
                    production_date=datetime.fromisoformat(data['production_date']).date() if data.get('production_date') else None,
                    expiry_date=datetime.fromisoformat(data['expiry_date']).date() if data.get('expiry_date') else None,
                    stock_status=data.get('stock_status', 'released'),
                    is_active=True,
                    created_by=user_id
                )
                db.session.add(inventory)
                db.session.flush()
        else:
            inventory = Inventory.query.filter_by(
                material_id=material_id,
                location_id=location_id,
                batch_number=data.get('batch_number')
            ).first()
            
            if not inventory:
                inventory = Inventory(
                    material_id=material_id,
                    location_id=location_id,
                    quantity_on_hand=0,
                    quantity_reserved=0,
                    quantity_available=0,
                    batch_number=data.get('batch_number'),
                    lot_number=data.get('lot_number'),
                    expiry_date=datetime.fromisoformat(data['expiry_date']).date() if data.get('expiry_date') else None,
                    stock_status=data.get('stock_status', 'available'),  # Material default = available
                    supplier_batch=data.get('supplier_batch'),
                    is_active=True,
                    created_by=user_id
                )
                db.session.add(inventory)
                db.session.flush()
        
        # Update quantities
        inventory.quantity_on_hand += quantity
        inventory.quantity_available += quantity
        inventory.updated_at = get_local_now()
        
        # Create movement record
        movement = InventoryMovement(
            inventory_id=inventory.id,
            product_id=product_id,
            material_id=material_id,
            location_id=location_id,
            movement_type='stock_in',
            movement_date=get_local_now().date(),
            quantity=quantity,
            reference_number=data.get('reference_number'),
            reference_type=data.get('reference_type', 'manual_input'),
            reference_id=data.get('reference_id'),
            batch_number=data.get('batch_number'),
            lot_number=data.get('lot_number'),
            expiry_date=datetime.fromisoformat(data['expiry_date']).date() if data.get('expiry_date') else None,
            notes=data.get('notes'),
            created_by=user_id
        )
        db.session.add(movement)
        
        # Update location occupied
        location = WarehouseLocation.query.get(location_id)
        if location:
            location.occupied = float(location.occupied or 0) + quantity
        
        db.session.commit()
        
        return success_response('Stock added successfully', {
            'inventory_id': inventory.id,
            'movement_id': movement.id,
            'new_quantity': float(inventory.quantity_on_hand)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e)), 500

@warehouse_bp.route('/movements', methods=['POST'])
@jwt_required()
def create_movement():
    """Create inventory movement (stock_in, stock_out, transfer, adjust)"""
    try:
        from flask_jwt_extended import get_jwt_identity
        data = request.get_json()
        user_id = int(get_jwt_identity())
        
        movement_type = data.get('movement_type')
        if movement_type not in ['stock_in', 'stock_out', 'transfer', 'adjust']:
            return error_response('Invalid movement type'), 400
        
        product_id = data.get('product_id')
        material_id = data.get('material_id')
        quantity = float(data.get('quantity', 0))
        
        if quantity <= 0:
            return error_response('Quantity must be greater than 0'), 400
        
        # Create movement record
        movement = InventoryMovement(
            product_id=product_id,
            material_id=material_id,
            location_id=data.get('location_id') or data.get('to_location_id'),
            movement_type=movement_type,
            movement_date=get_local_now().date(),
            quantity=quantity,
            reference_number=data.get('reference_number'),
            reference_type=data.get('reference_type'),
            reference_id=data.get('reference_id'),
            batch_number=data.get('batch_number'),
            lot_number=data.get('lot_number'),
            notes=data.get('notes'),
            created_by=user_id
        )
        db.session.add(movement)
        
        # Update inventory based on movement type
        if movement_type == 'stock_in':
            location_id = data.get('to_location_id') or data.get('location_id')
            if location_id:
                inventory = Inventory.query.filter_by(
                    product_id=product_id,
                    material_id=material_id,
                    location_id=location_id
                ).first()
                
                if inventory:
                    inventory.quantity_on_hand += quantity
                    inventory.quantity_available += quantity
                else:
                    inventory = Inventory(
                        product_id=product_id,
                        material_id=material_id,
                        location_id=location_id,
                        quantity_on_hand=quantity,
                        quantity_available=quantity,
                        batch_number=data.get('batch_number'),
                        is_active=True,
                        created_by=user_id
                    )
                    db.session.add(inventory)
        
        elif movement_type == 'stock_out':
            location_id = data.get('from_location_id') or data.get('location_id')
            if location_id:
                inventory = Inventory.query.filter_by(
                    product_id=product_id,
                    material_id=material_id,
                    location_id=location_id
                ).first()
                
                if inventory:
                    if inventory.quantity_available < quantity:
                        return error_response('Insufficient stock available'), 400
                    inventory.quantity_on_hand -= quantity
                    inventory.quantity_available -= quantity
        
        elif movement_type == 'transfer':
            from_location_id = data.get('from_location_id')
            to_location_id = data.get('to_location_id')
            
            if not from_location_id or not to_location_id:
                return error_response('Both from_location_id and to_location_id are required for transfer'), 400
            
            # Decrease from source
            from_inventory = Inventory.query.filter_by(
                product_id=product_id,
                material_id=material_id,
                location_id=from_location_id
            ).first()
            
            if not from_inventory or from_inventory.quantity_available < quantity:
                return error_response('Insufficient stock at source location'), 400
            
            from_inventory.quantity_on_hand -= quantity
            from_inventory.quantity_available -= quantity
            
            # Increase at destination
            to_inventory = Inventory.query.filter_by(
                product_id=product_id,
                material_id=material_id,
                location_id=to_location_id
            ).first()
            
            if to_inventory:
                to_inventory.quantity_on_hand += quantity
                to_inventory.quantity_available += quantity
            else:
                to_inventory = Inventory(
                    product_id=product_id,
                    material_id=material_id,
                    location_id=to_location_id,
                    quantity_on_hand=quantity,
                    quantity_available=quantity,
                    batch_number=data.get('batch_number'),
                    is_active=True,
                    created_by=user_id
                )
                db.session.add(to_inventory)
        
        elif movement_type == 'adjust':
            location_id = data.get('location_id')
            adjustment_type = data.get('adjustment_type', 'increase')  # increase or decrease
            
            inventory = Inventory.query.filter_by(
                product_id=product_id,
                material_id=material_id,
                location_id=location_id
            ).first()
            
            if inventory:
                if adjustment_type == 'increase':
                    inventory.quantity_on_hand += quantity
                    inventory.quantity_available += quantity
                else:
                    inventory.quantity_on_hand -= quantity
                    inventory.quantity_available -= quantity
        
        db.session.commit()
        
        return success_response('Movement recorded', {'movement_id': movement.id}), 201
    except Exception as e:
        db.session.rollback()
        return error_response(str(e)), 500

@warehouse_bp.route('/stock-summary', methods=['GET'])
@jwt_required()
def get_stock_summary():
    """Get stock summary by product"""
    try:
        # Simplified query using correct field names
        query = db.session.query(
            Product.id,
            Product.code,
            Product.name,
            func.sum(Inventory.quantity_on_hand).label('total_quantity'),
            func.sum(Inventory.quantity_available).label('available_quantity'),
            func.sum(Inventory.quantity_reserved).label('reserved_quantity')
        ).join(Inventory, Product.id == Inventory.product_id).group_by(Product.id, Product.code, Product.name)
        
        results = query.all()
        
        return jsonify({
            'stock_summary': [{
                'product_id': r.id,
                'product_code': r.code,
                'product_name': r.name,
                'total_quantity': float(r.total_quantity or 0),
                'available_quantity': float(r.available_quantity or 0),
                'reserved_quantity': float(r.reserved_quantity or 0)
            } for r in results]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e), 'details': 'Stock summary query failed'}), 500

# Enhanced Dashboard Endpoints
@warehouse_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_warehouse_dashboard():
    try:
        from datetime import datetime, timedelta
        from sqlalchemy import func, and_
        
        # Calculate date range for trends
        end_date = get_local_now()
        start_date = end_date - timedelta(days=30)
        
        # Summary metrics
        total_locations = WarehouseLocation.query.filter_by(is_active=True).count()
        total_zones = WarehouseZone.query.filter_by(is_active=True).count()
        
        # Inventory summary - Products
        product_inventory = db.session.query(
            func.count(Inventory.id).label('total_items'),
            func.sum(Inventory.quantity_on_hand).label('total_quantity')
        ).filter(
            Inventory.product_id.isnot(None),
            Inventory.is_active == True
        ).first()
        
        # Inventory summary - Materials
        material_inventory = db.session.query(
            func.count(Inventory.id).label('total_items'),
            func.sum(Inventory.quantity_on_hand).label('total_quantity')
        ).filter(
            Inventory.material_id.isnot(None),
            Inventory.is_active == True
        ).first()
        
        # Combined inventory summary
        total_inventory_items = (product_inventory.total_items or 0) + (material_inventory.total_items or 0)
        total_inventory_quantity = (product_inventory.total_quantity or 0) + (material_inventory.total_quantity or 0)
        
        # Movement summary (last 30 days)
        try:
            from sqlalchemy import case
            movement_summary = db.session.query(
                func.count(InventoryMovement.id).label('total_movements'),
                func.sum(case((InventoryMovement.movement_type == 'in', InventoryMovement.quantity), else_=0)).label('total_in'),
                func.sum(case((InventoryMovement.movement_type == 'out', InventoryMovement.quantity), else_=0)).label('total_out')
            ).filter(
                InventoryMovement.movement_date >= start_date
            ).first()
        except:
            # Fallback if movement query fails
            class MovementSummary:
                total_movements = 0
                total_in = 0
                total_out = 0
            movement_summary = MovementSummary()
        
        # Low stock alerts
        try:
            low_stock_items = db.session.query(
                Product.id,
                Product.code,
                Product.name,
                Inventory.quantity_on_hand,
                Product.minimum_stock
            ).join(Inventory).filter(
                and_(
                    Inventory.quantity_on_hand <= Product.minimum_stock,
                    Product.minimum_stock > 0
                )
            ).all()
        except:
            low_stock_items = []
        
        # ABC Analysis
        try:
            from sqlalchemy import case
            abc_analysis = db.session.query(
                func.count(case((Product.abc_category == 'A', 1))).label('category_a'),
                func.count(case((Product.abc_category == 'B', 1))).label('category_b'),
                func.count(case((Product.abc_category == 'C', 1))).label('category_c')
            ).join(Inventory).first()
        except:
            # Fallback if ABC analysis fails
            class ABCAnalysis:
                category_a = 0
                category_b = 0
                category_c = 0
            abc_analysis = ABCAnalysis()
        
        # Recent movements
        try:
            recent_movements = db.session.query(
                InventoryMovement.id,
                InventoryMovement.movement_type,
                InventoryMovement.quantity,
                InventoryMovement.movement_date,
                Product.code.label('product_code'),
                Product.name.label('product_name'),
                WarehouseLocation.location_code
            ).join(Inventory).join(Product, Inventory.product_id == Product.id).join(WarehouseLocation).order_by(
                InventoryMovement.movement_date.desc()
            ).limit(10).all()
        except:
            recent_movements = []
        
        # Top products by movement
        try:
            top_products = db.session.query(
                Product.id,
                Product.code,
                Product.name,
                func.sum(InventoryMovement.quantity).label('total_movement')
            ).join(Inventory).join(InventoryMovement).filter(
                InventoryMovement.movement_date >= start_date
            ).group_by(Product.id, Product.code, Product.name).order_by(
                func.sum(InventoryMovement.quantity).desc()
            ).limit(10).all()
        except:
            top_products = []
        
        return jsonify({
            'summary': {
                'total_locations': total_locations,
                'total_zones': total_zones,
                'total_items': int(total_inventory_items),
                'total_products': int(product_inventory.total_items or 0),
                'total_materials': int(material_inventory.total_items or 0),
                'total_quantity': float(total_inventory_quantity),
                'low_stock_count': len(low_stock_items)
            },
            'movements': {
                'total_movements': int(movement_summary.total_movements or 0),
                'total_in': float(movement_summary.total_in or 0),
                'total_out': float(movement_summary.total_out or 0),
                'net_movement': float((movement_summary.total_in or 0) - (movement_summary.total_out or 0))
            },
            'abc_analysis': {
                'category_a': int(abc_analysis.category_a or 0),
                'category_b': int(abc_analysis.category_b or 0),
                'category_c': int(abc_analysis.category_c or 0)
            },
            'low_stock_items': [{
                'id': item.id,
                'code': item.code,
                'name': item.name,
                'current_quantity': float(item.quantity),
                'minimum_stock': float(item.minimum_stock)
            } for item in low_stock_items],
            'recent_movements': [{
                'id': movement.id,
                'movement_type': movement.movement_type,
                'quantity': float(movement.quantity),
                'movement_date': movement.movement_date.isoformat(),
                'product_code': movement.product_code,
                'product_name': movement.product_name,
                'location_code': movement.location_code
            } for movement in recent_movements],
            'top_products': [{
                'id': product.id,
                'code': product.code,
                'name': product.name,
                'total_movement': float(product.total_movement)
            } for product in top_products]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@warehouse_bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_warehouse_alerts():
    try:
        status = request.args.get('status', 'active')
        
        # Get low stock alerts
        low_stock_items = db.session.query(
            Product.id,
            Product.code,
            Product.name,
            Inventory.quantity_on_hand,
            Product.minimum_stock,
            WarehouseLocation.code.label('location_code')
        ).join(Inventory).join(WarehouseLocation).filter(
            and_(
                Inventory.quantity_on_hand <= Product.minimum_stock,
                Product.minimum_stock > 0
            )
        ).all()
        
        # Get out of stock alerts
        out_of_stock_items = db.session.query(
            Product.id,
            Product.code,
            Product.name,
            WarehouseLocation.code.label('location_code')
        ).join(Inventory).join(WarehouseLocation).filter(
            Inventory.quantity_on_hand <= 0
        ).all()
        
        alerts = []
        
        # Add low stock alerts
        for item in low_stock_items:
            alerts.append({
                'id': f"low_stock_{item.id}",
                'type': 'low_stock',
                'severity': 'medium',
                'title': f"Low Stock: {item.code}",
                'message': f"{item.name} is running low (Current: {item.quantity}, Min: {item.minimum_stock})",
                'product_id': item.id,
                'location_code': item.location_code,
                'created_at': get_local_now().isoformat()
            })
        
        # Add out of stock alerts
        for item in out_of_stock_items:
            alerts.append({
                'id': f"out_of_stock_{item.id}",
                'type': 'out_of_stock',
                'severity': 'high',
                'title': f"Out of Stock: {item.code}",
                'message': f"{item.name} is out of stock",
                'product_id': item.id,
                'location_code': item.location_code,
                'created_at': get_local_now().isoformat()
            })
        
        return jsonify({'alerts': alerts}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@warehouse_bp.route('/analytics/turnover', methods=['GET'])
@jwt_required()
def get_inventory_turnover():
    try:
        from datetime import datetime, timedelta
        
        period = int(request.args.get('period', 90))  # days
        end_date = get_local_now()
        start_date = end_date - timedelta(days=period)
        
        # Calculate inventory turnover
        turnover_data = db.session.query(
            Product.id,
            Product.code,
            Product.name,
            func.avg(Inventory.quantity_on_hand).label('avg_inventory'),
            func.sum(func.case([(InventoryMovement.movement_type == 'out', InventoryMovement.quantity)], else_=0)).label('total_sold'),
            Product.unit_cost
        ).join(Inventory).join(InventoryMovement).filter(
            InventoryMovement.movement_date >= start_date
        ).group_by(Product.id, Product.code, Product.name, Product.unit_cost).all()
        
        turnover_analysis = []
        for item in turnover_data:
            avg_inventory = float(item.avg_inventory or 0)
            total_sold = float(item.total_sold or 0)
            
            if avg_inventory > 0:
                turnover_ratio = total_sold / avg_inventory
                days_of_supply = period / turnover_ratio if turnover_ratio > 0 else float('inf')
            else:
                turnover_ratio = 0
                days_of_supply = 0
            
            turnover_analysis.append({
                'product_id': item.id,
                'product_code': item.code,
                'product_name': item.name,
                'avg_inventory': avg_inventory,
                'total_sold': total_sold,
                'turnover_ratio': round(turnover_ratio, 2),
                'days_of_supply': round(days_of_supply, 1) if days_of_supply != float('inf') else 0,
                'unit_cost': float(item.unit_cost or 0)
            })
        
        # Sort by turnover ratio
        turnover_analysis.sort(key=lambda x: x['turnover_ratio'], reverse=True)
        
        return jsonify({
            'period_days': period,
            'turnover_analysis': turnover_analysis
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
