"""
Extended Product Routes - Additional endpoints for new schema
"""

from flask import Blueprint, request, jsonify, send_file
from models import db
from models.product_excel_schema import ProductNew, ProductVersion
from datetime import datetime, timedelta
import pandas as pd
import io
import tempfile
import os
from utils.timezone import get_local_now, get_local_today

products_new_extended_bp = Blueprint('products_new_extended', __name__, url_prefix='/api/products-new')

@products_new_extended_bp.route('/export', methods=['GET'])
def export_products():
    """Export products to Excel file"""
    try:
        # Get query parameters
        search = request.args.get('search', '', type=str)
        spunlace = request.args.get('spunlace', '', type=str)
        process = request.args.get('process', '', type=str)
        is_active = request.args.get('is_active', 'all', type=str)
        
        # Build query
        query = ProductNew.query
        
        if search:
            query = query.filter(
                db.or_(
                    ProductNew.code.ilike(f'%{search}%'),
                    ProductNew.name.ilike(f'%{search}%'),
                    ProductNew.spunlace.ilike(f'%{search}%'),
                    ProductNew.process_produksi.ilike(f'%{search}%')
                )
            )
        
        if spunlace:
            query = query.filter(ProductNew.spunlace == spunlace)
        
        if process:
            query = query.filter(ProductNew.process_produksi == process)
        
        if is_active != 'all':
            query = query.filter(ProductNew.is_active == (is_active == 'true'))
        
        # Get all products
        products = query.all()
        
        # Convert to DataFrame
        data = []
        for product in products:
            data.append({
                'KODE PRODUK': product.code,
                'NAMA PRODUK': product.name,
                'GRAMASI': product.gramasi,
                'CD': product.cd,
                'MD': product.md,
                'Sheet Per Pack': product.sheet_per_pack,
                'Pack per Karton': product.pack_per_karton,
                'BERAT KERING': product.berat_kering,
                'RATIO': product.ratio,
                'INGREDIENT': product.ingredient,
                'UKURAN BATCH (VOL)': product.ukuran_batch_vol,
                'UKURAN BATCH (CTN)': product.ukuran_batch_ctn,
                'SPUNLACE': product.spunlace,
                'RAYON': product.rayon,
                'POLYESTER': product.polyester,
                'ES': product.es,
                'SLITTING (CM)': product.slitting_cm,
                'LEBAR MR NETT (CM)': product.lebar_mr_net_cm,
                'LEBAR MR GROSS (CM)': product.lebar_mr_gross_cm,
                'KETERANGAN SLITTING': product.keterangan_slitting,
                'NO MESIN EPD': product.no_mesin_epd,
                'SPEED EPD (PACK/MENIT)': product.speed_epd_pack_menit,
                'METER KAIN': product.meter_kain,
                'KG KAIN': product.kg_kain,
                'KEBUTUHAN RAYON DALAM KG': product.kebutuhan_rayon_kg,
                'KEBUTUHAN POLYESTER DALAM KG': product.kebutuhan_polyester_kg,
                'KEBUTUHAN ES DALAM KG': product.kebutuhan_es_kg,
                'PROCESS PRODUKSI': product.process_produksi,
                'KODE JUMBO ROLL': product.kode_jumbo_roll,
                'NAMA JUMBO ROLL': product.nama_jumbo_roll,
                'KODE MAIN ROLL': product.kode_main_roll,
                'NAMA MAIN ROLL': product.nama_main_roll,
                'KAPASITAS MIXING DALAM KG': product.kapasitas_mixing_kg,
                'ACTUAL MIXING DALAM KG': product.actual_mixing_kg,
                'DOSING DALAM KG': product.dosing_kg,
                'STATUS': 'Aktif' if product.is_active else 'Tidak Aktif',
                'VERSI': product.version,
                'CATATAN': product.notes,
                'TANGGAL DIBUAT': product.created_at.strftime('%Y-%m-%d %H:%M:%S') if product.created_at else '',
                'TANGGAL DIPERBARUI': product.updated_at.strftime('%Y-%m-%d %H:%M:%S') if product.updated_at else ''
            })
        
        # Create Excel file
        df = pd.DataFrame(data)
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
            df.to_excel(tmp_file.name, index=False, engine='openpyxl')
            tmp_file_path = tmp_file.name
        
        # Send file
        return send_file(
            tmp_file_path,
            as_attachment=True,
            download_name=f'products_export_{get_local_now().strftime("%Y%m%d_%H%M%S")}.xlsx',
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_new_extended_bp.route('/options/spunlace', methods=['GET'])
def get_spunlace_options():
    """Get available spunlace options"""
    try:
        spunlace_types = db.session.query(
            ProductNew.spunlace
        ).filter(
            ProductNew.spunlace.isnot(None),
            ProductNew.spunlace != ''
        ).distinct().all()
        
        options = [s[0] for s in spunlace_types if s[0]]
        options.sort()
        
        return jsonify(options)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_new_extended_bp.route('/options/process', methods=['GET'])
def get_process_options():
    """Get available process options"""
    try:
        process_types = db.session.query(
            ProductNew.process_produksi
        ).filter(
            ProductNew.process_produksi.isnot(None),
            ProductNew.process_produksi != ''
        ).distinct().all()
        
        options = [p[0] for p in process_types if p[0]]
        options.sort()
        
        return jsonify(options)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_new_extended_bp.route('/options/machines', methods=['GET'])
def get_machine_options():
    """Get available machine options"""
    try:
        machines = db.session.query(
            ProductNew.no_mesin_epd
        ).filter(
            ProductNew.no_mesin_epd.isnot(None),
            ProductNew.no_mesin_epd != ''
        ).distinct().all()
        
        options = [m[0] for m in machines if m[0]]
        options.sort()
        
        return jsonify(options)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_new_extended_bp.route('/validate', methods=['POST'])
def validate_product():
    """Validate product data before saving"""
    try:
        data = request.get_json()
        errors = {}
        
        # Validate required fields
        if not data.get('kode_produk') or not data.get('kode_produk').strip():
            errors['kode_produk'] = 'Kode Produk harus diisi'
        
        if not data.get('nama_produk') or not data.get('nama_produk').strip():
            errors['nama_produk'] = 'Nama Produk harus diisi'
        
        # Validate material composition
        rayon = data.get('rayon') or 0
        polyester = data.get('polyester') or 0
        es = data.get('es') or 0
        total_composition = rayon + polyester + es
        
        if total_composition > 0 and abs(total_composition - 100) > 0.1:
            errors['composition'] = 'Total komposisi material harus 100%'
        
        # Validate numeric fields
        numeric_fields = [
            'gramasi', 'cd', 'md', 'sheet_per_pack', 'pack_per_karton',
            'berat_kering', 'ratio', 'ingredient', 'ukuran_batch_vol',
            'ukuran_batch_ctn', 'slitting_cm', 'lebar_mr_net_cm',
            'lebar_mr_gross_cm', 'speed_epd_pack_menit', 'meter_kain',
            'kg_kain', 'kebutuhan_rayon_kg', 'kebutuhan_polyester_kg',
            'kebutuhan_es_kg', 'kapasitas_mixing_kg', 'actual_mixing_kg', 'dosing_kg'
        ]
        
        for field in numeric_fields:
            if field in data and data[field] is not None:
                try:
                    float(data[field])
                except (ValueError, TypeError):
                    errors[field] = f'{field} harus berupa angka'
        
        # Check for duplicate kode_produk (for new products)
        if 'kode_produk' in data and data['kode_produk']:
            existing = ProductNew.query.filter_by(code=data['kode_produk']).first()
            if existing and ('id' not in data or existing.id != data.get('id')):
                errors['kode_produk'] = 'Kode Produk sudah digunakan'
        
        return jsonify({
            'valid': len(errors) == 0,
            'errors': errors
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_new_extended_bp.route('/check-kode', methods=['GET'])
def check_kode_availability():
    """Check if kode_produk is available"""
    try:
        kode = request.args.get('kode', '')
        exclude_id = request.args.get('exclude_id', type=int)
        
        if not kode:
            return jsonify({'available': False})
        
        query = ProductNew.query.filter_by(code=kode)
        if exclude_id:
            query = query.filter(ProductNew.id != exclude_id)
        
        existing = query.first()
        
        return jsonify({'available': existing is None})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_new_extended_bp.route('/spunlace/<spunlace_type>', methods=['GET'])
def get_products_by_spunlace(spunlace_type):
    """Get products by spunlace type"""
    try:
        products = ProductNew.query.filter_by(spunlace=spunlace_type).all()
        
        return jsonify([product.to_dict() for product in products])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_new_extended_bp.route('/process/<process_type>', methods=['GET'])
def get_products_by_process(process_type):
    """Get products by process type"""
    try:
        products = ProductNew.query.filter_by(process_produksi=process_type).all()
        
        return jsonify([product.to_dict() for product in products])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_new_extended_bp.route('/suggestions', methods=['GET'])
def get_product_suggestions():
    """Get product suggestions for autocomplete"""
    try:
        query = request.args.get('q', '')
        limit = request.args.get('limit', 10, type=int)
        
        products = ProductNew.query.filter(
            db.or_(
                ProductNew.code.ilike(f'%{query}%'),
                ProductNew.name.ilike(f'%{query}%')
            )
        ).limit(limit).all()
        
        return jsonify([product.to_dict() for product in products])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_new_extended_bp.route('/<int:product_id>/material-requirements', methods=['GET'])
def calculate_material_requirements(product_id):
    """Calculate material requirements for a product"""
    try:
        product = ProductNew.query.get_or_404(product_id)
        quantity = request.args.get('quantity', 1, type=float)
        
        # Calculate requirements based on product specifications
        meter_kain = (product.meter_kain or 0) * quantity
        kg_kain = (product.kg_kain or 0) * quantity
        kebutuhan_rayon_kg = (product.kebutuhan_rayon_kg or 0) * quantity
        kebutuhan_polyester_kg = (product.kebutuhan_polyester_kg or 0) * quantity
        kebutuhan_es_kg = (product.kebutuhan_es_kg or 0) * quantity
        
        return jsonify({
            'meter_kain': meter_kain,
            'kg_kain': kg_kain,
            'kebutuhan_rayon_kg': kebutuhan_rayon_kg,
            'kebutuhan_polyester_kg': kebutuhan_polyester_kg,
            'kebutuhan_es_kg': kebutuhan_es_kg
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_new_extended_bp.route('/analytics', methods=['GET'])
def get_product_analytics():
    """Get product analytics"""
    try:
        time_range = request.args.get('time_range', '30d')
        
        # Calculate date range
        if time_range == '7d':
            start_date = get_local_now() - timedelta(days=7)
        elif time_range == '30d':
            start_date = get_local_now() - timedelta(days=30)
        elif time_range == '90d':
            start_date = get_local_now() - timedelta(days=90)
        else:
            start_date = None
        
        # Base query
        query = ProductNew.query
        if start_date:
            query = query.filter(ProductNew.created_at >= start_date)
        
        total_products = query.count()
        new_products = query.filter(ProductNew.created_at >= start_date).count() if start_date else 0
        updated_products = query.filter(ProductNew.updated_at >= start_date).count() if start_date else 0
        
        # Top spunlace types
        spunlace_stats = db.session.query(
            ProductNew.spunlace,
            db.func.count(ProductNew.id)
        ).filter(
            ProductNew.spunlace.isnot(None),
            ProductNew.spunlace != ''
        ).group_by(ProductNew.spunlace).order_by(db.func.count(ProductNew.id).desc()).limit(5).all()
        
        top_spunlace = [{'type': s[0], 'count': s[1]} for s in spunlace_stats]
        
        # Top processes
        process_stats = db.session.query(
            ProductNew.process_produksi,
            db.func.count(ProductNew.id)
        ).filter(
            ProductNew.process_produksi.isnot(None),
            ProductNew.process_produksi != ''
        ).group_by(ProductNew.process_produksi).order_by(db.func.count(ProductNew.id).desc()).limit(5).all()
        
        top_processes = [{'process': p[0], 'count': p[1]} for p in process_stats]
        
        # GSM distribution
        gsm_ranges = [
            ('0-40', ProductNew.gramasi < 40),
            ('40-50', db.and_(ProductNew.gramasi >= 40, ProductNew.gramasi < 50)),
            ('50-60', db.and_(ProductNew.gramasi >= 50, ProductNew.gramasi < 60)),
            ('60-70', db.and_(ProductNew.gramasi >= 60, ProductNew.gramasi < 70)),
            ('70+', ProductNew.gramasi >= 70)
        ]
        
        gsm_distribution = []
        for range_name, condition in gsm_ranges:
            count = query.filter(condition).count()
            gsm_distribution.append({'range': range_name, 'count': count})
        
        return jsonify({
            'total_products': total_products,
            'new_products': new_products,
            'updated_products': updated_products,
            'top_spunlace': top_spunlace,
            'top_processes': top_processes,
            'gsm_distribution': gsm_distribution
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_new_extended_bp.route('/dashboard', methods=['GET'])
def get_dashboard_extended():
    """Extended dashboard with time range filtering"""
    try:
        time_range = request.args.get('time_range', 'all')
        
        # Base query
        query = ProductNew.query
        
        # Filter by time range if specified
        if time_range == '7d':
            start_date = get_local_now() - timedelta(days=7)
            query = query.filter(ProductNew.created_at >= start_date)
        elif time_range == '30d':
            start_date = get_local_now() - timedelta(days=30)
            query = query.filter(ProductNew.created_at >= start_date)
        elif time_range == '90d':
            start_date = get_local_now() - timedelta(days=90)
            query = query.filter(ProductNew.created_at >= start_date)
        
        total_products = ProductNew.query.count()
        active_products = ProductNew.query.filter_by(is_active=True).count()
        inactive_products = total_products - active_products
        
        # Get products by spunlace type
        spunlace_stats = db.session.query(
            ProductNew.spunlace,
            db.func.count(ProductNew.id)
        ).filter(
            ProductNew.spunlace.isnot(None),
            ProductNew.spunlace != ''
        ).group_by(ProductNew.spunlace).order_by(db.func.count(ProductNew.id).desc()).all()
        
        # Get products by process
        process_stats = db.session.query(
            ProductNew.process_produksi,
            db.func.count(ProductNew.id)
        ).filter(
            ProductNew.process_produksi.isnot(None),
            ProductNew.process_produksi != ''
        ).group_by(ProductNew.process_produksi).order_by(db.func.count(ProductNew.id).desc()).all()
        
        # Get recent products (filtered by time range)
        recent_products = query.order_by(ProductNew.created_at.desc()).limit(5).all()
        
        return jsonify({
            'total_products': total_products,
            'active_products': active_products,
            'inactive_products': inactive_products,
            'spunlace_distribution': [{'type': s[0], 'count': s[1]} for s in spunlace_stats],
            'process_distribution': [{'process': p[0], 'count': p[1]} for p in process_stats],
            'recent_products': [p.to_dict() for p in recent_products]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
