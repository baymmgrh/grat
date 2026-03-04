"""
Packing List Routes - Separate from Work Order
Manages packing of products from WIP Stock
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.production import (
    WIPStock, WIPStockMovement, PackingListNew, PackingListNewItem,
    BillOfMaterials, BOMItem, WorkOrder
)
from models.product import Product, Material
from models.warehouse import Inventory, InventoryMovement, WarehouseLocation, WarehouseZone
from models.sales import SalesOrder, Customer
from models.user import User
from sqlalchemy import func, and_, or_
from datetime import datetime, date, time
from utils.timezone import get_local_now, get_local_today

packing_list_bp = Blueprint('packing_list', __name__)


# ===========================================
# HELPER: Auto receive FG to warehouse inventory
# ===========================================

def _receive_fg_to_warehouse(packing_list, user_id):
    """When packing list is released by QC, add finished goods to warehouse inventory.
    
    Quantity is in kartons (total_carton from packing list).
    Each packing list creates a SEPARATE inventory record (batch) for FIFO tracking.
    Batch number = packing_number so FG can be traced back to specific packing list.
    """
    try:
        product_id = packing_list.product_id
        quantity = packing_list.total_carton  # FG stock in kartons
        batch_number = packing_list.packing_number  # Use packing number as batch
        
        if quantity <= 0:
            return
        
        # Find finished goods warehouse location (zone material_type = 'finished_goods')
        fg_location = WarehouseLocation.query.join(
            WarehouseLocation.zone
        ).filter(
            WarehouseZone.material_type == 'finished_goods',
            WarehouseLocation.is_active == True
        ).first()
        
        if not fg_location:
            # Fallback: any active location
            fg_location = WarehouseLocation.query.filter_by(is_active=True).first()
        
        if not fg_location:
            return  # No location available, skip
        
        # Check if inventory for this batch already exists (e.g. re-release)
        inventory = Inventory.query.filter_by(
            product_id=product_id,
            batch_number=batch_number
        ).first()
        
        if not inventory:
            # Create NEW inventory record per packing list batch for FIFO
            inventory = Inventory(
                product_id=product_id,
                location_id=fg_location.id,
                quantity_on_hand=0,
                quantity_reserved=0,
                quantity_available=0,
                batch_number=batch_number,
                stock_status='released',
                is_active=True,
                created_by=user_id
            )
            db.session.add(inventory)
            db.session.flush()
        
        # Add kartons to inventory
        inventory.quantity_on_hand = float(inventory.quantity_on_hand or 0) + float(quantity)
        inventory.quantity_available = float(inventory.quantity_available or 0) + float(quantity)
        inventory.updated_at = get_local_now()
        
        # Create inventory movement with cost info
        movement = InventoryMovement(
            inventory_id=inventory.id,
            product_id=product_id,
            location_id=inventory.location_id,
            movement_type='stock_in',
            movement_date=get_local_today(),
            quantity=quantity,
            reference_type='packing_list',
            reference_id=packing_list.id,
            reference_number=packing_list.packing_number,
            batch_number=batch_number,
            notes=f'Packing list released: {packing_list.packing_number} - {quantity} karton',
            created_by=user_id
        )
        db.session.add(movement)
        
    except Exception as e:
        import traceback
        traceback.print_exc()


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
    """Create new packing list for Finished Good product.
    
    Two deduction modes:
    1. Direct: FG has its own WIP Stock -> deduct from FG WIP Stock directly
    2. BOM Components: FG has WIP components in BOM -> deduct from each WIP component stock
    """
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        total_carton = data.get('total_carton', 0)
        
        if not product_id:
            return jsonify({'error': 'Product ID is required'}), 400
        
        if total_carton <= 0:
            return jsonify({'error': 'Total carton must be greater than 0'}), 400
        
        # Validate: only Finished Good products can have packing lists
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        if product.material_type == 'wip' or (product.name or '').startswith('WIP '):
            return jsonify({'error': 'Packing list hanya untuk produk Finished Good, bukan WIP'}), 400
        
        # Get BOM (optional - needed for bom_components mode)
        bom = BillOfMaterials.query.filter_by(
            product_id=product_id, is_active=True
        ).first()
        
        # Use pack_per_carton from request if provided
        pack_per_carton = data.get('pack_per_carton') or (bom.pack_per_carton if bom else None) or 1
        
        # Determine deduction mode: check if FG has direct WIP Stock
        direct_wip = WIPStock.query.filter_by(product_id=product_id).first()
        use_direct = direct_wip and (direct_wip.quantity_carton or 0) > 0
        
        deduction_details = []
        
        if use_direct:
            # === MODE: Direct deduction from FG WIP Stock ===
            if direct_wip.quantity_carton < total_carton:
                return jsonify({
                    'error': f'Stok tidak cukup. Tersedia: {direct_wip.quantity_carton} karton, Diminta: {total_carton} karton'
                }), 400
        else:
            # === MODE: BOM Components deduction ===
            if not bom:
                return jsonify({'error': 'Tidak ada BOM aktif dan tidak ada stok langsung untuk produk ini'}), 400
            
            bom_items = BOMItem.query.filter_by(bom_id=bom.id).all()
            wip_deductions = []
            
            for item in bom_items:
                if not item.material_id:
                    continue
                material = Material.query.get(item.material_id)
                if not material or not (material.name or '').startswith('WIP '):
                    continue
                
                qty_per_karton = float(item.quantity) if item.quantity else 0
                if qty_per_karton <= 0:
                    continue
                
                wip_product = Product.query.filter_by(code=material.code).first()
                if not wip_product:
                    return jsonify({
                        'error': f'Produk WIP tidak ditemukan untuk material {material.code} ({material.name})'
                    }), 400
                
                wip_stock = WIPStock.query.filter_by(product_id=wip_product.id).first()
                deduct_pcs = int(qty_per_karton * total_carton)
                available_pcs = wip_stock.quantity_pcs if wip_stock else 0
                
                if available_pcs < deduct_pcs:
                    max_possible = int(available_pcs / qty_per_karton) if qty_per_karton > 0 else 0
                    return jsonify({
                        'error': f'Stok WIP tidak cukup untuk {material.name}. '
                                 f'Dibutuhkan: {deduct_pcs} pcs, Tersedia: {available_pcs} pcs (maks {max_possible} karton FG)'
                    }), 400
                
                wip_deductions.append({
                    'wip_stock': wip_stock,
                    'wip_product': wip_product,
                    'material_name': material.name,
                    'deduct_pcs': deduct_pcs,
                    'qty_per_karton': qty_per_karton
                })
            
            if not wip_deductions:
                return jsonify({'error': 'BOM tidak memiliki komponen WIP dan tidak ada stok langsung.'}), 400
        
        user_id = get_jwt_identity()
        
        # Get carton numbering
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
        else:
            start_carton = int(start_carton)
            if start_carton > 10000:
                start_carton = ((start_carton - 1) % 10000) + 1
        
        end_carton = start_carton + total_carton - 1
        if end_carton > 10000:
            end_carton = ((end_carton - 1) % 10000) + 1
        
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
                carton_num = carton_num - 10000
            
            item = PackingListNewItem(
                packing_list_id=pl.id,
                carton_number=carton_num,
                batch_mixing=data.get('batch_mixing'),
                is_batch_start=(i == 0)
            )
            db.session.add(item)
        
        # === Deduct stock ===
        if use_direct:
            # Direct: deduct from FG's own WIP Stock
            deduct_pcs = total_carton * pack_per_carton
            direct_wip.quantity_carton = max(0, (direct_wip.quantity_carton or 0) - total_carton)
            direct_wip.quantity_pcs = max(0, (direct_wip.quantity_pcs or 0) - deduct_pcs)
            direct_wip.last_updated_at = get_local_now()
            
            movement = WIPStockMovement(
                wip_stock_id=direct_wip.id,
                product_id=product_id,
                movement_type='out',
                quantity_pcs=deduct_pcs,
                quantity_carton=total_carton,
                reference_type='packing_list',
                reference_id=pl.id,
                reference_number=pl.packing_number,
                balance_pcs=direct_wip.quantity_pcs,
                balance_carton=direct_wip.quantity_carton,
                notes=f'Packing FG {product.name}: {total_carton} karton',
                created_by=user_id
            )
            db.session.add(movement)
            deduction_details.append({
                'wip_name': product.name,
                'deducted_pcs': deduct_pcs,
                'deducted_karton': total_carton
            })
        else:
            # BOM Components: deduct from each WIP component
            for ded in wip_deductions:
                wip_stock = ded['wip_stock']
                wip_ppc = wip_stock.pack_per_carton or 1
                deduct_pcs = ded['deduct_pcs']
                deduct_karton = int(deduct_pcs / wip_ppc) if wip_ppc > 0 else 0
                
                wip_stock.quantity_pcs = max(0, (wip_stock.quantity_pcs or 0) - deduct_pcs)
                wip_stock.quantity_carton = max(0, (wip_stock.quantity_carton or 0) - deduct_karton)
                wip_stock.last_updated_at = get_local_now()
                
                movement = WIPStockMovement(
                    wip_stock_id=wip_stock.id,
                    product_id=ded['wip_product'].id,
                    movement_type='out',
                    quantity_pcs=deduct_pcs,
                    quantity_carton=deduct_karton,
                    reference_type='packing_list',
                    reference_id=pl.id,
                    reference_number=pl.packing_number,
                    balance_pcs=wip_stock.quantity_pcs,
                    balance_carton=wip_stock.quantity_carton,
                    notes=f'Packing FG {product.name}: {total_carton} karton x {int(ded["qty_per_karton"])}/karton',
                    created_by=user_id
                )
                db.session.add(movement)
                deduction_details.append({
                    'wip_name': ded['material_name'],
                    'deducted_pcs': deduct_pcs,
                    'deducted_karton': deduct_karton
                })
        
        db.session.commit()
        
        return jsonify({
            'message': 'Packing list berhasil dibuat',
            'packing_list': pl.to_dict(),
            'wip_deductions': deduction_details
        }), 201
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@packing_list_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_packing_list(id):
    """Update packing list details"""
    try:
        pl = PackingListNew.query.get_or_404(id)
        data = request.get_json()
        
        if pl.status in ('released', 'rejected'):
            return jsonify({'error': 'Cannot edit released/rejected packing list'}), 400
        
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
    """Cancel packing list and return stock.
    
    Checks how stock was originally deducted:
    - If FG has direct WIP Stock movement for this PL -> return to FG WIP Stock
    - Otherwise -> return to WIP component stocks via BOM
    """
    try:
        pl = PackingListNew.query.get_or_404(id)
        
        if pl.status == 'completed':
            return jsonify({'error': 'Cannot cancel completed packing list'}), 400
        
        user_id = get_jwt_identity()
        product = Product.query.get(pl.product_id)
        
        # Check if original deduction was direct (FG's own WIP Stock)
        direct_movement = WIPStockMovement.query.filter_by(
            product_id=pl.product_id,
            reference_type='packing_list',
            reference_id=pl.id,
            movement_type='out'
        ).first()
        
        if direct_movement:
            # === Return to FG's own WIP Stock (direct mode) ===
            direct_wip = WIPStock.query.filter_by(product_id=pl.product_id).first()
            if direct_wip:
                return_pcs = direct_movement.quantity_pcs or 0
                return_karton = direct_movement.quantity_carton or 0
                
                direct_wip.quantity_pcs = (direct_wip.quantity_pcs or 0) + return_pcs
                direct_wip.quantity_carton = (direct_wip.quantity_carton or 0) + return_karton
                direct_wip.last_updated_at = get_local_now()
                
                movement = WIPStockMovement(
                    wip_stock_id=direct_wip.id,
                    product_id=pl.product_id,
                    movement_type='in',
                    quantity_pcs=return_pcs,
                    quantity_carton=return_karton,
                    reference_type='packing_list_cancel',
                    reference_id=pl.id,
                    reference_number=pl.packing_number,
                    balance_pcs=direct_wip.quantity_pcs,
                    balance_carton=direct_wip.quantity_carton,
                    notes=f'Cancel packing FG {product.name if product else ""}: {pl.packing_number}',
                    created_by=user_id
                )
                db.session.add(movement)
        else:
            # === Return to WIP component stocks (BOM mode) ===
            # Find all out movements for this packing list (component deductions)
            out_movements = WIPStockMovement.query.filter_by(
                reference_type='packing_list',
                reference_id=pl.id,
                movement_type='out'
            ).all()
            
            for out_mov in out_movements:
                wip_stock = WIPStock.query.get(out_mov.wip_stock_id)
                if not wip_stock:
                    continue
                
                return_pcs = out_mov.quantity_pcs or 0
                return_karton = out_mov.quantity_carton or 0
                
                wip_stock.quantity_pcs = (wip_stock.quantity_pcs or 0) + return_pcs
                wip_stock.quantity_carton = (wip_stock.quantity_carton or 0) + return_karton
                wip_stock.last_updated_at = get_local_now()
                
                movement = WIPStockMovement(
                    wip_stock_id=wip_stock.id,
                    product_id=out_mov.product_id,
                    movement_type='in',
                    quantity_pcs=return_pcs,
                    quantity_carton=return_karton,
                    reference_type='packing_list_cancel',
                    reference_id=pl.id,
                    reference_number=pl.packing_number,
                    balance_pcs=wip_stock.quantity_pcs,
                    balance_carton=wip_stock.quantity_carton,
                    notes=f'Cancel packing FG {product.name if product else ""}: {pl.packing_number}',
                    created_by=user_id
                )
                db.session.add(movement)
        
        pl.status = 'cancelled'
        db.session.commit()
        
        return jsonify({
            'message': 'Packing list dibatalkan, stok dikembalikan'
        }), 200
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ===========================================
# QC ACTION ENDPOINT
# ===========================================

def _return_wip_stock(pl, user_id):
    """Return WIP stock when packing list is rejected. Same logic as cancel."""
    direct_movement = WIPStockMovement.query.filter_by(
        product_id=pl.product_id,
        reference_type='packing_list',
        reference_id=pl.id,
        movement_type='out'
    ).first()
    
    product = Product.query.get(pl.product_id)
    
    if direct_movement:
        direct_wip = WIPStock.query.filter_by(product_id=pl.product_id).first()
        if direct_wip:
            return_pcs = direct_movement.quantity_pcs or 0
            return_karton = direct_movement.quantity_carton or 0
            direct_wip.quantity_pcs = (direct_wip.quantity_pcs or 0) + return_pcs
            direct_wip.quantity_carton = (direct_wip.quantity_carton or 0) + return_karton
            direct_wip.last_updated_at = get_local_now()
            movement = WIPStockMovement(
                wip_stock_id=direct_wip.id,
                product_id=pl.product_id,
                movement_type='in',
                quantity_pcs=return_pcs,
                quantity_carton=return_karton,
                reference_type='packing_list_rejected',
                reference_id=pl.id,
                reference_number=pl.packing_number,
                balance_pcs=direct_wip.quantity_pcs,
                balance_carton=direct_wip.quantity_carton,
                notes=f'QC Rejected {product.name if product else ""}: {pl.packing_number}',
                created_by=user_id
            )
            db.session.add(movement)
    else:
        out_movements = WIPStockMovement.query.filter_by(
            reference_type='packing_list',
            reference_id=pl.id,
            movement_type='out'
        ).all()
        for out_mov in out_movements:
            wip_stock = WIPStock.query.get(out_mov.wip_stock_id)
            if not wip_stock:
                continue
            return_pcs = out_mov.quantity_pcs or 0
            return_karton = out_mov.quantity_carton or 0
            wip_stock.quantity_pcs = (wip_stock.quantity_pcs or 0) + return_pcs
            wip_stock.quantity_carton = (wip_stock.quantity_carton or 0) + return_karton
            wip_stock.last_updated_at = get_local_now()
            movement = WIPStockMovement(
                wip_stock_id=wip_stock.id,
                product_id=out_mov.product_id,
                movement_type='in',
                quantity_pcs=return_pcs,
                quantity_carton=return_karton,
                reference_type='packing_list_rejected',
                reference_id=pl.id,
                reference_number=pl.packing_number,
                balance_pcs=wip_stock.quantity_pcs,
                balance_carton=wip_stock.quantity_carton,
                notes=f'QC Rejected {product.name if product else ""}: {pl.packing_number}',
                created_by=user_id
            )
            db.session.add(movement)


@packing_list_bp.route('/<int:id>/qc', methods=['POST'])
@jwt_required()
def qc_packing_list(id):
    """QC action on packing list after all cartons are weighed.
    
    Actions:
    - quarantine: hold for further review
    - released: QC passed -> auto stock_in to FG warehouse
    - rejected: QC failed -> return WIP stock
    
    From quarantine, can be changed to released or rejected.
    """
    try:
        pl = PackingListNew.query.get_or_404(id)
        data = request.get_json()
        
        action = data.get('action')  # quarantine, released, rejected
        qc_notes = data.get('qc_notes', '')
        
        if action not in ('quarantine', 'released', 'rejected'):
            return jsonify({'error': 'Action harus quarantine, released, atau rejected'}), 400
        
        # Validate current status allows QC action
        allowed_from = ('completed', 'quarantine')
        if pl.status not in allowed_from:
            return jsonify({
                'error': f'QC hanya bisa dilakukan pada packing list dengan status completed atau quarantine. Status saat ini: {pl.status}'
            }), 400
        
        user_id = get_jwt_identity()
        now = get_local_now()
        
        pl.qc_status = action
        pl.qc_date = now
        pl.qc_by = user_id
        pl.qc_notes = qc_notes
        pl.status = action  # status follows QC action
        
        if action == 'released':
            pl.released_at = now
            # Auto stock_in to FG warehouse
            _receive_fg_to_warehouse(pl, user_id)
            
        elif action == 'rejected':
            # Return WIP stock
            _return_wip_stock(pl, user_id)
        
        db.session.commit()
        
        action_labels = {
            'quarantine': 'Packing list ditahan (quarantine)',
            'released': 'Packing list released, stok masuk gudang FG',
            'rejected': 'Packing list ditolak, stok WIP dikembalikan'
        }
        
        return jsonify({
            'message': action_labels.get(action, 'QC updated'),
            'packing_list': pl.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ===========================================
# HELPER: Calculate FG availability from WIP components
# ===========================================

def _get_fg_availability():
    """Get all FG products available for packing.
    
    Two sources of availability:
    1. FG has direct WIP Stock (legacy data / FG WO output) -> 'direct' mode
    2. FG has WIP components in BOM -> 'bom_components' mode
    
    Both sources are combined. If FG has both direct stock AND BOM components,
    both are reported and the frontend/create logic will handle accordingly.
    """
    results = []
    seen_product_ids = set()
    
    # === Source 1: FG products with direct WIP Stock ===
    direct_fg_stocks = WIPStock.query.join(Product).filter(
        WIPStock.quantity_carton > 0,
        ~Product.name.like('WIP %'),
        Product.material_type.notin_(['wip'])
    ).all()
    
    for wip_stock in direct_fg_stocks:
        product = wip_stock.product
        if not product:
            continue
        
        seen_product_ids.add(product.id)
        
        # Check if also has BOM with WIP components
        bom = BillOfMaterials.query.filter_by(
            product_id=product.id, is_active=True
        ).first()
        
        bom_wip_components = []
        if bom:
            bom_items = BOMItem.query.filter_by(bom_id=bom.id).all()
            for item in bom_items:
                if not item.material_id:
                    continue
                material = Material.query.get(item.material_id)
                if not material or not (material.name or '').startswith('WIP '):
                    continue
                wip_prod = Product.query.filter_by(code=material.code).first()
                ws = WIPStock.query.filter_by(product_id=wip_prod.id).first() if wip_prod else None
                bom_wip_components.append({
                    'material_code': material.code,
                    'material_name': material.name,
                    'wip_product_id': wip_prod.id if wip_prod else None,
                    'qty_per_karton': float(item.quantity) if item.quantity else 0,
                    'uom': item.uom,
                    'wip_stock_pcs': (ws.quantity_pcs or 0) if ws else 0,
                    'wip_stock_karton': (ws.quantity_carton or 0) if ws else 0,
                    'possible_fg_kartons': 0
                })
        
        results.append({
            'id': product.id,
            'code': product.code,
            'name': product.name,
            'bom_id': bom.id if bom else None,
            'bom_number': bom.bom_number if bom else None,
            'pack_per_carton': wip_stock.pack_per_carton or 1,
            'source': 'direct',
            'available_kartons': wip_stock.quantity_carton or 0,
            'available_pcs': wip_stock.quantity_pcs or 0,
            'wip_components': bom_wip_components
        })
    
    # === Source 2: FG products with WIP components in BOM (no direct stock) ===
    fg_boms = db.session.query(BillOfMaterials, Product).join(
        Product, BillOfMaterials.product_id == Product.id
    ).filter(
        BillOfMaterials.is_active == True,
        Product.material_type.notin_(['wip']),
        ~Product.name.like('WIP %'),
        ~Product.id.in_(seen_product_ids) if seen_product_ids else True
    ).all()
    
    for bom, product in fg_boms:
        bom_items = BOMItem.query.filter_by(bom_id=bom.id).all()
        
        wip_components = []
        max_fg_kartons = float('inf')
        has_wip = False
        
        for item in bom_items:
            material = None
            if item.material_id:
                material = Material.query.get(item.material_id)
            if not material or not (material.name or '').startswith('WIP '):
                continue
            
            has_wip = True
            qty_per_karton = float(item.quantity) if item.quantity else 0
            if qty_per_karton <= 0:
                continue
            
            wip_product = Product.query.filter_by(code=material.code).first()
            wip_stock_pcs = 0
            wip_stock_karton = 0
            
            if wip_product:
                ws = WIPStock.query.filter_by(product_id=wip_product.id).first()
                if ws:
                    wip_stock_pcs = ws.quantity_pcs or 0
                    wip_stock_karton = ws.quantity_carton or 0
            
            possible_kartons = int(wip_stock_pcs / qty_per_karton) if qty_per_karton > 0 else 0
            max_fg_kartons = min(max_fg_kartons, possible_kartons)
            
            wip_components.append({
                'material_code': material.code,
                'material_name': material.name,
                'wip_product_id': wip_product.id if wip_product else None,
                'qty_per_karton': qty_per_karton,
                'uom': item.uom,
                'wip_stock_pcs': wip_stock_pcs,
                'wip_stock_karton': wip_stock_karton,
                'possible_fg_kartons': possible_kartons
            })
        
        if not has_wip:
            continue
        
        if max_fg_kartons == float('inf'):
            max_fg_kartons = 0
        
        if max_fg_kartons <= 0:
            continue
        
        results.append({
            'id': product.id,
            'code': product.code,
            'name': product.name,
            'bom_id': bom.id,
            'bom_number': bom.bom_number,
            'pack_per_carton': bom.pack_per_carton or 1,
            'source': 'bom_components',
            'available_kartons': max_fg_kartons,
            'available_pcs': max_fg_kartons * (bom.pack_per_carton or 1),
            'wip_components': wip_components
        })
    
    return results


# ===========================================
# PRODUCTS WITH WIP ENDPOINT
# ===========================================

@packing_list_bp.route('/products-with-wip', methods=['GET'])
@jwt_required()
def get_products_with_wip():
    """Get Finished Good products available for packing.
    
    Calculates FG availability based on WIP component stock via BOM.
    Example: ALFAMART WET WIPES 20S @27X3 needs 27 Kuromi + 27 Cinamoroll + 27 Hellokitty per karton.
    Available FG kartons = MIN(available WIP pcs / qty per karton) across all WIP components.
    """
    try:
        fg_products = _get_fg_availability()
        
        # Filter: only show products with available stock > 0 (unless show_all=true)
        show_all = request.args.get('show_all', 'false').lower() == 'true'
        if not show_all:
            fg_products = [p for p in fg_products if p['available_kartons'] > 0]
        
        return jsonify({'products': fg_products}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
