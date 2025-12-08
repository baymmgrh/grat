from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.workflow_integration import WorkflowStep, MRPRequirement, ProductionBuffer, WorkflowAutomation
from models.sales import SalesOrder, SalesOrderItem
from models.production import WorkOrder, ShiftProduction
from models.purchasing import PurchaseOrder
from models.warehouse import Inventory, InventoryMovement
from models.quality import QualityInspection
from models.shipping import ShippingOrder
from models.finance import Invoice
from models.returns import CustomerReturn
from utils.i18n import success_response, error_response, get_message
from utils import generate_number
from datetime import datetime, date
import json

workflow_bp = Blueprint('workflow', __name__)

# ===============================
# WORKFLOW TRIGGER ENDPOINTS
# ===============================

@workflow_bp.route('/trigger/sales-order/<int:sales_order_id>', methods=['POST'])
@jwt_required()
def trigger_sales_order_workflow(sales_order_id):
    """Trigger complete workflow from sales order confirmation"""
    try:
        # Trigger MRP analysis
        success = WorkflowAutomation.trigger_mrp_from_sales_order(sales_order_id)
        
        if success:
            return success_response(
                message="Sales order workflow triggered successfully",
                data={'sales_order_id': sales_order_id}
            )
        else:
            return error_response("Failed to trigger sales order workflow")
            
    except Exception as e:
        return error_response(f"Error triggering workflow: {str(e)}")

@workflow_bp.route('/trigger/production-completion/<int:shift_production_id>', methods=['POST'])
@jwt_required()
def trigger_production_completion_workflow(shift_production_id):
    """Trigger workflow when production is completed"""
    try:
        success = WorkflowAutomation.handle_production_completion(shift_production_id)
        
        if success:
            return success_response(
                message="Production completion workflow triggered successfully",
                data={'shift_production_id': shift_production_id}
            )
        else:
            return error_response("Failed to trigger production completion workflow")
            
    except Exception as e:
        return error_response(f"Error triggering workflow: {str(e)}")

# ===============================
# MRP REQUIREMENTS MANAGEMENT
# ===============================

@workflow_bp.route('/mrp-requirements', methods=['GET'])
@jwt_required()
def get_mrp_requirements():
    """Get all MRP requirements with filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        status = request.args.get('status', None)
        source_type = request.args.get('source_type', None)
        
        query = MRPRequirement.query
        
        if status:
            query = query.filter_by(status=status)
        if source_type:
            query = query.filter_by(source_type=source_type)
            
        requirements = query.order_by(MRPRequirement.created_at.desc()).paginate(
            page=page, per_page=per_page
        )
        
        return jsonify({
            'mrp_requirements': [{
                'id': req.id,
                'requirement_number': req.requirement_number,
                'source_type': req.source_type,
                'source_id': req.source_id,
                'product_id': req.product_id,
                'product_name': req.product.name if req.product else None,
                'required_quantity': float(req.required_quantity),
                'required_date': req.required_date.isoformat() if req.required_date else None,
                'current_stock': float(req.current_stock or 0),
                'shortage_quantity': float(req.shortage_quantity or 0),
                'needs_purchase': req.needs_purchase,
                'needs_production': req.needs_production,
                'status': req.status,
                'analyzed_at': req.analyzed_at.isoformat() if req.analyzed_at else None,
                'created_at': req.created_at.isoformat()
            } for req in requirements.items],
            'total': requirements.total,
            'pages': requirements.pages,
            'current_page': requirements.page
        }), 200
        
    except Exception as e:
        return error_response(f"Error fetching MRP requirements: {str(e)}")

@workflow_bp.route('/mrp-requirements/<int:requirement_id>/analyze', methods=['POST'])
@jwt_required()
def analyze_mrp_requirement(requirement_id):
    """Manually trigger analysis for specific MRP requirement"""
    try:
        requirement = MRPRequirement.query.get_or_404(requirement_id)
        
        # Get current inventory
        inventory = Inventory.query.filter_by(product_id=requirement.product_id).first()
        
        if inventory:
            requirement.current_stock = inventory.quantity
            requirement.reserved_stock = inventory.reserved_quantity
            requirement.available_stock = inventory.available_quantity
        
        # Calculate shortage
        shortage = requirement.required_quantity - (requirement.available_stock or 0)
        requirement.shortage_quantity = max(0, shortage)
        
        # Determine actions needed
        if requirement.shortage_quantity > 0:
            requirement.needs_production = True
            requirement.needs_purchase = False  # Will be determined by BOM analysis
        
        requirement.status = 'analyzed'
        requirement.analyzed_at = datetime.utcnow()
        requirement.analyzed_by = get_jwt_identity()
        
        db.session.commit()
        
        return success_response(
            message="MRP requirement analyzed successfully",
            data={
                'requirement_id': requirement_id,
                'shortage_quantity': float(requirement.shortage_quantity),
                'needs_production': requirement.needs_production,
                'needs_purchase': requirement.needs_purchase
            }
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(f"Error analyzing MRP requirement: {str(e)}")

# ===============================
# PRODUCTION BUFFER MANAGEMENT
# ===============================

@workflow_bp.route('/production-buffer', methods=['GET'])
@jwt_required()
def get_production_buffer():
    """Get all production buffer records"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        status = request.args.get('status', None)
        
        query = ProductionBuffer.query
        
        if status:
            query = query.filter_by(status=status)
            
        buffers = query.order_by(ProductionBuffer.created_at.desc()).paginate(
            page=page, per_page=per_page
        )
        
        return jsonify({
            'production_buffers': [{
                'id': buf.id,
                'buffer_number': buf.buffer_number,
                'work_order_id': buf.work_order_id,
                'work_order_number': buf.work_order.wo_number if buf.work_order else None,
                'product_id': buf.product_id,
                'product_name': buf.product.name if buf.product else None,
                'target_quantity': float(buf.target_quantity),
                'actual_quantity': float(buf.actual_quantity),
                'excess_quantity': float(buf.excess_quantity),
                'status': buf.status,
                'moved_to_warehouse_at': buf.moved_to_warehouse_at.isoformat() if buf.moved_to_warehouse_at else None,
                'created_at': buf.created_at.isoformat()
            } for buf in buffers.items],
            'total': buffers.total,
            'pages': buffers.pages,
            'current_page': buffers.page
        }), 200
        
    except Exception as e:
        return error_response(f"Error fetching production buffer: {str(e)}")

