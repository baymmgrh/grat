"""
Production Integration Module
Handles automatic integrations between Production and other modules:
1. Warehouse Auto-Deduction
2. Purchasing Auto-Requisition
3. Quality Gate Integration
4. Shipping Auto-Creation
5. Finance Cost Tracking
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.production import WorkOrder, ShiftProduction, Machine
from models.warehouse import Inventory, InventoryMovement
from models.product import Product, Material
from models.work_order_bom import WorkOrderBOMItem
from datetime import datetime
from sqlalchemy import func
import json
from utils.timezone import get_local_now, get_local_today

production_integration_bp = Blueprint('production_integration', __name__)


# ============= 1. WAREHOUSE AUTO-DEDUCTION =============

def auto_deduct_materials(work_order_id, user_id=None):
    """
    Automatically deduct materials from warehouse when production starts
    Returns: (success: bool, message: str, transactions: list)
    """
    try:
        from utils.opname_lock import check_opname_lock
        
        wo = WorkOrder.query.get(work_order_id)
        if not wo:
            return False, "Work order not found", []
        
        if not wo.bom_id:
            return False, "Work order has no BOM attached", []
        
        # Get BOM items for this WO
        bom_items = WorkOrderBOMItem.query.filter_by(work_order_id=work_order_id).all()
        
        if not bom_items:
            return False, "No BOM items found for this work order", []
        
        # Check opname lock for all BOM materials before deducting
        for bom_item in bom_items:
            lock = check_opname_lock(
                material_id=bom_item.material_id,
                product_id=bom_item.product_id
            )
            if lock['locked']:
                return False, lock['message'], []
        
        transactions = []
        insufficient_materials = []
        
        for bom_item in bom_items:
            # Use quantity_planned instead of quantity_required
            required_qty = float(bom_item.quantity_planned) if bom_item.quantity_planned else 0
            
            # Check if material or product
            if bom_item.material_id:
                # Find inventory for this material
                inventory = Inventory.query.filter_by(
                    material_id=bom_item.material_id
                ).first()
                
                if not inventory or float(inventory.quantity_on_hand) < required_qty:
                    mat_name = bom_item.item_name if bom_item.item_name else (bom_item.material.name if bom_item.material else 'Unknown')
                    insufficient_materials.append({
                        'type': 'material',
                        'id': bom_item.material_id,
                        'name': mat_name,
                        'required': required_qty,
                        'available': float(inventory.quantity_on_hand) if inventory else 0
                    })
                    continue
                
                # Create inventory movement (deduction)
                movement = InventoryMovement(
                    inventory_id=inventory.id,
                    movement_type='production_issue',
                    quantity=-required_qty,
                    reference_type='work_order',
                    reference_id=work_order_id,
                    notes=f'Auto-deduction for WO {wo.wo_number}',
                    created_by=user_id,
                    created_at=get_local_now()
                )
                db.session.add(movement)
                
                # Update inventory quantity
                inventory.quantity_on_hand = float(inventory.quantity_on_hand) - required_qty
                inventory.quantity_available = float(inventory.quantity_available) - required_qty
                inventory.updated_at = get_local_now()
                
                mat_name = bom_item.item_name if bom_item.item_name else (bom_item.material.name if bom_item.material else 'Unknown')
                transactions.append({
                    'type': 'material',
                    'id': bom_item.material_id,
                    'name': mat_name,
                    'quantity': required_qty,
                    'movement_id': None  # Will be set after commit
                })
            
            elif bom_item.product_id:
                # Find inventory for this product
                inventory = Inventory.query.filter_by(
                    product_id=bom_item.product_id
                ).first()
                
                if not inventory or float(inventory.quantity_on_hand) < required_qty:
                    prod_name = bom_item.item_name if bom_item.item_name else (bom_item.product.name if bom_item.product else 'Unknown')
                    insufficient_materials.append({
                        'type': 'product',
                        'id': bom_item.product_id,
                        'name': prod_name,
                        'required': required_qty,
                        'available': float(inventory.quantity_on_hand) if inventory else 0
                    })
                    continue
                
                # Create inventory movement (deduction)
                movement = InventoryMovement(
                    inventory_id=inventory.id,
                    movement_type='production_issue',
                    quantity=-required_qty,
                    reference_type='work_order',
                    reference_id=work_order_id,
                    notes=f'Auto-deduction for WO {wo.wo_number}',
                    created_by=user_id,
                    created_at=get_local_now()
                )
                db.session.add(movement)
                
                # Update inventory quantity
                inventory.quantity_on_hand = float(inventory.quantity_on_hand) - required_qty
                inventory.quantity_available = float(inventory.quantity_available) - required_qty
                inventory.updated_at = get_local_now()
                
                prod_name = bom_item.item_name if bom_item.item_name else (bom_item.product.name if bom_item.product else 'Unknown')
                transactions.append({
                    'type': 'product',
                    'id': bom_item.product_id,
                    'name': prod_name,
                    'quantity': required_qty,
                    'movement_id': None
                })
        
        if insufficient_materials:
            return False, f"Insufficient materials: {len(insufficient_materials)} items", insufficient_materials
        
        # Commit all transactions
        db.session.commit()
        
        return True, f"Successfully deducted {len(transactions)} materials", transactions
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return False, f"Error: {str(e)}", []


def auto_receive_finished_goods(work_order_id, quantity_produced, user_id=None):
    """
    Automatically receive finished goods to warehouse when production completes
    Uses pure SQL to avoid ORM foreign key validation issues
    Returns: (success: bool, message: str, inventory_id: int)
    """
    from sqlalchemy import text
    from utils.opname_lock import check_opname_lock
    
    try:
        # Get WO info using raw SQL (including scheduled_start_date for proper dating)
        result = db.session.execute(text("""
            SELECT id, wo_number, product_id, scheduled_start_date, actual_end_date 
            FROM work_orders WHERE id = :wo_id
        """), {'wo_id': work_order_id})
        wo_row = result.fetchone()
        
        if not wo_row:
            return False, "Work order not found", None
        
        wo_id, wo_number, product_id, wo_start_date, wo_end_date = wo_row
        
        # Check opname lock for the finished goods product
        if product_id:
            lock = check_opname_lock(product_id=product_id)
            if lock['locked']:
                return False, lock['message'], None
        
        # Use WO end date if available, otherwise start date, otherwise today
        movement_date = wo_end_date or wo_start_date or get_local_now().date()
        if hasattr(movement_date, 'date'):
            movement_date = movement_date.date()
        if hasattr(movement_date, 'isoformat'):
            movement_date = movement_date.isoformat()
        
        if not product_id:
            return False, "Work order has no product", None
        
        # Check if inventory exists for this product
        result = db.session.execute(text("""
            SELECT id, location_id, quantity_on_hand, quantity_available 
            FROM inventory WHERE product_id = :product_id LIMIT 1
        """), {'product_id': product_id})
        inv_row = result.fetchone()
        
        if inv_row:
            inventory_id = inv_row[0]
            location_id = inv_row[1]
            current_on_hand = float(inv_row[2] or 0)
            current_available = float(inv_row[3] or 0)
        else:
            # Get default location
            result = db.session.execute(text("""
                SELECT id FROM warehouse_locations WHERE is_active = 1 LIMIT 1
            """))
            loc_row = result.fetchone()
            
            if not loc_row:
                return False, "No warehouse location available", None
            
            location_id = loc_row[0]
            
            # Create new inventory using raw SQL
            db.session.execute(text("""
                INSERT INTO inventory 
                (product_id, location_id, quantity_on_hand, quantity_available, 
                 quantity_reserved, min_stock_level, max_stock_level, 
                 is_active, stock_status, work_order_id, created_at, updated_at)
                VALUES (:product_id, :location_id, 0, 0, 0, 0, 0, 1, 'released', 
                        :work_order_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """), {
                'product_id': product_id,
                'location_id': location_id,
                'work_order_id': work_order_id
            })
            
            # Get the new inventory ID
            result = db.session.execute(text("""
                SELECT id FROM inventory WHERE product_id = :product_id ORDER BY id DESC LIMIT 1
            """), {'product_id': product_id})
            inv_row = result.fetchone()
            inventory_id = inv_row[0]
            current_on_hand = 0
            current_available = 0
        
        # Create inventory movement using raw SQL
        db.session.execute(text("""
            INSERT INTO inventory_movements 
            (inventory_id, product_id, location_id, movement_type, movement_date,
             quantity, reference_type, reference_id, reference_number, notes, 
             created_by, created_at)
            VALUES (:inventory_id, :product_id, :location_id, 'production_receipt', 
                    :movement_date, :quantity, 'work_order', :reference_id, 
                    :reference_number, :notes, :created_by, CURRENT_TIMESTAMP)
        """), {
            'inventory_id': inventory_id,
            'product_id': product_id,
            'location_id': location_id,
            'movement_date': movement_date,
            'quantity': quantity_produced,
            'reference_id': work_order_id,
            'reference_number': wo_number,
            'notes': f'Auto-receipt from WO {wo_number}',
            'created_by': user_id
        })
        
        # Update inventory quantity using raw SQL
        new_on_hand = current_on_hand + quantity_produced
        new_available = current_available + quantity_produced
        
        db.session.execute(text("""
            UPDATE inventory 
            SET quantity_on_hand = :qty_on_hand, 
                quantity_available = :qty_available,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :inventory_id
        """), {
            'qty_on_hand': new_on_hand,
            'qty_available': new_available,
            'inventory_id': inventory_id
        })
        
        db.session.commit()
        
        return True, f"Successfully received {quantity_produced} units to inventory", inventory_id
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return False, f"Error: {str(e)}", None


@production_integration_bp.route('/api/production/work-orders/<int:wo_id>/auto-deduct', methods=['POST'])
@jwt_required()
def trigger_auto_deduct(wo_id):
    """Manual trigger for material auto-deduction"""
    try:
        user_id = get_jwt_identity()
        success, message, data = auto_deduct_materials(wo_id, user_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': message,
                'transactions': data
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': message,
                'insufficient_materials': data
            }), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@production_integration_bp.route('/api/production/work-orders/<int:wo_id>/auto-receive', methods=['POST'])
@jwt_required()
def trigger_auto_receive(wo_id):
    """Manual trigger for finished goods auto-receiving"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        quantity = data.get('quantity', 0)
        
        if quantity <= 0:
            return jsonify({'error': 'Invalid quantity'}), 400
        
        success, message, inventory_id = auto_receive_finished_goods(wo_id, quantity, user_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': message,
                'inventory_id': inventory_id
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': message
            }), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@production_integration_bp.route('/api/production/work-orders/<int:wo_id>/material-availability', methods=['GET'])
