"""
WIP (Work in Progress) Accounting Models
Handles manufacturing cost accounting with variance tracking
"""
from datetime import datetime
from models import db
from sqlalchemy.dialects.postgresql import JSON

class WIPLedger(db.Model):
    """WIP Ledger per Work Order - tracks all manufacturing costs"""
    __tablename__ = 'wip_ledger'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Work Order Reference
    work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=False)
    work_order_number = db.Column(db.String(50))
    
    # Product Info
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'))
    product_name = db.Column(db.String(200))
    
    # Quantities
    planned_quantity = db.Column(db.Numeric(15, 4), default=0)
    actual_quantity = db.Column(db.Numeric(15, 4), default=0)
    completed_quantity = db.Column(db.Numeric(15, 4), default=0)
    
    # Standard Costs (from BOM/routing)
    standard_material_cost = db.Column(db.Numeric(15, 2), default=0)
    standard_labor_cost = db.Column(db.Numeric(15, 2), default=0)
    standard_overhead_cost = db.Column(db.Numeric(15, 2), default=0)
    standard_total_cost = db.Column(db.Numeric(15, 2), default=0)
    
    # Actual Costs (accumulated)
    actual_material_cost = db.Column(db.Numeric(15, 2), default=0)
    actual_labor_cost = db.Column(db.Numeric(15, 2), default=0)
    actual_overhead_cost = db.Column(db.Numeric(15, 2), default=0)
    actual_total_cost = db.Column(db.Numeric(15, 2), default=0)
    
    # Variances (Actual - Standard)
    material_variance = db.Column(db.Numeric(15, 2), default=0)
    labor_variance = db.Column(db.Numeric(15, 2), default=0)
    overhead_variance = db.Column(db.Numeric(15, 2), default=0)
    yield_variance = db.Column(db.Numeric(15, 2), default=0)  # Due to quantity difference
    total_variance = db.Column(db.Numeric(15, 2), default=0)
    
    # Status
    status = db.Column(db.String(50), default='open')  # open, completed, closed
    
    # GL Posting Status
    is_posted_to_gl = db.Column(db.Boolean, default=False)
    gl_posting_date = db.Column(db.DateTime)
    gl_entry_id = db.Column(db.Integer, db.ForeignKey('accounting_entries.id'))
    
    # COGM (Cost of Goods Manufactured) Transfer
    cogm_amount = db.Column(db.Numeric(15, 2), default=0)
    cogm_posted = db.Column(db.Boolean, default=False)
    cogm_posting_date = db.Column(db.DateTime)
    cogm_entry_id = db.Column(db.Integer, db.ForeignKey('accounting_entries.id'))
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Relationships
    work_order = db.relationship('WorkOrder', backref='wip_ledger')
    product = db.relationship('Product')
    transactions = db.relationship('WIPTransaction', backref='wip_ledger', lazy='dynamic', cascade='all, delete-orphan')
    variances = db.relationship('WIPVariance', backref='wip_ledger', lazy='dynamic', cascade='all, delete-orphan')
    
    def calculate_variances(self):
        """Calculate all variances"""
        self.material_variance = float(self.actual_material_cost) - float(self.standard_material_cost)
        self.labor_variance = float(self.actual_labor_cost) - float(self.standard_labor_cost)
        self.overhead_variance = float(self.actual_overhead_cost) - float(self.standard_overhead_cost)
        
        # Yield variance: cost impact of quantity difference
        if float(self.planned_quantity) > 0:
            standard_unit_cost = float(self.standard_total_cost) / float(self.planned_quantity)
            quantity_diff = float(self.actual_quantity) - float(self.planned_quantity)
            self.yield_variance = quantity_diff * standard_unit_cost
        
        self.total_variance = (self.material_variance + self.labor_variance + 
                              self.overhead_variance + self.yield_variance)
    
    def __repr__(self):
        return f'<WIPLedger WO:{self.work_order_number} - {self.status}>'


class WIPTransaction(db.Model):
    """Individual WIP transactions (material issues, labor, overhead)"""
    __tablename__ = 'wip_transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    wip_ledger_id = db.Column(db.Integer, db.ForeignKey('wip_ledger.id'), nullable=False)
    
    # Transaction Details
    transaction_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    transaction_type = db.Column(db.String(50), nullable=False)  # material, labor, overhead, adjustment
    transaction_number = db.Column(db.String(50))
    
    # Cost Category
    cost_category = db.Column(db.String(50), nullable=False)  # material, labor, overhead
    
    # Amounts
    quantity = db.Column(db.Numeric(15, 4), default=0)
    unit_cost = db.Column(db.Numeric(15, 2), default=0)
    total_cost = db.Column(db.Numeric(15, 2), nullable=False)
    
    # Reference
    reference_type = db.Column(db.String(50))  # material_issue, timesheet, overhead_allocation
    reference_id = db.Column(db.Integer)
    
    # Description
    description = db.Column(db.Text)
    notes = db.Column(db.Text)
    
    # GL Posting
    is_posted_to_gl = db.Column(db.Boolean, default=False)
    gl_entry_id = db.Column(db.Integer, db.ForeignKey('accounting_entries.id'))
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    def __repr__(self):
        return f'<WIPTransaction {self.transaction_type}: {self.total_cost}>'


