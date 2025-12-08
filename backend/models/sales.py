from datetime import datetime
from . import db

# ===============================
# LEAD MANAGEMENT MODELS
# ===============================

class Lead(db.Model):
    __tablename__ = 'leads'
    
    id = db.Column(db.Integer, primary_key=True)
    lead_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    company_name = db.Column(db.String(255), nullable=False, index=True)
    contact_person = db.Column(db.String(200), nullable=False)
    job_title = db.Column(db.String(100), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    mobile = db.Column(db.String(50), nullable=True)
    website = db.Column(db.String(200), nullable=True)
    address = db.Column(db.Text, nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    postal_code = db.Column(db.String(20), nullable=True)
    
    # Lead Information
    lead_source = db.Column(db.String(50), nullable=True)  # website, referral, cold_call, social_media, trade_show, advertisement
    lead_status = db.Column(db.String(50), nullable=False, default='new')  # new, contacted, qualified, converted, lost
    lead_score = db.Column(db.Integer, default=0)
    industry = db.Column(db.String(100), nullable=True)
    company_size = db.Column(db.String(50), nullable=True)  # startup, small, medium, large, enterprise
    annual_revenue = db.Column(db.Numeric(15, 2), nullable=True)
    budget = db.Column(db.Numeric(15, 2), nullable=True)
    decision_maker = db.Column(db.Boolean, default=False)
    purchase_timeline = db.Column(db.String(50), nullable=True)  # immediate, 1_month, 3_months, 6_months, 1_year
    
    # Assignment & Tracking  
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    converted_to_customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)
    converted_at = db.Column(db.DateTime, nullable=True)
    last_contacted = db.Column(db.DateTime, nullable=True)
    next_followup = db.Column(db.DateTime, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    assigned_user = db.relationship('User', foreign_keys=[assigned_to])
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    converted_customer = db.relationship('Customer', foreign_keys=[converted_to_customer_id])
    opportunities = db.relationship('Opportunity', back_populates='lead', cascade='all, delete-orphan')
    activities = db.relationship('SalesActivity', back_populates='lead', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Lead {self.lead_number} - {self.company_name}>'

# ===============================
# OPPORTUNITY/PIPELINE MANAGEMENT
# ===============================

class SalesPipeline(db.Model):
    __tablename__ = 'sales_pipelines'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_default = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    stages = db.relationship('PipelineStage', back_populates='pipeline', cascade='all, delete-orphan', order_by='PipelineStage.order')
    opportunities = db.relationship('Opportunity', back_populates='pipeline')

class PipelineStage(db.Model):
    __tablename__ = 'pipeline_stages'
    
    id = db.Column(db.Integer, primary_key=True)
    pipeline_id = db.Column(db.Integer, db.ForeignKey('sales_pipelines.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    order = db.Column(db.Integer, nullable=False)
    probability = db.Column(db.Integer, default=0)  # 0-100%
    is_closed_won = db.Column(db.Boolean, default=False)
    is_closed_lost = db.Column(db.Boolean, default=False)
    color_code = db.Column(db.String(7), nullable=True)  # hex color
    
    # Relationships
    pipeline = db.relationship('SalesPipeline', back_populates='stages')
    opportunities = db.relationship('Opportunity', back_populates='stage')

class Opportunity(db.Model):
    __tablename__ = 'opportunities'
    
    id = db.Column(db.Integer, primary_key=True)
    opportunity_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False, index=True)
    
    # Relationships
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id'), nullable=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)
    pipeline_id = db.Column(db.Integer, db.ForeignKey('sales_pipelines.id'), nullable=False)
    stage_id = db.Column(db.Integer, db.ForeignKey('pipeline_stages.id'), nullable=False)
    
    # Opportunity Details
    description = db.Column(db.Text, nullable=True)
    value = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    probability = db.Column(db.Integer, default=0)  # 0-100%
    expected_close_date = db.Column(db.Date, nullable=True)
    actual_close_date = db.Column(db.Date, nullable=True)
    
    # Competition & Decision
    competitors = db.Column(db.Text, nullable=True)
    decision_criteria = db.Column(db.Text, nullable=True)
    decision_process = db.Column(db.Text, nullable=True)
    budget_confirmed = db.Column(db.Boolean, default=False)
    authority_identified = db.Column(db.Boolean, default=False)
    need_identified = db.Column(db.Boolean, default=False)
    timeline_identified = db.Column(db.Boolean, default=False)
    
    # Assignment & Status
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='open')  # open, won, lost, on_hold
    lost_reason = db.Column(db.String(100), nullable=True)
    
    # Tracking
    source = db.Column(db.String(50), nullable=True)
    last_activity_date = db.Column(db.DateTime, nullable=True)
    next_step = db.Column(db.Text, nullable=True)
    next_step_date = db.Column(db.DateTime, nullable=True)
    
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    lead = db.relationship('Lead', back_populates='opportunities')
    customer = db.relationship('Customer', back_populates='opportunities')
    pipeline = db.relationship('SalesPipeline', back_populates='opportunities')
    stage = db.relationship('PipelineStage', back_populates='opportunities')
    assigned_user = db.relationship('User', foreign_keys=[assigned_to])
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    activities = db.relationship('SalesActivity', back_populates='opportunity', cascade='all, delete-orphan')
    quotations = db.relationship('Quotation', back_populates='opportunity', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Opportunity {self.opportunity_number} - {self.name}>'

# ===============================
# ENHANCED CUSTOMER DATABASE
# ===============================

class Customer(db.Model):
    __tablename__ = 'customers'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    company_name = db.Column(db.String(255), nullable=False, index=True)
    contact_person = db.Column(db.String(200), nullable=True)
    job_title = db.Column(db.String(100), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    mobile = db.Column(db.String(50), nullable=True)
    fax = db.Column(db.String(50), nullable=True)
    website = db.Column(db.String(200), nullable=True)
    tax_id = db.Column(db.String(100), nullable=True)
    
    # Address Information
    billing_address = db.Column(db.Text, nullable=True)
    billing_city = db.Column(db.String(100), nullable=True)
    billing_state = db.Column(db.String(100), nullable=True)
    billing_country = db.Column(db.String(100), nullable=True)
    billing_postal_code = db.Column(db.String(20), nullable=True)
    
    shipping_address = db.Column(db.Text, nullable=True)
    shipping_city = db.Column(db.String(100), nullable=True)
    shipping_state = db.Column(db.String(100), nullable=True)
    shipping_country = db.Column(db.String(100), nullable=True)
    shipping_postal_code = db.Column(db.String(20), nullable=True)
    
    # Business Information
    credit_limit = db.Column(db.Numeric(15, 2), default=0)
    payment_terms_days = db.Column(db.Integer, default=30)
    customer_type = db.Column(db.String(50), nullable=True)  # wholesale, retail, distributor
    industry = db.Column(db.String(100), nullable=True)
    company_size = db.Column(db.String(50), nullable=True)  # startup, small, medium, large, enterprise
    annual_revenue = db.Column(db.Numeric(15, 2), nullable=True)
    
    # CRM Information
    rating = db.Column(db.String(20), nullable=True)  # A, B, C
    priority = db.Column(db.String(20), nullable=False, default='normal')  # low, normal, high
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    lifecycle_stage = db.Column(db.String(50), nullable=True)  # prospect, customer, champion, other
    
    # Status & Tracking
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_contact_date = db.Column(db.DateTime, nullable=True)
    next_contact_date = db.Column(db.DateTime, nullable=True)
    total_orders = db.Column(db.Integer, default=0)
    total_revenue = db.Column(db.Numeric(15, 2), default=0)
    average_order_value = db.Column(db.Numeric(15, 2), default=0)
    
    notes = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    assigned_user = db.relationship('User', foreign_keys=[assigned_to])
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    opportunities = db.relationship('Opportunity', back_populates='customer', cascade='all, delete-orphan')
    quotations = db.relationship('Quotation', back_populates='customer', cascade='all, delete-orphan')
    sales_orders = db.relationship('SalesOrder', back_populates='customer', cascade='all, delete-orphan')
    activities = db.relationship('SalesActivity', back_populates='customer', cascade='all, delete-orphan')
    contacts = db.relationship('CustomerContact', back_populates='customer', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Customer {self.code} - {self.company_name}>'

class CustomerContact(db.Model):
    __tablename__ = 'customer_contacts'
    
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    job_title = db.Column(db.String(100), nullable=True)
    department = db.Column(db.String(100), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    mobile = db.Column(db.String(50), nullable=True)
    is_primary = db.Column(db.Boolean, default=False)
    is_decision_maker = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    customer = db.relationship('Customer', back_populates='contacts')

# ===============================
# QUOTATION MANAGEMENT
# ===============================

class Quotation(db.Model):
    __tablename__ = 'quotations'
    
    id = db.Column(db.Integer, primary_key=True)
    quote_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    revision = db.Column(db.Integer, default=1)
    
    # Relationships
    opportunity_id = db.Column(db.Integer, db.ForeignKey('opportunities.id'), nullable=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    
    # Quote Details
    quote_date = db.Column(db.Date, nullable=False, index=True)
    valid_until = db.Column(db.Date, nullable=False)
    delivery_date = db.Column(db.Date, nullable=True)
    payment_terms = db.Column(db.String(100), nullable=True)
    delivery_terms = db.Column(db.String(100), nullable=True)
    
    # Pricing
    subtotal = db.Column(db.Numeric(15, 2), default=0)
    discount_percent = db.Column(db.Numeric(5, 2), default=0)
    discount_amount = db.Column(db.Numeric(15, 2), default=0)
    tax_percent = db.Column(db.Numeric(5, 2), default=0)
    tax_amount = db.Column(db.Numeric(15, 2), default=0)
    shipping_cost = db.Column(db.Numeric(15, 2), default=0)
    total_amount = db.Column(db.Numeric(15, 2), default=0)
    
    # Status & Tracking
    status = db.Column(db.String(50), nullable=False, default='draft')  # draft, sent, accepted, rejected, expired, converted
    sent_date = db.Column(db.DateTime, nullable=True)
    accepted_date = db.Column(db.DateTime, nullable=True)
    rejected_date = db.Column(db.DateTime, nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    
    # Conversion
    converted_to_order_id = db.Column(db.Integer, db.ForeignKey('sales_orders.id'), nullable=True)
    conversion_rate = db.Column(db.Numeric(5, 2), default=100)  # percentage of quote converted to order
    
    # Additional Information
    notes = db.Column(db.Text, nullable=True)
    terms_conditions = db.Column(db.Text, nullable=True)
    internal_notes = db.Column(db.Text, nullable=True)
    
    prepared_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    opportunity = db.relationship('Opportunity', back_populates='quotations')
    customer = db.relationship('Customer', back_populates='quotations')
    converted_order = db.relationship('SalesOrder', foreign_keys=[converted_to_order_id])
    items = db.relationship('QuotationItem', back_populates='quotation', cascade='all, delete-orphan')
    prepared_by_user = db.relationship('User', foreign_keys=[prepared_by])
    approved_by_user = db.relationship('User', foreign_keys=[approved_by])
    
    def __repr__(self):
        return f'<Quotation {self.quote_number}>'

class QuotationItem(db.Model):
    __tablename__ = 'quotation_items'
    
    id = db.Column(db.Integer, primary_key=True)
    quotation_id = db.Column(db.Integer, db.ForeignKey('quotations.id'), nullable=False)
    line_number = db.Column(db.Integer, nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    description = db.Column(db.Text, nullable=True)
    quantity = db.Column(db.Numeric(15, 2), nullable=False)
    uom = db.Column(db.String(20), nullable=False)
    unit_price = db.Column(db.Numeric(15, 2), nullable=False)
    discount_percent = db.Column(db.Numeric(5, 2), default=0)
    discount_amount = db.Column(db.Numeric(15, 2), default=0)
    tax_percent = db.Column(db.Numeric(5, 2), default=0)
    tax_amount = db.Column(db.Numeric(15, 2), default=0)
    total_price = db.Column(db.Numeric(15, 2), nullable=False)
    delivery_date = db.Column(db.Date, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
    # Relationships
    quotation = db.relationship('Quotation', back_populates='items')
    product = db.relationship('Product')
    
    __table_args__ = (
        db.UniqueConstraint('quotation_id', 'line_number', name='unique_quote_line'),
    )

# ===============================
# SALES ORDER MANAGEMENT
# ===============================

class SalesOrder(db.Model):
    __tablename__ = 'sales_orders'
    
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    
    # Relationships
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id', ondelete='CASCADE'), nullable=False)
    quotation_id = db.Column(db.Integer, db.ForeignKey('quotations.id'), nullable=True)
    
    # Order Details
    order_date = db.Column(db.Date, nullable=False, index=True)
    required_date = db.Column(db.Date, nullable=True)
    promised_date = db.Column(db.Date, nullable=True)
    delivery_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='draft')  # draft, confirmed, in_production, ready, shipped, delivered, cancelled
    priority = db.Column(db.String(20), nullable=False, default='normal')  # low, normal, high, urgent
    customer_po_number = db.Column(db.String(100), nullable=True)
    payment_terms = db.Column(db.String(100), nullable=True)
    payment_method = db.Column(db.String(50), nullable=True)
    delivery_address = db.Column(db.Text, nullable=True)
    shipping_method = db.Column(db.String(100), nullable=True)
    shipping_cost = db.Column(db.Numeric(15, 2), default=0)
    subtotal = db.Column(db.Numeric(15, 2), default=0)
    tax_amount = db.Column(db.Numeric(15, 2), default=0)
    discount_amount = db.Column(db.Numeric(15, 2), default=0)
    total_amount = db.Column(db.Numeric(15, 2), default=0)
    notes = db.Column(db.Text, nullable=True)
    internal_notes = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = db.relationship('Customer', back_populates='sales_orders')
    quotation = db.relationship('Quotation', foreign_keys=[quotation_id])
    items = db.relationship('SalesOrderItem', back_populates='order', cascade='all, delete-orphan')
    shipping_orders = db.relationship('ShippingOrder', back_populates='sales_order')
    invoices = db.relationship('Invoice', back_populates='sales_order')
    returns = db.relationship('CustomerReturn', back_populates='sales_order')
    work_orders = db.relationship('WorkOrder', back_populates='sales_order')  # Workflow integration
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    approved_by_user = db.relationship('User', foreign_keys=[approved_by])
    
    def __repr__(self):
        return f'<SalesOrder {self.order_number}>'

class SalesOrderItem(db.Model):
    __tablename__ = 'sales_order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('sales_orders.id', ondelete='CASCADE'), nullable=False)
    line_number = db.Column(db.Integer, nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    description = db.Column(db.Text, nullable=True)
    quantity = db.Column(db.Numeric(15, 2), nullable=False)
    uom = db.Column(db.String(20), nullable=False)
    unit_price = db.Column(db.Numeric(15, 2), nullable=False)
    discount_percent = db.Column(db.Numeric(5, 2), default=0)
    discount_amount = db.Column(db.Numeric(15, 2), default=0)
    tax_percent = db.Column(db.Numeric(5, 2), default=0)
    tax_amount = db.Column(db.Numeric(15, 2), default=0)
    total_price = db.Column(db.Numeric(15, 2), nullable=False)
    quantity_shipped = db.Column(db.Numeric(15, 2), default=0)
    quantity_invoiced = db.Column(db.Numeric(15, 2), default=0)
    required_date = db.Column(db.Date, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    order = db.relationship('SalesOrder', back_populates='items')
    product = db.relationship('Product', back_populates='sales_order_items')
    
    __table_args__ = (
        db.UniqueConstraint('order_id', 'line_number', name='unique_order_line'),
    )

# ===============================
# ACTIVITY & TASK MANAGEMENT
# ===============================

class SalesActivity(db.Model):
    __tablename__ = 'sales_activities'
    
    id = db.Column(db.Integer, primary_key=True)
    activity_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    subject = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Activity Type & Status
    activity_type = db.Column(db.String(50), nullable=False)  # call, email, meeting, task, note, demo, proposal
    status = db.Column(db.String(50), nullable=False, default='planned')  # planned, in_progress, completed, cancelled, overdue
    priority = db.Column(db.String(20), nullable=False, default='normal')  # low, normal, high, urgent
    
    # Timing
    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)
    due_date = db.Column(db.DateTime, nullable=True)
    duration_minutes = db.Column(db.Integer, nullable=True)
    completed_date = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id'), nullable=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)
    opportunity_id = db.Column(db.Integer, db.ForeignKey('opportunities.id'), nullable=True)
    quotation_id = db.Column(db.Integer, db.ForeignKey('quotations.id'), nullable=True)
    sales_order_id = db.Column(db.Integer, db.ForeignKey('sales_orders.id'), nullable=True)
    
    # Assignment
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Outcome & Follow-up
    outcome = db.Column(db.Text, nullable=True)  # result of the activity
    next_step = db.Column(db.Text, nullable=True)
    follow_up_date = db.Column(db.DateTime, nullable=True)
    
    # Additional Information
    location = db.Column(db.String(200), nullable=True)
    attendees = db.Column(db.Text, nullable=True)  # JSON or comma-separated
    tags = db.Column(db.String(500), nullable=True)  # comma-separated tags
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    lead = db.relationship('Lead', back_populates='activities')
    customer = db.relationship('Customer', back_populates='activities')
    opportunity = db.relationship('Opportunity', back_populates='activities')
    quotation = db.relationship('Quotation')
    sales_order = db.relationship('SalesOrder')
    assigned_user = db.relationship('User', foreign_keys=[assigned_to])
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    
    def __repr__(self):
        return f'<SalesActivity {self.activity_number} - {self.subject}>'

class SalesTask(db.Model):
    __tablename__ = 'sales_tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    task_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Task Details
    task_type = db.Column(db.String(50), nullable=True)  # follow_up, research, preparation, admin
    status = db.Column(db.String(50), nullable=False, default='open')  # open, in_progress, completed, cancelled, on_hold
    priority = db.Column(db.String(20), nullable=False, default='normal')  # low, normal, high, urgent
    
    # Timing
    due_date = db.Column(db.DateTime, nullable=True)
    start_date = db.Column(db.DateTime, nullable=True)
    completed_date = db.Column(db.DateTime, nullable=True)
    estimated_hours = db.Column(db.Numeric(5, 2), nullable=True)
    actual_hours = db.Column(db.Numeric(5, 2), nullable=True)
    
    # Relationships
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id'), nullable=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)
    opportunity_id = db.Column(db.Integer, db.ForeignKey('opportunities.id'), nullable=True)
    parent_task_id = db.Column(db.Integer, db.ForeignKey('sales_tasks.id'), nullable=True)
    
    # Assignment
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Progress & Notes
    progress_percent = db.Column(db.Integer, default=0)  # 0-100%
    notes = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    lead = db.relationship('Lead')
    customer = db.relationship('Customer')
    opportunity = db.relationship('Opportunity')
    parent_task = db.relationship('SalesTask', remote_side=[id], backref='subtasks')
    assigned_user = db.relationship('User', foreign_keys=[assigned_to])
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    
    def __repr__(self):
        return f'<SalesTask {self.task_number} - {self.title}>'

# ===============================
# SALES ANALYTICS & REPORTING
# ===============================

class SalesMetrics(db.Model):
    __tablename__ = 'sales_metrics'
    
    id = db.Column(db.Integer, primary_key=True)
    metric_date = db.Column(db.Date, nullable=False, index=True)
    period_type = db.Column(db.String(20), nullable=False)  # daily, weekly, monthly, quarterly, yearly
    
    # User/Team Metrics
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    team_id = db.Column(db.Integer, nullable=True)  # if you have teams
    
    # Lead Metrics
    leads_generated = db.Column(db.Integer, default=0)
    leads_qualified = db.Column(db.Integer, default=0)
    leads_converted = db.Column(db.Integer, default=0)
    lead_conversion_rate = db.Column(db.Numeric(5, 2), default=0)  # percentage
    
    # Opportunity Metrics
    opportunities_created = db.Column(db.Integer, default=0)
    opportunities_won = db.Column(db.Integer, default=0)
    opportunities_lost = db.Column(db.Integer, default=0)
    win_rate = db.Column(db.Numeric(5, 2), default=0)  # percentage
    
    # Pipeline Metrics
    pipeline_value = db.Column(db.Numeric(15, 2), default=0)
    weighted_pipeline = db.Column(db.Numeric(15, 2), default=0)
    average_deal_size = db.Column(db.Numeric(15, 2), default=0)
    average_sales_cycle = db.Column(db.Integer, default=0)  # days
    
    # Revenue Metrics
    revenue_target = db.Column(db.Numeric(15, 2), default=0)
    revenue_actual = db.Column(db.Numeric(15, 2), default=0)
    revenue_achievement = db.Column(db.Numeric(5, 2), default=0)  # percentage
    
    # Activity Metrics
    calls_made = db.Column(db.Integer, default=0)
    emails_sent = db.Column(db.Integer, default=0)
    meetings_held = db.Column(db.Integer, default=0)
    demos_conducted = db.Column(db.Integer, default=0)
    proposals_sent = db.Column(db.Integer, default=0)
    
    # Customer Metrics
    new_customers = db.Column(db.Integer, default=0)
    customer_retention_rate = db.Column(db.Numeric(5, 2), default=0)
    customer_lifetime_value = db.Column(db.Numeric(15, 2), default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User')
    
    __table_args__ = (
        db.UniqueConstraint('metric_date', 'period_type', 'user_id', name='unique_user_metric'),
    )

class SalesReport(db.Model):
    __tablename__ = 'sales_reports'
    
    id = db.Column(db.Integer, primary_key=True)
    report_name = db.Column(db.String(200), nullable=False)
    report_type = db.Column(db.String(50), nullable=False)  # pipeline, activity, revenue, conversion, forecast
    
    # Report Configuration
    parameters = db.Column(db.Text, nullable=True)  # JSON configuration
    filters = db.Column(db.Text, nullable=True)  # JSON filters
    date_range_start = db.Column(db.Date, nullable=True)
    date_range_end = db.Column(db.Date, nullable=True)
    
    # Report Data
    data = db.Column(db.Text, nullable=True)  # JSON report data
    summary = db.Column(db.Text, nullable=True)  # JSON summary data
    
    # Status & Schedule
    status = db.Column(db.String(50), nullable=False, default='draft')  # draft, generated, scheduled, error
    is_scheduled = db.Column(db.Boolean, default=False)
    schedule_frequency = db.Column(db.String(20), nullable=True)  # daily, weekly, monthly
    next_run_date = db.Column(db.DateTime, nullable=True)
    last_run_date = db.Column(db.DateTime, nullable=True)
    
    # Access Control
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    is_public = db.Column(db.Boolean, default=False)
    shared_with = db.Column(db.Text, nullable=True)  # JSON list of user IDs
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    created_by_user = db.relationship('User')
    
    def __repr__(self):
        return f'<SalesReport {self.report_name}>'

# ===============================
# SALES FORECAST
# ===============================

class SalesForecast(db.Model):
    __tablename__ = 'sales_forecasts'
    
    id = db.Column(db.Integer, primary_key=True)
    forecast_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    
    # Forecast Period
    forecast_type = db.Column(db.String(20), nullable=False)  # monthly, quarterly, yearly
    period_start = db.Column(db.Date, nullable=False)
    period_end = db.Column(db.Date, nullable=False)
    
    # Forecast Details
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    
    # Forecast Values
    best_case = db.Column(db.Numeric(15, 2), default=0)
    most_likely = db.Column(db.Numeric(15, 2), default=0)
    worst_case = db.Column(db.Numeric(15, 2), default=0)
    committed = db.Column(db.Numeric(15, 2), default=0)
    
    # Tracking
    actual_value = db.Column(db.Numeric(15, 2), default=0)
    variance = db.Column(db.Numeric(15, 2), default=0)
    accuracy_percentage = db.Column(db.Numeric(5, 2), default=0)
    
    # Resource Planning
    required_manpower = db.Column(db.Integer, default=0)  # Jumlah kebutuhan man power
    shifts_per_day = db.Column(db.Integer, default=1)  # Jumlah shift per hari
    
    # Status
    status = db.Column(db.String(50), nullable=False, default='draft')  # draft, submitted, approved, closed
    confidence_level = db.Column(db.String(20), nullable=True)  # high, medium, low
    methodology = db.Column(db.String(100), nullable=True)  # pipeline, historical, quota
    
    notes = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id])
    customer = db.relationship('Customer')
    product = db.relationship('Product')
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    approved_by_user = db.relationship('User', foreign_keys=[approved_by])
    
    def __repr__(self):
        return f'<SalesForecast {self.forecast_number} - {self.name}>'
