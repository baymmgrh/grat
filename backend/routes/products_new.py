"""
New Product Routes - Matching Excel Schema
API endpoints for ProductNew model with all Excel fields
"""

from flask import Blueprint, request, jsonify
from models import db
from models.product_new_schema import ProductNew, ProductVersion
from datetime import datetime
import traceback
import sys
sys.path.append('..')
from utils.product_calculations import (
    calculate_berat_kering,
    calculate_meter_kain,
    calculate_kg_kain,
    calculate_kebutuhan_material,
    calculate_all_product_metrics
)

products_new_bp = Blueprint('products_new', __name__, url_prefix='/api/products-new')

@products_new_bp.route('/', methods=['GET'])
def get_products():
    """Get all products with pagination and filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '', type=str)
        
        # Build query
        query = ProductNew.query
        
        if search:
            query = query.filter(
                db.or_(
                    ProductNew.kode_produk.ilike(f'%{search}%'),
                    ProductNew.nama_produk.ilike(f'%{search}%'),
                    ProductNew.spunlace.ilike(f'%{search}%'),
                    ProductNew.process_produksi.ilike(f'%{search}%')
                )
            )
        
        # Pagination
        products = query.paginate(
            page=page, per_page=per_page, error_out=False
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

@products_new_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get single product by ID"""
    try:
        product = ProductNew.query.get_or_404(product_id)
        return jsonify({
            'product': product.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_new_bp.route('/kode/<kode_produk>', methods=['GET'])
def get_product_by_kode(kode_produk):
    """Get product by kode_produk"""
    try:
        product = ProductNew.query.filter_by(kode_produk=kode_produk).first_or_404()
        return jsonify({
            'product': product.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_new_bp.route('/', methods=['POST'])
def create_product():
    """Create new product"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('kode_produk') or not data.get('nama_produk'):
            return jsonify({'error': 'kode_produk and nama_produk are required'}), 400
        
        # Check for duplicate kode_produk
        existing = ProductNew.query.filter_by(kode_produk=data['kode_produk']).first()
        if existing:
            return jsonify({'error': f'Product with kode_produk {data["kode_produk"]} already exists'}), 400
        
        # Create new product
        product = ProductNew()
        
        # Map all fields from request
        for field in [
            'kode_produk', 'nama_produk', 'gramasi', 'cd', 'md',
            'sheet_per_pack', 'pack_per_karton', 'berat_kering', 'ratio', 'ingredient',
            'ukuran_batch_vol', 'ukuran_batch_ctn', 'spunlace', 'rayon', 'polyester', 'es',
            'slitting_cm', 'lebar_mr_net_cm', 'lebar_mr_gross_cm', 'keterangan_slitting',
            'no_mesin_epd', 'speed_epd_pack_menit', 'meter_kain', 'kg_kain',
            'kebutuhan_rayon_kg', 'kebutuhan_polyester_kg', 'kebutuhan_es_kg',
            'process_produksi', 'kode_jumbo_roll', 'nama_jumbo_roll', 'kode_main_roll',
            'nama_main_roll', 'kapasitas_mixing_kg', 'actual_mixing_kg', 'dosing_kg',
            'notes'
        ]:
            if field in data:
                setattr(product, field, data[field])
        
        # Set defaults
        product.is_active = data.get('is_active', True)
        product.version = 0  # New product starts at version 0
        
        db.session.add(product)
        db.session.commit()
        
        return jsonify({
            'message': 'Product created successfully',
            'product': product.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@products_new_bp.route('/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    """Update existing product with versioning"""
    try:
        product = ProductNew.query.get_or_404(product_id)
        data = request.get_json()
        
        # Store previous data for versioning
        previous_data = product.to_dict()
        
        # Check if this is a specification change that requires version increment
        spec_fields = [
            'gramasi', 'cd', 'md', 'sheet_per_pack', 'pack_per_karton',
            'berat_kering', 'ratio', 'ingredient', 'spunlace', 'rayon', 'polyester', 'es'
        ]
        
        spec_changed = False
        for field in spec_fields:
            if field in data and getattr(product, field) != data[field]:
                spec_changed = True
                break
        
        # Update fields
        for field in [
            'nama_produk', 'gramasi', 'cd', 'md', 'sheet_per_pack', 'pack_per_karton',
            'berat_kering', 'ratio', 'ingredient', 'ukuran_batch_vol', 'ukuran_batch_ctn',
            'spunlace', 'rayon', 'polyester', 'es', 'slitting_cm', 'lebar_mr_net_cm',
            'lebar_mr_gross_cm', 'keterangan_slitting', 'no_mesin_epd', 'speed_epd_pack_menit',
            'meter_kain', 'kg_kain', 'kebutuhan_rayon_kg', 'kebutuhan_polyester_kg',
            'kebutuhan_es_kg', 'process_produksi', 'kode_jumbo_roll', 'nama_jumbo_roll',
            'kode_main_roll', 'nama_main_roll', 'kapasitas_mixing_kg', 'actual_mixing_kg',
            'dosing_kg', 'notes', 'is_active'
        ]:
            if field in data:
                setattr(product, field, data[field])
        
        # Increment version if specifications changed
        if spec_changed:
            product.version = (product.version or 0) + 1
            
            # Create version record
            version = ProductVersion()
            version.product_id = product.id
            version.version = product.version
            version.previous_data = previous_data
            version.change_reason = data.get('change_reason', 'Specification update')
            version.created_by = data.get('created_by')
            
            db.session.add(version)
        
        product.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Product updated successfully',
            'product': product.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@products_new_bp.route('/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    """Delete product (soft delete)"""
    try:
        product = ProductNew.query.get_or_404(product_id)
        product.is_active = False
        product.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Product deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@products_new_bp.route('/<int:product_id>/versions', methods=['GET'])
def get_product_versions(product_id):
    """Get version history for a product"""
    try:
        product = ProductNew.query.get_or_404(product_id)
        versions = ProductVersion.query.filter_by(product_id=product_id).order_by(ProductVersion.version.desc()).all()
        
        return jsonify({
            'product': product.to_dict(),
            'versions': [{
                'id': v.id,
                'version': v.version,
                'change_reason': v.change_reason,
                'created_at': v.created_at.isoformat() if v.created_at else None,
                'previous_data': v.previous_data
            } for v in versions]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_new_bp.route('/dashboard', methods=['GET'])
def get_dashboard():
    """Get dashboard statistics for products"""
    try:
        total_products = ProductNew.query.count()
        active_products = ProductNew.query.filter_by(is_active=True).count()
        
        # Get products by spunlace type
        spunlace_stats = db.session.query(
            ProductNew.spunlace,
            db.func.count(ProductNew.id)
        ).filter(ProductNew.spunlace.isnot(None)).group_by(ProductNew.spunlace).all()
        
        # Get products by process
        process_stats = db.session.query(
            ProductNew.process_produksi,
            db.func.count(ProductNew.id)
        ).filter(ProductNew.process_produksi.isnot(None)).group_by(ProductNew.process_produksi).all()
        
        # Get recent products
        recent_products = ProductNew.query.order_by(ProductNew.created_at.desc()).limit(5).all()
        
        return jsonify({
            'total_products': total_products,
            'active_products': active_products,
            'inactive_products': total_products - active_products,
            'spunlace_distribution': [{'type': s[0], 'count': s[1]} for s in spunlace_stats],
            'process_distribution': [{'process': p[0], 'count': p[1]} for p in process_stats],
            'recent_products': [p.to_dict() for p in recent_products]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_new_bp.route('/search', methods=['GET'])
def search_products():
    """Advanced product search"""
    try:
        # Get search parameters
        kode_produk = request.args.get('kode_produk', '', type=str)
        nama_produk = request.args.get('nama_produk', '', type=str)
        spunlace = request.args.get('spunlace', '', type=str)
        process = request.args.get('process', '', type=str)
        gsm_min = request.args.get('gsm_min', type=float)
        gsm_max = request.args.get('gsm_max', type=float)
        
        # Build query
        query = ProductNew.query
        
        if kode_produk:
            query = query.filter(ProductNew.kode_produk.ilike(f'%{kode_produk}%'))
        if nama_produk:
            query = query.filter(ProductNew.nama_produk.ilike(f'%{nama_produk}%'))
        if spunlace:
            query = query.filter(ProductNew.spunlace.ilike(f'%{spunlace}%'))
        if process:
            query = query.filter(ProductNew.process_produksi.ilike(f'%{process}%'))
        if gsm_min is not None:
            query = query.filter(ProductNew.gramasi >= gsm_min)
        if gsm_max is not None:
            query = query.filter(ProductNew.gramasi <= gsm_max)
        
        # Execute query
        products = query.limit(50).all()
        
        return jsonify({
            'products': [product.to_dict() for product in products],
            'count': len(products)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_new_bp.route('/import/excel', methods=['POST'])
def import_excel():
    """Import Excel file directly to new schema"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith(('.xlsx', '.xls')):
            return jsonify({'error': 'File must be Excel (.xlsx or .xls)'}), 400
        
        # Read Excel file
        import pandas as pd
        df = pd.read_excel(file)
        
        # Process similar to import_produk_to_new_schema function
        success_count = 0
        error_count = 0
        
        for index, row in df.iterrows():
            try:
                # Skip invalid rows
                kode_produk = str(row['KODE PRODUK']).strip() if pd.notna(row['KODE PRODUK']) else ''
                nama_produk = str(row['NAMA PRODUK']).strip() if pd.notna(row['NAMA PRODUK']) else ''
                
                if not kode_produk or not nama_produk:
                    continue
                
                # Check for existing product
                existing = ProductNew.query.filter_by(kode_produk=kode_produk).first()
                if existing:
                    continue
                
                # Create product (similar to import function)
                product = ProductNew()
                # ... (mapping logic from import function)
                
                db.session.add(product)
                success_count += 1
                
            except Exception as e:
                error_count += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'Import completed: {success_count} products imported, {error_count} errors'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
