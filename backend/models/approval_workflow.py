"""
Approval Workflow Models
Handles multi-level approval process with review and edit capabilities
"""
from datetime import datetime
from models import db
from sqlalchemy.dialects.postgresql import JSON

class ApprovalWorkflow(db.Model):
    """Main approval workflow tracking"""
    __tablename__ = 'approval_workflows'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Transaction Reference
    transaction_type = db.Column(db.String(50), nullable=False)  # sales_order, purchase_order, production, etc
    transaction_id = db.Column(db.Integer, nullable=False)
    transaction_number = db.Column(db.String(100))
    
    # Workflow Status
    status = db.Column(db.String(50), default='draft')  # draft, pending_review, pending_approval, approved, rejected
    current_step = db.Column(db.String(50))  # review, approval
    
    # Submitter
    submitted_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    submitted_at = db.Column(db.DateTime)
    
    # Reviewer (Manager Production)
    reviewer_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    reviewed_at = db.Column(db.DateTime)
    review_notes = db.Column(db.Text)
    review_changes = db.Column(JSON)  # Track what was edited during review
    
    # Approver (Finance/Accounting)
    approver_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime)
    approval_notes = db.Column(db.Text)
    
    # Rejection
    rejected_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    rejected_at = db.Column(db.DateTime)
    rejection_reason = db.Column(db.Text)
    
    # Journal Entry Reference (after approval)
    journal_entry_id = db.Column(db.Integer, db.ForeignKey('accounting_entries.id'), nullable=True)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    submitter = db.relationship('User', foreign_keys=[submitted_by], backref='submitted_workflows')
    reviewer = db.relationship('User', foreign_keys=[reviewer_id], backref='reviewed_workflows')
    approver = db.relationship('User', foreign_keys=[approver_id], backref='approved_workflows')
    rejector = db.relationship('User', foreign_keys=[rejected_by], backref='rejected_workflows')
    history = db.relationship('ApprovalHistory', backref='workflow', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<ApprovalWorkflow {self.transaction_type}:{self.transaction_number} - {self.status}>'


class ApprovalHistory(db.Model):
    """Track all approval actions and changes"""
    __tablename__ = 'approval_history'
    
    id = db.Column(db.Integer, primary_key=True)
    workflow_id = db.Column(db.Integer, db.ForeignKey('approval_workflows.id'), nullable=False)
    
    # Action Details
    action = db.Column(db.String(50), nullable=False)  # submit, review, edit, approve, reject, return
    action_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Previous and New Status
    old_status = db.Column(db.String(50))
    new_status = db.Column(db.String(50))
    
    # Notes and Changes
    notes = db.Column(db.Text)
    changes = db.Column(JSON)  # What was changed (for edit actions)
    
    # Relationships
    actor = db.relationship('User', foreign_keys=[action_by])
    
    def __repr__(self):
        return f'<ApprovalHistory {self.action} by {self.action_by}>'


class ApprovalConfiguration(db.Model):
    """Configuration for approval workflows per transaction type"""
    __tablename__ = 'approval_configurations'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Transaction Type
    transaction_type = db.Column(db.String(50), unique=True, nullable=False)
    
    # Approval Settings
    require_review = db.Column(db.Boolean, default=True)
    require_approval = db.Column(db.Boolean, default=True)
    allow_reviewer_edit = db.Column(db.Boolean, default=True)
    allow_approver_edit = db.Column(db.Boolean, default=False)
    
    # Role Requirements
    reviewer_roles = db.Column(JSON)  # ['production_manager', 'warehouse_manager']
    approver_roles = db.Column(JSON)  # ['finance', 'accounting', 'finance_manager']
    
    # Auto-create Journal Entry
    auto_create_journal = db.Column(db.Boolean, default=True)
    
    # Thresholds (optional)
    amount_threshold = db.Column(db.Numeric(15, 2))  # Require approval if amount > threshold
    
    # Active Status
    is_active = db.Column(db.Boolean, default=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<ApprovalConfiguration {self.transaction_type}>'


class PendingJournalEntry(db.Model):
    """Temporary storage for journal entries pending approval"""
    __tablename__ = 'pending_journal_entries'
    
    id = db.Column(db.Integer, primary_key=True)
    workflow_id = db.Column(db.Integer, db.ForeignKey('approval_workflows.id'), nullable=False)
    
    # Journal Entry Data (will be created after approval)
    entry_date = db.Column(db.Date, nullable=False)
    description = db.Column(db.Text)
    reference = db.Column(db.String(100))
    
    # Journal Lines
    lines = db.Column(JSON, nullable=False)  # Array of {account_id, debit, credit, description}
    
    # Totals
    total_debit = db.Column(db.Numeric(15, 2), default=0)
    total_credit = db.Column(db.Numeric(15, 2), default=0)
    
    # Metadata
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    workflow = db.relationship('ApprovalWorkflow', backref='pending_journal')
    creator = db.relationship('User')
    
    def __repr__(self):
        return f'<PendingJournalEntry for Workflow {self.workflow_id}>'
