from datetime import datetime
from . import db

class CostCenter(db.Model):
    __tablename__ = 'cost_centers'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Invoice(db.Model):
    __tablename__ = 'invoices'
    
    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    invoice_type = db.Column(db.String(50), nullable=False)  # sales, purchase, production_cost
    invoice_date = db.Column(db.Date, nullable=False, index=True)
    due_date = db.Column(db.Date, nullable=True)
    sales_order_id = db.Column(db.Integer, db.ForeignKey('sales_orders.id'), nullable=True)
    purchase_order_id = db.Column(db.Integer, db.ForeignKey('purchase_orders.id'), nullable=True)
    work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=True)
    production_approval_id = db.Column(db.Integer, db.ForeignKey('production_approvals.id'), nullable=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='draft')  # draft, sent, partial, paid, overdue, cancelled
    currency = db.Column(db.String(10), nullable=False, default='IDR')
    exchange_rate = db.Column(db.Numeric(15, 6), default=1)
    subtotal = db.Column(db.Numeric(15, 2), default=0)
    tax_amount = db.Column(db.Numeric(15, 2), default=0)
    discount_amount = db.Column(db.Numeric(15, 2), default=0)
    total_amount = db.Column(db.Numeric(15, 2), default=0)
    paid_amount = db.Column(db.Numeric(15, 2), default=0)
    balance_due = db.Column(db.Numeric(15, 2), default=0)
    payment_terms = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sales_order = db.relationship('SalesOrder', back_populates='invoices')
    purchase_order = db.relationship('PurchaseOrder')
    customer = db.relationship('Customer')
    supplier = db.relationship('Supplier')
    items = db.relationship('InvoiceItem', back_populates='invoice', cascade='all, delete-orphan')
    payments = db.relationship('Payment', back_populates='invoice')
    created_by_user = db.relationship('User')

class InvoiceItem(db.Model):
    __tablename__ = 'invoice_items'
    
    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id', ondelete='CASCADE'), nullable=False)
    line_number = db.Column(db.Integer, nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    description = db.Column(db.Text, nullable=False)
    quantity = db.Column(db.Numeric(15, 2), nullable=False)
    uom = db.Column(db.String(20), nullable=True)
    unit_price = db.Column(db.Numeric(15, 2), nullable=False)
    discount_percent = db.Column(db.Numeric(5, 2), default=0)
    discount_amount = db.Column(db.Numeric(15, 2), default=0)
    tax_percent = db.Column(db.Numeric(5, 2), default=0)
    tax_amount = db.Column(db.Numeric(15, 2), default=0)
    total_amount = db.Column(db.Numeric(15, 2), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    invoice = db.relationship('Invoice', back_populates='items')
    product = db.relationship('Product')
    
    __table_args__ = (
        db.UniqueConstraint('invoice_id', 'line_number', name='unique_invoice_line'),
    )

class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    payment_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    payment_date = db.Column(db.Date, nullable=False, index=True)
    payment_type = db.Column(db.String(50), nullable=False)  # receipt, payment
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'), nullable=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=True)
    payment_method = db.Column(db.String(50), nullable=False)  # cash, bank_transfer, check, credit_card
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    currency = db.Column(db.String(10), nullable=False, default='IDR')
    exchange_rate = db.Column(db.Numeric(15, 6), default=1)
    reference_number = db.Column(db.String(100), nullable=True)
    bank_account = db.Column(db.String(200), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='pending')  # pending, cleared, bounced, cancelled
    notes = db.Column(db.Text, nullable=True)
    received_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    invoice = db.relationship('Invoice', back_populates='payments')
    customer = db.relationship('Customer')
    supplier = db.relationship('Supplier')
    received_by_user = db.relationship('User')

class Account(db.Model):
    __tablename__ = 'accounts'
    
    id = db.Column(db.Integer, primary_key=True)
    account_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    account_name = db.Column(db.String(200), nullable=False)
    account_type = db.Column(db.String(50), nullable=False)  # asset, liability, equity, revenue, expense
    parent_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=True)
    level = db.Column(db.Integer, default=1)
    is_active = db.Column(db.Boolean, default=True)
    is_header = db.Column(db.Boolean, default=False)
    normal_balance = db.Column(db.String(10), nullable=False)  # debit, credit
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Self-referential relationship
    children = db.relationship('Account', backref=db.backref('parent', remote_side=[id]))
    
    @property
    def balance(self):
        """Calculate account balance from accounting entries"""
        entries = AccountingEntry.query.filter_by(account_code=self.account_code, status='posted').all()
        debit_total = sum(float(entry.debit_amount or 0) for entry in entries)
        credit_total = sum(float(entry.credit_amount or 0) for entry in entries)
        
        if self.normal_balance == 'debit':
            return debit_total - credit_total
        else:
            return credit_total - debit_total

class Budget(db.Model):
    __tablename__ = 'budgets'
    
    id = db.Column(db.Integer, primary_key=True)
    budget_name = db.Column(db.String(200), nullable=False)
    budget_year = db.Column(db.Integer, nullable=False)
    budget_period = db.Column(db.String(50), nullable=False)  # annual, quarterly, monthly
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(50), default='draft')  # draft, approved, active, closed
    total_budget = db.Column(db.Numeric(15, 2), default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    lines = db.relationship('BudgetLine', back_populates='budget', cascade='all, delete-orphan')
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    approved_by_user = db.relationship('User', foreign_keys=[approved_by])

class BudgetLine(db.Model):
    __tablename__ = 'budget_lines'
    
    id = db.Column(db.Integer, primary_key=True)
    budget_id = db.Column(db.Integer, db.ForeignKey('budgets.id', ondelete='CASCADE'), nullable=False)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    budget_amount = db.Column(db.Numeric(15, 2), nullable=False)
    actual_amount = db.Column(db.Numeric(15, 2), default=0)
    variance_amount = db.Column(db.Numeric(15, 2), default=0)
    variance_percent = db.Column(db.Numeric(5, 2), default=0)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    budget = db.relationship('Budget', back_populates='lines')
    account = db.relationship('Account')

class AccountingEntry(db.Model):
    __tablename__ = 'accounting_entries'
    
    id = db.Column(db.Integer, primary_key=True)
    entry_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    entry_date = db.Column(db.Date, nullable=False, index=True)
    entry_type = db.Column(db.String(50), nullable=False)  # general, sales, purchase, payment
    reference_type = db.Column(db.String(50), nullable=True)
    reference_id = db.Column(db.Integer, nullable=True)
    reference_number = db.Column(db.String(100), nullable=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=True)
    account_code = db.Column(db.String(50), nullable=False)
    account_name = db.Column(db.String(200), nullable=False)
    debit_amount = db.Column(db.Numeric(15, 2), default=0)
    credit_amount = db.Column(db.Numeric(15, 2), default=0)
    cost_center_id = db.Column(db.Integer, db.ForeignKey('cost_centers.id'), nullable=True)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='draft')  # draft, posted, reversed
    posted_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    posted_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    account = db.relationship('Account')
    cost_center = db.relationship('CostCenter')
    posted_by_user = db.relationship('User')