@workflow_bp.route('/production-buffer/<int:buffer_id>/move-to-warehouse', methods=['POST'])
@jwt_required()
def move_buffer_to_warehouse(buffer_id):
    """Move buffer stock to warehouse"""
    try:
        buffer = ProductionBuffer.query.get_or_404(buffer_id)
        data = request.get_json()
        
        warehouse_location_id = data.get('warehouse_location_id')
        
        # Create inventory movement
        movement = InventoryMovement(
            product_id=buffer.product_id,
            to_location_id=warehouse_location_id,
            movement_type='buffer_stock',
            quantity_in=buffer.excess_quantity,
            reference_type='production_buffer',
            reference_id=buffer.id,
            movement_date=datetime.utcnow(),
            performed_by=get_jwt_identity(),
            notes=f"Buffer stock from {buffer.buffer_number}"
        )
        db.session.add(movement)
        
        # Update buffer status
        buffer.status = 'moved_to_warehouse'
        buffer.moved_to_warehouse_at = datetime.utcnow()
        buffer.warehouse_location_id = warehouse_location_id
        
        db.session.commit()
        
        return success_response(
            message="Buffer stock moved to warehouse successfully",
            data={'buffer_id': buffer_id, 'movement_id': movement.id}
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(f"Error moving buffer to warehouse: {str(e)}")

# ===============================
# WORKFLOW STEPS TRACKING
# ===============================

@workflow_bp.route('/workflow-steps', methods=['GET'])
@jwt_required()
def get_workflow_steps():
    """Get workflow steps for tracking progress"""
    try:
        workflow_type = request.args.get('workflow_type', None)
        reference_type = request.args.get('reference_type', None)
        reference_id = request.args.get('reference_id', None, type=int)
        
        query = WorkflowStep.query
        
        if workflow_type:
            query = query.filter_by(workflow_type=workflow_type)
        if reference_type:
            query = query.filter_by(reference_type=reference_type)
        if reference_id:
            query = query.filter_by(reference_id=reference_id)
            
        steps = query.order_by(WorkflowStep.step_order.asc()).all()
        
        return jsonify({
            'workflow_steps': [{
                'id': step.id,
                'workflow_type': step.workflow_type,
                'reference_type': step.reference_type,
                'reference_id': step.reference_id,
                'step_name': step.step_name,
                'step_order': step.step_order,
                'status': step.status,
                'started_at': step.started_at.isoformat() if step.started_at else None,
                'completed_at': step.completed_at.isoformat() if step.completed_at else None,
                'notes': step.notes,
                'created_at': step.created_at.isoformat()
            } for step in steps]
        }), 200
        
    except Exception as e:
        return error_response(f"Error fetching workflow steps: {str(e)}")

# ===============================
# RETURNS WORKFLOW
# ===============================

@workflow_bp.route('/trigger/customer-return/<int:return_id>', methods=['POST'])
@jwt_required()
def trigger_return_workflow(return_id):
    """Trigger workflow for customer return processing"""
    try:
        customer_return = CustomerReturn.query.get_or_404(return_id)
        
        # Create workflow steps for return processing
        steps = [
            ('Warehouse Receipt', 1, 'pending'),
            ('Quality Inspection', 2, 'pending'),
            ('Disposition Decision', 3, 'pending'),
            ('Rework/Disposal', 4, 'pending')
        ]
        
        for step_name, order, status in steps:
            workflow_step = WorkflowStep(
                workflow_type='return_processing',
                reference_type='customer_return',
                reference_id=return_id,
                step_name=step_name,
                step_order=order,
                status=status
            )
            db.session.add(workflow_step)
        
        # Update return status
        customer_return.status = 'workflow_initiated'
        
        db.session.commit()
        
        return success_response(
            message="Customer return workflow initiated successfully",
            data={'return_id': return_id}
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(f"Error initiating return workflow: {str(e)}")

# ===============================
# WORKFLOW DASHBOARD
# ===============================

@workflow_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_workflow_dashboard():
    """Get workflow dashboard data"""
    try:
        # Get workflow statistics
        total_workflows = WorkflowStep.query.count()
        pending_steps = WorkflowStep.query.filter_by(status='pending').count()
        in_progress_steps = WorkflowStep.query.filter_by(status='in_progress').count()
        completed_steps = WorkflowStep.query.filter_by(status='completed').count()
        
        # Get MRP requirements statistics
        total_mrp_requirements = MRPRequirement.query.count()
        pending_mrp = MRPRequirement.query.filter_by(status='pending').count()
        analyzed_mrp = MRPRequirement.query.filter_by(status='analyzed').count()
        
        # Get production buffer statistics
        total_buffers = ProductionBuffer.query.count()
        pending_buffers = ProductionBuffer.query.filter_by(status='pending').count()
        moved_buffers = ProductionBuffer.query.filter_by(status='moved_to_warehouse').count()
        
        # Get recent workflow activities
        recent_steps = WorkflowStep.query.order_by(
            WorkflowStep.created_at.desc()
        ).limit(10).all()
        
        return jsonify({
            'workflow_stats': {
                'total_workflows': total_workflows,
                'pending_steps': pending_steps,
                'in_progress_steps': in_progress_steps,
                'completed_steps': completed_steps
            },
            'mrp_stats': {
                'total_requirements': total_mrp_requirements,
                'pending_analysis': pending_mrp,
                'analyzed': analyzed_mrp
            },
            'buffer_stats': {
                'total_buffers': total_buffers,
                'pending_movement': pending_buffers,
                'moved_to_warehouse': moved_buffers
            },
            'recent_activities': [{
                'id': step.id,
                'workflow_type': step.workflow_type,
                'step_name': step.step_name,
                'status': step.status,
                'created_at': step.created_at.isoformat()
            } for step in recent_steps]
        }), 200
        
    except Exception as e:
        return error_response(f"Error fetching workflow dashboard: {str(e)}")

# ===============================
# MANUAL WORKFLOW CONTROLS
# ===============================

@workflow_bp.route('/manual/create-work-order-from-sales', methods=['POST'])
@jwt_required()
def manual_create_work_order_from_sales():
    """Manually create work order from sales order"""
    try:
        data = request.get_json()
        sales_order_id = data.get('sales_order_id')
        product_id = data.get('product_id')
        quantity = data.get('quantity')
        
        sales_order = SalesOrder.query.get_or_404(sales_order_id)
        
        # Create work order
        work_order = WorkOrder(
            wo_number=generate_number('WO', WorkOrder, 'wo_number'),
            product_id=product_id,
            quantity_to_produce=quantity,
            sales_order_id=sales_order_id,
            required_date=sales_order.delivery_date,
            status='planned',
            priority='normal',
            workflow_status='manual_created'
        )
        db.session.add(work_order)
        db.session.commit()
        
        return success_response(
            message="Work order created successfully",
            data={
                'work_order_id': work_order.id,
                'wo_number': work_order.wo_number
            }
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(f"Error creating work order: {str(e)}")

@workflow_bp.route('/manual/trigger-quality-inspection', methods=['POST'])
@jwt_required()
def manual_trigger_quality_inspection():
    """Manually trigger quality inspection for production"""
    try:
        data = request.get_json()
        shift_production_id = data.get('shift_production_id')
        
        shift_production = ShiftProduction.query.get_or_404(shift_production_id)
        
        # Create quality inspection
        inspection = QualityInspection(
            inspection_number=generate_number('QI', QualityInspection, 'inspection_number'),
            product_id=shift_production.product_id,
            batch_number=f"BATCH-{shift_production.id}",
            quantity_inspected=shift_production.actual_quantity,
            inspection_type='production',
            reference_type='shift_production',
            reference_id=shift_production_id,
            status='pending',
            inspection_date=datetime.utcnow().date()
        )
        db.session.add(inspection)
        db.session.commit()
        
        return success_response(
            message="Quality inspection created successfully",
            data={
                'inspection_id': inspection.id,
                'inspection_number': inspection.inspection_number
            }
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(f"Error creating quality inspection: {str(e)}")
