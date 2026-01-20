"""
Packing List Routes - Separate from Work Order
Manages packing of products from WIP Stock
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.production import (
    WIPStock, WIPStockMovement, PackingListNew, PackingListNewItem,
    BillOfMaterials, WorkOrder
)
from models.product import Product
from models.sales import SalesOrder, Customer
from models.user import User
from sqlalchemy import func, and_, or_
from datetime import datetime, date, time
from utils.timezone import get_local_now, get_local_today

packing_list_bp = Blueprint('packing_list', __name__)


# ===========================================
# WIP STOCK ENDPOINTS
# ===========================================

@packing_list_bp.route('/wip-stock', methods=['GET'])
@jwt_required()
def get_wip_stocks():
    """Get all WIP stocks with filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = WIPStock.query.join(Product)
        
        if search:
            query = query.filter(
                or_(
                    Product.name.ilike(f'%{search}%'),
                    Product.code.ilike(f'%{search}%')
                )
            )
        
        # Only show items with stock > 0
        query = query.filter(WIPStock.quantity_carton > 0)
        
        query = query.order_by(Product.name)
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'wip_stocks': [ws.to_dict() for ws in pagination.items],
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@packing_list_bp.route('/wip-stock/<int:product_id>', methods=['GET'])
@jwt_required()
def get_wip_stock_by_product(product_id):
    """Get WIP stock for specific product"""
    try:
        wip = WIPStock.query.filter_by(product_id=product_id).first()
        if not wip:
            return jsonify({
                'product_id': product_id,
                'quantity_pcs': 0,
                'quantity_carton': 0,
                'message': 'No WIP stock for this product'
            }), 200
        
        return jsonify(wip.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@packing_list_bp.route('/wip-stock/<int:product_id>/movements', methods=['GET'])
@jwt_required()
def get_wip_movements(product_id):
    """Get WIP stock movements for a product"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        wip = WIPStock.query.filter_by(product_id=product_id).first()
        if not wip:
            return jsonify({'movements': [], 'pagination': {'total': 0}}), 200
        
        query = WIPStockMovement.query.filter_by(wip_stock_id=wip.id)\
            .order_by(WIPStockMovement.created_at.desc())
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'movements': [m.to_dict() for m in pagination.items],
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@packing_list_bp.route('/wip-stock/adjustment', methods=['POST'])
@jwt_required()
def adjust_wip_stock():
    """Manual adjustment of WIP stock"""
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        adjustment_carton = data.get('adjustment_carton', 0)
        adjustment_pcs = data.get('adjustment_pcs', 0)
        notes = data.get('notes', '')
        
        if not product_id:
            return jsonify({'error': 'Product ID is required'}), 400
        
        user_id = get_jwt_identity()
        
        # Get or create WIP stock
        wip = WIPStock.query.filter_by(product_id=product_id).first()
        if not wip:
            product = Product.query.get(product_id)
            if not product:
                return jsonify({'error': 'Product not found'}), 404
            
            # Get pack per carton from BOM
            bom = BillOfMaterials.query.filter_by(
                product_id=product_id, is_active=True
            ).first()
            pack_per_carton = bom.pack_per_carton if bom else 1
            
            wip = WIPStock(
                product_id=product_id,
                quantity_pcs=0,
                quantity_carton=0,
                pack_per_carton=pack_per_carton
            )
            db.session.add(wip)
            db.session.flush()
        
        # Apply adjustment
        wip.quantity_carton += adjustment_carton
        wip.quantity_pcs += adjustment_pcs
        wip.last_updated_at = get_local_now()
        
        # Ensure non-negative
        if wip.quantity_carton < 0:
            wip.quantity_carton = 0
        if wip.quantity_pcs < 0:
            wip.quantity_pcs = 0
        
        # Record movement
        movement = WIPStockMovement(
            wip_stock_id=wip.id,
            product_id=product_id,
            movement_type='adjustment',
            quantity_pcs=adjustment_pcs,
            quantity_carton=adjustment_carton,
            reference_type='adjustment',
            reference_number=f'ADJ-{get_local_now().strftime("%Y%m%d%H%M%S")}',
            balance_pcs=wip.quantity_pcs,
            balance_carton=wip.quantity_carton,
            notes=notes,
            created_by=user_id
        )
        db.session.add(movement)
        db.session.commit()
        
        return jsonify({
            'message': 'WIP stock adjusted successfully',
            'wip_stock': wip.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ===========================================
# PACKING LIST ENDPOINTS
# ===========================================

def generate_packing_number():
    """Generate unique packing list number"""
    today = get_local_today()
    prefix = f"PL{today.strftime('%Y%m%d')}"
    
    last = PackingListNew.query.filter(
        PackingListNew.packing_number.like(f'{prefix}%')
    ).order_by(PackingListNew.packing_number.desc()).first()
    
    if last:
        last_num = int(last.packing_number[-4:])
        new_num = last_num + 1
    else:
        new_num = 1
    
    return f"{prefix}{new_num:04d}"


@packing_list_bp.route('', methods=['GET'])
@jwt_required()
def get_packing_lists():
    """Get all packing lists with filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status', '')
        search = request.args.get('search', '')
        product_id = request.args.get('product_id', type=int)
        
        query = PackingListNew.query
        
        if status:
            query = query.filter(PackingListNew.status == status)
        
        if product_id:
            query = query.filter(PackingListNew.product_id == product_id)
        
        if search:
            query = query.join(Product).filter(
                or_(
                    PackingListNew.packing_number.ilike(f'%{search}%'),
                    Product.name.ilike(f'%{search}%'),
                    PackingListNew.customer_name.ilike(f'%{search}%')
                )
            )
        
        query = query.order_by(PackingListNew.created_at.desc())
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'packing_lists': [pl.to_dict() for pl in pagination.items],
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@packing_list_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_packing_list(id):
    """Get single packing list with items"""
    try:
        pl = PackingListNew.query.get_or_404(id)
        return jsonify(pl.to_dict(include_items=True)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@packing_list_bp.route('', methods=['POST'])
@jwt_required()
def create_packing_list():
    """Create new packing list"""
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        total_carton = data.get('total_carton', 0)
        
        if not product_id:
            return jsonify({'error': 'Product ID is required'}), 400
        
        if total_carton <= 0:
            return jsonify({'error': 'Total carton must be greater than 0'}), 400
        
        # Check WIP stock availability
        wip = WIPStock.query.filter_by(product_id=product_id).first()
        if not wip or wip.quantity_carton < total_carton:
            available = wip.quantity_carton if wip else 0
            return jsonify({
                'error': f'Insufficient WIP stock. Available: {available} cartons, Requested: {total_carton} cartons'
            }), 400
        
        user_id = get_jwt_identity()
        product = Product.query.get(product_id)
        
        # Get pack per carton from BOM
        bom = BillOfMaterials.query.filter_by(
            product_id=product_id, is_active=True
        ).first()
        pack_per_carton = bom.pack_per_carton if bom else 1
        
        # Get carton numbering - continue from last packing list
        last_pl = PackingListNew.query.filter_by(product_id=product_id)\
            .order_by(PackingListNew.end_carton_number.desc()).first()
        
        start_carton = data.get('start_carton_number')
        if not start_carton:
            if last_pl and last_pl.end_carton_number:
                start_carton = last_pl.end_carton_number + 1
                if start_carton > 10000:
                    start_carton = 1
            else:
                start_carton = 1
        
        end_carton = start_carton + total_carton - 1
        
        # Create packing list
        pl = PackingListNew(
            packing_number=generate_packing_number(),
            product_id=product_id,
            sales_order_id=data.get('sales_order_id'),
            customer_id=data.get('customer_id'),
            customer_name=data.get('customer_name'),
            pack_per_carton=pack_per_carton,
            total_carton=total_carton,
            total_pcs=total_carton * pack_per_carton,
            start_carton_number=start_carton,
            end_carton_number=end_carton,
            current_batch_mixing=data.get('batch_mixing'),
            status='draft',
            packing_date=get_local_today(),
            notes=data.get('notes'),
            created_by=user_id
        )
        db.session.add(pl)
        db.session.flush()
        
        # Create packing list items (cartons)
        for i in range(total_carton):
            carton_num = start_carton + i
            if carton_num > 10000:
                carton_num = carton_num - 10000  # Reset after 10000
            
            item = PackingListNewItem(
                packing_list_id=pl.id,
                carton_number=carton_num,
                batch_mixing=data.get('batch_mixing'),
                is_batch_start=(i == 0)
            )
            db.session.add(item)
        
        # Deduct from WIP stock
        wip.quantity_carton -= total_carton
        wip.quantity_pcs -= (total_carton * pack_per_carton)
        wip.last_updated_at = get_local_now()
        
        # Record WIP movement
        movement = WIPStockMovement(
            wip_stock_id=wip.id,
            product_id=product_id,
            movement_type='out',
            quantity_pcs=total_carton * pack_per_carton,
            quantity_carton=total_carton,
            reference_type='packing_list',
            reference_id=pl.id,
            reference_number=pl.packing_number,
            balance_pcs=wip.quantity_pcs,
            balance_carton=wip.quantity_carton,
            notes=f'Packing list created: {pl.packing_number}',
            created_by=user_id
        )
        db.session.add(movement)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Packing list created successfully',
            'packing_list': pl.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@packing_list_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_packing_list(id):
    """Update packing list details"""
    try:
        pl = PackingListNew.query.get_or_404(id)
        data = request.get_json()
        
        if pl.status == 'completed':
            return jsonify({'error': 'Cannot edit completed packing list'}), 400
        
        # Update allowed fields
        if 'sales_order_id' in data:
            pl.sales_order_id = data['sales_order_id']
        if 'customer_id' in data:
            pl.customer_id = data['customer_id']
        if 'customer_name' in data:
            pl.customer_name = data['customer_name']
        if 'current_batch_mixing' in data:
            pl.current_batch_mixing = data['current_batch_mixing']
        if 'notes' in data:
            pl.notes = data['notes']
        if 'status' in data:
            pl.status = data['status']
            if data['status'] == 'completed':
                pl.completed_at = get_local_now()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Packing list updated successfully',
            'packing_list': pl.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@packing_list_bp.route('/<int:id>/items', methods=['GET'])
@jwt_required()
def get_packing_list_items(id):
    """Get packing list items with pagination"""
    try:
        pl = PackingListNew.query.get_or_404(id)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        query = pl.items.order_by(PackingListNewItem.carton_number)
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'packing_list': pl.to_dict(),
            'items': [item.to_dict() for item in pagination.items],
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@packing_list_bp.route('/<int:id>/items/weigh', methods=['PUT'])
@jwt_required()
def weigh_cartons(id):
    """Update weight and weigh date for cartons"""
    try:
        pl = PackingListNew.query.get_or_404(id)
        data = request.get_json()
        items = data.get('items', [])
        
        if not items:
            return jsonify({'error': 'No items to update'}), 400
        
        user_id = get_jwt_identity()
        today = get_local_today()
        now_time = get_local_now().time()
        
        for item_data in items:
            item_id = item_data.get('id')
            weight_kg = item_data.get('weight_kg')
            weigh_date = item_data.get('weigh_date')
            
            item = PackingListNewItem.query.get(item_id)
            if item and item.packing_list_id == pl.id:
                if weight_kg is not None:
                    item.weight_kg = weight_kg
                    item.weighed_by = user_id
                    
                    # Set weigh date - use provided or today
                    if weigh_date:
                        item.weigh_date = datetime.strptime(weigh_date, '%Y-%m-%d').date()
                    else:
                        item.weigh_date = today
                    
                    item.weigh_time = now_time
        
        # Update packing list status if all items weighed
        weighed_count = pl.items.filter(PackingListNewItem.weight_kg.isnot(None)).count()
        if weighed_count == pl.total_carton:
            pl.status = 'completed'
            pl.completed_at = get_local_now()
        elif weighed_count > 0:
            pl.status = 'in_progress'
        
        db.session.commit()
        
        return jsonify({
            'message': f'{len(items)} cartons weighed successfully',
            'weighed_count': weighed_count,
            'total_carton': pl.total_carton
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@packing_list_bp.route('/<int:id>/items/batch', methods=['PUT'])
@jwt_required()
def update_batch_mixing(id):
    """Update batch mixing for cartons"""
    try:
        pl = PackingListNew.query.get_or_404(id)
        data = request.get_json()
        
        batch_mixing = data.get('batch_mixing')
        start_from_carton = data.get('start_from_carton')
        
        if not batch_mixing:
            return jsonify({'error': 'Batch mixing is required'}), 400
        
        # Update current batch mixing
        pl.current_batch_mixing = batch_mixing
        
        # Update items
        query = pl.items
        if start_from_carton:
            query = query.filter(PackingListNewItem.carton_number >= start_from_carton)
            # Mark first item as batch start
            first_item = query.order_by(PackingListNewItem.carton_number).first()
            if first_item:
                first_item.is_batch_start = True
        
        for item in query.all():
            item.batch_mixing = batch_mixing
        
        db.session.commit()
        
        return jsonify({
            'message': 'Batch mixing updated successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@packing_list_bp.route('/<int:id>/cancel', methods=['POST'])
@jwt_required()
def cancel_packing_list(id):
    """Cancel packing list and return stock to WIP"""
    try:
        pl = PackingListNew.query.get_or_404(id)
        
        if pl.status == 'completed':
            return jsonify({'error': 'Cannot cancel completed packing list'}), 400
        
        user_id = get_jwt_identity()
        
        # Return stock to WIP
        wip = WIPStock.query.filter_by(product_id=pl.product_id).first()
        if wip:
            wip.quantity_carton += pl.total_carton
            wip.quantity_pcs += pl.total_pcs
            wip.last_updated_at = get_local_now()
            
            # Record movement
            movement = WIPStockMovement(
                wip_stock_id=wip.id,
                product_id=pl.product_id,
                movement_type='in',
                quantity_pcs=pl.total_pcs,
                quantity_carton=pl.total_carton,
                reference_type='packing_list_cancel',
                reference_id=pl.id,
                reference_number=pl.packing_number,
                balance_pcs=wip.quantity_pcs,
                balance_carton=wip.quantity_carton,
                notes=f'Packing list cancelled: {pl.packing_number}',
                created_by=user_id
            )
            db.session.add(movement)
        
        pl.status = 'cancelled'
        db.session.commit()
        
        return jsonify({
            'message': 'Packing list cancelled and stock returned to WIP'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ===========================================
# PRODUCTS WITH WIP ENDPOINT
# ===========================================

@packing_list_bp.route('/products-with-wip', methods=['GET'])
@jwt_required()
def get_products_with_wip():
    """Get products that have WIP stock available"""
    try:
        wip_stocks = WIPStock.query.filter(WIPStock.quantity_carton > 0).all()
        
        products = []
        for wip in wip_stocks:
            products.append({
                'id': wip.product_id,
                'code': wip.product.code if wip.product else '',
                'name': wip.product.name if wip.product else '',
                'wip_carton': wip.quantity_carton,
                'wip_pcs': wip.quantity_pcs,
                'pack_per_carton': wip.pack_per_carton
            })
        
        return jsonify({'products': products}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
