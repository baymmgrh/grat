from flask import Blueprint, request, jsonify
from models import db
from models.product_excel_schema import ProductNew, ProductVersion
from datetime import datetime
import json
from utils.timezone import get_local_now, get_local_today

products_new_excel_bp = Blueprint('products_new_excel', __name__)

def create_version_record(product, old_values, new_values, change_type='UPDATE', change_reason='', user_id=None):
    """Helper function to create version records"""
    version = ProductVersion()
    version.product_id = product.id
    version.version = product.version
    version.change_type = change_type
    version.change_reason = change_reason
    version.created_by = user_id
    version.old_values = json.dumps(old_values, default=str)
    version.new_values = json.dumps(new_values, default=str)
    
    # Calculate changed fields
    changed_fields = []
    for key in new_values:
        if key in old_values and str(old_values[key]) != str(new_values[key]):
            changed_fields.append(key)
        elif key not in old_values and new_values[key] is not None:
            changed_fields.append(key)
    
    version.changed_fields = json.dumps(changed_fields)
    return version

def check_specification_changes(old_product, new_product):
    """Check if critical specifications have changed"""
    critical_fields = [
        'gramasi', 'cd', 'md', 'sheet_per_pack', 'pack_per_karton',
        'spunlace', 'rayon', 'polyester', 'es', 'slitting_cm',
        'lebar_mr_net_cm', 'lebar_mr_gross_cm', 'process_produksi'
    ]
    
    changes = []
    for field in critical_fields:
        old_val = getattr(old_product, field, None)
        new_val = getattr(new_product, field, None)
        if str(old_val) != str(new_val):
            changes.append({
                'field': field,
                'old_value': old_val,
                'new_value': new_val
            })
    
    return changes