@jwt_required()
def check_material_availability(wo_id):
    """Check if all materials are available for production"""
    try:
        wo = WorkOrder.query.get_or_404(wo_id)
        
        if not wo.bom_id:
            return jsonify({
                'available': False,
                'message': 'No BOM attached',
                'items': []
            }), 200
        
        bom_items = WorkOrderBOMItem.query.filter_by(work_order_id=wo_id).all()
        
        availability_check = []
        all_available = True
        
        for bom_item in bom_items:
            required_qty = float(bom_item.quantity_required) if bom_item.quantity_required else 0
            
            if bom_item.material_id:
                inventory = Inventory.query.filter_by(material_id=bom_item.material_id).first()
                available_qty = float(inventory.quantity) if inventory else 0
                
                item_available = available_qty >= required_qty
                if not item_available:
                    all_available = False
                
                # Get material name from item_name field or material relationship
                mat_name = bom_item.item_name if bom_item.item_name else (bom_item.material.name if bom_item.material else 'Unknown')
                
                availability_check.append({
                    'type': 'material',
                    'id': bom_item.material_id,
                    'name': mat_name,
                    'required': required_qty,
                    'available': available_qty,
                    'sufficient': item_available,
                    'shortage': max(0, required_qty - available_qty)
                })
            
            elif bom_item.product_id:
                inventory = Inventory.query.filter_by(product_id=bom_item.product_id).first()
                available_qty = float(inventory.quantity_on_hand) if inventory else 0
                
                item_available = available_qty >= required_qty
                if not item_available:
                    all_available = False
                
                # Get product name from item_name field or product relationship
                prod_name = bom_item.item_name if bom_item.item_name else (bom_item.product.name if bom_item.product else 'Unknown')
                
                availability_check.append({
                    'type': 'product',
                    'id': bom_item.product_id,
                    'name': prod_name,
                    'required': required_qty,
                    'available': available_qty,
                    'sufficient': item_available,
                    'shortage': max(0, required_qty - available_qty)
                })
        
        return jsonify({
            'available': all_available,
            'message': 'All materials available' if all_available else 'Some materials insufficient',
            'items': availability_check,
            'total_items': len(availability_check),
            'insufficient_count': len([i for i in availability_check if not i['sufficient']])
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============= 2. PURCHASING AUTO-REQUISITION =============
# To be implemented in next phase

# ============= 3. QUALITY GATE INTEGRATION =============
# To be implemented in next phase

# ============= 4. SHIPPING AUTO-CREATION =============
# To be implemented in next phase

# ============= 5. FINANCE COST TRACKING =============
# To be implemented in next phase
