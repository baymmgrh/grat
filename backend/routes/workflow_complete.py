from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.sales import SalesOrder, SalesOrderItem
from models.production import WorkOrder, ShiftProduction
from models.quality import QualityInspection
from models.shipping import ShippingOrder, ShippingItem
from models.finance import Invoice, InvoiceItem
from models.workflow_integration import WorkflowAutomation, WorkflowStep
from utils.i18n import success_response, error_response
from utils import generate_number
from datetime import datetime, timedelta

workflow_complete_bp = Blueprint('workflow_complete', __name__)

@workflow_complete_bp.route('/sales-order/<int:sales_order_id>/confirm', methods=['POST'])
@jwt_required()
def confirm_sales_order(sales_order_id):
    """Confirm sales order first"""
    try:
        user_id = get_jwt_identity()
        sales_order = SalesOrder.query.get_or_404(sales_order_id)
        
        # Confirm the sales order
        sales_order.status = 'confirmed'
        sales_order.approved_by = user_id
        sales_order.approved_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Sales order confirmed successfully',
            'sales_order_id': sales_order_id,
            'status': sales_order.status
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@workflow_complete_bp.route('/sales-order/<int:sales_order_id>/trigger-complete', methods=['POST'])
@jwt_required()
def trigger_complete_workflow(sales_order_id):
    """Trigger complete workflow from sales order to finance"""
    try:
        user_id = get_jwt_identity()
        sales_order = SalesOrder.query.get_or_404(sales_order_id)
        
        # Simple workflow - just update status for now
        sales_order.status = 'in_production'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Workflow triggered successfully - Sales order moved to production',
            'sales_order_id': sales_order_id,
            'status': sales_order.status,
            'next_step': 'Production execution required'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@workflow_complete_bp.route('/production/<int:work_order_id>/complete', methods=['POST'])
