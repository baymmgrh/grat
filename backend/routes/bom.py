from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.production import BillOfMaterials, BOMItem
from models.product import Product, Material
from models.product_excel_schema import ProductNew
from models.warehouse import Inventory
from models.purchasing import Supplier
from utils.i18n import success_response, error_response, get_message
from utils import generate_number
from datetime import datetime, date
from sqlalchemy import func, desc, and_
from utils.timezone import get_local_now, get_local_today

def get_product_name_from_new(product_code):
    """Get updated product name from ProductNew model"""
    if not product_code:
        return None
    product_new = ProductNew.query.filter_by(code=product_code).first()
    if product_new:
        return product_new.name
    return None

bom_bp = Blueprint('bom', __name__)

@bom_bp.route('/boms', methods=['GET'])
@jwt_required()
def get_boms():
    """Get all BOMs with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        all_boms = request.args.get('all', 'false').lower() == 'true'
        product_id = request.args.get('product_id', type=int)
        is_active = request.args.get('is_active', type=bool)
        search = request.args.get('search', '')

        query = BillOfMaterials.query.join(Product)
        
        if product_id:
            query = query.filter(BillOfMaterials.product_id == product_id)
        if is_active is not None:
            query = query.filter(BillOfMaterials.is_active == is_active)
        if search:
            query = query.filter(
                db.or_(
                    BillOfMaterials.bom_number.ilike(f'%{search}%'),
                    Product.name.ilike(f'%{search}%'),
                    Product.code.ilike(f'%{search}%')
                )
            )

        # If all=true, return all BOMs without pagination
        if all_boms:
            boms_list = query.order_by(Product.code).all()
            return jsonify({
                'boms': [{
                    'id': bom.id,
                    'bom_number': bom.bom_number,
                    'product_id': bom.product_id,
                    'product_name': get_product_name_from_new(bom.product.code) or (bom.product.name if bom.product else None),
                    'product_code': bom.product.code if bom.product else None,
                    'version': bom.version,
                    'is_active': bom.is_active,
                    'effective_date': bom.effective_date.isoformat() if bom.effective_date else None,
                    'expiry_date': bom.expiry_date.isoformat() if bom.expiry_date else None,
                    'batch_size': float(bom.batch_size) if bom.batch_size else 0,
                    'batch_uom': bom.batch_uom,
                    'pack_per_carton': bom.pack_per_carton,
                    'total_cost': float(bom.total_cost) if bom.total_cost else 0,
                    'total_materials': bom.total_materials,
                    'critical_materials': bom.critical_materials,
                    'created_at': bom.created_at.isoformat() if bom.created_at else None,
                    'created_by': bom.created_by_user.username if bom.created_by_user else None
                } for bom in boms_list],
                'total': len(boms_list)
            }), 200

        boms = query.order_by(desc(BillOfMaterials.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )

        return jsonify({
            'boms': [{
                'id': bom.id,
                'bom_number': bom.bom_number,
                'product_id': bom.product_id,
                'product_name': get_product_name_from_new(bom.product.code) or (bom.product.name if bom.product else None),
                'product_code': bom.product.code if bom.product else None,
                'version': bom.version,
                'is_active': bom.is_active,
                'effective_date': bom.effective_date.isoformat() if bom.effective_date else None,
                'expiry_date': bom.expiry_date.isoformat() if bom.expiry_date else None,
                'batch_size': float(bom.batch_size) if bom.batch_size else 0,
                'batch_uom': bom.batch_uom,
                'pack_per_carton': bom.pack_per_carton,
                'total_cost': float(bom.total_cost) if bom.total_cost else 0,
                'total_materials': bom.total_materials,
                'critical_materials': bom.critical_materials,
                'created_at': bom.created_at.isoformat() if bom.created_at else None,
                'created_by': bom.created_by_user.username if bom.created_by_user else None
            } for bom in boms.items],
            'total': boms.total,
            'pages': boms.pages,
            'current_page': boms.page
        }), 200

    except Exception as e:
        return error_response(str(e)), 500

@bom_bp.route('/boms/<int:bom_id>', methods=['GET'])
@jwt_required()
def get_bom(bom_id):
    """Get specific BOM with all items and stock information"""
    try:
        bom = BillOfMaterials.query.get_or_404(bom_id)
        
        # Get BOM items with stock information
        items = []
        for item in bom.items:
            item_data = {
                'id': item.id,
                'line_number': item.line_number,
                'material_id': item.material_id,
                'product_id': item.product_id,
                'item_name': item.item_name,
                'item_code': item.item_code,
                'item_type': item.item_type,
                'quantity': float(item.quantity),
                'uom': item.uom,
                'percentage': float(item.percentage) if item.percentage else 0,
                'scrap_percent': float(item.scrap_percent),
                'effective_quantity': float(item.effective_quantity),
                'is_critical': item.is_critical,
                'unit_cost': float(item.unit_cost) if item.unit_cost else None,
                'total_cost': float(item.total_cost),
                'current_stock': float(item.current_stock),
                'shortage_quantity': float(item.shortage_quantity),
                'is_shortage': item.is_shortage,
                'notes': item.notes,
                'supplier_id': item.supplier_id,
                'supplier_name': item.supplier.name if item.supplier else None,
                'lead_time_days': item.lead_time_days
            }
            items.append(item_data)

        return jsonify({
            'bom': {
                'id': bom.id,
                'bom_number': bom.bom_number,
                'product_id': bom.product_id,
                'product_name': get_product_name_from_new(bom.product.code) or bom.product.name,
                'product_code': bom.product.code,
                'version': bom.version,
                'is_active': bom.is_active,
                'effective_date': bom.effective_date.isoformat() if bom.effective_date else None,
                'expiry_date': bom.expiry_date.isoformat() if bom.expiry_date else None,
                'batch_size': float(bom.batch_size),
                'batch_uom': bom.batch_uom,
                'pack_per_carton': bom.pack_per_carton,
                'notes': bom.notes,
                'total_cost': float(bom.total_cost),
                'total_materials': bom.total_materials,
                'critical_materials': bom.critical_materials,
                'items': items,
                'created_at': bom.created_at.isoformat(),
                'created_by': bom.created_by_user.username if bom.created_by_user else None
            }
        }), 200

    except Exception as e:
        return error_response(str(e)), 500

@bom_bp.route('/boms', methods=['POST'])
@jwt_required()
def create_bom():
    """Create new BOM"""
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())
        
        print(f"Creating BOM with data: {data}")

        # Generate BOM number if not provided
        bom_number = data.get('bom_number')
        if not bom_number:
            bom_number = generate_number('BOM', BillOfMaterials, 'bom_number')

        # Create BOM
        bom = BillOfMaterials(
            bom_number=bom_number,
            product_id=data['product_id'],
            version=data.get('version', '1.0'),
            is_active=data.get('is_active', True),
            effective_date=datetime.fromisoformat(data['effective_date']).date() if data.get('effective_date') else get_local_today(),
            expiry_date=datetime.fromisoformat(data['expiry_date']).date() if data.get('expiry_date') else None,
            batch_size=data.get('batch_size', 1),
            batch_uom=data.get('batch_uom', 'carton'),
            pack_per_carton=data.get('pack_per_carton', 1),
            notes=data.get('notes', ''),
            created_by=user_id
        )

        db.session.add(bom)
        db.session.flush()  # Get BOM ID

        # Create BOM items
        for item_data in data.get('items', []):
            bom_item = BOMItem(
                bom_id=bom.id,
                line_number=item_data['line_number'],
                material_id=item_data.get('material_id'),
                product_id=item_data.get('product_id'),
                quantity=item_data['quantity'],
                uom=item_data['uom'],
                percentage=item_data.get('percentage', 0),
                scrap_percent=item_data.get('scrap_percent', 0),
                is_critical=item_data.get('is_critical', False),
                unit_cost=item_data.get('unit_cost', 0),
                notes=item_data.get('notes', ''),
                supplier_id=item_data.get('supplier_id'),
                lead_time_days=item_data.get('lead_time_days', 0)
            )
            db.session.add(bom_item)

        db.session.commit()
        
        print(f"BOM created successfully: {bom.bom_number} (ID: {bom.id})")

        return success_response('BOM created successfully', {
            'bom_id': bom.id,
            'bom_number': bom.bom_number
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error creating BOM: {str(e)}")
        import traceback
        traceback.print_exc()
        return error_response(str(e)), 500

@bom_bp.route('/boms/<int:bom_id>', methods=['PUT'])
@jwt_required()
def update_bom(bom_id):
    """Update existing BOM"""
    try:
        bom = BillOfMaterials.query.get_or_404(bom_id)
        data = request.get_json()
        user_id = int(get_jwt_identity())

        # Skip version history for now (can be added later)

        # Update BOM - allow full editing including name and product
        if 'bom_number' in data and data['bom_number'] != bom.bom_number:
            # Check if new bom_number is unique
            existing = BillOfMaterials.query.filter(
                BillOfMaterials.bom_number == data['bom_number'],
                BillOfMaterials.id != bom_id
            ).first()
            if existing:
                return error_response('BOM number already exists'), 400
            bom.bom_number = data['bom_number']
        
        if 'product_id' in data and data['product_id'] != bom.product_id:
            # Check if product exists
            product = Product.query.get(data['product_id'])
            if not product:
                return error_response('Product not found'), 404
            bom.product_id = data['product_id']
        
        bom.version = data.get('version', bom.version)
        bom.is_active = data.get('is_active', bom.is_active)
        bom.effective_date = datetime.fromisoformat(data['effective_date']).date() if data.get('effective_date') else bom.effective_date
        bom.expiry_date = datetime.fromisoformat(data['expiry_date']).date() if data.get('expiry_date') else bom.expiry_date
        bom.batch_size = data.get('batch_size', bom.batch_size)
        bom.batch_uom = data.get('batch_uom', bom.batch_uom)
        bom.pack_per_carton = data.get('pack_per_carton', bom.pack_per_carton)
        bom.notes = data.get('notes', bom.notes)
        bom.updated_at = get_local_now()

        # Update BOM items
        if 'items' in data:
            # Delete existing items
            BOMItem.query.filter_by(bom_id=bom.id).delete()
            
            # Create new items
            for item_data in data['items']:
                bom_item = BOMItem(
                    bom_id=bom.id,
                    line_number=item_data['line_number'],
                    material_id=item_data.get('material_id'),
                    product_id=item_data.get('product_id'),
                    quantity=item_data['quantity'],
                    uom=item_data['uom'],
                    percentage=item_data.get('percentage', 0),
                    scrap_percent=item_data.get('scrap_percent', 0),
                    is_critical=item_data.get('is_critical', False),
                    unit_cost=item_data.get('unit_cost', 0),
                    notes=item_data.get('notes', ''),
                    supplier_id=item_data.get('supplier_id'),
                    lead_time_days=item_data.get('lead_time_days', 0)
                )
                db.session.add(bom_item)

        db.session.commit()

        return success_response('BOM updated successfully'), 200

    except Exception as e:
        db.session.rollback()
        return error_response(str(e)), 500

@bom_bp.route('/boms/<int:bom_id>', methods=['DELETE'])
@jwt_required()
def delete_bom(bom_id):
    """Delete BOM"""
    try:
        bom = BillOfMaterials.query.get_or_404(bom_id)
        
        # Check if BOM is used in work orders
        from models.production import WorkOrder
        work_orders = WorkOrder.query.filter_by(bom_id=bom_id).count()
        if work_orders > 0:
            return error_response('Cannot delete BOM that is used in work orders'), 400

        db.session.delete(bom)
        db.session.commit()

        return success_response('BOM deleted successfully'), 200

    except Exception as e:
        db.session.rollback()
        return error_response(str(e)), 500

@bom_bp.route('/boms/<int:bom_id>/shortage-analysis', methods=['GET'])
@jwt_required()
def get_bom_shortage_analysis(bom_id):
    """Get material shortage analysis for BOM"""
    try:
        bom = BillOfMaterials.query.get_or_404(bom_id)
        production_qty = request.args.get('production_qty', 1, type=float)

        shortage_items = []
        total_shortage_cost = 0

        for item in bom.items:
            required_qty = float(item.effective_quantity) * production_qty
            available_qty = item.current_stock
            shortage_qty = max(0, required_qty - available_qty)
            
            if shortage_qty > 0:
                shortage_cost = shortage_qty * (float(item.unit_cost) if item.unit_cost else 0)
                total_shortage_cost += shortage_cost
                
                shortage_items.append({
                    'item_id': item.id,
                    'item_name': item.item_name,
                    'item_code': item.item_code,
                    'item_type': item.item_type,
                    'required_quantity': required_qty,
                    'available_quantity': available_qty,
                    'shortage_quantity': shortage_qty,
                    'unit_cost': float(item.unit_cost) if item.unit_cost else 0,
                    'shortage_cost': shortage_cost,
                    'is_critical': item.is_critical,
                    'supplier_name': item.supplier.name if item.supplier else None,
                    'lead_time_days': item.lead_time_days
                })

        return jsonify({
            'bom_number': bom.bom_number,
            'product_name': get_product_name_from_new(bom.product.code) or bom.product.name,
            'production_quantity': production_qty,
            'total_shortage_items': len(shortage_items),
            'total_shortage_cost': total_shortage_cost,
            'shortage_items': shortage_items
        }), 200

    except Exception as e:
        return error_response(str(e)), 500

@bom_bp.route('/boms/<int:bom_id>/cost-analysis', methods=['POST'])
@jwt_required()
def create_bom_cost_analysis(bom_id):
    """Create cost analysis for BOM"""
    try:
        bom = BillOfMaterials.query.get_or_404(bom_id)
        
        # Calculate costs by material type
        raw_material_cost = 0
        packaging_cost = 0
        chemical_cost = 0
        total_material_cost = 0

        for item in bom.items:
            item_cost = float(item.total_cost)
            total_material_cost += item_cost
            
            if item.material:
                if item.material.material_type == 'raw_materials':
                    raw_material_cost += item_cost
                elif item.material.material_type == 'packaging_materials':
                    packaging_cost += item_cost
                elif item.material.material_type == 'chemical_materials':
                    chemical_cost += item_cost

        # Return cost analysis without saving to database for now
        return jsonify({
            'cost_analysis': {
                'analysis_date': get_local_today().isoformat(),
                'total_material_cost': float(total_material_cost),
                'cost_per_unit': float(total_material_cost / float(bom.batch_size)) if bom.batch_size > 0 else 0,
                'raw_material_cost': float(raw_material_cost),
                'packaging_cost': float(packaging_cost),
                'chemical_cost': float(chemical_cost)
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return error_response(str(e)), 500

@bom_bp.route('/materials', methods=['GET'])
@jwt_required()
def get_materials_for_bom():
    """Get materials for BOM creation"""
    try:
        material_type = request.args.get('material_type')
        is_active = request.args.get('is_active', True, type=bool)
        search = request.args.get('search', '')

        query = Material.query
        
        if material_type:
            query = query.filter(Material.material_type == material_type)
        if is_active is not None:
            query = query.filter(Material.is_active == is_active)
        if search:
            query = query.filter(
                db.or_(
                    Material.name.ilike(f'%{search}%'),
                    Material.code.ilike(f'%{search}%')
                )
            )

        materials = query.order_by(Material.name).all()

        return jsonify({
            'materials': [{
                'id': material.id,
                'code': material.code,
                'name': material.name,
                'material_type': material.material_type,
                'category': material.category,
                'primary_uom': material.primary_uom,
                'cost_per_unit': float(material.cost_per_unit),
                'supplier_name': material.supplier.name if material.supplier else None,
                'lead_time_days': material.lead_time_days,
                'is_hazardous': material.is_hazardous
            } for material in materials]
        }), 200

    except Exception as e:
        return error_response(str(e)), 500

@bom_bp.route('/products', methods=['GET'])
@jwt_required()
def get_products_for_bom():
    """Get products for BOM creation"""
    try:
        is_producible = request.args.get('is_producible', True, type=bool)
        is_active = request.args.get('is_active', True, type=bool)
        search = request.args.get('search', '')

        query = Product.query
        
        if is_producible is not None:
            query = query.filter(Product.is_producible == is_producible)
        if is_active is not None:
            query = query.filter(Product.is_active == is_active)
        if search:
            query = query.filter(
                db.or_(
                    Product.name.ilike(f'%{search}%'),
                    Product.code.ilike(f'%{search}%')
                )
            )

        products = query.order_by(Product.name).all()

        return jsonify({
            'products': [{
                'id': product.id,
                'code': product.code,
                'name': product.name,
                'material_type': product.material_type,
                'primary_uom': product.primary_uom,
                'cost': float(product.cost),
                'price': float(product.price),
                'category_name': product.category.name if product.category else None
            } for product in products]
        }), 200

    except Exception as e:
        return error_response(str(e)), 500