class FixedAsset(db.Model):
    __tablename__ = 'fixed_assets'
    
    id = db.Column(db.Integer, primary_key=True)
    asset_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    asset_name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(100), nullable=False)  # Building, Equipment, Vehicle, Furniture, IT Equipment
    description = db.Column(db.Text, nullable=True)
    
    # Acquisition
    acquisition_date = db.Column(db.Date, nullable=False)
    acquisition_cost = db.Column(db.Numeric(15, 2), nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=True)
    invoice_number = db.Column(db.String(100), nullable=True)
    
    # Depreciation
    depreciation_method = db.Column(db.String(50), nullable=False, default='straight_line')  # straight_line, declining_balance
    useful_life_years = db.Column(db.Integer, nullable=False)  # in years
    salvage_value = db.Column(db.Numeric(15, 2), default=0)
    accumulated_depreciation = db.Column(db.Numeric(15, 2), default=0)
    
    # Location & Status
    location = db.Column(db.String(200), nullable=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    responsible_person = db.Column(db.String(200), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='active')  # active, disposed, sold, damaged
    
    # Disposal
    disposal_date = db.Column(db.Date, nullable=True)
    disposal_amount = db.Column(db.Numeric(15, 2), nullable=True)
    disposal_notes = db.Column(db.Text, nullable=True)
    
    # Audit
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    supplier = db.relationship('Supplier')
    department = db.relationship('Department')
    created_by_user = db.relationship('User')
    
    @property
    def net_book_value(self):
        """Calculate Net Book Value (Cost - Accumulated Depreciation)"""
        return float(self.acquisition_cost) - float(self.accumulated_depreciation)
    
    @property
    def annual_depreciation(self):
        """Calculate annual depreciation amount"""
        if self.depreciation_method == 'straight_line':
            return (float(self.acquisition_cost) - float(self.salvage_value)) / self.useful_life_years
        return 0


class TaxTransaction(db.Model):
    __tablename__ = 'tax_transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    transaction_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    transaction_date = db.Column(db.Date, nullable=False, index=True)
    transaction_type = db.Column(db.String(50), nullable=False)  # vat_in, vat_out, income_tax, other
    
    # Tax Details
    tax_type = db.Column(db.String(50), nullable=False)  # VAT, PPh21, PPh23, PPh4(2), etc.
    tax_rate = db.Column(db.Numeric(5, 2), nullable=False)  # percentage
    base_amount = db.Column(db.Numeric(15, 2), nullable=False)  # amount before tax
    tax_amount = db.Column(db.Numeric(15, 2), nullable=False)  # calculated tax
    
    # Reference
    reference_type = db.Column(db.String(50), nullable=True)  # invoice, payment, sales_order
    reference_id = db.Column(db.Integer, nullable=True)
    reference_number = db.Column(db.String(100), nullable=True)
    
    # Tax Document
    tax_invoice_number = db.Column(db.String(100), nullable=True)  # Faktur Pajak number
    tax_invoice_date = db.Column(db.Date, nullable=True)
    
    # Party Information
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=True)
    party_name = db.Column(db.String(200), nullable=True)
    party_npwp = db.Column(db.String(50), nullable=True)  # Tax ID number
    
    # Status
    status = db.Column(db.String(50), nullable=False, default='draft')  # draft, reported, paid
    reporting_period = db.Column(db.String(20), nullable=True)  # YYYY-MM format
    payment_date = db.Column(db.Date, nullable=True)
    
    description = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
    # Audit
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = db.relationship('Customer')
    supplier = db.relationship('Supplier')
    created_by_user = db.relationship('User')