class WIPVariance(db.Model):
    """Variance analysis per Work Order"""
    __tablename__ = 'wip_variances'
    
    id = db.Column(db.Integer, primary_key=True)
    wip_ledger_id = db.Column(db.Integer, db.ForeignKey('wip_ledger.id'), nullable=False)
    
    # Variance Type
    variance_type = db.Column(db.String(50), nullable=False)  # material, labor, overhead, yield
    
    # Variance Details
    standard_amount = db.Column(db.Numeric(15, 2), default=0)
    actual_amount = db.Column(db.Numeric(15, 2), default=0)
    variance_amount = db.Column(db.Numeric(15, 2), default=0)
    variance_percent = db.Column(db.Numeric(10, 2), default=0)
    
    # Breakdown (for detailed analysis)
    variance_breakdown = db.Column(JSON)  # {price_variance, quantity_variance, efficiency_variance}
    
    # Status
    is_favorable = db.Column(db.Boolean)  # True if variance is favorable (actual < standard)
    is_significant = db.Column(db.Boolean, default=False)  # True if exceeds threshold
    threshold_percent = db.Column(db.Numeric(10, 2), default=5.0)
    
    # Analysis
    root_cause = db.Column(db.Text)
    corrective_action = db.Column(db.Text)
    responsible_person = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # GL Posting
    is_posted_to_gl = db.Column(db.Boolean, default=False)
    gl_entry_id = db.Column(db.Integer, db.ForeignKey('accounting_entries.id'))
    
    # Metadata
    analysis_date = db.Column(db.DateTime, default=datetime.utcnow)
    analyzed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def calculate_variance(self):
        """Calculate variance amount and percentage"""
        self.variance_amount = float(self.actual_amount) - float(self.standard_amount)
        
        if float(self.standard_amount) != 0:
            self.variance_percent = (self.variance_amount / float(self.standard_amount)) * 100
        
        # Favorable if actual < standard (cost savings)
        self.is_favorable = self.variance_amount < 0
        
        # Significant if exceeds threshold
        self.is_significant = abs(self.variance_percent) > float(self.threshold_percent)
    
    def __repr__(self):
        return f'<WIPVariance {self.variance_type}: {self.variance_amount}>'


class COGMTransfer(db.Model):
    """Cost of Goods Manufactured Transfer (WIP → Finished Goods)"""
    __tablename__ = 'cogm_transfers'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Transfer Details
    transfer_number = db.Column(db.String(50), unique=True, nullable=False)
    transfer_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Work Order Reference
    work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=False)
    wip_ledger_id = db.Column(db.Integer, db.ForeignKey('wip_ledger.id'), nullable=False)
    
    # Product Info
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    
    # Quantities
    quantity_transferred = db.Column(db.Numeric(15, 4), nullable=False)
    
    # Costs
    total_manufacturing_cost = db.Column(db.Numeric(15, 2), nullable=False)  # Total WIP cost
    unit_cost = db.Column(db.Numeric(15, 2), nullable=False)  # Cost per unit
    
    # Cost Breakdown
    material_cost = db.Column(db.Numeric(15, 2), default=0)
    labor_cost = db.Column(db.Numeric(15, 2), default=0)
    overhead_cost = db.Column(db.Numeric(15, 2), default=0)
    variance_absorbed = db.Column(db.Numeric(15, 2), default=0)  # Variance included in FG cost
    
    # GL Posting
    is_posted_to_gl = db.Column(db.Boolean, default=False)
    gl_entry_id = db.Column(db.Integer, db.ForeignKey('accounting_entries.id'))
    
    # Inventory Update
    inventory_updated = db.Column(db.Boolean, default=False)
    inventory_movement_id = db.Column(db.Integer)
    
    # Status
    status = db.Column(db.String(50), default='pending')  # pending, posted, completed
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime)
    
    # Relationships
    work_order = db.relationship('WorkOrder')
    wip_ledger = db.relationship('WIPLedger')
    product = db.relationship('Product')
    
    def __repr__(self):
        return f'<COGMTransfer {self.transfer_number}: {self.quantity_transferred} units>'


class COGSPosting(db.Model):
    """Cost of Goods Sold Posting (FG → COGS when sold)"""
    __tablename__ = 'cogs_postings'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Sales Reference
    sales_order_id = db.Column(db.Integer, db.ForeignKey('sales_orders.id'))
    sales_order_number = db.Column(db.String(50))
    invoice_id = db.Column(db.Integer)
    
    # Product Info
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    
    # Quantities & Costs
    quantity_sold = db.Column(db.Numeric(15, 4), nullable=False)
    unit_cost = db.Column(db.Numeric(15, 2), nullable=False)  # From FG inventory
    total_cogs = db.Column(db.Numeric(15, 2), nullable=False)
    
    # Sales Info
    unit_price = db.Column(db.Numeric(15, 2))
    total_revenue = db.Column(db.Numeric(15, 2))
    gross_profit = db.Column(db.Numeric(15, 2))
    gross_margin_percent = db.Column(db.Numeric(10, 2))
    
    # GL Posting
    is_posted_to_gl = db.Column(db.Boolean, default=False)
    gl_entry_id = db.Column(db.Integer, db.ForeignKey('accounting_entries.id'))
    posting_date = db.Column(db.DateTime)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Relationships
    product = db.relationship('Product')
    
    def calculate_profit(self):
        """Calculate gross profit and margin"""
        if self.total_revenue and self.total_cogs:
            self.gross_profit = float(self.total_revenue) - float(self.total_cogs)
            
            if float(self.total_revenue) != 0:
                self.gross_margin_percent = (self.gross_profit / float(self.total_revenue)) * 100
    
    def __repr__(self):
        return f'<COGSPosting SO:{self.sales_order_number} - {self.total_cogs}>'
