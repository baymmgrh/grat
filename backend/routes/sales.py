from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Customer, SalesOrder, SalesOrderItem, SalesForecast, Product, Notification
from utils.i18n import success_response, error_response, get_message
from models.sales import (
    Lead, Opportunity, SalesPipeline, PipelineStage, CustomerContact,
    Quotation, QuotationItem, SalesActivity, SalesTask, SalesMetrics
)
from models.user import User
from utils import generate_number
from utils.business_rules import BusinessRules, ValidationError, SALES_ORDER_TRANSITIONS
from datetime import datetime, date
from sqlalchemy import or_, func, and_
from sqlalchemy.orm import joinedload, selectinload
import json
from utils.timezone import get_local_now, get_local_today

sales_bp = Blueprint('sales', __name__)

# Customers
@sales_bp.route('/customers', methods=['GET'])
@jwt_required()
def get_customers():
    """Get all customers"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        search = request.args.get('search', '')
        is_active = request.args.get('is_active')
        customer_type = request.args.get('customer_type')
        
        query = Customer.query
        
        if search:
            query = query.filter(
                or_(
                    Customer.code.ilike(f'%{search}%'),
                    Customer.company_name.ilike(f'%{search}%')
                )
            )
        
        if is_active is not None:
            if is_active.lower() == 'true':
                query = query.filter_by(is_active=True)
            elif is_active.lower() == 'false':
                query = query.filter_by(is_active=False)
        else:
            # Default to active customers only
            query = query.filter_by(is_active=True)
            
        if customer_type:
            query = query.filter_by(customer_type=customer_type)
        
        customers = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'customers': [{
                'id': c.id,
                'code': c.code,
                'company_name': c.company_name,
                'contact_person': getattr(c, 'contact_person', ''),
                'email': getattr(c, 'email', ''),
                'phone': getattr(c, 'phone', ''),
                'city': getattr(c, 'billing_city', None) or getattr(c, 'city', ''),
                'state': getattr(c, 'billing_state', None) or getattr(c, 'state', ''),
                'country': getattr(c, 'billing_country', None) or getattr(c, 'country', ''),
                'postal_code': getattr(c, 'billing_postal_code', None) or getattr(c, 'postal_code', ''),
                'address': getattr(c, 'billing_address', None) or getattr(c, 'address', ''),
                'customer_type': getattr(c, 'customer_type', 'retail'),
                'credit_limit': float(c.credit_limit) if c.credit_limit else 0,
                'payment_terms': f"Net {getattr(c, 'payment_terms_days', 30)}",
                'tax_number': getattr(c, 'tax_id', ''),
                'website': getattr(c, 'website', ''),
                'industry': getattr(c, 'industry', ''),
                'is_active': getattr(c, 'is_active', True)
            } for c in customers.items],
            'total': customers.total,
            'pages': customers.pages
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/customers', methods=['POST'])
@jwt_required()
def create_customer():
    """Create customer"""
    try:
        data = request.get_json()
        
        # Extract payment terms days from payment_terms string
        payment_terms = data.get('payment_terms', 'Net 30')
        if 'Net' in payment_terms:
            payment_terms_days = int(payment_terms.replace('Net ', ''))
        elif payment_terms == 'COD':
            payment_terms_days = 0
        else:
            payment_terms_days = 30
            
        customer = Customer(
            code=data['code'],
            company_name=data['company_name'],
            contact_person=data.get('contact_person'),
            email=data.get('email'),
            phone=data.get('phone'),
            mobile=data.get('mobile'),
            billing_address=data.get('address'),
            billing_city=data.get('city'),
            billing_state=data.get('state'),
            billing_country=data.get('country'),
            billing_postal_code=data.get('postal_code'),
            shipping_address=data.get('address'),  # Default same as billing
            shipping_city=data.get('city'),
            shipping_state=data.get('state'),
            shipping_country=data.get('country'),
            shipping_postal_code=data.get('postal_code'),
            tax_id=data.get('tax_number'),
            website=data.get('website'),
            industry=data.get('industry'),
            credit_limit=data.get('credit_limit', 0),
            payment_terms_days=payment_terms_days,
            customer_type=data.get('customer_type', 'retail'),
            is_active=data.get('is_active', True),
            created_by=get_jwt_identity()
        )
        
        db.session.add(customer)
        db.session.commit()
        
        return jsonify({'message': 'Customer created', 'customer_id': customer.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/customers/<int:id>', methods=['GET'])
@jwt_required()
def get_customer(id):
    """Get customer details"""
    try:
        customer = Customer.query.get(id)
        if not customer:
            return jsonify(error_response('api.error', error_code=404)), 404
        
        return jsonify({
            'id': customer.id,
            'code': customer.code,
            'company_name': customer.company_name,
            'contact_person': getattr(customer, 'contact_person', ''),
            'job_title': getattr(customer, 'job_title', ''),
            'email': getattr(customer, 'email', ''),
            'phone': getattr(customer, 'phone', ''),
            'mobile': getattr(customer, 'mobile', ''),
            'fax': getattr(customer, 'fax', ''),
            'website': getattr(customer, 'website', ''),
            'tax_id': getattr(customer, 'tax_id', ''),
            
            # Billing address (mapped to simple address for frontend compatibility)
            'address': getattr(customer, 'billing_address', ''),
            'city': getattr(customer, 'billing_city', ''),
            'state': getattr(customer, 'billing_state', ''),
            'country': getattr(customer, 'billing_country', ''),
            'postal_code': getattr(customer, 'billing_postal_code', ''),
            
            # Full billing address fields
            'billing_address': getattr(customer, 'billing_address', ''),
            'billing_city': getattr(customer, 'billing_city', ''),
            'billing_state': getattr(customer, 'billing_state', ''),
            'billing_country': getattr(customer, 'billing_country', ''),
            'billing_postal_code': getattr(customer, 'billing_postal_code', ''),
            
            # Shipping address fields
            'shipping_address': getattr(customer, 'shipping_address', ''),
            'shipping_city': getattr(customer, 'shipping_city', ''),
            'shipping_state': getattr(customer, 'shipping_state', ''),
            'shipping_country': getattr(customer, 'shipping_country', ''),
            'shipping_postal_code': getattr(customer, 'shipping_postal_code', ''),
            
            # Business information
            'credit_limit': float(customer.credit_limit) if customer.credit_limit else 0,
            'payment_terms_days': getattr(customer, 'payment_terms_days', 30),
            'customer_type': getattr(customer, 'customer_type', 'retail'),
            'industry': getattr(customer, 'industry', ''),
            'notes': getattr(customer, 'notes', ''),
            'is_active': getattr(customer, 'is_active', True),
            'created_at': customer.created_at.isoformat() if hasattr(customer, 'created_at') and customer.created_at else None,
            'updated_at': customer.updated_at.isoformat() if hasattr(customer, 'updated_at') and customer.updated_at else None
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/customers/<int:id>', methods=['PUT', 'OPTIONS'])
def update_customer(id):
    """Update customer"""
    if request.method == 'OPTIONS':
        return '', 200
    
    print(f"PUT request received for customer ID: {id}")
    
    # Apply JWT protection only for non-OPTIONS requests
    from flask_jwt_extended import verify_jwt_in_request
    verify_jwt_in_request()
    
    try:
        customer = Customer.query.get(id)
        if not customer:
            return jsonify(error_response('api.error', error_code=404)), 404
        
        data = request.get_json()
        
        # Update customer fields
        if 'company_name' in data:
            customer.company_name = data['company_name']
        if 'contact_person' in data:
            customer.contact_person = data['contact_person']
        if 'job_title' in data:
            customer.job_title = data['job_title']
        if 'email' in data:
            customer.email = data['email']
        if 'phone' in data:
            customer.phone = data['phone']
        if 'mobile' in data:
            customer.mobile = data['mobile']
        if 'fax' in data:
            customer.fax = data['fax']
        if 'website' in data:
            customer.website = data['website']
        if 'tax_id' in data:
            customer.tax_id = data['tax_id']
        
        # Address fields - map frontend fields to backend model
        if 'address' in data:
            customer.billing_address = data['address']
        if 'billing_address' in data:
            customer.billing_address = data['billing_address']
        if 'city' in data:
            customer.billing_city = data['city']
        if 'billing_city' in data:
            customer.billing_city = data['billing_city']
        if 'state' in data:
            customer.billing_state = data['state']
        if 'billing_state' in data:
            customer.billing_state = data['billing_state']
        if 'country' in data:
            customer.billing_country = data['country']
        if 'billing_country' in data:
            customer.billing_country = data['billing_country']
        if 'postal_code' in data:
            customer.billing_postal_code = data['postal_code']
        if 'billing_postal_code' in data:
            customer.billing_postal_code = data['billing_postal_code']
            
        # Shipping address
        if 'shipping_address' in data:
            customer.shipping_address = data['shipping_address']
        if 'shipping_city' in data:
            customer.shipping_city = data['shipping_city']
        if 'shipping_state' in data:
            customer.shipping_state = data['shipping_state']
        if 'shipping_country' in data:
            customer.shipping_country = data['shipping_country']
        if 'shipping_postal_code' in data:
            customer.shipping_postal_code = data['shipping_postal_code']
            
        # Business fields
        if 'credit_limit' in data:
            customer.credit_limit = float(data['credit_limit'])
        if 'payment_terms_days' in data:
            customer.payment_terms_days = int(data['payment_terms_days'])
        if 'customer_type' in data:
            customer.customer_type = data['customer_type']
        if 'industry' in data:
            customer.industry = data['industry']
        if 'notes' in data:
            customer.notes = data['notes']
        if 'is_active' in data:
            customer.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Customer updated successfully',
            'customer_id': customer.id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/customers/<int:id>', methods=['DELETE', 'OPTIONS'])
def delete_customer(id):
    """Delete customer"""
    if request.method == 'OPTIONS':
        return '', 200
    
    # Apply JWT protection only for non-OPTIONS requests
    from flask_jwt_extended import verify_jwt_in_request
    verify_jwt_in_request()
    
    try:
        customer = Customer.query.get(id)
        if not customer:
            return jsonify(error_response('api.error', error_code=404)), 404
        
        # Check if customer has orders
        # For now, just soft delete by setting is_active to False
        customer.is_active = False
        db.session.commit()
        
        return jsonify({
            'message': 'Customer deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Sales Orders
@sales_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_orders():
    """Get all sales orders"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        status = request.args.get('status')
        customer_id = request.args.get('customer_id', type=int)
        
        # Check if SalesOrder table exists and has data
        try:
            count = SalesOrder.query.count()
            print(f"Total sales orders in database: {count}")
        except Exception as count_error:
            print(f"Error counting sales orders: {count_error}")
            return jsonify({
                'orders': [],
                'total': 0,
                'pages': 0,
                'message': 'Sales orders table not accessible'
            }), 200
        
        # Optimize query with eager loading to avoid N+1 problem
        query = SalesOrder.query.options(
            joinedload(SalesOrder.customer),
            selectinload(SalesOrder.items)
        )
        
        if status:
            query = query.filter_by(status=status)
        if customer_id:
            query = query.filter_by(customer_id=customer_id)
        
        # Use limit/offset instead of paginate to avoid potential issues
        try:
            total = query.count()
            offset = (page - 1) * per_page
            orders = query.order_by(SalesOrder.order_date.desc()).offset(offset).limit(per_page).all()
            
            orders_data = []
            for o in orders:
                try:
                    order_data = {
                        'id': o.id,
                        'order_number': o.order_number or f'SO-{o.id}',
                        'customer_name': 'Unknown Customer',
                        'order_date': None,
                        'required_date': None,
                        'status': o.status or 'pending',
                        'priority': o.priority or 'normal',
                        'total_amount': float(o.total_amount) if o.total_amount else 0.0,
                        'item_count': 0
                    }
                    
                    # Safely get customer name
                    try:
                        if o.customer:
                            order_data['customer_name'] = o.customer.company_name or 'Unknown Customer'
                    except Exception as customer_error:
                        print(f"Error getting customer for order {o.id}: {customer_error}")
                    
                    # Safely get dates
                    try:
                        if o.order_date:
                            order_data['order_date'] = o.order_date.isoformat()
                        if o.required_date:
                            order_data['required_date'] = o.required_date.isoformat()
                    except Exception as date_error:
                        print(f"Error getting dates for order {o.id}: {date_error}")
                    
                    # Safely get item count
                    try:
                        if hasattr(o, 'items') and o.items:
                            order_data['item_count'] = len(o.items)
                    except Exception as items_error:
                        print(f"Error getting items for order {o.id}: {items_error}")
                    
                    orders_data.append(order_data)
                    
                except Exception as order_error:
                    print(f"Error processing order {o.id}: {order_error}")
                    continue
            
            pages = (total + per_page - 1) // per_page
            
            return jsonify({
                'orders': orders_data,
                'total': total,
                'pages': pages
            }), 200
            
        except Exception as query_error:
            print(f"Error executing query: {query_error}")
            return jsonify({
                'orders': [],
                'total': 0,
                'pages': 0,
                'message': 'Error executing sales orders query'
            }), 200
            
    except Exception as e:
        print(f"Error in get_orders: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/orders', methods=['POST'])
@jwt_required()
def create_order():
    """Create sales order"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # BUSINESS RULE: Validate customer credit limit
        customer_id = data.get('customer_id')
        if customer_id:
            try:
                # Calculate order total first
                order_total = 0
                for item_data in data.get('items', []):
                    order_total += item_data['quantity'] * item_data['unit_price']
                
                credit_check = BusinessRules.validate_credit_limit(customer_id, order_total)
                if not credit_check['approved']:
                    return jsonify({
                        'error': 'Credit limit exceeded',
                        'details': credit_check
                    }), 400
                
                # Validate payment terms
                payment_check = BusinessRules.validate_payment_terms(customer_id)
                if not payment_check['valid']:
                    return jsonify({
                        'error': 'Invalid payment terms',
                        'details': payment_check
                    }), 400
            except ValidationError as ve:
                print(f"Validation warning: {ve}")
        
        order_number = generate_number('SO', SalesOrder, 'order_number')
        
        order = SalesOrder(
            order_number=order_number,
            customer_id=data['customer_id'],
            order_date=datetime.fromisoformat(data['order_date']),
            required_date=datetime.fromisoformat(data['required_date']) if data.get('required_date') else None,
            status='draft',
            priority=data.get('priority', 'normal'),
            customer_po_number=data.get('customer_po_number'),
            payment_terms=data.get('payment_terms'),
            delivery_address=data.get('delivery_address'),
            notes=data.get('notes'),
            created_by=user_id
        )
        
        db.session.add(order)
        db.session.flush()
        
        # Add items
        subtotal = 0
        for idx, item_data in enumerate(data.get('items', []), 1):
            item_total = item_data['quantity'] * item_data['unit_price']
            
            item = SalesOrderItem(
                order_id=order.id,
                line_number=idx,
                product_id=item_data['product_id'],
                description=item_data.get('description'),
                quantity=item_data['quantity'],
                uom=item_data.get('uom', 'PCS'),  # Default to PCS if not provided
                unit_price=item_data['unit_price'],
                discount_percent=item_data.get('discount_percent', 0),
                tax_percent=item_data.get('tax_percent', 0),
                total_price=item_total
            )
            db.session.add(item)
            subtotal += item_total
        
        order.subtotal = subtotal
        order.total_amount = subtotal
        
        db.session.commit()
        
        # Create approval workflow for the sales order
        try:
            from models.approval_workflow import ApprovalWorkflow, PendingJournalEntry
            
            # Create workflow
            workflow = ApprovalWorkflow(
                transaction_type='sales_order',
                transaction_id=order.id,
                transaction_number=order_number,
                status='draft',
                submitted_by=user_id
            )
            db.session.add(workflow)
            db.session.flush()
            
            # Create pending journal entry (AR/Sales)
            # Create journal entry lines using account config
            from utils.account_config import create_journal_entry_lines
            journal_lines = create_journal_entry_lines(
                transaction_type='sales',
                amount=float(order.total_amount),
                description=f'Sales - {order.customer.company_name if order.customer else "Customer"}'
            )
            
            pending_journal = PendingJournalEntry(
                workflow_id=workflow.id,
                entry_date=order.order_date,
                description=f'Sales Order {order_number}',
                reference=order_number,
                lines=journal_lines,
                total_debit=float(order.total_amount),
                total_credit=float(order.total_amount),
                created_by=user_id
            )
            db.session.add(pending_journal)
            
            # Auto submit for review
            workflow.status = 'pending_review'
            workflow.current_step = 'review'
            workflow.submitted_at = get_local_now()
            
            db.session.commit()
            
            # CREATE NOTIFICATION: Sales Order Created - Send to all active users
            try:
                from models.user import User
                all_users = User.query.filter(User.is_active == True).all()
                for u in all_users:
                    notification = Notification(
                        user_id=u.id,
                        notification_type='success',
                        category='sales',
                        title='Sales Order Created',
                        message=f'Sales Order {order_number} created successfully for {order.customer.company_name if order.customer else "customer"}',
                        reference_type='sales_order',
                        reference_id=order.id,
                        priority='normal',
                        action_url=f'/app/sales/orders/{order.id}'
                    )
                    db.session.add(notification)
                db.session.commit()
            except Exception as notif_error:
                print(f"Notification creation failed: {notif_error}")
            
            return jsonify({
                'message': 'Order created and submitted for approval',
                'order_id': order.id,
                'order_number': order_number,
                'workflow_id': workflow.id,
                'workflow_status': workflow.status
            }), 201
            
        except Exception as workflow_error:
            # If workflow creation fails, still return success for order creation
            # but log the error
            print(f"Warning: Workflow creation failed: {workflow_error}")
            db.session.commit()
            return jsonify({
                'message': 'Order created (workflow creation failed)',
                'order_id': order.id,
                'order_number': order_number,
                'warning': 'Approval workflow not created'
            }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/orders/<int:id>', methods=['GET'])
@jwt_required()
def get_order(id):
    """Get sales order details"""
    try:
        order = SalesOrder.query.get(id)
        if not order:
            return jsonify(error_response('api.error', error_code=404)), 404
        
        return jsonify({
            'id': order.id,
            'order_number': order.order_number,
            'customer': {
                'id': order.customer.id,
                'code': order.customer.code,
                'company_name': order.customer.company_name
            },
            'order_date': order.order_date.isoformat(),
            'required_date': order.required_date.isoformat() if order.required_date else None,
            'status': order.status,
            'priority': order.priority,
            'subtotal': float(order.subtotal),
            'tax_amount': float(order.tax_amount),
            'total_amount': float(order.total_amount),
            'notes': order.notes,
            'items': [{
                'id': i.id,
                'line_number': i.line_number,
                'product_id': i.product_id,
                'product_code': i.product.code,
                'product_name': i.product.name,
                'quantity': float(i.quantity),
                'uom': i.uom,
                'unit_price': float(i.unit_price),
                'total_price': float(i.total_price)
            } for i in order.items]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/orders/<int:id>/confirm', methods=['PUT'])
@jwt_required()
def confirm_order(id):
    """Confirm sales order"""
    try:
        user_id = get_jwt_identity()
        order = SalesOrder.query.get(id)
        
        if not order:
            return jsonify(error_response('api.error', error_code=404)), 404
        
        # BUSINESS RULE: Validate status transition
        status_check = BusinessRules.validate_status_transition(
            current_status=order.status,
            new_status='confirmed',
            allowed_transitions=SALES_ORDER_TRANSITIONS
        )
        if not status_check['valid']:
            return jsonify({
                'error': 'Invalid status transition',
                'details': status_check
            }), 400
        
        # BUSINESS RULE: Check inventory availability for all items
        inventory_warnings = []
        for item in order.items:
            try:
                inv_check = BusinessRules.validate_inventory_availability(
                    product_id=item.product_id,
                    quantity=item.quantity
                )
                if not inv_check['available']:
                    inventory_warnings.append({
                        'product_id': item.product_id,
                        'product_name': item.product.name if item.product else 'Unknown',
                        'required': inv_check['required'],
                        'available': inv_check['current_stock'],
                        'shortage': inv_check['shortage']
                    })
            except Exception as inv_error:
                print(f"Inventory check warning: {inv_error}")
        
        # If there are inventory shortages, return warning but allow confirmation
        # (MRP will handle procurement)
        
        order.status = 'confirmed'
        order.approved_by = user_id
        order.approved_at = get_local_now()
        
        db.session.commit()
        
        # CREATE NOTIFICATION: Sales Order Confirmed - Send to all active users
        try:
            from models.user import User
            all_users = User.query.filter(User.is_active == True).all()
            for u in all_users:
                notification = Notification(
                    user_id=u.id,
                    notification_type='success',
                    category='sales',
                    title='Sales Order Confirmed',
                    message=f'Sales Order {order.order_number} confirmed successfully',
                    reference_type='sales_order',
                    reference_id=order.id,
                    priority='high',
                    action_url=f'/app/sales/orders/{order.id}'
                )
                db.session.add(notification)
                
                # If inventory warnings, create alert notification for all users
                if inventory_warnings:
                    warning_msg = f"Sales Order {order.order_number} confirmed with inventory shortages: "
                    warning_msg += ", ".join([f"{w['product_name']} (shortage: {w['shortage']})" for w in inventory_warnings[:3]])
                    
                    alert_notification = Notification(
                        user_id=u.id,
                        notification_type='warning',
                        category='inventory',
                        title='Inventory Shortage Alert',
                        message=warning_msg,
                        reference_type='sales_order',
                        reference_id=order.id,
                        priority='high',
                        action_url=f'/app/warehouse/inventory'
                    )
                    db.session.add(alert_notification)
            
            db.session.commit()
        except Exception as notif_error:
            print(f"Notification creation failed: {notif_error}")
        
        # Trigger workflow automation after confirming sales order
        from models.workflow_integration import WorkflowAutomation
        try:
            WorkflowAutomation.trigger_mrp_from_sales_order(order.id)
            print(f"Workflow triggered for sales order {order.order_number}")
        except Exception as workflow_error:
            print(f"Workflow trigger failed: {workflow_error}")
        
        response_data = {'message': 'Order confirmed successfully'}
        if inventory_warnings:
            response_data['warnings'] = inventory_warnings
        
        return jsonify(response_data), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/orders/<int:id>', methods=['PUT'])
@jwt_required()
def update_order(id):
    """Update sales order"""
    try:
        order = SalesOrder.query.get(id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        data = request.get_json()
        
        # Handle status update (including cancel)
        if 'status' in data:
            new_status = data['status']
            
            # Validate status transition
            valid_transitions = {
                'draft': ['confirmed', 'cancelled'],
                'confirmed': ['in_production', 'cancelled'],
                'in_production': ['ready', 'cancelled'],
                'ready': ['shipped', 'cancelled'],
                'shipped': ['delivered'],
                'delivered': [],
                'cancelled': []
            }
            
            current_status = order.status
            if new_status not in valid_transitions.get(current_status, []):
                return jsonify({
                    'error': f'Cannot change status from {current_status} to {new_status}'
                }), 400
            
            order.status = new_status
        
        # Update other fields if provided
        if 'priority' in data:
            order.priority = data['priority']
        if 'notes' in data:
            order.notes = data['notes']
        if 'required_date' in data and data['required_date']:
            order.required_date = datetime.fromisoformat(data['required_date'].replace('Z', '+00:00'))
        
        db.session.commit()
        
        return jsonify({
            'message': 'Order updated successfully',
            'order': {
                'id': order.id,
                'order_number': order.order_number,
                'status': order.status
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/orders/<int:id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_order(id):
    """Cancel sales order"""
    try:
        order = SalesOrder.query.get(id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # Check if order can be cancelled
        non_cancellable = ['delivered', 'cancelled']
        if order.status in non_cancellable:
            return jsonify({
                'error': f'Cannot cancel order with status: {order.status}'
            }), 400
        
        order.status = 'cancelled'
        db.session.commit()
        
        return jsonify({
            'message': 'Order cancelled successfully',
            'order': {
                'id': order.id,
                'order_number': order.order_number,
                'status': order.status
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ===============================
# LEAD MANAGEMENT ROUTES
# ===============================

@sales_bp.route('/leads', methods=['GET'])
@jwt_required()
def get_leads():
    """Get all leads with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        source = request.args.get('source', '')
        assigned_to = request.args.get('assigned_to', type=int)
        
        query = Lead.query
        
        if search:
            query = query.filter(or_(
                Lead.company_name.ilike(f'%{search}%'),
                Lead.contact_person.ilike(f'%{search}%'),
                Lead.email.ilike(f'%{search}%')
            ))
        
        if status:
            query = query.filter(Lead.lead_status == status)
        
        if source:
            query = query.filter(Lead.lead_source == source)
            
        if assigned_to:
            query = query.filter(Lead.assigned_to == assigned_to)
        
        leads = query.order_by(Lead.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'leads': [{
                'id': lead.id,
                'lead_number': lead.lead_number,
                'company_name': lead.company_name,
                'contact_person': lead.contact_person,
                'email': lead.email,
                'phone': lead.phone,
                'lead_source': lead.lead_source,
                'lead_status': lead.lead_status,
                'lead_score': lead.lead_score,
                'industry': lead.industry,
                'company_size': lead.company_size,
                'budget': float(lead.budget) if lead.budget else None,
                'assigned_to': lead.assigned_to,
                'assigned_user_name': lead.assigned_user.full_name if lead.assigned_user else None,
                'created_at': lead.created_at.isoformat(),
                'last_contacted': lead.last_contacted.isoformat() if lead.last_contacted else None,
                'next_followup': lead.next_followup.isoformat() if lead.next_followup else None
            } for lead in leads.items],
            'total': leads.total,
            'pages': leads.pages,
            'current_page': leads.page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/leads', methods=['POST'])
@jwt_required()
def create_lead():
    """Create a new lead"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Generate lead number
        last_lead = Lead.query.order_by(Lead.id.desc()).first()
        lead_number = f"LEAD{str((last_lead.id if last_lead else 0) + 1).zfill(6)}"
        
        lead = Lead(
            lead_number=lead_number,
            company_name=data['company_name'],
            contact_person=data['contact_person'],
            job_title=data.get('job_title'),
            email=data.get('email'),
            phone=data.get('phone'),
            mobile=data.get('mobile'),
            website=data.get('website'),
            address=data.get('address'),
            city=data.get('city'),
            state=data.get('state'),
            country=data.get('country'),
            postal_code=data.get('postal_code'),
            lead_source=data.get('lead_source'),
            lead_status=data.get('lead_status', 'new'),
            industry=data.get('industry'),
            company_size=data.get('company_size'),
            annual_revenue=data.get('annual_revenue'),
            budget=data.get('budget'),
            decision_maker=data.get('decision_maker', False),
            purchase_timeline=data.get('purchase_timeline'),
            assigned_to=data.get('assigned_to'),
            notes=data.get('notes'),
            created_by=user_id
        )
        
        db.session.add(lead)
        db.session.commit()
        
        return jsonify({
            'message': 'Lead created successfully',
            'lead_id': lead.id,
            'lead_number': lead.lead_number
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/leads/<int:lead_id>/convert', methods=['POST'])
@jwt_required()
def convert_lead(lead_id):
    """Convert lead to customer and create opportunity"""
    try:
        lead = Lead.query.get_or_404(lead_id)
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Create customer from lead
        last_customer = Customer.query.order_by(Customer.id.desc()).first()
        customer_code = f"CUST{str((last_customer.id if last_customer else 0) + 1).zfill(6)}"
        
        customer = Customer(
            code=customer_code,
            company_name=lead.company_name,
            contact_person=lead.contact_person,
            job_title=lead.job_title,
            email=lead.email,
            phone=lead.phone,
            mobile=lead.mobile,
            website=lead.website,
            billing_address=lead.address,
            billing_city=lead.city,
            billing_state=lead.state,
            billing_country=lead.country,
            billing_postal_code=lead.postal_code,
            industry=lead.industry,
            company_size=lead.company_size,
            annual_revenue=lead.annual_revenue,
            assigned_to=lead.assigned_to,
            lifecycle_stage='prospect',
            created_by=user_id
        )
        
        db.session.add(customer)
        db.session.flush()  # Get customer ID
        
        # Update lead status
        lead.lead_status = 'converted'
        lead.converted_to_customer_id = customer.id
        lead.converted_at = get_local_now()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Lead converted successfully',
            'customer_id': customer.id,
            'customer_code': customer.code
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===============================
# OPPORTUNITY/PIPELINE ROUTES
# ===============================

@sales_bp.route('/pipelines', methods=['GET'])
@jwt_required()
def get_pipelines():
    """Get all sales pipelines"""
    try:
        pipelines = SalesPipeline.query.filter_by(is_active=True).all()
        
        return jsonify({
            'pipelines': [{
                'id': pipeline.id,
                'name': pipeline.name,
                'description': pipeline.description,
                'is_default': pipeline.is_default,
                'stages': [{
                    'id': stage.id,
                    'name': stage.name,
                    'order': stage.order,
                    'probability': stage.probability,
                    'color_code': stage.color_code,
                    'is_closed_won': stage.is_closed_won,
                    'is_closed_lost': stage.is_closed_lost
                } for stage in sorted(pipeline.stages, key=lambda x: x.order)]
            } for pipeline in pipelines]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/opportunities', methods=['GET'])
@jwt_required()
def get_opportunities():
    """Get opportunities with filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        pipeline_id = request.args.get('pipeline_id', type=int)
        stage_id = request.args.get('stage_id', type=int)
        assigned_to = request.args.get('assigned_to', type=int)
        status = request.args.get('status', '')
        
        query = Opportunity.query
        
        if search:
            query = query.filter(or_(
                Opportunity.name.ilike(f'%{search}%'),
                Opportunity.opportunity_number.ilike(f'%{search}%')
            ))
        
        if pipeline_id:
            query = query.filter(Opportunity.pipeline_id == pipeline_id)
        
        if stage_id:
            query = query.filter(Opportunity.stage_id == stage_id)
            
        if assigned_to:
            query = query.filter(Opportunity.assigned_to == assigned_to)
            
        if status:
            query = query.filter(Opportunity.status == status)
        
        opportunities = query.order_by(Opportunity.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'opportunities': [{
                'id': opp.id,
                'opportunity_number': opp.opportunity_number,
                'name': opp.name,
                'description': opp.description,
                'value': float(opp.value),
                'probability': opp.probability,
                'expected_close_date': opp.expected_close_date.isoformat() if opp.expected_close_date else None,
                'status': opp.status,
                'pipeline_name': opp.pipeline.name if opp.pipeline else None,
                'stage_name': opp.stage.name if opp.stage else None,
                'stage_color': opp.stage.color_code if opp.stage else None,
                'customer_name': opp.customer.company_name if opp.customer else None,
                'lead_name': opp.lead.company_name if opp.lead else None,
                'assigned_to': opp.assigned_to,
                'assigned_user_name': opp.assigned_user.full_name if opp.assigned_user else None,
                'created_at': opp.created_at.isoformat(),
                'last_activity_date': opp.last_activity_date.isoformat() if opp.last_activity_date else None
            } for opp in opportunities.items],
            'total': opportunities.total,
            'pages': opportunities.pages,
            'current_page': opportunities.page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/opportunities', methods=['POST'])
@jwt_required()
def create_opportunity():
    """Create new opportunity"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Generate opportunity number
        last_opp = Opportunity.query.order_by(Opportunity.id.desc()).first()
        opp_number = f"OPP{str((last_opp.id if last_opp else 0) + 1).zfill(6)}"
        
        opportunity = Opportunity(
            opportunity_number=opp_number,
            name=data['name'],
            description=data.get('description'),
            lead_id=data.get('lead_id'),
            customer_id=data.get('customer_id'),
            pipeline_id=data['pipeline_id'],
            stage_id=data['stage_id'],
            value=data.get('value', 0),
            probability=data.get('probability', 0),
            expected_close_date=datetime.strptime(data['expected_close_date'], '%Y-%m-%d').date() if data.get('expected_close_date') else None,
            assigned_to=data.get('assigned_to'),
            source=data.get('source'),
            created_by=user_id
        )
        
        db.session.add(opportunity)
        db.session.commit()
        
        return jsonify({
            'message': 'Opportunity created successfully',
            'opportunity_id': opportunity.id,
            'opportunity_number': opportunity.opportunity_number
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===============================
# QUOTATION ROUTES
# ===============================

@sales_bp.route('/quotations', methods=['GET'])
@jwt_required()
def get_quotations():
    """Get quotations with filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        customer_id = request.args.get('customer_id', type=int)
        
        query = Quotation.query
        
        if search:
            query = query.filter(or_(
                Quotation.quote_number.ilike(f'%{search}%')
            ))
        
        if status:
            query = query.filter(Quotation.status == status)
            
        if customer_id:
            query = query.filter(Quotation.customer_id == customer_id)
        
        quotations = query.order_by(Quotation.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'quotations': [{
                'id': quote.id,
                'quote_number': quote.quote_number,
                'revision': quote.revision,
                'customer_name': quote.customer.company_name if quote.customer else None,
                'quote_date': quote.quote_date.isoformat(),
                'valid_until': quote.valid_until.isoformat(),
                'total_amount': float(quote.total_amount),
                'status': quote.status,
                'created_at': quote.created_at.isoformat()
            } for quote in quotations.items],
            'total': quotations.total,
            'pages': quotations.pages,
            'current_page': quotations.page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/quotations', methods=['POST'])
@jwt_required()
def create_quotation():
    """Create new quotation"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Generate quotation number
        last_quote = Quotation.query.order_by(Quotation.id.desc()).first()
        quote_number = f"QUO{str((last_quote.id if last_quote else 0) + 1).zfill(6)}"
        
        quotation = Quotation(
            quote_number=quote_number,
            opportunity_id=data.get('opportunity_id'),
            customer_id=data['customer_id'],
            quote_date=datetime.strptime(data['quote_date'], '%Y-%m-%d').date(),
            valid_until=datetime.strptime(data['valid_until'], '%Y-%m-%d').date(),
            delivery_date=datetime.strptime(data['delivery_date'], '%Y-%m-%d').date() if data.get('delivery_date') else None,
            payment_terms=data.get('payment_terms'),
            delivery_terms=data.get('delivery_terms'),
            notes=data.get('notes'),
            terms_conditions=data.get('terms_conditions'),
            prepared_by=user_id
        )
        
        db.session.add(quotation)
        db.session.flush()
        
        # Add items
        subtotal = 0
        for idx, item_data in enumerate(data.get('items', []), 1):
            item_total = float(item_data['quantity']) * float(item_data['unit_price'])
            
            item = QuotationItem(
                quotation_id=quotation.id,
                line_number=idx,
                product_id=item_data['product_id'],
                description=item_data.get('description'),
                quantity=item_data['quantity'],
                uom=item_data['uom'],
                unit_price=item_data['unit_price'],
                discount_percent=item_data.get('discount_percent', 0),
                tax_percent=item_data.get('tax_percent', 0),
                total_price=item_total
            )
            db.session.add(item)
            subtotal += item_total
        
        quotation.subtotal = subtotal
        quotation.total_amount = subtotal
        
        db.session.commit()
        
        return jsonify({
            'message': 'Quotation created successfully',
            'quotation_id': quotation.id,
            'quote_number': quote_number
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===============================
# ACTIVITY ROUTES
# ===============================

@sales_bp.route('/activities', methods=['GET'])
@jwt_required()
def get_activities():
    """Get sales activities"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        activity_type = request.args.get('activity_type', '')
        status = request.args.get('status', '')
        assigned_to = request.args.get('assigned_to', type=int)
        
        query = SalesActivity.query
        
        if activity_type:
            query = query.filter(SalesActivity.activity_type == activity_type)
        
        if status:
            query = query.filter(SalesActivity.status == status)
            
        if assigned_to:
            query = query.filter(SalesActivity.assigned_to == assigned_to)
        
        activities = query.order_by(SalesActivity.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'activities': [{
                'id': activity.id,
                'activity_number': activity.activity_number,
                'subject': activity.subject,
                'activity_type': activity.activity_type,
                'status': activity.status,
                'priority': activity.priority,
                'start_date': activity.start_date.isoformat() if activity.start_date else None,
                'due_date': activity.due_date.isoformat() if activity.due_date else None,
                'assigned_to': activity.assigned_to,
                'assigned_user_name': activity.assigned_user.full_name if activity.assigned_user else None,
                'lead_name': activity.lead.company_name if activity.lead else None,
                'customer_name': activity.customer.company_name if activity.customer else None,
                'opportunity_name': activity.opportunity.name if activity.opportunity else None,
                'created_at': activity.created_at.isoformat()
            } for activity in activities.items],
            'total': activities.total,
            'pages': activities.pages,
            'current_page': activities.page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/activities', methods=['POST'])
@jwt_required()
def create_activity():
    """Create new sales activity"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Generate activity number
        last_activity = SalesActivity.query.order_by(SalesActivity.id.desc()).first()
        activity_number = f"ACT{str((last_activity.id if last_activity else 0) + 1).zfill(6)}"
        
        activity = SalesActivity(
            activity_number=activity_number,
            subject=data['subject'],
            description=data.get('description'),
            activity_type=data['activity_type'],
            status=data.get('status', 'planned'),
            priority=data.get('priority', 'normal'),
            start_date=datetime.fromisoformat(data['start_date'].replace('Z', '+00:00')) if data.get('start_date') else None,
            due_date=datetime.fromisoformat(data['due_date'].replace('Z', '+00:00')) if data.get('due_date') else None,
            lead_id=data.get('lead_id'),
            customer_id=data.get('customer_id'),
            opportunity_id=data.get('opportunity_id'),
            assigned_to=data['assigned_to'],
            location=data.get('location'),
            created_by=user_id
        )
        
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Activity created successfully',
            'activity_id': activity.id,
            'activity_number': activity_number
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===============================
# ANALYTICS ROUTES
# ===============================

@sales_bp.route('/analytics/dashboard', methods=['GET'])
@jwt_required()
def get_sales_dashboard():
    """Get sales dashboard analytics"""
    try:
        user_id = get_jwt_identity()
        
        # Get lead metrics
        total_leads = Lead.query.count()
        new_leads = Lead.query.filter(Lead.lead_status == 'new').count()
        qualified_leads = Lead.query.filter(Lead.lead_status == 'qualified').count()
        converted_leads = Lead.query.filter(Lead.lead_status == 'converted').count()
        
        # Get opportunity metrics
        total_opportunities = Opportunity.query.filter(Opportunity.status == 'open').count()
        opportunity_value = db.session.query(func.sum(Opportunity.value)).filter(
            Opportunity.status == 'open'
        ).scalar() or 0
        
        won_opportunities = Opportunity.query.filter(Opportunity.status == 'won').count()
        won_value = db.session.query(func.sum(Opportunity.value)).filter(
            Opportunity.status == 'won'
        ).scalar() or 0
        
        # Get quotation metrics
        total_quotations = Quotation.query.count()
        pending_quotations = Quotation.query.filter(Quotation.status == 'sent').count()
        accepted_quotations = Quotation.query.filter(Quotation.status == 'accepted').count()
        
        # Get activity metrics
        total_activities = SalesActivity.query.count()
        pending_activities = SalesActivity.query.filter(
            SalesActivity.status.in_(['planned', 'in_progress'])
        ).count()
        overdue_activities = SalesActivity.query.filter(
            and_(
                SalesActivity.due_date < get_local_now(),
                SalesActivity.status != 'completed'
            )
        ).count()
        
        return jsonify({
            'lead_metrics': {
                'total_leads': total_leads,
                'new_leads': new_leads,
                'qualified_leads': qualified_leads,
                'converted_leads': converted_leads,
                'conversion_rate': round((converted_leads / total_leads * 100) if total_leads else 0, 2)
            },
            'opportunity_metrics': {
                'total_opportunities': total_opportunities,
                'total_value': float(opportunity_value),
                'won_opportunities': won_opportunities,
                'won_value': float(won_value),
                'win_rate': round((won_opportunities / (won_opportunities + Opportunity.query.filter(Opportunity.status == 'lost').count()) * 100) if (won_opportunities + Opportunity.query.filter(Opportunity.status == 'lost').count()) else 0, 2)
            },
            'quotation_metrics': {
                'total_quotations': total_quotations,
                'pending_quotations': pending_quotations,
                'accepted_quotations': accepted_quotations,
                'acceptance_rate': round((accepted_quotations / total_quotations * 100) if total_quotations else 0, 2)
            },
            'activity_metrics': {
                'total_activities': total_activities,
                'pending_activities': pending_activities,
                'overdue_activities': overdue_activities
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===============================
# SALES FORECASTS ROUTES
# ===============================

@sales_bp.route('/forecasts', methods=['GET'])
@jwt_required()
def get_forecasts():
    """Get all sales forecasts"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        search = request.args.get('search', '')
        status = request.args.get('status')
        
        query = SalesForecast.query
        
        if search:
            query = query.filter(
                or_(
                    SalesForecast.forecast_number.ilike(f'%{search}%'),
                    SalesForecast.name.ilike(f'%{search}%')
                )
            )
        
        if status:
            query = query.filter_by(status=status)
            
        forecasts = query.order_by(SalesForecast.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'forecasts': [{
                'id': f.id,
                'forecast_number': f.forecast_number,
                'name': f.name,
                'forecast_type': f.forecast_type,
                'period_start': f.period_start.isoformat(),
                'period_end': f.period_end.isoformat(),
                'customer_id': f.customer_id,
                'customer_name': f.customer.company_name if f.customer else None,
                'product_id': f.product_id,
                'product_name': f.product.name if f.product else None,
                'best_case': float(f.best_case),
                'most_likely': float(f.most_likely),
                'worst_case': float(f.worst_case),
                'committed': float(f.committed),
                'status': f.status,
                'confidence_level': f.confidence_level,
                'methodology': f.methodology,
                'created_at': f.created_at.isoformat()
            } for f in forecasts.items],
            'total': forecasts.total,
            'pages': forecasts.pages,
            'current_page': forecasts.page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/forecasts', methods=['POST'])
@jwt_required()
def create_forecast():
    """Create sales forecast"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        forecast = SalesForecast(
            forecast_number=data.get('forecast_number'),
            name=data.get('name'),
            forecast_type=data.get('forecast_type', 'monthly'),
            period_start=datetime.strptime(data.get('period_start'), '%Y-%m-%d').date(),
            period_end=datetime.strptime(data.get('period_end'), '%Y-%m-%d').date(),
            customer_id=data.get('customer_id'),
            product_id=data.get('product_id'),
            best_case=data.get('best_case', 0),
            most_likely=data.get('most_likely', 0),
            worst_case=data.get('worst_case', 0),
            committed=data.get('committed', 0),
            confidence_level=data.get('confidence_level', 'medium'),
            methodology=data.get('methodology', 'pipeline'),
            required_manpower=data.get('required_manpower', 0),
            shifts_per_day=data.get('shifts_per_day', 1),
            notes=data.get('notes', ''),
            created_by=user_id
        )
        
        db.session.add(forecast)
        db.session.commit()
        
        return jsonify({
            'message': 'Forecast created successfully',
            'forecast_id': forecast.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/forecasts/<int:id>', methods=['GET'])
@jwt_required()
def get_forecast(id):
    """Get sales forecast details"""
    try:
        forecast = SalesForecast.query.get_or_404(id)
        
        return jsonify({
            'id': forecast.id,
            'forecast_number': forecast.forecast_number,
            'name': forecast.name,
            'forecast_type': forecast.forecast_type,
            'period_start': forecast.period_start.isoformat(),
            'period_end': forecast.period_end.isoformat(),
            'customer_id': forecast.customer_id,
            'customer_name': forecast.customer.company_name if forecast.customer else None,
            'product_id': forecast.product_id,
            'product_name': forecast.product.name if forecast.product else None,
            'best_case': float(forecast.best_case),
            'most_likely': float(forecast.most_likely),
            'worst_case': float(forecast.worst_case),
            'committed': float(forecast.committed),
            'actual_value': float(forecast.actual_value),
            'variance': float(forecast.variance),
            'accuracy_percentage': float(forecast.accuracy_percentage),
            'status': forecast.status,
            'confidence_level': forecast.confidence_level,
            'methodology': forecast.methodology,
            'required_manpower': forecast.required_manpower,
            'shifts_per_day': forecast.shifts_per_day,
            'notes': forecast.notes,
            'created_by': forecast.created_by,
            'created_at': forecast.created_at.isoformat(),
            'updated_at': forecast.updated_at.isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/forecasts/<int:id>', methods=['PUT'])
@jwt_required()
def update_forecast(id):
    """Update sales forecast"""
    try:
        forecast = SalesForecast.query.get_or_404(id)
        data = request.get_json()
        
        forecast.forecast_number = data.get('forecast_number', forecast.forecast_number)
        forecast.name = data.get('name', forecast.name)
        forecast.forecast_type = data.get('forecast_type', forecast.forecast_type)
        
        if data.get('period_start'):
            forecast.period_start = datetime.strptime(data.get('period_start'), '%Y-%m-%d').date()
        if data.get('period_end'):
            forecast.period_end = datetime.strptime(data.get('period_end'), '%Y-%m-%d').date()
            
        forecast.customer_id = data.get('customer_id', forecast.customer_id)
        forecast.product_id = data.get('product_id', forecast.product_id)
        forecast.best_case = data.get('best_case', forecast.best_case)
        forecast.most_likely = data.get('most_likely', forecast.most_likely)
        forecast.worst_case = data.get('worst_case', forecast.worst_case)
        forecast.committed = data.get('committed', forecast.committed)
        forecast.confidence_level = data.get('confidence_level', forecast.confidence_level)
        forecast.methodology = data.get('methodology', forecast.methodology)
        forecast.required_manpower = data.get('required_manpower', forecast.required_manpower)
        forecast.shifts_per_day = data.get('shifts_per_day', forecast.shifts_per_day)
        forecast.notes = data.get('notes', forecast.notes)
        
        db.session.commit()
        
        return jsonify(success_response('api.success'))
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/forecasts/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_forecast(id):
    """Delete sales forecast"""
    try:
        forecast = SalesForecast.query.get_or_404(id)
        db.session.delete(forecast)
        db.session.commit()
        
        return jsonify(success_response('api.success'))
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Shipping Integration
@sales_bp.route('/orders/<int:order_id>/create-shipment', methods=['POST'])
@jwt_required()
def create_shipment_from_order(order_id):
    """Create shipping order from sales order"""
    try:
        from utils.shipping_integration import create_shipping_from_sales_order
        
        data = request.get_json() or {}
        logistics_provider_id = data.get('logistics_provider_id')
        service_type = data.get('service_type', 'regular')
        
        shipping_order = create_shipping_from_sales_order(
            order_id, 
            logistics_provider_id, 
            service_type
        )
        
        return jsonify({
            'message': 'Shipping order created successfully',
            'shipping_id': shipping_order.id,
            'shipping_number': shipping_order.shipping_number,
            'tracking_number': shipping_order.tracking_number
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/orders/<int:order_id>/confirm-with-shipment', methods=['POST'])
@jwt_required()
def confirm_order_with_shipment(order_id):
    """Confirm sales order and optionally create shipment"""
    try:
        order = SalesOrder.query.get_or_404(order_id)
        data = request.get_json() or {}
        
        # Update order status
        order.status = 'confirmed'
        
        # Auto-create shipment if requested
        auto_create_shipment = data.get('auto_create_shipment', False)
        shipping_order = None
        
        if auto_create_shipment:
            from utils.shipping_integration import create_shipping_from_sales_order
            
            logistics_provider_id = data.get('logistics_provider_id')
            service_type = data.get('service_type', 'regular')
            
            shipping_order = create_shipping_from_sales_order(
                order_id, 
                logistics_provider_id, 
                service_type
            )
        
        db.session.commit()
        
        response = {
            'message': 'Order confirmed successfully',
            'order_id': order.id,
            'status': order.status
        }
        
        if shipping_order:
            response.update({
                'shipping_created': True,
                'shipping_id': shipping_order.id,
                'shipping_number': shipping_order.shipping_number,
                'tracking_number': shipping_order.tracking_number
            })
        
        return jsonify(response)
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
