"""
Workflow Integration Routes
Handles end-to-end business workflow integration:
- Sales Order → MRP → Purchase Order → Production → Quality → Shipping → Finance
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import (
    db, SalesOrder, SalesOrderItem, PurchaseOrder, PurchaseOrderItem,
    WorkOrder, Product, ProductNew, Material, BillOfMaterials, BOMItem,
    Inventory, Customer, Supplier
)
from utils import generate_number
from datetime import datetime, timedelta
from sqlalchemy import and_, or_
import traceback
from utils.timezone import get_local_now, get_local_today

workflow_bp = Blueprint('workflow_integration', __name__)

# ===============================
# SALES ORDER → MRP INTEGRATION
# ===============================

@workflow_bp.route('/sales-order-to-mrp', methods=['POST'])
@jwt_required()
def sales_order_to_mrp():
    """
    Trigger MRP calculation from Sales Order
    Creates material requirements and production planning
    """
    try:
        data = request.get_json()
        so_id = data.get('sales_order_id')
        
        if not so_id:
            return jsonify({'error': 'sales_order_id is required'}), 400
        
        # Get Sales Order
        so = SalesOrder.query.get(so_id)
        if not so:
            return jsonify({'error': 'Sales Order not found'}), 404
        
        # Get SO items
        so_items = SalesOrderItem.query.filter_by(order_id=so_id).all()
        
        mrp_requirements = []
        
        for item in so_items:
            # Get product BOM
            product = Product.query.get(item.product_id)
            if not product:
                continue
            
            bom = BillOfMaterials.query.filter_by(
                product_id=product.id,
                is_active=True
            ).first()
            
            if not bom:
                # No BOM - direct product requirement
                mrp_requirements.append({
                    'type': 'product',
                    'product_id': product.id,
                    'product_name': product.name,
                    'quantity_needed': item.quantity,
                    'uom': item.uom,
                    'source': 'sales_order',
                    'source_id': so.id,
                    'source_number': so.order_number
                })
                continue
            
            # BOM exists - calculate material requirements
            for bom_item in bom.items:
                material_needed = (item.quantity / bom.batch_size) * bom_item.quantity
                
                # Check current inventory
                inventory = Inventory.query.filter_by(
                    material_id=bom_item.material_id
                ).first()
                
                current_stock = float(inventory.quantity) if inventory else 0
                shortage = max(0, material_needed - current_stock)
                
                mrp_requirements.append({
                    'type': 'material',
                    'material_id': bom_item.material_id,
                    'material_name': bom_item.material.name,
                    'quantity_needed': material_needed,
                    'current_stock': current_stock,
                    'shortage': shortage,
                    'uom': bom_item.uom,
                    'source': 'sales_order',
                    'source_id': so.id,
                    'source_number': so.order_number,
                    'product_name': product.name
                })
        
        # Determine next action
        has_shortage = any(req.get('shortage', 0) > 0 for req in mrp_requirements if req['type'] == 'material')
        
        return jsonify({
            'message': 'MRP calculation complete',
            'sales_order': {
                'id': so.id,
                'order_number': so.order_number,
                'customer': so.customer.company_name if so.customer else None
            },
            'requirements': mrp_requirements,
            'has_shortage': has_shortage,
            'next_action': 'create_purchase_order' if has_shortage else 'create_work_order',
            'recommendation': 'Purchase materials first' if has_shortage else 'Ready for production'
        }), 200
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ===============================
# MRP → PURCHASE ORDER INTEGRATION
# ===============================

@workflow_bp.route('/mrp-to-purchase-order', methods=['POST'])
@jwt_required()
def mrp_to_purchase_order():
    """
    Create Purchase Order from MRP requirements
    """
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        requirements = data.get('requirements', [])
        supplier_id = data.get('supplier_id')
        
        if not requirements:
            return jsonify({'error': 'requirements are required'}), 400
        
        if not supplier_id:
            return jsonify({'error': 'supplier_id is required'}), 400
        
        # Create Purchase Order
        po_number = generate_number('PO', PurchaseOrder, 'po_number')
        
        po = PurchaseOrder(
            po_number=po_number,
            supplier_id=supplier_id,
            order_date=get_local_now(),
            required_date=get_local_now() + timedelta(days=7),
            status='draft',
            notes=f'Auto-generated from MRP for SO: {requirements[0].get("source_number", "")}',
            created_by=user_id
        )
        
        db.session.add(po)
        db.session.flush()
        
        # Add items
        subtotal = 0
        for idx, req in enumerate(requirements, 1):
            if req.get('type') != 'material':
                continue
            
            material = Material.query.get(req['material_id'])
            if not material:
                continue
            
            quantity = req.get('shortage', req.get('quantity_needed', 0))
            unit_price = float(material.cost_per_unit) if material.cost_per_unit else 0
            item_total = quantity * unit_price
            
            item = PurchaseOrderItem(
                po_id=po.id,
                line_number=idx,
                product_id=material.id,  # Material ID
                quantity=quantity,
                uom=req.get('uom', 'PCS'),
                unit_price=unit_price,
                total_price=item_total
            )
            db.session.add(item)
            subtotal += item_total
        
        po.subtotal = subtotal
        po.total_amount = subtotal
        
        db.session.commit()
        
        return jsonify({
            'message': 'Purchase Order created from MRP',
            'purchase_order': {
                'id': po.id,
                'po_number': po_number,
                'supplier_id': supplier_id,
                'total_amount': float(subtotal),
                'status': 'draft'
            },
            'next_action': 'approve_and_send_po'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ===============================
# MRP → WORK ORDER INTEGRATION
# ===============================

@workflow_bp.route('/mrp-to-work-order', methods=['POST'])
@jwt_required()
def mrp_to_work_order():
    """
    Create Work Order (SPK) from MRP requirements
    """
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        so_id = data.get('sales_order_id')
        product_id = data.get('product_id')
        quantity = data.get('quantity')
        
        if not all([so_id, product_id, quantity]):
            return jsonify({'error': 'sales_order_id, product_id, and quantity are required'}), 400
        
        # Get Sales Order
        so = SalesOrder.query.get(so_id)
        if not so:
            return jsonify({'error': 'Sales Order not found'}), 404
        
        # Get Product
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Create Work Order
        wo_number = generate_number('WO', WorkOrder, 'wo_number')
        
        wo = WorkOrder(
            wo_number=wo_number,
            product_id=product_id,
            sales_order_id=so_id,
            uom='PCS',  # Default UOM
            quantity_produced=0,  # Will be updated during production
            quantity_good=0,
            quantity_scrap=0,
            required_date=so.required_date if so.required_date else (get_local_now() + timedelta(days=7)).date(),
            scheduled_start_date=get_local_now(),
            scheduled_end_date=so.required_date if so.required_date else get_local_now() + timedelta(days=7),
            status='planned',
            priority='normal',
            workflow_status='scheduled',
            notes=f'Auto-generated from SO: {so.order_number} - Target Qty: {quantity}',
            created_by=user_id
        )
        
        db.session.add(wo)
        db.session.commit()
        
        return jsonify({
            'message': 'Work Order created from MRP',
            'work_order': {
                'id': wo.id,
                'wo_number': wo_number,
                'product_name': product.name,
                'target_quantity': quantity,  # Target quantity from SO
                'quantity_produced': 0,
                'status': 'planned',
                'workflow_status': 'scheduled'
            },
            'next_action': 'start_production'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ===============================
# COMPLETE WORKFLOW INTEGRATION
# ===============================

@workflow_bp.route('/complete-workflow', methods=['POST'])
@jwt_required()
def complete_workflow():
    """
    Execute complete workflow from Sales Order to Production
    1. Sales Order → MRP calculation
    2. MRP → Purchase Order (if material shortage)
    3. MRP → Work Order (if materials available)
    """
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        so_id = data.get('sales_order_id')
        auto_create_po = data.get('auto_create_po', False)
        auto_create_wo = data.get('auto_create_wo', False)
        
        if not so_id:
            return jsonify({'error': 'sales_order_id is required'}), 400
        
        workflow_steps = []
        
        # Step 1: MRP Calculation
        mrp_response = sales_order_to_mrp()
        mrp_data = mrp_response[0].get_json()
        
        workflow_steps.append({
            'step': 1,
            'name': 'MRP Calculation',
            'status': 'completed',
            'data': mrp_data
        })
        
        has_shortage = mrp_data.get('has_shortage', False)
        
        # Step 2: Create Purchase Order if shortage
        if has_shortage and auto_create_po:
            # Get first supplier (in real scenario, should be smarter)
            supplier = Supplier.query.filter_by(is_active=True).first()
            
            if supplier:
                po_data = {
                    'requirements': [
                        req for req in mrp_data.get('requirements', [])
                        if req.get('type') == 'material' and req.get('shortage', 0) > 0
                    ],
                    'supplier_id': supplier.id
                }
                
                # Create PO
                request._cached_json = po_data
                po_response = mrp_to_purchase_order()
                po_result = po_response[0].get_json()
                
                workflow_steps.append({
                    'step': 2,
                    'name': 'Purchase Order Creation',
                    'status': 'completed',
                    'data': po_result
                })
        
        # Step 3: Create Work Order if no shortage or after PO
        if (not has_shortage or auto_create_po) and auto_create_wo:
            so = SalesOrder.query.get(so_id)
            so_items = SalesOrderItem.query.filter_by(order_id=so_id).first()
            
            if so_items:
                wo_data = {
                    'sales_order_id': so_id,
                    'product_id': so_items.product_id,
                    'quantity': so_items.quantity
                }
                
                request._cached_json = wo_data
                wo_response = mrp_to_work_order()
                wo_result = wo_response[0].get_json()
                
                workflow_steps.append({
                    'step': 3,
                    'name': 'Work Order Creation',
                    'status': 'completed',
                    'data': wo_result
                })
        
        return jsonify({
            'message': 'Complete workflow executed',
            'workflow_steps': workflow_steps,
            'summary': {
                'total_steps': len(workflow_steps),
                'has_material_shortage': has_shortage,
                'purchase_order_created': any(s['name'] == 'Purchase Order Creation' for s in workflow_steps),
                'work_order_created': any(s['name'] == 'Work Order Creation' for s in workflow_steps)
            }
        }), 200
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ===============================
# WORKFLOW STATUS CHECK
# ===============================

@workflow_bp.route('/workflow-status/<int:so_id>', methods=['GET'])
@jwt_required()
def get_workflow_status(so_id):
    """
    Get complete workflow status for a Sales Order
    """
    try:
        so = SalesOrder.query.get(so_id)
        if not so:
            return jsonify({'error': 'Sales Order not found'}), 404
        
        # Check related records
        work_orders = WorkOrder.query.filter(
            WorkOrder.notes.like(f'%{so.order_number}%')
        ).all()
        
        purchase_orders = PurchaseOrder.query.filter(
            PurchaseOrder.notes.like(f'%{so.order_number}%')
        ).all()
        
        return jsonify({
            'sales_order': {
                'id': so.id,
                'order_number': so.order_number,
                'status': so.status,
                'customer': so.customer.company_name if so.customer else None
            },
            'work_orders': [{
                'id': wo.id,
                'wo_number': wo.wo_number,
                'status': wo.status,
                'quantity': wo.quantity
            } for wo in work_orders],
            'purchase_orders': [{
                'id': po.id,
                'po_number': po.po_number,
                'status': po.status,
                'total_amount': float(po.total_amount) if po.total_amount else 0
            } for po in purchase_orders],
            'workflow_complete': len(work_orders) > 0
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
