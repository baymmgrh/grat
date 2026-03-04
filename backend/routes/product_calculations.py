"""
Product Calculation API Endpoints
Auto-calculate product metrics based on specifications
"""

from flask import Blueprint, request, jsonify
from models import db
from models.product_excel_schema import ProductNew
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
from utils.timezone import get_local_now, get_local_today

product_calc_bp = Blueprint('product_calculations', __name__, url_prefix='/api/products')


@product_calc_bp.route('/calculate', methods=['POST'])
def calculate_product_metrics():
    """
    Calculate product metrics based on input specifications
    
    Request Body:
    {
        "gramasi": 40,
        "cd": 15,  // CM
        "md": 20,  // CM
        "sheet_per_pack": 10,
        "pack_per_karton": 72,
        "lebar_mr_gross_cm": 160,
        "rayon": 0.5,  // ratio (0.5 = 50%)
        "polyester": 0.5,
        "es": 0
    }
    
    Response:
    {
        "berat_kering": 0.864,
        "meter_kain": 14.4,
        "kg_kain": 0.9216,
        "kebutuhan_rayon_kg": 0.4608,
        "kebutuhan_polyester_kg": 0.4608,
        "kebutuhan_es_kg": 0,
        "total_sheets": 720
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['gramasi', 'cd', 'md', 'sheet_per_pack', 'pack_per_karton', 'lebar_mr_gross_cm']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Calculate all metrics
        calculated = calculate_all_product_metrics(data)
        
        return jsonify({
            'success': True,
            'calculations': calculated,
            'input': data
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@product_calc_bp.route('/calculate-batch', methods=['POST'])
def calculate_batch():
    """
    Calculate metrics for multiple products at once
    
    Request Body:
    {
        "products": [
            {
                "kode_produk": "4020701001",
                "gramasi": 40,
                "cd": 15,
                ...
            },
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        products = data.get('products', [])
        
        if not products:
            return jsonify({'error': 'No products provided'}), 400
        
        results = []
        
        for product_data in products:
            try:
                calculated = calculate_all_product_metrics(product_data)
                results.append({
                    'kode_produk': product_data.get('kode_produk'),
                    'success': True,
                    'calculations': calculated
                })
            except Exception as e:
                results.append({
                    'kode_produk': product_data.get('kode_produk'),
                    'success': False,
                    'error': str(e)
                })
        
        return jsonify({
            'results': results,
            'total': len(products),
            'success_count': sum(1 for r in results if r['success']),
            'error_count': sum(1 for r in results if not r['success'])
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@product_calc_bp.route('/<kode_produk>/recalculate', methods=['POST'])
def recalculate_product(kode_produk):
    """
    Recalculate and update stored calculations for a product
    """
    try:
        product = ProductNew.query.filter_by(code=kode_produk).first_or_404()
        
        # Prepare data for calculation
        product_data = {
            'gramasi': float(product.gramasi) if product.gramasi else 0,
            'cd': float(product.cd) if product.cd else 0,
            'md': float(product.md) if product.md else 0,
            'sheet_per_pack': int(product.sheet_per_pack) if product.sheet_per_pack else 0,
            'pack_per_karton': int(product.pack_per_karton) if product.pack_per_karton else 0,
            'lebar_mr_gross_cm': float(product.lebar_mr_gross_cm) if product.lebar_mr_gross_cm else 0,
            'rayon': float(product.rayon) if product.rayon else 0,
            'polyester': float(product.polyester) if product.polyester else 0,
            'es': float(product.es) if product.es else 0
        }
        
        # Calculate
        calculated = calculate_all_product_metrics(product_data)
        
        # Update product
        product.berat_kering = str(calculated['berat_kering'])
        product.meter_kain = str(calculated['meter_kain'])
        product.kg_kain = str(calculated['kg_kain'])
        product.kebutuhan_rayon_kg = str(calculated['kebutuhan_rayon_kg'])
        product.kebutuhan_polyester_kg = str(calculated['kebutuhan_polyester_kg'])
        product.kebutuhan_es_kg = str(calculated['kebutuhan_es_kg'])
        product.updated_at = get_local_now()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product calculations updated',
            'product': product.to_dict(),
            'calculations': calculated
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@product_calc_bp.route('/recalculate-all', methods=['POST'])
def recalculate_all_products():
    """
    Recalculate all products in the database
    """
    try:
        products = ProductNew.query.all()
        
        success_count = 0
        error_count = 0
        errors = []
        
        for product in products:
            try:
                # Prepare data
                product_data = {
                    'gramasi': float(product.gramasi) if product.gramasi else 0,
                    'cd': float(product.cd) if product.cd else 0,
                    'md': float(product.md) if product.md else 0,
                    'sheet_per_pack': int(product.sheet_per_pack) if product.sheet_per_pack else 0,
                    'pack_per_karton': int(product.pack_per_karton) if product.pack_per_karton else 0,
                    'lebar_mr_gross_cm': float(product.lebar_mr_gross_cm) if product.lebar_mr_gross_cm else 0,
                    'rayon': float(product.rayon) if product.rayon else 0,
                    'polyester': float(product.polyester) if product.polyester else 0,
                    'es': float(product.es) if product.es else 0
                }
                
                # Calculate
                calculated = calculate_all_product_metrics(product_data)
                
                # Update
                product.berat_kering = str(calculated['berat_kering'])
                product.meter_kain = str(calculated['meter_kain'])
                product.kg_kain = str(calculated['kg_kain'])
                product.kebutuhan_rayon_kg = str(calculated['kebutuhan_rayon_kg'])
                product.kebutuhan_polyester_kg = str(calculated['kebutuhan_polyester_kg'])
                product.kebutuhan_es_kg = str(calculated['kebutuhan_es_kg'])
                product.updated_at = get_local_now()
                
                success_count += 1
                
            except Exception as e:
                error_count += 1
                errors.append({
                    'kode_produk': product.code,
                    'error': str(e)
                })
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Recalculated {success_count} products',
            'total': len(products),
            'success_count': success_count,
            'error_count': error_count,
            'errors': errors[:10]  # Return first 10 errors only
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
