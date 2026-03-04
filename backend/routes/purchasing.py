from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Supplier, PurchaseOrder, PurchaseOrderItem, GoodsReceivedNote, GRNItem, Notification
from utils.i18n import success_response, error_response, get_message
from models.purchasing import (
    PurchaseApproval, SupplierQuote, PurchaseRFQ, RFQItem, SupplierQuoteItem,
    SupplierContract, ContractItem, PriceHistory
)
from models.user import User
from models.product import Product
from utils import generate_number
from utils.business_rules import BusinessRules, ValidationError, PURCHASE_ORDER_TRANSITIONS
from datetime import datetime, date, timedelta
from sqlalchemy import and_, or_, desc, asc, func
from utils.timezone import get_local_now, get_local_today

purchasing_bp = Blueprint('purchasing', __name__)

@purchasing_bp.route('/suppliers', methods=['GET'])
@jwt_required()
def get_suppliers():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        search = request.args.get('search', '')
        
        query = Supplier.query
        
        if search:
            query = query.filter(
                db.or_(
                    Supplier.company_name.ilike(f'%{search}%'),
                    Supplier.code.ilike(f'%{search}%'),
                    Supplier.contact_person.ilike(f'%{search}%')
                )
            )
        
        suppliers = query.filter_by(is_active=True).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'suppliers': [{
                'id': s.id,
                'code': s.code,
                'name': s.company_name,  # Frontend expects 'name'
                'company_name': s.company_name,
                'contact_person': s.contact_person,
                'email': s.email,
                'phone': s.phone,
                'address': s.address,
                'city': s.city,
                'country': s.country,
                'supplier_type': s.supplier_type,
                'payment_terms': str(s.payment_terms_days) if s.payment_terms_days else '30',
                'credit_limit': float(s.credit_limit) if s.credit_limit else 0.0,
                'rating': s.rating,
                'is_active': s.is_active,
                'created_at': s.created_at.isoformat() if s.created_at else None
            } for s in suppliers.items],
            'total': suppliers.total,
            'pages': suppliers.pages,
            'current_page': suppliers.page
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@purchasing_bp.route('/suppliers', methods=['POST'])
@jwt_required()
def create_supplier():
    try:
        data = request.get_json()
        
        # Generate supplier code if not provided
        supplier_code = data.get('code')
        if not supplier_code:
            # Generate code like SUP-001, SUP-002, etc.
            last_supplier = Supplier.query.order_by(Supplier.id.desc()).first()
            next_num = (last_supplier.id + 1) if last_supplier else 1
            supplier_code = f"SUP-{next_num:03d}"
        
        supplier = Supplier(
            code=supplier_code,
            company_name=data.get('name') or data.get('company_name'),  # Frontend sends 'name'
            contact_person=data.get('contact_person'),
            email=data.get('email'),
            phone=data.get('phone'),
            address=data.get('address'),
            city=data.get('city'),
            postal_code=data.get('postal_code'),
            country=data.get('country', 'Indonesia'),
            tax_id=data.get('tax_id'),
            payment_terms_days=int(data.get('payment_terms', 30)) if data.get('payment_terms') else 30,
            credit_limit=float(data.get('credit_limit', 0)) if data.get('credit_limit') else 0.0,
            supplier_type=data.get('supplier_type'),
            is_active=data.get('is_active', True),
            notes=data.get('notes'),
            created_at=get_local_now()
        )
        db.session.add(supplier)
        db.session.commit()
        return jsonify({'message': 'Supplier created', 'supplier_id': supplier.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@purchasing_bp.route('/suppliers/<int:id>', methods=['GET'])
@jwt_required()
def get_supplier(id):
    try:
        supplier = Supplier.query.get(id)
        if not supplier:
            return jsonify(error_response('api.error', error_code=404)), 404
        
        return jsonify({
            'id': supplier.id,
            'code': supplier.code,
            'name': supplier.company_name,  # Frontend expects 'name'
            'company_name': supplier.company_name,
            'contact_person': supplier.contact_person,
            'email': supplier.email,
            'phone': supplier.phone,
            'address': supplier.address,
            'city': supplier.city,
            'postal_code': supplier.postal_code,
            'country': supplier.country,
            'tax_id': supplier.tax_id,
            'payment_terms': str(supplier.payment_terms_days) if supplier.payment_terms_days else '30',
            'credit_limit': float(supplier.credit_limit) if supplier.credit_limit else 0.0,
            'supplier_type': supplier.supplier_type,
            'rating': supplier.rating,
            'is_active': supplier.is_active,
            'notes': supplier.notes,
            'created_at': supplier.created_at.isoformat() if supplier.created_at else None
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@purchasing_bp.route('/suppliers/<int:id>', methods=['PUT'])
@jwt_required()
def update_supplier(id):
    try:
        supplier = Supplier.query.get(id)
        if not supplier:
            return jsonify(error_response('api.error', error_code=404)), 404
        
        data = request.get_json()
        
        # Update supplier fields
        if 'name' in data:
            supplier.company_name = data['name']
        if 'company_name' in data:
            supplier.company_name = data['company_name']
        if 'contact_person' in data:
            supplier.contact_person = data['contact_person']
        if 'email' in data:
            supplier.email = data['email']
        if 'phone' in data:
            supplier.phone = data['phone']
        if 'address' in data:
            supplier.address = data['address']
        if 'city' in data:
            supplier.city = data['city']
        if 'postal_code' in data:
            supplier.postal_code = data['postal_code']
        if 'country' in data:
            supplier.country = data['country']
        if 'tax_id' in data:
            supplier.tax_id = data['tax_id']
        if 'payment_terms' in data:
            supplier.payment_terms_days = int(data['payment_terms']) if data['payment_terms'] else 30
        if 'credit_limit' in data:
            supplier.credit_limit = float(data['credit_limit']) if data['credit_limit'] else 0.0
        if 'supplier_type' in data:
            supplier.supplier_type = data['supplier_type']
        if 'is_active' in data:
            supplier.is_active = bool(data['is_active'])
        if 'notes' in data:
            supplier.notes = data['notes']
        
        supplier.updated_at = get_local_now()
        
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@purchasing_bp.route('/suppliers/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_supplier(id):
    try:
        supplier = Supplier.query.get(id)
        if not supplier:
            return jsonify(error_response('api.error', error_code=404)), 404
        
        # Check if supplier has any purchase orders
        if supplier.purchase_orders:
            return jsonify(error_response('api.error', error_code=400)), 400
        
        # Soft delete by setting is_active to False
        supplier.is_active = False
        supplier.updated_at = get_local_now()
        
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@purchasing_bp.route('/purchase-orders', methods=['GET'])
@jwt_required()
def get_purchase_orders():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        pos = PurchaseOrder.query.order_by(PurchaseOrder.order_date.desc()).paginate(page=page, per_page=per_page)
        
        return jsonify({
            'purchase_orders': [{
                'id': po.id,
                'po_number': po.po_number,
                'supplier_name': po.supplier.company_name,
                'order_date': po.order_date.isoformat(),
                'status': po.status,
                'total_amount': float(po.total_amount)
            } for po in pos.items],
            'total': pos.total
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@purchasing_bp.route('/purchase-orders', methods=['POST'])
@jwt_required()
def create_purchase_order():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # BUSINESS RULE: Validate supplier status
        supplier_id = data.get('supplier_id')
        if supplier_id:
            try:
                supplier = Supplier.query.get(supplier_id)
                if not supplier:
                    return jsonify({'error': 'Supplier not found'}), 404
                if not supplier.is_active:
                    return jsonify({'error': 'Supplier is inactive'}), 400
            except Exception as supplier_error:
                print(f"Supplier validation warning: {supplier_error}")
        
        po_number = generate_number('PO', PurchaseOrder, 'po_number')
        
        po = PurchaseOrder(
            po_number=po_number,
            supplier_id=data['supplier_id'],
            order_date=datetime.fromisoformat(data['order_date']),
            required_date=datetime.fromisoformat(data['required_date']) if data.get('required_date') else None,
            status='draft',
            payment_terms=data.get('payment_terms'),
            notes=data.get('notes'),
            created_by=user_id
        )
        
        db.session.add(po)
        db.session.flush()
        
        subtotal = 0
        for idx, item_data in enumerate(data.get('items', []), 1):
            item_total = item_data['quantity'] * item_data['unit_price']
            
            item = PurchaseOrderItem(
                po_id=po.id,
                line_number=idx,
                product_id=item_data['product_id'],
                quantity=item_data['quantity'],
                uom=item_data.get('uom', 'PCS'),  # Default to PCS if not provided
                unit_price=item_data['unit_price'],
                total_price=item_total
            )
            db.session.add(item)
            subtotal += item_total
        
        po.subtotal = subtotal
        po.total_amount = subtotal
        
        db.session.commit()
        
        # CREATE NOTIFICATION: Purchase Order Created
        try:
            notification = Notification(
                user_id=user_id,
                notification_type='success',
                category='purchasing',
                title='Purchase Order Created',
                message=f'Purchase Order {po_number} created successfully for {po.supplier.company_name if po.supplier else "supplier"}',
                reference_type='purchase_order',
                reference_id=po.id,
                priority='normal',
                action_url=f'/app/purchasing/purchase-orders/{po.id}'
            )
            db.session.add(notification)
            db.session.commit()
        except Exception as notif_error:
            print(f"Notification creation failed: {notif_error}")
        
        return jsonify({'message': 'PO created', 'po_id': po.id, 'po_number': po_number}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@purchasing_bp.route('/purchase-orders/<int:id>', methods=['GET'])
@jwt_required()
def get_purchase_order(id):
    try:
        po = PurchaseOrder.query.get(id)
        if not po:
            return jsonify(error_response('api.error', error_code=404)), 404
        
        return jsonify({
            'id': po.id,
            'po_number': po.po_number,
            'supplier': {
                'id': po.supplier.id,
                'company_name': po.supplier.company_name
            },
            'order_date': po.order_date.isoformat(),
            'status': po.status,
            'total_amount': float(po.total_amount),
            'items': [{
                'id': i.id,
                'product_code': i.product.code,
                'product_name': i.product.name,
                'quantity': float(i.quantity),
                'unit_price': float(i.unit_price),
                'total_price': float(i.total_price)
            } for i in po.items]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@purchasing_bp.route('/grn', methods=['GET'])
@jwt_required()
def get_grns():
    try:
        grns = GoodsReceivedNote.query.order_by(GoodsReceivedNote.receipt_date.desc()).all()
        return jsonify({
            'grns': [{
                'id': g.id,
                'grn_number': g.grn_number,
                'po_number': g.purchase_order.po_number,
                'supplier_name': g.supplier.company_name,
                'receipt_date': g.receipt_date.isoformat(),
                'status': g.status
            } for g in grns]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@purchasing_bp.route('/grn', methods=['POST'])
@jwt_required()
def create_grn():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        grn_number = generate_number('GRN', GoodsReceivedNote, 'grn_number')
        
        grn = GoodsReceivedNote(
            grn_number=grn_number,
            po_id=data['po_id'],
            supplier_id=data['supplier_id'],
            receipt_date=get_local_now(),
            delivery_note_number=data.get('delivery_note_number'),
            vehicle_number=data.get('vehicle_number'),
            driver_name=data.get('driver_name'),
            status='pending',
            received_by=user_id
        )
        
        db.session.add(grn)
        db.session.flush()
        
        for item_data in data.get('items', []):
            grn_item = GRNItem(
                grn_id=grn.id,
                po_item_id=item_data['po_item_id'],
                product_id=item_data['product_id'],
                quantity_ordered=item_data['quantity_ordered'],
                quantity_received=item_data['quantity_received'],
                quantity_accepted=item_data.get('quantity_accepted', item_data['quantity_received']),
                uom=item_data['uom'],
                batch_number=item_data.get('batch_number'),
                location_id=item_data.get('location_id')
            )
            db.session.add(grn_item)
        
        db.session.commit()
        
        return jsonify({'message': 'GRN created', 'grn_id': grn.id, 'grn_number': grn_number}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===============================
# APPROVAL WORKFLOW ENDPOINTS
# ===============================

@purchasing_bp.route('/purchase-orders/<int:po_id>/approvals', methods=['GET'])
@jwt_required()
def get_po_approvals(po_id):
    try:
        approvals = PurchaseApproval.query.filter_by(po_id=po_id).order_by(PurchaseApproval.approval_level).all()
        
        return jsonify({
            'approvals': [{
                'id': a.id,
                'approval_level': a.approval_level,
                'approver': {
                    'id': a.approver.id,
                    'name': a.approver.name,
                    'email': a.approver.email
                },
                'status': a.status,
                'comments': a.comments,
                'approved_at': a.approved_at.isoformat() if a.approved_at else None,
                'created_at': a.created_at.isoformat()
            } for a in approvals]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@purchasing_bp.route('/purchase-orders/<int:po_id>/approve', methods=['POST'])
@jwt_required()
def approve_purchase_order(po_id):
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Find pending approval for this user
        approval = PurchaseApproval.query.filter_by(
            po_id=po_id,
            approver_id=user_id,
            status='pending'
        ).first()
        
        if not approval:
            return jsonify(error_response('api.error', error_code=404)), 404
        
        approval.status = data.get('status', 'approved')  # approved or rejected
        approval.comments = data.get('comments')
        approval.approved_at = get_local_now()
        
        # Update PO status if all approvals are complete
        po = PurchaseOrder.query.get(po_id)
        if approval.status == 'approved':
            # Check if all required approvals are complete
            pending_approvals = PurchaseApproval.query.filter_by(
                po_id=po_id,
                status='pending'
            ).count()
            
            if pending_approvals == 1:  # This is the last approval
                po.status = 'approved'
                po.approved_by = user_id
                po.approved_at = get_local_now()
        else:
            po.status = 'rejected'
        
        db.session.commit()
        
        return jsonify({'message': f'Purchase order {approval.status} successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@purchasing_bp.route('/purchase-orders/<int:po_id>/submit-approval', methods=['POST'])
@jwt_required()
def submit_for_approval(po_id):
    try:
        data = request.get_json()
        approver_ids = data.get('approver_ids', [])
        
        po = PurchaseOrder.query.get(po_id)
        if not po:
            return jsonify(error_response('api.error', error_code=404)), 404
        
        # Create approval records
        for level, approver_id in enumerate(approver_ids, 1):
            approval = PurchaseApproval(
                po_id=po_id,
                approval_level=level,
                approver_id=approver_id,
                status='pending'
            )
            db.session.add(approval)
        
        po.status = 'pending_approval'
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===============================
# RFQ (REQUEST FOR QUOTATION) ENDPOINTS
# ===============================

@purchasing_bp.route('/rfqs', methods=['GET'])
@jwt_required()
def get_rfqs():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        status = request.args.get('status')
        
        query = PurchaseRFQ.query
        if status:
            query = query.filter_by(status=status)
        
        rfqs = query.order_by(PurchaseRFQ.issue_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'rfqs': [{
                'id': r.id,
                'rfq_number': r.rfq_number,
                'title': r.title,
                'issue_date': r.issue_date.isoformat(),
                'closing_date': r.closing_date.isoformat(),
                'status': r.status,
                'created_by': r.created_by_user.name,
                'quotes_count': len(r.quotes)
            } for r in rfqs.items],
            'total': rfqs.total,
            'pages': rfqs.pages,
            'current_page': rfqs.page
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@purchasing_bp.route('/rfqs', methods=['POST'])
@jwt_required()
def create_rfq():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        rfq_number = generate_number('RFQ', PurchaseRFQ, 'rfq_number')
        
        rfq = PurchaseRFQ(
            rfq_number=rfq_number,
            title=data['title'],
            description=data.get('description'),
            issue_date=datetime.strptime(data['issue_date'], '%Y-%m-%d').date(),
            closing_date=datetime.strptime(data['closing_date'], '%Y-%m-%d').date(),
            status='draft',
            created_by=user_id
        )
        
        db.session.add(rfq)
        db.session.flush()
        
        # Add RFQ items
        for idx, item_data in enumerate(data.get('items', []), 1):
            rfq_item = RFQItem(
                rfq_id=rfq.id,
                line_number=idx,
                product_id=item_data.get('product_id'),
                material_id=item_data.get('material_id'),
                description=item_data['description'],
                quantity=item_data['quantity'],
                uom=item_data['uom'],
                required_date=datetime.strptime(item_data['required_date'], '%Y-%m-%d').date() if item_data.get('required_date') else None,
                specifications=item_data.get('specifications')
            )
            db.session.add(rfq_item)
        
        db.session.commit()
        
        return jsonify({'message': 'RFQ created', 'rfq_id': rfq.id, 'rfq_number': rfq_number}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@purchasing_bp.route('/rfqs/<int:id>', methods=['GET'])
@jwt_required()
def get_rfq(id):
    try:
        rfq = PurchaseRFQ.query.get(id)
        if not rfq:
            return jsonify(error_response('api.error', error_code=404)), 404
        
        return jsonify({
            'id': rfq.id,
            'rfq_number': rfq.rfq_number,
            'title': rfq.title,
            'description': rfq.description,
            'issue_date': rfq.issue_date.isoformat(),
            'closing_date': rfq.closing_date.isoformat(),
            'status': rfq.status,
            'created_by': rfq.created_by_user.name,
            'items': [{
                'id': i.id,
                'line_number': i.line_number,
                'product_id': i.product_id,
                'product_name': i.product.name if i.product else None,
                'description': i.description,
                'quantity': float(i.quantity),
                'uom': i.uom,
                'required_date': i.required_date.isoformat() if i.required_date else None,
                'specifications': i.specifications
            } for i in rfq.items],
            'quotes': [{
                'id': q.id,
                'quote_number': q.quote_number,
                'supplier_name': q.supplier.company_name,
                'quote_date': q.quote_date.isoformat(),
                'status': q.status,
                'total_amount': float(q.total_amount)
            } for q in rfq.quotes]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===============================
# SUPPLIER QUOTES ENDPOINTS
# ===============================

@purchasing_bp.route('/quotes', methods=['GET'])
@jwt_required()
def get_quotes():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        supplier_id = request.args.get('supplier_id', type=int)
        status = request.args.get('status')
        
        query = SupplierQuote.query
        if supplier_id:
            query = query.filter_by(supplier_id=supplier_id)
        if status:
            query = query.filter_by(status=status)
        
        quotes = query.order_by(SupplierQuote.quote_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'quotes': [{
                'id': q.id,
                'quote_number': q.quote_number,
                'supplier_name': q.supplier.company_name,
                'quote_date': q.quote_date.isoformat(),
                'valid_until': q.valid_until.isoformat() if q.valid_until else None,
                'status': q.status,
                'currency': q.currency,
                'total_amount': float(q.total_amount),
                'rfq_number': q.rfq.rfq_number if q.rfq else None
            } for q in quotes.items],
            'total': quotes.total,
            'pages': quotes.pages,
            'current_page': quotes.page
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@purchasing_bp.route('/quotes', methods=['POST'])
@jwt_required()
def create_quote():
    try:
        data = request.get_json()
        
        quote_number = generate_number('QUO', SupplierQuote, 'quote_number')
        
        quote = SupplierQuote(
            quote_number=quote_number,
            supplier_id=data['supplier_id'],
            rfq_id=data.get('rfq_id'),
            quote_date=datetime.strptime(data['quote_date'], '%Y-%m-%d').date(),
            valid_until=datetime.strptime(data['valid_until'], '%Y-%m-%d').date() if data.get('valid_until') else None,
            status='draft',
            currency=data.get('currency', 'USD'),
            payment_terms=data.get('payment_terms'),
            delivery_terms=data.get('delivery_terms'),
            lead_time_days=data.get('lead_time_days'),
            notes=data.get('notes')
        )
        
        db.session.add(quote)
        db.session.flush()
        
        # Add quote items
        subtotal = 0
        for idx, item_data in enumerate(data.get('items', []), 1):
            total_price = item_data['quantity'] * item_data['unit_price']
            
            quote_item = SupplierQuoteItem(
                quote_id=quote.id,
                rfq_item_id=item_data.get('rfq_item_id'),
                line_number=idx,
                product_id=item_data.get('product_id'),
                material_id=item_data.get('material_id'),
                description=item_data['description'],
                quantity=item_data['quantity'],
                uom=item_data['uom'],
                unit_price=item_data['unit_price'],
                total_price=total_price,
                lead_time_days=item_data.get('lead_time_days'),
                notes=item_data.get('notes')
            )
            db.session.add(quote_item)
            subtotal += total_price
        
        quote.subtotal = subtotal
        quote.total_amount = subtotal
        
        db.session.commit()
        
        return jsonify({'message': 'Quote created', 'quote_id': quote.id, 'quote_number': quote_number}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===============================
# PRICE COMPARISON ENDPOINTS
# ===============================

@purchasing_bp.route('/price-comparison', methods=['POST'])
@jwt_required()
def compare_prices():
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        material_id = data.get('material_id')
        quantity = data.get('quantity', 1)
        
        # Get recent quotes for the product/material
        query = SupplierQuoteItem.query.join(SupplierQuote)
        
        if product_id:
            query = query.filter(SupplierQuoteItem.product_id == product_id)
        elif material_id:
            query = query.filter(SupplierQuoteItem.material_id == material_id)
        else:
            return jsonify(error_response('api.error', error_code=400)), 400
        
        # Get quotes from last 6 months
        six_months_ago = get_local_now() - timedelta(days=180)
        quote_items = query.filter(
            SupplierQuote.quote_date >= six_months_ago,
            SupplierQuote.status.in_(['submitted', 'accepted'])
        ).order_by(SupplierQuote.quote_date.desc()).limit(20).all()
        
        # Get price history
        price_history_query = PriceHistory.query
        if product_id:
            price_history_query = price_history_query.filter_by(product_id=product_id)
        elif material_id:
            price_history_query = price_history_query.filter_by(material_id=material_id)
        
        price_history = price_history_query.filter(
            PriceHistory.price_date >= six_months_ago
        ).order_by(PriceHistory.price_date.desc()).limit(50).all()
        
        # Format response
        comparison_data = {
            'recent_quotes': [{
                'supplier_name': qi.quote.supplier.company_name,
                'quote_number': qi.quote.quote_number,
                'quote_date': qi.quote.quote_date.isoformat(),
                'unit_price': float(qi.unit_price),
                'currency': qi.quote.currency,
                'quantity': float(qi.quantity),
                'total_price': float(qi.total_price),
                'lead_time_days': qi.lead_time_days,
                'status': qi.quote.status
            } for qi in quote_items],
            'price_history': [{
                'supplier_name': ph.supplier.company_name,
                'price_date': ph.price_date.isoformat(),
                'unit_price': float(ph.unit_price),
                'currency': ph.currency,
                'quantity': float(ph.quantity) if ph.quantity else None,
                'source_type': ph.source_type
            } for ph in price_history],
            'analysis': {
                'lowest_price': min([float(qi.unit_price) for qi in quote_items]) if quote_items else None,
                'highest_price': max([float(qi.unit_price) for qi in quote_items]) if quote_items else None,
                'average_price': sum([float(qi.unit_price) for qi in quote_items]) / len(quote_items) if quote_items else None,
                'suppliers_count': len(set([qi.quote.supplier_id for qi in quote_items]))
            }
        }
        
        return jsonify(comparison_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===============================
# CONTRACT MANAGEMENT ENDPOINTS
# ===============================

@purchasing_bp.route('/contracts', methods=['GET'])
@jwt_required()
def get_contracts():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        supplier_id = request.args.get('supplier_id', type=int)
        status = request.args.get('status')
        contract_type = request.args.get('contract_type')
        
        query = SupplierContract.query
        if supplier_id:
            query = query.filter_by(supplier_id=supplier_id)
        if status:
            query = query.filter_by(status=status)
        if contract_type:
            query = query.filter_by(contract_type=contract_type)
        
        contracts = query.order_by(SupplierContract.start_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'contracts': [{
                'id': c.id,
                'contract_number': c.contract_number,
                'supplier_name': c.supplier.company_name,
                'title': c.title,
                'contract_type': c.contract_type,
                'start_date': c.start_date.isoformat(),
                'end_date': c.end_date.isoformat(),
                'status': c.status,
                'currency': c.currency,
                'total_value': float(c.total_value) if c.total_value else None,
                'created_by': c.created_by_user.name,
                'approved_by': c.approved_by_user.name if c.approved_by_user else None
            } for c in contracts.items],
            'total': contracts.total,
            'pages': contracts.pages,
            'current_page': contracts.page
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@purchasing_bp.route('/contracts', methods=['POST'])
@jwt_required()
def create_contract():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        contract_number = generate_number('CON', SupplierContract, 'contract_number')
        
        contract = SupplierContract(
            contract_number=contract_number,
            supplier_id=data['supplier_id'],
            title=data['title'],
            contract_type=data['contract_type'],
            start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date(),
            end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date(),
            status='draft',
            currency=data.get('currency', 'USD'),
            total_value=data.get('total_value'),
            payment_terms=data.get('payment_terms'),
            delivery_terms=data.get('delivery_terms'),
            penalty_clause=data.get('penalty_clause'),
            terms_conditions=data.get('terms_conditions'),
            auto_renewal=data.get('auto_renewal', False),
            renewal_period_months=data.get('renewal_period_months'),
            created_by=user_id
        )
        
        db.session.add(contract)
        db.session.flush()
        
        # Add contract items
        for idx, item_data in enumerate(data.get('items', []), 1):
            contract_item = ContractItem(
                contract_id=contract.id,
                line_number=idx,
                product_id=item_data.get('product_id'),
                material_id=item_data.get('material_id'),
                description=item_data['description'],
                quantity=item_data.get('quantity'),
                uom=item_data['uom'],
                unit_price=item_data['unit_price'],
                min_order_qty=item_data.get('min_order_qty'),
                max_order_qty=item_data.get('max_order_qty'),
                lead_time_days=item_data.get('lead_time_days'),
                price_valid_from=datetime.strptime(item_data['price_valid_from'], '%Y-%m-%d').date() if item_data.get('price_valid_from') else None,
                price_valid_to=datetime.strptime(item_data['price_valid_to'], '%Y-%m-%d').date() if item_data.get('price_valid_to') else None
            )
            db.session.add(contract_item)
        
        db.session.commit()
        
        return jsonify({'message': 'Contract created', 'contract_id': contract.id, 'contract_number': contract_number}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@purchasing_bp.route('/contracts/<int:id>', methods=['GET'])
@jwt_required()
def get_contract(id):
    try:
        contract = SupplierContract.query.get(id)
        if not contract:
            return jsonify(error_response('api.error', error_code=404)), 404
        
        return jsonify({
            'id': contract.id,
            'contract_number': contract.contract_number,
            'supplier': {
                'id': contract.supplier.id,
                'company_name': contract.supplier.company_name
            },
            'title': contract.title,
            'contract_type': contract.contract_type,
            'start_date': contract.start_date.isoformat(),
            'end_date': contract.end_date.isoformat(),
            'status': contract.status,
            'currency': contract.currency,
            'total_value': float(contract.total_value) if contract.total_value else None,
            'payment_terms': contract.payment_terms,
            'delivery_terms': contract.delivery_terms,
            'penalty_clause': contract.penalty_clause,
            'terms_conditions': contract.terms_conditions,
            'auto_renewal': contract.auto_renewal,
            'renewal_period_months': contract.renewal_period_months,
            'created_by': contract.created_by_user.name,
            'approved_by': contract.approved_by_user.name if contract.approved_by_user else None,
            'items': [{
                'id': i.id,
                'line_number': i.line_number,
                'product_name': i.product.name if i.product else None,
                'description': i.description,
                'quantity': float(i.quantity) if i.quantity else None,
                'uom': i.uom,
                'unit_price': float(i.unit_price),
                'min_order_qty': float(i.min_order_qty) if i.min_order_qty else None,
                'max_order_qty': float(i.max_order_qty) if i.max_order_qty else None,
                'lead_time_days': i.lead_time_days,
                'price_valid_from': i.price_valid_from.isoformat() if i.price_valid_from else None,
                'price_valid_to': i.price_valid_to.isoformat() if i.price_valid_to else None
            } for i in contract.items]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@purchasing_bp.route('/contracts/<int:id>/activate', methods=['POST'])
@jwt_required()
def activate_contract(id):
    try:
        contract = SupplierContract.query.get(id)
        if not contract:
            return jsonify(error_response('api.error', error_code=404)), 404
        
        user_id = get_jwt_identity()
        contract.status = 'active'
        contract.approved_by = user_id
        contract.approved_at = get_local_now()
        
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