class CostAnalysis(db.Model):
    __tablename__ = 'cost_analysis'
    
    id = db.Column(db.Integer, primary_key=True)
    analysis_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    analysis_name = db.Column(db.String(200), nullable=False)
    analysis_type = db.Column(db.String(50), nullable=False)  # product, project, department, activity
    
    # Period
    period_start = db.Column(db.Date, nullable=False)
    period_end = db.Column(db.Date, nullable=False)
    
    # Reference
    reference_type = db.Column(db.String(50), nullable=True)  # product, work_order, project
    reference_id = db.Column(db.Integer, nullable=True)
    reference_name = db.Column(db.String(200), nullable=True)
    
    # Cost Breakdown
    direct_material_cost = db.Column(db.Numeric(15, 2), default=0)
    direct_labor_cost = db.Column(db.Numeric(15, 2), default=0)
    manufacturing_overhead = db.Column(db.Numeric(15, 2), default=0)
    indirect_costs = db.Column(db.Numeric(15, 2), default=0)
    total_cost = db.Column(db.Numeric(15, 2), default=0)
    
    # Units & Unit Cost
    quantity = db.Column(db.Numeric(15, 2), nullable=True)
    unit_cost = db.Column(db.Numeric(15, 2), nullable=True)
    
    # Comparison
    budgeted_cost = db.Column(db.Numeric(15, 2), nullable=True)
    variance_amount = db.Column(db.Numeric(15, 2), nullable=True)
    variance_percentage = db.Column(db.Numeric(5, 2), nullable=True)
    
    # Department/Cost Center
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    cost_center_id = db.Column(db.Integer, db.ForeignKey('cost_centers.id'), nullable=True)
    
    status = db.Column(db.String(50), nullable=False, default='draft')  # draft, approved, closed
    notes = db.Column(db.Text, nullable=True)
    
    # Audit
    analyzed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    department = db.relationship('Department')
    cost_center = db.relationship('CostCenter')
    analyzed_by_user = db.relationship('User', foreign_keys=[analyzed_by])
    approved_by_user = db.relationship('User', foreign_keys=[approved_by])


class ConsolidationEntity(db.Model):
    __tablename__ = 'consolidation_entities'
    
    id = db.Column(db.Integer, primary_key=True)
    entity_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    entity_name = db.Column(db.String(200), nullable=False)
    entity_type = db.Column(db.String(50), nullable=False)  # parent, subsidiary, branch, division
    
    # Hierarchy
    parent_entity_id = db.Column(db.Integer, db.ForeignKey('consolidation_entities.id'), nullable=True)
    ownership_percentage = db.Column(db.Numeric(5, 2), nullable=True)  # for subsidiaries
    
    # Financial Details
    currency = db.Column(db.String(10), nullable=False, default='IDR')
    fiscal_year_end = db.Column(db.String(10), nullable=True)  # MM-DD format
    
    # Contact
    address = db.Column(db.Text, nullable=True)
    contact_person = db.Column(db.String(200), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(100), nullable=True)
    
    # Tax
    tax_id = db.Column(db.String(50), nullable=True)  # NPWP
    
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    
    # Audit
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    parent_entity = db.relationship('ConsolidationEntity', remote_side=[id], backref='subsidiaries')
    created_by_user = db.relationship('User')
