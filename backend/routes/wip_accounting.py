"""
WIP Accounting Routes
Handles WIP Ledger, Variance Tracking, and Auto-posting to GL
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.wip_accounting import WIPLedger, WIPTransaction, WIPVariance, COGMTransfer, COGSPosting
from models.production import WorkOrder
from models.product import Product
from models.finance import AccountingEntry
from datetime import datetime
from sqlalchemy import func
from utils import generate_number
from utils.timezone import get_local_now, get_local_today

wip_accounting_bp = Blueprint('wip_accounting', __name__, url_prefix='/api/wip-accounting')


@wip_accounting_bp.route('/ledger', methods=['GET'])
@jwt_required()
def get_wip_ledger():
    """Get WIP Ledger list with filters"""
    try:
        # Query parameters
        status = request.args.get('status')
        work_order_id = request.args.get('work_order_id')
        
        query = WIPLedger.query
        
        if status:
            query = query.filter_by(status=status)
        if work_order_id:
            query = query.filter_by(work_order_id=work_order_id)
        
        ledgers = query.order_by(WIPLedger.created_at.desc()).all()
        
        return jsonify({
            'ledgers': [{
                'id': l.id,
                'work_order_number': l.work_order_number,
                'product_name': l.product_name,
                'planned_quantity': float(l.planned_quantity),
                'actual_quantity': float(l.actual_quantity),
                'standard_total_cost': float(l.standard_total_cost),
                'actual_total_cost': float(l.actual_total_cost),
                'total_variance': float(l.total_variance),
                'status': l.status,
                'is_posted_to_gl': l.is_posted_to_gl,
                'cogm_posted': l.cogm_posted
            } for l in ledgers]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@wip_accounting_bp.route('/ledger/<int:id>', methods=['GET'])
@jwt_required()
def get_wip_ledger_detail(id):
    """Get WIP Ledger detail with transactions and variances"""
    try:
        ledger = WIPLedger.query.get_or_404(id)
        
        # Get transactions
        transactions = WIPTransaction.query.filter_by(wip_ledger_id=id).all()
        
        # Get variances
        variances = WIPVariance.query.filter_by(wip_ledger_id=id).all()
        
        return jsonify({
            'ledger': {
                'id': ledger.id,
                'work_order_id': ledger.work_order_id,
                'work_order_number': ledger.work_order_number,
                'product_name': ledger.product_name,
                'planned_quantity': float(ledger.planned_quantity),
                'actual_quantity': float(ledger.actual_quantity),
                'completed_quantity': float(ledger.completed_quantity),
                'standard_material_cost': float(ledger.standard_material_cost),
                'standard_labor_cost': float(ledger.standard_labor_cost),
                'standard_overhead_cost': float(ledger.standard_overhead_cost),
                'standard_total_cost': float(ledger.standard_total_cost),
                'actual_material_cost': float(ledger.actual_material_cost),
                'actual_labor_cost': float(ledger.actual_labor_cost),
                'actual_overhead_cost': float(ledger.actual_overhead_cost),
                'actual_total_cost': float(ledger.actual_total_cost),
                'material_variance': float(ledger.material_variance),
                'labor_variance': float(ledger.labor_variance),
                'overhead_variance': float(ledger.overhead_variance),
                'yield_variance': float(ledger.yield_variance),
                'total_variance': float(ledger.total_variance),
                'status': ledger.status,
                'is_posted_to_gl': ledger.is_posted_to_gl,
                'cogm_amount': float(ledger.cogm_amount) if ledger.cogm_amount else 0,
                'cogm_posted': ledger.cogm_posted
            },
            'transactions': [{
                'id': t.id,
                'transaction_date': t.transaction_date.isoformat(),
                'transaction_type': t.transaction_type,
                'cost_category': t.cost_category,
                'quantity': float(t.quantity),
                'unit_cost': float(t.unit_cost),
                'total_cost': float(t.total_cost),
                'description': t.description,
                'is_posted_to_gl': t.is_posted_to_gl
            } for t in transactions],
            'variances': [{
                'id': v.id,
                'variance_type': v.variance_type,
                'standard_amount': float(v.standard_amount),
                'actual_amount': float(v.actual_amount),
                'variance_amount': float(v.variance_amount),
                'variance_percent': float(v.variance_percent),
                'is_favorable': v.is_favorable,
                'is_significant': v.is_significant
            } for v in variances]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@wip_accounting_bp.route('/ledger/create-from-wo/<int:work_order_id>', methods=['POST'])
@jwt_required()
def create_wip_ledger_from_wo(work_order_id):
    """Create WIP Ledger from Work Order"""
    try:
        current_user_id = get_jwt_identity()
        
        work_order = WorkOrder.query.get_or_404(work_order_id)
        
        # Check if WIP Ledger already exists
        existing = WIPLedger.query.filter_by(work_order_id=work_order_id).first()
        if existing:
            return jsonify({'error': 'WIP Ledger already exists for this Work Order'}), 400
        
        # Get product
        product = Product.query.get(work_order.product_id)
        
        # Calculate standard costs from BOM
        from utils.costing_helper import calculate_standard_costs_from_bom
        
        standard_material, standard_labor, standard_overhead = calculate_standard_costs_from_bom(
            product_id=work_order.product_id,
            quantity=work_order.quantity
        )
        
        # Create WIP Ledger
        wip_ledger = WIPLedger(
            work_order_id=work_order.id,
            work_order_number=work_order.order_number,
            product_id=work_order.product_id,
            product_name=product.name if product else None,
            planned_quantity=work_order.quantity,
            standard_material_cost=standard_material,
            standard_labor_cost=standard_labor,
            standard_overhead_cost=standard_overhead,
            standard_total_cost=standard_material + standard_labor + standard_overhead,
            status='open',
            created_by=current_user_id
        )
        
        db.session.add(wip_ledger)
        db.session.commit()
        
        return jsonify({
            'message': 'WIP Ledger created',
            'wip_ledger_id': wip_ledger.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@wip_accounting_bp.route('/transaction', methods=['POST'])
@jwt_required()
def add_wip_transaction():
    """Add WIP Transaction (material, labor, overhead)"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        wip_ledger = WIPLedger.query.get_or_404(data['wip_ledger_id'])
        
        # Create transaction
        transaction = WIPTransaction(
            wip_ledger_id=wip_ledger.id,
            transaction_date=datetime.fromisoformat(data['transaction_date']),
            transaction_type=data['transaction_type'],
            transaction_number=data.get('transaction_number'),
            cost_category=data['cost_category'],
            quantity=data.get('quantity', 0),
            unit_cost=data.get('unit_cost', 0),
            total_cost=data['total_cost'],
            reference_type=data.get('reference_type'),
            reference_id=data.get('reference_id'),
            description=data.get('description'),
            notes=data.get('notes'),
            created_by=current_user_id
        )
        
        db.session.add(transaction)
        
        # Update WIP Ledger actual costs
        if data['cost_category'] == 'material':
            wip_ledger.actual_material_cost = float(wip_ledger.actual_material_cost) + float(data['total_cost'])
        elif data['cost_category'] == 'labor':
            wip_ledger.actual_labor_cost = float(wip_ledger.actual_labor_cost) + float(data['total_cost'])
        elif data['cost_category'] == 'overhead':
            wip_ledger.actual_overhead_cost = float(wip_ledger.actual_overhead_cost) + float(data['total_cost'])
        
        wip_ledger.actual_total_cost = (float(wip_ledger.actual_material_cost) + 
                                       float(wip_ledger.actual_labor_cost) + 
                                       float(wip_ledger.actual_overhead_cost))
        
        # Recalculate variances
        wip_ledger.calculate_variances()
        
        db.session.commit()
        
        # Auto-post to GL if enabled
        if data.get('auto_post_to_gl', False):
            post_wip_transaction_to_gl(transaction.id)
        
        return jsonify({
            'message': 'WIP Transaction added',
            'transaction_id': transaction.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@wip_accounting_bp.route('/transaction/<int:id>/post-to-gl', methods=['POST'])
@jwt_required()
def post_wip_transaction_to_gl(id):
    """Post WIP Transaction to General Ledger"""
    try:
        current_user_id = get_jwt_identity()
        
        transaction = WIPTransaction.query.get_or_404(id)
        
        if transaction.is_posted_to_gl:
            return jsonify({'error': 'Transaction already posted to GL'}), 400
        
        # Create GL Entry
        # WIP Inventory (Debit) / Material/Labor/Overhead (Credit)
        gl_entry = AccountingEntry(
            entry_date=transaction.transaction_date,
            description=f'WIP Transaction - {transaction.cost_category}',
            reference=transaction.transaction_number,
            entry_type='wip_transaction',
            status='posted',
            created_by=current_user_id,
            approved_by=current_user_id,
            approved_at=get_local_now()
        )
        
        db.session.add(gl_entry)
        db.session.flush()
        
        # Store journal lines using account configuration
        from utils.account_config import create_journal_entry_lines
        
        transaction_type = f'wip_{transaction.cost_category}'
        gl_entry.lines_data = create_journal_entry_lines(
            transaction_type=transaction_type,
            amount=float(transaction.total_cost),
            description=transaction.description
        )
        
        transaction.is_posted_to_gl = True
        transaction.gl_entry_id = gl_entry.id
        
        db.session.commit()
        
        return jsonify({
            'message': 'Transaction posted to GL',
            'gl_entry_id': gl_entry.id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@wip_accounting_bp.route('/variance/analyze/<int:wip_ledger_id>', methods=['POST'])
@jwt_required()
def analyze_variances(wip_ledger_id):
    """Analyze and record variances"""
    try:
        current_user_id = get_jwt_identity()
        
        wip_ledger = WIPLedger.query.get_or_404(wip_ledger_id)
        
        # Recalculate variances
        wip_ledger.calculate_variances()
        
        # Create variance records
        variance_types = [
            ('material', wip_ledger.standard_material_cost, wip_ledger.actual_material_cost, wip_ledger.material_variance),
            ('labor', wip_ledger.standard_labor_cost, wip_ledger.actual_labor_cost, wip_ledger.labor_variance),
            ('overhead', wip_ledger.standard_overhead_cost, wip_ledger.actual_overhead_cost, wip_ledger.overhead_variance),
            ('yield', 0, 0, wip_ledger.yield_variance)
        ]
        
        for var_type, standard, actual, variance in variance_types:
            # Check if variance record exists
            existing = WIPVariance.query.filter_by(
                wip_ledger_id=wip_ledger_id,
                variance_type=var_type
            ).first()
            
            if existing:
                existing.standard_amount = standard
                existing.actual_amount = actual
                existing.variance_amount = variance
                existing.calculate_variance()
            else:
                variance_record = WIPVariance(
                    wip_ledger_id=wip_ledger_id,
                    variance_type=var_type,
                    standard_amount=standard,
                    actual_amount=actual,
                    variance_amount=variance,
                    analyzed_by=current_user_id
                )
                variance_record.calculate_variance()
                db.session.add(variance_record)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Variances analyzed',
            'total_variance': float(wip_ledger.total_variance)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@wip_accounting_bp.route('/cogm/transfer', methods=['POST'])
@jwt_required()
def transfer_to_finished_goods():
    """Transfer WIP to Finished Goods (COGM)"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        wip_ledger = WIPLedger.query.get_or_404(data['wip_ledger_id'])
        
        # Generate transfer number
        transfer_number = generate_number('COGM', COGMTransfer, 'transfer_number')
        
        # Calculate unit cost
        quantity = float(data['quantity_transferred'])
        total_cost = float(wip_ledger.actual_total_cost)
        unit_cost = total_cost / quantity if quantity > 0 else 0
        
        # Create COGM Transfer
        cogm_transfer = COGMTransfer(
            transfer_number=transfer_number,
            transfer_date=get_local_now(),
            work_order_id=wip_ledger.work_order_id,
            wip_ledger_id=wip_ledger.id,
            product_id=wip_ledger.product_id,
            quantity_transferred=quantity,
            total_manufacturing_cost=total_cost,
            unit_cost=unit_cost,
            material_cost=wip_ledger.actual_material_cost,
            labor_cost=wip_ledger.actual_labor_cost,
            overhead_cost=wip_ledger.actual_overhead_cost,
            variance_absorbed=wip_ledger.total_variance,
            status='pending',
            created_by=current_user_id
        )
        
        db.session.add(cogm_transfer)
        db.session.flush()
        
        # Auto-post to GL: WIP → Finished Goods
        gl_entry = AccountingEntry(
            entry_date=get_local_now(),
            description=f'COGM Transfer - {transfer_number}',
            reference=transfer_number,
            entry_type='cogm_transfer',
            status='posted',
            created_by=current_user_id,
            approved_by=current_user_id,
            approved_at=get_local_now()
        )
        
        db.session.add(gl_entry)
        db.session.flush()
        
        # GL Entry: Finished Goods (Debit) / WIP Inventory (Credit)
        from utils.account_config import create_journal_entry_lines
        
        gl_entry.lines_data = create_journal_entry_lines(
            transaction_type='cogm',
            amount=float(total_cost),
            description=f'COGM from {wip_ledger.work_order_number}'
        )
        
        cogm_transfer.is_posted_to_gl = True
        cogm_transfer.gl_entry_id = gl_entry.id
        cogm_transfer.status = 'posted'
        
        # Update WIP Ledger
        wip_ledger.cogm_amount = total_cost
        wip_ledger.cogm_posted = True
        wip_ledger.cogm_posting_date = get_local_now()
        wip_ledger.cogm_entry_id = gl_entry.id
        wip_ledger.completed_quantity = quantity
        wip_ledger.status = 'completed'
        
        db.session.commit()
        
        return jsonify({
            'message': 'COGM transferred to Finished Goods',
            'transfer_id': cogm_transfer.id,
            'transfer_number': transfer_number,
            'gl_entry_id': gl_entry.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@wip_accounting_bp.route('/cogs/post', methods=['POST'])
@jwt_required()
def post_cogs():
    """Post COGS when product is sold"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Create COGS Posting
        cogs_posting = COGSPosting(
            sales_order_id=data.get('sales_order_id'),
            sales_order_number=data.get('sales_order_number'),
            invoice_id=data.get('invoice_id'),
            product_id=data['product_id'],
            quantity_sold=data['quantity_sold'],
            unit_cost=data['unit_cost'],
            total_cogs=float(data['quantity_sold']) * float(data['unit_cost']),
            unit_price=data.get('unit_price'),
            total_revenue=data.get('total_revenue'),
            created_by=current_user_id
        )
        
        cogs_posting.calculate_profit()
        
        db.session.add(cogs_posting)
        db.session.flush()
        
        # Auto-post to GL: COGS (Debit) / Finished Goods (Credit)
        gl_entry = AccountingEntry(
            entry_date=get_local_now(),
            description=f'COGS - SO {data.get("sales_order_number")}',
            reference=data.get('sales_order_number'),
            entry_type='cogs',
            status='posted',
            created_by=current_user_id,
            approved_by=current_user_id,
            approved_at=get_local_now()
        )
        
        db.session.add(gl_entry)
        db.session.flush()
        
        # GL Entry
        from utils.account_config import create_journal_entry_lines
        
        gl_entry.lines_data = create_journal_entry_lines(
            transaction_type='cogs',
            amount=float(cogs_posting.total_cogs),
            description=f'COGS for {data.get("sales_order_number")}'
        )
        
        cogs_posting.is_posted_to_gl = True
        cogs_posting.gl_entry_id = gl_entry.id
        cogs_posting.posting_date = get_local_now()
        
        db.session.commit()
        
        return jsonify({
            'message': 'COGS posted',
            'cogs_posting_id': cogs_posting.id,
            'gl_entry_id': gl_entry.id,
            'gross_profit': float(cogs_posting.gross_profit) if cogs_posting.gross_profit else 0
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@wip_accounting_bp.route('/auto-create/<int:work_order_id>', methods=['POST'])
@jwt_required()
def auto_create_wip_ledger(work_order_id):
    """
    Manually trigger WIP Ledger creation from Work Order
    This is also auto-triggered when Work Order status changes to 'in_progress'
    """
    try:
        from utils.production_events import create_wip_ledger_from_work_order
        
        wip_ledger = create_wip_ledger_from_work_order(work_order_id)
        
        return jsonify({
            'message': 'WIP Ledger created successfully',
            'wip_ledger_id': wip_ledger.id,
            'work_order_number': wip_ledger.work_order_number,
            'total_standard_cost': float(wip_ledger.total_standard_cost)
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@wip_accounting_bp.route('/auto-close/<int:work_order_id>', methods=['POST'])
@jwt_required()
def auto_close_wip_ledger(work_order_id):
    """
    Manually trigger WIP Ledger closure from Work Order
    This is also auto-triggered when Work Order status changes to 'completed'
    """
    try:
        from utils.production_events import close_wip_ledger_from_work_order
        
        wip_ledger = close_wip_ledger_from_work_order(work_order_id)
        
        return jsonify({
            'message': 'WIP Ledger closed successfully',
            'wip_ledger_id': wip_ledger.id,
            'work_order_number': wip_ledger.work_order_number,
            'status': wip_ledger.status
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@wip_accounting_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_wip_dashboard():
    """Get WIP Accounting dashboard statistics"""
    try:
        # Total WIP value
        total_wip = db.session.query(func.sum(WIPLedger.actual_total_cost)).filter_by(status='open').scalar() or 0
        
        # Total variances
        total_variance = db.session.query(func.sum(WIPLedger.total_variance)).scalar() or 0
        
        # Open work orders with WIP
        open_wip_count = WIPLedger.query.filter_by(status='open').count()
        
        # Completed but not transferred
        completed_count = WIPLedger.query.filter_by(status='completed', cogm_posted=False).count()
        
        # Significant variances
        significant_variances = WIPVariance.query.filter_by(is_significant=True).count()
        
        return jsonify({
            'statistics': {
                'total_wip_value': float(total_wip),
                'total_variance': float(total_variance),
                'open_wip_count': open_wip_count,
                'completed_not_transferred': completed_count,
                'significant_variances': significant_variances
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
