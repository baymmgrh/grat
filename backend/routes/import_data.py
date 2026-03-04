from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import pandas as pd
import os
from werkzeug.utils import secure_filename
from app import db
from models import Product, Material, Inventory, User, WarehouseLocation
from utils.i18n import success_response, error_response, get_message
from datetime import datetime
import traceback
from utils.timezone import get_local_now, get_local_today

import_bp = Blueprint('import', __name__)

ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def read_file(file_path):
    """Read CSV or Excel file into pandas DataFrame"""
    if file_path.endswith('.csv'):
        return pd.read_csv(file_path)
    else:
        return pd.read_excel(file_path)

@import_bp.route('/api/import/data', methods=['POST'])
@jwt_required()
def import_data():
    try:
        current_user_id = get_jwt_identity()
        
        if 'file' not in request.files:
            return jsonify(error_response('api.error', error_code=400)), 400
        
        file = request.files['file']
        import_type = request.form.get('type')
        
        if file.filename == '':
            return jsonify(error_response('api.error', error_code=400)), 400
        
        if not allowed_file(file.filename):
            return jsonify(error_response('api.error', error_code=400)), 400
        
        if not import_type or import_type not in ['products', 'materials', 'inventory']:
            return jsonify(error_response('api.error', error_code=400)), 400
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0, os.SEEK_SET)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify(error_response('api.error', error_code=400)), 400
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        temp_path = os.path.join('temp_uploads', filename)
        os.makedirs('temp_uploads', exist_ok=True)
        file.save(temp_path)
        
        try:
            # Read the file
            df = read_file(temp_path)
            
            # Process based on import type
            if import_type == 'products':
                result = import_products(df, current_user_id)
            elif import_type == 'materials':
                result = import_materials(df, current_user_id)
            elif import_type == 'inventory':
                result = import_inventory(df, current_user_id)
            
            # Clean up temp file
            os.remove(temp_path)
            
            return jsonify(result), 200
            
        except Exception as e:
            # Clean up temp file on error
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise e
        
    except Exception as e:
        print(f"Import error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

def import_products(df, user_id):
    """Import products from DataFrame"""
    required_columns = ['product_code', 'product_name', 'category', 'material_type']
    
    # Validate columns
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        return {'error': f'Missing required columns: {", ".join(missing_columns)}'}
    
    imported_count = 0
    errors = []
    
    for index, row in df.iterrows():
        try:
            # Check if product already exists
            existing_product = Product.query.filter_by(product_code=row['product_code']).first()
            if existing_product:
                continue  # Skip duplicates
            
            # Create new product
            product = Product(
                product_code=row['product_code'],
                product_name=row['product_name'],
                category=row['category'],
                material_type=row['material_type'],
                gsm=row.get('gsm'),
                width=row.get('width'),
                length=row.get('length'),
                unit_price=row.get('unit_price', 0),
                cost_price=row.get('cost_price', 0),
                description=row.get('description', ''),
                is_active=True,
                created_by=user_id,
                created_at=get_local_now()
            )
            
            db.session.add(product)
            imported_count += 1
            
        except Exception as e:
            errors.append(f'Row {index + 2}: {str(e)}')
    
    try:
        db.session.commit()
        return {
            'imported_count': imported_count,
            'errors': errors,
            'message': f'Successfully imported {imported_count} products'
        }
    except Exception as e:
        db.session.rollback()
        return {'error': f'Database error: {str(e)}'}

def import_materials(df, user_id):
    """Import raw materials from DataFrame"""
    required_columns = ['material_code', 'material_name', 'type', 'unit']
    
    # Validate columns
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        return {'error': f'Missing required columns: {", ".join(missing_columns)}'}
    
    imported_count = 0
    errors = []
    
    for index, row in df.iterrows():
        try:
            # Check if material already exists
            existing_material = Material.query.filter_by(code=row['material_code']).first()
            if existing_material:
                continue  # Skip duplicates
            
            # Create new material
            material = Material(
                code=row['material_code'],
                name=row['material_name'],
                type=row['type'],
                unit=row['unit'],
                unit_cost=row.get('unit_cost', 0),
                supplier_name=row.get('supplier', ''),
                minimum_stock=row.get('minimum_stock', 0),
                description=row.get('description', ''),
                is_active=True,
                created_by=user_id,
                created_at=get_local_now()
            )
            
            db.session.add(material)
            imported_count += 1
            
        except Exception as e:
            errors.append(f'Row {index + 2}: {str(e)}')
    
    try:
        db.session.commit()
        return {
            'imported_count': imported_count,
            'errors': errors,
            'message': f'Successfully imported {imported_count} raw materials'
        }
    except Exception as e:
        db.session.rollback()
        return {'error': f'Database error: {str(e)}'}

def import_inventory(df, user_id):
    """Import inventory data from DataFrame"""
    required_columns = ['product_code', 'location_code', 'quantity', 'unit']
    
    # Validate columns
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        return {'error': f'Missing required columns: {", ".join(missing_columns)}'}
    
    imported_count = 0
    errors = []
    
    for index, row in df.iterrows():
        try:
            # Verify product exists
            product = Product.query.filter_by(product_code=row['product_code']).first()
            if not product:
                errors.append(f'Row {index + 2}: Product code {row["product_code"]} not found')
                continue
            
            # Verify location exists (if applicable)
            location = WarehouseLocation.query.filter_by(location_code=row['location_code']).first()
            if not location:
                errors.append(f'Row {index + 2}: Location code {row["location_code"]} not found')
                continue
            
            # Check if inventory record already exists
            existing_inventory = Inventory.query.filter_by(
                product_id=product.id,
                location_id=location.id
            ).first()
            
            if existing_inventory:
                # Update existing inventory
                existing_inventory.quantity = row['quantity']
                existing_inventory.batch_number = row.get('batch_number', '')
                existing_inventory.expiry_date = pd.to_datetime(row.get('expiry_date'), errors='coerce') if row.get('expiry_date') else None
                existing_inventory.remarks = row.get('remarks', '')
                existing_inventory.updated_by = user_id
                existing_inventory.updated_at = get_local_now()
            else:
                # Create new inventory record
                inventory = Inventory(
                    product_id=product.id,
                    location_id=location.id,
                    quantity=row['quantity'],
                    unit=row['unit'],
                    batch_number=row.get('batch_number', ''),
                    expiry_date=pd.to_datetime(row.get('expiry_date'), errors='coerce') if row.get('expiry_date') else None,
                    remarks=row.get('remarks', ''),
                    created_by=user_id,
                    created_at=get_local_now()
                )
                db.session.add(inventory)
            
            imported_count += 1
            
        except Exception as e:
            errors.append(f'Row {index + 2}: {str(e)}')
    
    try:
        db.session.commit()
        return {
            'imported_count': imported_count,
            'errors': errors,
            'message': f'Successfully imported {imported_count} inventory records'
        }
    except Exception as e:
        db.session.rollback()
        return {'error': f'Database error: {str(e)}'}