@jwt_required()
def complete_production(work_order_id):
    """Complete production and trigger quality control"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        work_order = WorkOrder.query.get_or_404(work_order_id)
        
        # Update work order status
        work_order.status = 'completed'
        work_order.actual_quantity = data.get('actual_quantity', work_order.quantity_to_produce)
        work_order.completed_date = datetime.utcnow()
        work_order.completed_by = user_id
        
        # Create Quality Inspection
        quality_inspection = QualityInspection(
            inspection_number=generate_number('QI', QualityInspection, 'inspection_number'),
            work_order_id=work_order_id,
            product_id=work_order.product_id,
            quantity_inspected=work_order.actual_quantity,
            inspection_date=datetime.utcnow(),
            inspector_id=user_id,
            status='pending'
        )
        db.session.add(quality_inspection)
        
        # Create workflow step
        workflow_step = WorkflowStep(
            workflow_type='order_to_cash',
            reference_type='work_order',
            reference_id=work_order_id,
            step_name='Quality Control',
            step_order=3,
            status='pending'
        )
        db.session.add(workflow_step)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Production completed, quality inspection created',
            'work_order_id': work_order_id,
            'quality_inspection_id': quality_inspection.id,
            'next_step': 'Quality inspection required'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@workflow_complete_bp.route('/quality/<int:inspection_id>/approve', methods=['POST'])
@jwt_required()
def approve_quality(inspection_id):
    """Approve quality inspection and trigger shipping"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        inspection = QualityInspection.query.get_or_404(inspection_id)
        
        # Update quality inspection
        inspection.status = 'passed' if data.get('approved', True) else 'failed'
        inspection.inspector_notes = data.get('notes', '')
        inspection.inspection_date = datetime.utcnow()
        inspection.inspector_id = user_id
        
        if inspection.status == 'passed':
            # Update work order
            work_order = inspection.work_order
            work_order.status = 'quality_approved'
            
            # Check if all work orders for sales order are completed
            sales_order = work_order.sales_order
            all_work_orders = WorkOrder.query.filter_by(sales_order_id=sales_order.id).all()
            all_approved = all(wo.status == 'quality_approved' for wo in all_work_orders)
            
            if all_approved:
                # Update sales order status
                sales_order.status = 'ready'
                
                # Create shipping order automatically
                shipping_order = ShippingOrder(
                    shipping_number=generate_number('SHP', ShippingOrder, 'shipping_number'),
                    sales_order_id=sales_order.id,
                    customer_id=sales_order.customer_id,
                    shipping_date=datetime.utcnow() + timedelta(days=1),
                    expected_delivery_date=sales_order.delivery_date,
                    status='preparing',
                    prepared_by=user_id,
                    shipping_address=sales_order.delivery_address
                )
                db.session.add(shipping_order)
                db.session.flush()
                
                # Add shipping items
                for item in sales_order.items:
                    shipping_item = ShippingItem(
                        shipping_order_id=shipping_order.id,
                        product_id=item.product_id,
                        quantity=item.quantity,
                        uom=item.uom
                    )
                    db.session.add(shipping_item)
                
                # Create workflow step
                workflow_step = WorkflowStep(
                    workflow_type='order_to_cash',
                    reference_type='sales_order',
                    reference_id=sales_order.id,
                    step_name='Shipping Preparation',
                    step_order=4,
                    status='pending'
                )
                db.session.add(workflow_step)
                
                db.session.commit()
                
                return jsonify({
                    'message': 'Quality approved, shipping order created',
                    'inspection_id': inspection_id,
                    'shipping_order_id': shipping_order.id,
                    'next_step': 'Shipping execution required'
                }), 200
            else:
                db.session.commit()
                return jsonify({
                    'message': 'Quality approved, waiting for other work orders',
                    'inspection_id': inspection_id,
                    'next_step': 'Complete remaining production'
                }), 200
        else:
            # Quality failed - need rework
            work_order = inspection.work_order
            work_order.status = 'rework_required'
            
            db.session.commit()
            
            return jsonify({
                'message': 'Quality inspection failed, rework required',
                'inspection_id': inspection_id,
                'next_step': 'Rework production required'
            }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@workflow_complete_bp.route('/shipping/<int:shipping_id>/ship', methods=['POST'])
@jwt_required()
def ship_order(shipping_id):
    """Ship order and trigger finance invoice"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        shipping_order = ShippingOrder.query.get_or_404(shipping_id)
        
        # Update shipping status
        shipping_order.status = 'shipped'
        shipping_order.actual_shipping_date = datetime.utcnow()
        shipping_order.tracking_number = data.get('tracking_number')
        shipping_order.carrier = data.get('carrier')
        
        # Update sales order status
        sales_order = shipping_order.sales_order
        sales_order.status = 'shipped'
        
        # Create Invoice automatically
        invoice = Invoice(
            invoice_number=generate_number('INV', Invoice, 'invoice_number'),
            sales_order_id=sales_order.id,
            customer_id=sales_order.customer_id,
            invoice_date=datetime.utcnow(),
            due_date=datetime.utcnow() + timedelta(days=30),
            subtotal=sales_order.subtotal,
            tax_amount=sales_order.tax_amount,
            total_amount=sales_order.total_amount,
            status='sent',
            created_by=user_id
        )
        db.session.add(invoice)
        db.session.flush()
        
        # Add invoice items
        for item in sales_order.items:
            invoice_item = InvoiceItem(
                invoice_id=invoice.id,
                product_id=item.product_id,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_price=item.total_price
            )
            db.session.add(invoice_item)
        
        # Create final workflow step
        workflow_step = WorkflowStep(
            workflow_type='order_to_cash',
            reference_type='sales_order',
            reference_id=sales_order.id,
            step_name='Invoice Generated',
            step_order=5,
            status='completed',
            completed_by=user_id,
            completed_at=datetime.utcnow()
        )
        db.session.add(workflow_step)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Order shipped, invoice generated',
            'shipping_id': shipping_id,
            'invoice_id': invoice.id,
            'tracking_number': shipping_order.tracking_number,
            'workflow_status': 'completed'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@workflow_complete_bp.route('/status/<int:sales_order_id>', methods=['GET'])
@jwt_required()
def get_workflow_status(sales_order_id):
    """Get complete workflow status for sales order"""
    try:
        sales_order = SalesOrder.query.get_or_404(sales_order_id)
        
        # Get all workflow steps
        workflow_steps = WorkflowStep.query.filter_by(
            reference_type='sales_order',
            reference_id=sales_order_id
        ).order_by(WorkflowStep.step_order).all()
        
        # Get work orders
        work_orders = WorkOrder.query.filter_by(sales_order_id=sales_order_id).all()
        
        # Get quality inspections
        quality_inspections = []
        for wo in work_orders:
            inspections = QualityInspection.query.filter_by(work_order_id=wo.id).all()
            quality_inspections.extend(inspections)
        
        # Get shipping orders
        shipping_orders = ShippingOrder.query.filter_by(sales_order_id=sales_order_id).all()
        
        # Get invoices
        invoices = Invoice.query.filter_by(sales_order_id=sales_order_id).all()
        
        return jsonify({
            'sales_order': {
                'id': sales_order.id,
                'order_number': sales_order.order_number,
                'status': sales_order.status,
                'customer_name': sales_order.customer.company_name if sales_order.customer else 'Unknown'
            },
            'workflow_steps': [{
                'step_name': step.step_name,
                'step_order': step.step_order,
                'status': step.status,
                'completed_at': step.completed_at.isoformat() if step.completed_at else None
            } for step in workflow_steps],
            'work_orders': [{
                'id': wo.id,
                'wo_number': wo.wo_number,
                'status': wo.status,
                'product_name': wo.product.name if wo.product else 'Unknown',
                'quantity_to_produce': float(wo.quantity_to_produce),
                'actual_quantity': float(wo.actual_quantity) if wo.actual_quantity else None
            } for wo in work_orders],
            'quality_inspections': [{
                'id': qi.id,
                'inspection_number': qi.inspection_number,
                'status': qi.status,
                'inspection_date': qi.inspection_date.isoformat() if qi.inspection_date else None
            } for qi in quality_inspections],
            'shipping_orders': [{
                'id': so.id,
                'shipping_number': so.shipping_number,
                'status': so.status,
                'tracking_number': so.tracking_number,
                'shipping_date': so.shipping_date.isoformat() if so.shipping_date else None
            } for so in shipping_orders],
            'invoices': [{
                'id': inv.id,
                'invoice_number': inv.invoice_number,
                'status': inv.status,
                'total_amount': float(inv.total_amount),
                'invoice_date': inv.invoice_date.isoformat() if inv.invoice_date else None
            } for inv in invoices]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
