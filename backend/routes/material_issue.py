from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.material_issue import MaterialIssue, MaterialIssueItem, MaterialReturn, MaterialReturnItem
from models.warehouse import Inventory, InventoryMovement, WarehouseLocation
from models.product import Material
from models.production import WorkOrder, BillOfMaterials, BOMItem
from utils.i18n import success_response, error_response
from utils import generate_number
from datetime import datetime
from sqlalchemy import func
from utils.timezone import get_local_now, get_local_today

material_issue_bp = Blueprint('material_issue', __name__)

# ============= MATERIAL ISSUE =============

@material_issue_bp.route('/material-issues', methods=['GET'])
@jwt_required()
def get_material_issues():
    """Get all material issues with filters"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        work_order_id = request.args.get('work_order_id', type=int)
        
        query = MaterialIssue.query
        
        if status:
            query = query.filter(MaterialIssue.status == status)
        
        if work_order_id:
            query = query.filter(MaterialIssue.work_order_id == work_order_id)
        
        issues = query.order_by(MaterialIssue.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'material_issues': [{
                'id': mi.id,
                'issue_number': mi.issue_number,
                'work_order_id': mi.work_order_id,
                'wo_number': mi.work_order.wo_number if mi.work_order else None,
                'product_name': mi.work_order.product.name if mi.work_order and mi.work_order.product else None,
                'issue_date': mi.issue_date.isoformat() if mi.issue_date else None,
                'status': mi.status,
                'priority': mi.priority,
                'issue_type': mi.issue_type,
                'total_items': mi.total_items,
                'requested_by': mi.requested_by_user.username if mi.requested_by_user else None,
                'created_at': mi.created_at.isoformat()
            } for mi in issues.items],
            'total': issues.total,
            'pages': issues.pages,
            'current_page': issues.page
        }), 200
        
    except Exception as e:
        return error_response(str(e)), 500

@material_issue_bp.route('/material-issues/<int:id>', methods=['GET'])
@jwt_required()
def get_material_issue(id):
    """Get single material issue with items"""
    try:
        mi = MaterialIssue.query.get(id)
        if not mi:
            return error_response('Material issue not found'), 404
        
        return jsonify({
            'material_issue': {
                'id': mi.id,
                'issue_number': mi.issue_number,
                'work_order_id': mi.work_order_id,
                'wo_number': mi.work_order.wo_number if mi.work_order else None,
                'product_name': mi.work_order.product.name if mi.work_order and mi.work_order.product else None,
                'issue_date': mi.issue_date.isoformat() if mi.issue_date else None,
                'required_date': mi.required_date.isoformat() if mi.required_date else None,
                'status': mi.status,
                'priority': mi.priority,
                'issue_type': mi.issue_type,
                'department': mi.department,
                'notes': mi.notes,
                'special_instructions': mi.special_instructions,
                'requested_by': mi.requested_by_user.username if mi.requested_by_user else None,
                'approved_by': mi.approved_by_user.username if mi.approved_by_user else None,
                'issued_by': mi.issued_by_user.username if mi.issued_by_user else None,
                'approved_date': mi.approved_date.isoformat() if mi.approved_date else None,
                'issued_date': mi.issued_date.isoformat() if mi.issued_date else None,
                'items': [{
                    'id': item.id,
                    'line_number': item.line_number,
                    'material_id': item.material_id,
                    'material_code': item.material.code if item.material else None,
                    'material_name': item.material.name if item.material else None,
                    'description': item.description,
                    'required_quantity': float(item.required_quantity),
                    'issued_quantity': float(item.issued_quantity or 0),
                    'returned_quantity': float(item.returned_quantity or 0),
                    'pending_quantity': float(item.pending_quantity),
                    'uom': item.uom,
                    'warehouse_location_id': item.warehouse_location_id,
                    'location_code': item.warehouse_location.location_code if item.warehouse_location else None,
                    'batch_number': item.batch_number,
                    'status': item.status,
                    'unit_cost': float(item.unit_cost) if item.unit_cost else None,
                    'total_cost': float(item.total_cost) if item.total_cost else None
                } for item in mi.items]
            }
        }), 200
        
    except Exception as e:
        return error_response(str(e)), 500

@material_issue_bp.route('/material-issues', methods=['POST'])
@jwt_required()
def create_material_issue():
    """Create material issue for a work order"""
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())
        
        work_order_id = data.get('work_order_id')
        if not work_order_id:
            return error_response('Work order ID is required'), 400
        
        wo = WorkOrder.query.get(work_order_id)
        if not wo:
            return error_response('Work order not found'), 404
        
        # Generate issue number
        issue_number = generate_number('MI', MaterialIssue, 'issue_number')
        
        # Create material issue
        mi = MaterialIssue(
            issue_number=issue_number,
            work_order_id=work_order_id,
            issue_date=get_local_now(),
            requested_by=user_id,
            status='pending',
            priority=data.get('priority', 'normal'),
            issue_type=data.get('issue_type', 'production'),
            department=data.get('department'),
            notes=data.get('notes'),
            special_instructions=data.get('special_instructions'),
            required_date=datetime.fromisoformat(data['required_date']) if data.get('required_date') else None
        )
        db.session.add(mi)
        db.session.flush()
        
        # Add items
        items_data = data.get('items', [])
        for idx, item_data in enumerate(items_data, 1):
            material = Material.query.get(item_data['material_id'])
            if not material:
                continue
            
            item = MaterialIssueItem(
                material_issue_id=mi.id,
                line_number=idx,
                material_id=item_data['material_id'],
                description=item_data.get('description', material.name),
                required_quantity=item_data['required_quantity'],
                uom=item_data.get('uom', material.primary_uom),
                warehouse_location_id=item_data.get('warehouse_location_id'),
                batch_number=item_data.get('batch_number'),
                unit_cost=material.unit_cost if hasattr(material, 'unit_cost') else None,
                status='pending'
            )
            
            # Calculate total cost
            if item.unit_cost:
                item.total_cost = float(item.unit_cost) * float(item.required_quantity)
            
            db.session.add(item)
        
        db.session.commit()
        
        return success_response('Material issue created', {
            'id': mi.id,
            'issue_number': mi.issue_number
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e)), 500

@material_issue_bp.route('/material-issues/from-work-order/<int:work_order_id>', methods=['POST'])
@jwt_required()
def create_material_issue_from_wo(work_order_id):
    """Auto-create material issue from work order BOM"""
    try:
        user_id = int(get_jwt_identity())
        
        wo = WorkOrder.query.get(work_order_id)
        if not wo:
            return error_response('Work order not found'), 404
        
        # Get BOM for the product
        bom = BillOfMaterials.query.filter_by(product_id=wo.product_id, is_active=True).first()
        if not bom:
            return error_response('No active BOM found for this product'), 404
        
        # Check if material issue already exists for this WO
        existing = MaterialIssue.query.filter_by(
            work_order_id=work_order_id,
            status='pending'
        ).first()
        
        if existing:
            return error_response('Material issue already exists for this work order'), 400
        
        # Generate issue number
        issue_number = generate_number('MI', MaterialIssue, 'issue_number')
        
        # Create material issue
        mi = MaterialIssue(
            issue_number=issue_number,
            work_order_id=work_order_id,
            issue_date=get_local_now(),
            requested_by=user_id,
            status='pending',
            priority='normal',
            issue_type='production',
            notes=f'Auto-generated from Work Order {wo.wo_number}'
        )
        db.session.add(mi)
        db.session.flush()
        
        # Add items from BOM
        for idx, bom_item in enumerate(bom.items, 1):
            # Calculate required quantity based on WO quantity
            required_qty = float(bom_item.quantity) * float(wo.quantity)
            
            # Find available inventory location
            inventory = Inventory.query.filter(
                Inventory.material_id == bom_item.material_id,
                Inventory.quantity_available > 0,
                Inventory.is_active == True
            ).order_by(Inventory.expiry_date.asc().nullslast()).first()
            
            item = MaterialIssueItem(
                material_issue_id=mi.id,
                line_number=idx,
                material_id=bom_item.material_id,
                description=bom_item.material.name if bom_item.material else '',
                required_quantity=required_qty,
                uom=bom_item.uom,
                warehouse_location_id=inventory.location_id if inventory else None,
                batch_number=inventory.batch_number if inventory else None,
                status='pending'
            )
            db.session.add(item)
        
        db.session.commit()
        
        return success_response('Material issue created from BOM', {
            'id': mi.id,
            'issue_number': mi.issue_number,
            'total_items': len(bom.items)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e)), 500

@material_issue_bp.route('/material-issues/<int:id>/approve', methods=['PUT'])
@jwt_required()
def approve_material_issue(id):
    """Approve material issue"""
    try:
        user_id = int(get_jwt_identity())
        
        mi = MaterialIssue.query.get(id)
        if not mi:
            return error_response('Material issue not found'), 404
        
        if mi.status != 'pending':
            return error_response(f'Cannot approve issue with status: {mi.status}'), 400
        
        mi.status = 'approved'
        mi.approved_by = user_id
        mi.approved_date = get_local_now()
        
        # Reserve materials in inventory
        for item in mi.items:
            if item.material_id and item.warehouse_location_id:
                inventory = Inventory.query.filter_by(
                    material_id=item.material_id,
                    location_id=item.warehouse_location_id
                ).first()
                
                if inventory:
                    # Check availability
                    if inventory.quantity_available < float(item.required_quantity):
                        return error_response(
                            f'Insufficient stock for {item.material.name if item.material else "material"}. '
                            f'Available: {inventory.quantity_available}, Required: {item.required_quantity}'
                        ), 400
                    
                    # Reserve the quantity
                    inventory.quantity_reserved += float(item.required_quantity)
                    inventory.quantity_available -= float(item.required_quantity)
        
        db.session.commit()
        
        return success_response('Material issue approved and materials reserved'), 200
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e)), 500

@material_issue_bp.route('/material-issues/<int:id>/issue', methods=['PUT'])
@jwt_required()
def issue_materials(id):
    """Issue materials - deduct from inventory"""
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json() or {}
        
        mi = MaterialIssue.query.get(id)
        if not mi:
            return error_response('Material issue not found'), 404
        
        if mi.status not in ['approved', 'partial']:
            return error_response(f'Cannot issue materials with status: {mi.status}'), 400
        
        items_to_issue = data.get('items', [])
        
        # If no specific items, issue all pending items
        if not items_to_issue:
            items_to_issue = [{'item_id': item.id, 'quantity': float(item.pending_quantity)} 
                            for item in mi.items if item.pending_quantity > 0]
        
        issued_count = 0
        
        for issue_data in items_to_issue:
            item = MaterialIssueItem.query.get(issue_data['item_id'])
            if not item or item.material_issue_id != id:
                continue
            
            issue_qty = float(issue_data.get('quantity', item.pending_quantity))
            
            if issue_qty <= 0 or issue_qty > float(item.pending_quantity):
                continue
            
            # Find inventory record
            inventory = Inventory.query.filter_by(
                material_id=item.material_id,
                location_id=item.warehouse_location_id
            ).first()
            
            if not inventory:
                # Try to find any available inventory for this material
                inventory = Inventory.query.filter(
                    Inventory.material_id == item.material_id,
                    Inventory.quantity_on_hand >= issue_qty,
                    Inventory.is_active == True
                ).first()
            
            if not inventory:
                continue
            
            # Deduct from inventory
            inventory.quantity_on_hand -= issue_qty
            
            # If was reserved, reduce reserved qty, otherwise reduce available
            if inventory.quantity_reserved >= issue_qty:
                inventory.quantity_reserved -= issue_qty
            else:
                inventory.quantity_available -= issue_qty
            
            inventory.updated_at = get_local_now()
            
            # Update item
            item.issued_quantity = float(item.issued_quantity or 0) + issue_qty
            item.warehouse_location_id = inventory.location_id
            item.batch_number = inventory.batch_number
            
            if item.is_fully_issued:
                item.status = 'issued'
            else:
                item.status = 'partial'
            
            # Create inventory movement
            movement = InventoryMovement(
                inventory_id=inventory.id,
                material_id=item.material_id,
                location_id=inventory.location_id,
                movement_type='stock_out',
                movement_date=get_local_now().date(),
                quantity=issue_qty,
                reference_number=mi.issue_number,
                reference_type='material_issue',
                reference_id=mi.id,
                batch_number=inventory.batch_number,
                notes=f'Issued for Work Order {mi.work_order.wo_number if mi.work_order else ""}',
                created_by=user_id
            )
            db.session.add(movement)
            
            issued_count += 1
        
        # Update material issue status
        all_issued = all(item.is_fully_issued for item in mi.items)
        any_issued = any(item.issued_quantity > 0 for item in mi.items)
        
        if all_issued:
            mi.status = 'issued'
            mi.issued_date = get_local_now()
        elif any_issued:
            mi.status = 'partial'
        
        mi.issued_by = user_id
        
        db.session.commit()
        
        return success_response('Materials issued successfully', {
            'issued_items': issued_count,
            'status': mi.status
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e)), 500

@material_issue_bp.route('/material-issues/<int:id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_material_issue(id):
    """Cancel material issue and release reserved materials"""
    try:
        mi = MaterialIssue.query.get(id)
        if not mi:
            return error_response('Material issue not found'), 404
        
        if mi.status == 'issued':
            return error_response('Cannot cancel fully issued material issue'), 400
        
        # Release reserved materials
        if mi.status == 'approved':
            for item in mi.items:
                if item.material_id and item.warehouse_location_id:
                    inventory = Inventory.query.filter_by(
                        material_id=item.material_id,
                        location_id=item.warehouse_location_id
                    ).first()
                    
                    if inventory:
                        # Release reserved quantity (only unreserved portion)
                        unreserved_qty = float(item.required_quantity) - float(item.issued_quantity or 0)
                        if unreserved_qty > 0:
                            inventory.quantity_reserved -= unreserved_qty
                            inventory.quantity_available += unreserved_qty
        
        mi.status = 'cancelled'
        
        db.session.commit()
        
        return success_response('Material issue cancelled'), 200
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e)), 500

# ============= WORK ORDER INTEGRATION =============

@material_issue_bp.route('/work-orders/<int:work_order_id>/material-requirements', methods=['GET'])
@jwt_required()
def get_wo_material_requirements(work_order_id):
    """Get material requirements for a work order based on BOM"""
    try:
        wo = WorkOrder.query.get(work_order_id)
        if not wo:
            return error_response('Work order not found'), 404
        
        # Get BOM
        bom = BillOfMaterials.query.filter_by(product_id=wo.product_id, is_active=True).first()
        if not bom:
            return jsonify({'requirements': [], 'message': 'No BOM found'}), 200
        
        requirements = []
        for bom_item in bom.items:
            required_qty = float(bom_item.quantity) * float(wo.quantity)
            
            # Get available stock
            available_stock = db.session.query(func.sum(Inventory.quantity_available)).filter(
                Inventory.material_id == bom_item.material_id,
                Inventory.is_active == True
            ).scalar() or 0
            
            # Get already issued quantity
            issued_qty = db.session.query(func.sum(MaterialIssueItem.issued_quantity)).join(
                MaterialIssue
            ).filter(
                MaterialIssue.work_order_id == work_order_id,
                MaterialIssueItem.material_id == bom_item.material_id,
                MaterialIssue.status.in_(['approved', 'partial', 'issued'])
            ).scalar() or 0
            
            remaining_to_issue = required_qty - float(issued_qty)
            
            requirements.append({
                'material_id': bom_item.material_id,
                'material_code': bom_item.material.code if bom_item.material else None,
                'material_name': bom_item.material.name if bom_item.material else None,
                'required_quantity': required_qty,
                'issued_quantity': float(issued_qty),
                'remaining_quantity': max(0, remaining_to_issue),
                'available_stock': float(available_stock),
                'uom': bom_item.uom,
                'is_sufficient': float(available_stock) >= remaining_to_issue
            })
        
        return jsonify({
            'work_order': {
                'id': wo.id,
                'wo_number': wo.wo_number,
                'product_name': wo.product.name if wo.product else None,
                'quantity': float(wo.quantity)
            },
            'requirements': requirements,
            'all_sufficient': all(r['is_sufficient'] for r in requirements)
        }), 200
        
    except Exception as e:
        return error_response(str(e)), 500

@material_issue_bp.route('/work-orders/<int:work_order_id>/reserve-materials', methods=['POST'])
@jwt_required()
def reserve_materials_for_wo(work_order_id):
    """Reserve materials for a work order (called when WO is created/confirmed)"""
    try:
        user_id = int(get_jwt_identity())
        
        wo = WorkOrder.query.get(work_order_id)
        if not wo:
            return error_response('Work order not found'), 404
        
        # Get BOM
        bom = BillOfMaterials.query.filter_by(product_id=wo.product_id, is_active=True).first()
        if not bom:
            return error_response('No active BOM found'), 404
        
        reserved_items = []
        insufficient_items = []
        
        for bom_item in bom.items:
            required_qty = float(bom_item.quantity) * float(wo.quantity)
            
            # Find inventory with available stock
            inventories = Inventory.query.filter(
                Inventory.material_id == bom_item.material_id,
                Inventory.quantity_available > 0,
                Inventory.is_active == True
            ).order_by(Inventory.expiry_date.asc().nullslast()).all()
            
            remaining_to_reserve = required_qty
            
            for inv in inventories:
                if remaining_to_reserve <= 0:
                    break
                
                reserve_qty = min(float(inv.quantity_available), remaining_to_reserve)
                inv.quantity_reserved += reserve_qty
                inv.quantity_available -= reserve_qty
                remaining_to_reserve -= reserve_qty
            
            if remaining_to_reserve > 0:
                insufficient_items.append({
                    'material_name': bom_item.material.name if bom_item.material else 'Unknown',
                    'required': required_qty,
                    'short': remaining_to_reserve
                })
            else:
                reserved_items.append({
                    'material_name': bom_item.material.name if bom_item.material else 'Unknown',
                    'quantity': required_qty
                })
        
        db.session.commit()
        
        return jsonify({
            'success': len(insufficient_items) == 0,
            'reserved_items': reserved_items,
            'insufficient_items': insufficient_items,
            'message': 'Materials reserved' if len(insufficient_items) == 0 else 'Some materials are insufficient'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e)), 500
