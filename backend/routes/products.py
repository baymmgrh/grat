from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Product, ProductCategory, ProductSpecification, ProductPackaging, Material, Inventory, SalesOrder
from utils.i18n import success_response, error_response, get_message
from sqlalchemy import or_, func
from utils.calculations import (
    calculate_gsm, calculate_sheet_weight, validate_nonwoven_specs,
    calculate_packaging_structure, convert_uom, NONWOVEN_CATEGORIES
)

products_bp = Blueprint('products', __name__)

@products_bp.route('/categories', methods=['GET'])
def get_nonwoven_categories():
    """Get all nonwoven product categories"""
    return jsonify({
        'categories': [
            {
                'id': key,
                'name': category['name'],
                'gsm_range': category['typical_gsm_range'],
                'width_range': category['typical_width_range'],
                'length_range': category['typical_length_range'],
                'weight_range': category['weight_per_sheet_range']
            }
            for key, category in NONWOVEN_CATEGORIES.items()
        ]
    })

@products_bp.route('/calculate/gsm', methods=['POST'])
def calculate_gsm_endpoint():
    """Calculate GSM for nonwoven fabric"""
    try:
        data = request.get_json()
        width_cm = data.get('width_cm', 0)
        length_m = data.get('length_m', 0)
        weight_g = data.get('weight_g', 0)

        gsm = calculate_gsm(width_cm, length_m, weight_g)

        return jsonify({
            'gsm': gsm,
            'inputs': {
                'width_cm': width_cm,
                'length_m': length_m,
                'weight_g': weight_g
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@products_bp.route('/calculate/sheet-weight', methods=['POST'])
def calculate_sheet_weight_endpoint():
    """Calculate weight per sheet"""
    try:
        data = request.get_json()
        gsm = data.get('gsm', 0)
        width_cm = data.get('width_cm', 0)
        length_cm = data.get('length_cm', 0)

        weight_g = calculate_sheet_weight(gsm, width_cm, length_cm)

        return jsonify({
            'weight_per_sheet_g': weight_g,
            'inputs': {
                'gsm': gsm,
                'width_cm': width_cm,
                'length_cm': length_cm
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@products_bp.route('/validate/specifications', methods=['POST'])
def validate_specifications():
    """Validate nonwoven specifications against category standards"""
    try:
        data = request.get_json()
        category = data.get('category', '')
        gsm = data.get('gsm', 0)
        width_cm = data.get('width_cm', 0)
        length_cm = data.get('length_cm', 0)

        validation = validate_nonwoven_specs(category, gsm, width_cm, length_cm)

        return jsonify(validation)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@products_bp.route('/calculate/packaging', methods=['POST'])
def calculate_packaging():
    """Calculate packaging structure"""
    try:
        data = request.get_json()
        sheets_per_pack = data.get('sheets_per_pack', 0)
        packs_per_karton = data.get('packs_per_karton', 0)

        packaging = calculate_packaging_structure(sheets_per_pack, packs_per_karton)

        return jsonify(packaging)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@products_bp.route('/convert/uom', methods=['POST'])
def convert_uom_endpoint():
    """Convert between units of measurement"""
    try:
        data = request.get_json()
        value = data.get('value', 0)
        from_uom = data.get('from_uom', '')
        to_uom = data.get('to_uom', '')

        converted_value = convert_uom(value, from_uom, to_uom)

        return jsonify({
            'original_value': value,
            'from_uom': from_uom,
            'to_uom': to_uom,
            'converted_value': converted_value
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@products_bp.route('', methods=['GET'])
@products_bp.route('/', methods=['GET'])
@jwt_required()
def get_products():
    """Get all products with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        all_products = request.args.get('all', 'false').lower() == 'true'
        search = request.args.get('search', '')
        category_id = request.args.get('category_id', type=int)
        material_type = request.args.get('material_type')
        is_active = request.args.get('is_active', type=bool)
        
        query = Product.query
        
        if search:
            query = query.filter(or_(
                Product.code.ilike(f'%{search}%'),
                Product.name.ilike(f'%{search}%')
            ))
        
        if category_id:
            query = query.filter_by(category_id=category_id)
        
        if material_type:
            query = query.filter_by(material_type=material_type)
        
        if is_active is not None:
            query = query.filter_by(is_active=is_active)
        
        # If all=true, return all products without pagination (for dropdowns)
        if all_products:
            products_list = query.order_by(Product.code).all()
            return jsonify({
                'products': [{
                    'id': p.id,
                    'code': p.code,
                    'name': p.name,
                    'description': p.description,
                    'category': p.category.name if p.category else None,
                    'nonwoven_category': p.nonwoven_category,
                    'primary_uom': p.primary_uom,
                    'price': float(p.price) if p.price else 0,
                    'cost': float(p.cost) if p.cost else 0,
                    'material_type': p.material_type,
                    'is_active': p.is_active,
                    'is_sellable': p.is_sellable,
                    'is_purchasable': p.is_purchasable,
                    'is_producible': p.is_producible,
                    'packs_per_karton': p.packaging.packs_per_karton if p.packaging else None,  # From ProductPackaging
                    'created_at': p.created_at.isoformat() if p.created_at else None
                } for p in products_list],
                'total': len(products_list)
            }), 200
        
        products = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'products': [{
                'id': p.id,
                'code': p.code,
                'name': p.name,
                'description': p.description,
                'category': p.category.name if p.category else None,
                'nonwoven_category': p.nonwoven_category,
                'primary_uom': p.primary_uom,
                'price': float(p.price) if p.price else 0,
                'cost': float(p.cost) if p.cost else 0,
                'material_type': p.material_type,
                'is_active': p.is_active,
                'is_sellable': p.is_sellable,
                'is_purchasable': p.is_purchasable,
                'is_producible': p.is_producible,
                'packs_per_karton': p.packaging.packs_per_karton if p.packaging else None,  # From ProductPackaging
                'created_at': p.created_at.isoformat() if p.created_at else None
            } for p in products.items],
            'total': products.total,
            'pages': products.pages,
            'current_page': products.page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_product(id):
    """Get single product details"""
    try:
        product = Product.query.get(id)
        
        if not product:
            return jsonify(error_response('api.error', error_code=404)), 404
        
        result = {
            'id': product.id,
            'code': product.code,
            'name': product.name,
            'description': product.description,
            'category_id': product.category_id,
            'category': product.category.name if product.category else None,
            'nonwoven_category': product.nonwoven_category,
            'primary_uom': product.primary_uom,
            'secondary_uom': product.secondary_uom,
            'price': float(product.price),
            'cost': float(product.cost),
            'material_type': product.material_type,
            'min_stock_level': float(product.min_stock_level) if product.min_stock_level else 0,
            'max_stock_level': float(product.max_stock_level) if product.max_stock_level else 0,
            'reorder_point': float(product.reorder_point) if product.reorder_point else 0,
            'is_active': product.is_active,
            'is_sellable': product.is_sellable,
            'is_purchasable': product.is_purchasable,
            'is_producible': product.is_producible,
            'lead_time_days': product.lead_time_days,
            'created_at': product.created_at.isoformat()
        }
        
        # Add specification fields to top level (for easier form handling)
        if product.specification:
            spec = product.specification
            result.update({
                'gsm': float(spec.gsm) if spec.gsm else None,
                'width_cm': float(spec.width_cm) if spec.width_cm else None,
                'length_m': float(spec.length_m) if spec.length_m else None,
                'thickness_mm': float(spec.thickness_mm) if spec.thickness_mm else None,
                'color': spec.color,
                'weight_per_sheet_g': float(spec.weight_per_sheet_g) if spec.weight_per_sheet_g else None,
                'absorbency': spec.absorbency,
                'tensile_strength': spec.tensile_strength,
                'ph_level': spec.ph_level,
                'fragrance': spec.fragrance,
                'alcohol_content': spec.alcohol_content
            })
            # Also keep nested structure for backward compatibility
            result['specification'] = {
                'gsm': float(spec.gsm) if spec.gsm else None,
                'width_cm': float(spec.width_cm) if spec.width_cm else None,
                'length_m': float(spec.length_m) if spec.length_m else None,
                'thickness_mm': float(spec.thickness_mm) if spec.thickness_mm else None,
                'color': spec.color,
                'weight_per_sheet_g': float(spec.weight_per_sheet_g) if spec.weight_per_sheet_g else None,
                'absorbency': spec.absorbency,
                'tensile_strength': spec.tensile_strength,
                'ph_level': spec.ph_level,
                'fragrance': spec.fragrance,
                'alcohol_content': spec.alcohol_content
            }
        
        # Add packaging fields to top level (for easier form handling)
        if product.packaging:
            pack = product.packaging
            result.update({
                'sheets_per_pack': pack.sheets_per_pack,
                'packs_per_karton': pack.packs_per_karton,
                'sheets_per_karton': pack.sheets_per_karton,
                'pack_weight_kg': float(pack.pack_weight_kg) if pack.pack_weight_kg else None,
                'karton_weight_kg': float(pack.karton_weight_kg) if pack.karton_weight_kg else None,
                'pack_dimensions': pack.pack_dimensions,
                'karton_dimensions': pack.karton_dimensions,
                'barcode_pack': pack.barcode_pack,
                'barcode_karton': pack.barcode_karton
            })
            # Also keep nested structure for backward compatibility
            result['packaging'] = {
                'sheets_per_pack': pack.sheets_per_pack,
                'packs_per_karton': pack.packs_per_karton,
                'sheets_per_karton': pack.sheets_per_karton,
                'pack_weight_kg': float(pack.pack_weight_kg) if pack.pack_weight_kg else None,
                'karton_weight_kg': float(pack.karton_weight_kg) if pack.karton_weight_kg else None,
                'pack_dimensions': pack.pack_dimensions,
                'karton_dimensions': pack.karton_dimensions,
                'barcode_pack': pack.barcode_pack,
                'barcode_karton': pack.barcode_karton
            }
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/', methods=['POST'])
@jwt_required()
def create_product():
    """Create new product"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('code') or not data.get('name'):
            return jsonify(error_response('api.error', error_code=400)), 400
        
        # Check if code exists
        if Product.query.filter_by(code=data['code']).first():
            return jsonify(error_response('api.error', error_code=409)), 409
        
        # Create product
        product = Product(
            code=data['code'],
            name=data['name'],
            description=data.get('description'),
            category_id=data.get('category_id'),
            nonwoven_category=data.get('nonwoven_category'),
            primary_uom=data.get('primary_uom', 'PCS'),
            secondary_uom=data.get('secondary_uom'),
            price=data.get('price', 0),
            cost=data.get('cost', 0),
            material_type=data.get('material_type', 'finished_goods'),
            min_stock_level=data.get('min_stock_level', 0),
            max_stock_level=data.get('max_stock_level', 0),
            reorder_point=data.get('reorder_point', 0),
            is_active=data.get('is_active', True),
            is_sellable=data.get('is_sellable', True),
            is_purchasable=data.get('is_purchasable', True),
            is_producible=data.get('is_producible', False),
            lead_time_days=data.get('lead_time_days', 0)
        )
        
        db.session.add(product)
        db.session.flush()
        
        # Create specification if provided (handle both nested and flat structure)
        spec_fields = ['gsm', 'width_cm', 'length_m', 'thickness_mm', 'color', 
                      'weight_per_sheet_g', 'absorbency', 'tensile_strength', 
                      'ph_level', 'fragrance', 'alcohol_content']
        
        if 'specification' in data:
            # Nested structure
            spec_data = data['specification']
        else:
            # Flat structure - extract spec fields from main data
            spec_data = {field: data.get(field) for field in spec_fields if field in data}
        
        if spec_data and any(v is not None for v in spec_data.values()):
            spec = ProductSpecification(
                product_id=product.id,
                **{k: v for k, v in spec_data.items() if v is not None}
            )
            db.session.add(spec)
        
        # Create packaging if provided (handle both nested and flat structure)
        pack_fields = ['sheets_per_pack', 'packs_per_karton', 'pack_weight_kg', 
                      'karton_weight_kg', 'pack_dimensions', 'karton_dimensions',
                      'barcode_pack', 'barcode_karton']
        
        if 'packaging' in data:
            # Nested structure
            pack_data = data['packaging']
        else:
            # Flat structure - extract pack fields from main data
            pack_data = {field: data.get(field) for field in pack_fields if field in data}
        
        if pack_data and any(v is not None for v in pack_data.values()):
            # Calculate sheets_per_karton if both sheets_per_pack and packs_per_karton are provided
            if pack_data.get('sheets_per_pack') and pack_data.get('packs_per_karton'):
                pack_data['sheets_per_karton'] = pack_data['sheets_per_pack'] * pack_data['packs_per_karton']
            
            pack = ProductPackaging(
                product_id=product.id,
                **{k: v for k, v in pack_data.items() if v is not None}
            )
            db.session.add(pack)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Product created successfully',
            'product_id': product.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@products_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_product(id):
    """Update product"""
    try:
        product = Product.query.get(id)
        
        if not product:
            return jsonify(error_response('api.error', error_code=404)), 404
        
        data = request.get_json()
        
        # Update basic fields
        if 'name' in data:
            product.name = data['name']
        if 'description' in data:
            product.description = data['description']
        if 'category_id' in data:
            product.category_id = data['category_id']
        if 'nonwoven_category' in data:
            product.nonwoven_category = data['nonwoven_category']
        if 'primary_uom' in data:
            product.primary_uom = data['primary_uom']
        if 'material_type' in data:
            product.material_type = data['material_type']
        if 'price' in data:
            product.price = data['price']
        if 'cost' in data:
            product.cost = data['cost']
        if 'is_active' in data:
            product.is_active = data['is_active']
        
        # Update specification if provided (handle both nested and flat structure)
        spec_fields = ['gsm', 'width_cm', 'length_m', 'thickness_mm', 'color', 
                      'weight_per_sheet_g', 'absorbency', 'tensile_strength', 
                      'ph_level', 'fragrance', 'alcohol_content']
        
        if 'specification' in data:
            # Nested structure
            spec_data = data['specification']
        else:
            # Flat structure - extract spec fields from main data
            spec_data = {field: data.get(field) for field in spec_fields if field in data}
        
        if spec_data and any(v is not None for v in spec_data.values()):
            if product.specification:
                spec = product.specification
                for key, value in spec_data.items():
                    if hasattr(spec, key):
                        setattr(spec, key, value)
            else:
                spec = ProductSpecification(
                    product_id=product.id, 
                    **{k: v for k, v in spec_data.items() if v is not None}
                )
                db.session.add(spec)
        
        # Update packaging if provided (handle both nested and flat structure)
        pack_fields = ['sheets_per_pack', 'packs_per_karton', 'pack_weight_kg', 
                      'karton_weight_kg', 'pack_dimensions', 'karton_dimensions',
                      'barcode_pack', 'barcode_karton']
        
        if 'packaging' in data:
            # Nested structure
            pack_data = data['packaging']
        else:
            # Flat structure - extract pack fields from main data
            pack_data = {field: data.get(field) for field in pack_fields if field in data}
        
        if pack_data and any(v is not None for v in pack_data.values()):
            # Calculate sheets_per_karton if both sheets_per_pack and packs_per_karton are provided
            if pack_data.get('sheets_per_pack') and pack_data.get('packs_per_karton'):
                pack_data['sheets_per_karton'] = pack_data['sheets_per_pack'] * pack_data['packs_per_karton']
            
            if product.packaging:
                pack = product.packaging
                for key, value in pack_data.items():
                    if hasattr(pack, key):
                        setattr(pack, key, value)
            else:
                pack = ProductPackaging(
                    product_id=product.id, 
                    **{k: v for k, v in pack_data.items() if v is not None}
                )
                db.session.add(pack)
        
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@products_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_product(id):
    """Delete product"""
    try:
        product = Product.query.get(id)
        
        if not product:
            return jsonify(error_response('api.error', error_code=404)), 404
        
        db.session.delete(product)
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@products_bp.route('/delete-all', methods=['DELETE'])
@jwt_required()
def delete_all_products():
    """Delete all products from database"""
    try:
        # Get count before deletion for confirmation
        total_products = Product.query.count()
        
        if total_products == 0:
            return jsonify({
                'message': 'No products found to delete',
                'deleted_count': 0
            }), 200
        
        # Delete all products
        deleted_count = Product.query.delete()
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully deleted all products from database',
            'deleted_count': deleted_count,
            'previous_total': total_products
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@products_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    """Get all product categories"""
    try:
        categories = ProductCategory.query.filter_by(is_active=True).all()
        
        return jsonify({
            'categories': [{
                'id': c.id,
                'code': c.code,
                'name': c.name,
                'description': c.description
            } for c in categories]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/categories', methods=['POST'])
@jwt_required()
def create_category():
    """Create new product category"""
    try:
        data = request.get_json()
        
        if not data.get('code') or not data.get('name'):
            return jsonify(error_response('api.error', error_code=400)), 400
        
        if ProductCategory.query.filter_by(code=data['code']).first():
            return jsonify(error_response('api.error', error_code=409)), 409
        
        category = ProductCategory(
            code=data['code'],
            name=data['name'],
            description=data.get('description'),
            parent_id=data.get('parent_id')
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'message': 'Category created successfully',
            'category_id': category.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@products_bp.route('/categories/<category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    """Update product category"""
    try:
        category = ProductCategory.query.get_or_404(category_id)
        data = request.get_json()
        
        if data.get('code') and data['code'] != category.code:
            if ProductCategory.query.filter_by(code=data['code']).first():
                return jsonify(error_response('api.error', error_code=409)), 409
            category.code = data['code']
        
        if data.get('name'):
            category.name = data['name']
        if data.get('description'):
            category.description = data['description']
        if 'parent_id' in data:
            category.parent_id = data['parent_id']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Category updated successfully',
            'category': {
                'id': category.id,
                'code': category.code,
                'name': category.name,
                'description': category.description
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@products_bp.route('/categories/<category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    """Delete product category"""
    try:
        category = ProductCategory.query.get_or_404(category_id)
        
        # Check if category has products
        product_count = Product.query.filter_by(category_id=category.id).count()
        if product_count > 0:
            return jsonify({
                'error': f'Cannot delete category. It has {product_count} products assigned.'
            }), 400
        
        # Soft delete by setting is_active to False
        category.is_active = False
        db.session.commit()
        
        return jsonify({
            'message': 'Category deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Dashboard and Analytics Endpoints
@products_bp.route('/dashboard/kpis', methods=['GET'])
@jwt_required()
def get_dashboard_kpis():
    """Get product dashboard KPIs"""
    try:
        # Calculate real KPIs from database
        total_products = Product.query.count()
        active_products = Product.query.filter_by(is_active=True).count()
        inactive_products = total_products - active_products
        
        # Count categories
        total_categories = ProductCategory.query.count()
        
        # Calculate stock alerts (simplified for now)
        low_stock_products = 0
        out_of_stock_products = 0
        
        # Calculate total value (simplified for now)
        total_value = 0
        
        avg_price = db.session.query(func.avg(Product.price)).filter(
            Product.is_active == True
        ).scalar() or 0
        
        kpis = {
            'total_products': total_products,
            'active_products': active_products,
            'inactive_products': inactive_products,
            'total_categories': total_categories,
            'low_stock_products': low_stock_products,
            'out_of_stock_products': out_of_stock_products,
            'total_value': float(total_value),
            'avg_price': float(avg_price)
        }
        
        return jsonify({'kpis': kpis}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/dashboard/top-products', methods=['GET'])
@jwt_required()
def get_top_products():
    """Get top selling products"""
    try:
        # Get real top selling products from sales orders
        products = []
        
        # Get products with sales data (simplified for now)
        # Note: This requires proper SalesOrderItem model relationship
        # For now, return empty until proper relationship is established
        top_products = []
        
        for product_name, sales_qty, sales_value in top_products:
            # Calculate profit margin (simplified)
            profit_margin = 20.0  # Default margin, can be enhanced with cost data
            
            products.append({
                'product_name': product_name,
                'sales_qty': int(sales_qty or 0),
                'sales_value': float(sales_value or 0),
                'profit_margin': profit_margin
            })
        
        return jsonify({'products': products}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/dashboard/categories', methods=['GET'])
@jwt_required()
def get_dashboard_categories():
    """Get category distribution for dashboard"""
    try:
        # Get real category distribution from database
        categories = []
        
        # Get category data (simplified for now)
        category_data = db.session.query(
            ProductCategory.name,
            func.count(Product.id).label('product_count')
        ).outerjoin(Product).group_by(
            ProductCategory.id, ProductCategory.name
        ).all()
        
        for category_name, product_count in category_data:
            categories.append({
                'category': category_name or 'Uncategorized',
                'product_count': int(product_count or 0),
                'total_value': 0  # Simplified for now
            })
        
        return jsonify({'categories': categories}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/dashboard/stock-alerts', methods=['GET'])
@jwt_required()
def get_stock_alerts():
    """Get stock alerts for dashboard"""
    try:
        # Get real stock alerts from database
        alerts = []
        
        # Get products with low stock or out of stock (simplified for now)
        stock_alerts = []
        
        for product_id, product_name, min_stock, current_stock, last_updated in stock_alerts:
            status = 'out_of_stock' if current_stock == 0 else 'low_stock'
            
            alerts.append({
                'id': product_id,
                'product_name': product_name,
                'current_stock': int(current_stock),
                'min_stock': int(min_stock or 0),
                'status': status,
                'last_updated': last_updated.isoformat() if last_updated else None
            })
        
        return jsonify({'alerts': alerts}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/dashboard/trends', methods=['GET'])
@jwt_required()
def get_dashboard_trends():
    """Get product trends for dashboard"""
    try:
        # Return empty trends - to be implemented when product lifecycle tracking is needed
        trends = []
        
        return jsonify({'trends': trends}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===============================
# ANALYTICS ENDPOINTS
# ===============================

@products_bp.route('/analytics/performance', methods=['GET'])
@jwt_required()
def get_analytics_performance():
    """Get product performance analytics"""
    try:
        period = request.args.get('period', '3months')
        category = request.args.get('category', 'all')
        
        # Return empty performance data - to be implemented when detailed analytics are needed
        performance = []
        
        return jsonify({'performance': performance}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/analytics/timeline', methods=['GET'])
@jwt_required()
def get_analytics_timeline():
    """Get product analytics timeline"""
    try:
        period = request.args.get('period', '3months')
        
        # Return empty timeline data - to be implemented when timeline analytics are needed
        timeline = []
        
        return jsonify({'timeline': timeline}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/analytics/categories', methods=['GET'])
@jwt_required()
def get_analytics_categories():
    """Get category performance analytics"""
    try:
        period = request.args.get('period', '3months')
        
        # Return empty categories data - to be implemented when category analytics are needed
        categories = []
        
        return jsonify({'categories': categories}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/analytics/profitability', methods=['GET'])
@jwt_required()
def get_analytics_profitability():
    """Get profitability analytics"""
    try:
        period = request.args.get('period', '3months')
        
        # Return empty profitability data - to be implemented when cost tracking is available
        profitability = []
        
        return jsonify({'profitability': profitability}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/analytics/seasonality', methods=['GET'])
@jwt_required()
def get_analytics_seasonality():
    """Get seasonality analytics"""
    try:
        # Return empty seasonality data - to be implemented when seasonal analysis is needed
        seasonality = []
        
        return jsonify({'seasonality': seasonality}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===============================
# BOM ENDPOINTS
# ===============================

@products_bp.route('/bom', methods=['GET'])
@jwt_required()
def get_product_bom():
    """Get Bill of Materials for products"""
    try:
        # Return empty BOM list - to be implemented when BOM management is needed
        bom_list = []
        
        return jsonify({'bom_list': bom_list}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/materials', methods=['GET'])
@jwt_required()
def get_product_materials():
    """Get materials for BOM management"""
    try:
        # Return empty materials - to be implemented when material management is integrated
        materials = []
        
        return jsonify({'materials': materials}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
