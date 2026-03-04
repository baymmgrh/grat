"""
Approval Workflow Routes
Handles multi-level approval process with review and edit capabilities
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.approval_workflow import ApprovalWorkflow, ApprovalHistory, ApprovalConfiguration, PendingJournalEntry
from models.user import User
from models.finance import AccountingEntry
from datetime import datetime
from sqlalchemy import or_, and_
from utils.timezone import get_local_now, get_local_today

approval_bp = Blueprint('approval', __name__, url_prefix='/api/approval')


@approval_bp.route('/workflows', methods=['GET'])
@jwt_required()
def get_workflows():
    """Get approval workflows with filtering"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # Query parameters
        status = request.args.get('status')
        transaction_type = request.args.get('transaction_type')
        my_tasks = request.args.get('my_tasks', 'false').lower() == 'true'
        
        query = ApprovalWorkflow.query
        
        # Filter by status
        if status:
            query = query.filter_by(status=status)
        
        # Filter by transaction type
        if transaction_type:
            query = query.filter_by(transaction_type=transaction_type)
        
        # Filter by user's tasks
        if my_tasks:
            # Show workflows where user is reviewer or approver based on current step
            if user.role in ['production_manager', 'warehouse_manager']:
                query = query.filter(
                    or_(
                        and_(ApprovalWorkflow.status == 'pending_review', ApprovalWorkflow.reviewer_id == None),
                        ApprovalWorkflow.reviewer_id == current_user_id
                    )
                )
            elif user.role in ['finance', 'accounting', 'finance_manager']:
                query = query.filter(
                    or_(
                        and_(ApprovalWorkflow.status == 'pending_approval', ApprovalWorkflow.approver_id == None),
                        ApprovalWorkflow.approver_id == current_user_id
                    )
                )
        
        workflows = query.order_by(ApprovalWorkflow.created_at.desc()).all()
        
        return jsonify({
            'workflows': [{
                'id': w.id,
                'transaction_type': w.transaction_type,
                'transaction_id': w.transaction_id,
                'transaction_number': w.transaction_number,
                'status': w.status,
                'current_step': w.current_step,
                'submitted_by': w.submitter.username if w.submitter else None,
                'submitted_at': w.submitted_at.isoformat() if w.submitted_at else None,
                'reviewer': w.reviewer.username if w.reviewer else None,
                'reviewed_at': w.reviewed_at.isoformat() if w.reviewed_at else None,
                'approver': w.approver.username if w.approver else None,
                'approved_at': w.approved_at.isoformat() if w.approved_at else None,
                'created_at': w.created_at.isoformat()
            } for w in workflows]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@approval_bp.route('/workflows/<int:workflow_id>', methods=['GET'])
@jwt_required()
def get_workflow_detail(workflow_id):
    """Get workflow detail with history"""
    try:
        workflow = ApprovalWorkflow.query.get_or_404(workflow_id)
        
        # Get history
        history = ApprovalHistory.query.filter_by(workflow_id=workflow_id).order_by(ApprovalHistory.action_at.desc()).all()
        
        # Get pending journal entry if exists
        pending_journal = PendingJournalEntry.query.filter_by(workflow_id=workflow_id).first()
        
        return jsonify({
            'workflow': {
                'id': workflow.id,
                'transaction_type': workflow.transaction_type,
                'transaction_id': workflow.transaction_id,
                'transaction_number': workflow.transaction_number,
                'status': workflow.status,
                'current_step': workflow.current_step,
                'submitted_by': workflow.submitter.username if workflow.submitter else None,
                'submitted_at': workflow.submitted_at.isoformat() if workflow.submitted_at else None,
                'reviewer_id': workflow.reviewer_id,
                'reviewer': workflow.reviewer.username if workflow.reviewer else None,
                'reviewed_at': workflow.reviewed_at.isoformat() if workflow.reviewed_at else None,
                'review_notes': workflow.review_notes,
                'review_changes': workflow.review_changes,
                'approver_id': workflow.approver_id,
                'approver': workflow.approver.username if workflow.approver else None,
                'approved_at': workflow.approved_at.isoformat() if workflow.approved_at else None,
                'approval_notes': workflow.approval_notes,
                'rejected_by': workflow.rejector.username if workflow.rejector else None,
                'rejected_at': workflow.rejected_at.isoformat() if workflow.rejected_at else None,
                'rejection_reason': workflow.rejection_reason,
                'journal_entry_id': workflow.journal_entry_id,
                'created_at': workflow.created_at.isoformat()
            },
            'history': [{
                'id': h.id,
                'action': h.action,
                'action_by': h.actor.username if h.actor else None,
                'action_at': h.action_at.isoformat(),
                'old_status': h.old_status,
                'new_status': h.new_status,
                'notes': h.notes,
                'changes': h.changes
            } for h in history],
            'pending_journal': {
                'entry_date': pending_journal.entry_date.isoformat() if pending_journal else None,
                'description': pending_journal.description if pending_journal else None,
                'lines': pending_journal.lines if pending_journal else None,
                'total_debit': float(pending_journal.total_debit) if pending_journal else 0,
                'total_credit': float(pending_journal.total_credit) if pending_journal else 0
            } if pending_journal else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@approval_bp.route('/workflows', methods=['POST'])
@jwt_required()
def create_workflow():
    """Create new approval workflow"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Create workflow
        workflow = ApprovalWorkflow(
            transaction_type=data['transaction_type'],
            transaction_id=data['transaction_id'],
            transaction_number=data.get('transaction_number'),
            status='draft',
            submitted_by=current_user_id
        )
        
        db.session.add(workflow)
        db.session.flush()
        
        # Create history entry
        history = ApprovalHistory(
            workflow_id=workflow.id,
            action='create',
            action_by=current_user_id,
            old_status=None,
            new_status='draft',
            notes='Workflow created'
        )
        db.session.add(history)
        
        # Create pending journal entry if provided
        if 'journal_entry' in data:
            je_data = data['journal_entry']
            pending_journal = PendingJournalEntry(
                workflow_id=workflow.id,
                entry_date=datetime.strptime(je_data['entry_date'], '%Y-%m-%d').date(),
                description=je_data.get('description'),
                reference=je_data.get('reference'),
                lines=je_data['lines'],
                total_debit=sum(line.get('debit', 0) for line in je_data['lines']),
                total_credit=sum(line.get('credit', 0) for line in je_data['lines']),
                created_by=current_user_id
            )
            db.session.add(pending_journal)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Workflow created successfully',
            'workflow_id': workflow.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@approval_bp.route('/workflows/<int:workflow_id>/submit', methods=['POST'])
@jwt_required()
def submit_for_review(workflow_id):
    """Submit workflow for review"""
    try:
        current_user_id = get_jwt_identity()
        workflow = ApprovalWorkflow.query.get_or_404(workflow_id)
        
        # Check if user is the submitter
        if workflow.submitted_by != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Update workflow
        old_status = workflow.status
        workflow.status = 'pending_review'
        workflow.current_step = 'review'
        workflow.submitted_at = get_local_now()
        
        # Create history
        history = ApprovalHistory(
            workflow_id=workflow_id,
            action='submit',
            action_by=current_user_id,
            old_status=old_status,
            new_status='pending_review',
            notes='Submitted for review'
        )
        db.session.add(history)
        
        db.session.commit()
        
        return jsonify({'message': 'Workflow submitted for review'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@approval_bp.route('/workflows/<int:workflow_id>/review', methods=['POST'])
@jwt_required()
def review_workflow(workflow_id):
    """Review workflow (Manager Production) - can edit data"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        data = request.get_json()
        
        # Check if user has reviewer role
        if user.role not in ['production_manager', 'warehouse_manager', 'admin']:
            return jsonify({'error': 'Unauthorized - Reviewer role required'}), 403
        
        workflow = ApprovalWorkflow.query.get_or_404(workflow_id)
        
        # Check if workflow is in pending_review status
        if workflow.status != 'pending_review':
            return jsonify({'error': 'Workflow is not pending review'}), 400
        
        # Update workflow
        old_status = workflow.status
        workflow.reviewer_id = current_user_id
        workflow.reviewed_at = get_local_now()
        workflow.review_notes = data.get('notes')
        workflow.review_changes = data.get('changes')  # Track what was edited
        workflow.status = 'pending_approval'
        workflow.current_step = 'approval'
        
        # Create history
        history = ApprovalHistory(
            workflow_id=workflow_id,
            action='review',
            action_by=current_user_id,
            old_status=old_status,
            new_status='pending_approval',
            notes=data.get('notes'),
            changes=data.get('changes')
        )
        db.session.add(history)
        
        # Update pending journal entry if changes provided
        if 'journal_changes' in data:
            pending_journal = PendingJournalEntry.query.filter_by(workflow_id=workflow_id).first()
            if pending_journal:
                je_changes = data['journal_changes']
                if 'lines' in je_changes:
                    pending_journal.lines = je_changes['lines']
                    pending_journal.total_debit = sum(line.get('debit', 0) for line in je_changes['lines'])
                    pending_journal.total_credit = sum(line.get('credit', 0) for line in je_changes['lines'])
                if 'description' in je_changes:
                    pending_journal.description = je_changes['description']
        
        db.session.commit()
        
        return jsonify({'message': 'Workflow reviewed and submitted for approval'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@approval_bp.route('/workflows/<int:workflow_id>/approve', methods=['POST'])
@jwt_required()
def approve_workflow(workflow_id):
    """Approve workflow (Finance/Accounting) - creates journal entry"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        data = request.get_json()
        
        # Check if user has approver role
        if user.role not in ['finance', 'accounting', 'finance_manager', 'admin']:
            return jsonify({'error': 'Unauthorized - Finance/Accounting role required'}), 403
        
        workflow = ApprovalWorkflow.query.get_or_404(workflow_id)
        
        # Check if workflow is in pending_approval status
        if workflow.status != 'pending_approval':
            return jsonify({'error': 'Workflow is not pending approval'}), 400
        
        # Update workflow
        old_status = workflow.status
        workflow.approver_id = current_user_id
        workflow.approved_at = get_local_now()
        workflow.approval_notes = data.get('notes')
        workflow.status = 'approved'
        workflow.current_step = 'completed'
        
        # Create journal entry from pending
        pending_journal = PendingJournalEntry.query.filter_by(workflow_id=workflow_id).first()
        if pending_journal:
            journal_entry = AccountingEntry(
                entry_date=pending_journal.entry_date,
                description=pending_journal.description,
                reference=pending_journal.reference,
                entry_type='journal',
                status='posted',
                created_by=current_user_id,
                approved_by=current_user_id,
                approved_at=get_local_now()
            )
            db.session.add(journal_entry)
            db.session.flush()
            
            # Add journal lines (simplified - store in JSON for now)
            # TODO: Create proper AccountingEntryLine model if needed
            journal_entry.lines_data = pending_journal.lines  # Store as JSON
            
            workflow.journal_entry_id = journal_entry.id
        
        # Create history
        history = ApprovalHistory(
            workflow_id=workflow_id,
            action='approve',
            action_by=current_user_id,
            old_status=old_status,
            new_status='approved',
            notes=data.get('notes')
        )
        db.session.add(history)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Workflow approved and journal entry created',
            'journal_entry_id': workflow.journal_entry_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@approval_bp.route('/workflows/<int:workflow_id>/reject', methods=['POST'])
@jwt_required()
def reject_workflow(workflow_id):
    """Reject workflow"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        data = request.get_json()
        
        workflow = ApprovalWorkflow.query.get_or_404(workflow_id)
        
        # Check authorization
        if workflow.status == 'pending_review' and user.role not in ['production_manager', 'warehouse_manager', 'admin']:
            return jsonify({'error': 'Unauthorized'}), 403
        elif workflow.status == 'pending_approval' and user.role not in ['finance', 'accounting', 'finance_manager', 'admin']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Update workflow
        old_status = workflow.status
        workflow.rejected_by = current_user_id
        workflow.rejected_at = get_local_now()
        workflow.rejection_reason = data.get('reason')
        workflow.status = 'rejected'
        
        # Create history
        history = ApprovalHistory(
            workflow_id=workflow_id,
            action='reject',
            action_by=current_user_id,
            old_status=old_status,
            new_status='rejected',
            notes=data.get('reason')
        )
        db.session.add(history)
        
        db.session.commit()
        
        return jsonify({'message': 'Workflow rejected'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@approval_bp.route('/configurations', methods=['GET'])
@jwt_required()
def get_configurations():
    """Get approval configurations"""
    try:
        configs = ApprovalConfiguration.query.filter_by(is_active=True).all()
        
        return jsonify({
            'configurations': [{
                'id': c.id,
                'transaction_type': c.transaction_type,
                'require_review': c.require_review,
                'require_approval': c.require_approval,
                'allow_reviewer_edit': c.allow_reviewer_edit,
                'allow_approver_edit': c.allow_approver_edit,
                'reviewer_roles': c.reviewer_roles,
                'approver_roles': c.approver_roles,
                'auto_create_journal': c.auto_create_journal,
                'amount_threshold': float(c.amount_threshold) if c.amount_threshold else None
            } for c in configs]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@approval_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """Get approval dashboard statistics"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # Count workflows by status
        pending_review = ApprovalWorkflow.query.filter_by(status='pending_review').count()
        pending_approval = ApprovalWorkflow.query.filter_by(status='pending_approval').count()
        approved = ApprovalWorkflow.query.filter_by(status='approved').count()
        rejected = ApprovalWorkflow.query.filter_by(status='rejected').count()
        
        # My pending tasks
        my_pending = 0
        if user.role in ['production_manager', 'warehouse_manager']:
            my_pending = ApprovalWorkflow.query.filter_by(status='pending_review').count()
        elif user.role in ['finance', 'accounting', 'finance_manager']:
            my_pending = ApprovalWorkflow.query.filter_by(status='pending_approval').count()
        
        return jsonify({
            'statistics': {
                'pending_review': pending_review,
                'pending_approval': pending_approval,
                'approved': approved,
                'rejected': rejected,
                'my_pending': my_pending
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