@products_new_excel_bp.route('/', methods=['GET'])
def get_products():
    """Get all products with pagination and filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '', type=str)
        
        query = ProductNew.query
        
        if search:
            query = query.filter(
                db.or_(
                    ProductNew.code.like(f'%{search}%'),
                    ProductNew.name.like(f'%{search}%'),
                    ProductNew.spunlace.like(f'%{search}%')
                )
            )
        
        # Filter by active status
        active_only = request.args.get('active_only', 'false').lower() == 'true'
        if active_only:
            query = query.filter(ProductNew.is_active == True)
        
        # Order by most recent
        query = query.order_by(ProductNew.updated_at.desc())
        
        products = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'products': [product.to_dict() for product in products.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': products.total,
                'pages': products.pages,
                'has_next': products.has_next,
                'has_prev': products.has_prev
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_new_excel_bp.route('/<string:kode_produk>', methods=['GET'])
def get_product(kode_produk):
    """Get specific product by kode_produk"""
    try:
        product = ProductNew.query.filter_by(code=kode_produk).first()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        return jsonify(product.to_dict())
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_new_excel_bp.route('/', methods=['POST'])
def create_product():
    """Create new product with version tracking"""
    try:
        data = request.get_json()
        
        # Check if product already exists
        existing = ProductNew.query.filter_by(code=data.get('kode_produk')).first()
        if existing:
            return jsonify({'error': 'Product with this kode already exists'}), 400
        
        # Create new product
        product = ProductNew()
        product.code = data.get('kode_produk')
        product.name = data.get('nama_produk')
        product.version = 0
        
        # Update all fields from data
        for field in data:
            if hasattr(product, field) and field not in ['id', 'created_at', 'updated_at', 'version']:
                setattr(product, field, data[field])
        
        # Create initial version record
        old_values = {}
        new_values = product.to_dict()
        
        db.session.add(product)
        db.session.flush()  # Get product ID
        
        version = create_version_record(
            product, old_values, new_values, 
            change_type='CREATE', 
            change_reason='Product created via API'
        )
        db.session.add(version)
        
        db.session.commit()
        
        return jsonify(product.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@products_new_excel_bp.route('/<string:kode_produk>', methods=['PUT'])
def update_product(kode_produk):
    """Update product with automatic version increment"""
    try:
        product = ProductNew.query.filter_by(code=kode_produk).first()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        data = request.get_json()
        
        # Store old values for version tracking
        old_values = product.to_dict()
        
        # Check for specification changes
        temp_product = ProductNew()
        for field in data:
            if hasattr(temp_product, field):
                setattr(temp_product, field, data[field])
        
        spec_changes = check_specification_changes(product, temp_product)
        
        # Update fields
        for field in data:
            if hasattr(product, field) and field not in ['id', 'created_at', 'updated_at', 'version']:
                setattr(product, field, data[field])
        
        # Increment version if specifications changed
        if spec_changes:
            product.version += 1
            change_reason = f"Specification updated: {len(spec_changes)} fields changed"
        else:
            change_reason = "Product information updated"
        
        product.updated_at = get_local_now()
        
        # Create version record
        new_values = product.to_dict()
        version = create_version_record(
            product, old_values, new_values,
            change_type='UPDATE',
            change_reason=change_reason
        )
        db.session.add(version)
        
        db.session.commit()
        
        response = product.to_dict()
        response['spec_changes'] = spec_changes
        response['version_incremented'] = len(spec_changes) > 0
        
        return jsonify(response)
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@products_new_excel_bp.route('/<string:kode_produk>', methods=['DELETE'])
def delete_product(kode_produk):
    """Soft delete product (set is_active=False)"""
    try:
        product = ProductNew.query.filter_by(code=kode_produk).first()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Store old values
        old_values = product.to_dict()
        
        # Soft delete
        product.is_active = False
        product.updated_at = get_local_now()
        
        # Create version record
        new_values = product.to_dict()
        version = create_version_record(
            product, old_values, new_values,
            change_type='DELETE',
            change_reason='Product deactivated'
        )
        db.session.add(version)
        
        db.session.commit()
        
        return jsonify({'message': 'Product deactivated successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@products_new_excel_bp.route('/<string:kode_produk>/versions', methods=['GET'])
def get_product_versions(kode_produk):
    """Get version history for a product"""
    try:
        product = ProductNew.query.filter_by(code=kode_produk).first()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        versions = ProductVersion.query.filter_by(product_id=product.id)\
                                     .order_by(ProductVersion.version.desc())\
                                     .all()
        
        version_list = []
        for version in versions:
            version_data = {
                'id': version.id,
                'version': version.version,
                'change_type': version.change_type,
                'change_reason': version.change_reason,
                'created_at': version.created_at.isoformat() if version.created_at else None,
                'created_by': version.created_by,
                'changed_fields': json.loads(version.changed_fields) if version.changed_fields else [],
                'old_values': json.loads(version.old_values) if version.old_values else {},
                'new_values': json.loads(version.new_values) if version.new_values else {}
            }
            version_list.append(version_data)
        
        return jsonify({
            'product': product.to_dict(),
            'versions': version_list,
            'total_versions': len(version_list)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_new_excel_bp.route('/<string:kode_produk>/compare', methods=['GET'])
def compare_product_versions(kode_produk):
    """Compare two versions of a product"""
    try:
        product = ProductNew.query.filter_by(code=kode_produk).first()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        version1 = request.args.get('version1', type=int)
        version2 = request.args.get('version2', type=int)
        
        if version1 is None or version2 is None:
            return jsonify({'error': 'Both version1 and version2 parameters required'}), 400
        
        v1_record = ProductVersion.query.filter_by(product_id=product.id, version=version1).first()
        v2_record = ProductVersion.query.filter_by(product_id=product.id, version=version2).first()
        
        if not v1_record or not v2_record:
            return jsonify({'error': 'One or both versions not found'}), 404
        
        v1_values = json.loads(v1_record.new_values) if v1_record.new_values else {}
        v2_values = json.loads(v2_record.new_values) if v2_record.new_values else {}
        
        # Compare values
        differences = {}
        all_fields = set(v1_values.keys()) | set(v2_values.keys())
        
        for field in all_fields:
            val1 = v1_values.get(field)
            val2 = v2_values.get(field)
            if str(val1) != str(val2):
                differences[field] = {
                    'version1': val1,
                    'version2': val2
                }
        
        return jsonify({
            'product': product.to_dict(),
            'version1': {
                'version': version1,
                'values': v1_values,
                'created_at': v1_record.created_at.isoformat() if v1_record.created_at else None
            },
            'version2': {
                'version': version2,
                'values': v2_values,
                'created_at': v2_record.created_at.isoformat() if v2_record.created_at else None
            },
            'differences': differences,
            'total_differences': len(differences)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_new_excel_bp.route('/dashboard', methods=['GET'])
def get_dashboard():
    """Get dashboard statistics for ProductNew"""
    try:
        total_products = ProductNew.query.count()
        active_products = ProductNew.query.filter_by(is_active=True).count()
        total_versions = ProductVersion.query.count()
        
        # Spunlace distribution
        spunlace_stats = db.session.query(
            ProductNew.spunlace,
            db.func.count(ProductNew.id)
        ).filter(
            ProductNew.spunlace.isnot(None),
            ProductNew.spunlace != ''
        ).group_by(ProductNew.spunlace).all()
        
        spunlace_distribution = [
            {'type': s[0] or 'Unknown', 'count': s[1]} for s in spunlace_stats
        ]
        
        # Process distribution
        process_stats = db.session.query(
            ProductNew.process_produksi,
            db.func.count(ProductNew.id)
        ).filter(
            ProductNew.process_produksi.isnot(None),
            ProductNew.process_produksi != ''
        ).group_by(ProductNew.process_produksi).all()
        
        process_distribution = [
            {'process': p[0] or 'Unknown', 'count': p[1]} for p in process_stats
        ]
        
        # Recent products
        recent_products = ProductNew.query.order_by(ProductNew.created_at.desc())\
                                         .limit(10).all()
        
        recent_products_data = []
        for product in recent_products:
            recent_products_data.append({
                'id': product.id,
                'kode_produk': product.code,
                'nama_produk': product.name,
                'created_at': product.created_at.isoformat() if product.created_at else None,
                'is_active': product.is_active
            })
        
        # Recent changes (for version tracking)
        recent_versions = ProductVersion.query.order_by(ProductVersion.created_at.desc())\
                                           .limit(10).all()
        
        recent_changes = []
        for version in recent_versions:
            product = ProductNew.query.get(version.product_id)
            recent_changes.append({
                'product_kode': product.code if product else 'Unknown',
                'product_name': product.name if product else 'Unknown',
                'version': version.version,
                'change_type': version.change_type,
                'change_reason': version.change_reason,
                'created_at': version.created_at.isoformat() if version.created_at else None
            })
        
        # Products with MANUAL values
        manual_products = ProductNew.query.filter(
            db.or_(
                ProductNew.no_mesin_epd == 'MANUAL',
                ProductNew.speed_epd_pack_menit == 'MANUAL'
            )
        ).count()
        
        # Version distribution
        version_stats = db.session.query(
            ProductNew.version,
            db.func.count(ProductNew.id)
        ).group_by(ProductNew.version).all()
        
        return jsonify({
            'total_products': total_products,
            'active_products': active_products,
            'inactive_products': total_products - active_products,
            'total_versions': total_versions,
            'manual_products': manual_products,
            'spunlace_distribution': spunlace_distribution,
            'process_distribution': process_distribution,
            'recent_products': recent_products_data,
            'recent_changes': recent_changes,
            'version_distribution': [
                {'version': v[0], 'count': v[1]} for v in version_stats
            ]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
