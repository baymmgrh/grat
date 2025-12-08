from datetime import datetime
from . import db

class Supplier(db.Model):
    __tablename__ = 'suppliers'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    company_name = db.Column(db.String(255), nullable=False, index=True)
    contact_person = db.Column(db.String(200), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    mobile = db.Column(db.String(50), nullable=True)
    fax = db.Column(db.String(50), nullable=True)
    website = db.Column(db.String(200), nullable=True)
    tax_id = db.Column(db.String(100), nullable=True)
    address = db.Column(db.Text, nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    postal_code = db.Column(db.String(20), nullable=True)
    payment_terms_days = db.Column(db.Integer, default=30)
    credit_limit = db.Column(db.Numeric(15, 2), default=0.0)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    supplier_type = db.Column(db.String(50), nullable=True)  # manufacturer, distributor, trader
    rating = db.Column(db.String(20), nullable=True)  # A, B, C
    lead_time_days = db.Column(db.Integer, default=0)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    materials = db.relationship('Material', back_populates='supplier')
    purchase_orders = db.relationship('PurchaseOrder', back_populates='supplier', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Supplier {self.code} - {self.company_name}>'

class PurchaseOrder(db.Model):
    __tablename__ = 'purchase_orders'
    
    id = db.Column(db.Integer, primary_key=True)
    po_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id', ondelete='CASCADE'), nullable=False)
    order_date = db.Column(db.Date, nullable=False, index=True)
    required_date = db.Column(db.Date, nullable=True)
    expected_date = db.Column(db.Date, nullable=True)
    delivery_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='draft')  # draft, sent, confirmed, partial, received, cancelled
    priority = db.Column(db.String(20), nullable=False, default='normal')  # low, normal, high, urgent
    supplier_quote_number = db.Column(db.String(100), nullable=True)
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
    supplier = db.relationship('Supplier', back_populates='purchase_orders')
    items = db.relationship('PurchaseOrderItem', back_populates='purchase_order', cascade='all, delete-orphan')
    grn_records = db.relationship('GoodsReceivedNote', back_populates='purchase_order')
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    approved_by_user = db.relationship('User', foreign_keys=[approved_by])
    
    def __repr__(self):
        return f'<PurchaseOrder {self.po_number}>'

class PurchaseOrderItem(db.Model):
    __tablename__ = 'purchase_order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    po_id = db.Column(db.Integer, db.ForeignKey('purchase_orders.id', ondelete='CASCADE'), nullable=False)
    line_number = db.Column(db.Integer, nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=True)
    description = db.Column(db.Text, nullable=True)
    quantity = db.Column(db.Numeric(15, 2), nullable=False)
    uom = db.Column(db.String(20), nullable=False)
    unit_price = db.Column(db.Numeric(15, 2), nullable=False)
    discount_percent = db.Column(db.Numeric(5, 2), default=0)
    discount_amount = db.Column(db.Numeric(15, 2), default=0)
    tax_percent = db.Column(db.Numeric(5, 2), default=0)
    tax_amount = db.Column(db.Numeric(15, 2), default=0)
    total_price = db.Column(db.Numeric(15, 2), nullable=False)
    quantity_received = db.Column(db.Numeric(15, 2), default=0)
    quantity_invoiced = db.Column(db.Numeric(15, 2), default=0)
    required_date = db.Column(db.Date, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    purchase_order = db.relationship('PurchaseOrder', back_populates='items')
    product = db.relationship('Product', back_populates='purchase_order_items')
    material = db.relationship('Material', back_populates='purchase_order_items')
    
    __table_args__ = (
        db.UniqueConstraint('po_id', 'line_number', name='unique_po_line'),
    )

class GoodsReceivedNote(db.Model):
    __tablename__ = 'goods_received_notes'
    
    id = db.Column(db.Integer, primary_key=True)
    grn_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    po_id = db.Column(db.Integer, db.ForeignKey('purchase_orders.id'), nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=False)
    receipt_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    delivery_note_number = db.Column(db.String(100), nullable=True)
    vehicle_number = db.Column(db.String(50), nullable=True)
    driver_name = db.Column(db.String(200), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='pending')  # pending, inspected, approved, rejected
    quality_status = db.Column(db.String(50), nullable=True)  # passed, failed, partial
    notes = db.Column(db.Text, nullable=True)
    received_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    inspected_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    purchase_order = db.relationship('PurchaseOrder', back_populates='grn_records')
    supplier = db.relationship('Supplier')
    items = db.relationship('GRNItem', back_populates='grn', cascade='all, delete-orphan')
    received_by_user = db.relationship('User', foreign_keys=[received_by])
    inspected_by_user = db.relationship('User', foreign_keys=[inspected_by])
    approved_by_user = db.relationship('User', foreign_keys=[approved_by])

class GRNItem(db.Model):
    __tablename__ = 'grn_items'
    
    id = db.Column(db.Integer, primary_key=True)
    grn_id = db.Column(db.Integer, db.ForeignKey('goods_received_notes.id', ondelete='CASCADE'), nullable=False)
    po_item_id = db.Column(db.Integer, db.ForeignKey('purchase_order_items.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=True)
    quantity_ordered = db.Column(db.Numeric(15, 2), nullable=False)
    quantity_received = db.Column(db.Numeric(15, 2), nullable=False)
    quantity_accepted = db.Column(db.Numeric(15, 2), default=0)
    quantity_rejected = db.Column(db.Numeric(15, 2), default=0)
    uom = db.Column(db.String(20), nullable=False)
    batch_number = db.Column(db.String(100), nullable=True)
    lot_number = db.Column(db.String(100), nullable=True)
    production_date = db.Column(db.Date, nullable=True)
    expiry_date = db.Column(db.Date, nullable=True)
    location_id = db.Column(db.Integer, db.ForeignKey('warehouse_locations.id'), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    grn = db.relationship('GoodsReceivedNote', back_populates='items')
    po_item = db.relationship('PurchaseOrderItem')
    product = db.relationship('Product')
    # material = db.relationship('Material')  # Disabled temporarily
    location = db.relationship('WarehouseLocation')

class PurchaseApproval(db.Model):
    __tablename__ = 'purchase_approvals'
    
    id = db.Column(db.Integer, primary_key=True)
    po_id = db.Column(db.Integer, db.ForeignKey('purchase_orders.id', ondelete='CASCADE'), nullable=False)
    approval_level = db.Column(db.Integer, nullable=False)  # 1, 2, 3, etc.
    approver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, approved, rejected
    comments = db.Column(db.Text, nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    purchase_order = db.relationship('PurchaseOrder')
    approver = db.relationship('User')

class SupplierQuote(db.Model):
    __tablename__ = 'supplier_quotes'
    
    id = db.Column(db.Integer, primary_key=True)
    quote_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=False)
    rfq_id = db.Column(db.Integer, db.ForeignKey('purchase_rfqs.id'), nullable=True)
    quote_date = db.Column(db.Date, nullable=False)
    valid_until = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='draft')  # draft, submitted, accepted, rejected, expired
    currency = db.Column(db.String(10), nullable=False, default='USD')
    exchange_rate = db.Column(db.Numeric(10, 4), default=1.0)
    payment_terms = db.Column(db.String(100), nullable=True)
    delivery_terms = db.Column(db.String(100), nullable=True)
    lead_time_days = db.Column(db.Integer, nullable=True)
    subtotal = db.Column(db.Numeric(15, 2), default=0)
    tax_amount = db.Column(db.Numeric(15, 2), default=0)
    total_amount = db.Column(db.Numeric(15, 2), default=0)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    supplier = db.relationship('Supplier')
    rfq = db.relationship('PurchaseRFQ', back_populates='quotes')
    items = db.relationship('SupplierQuoteItem', back_populates='quote', cascade='all, delete-orphan')

class PurchaseRFQ(db.Model):
    __tablename__ = 'purchase_rfqs'
    
    id = db.Column(db.Integer, primary_key=True)
    rfq_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    issue_date = db.Column(db.Date, nullable=False)
    closing_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='draft')  # draft, issued, closed, cancelled
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    created_by_user = db.relationship('User')
    items = db.relationship('RFQItem', back_populates='rfq', cascade='all, delete-orphan')
    quotes = db.relationship('SupplierQuote', back_populates='rfq')

class RFQItem(db.Model):
    __tablename__ = 'rfq_items'
    
    id = db.Column(db.Integer, primary_key=True)
    rfq_id = db.Column(db.Integer, db.ForeignKey('purchase_rfqs.id', ondelete='CASCADE'), nullable=False)
    line_number = db.Column(db.Integer, nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=True)
    description = db.Column(db.Text, nullable=False)
    quantity = db.Column(db.Numeric(15, 2), nullable=False)
    uom = db.Column(db.String(20), nullable=False)
    required_date = db.Column(db.Date, nullable=True)
    specifications = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    rfq = db.relationship('PurchaseRFQ', back_populates='items')
    product = db.relationship('Product')

class SupplierQuoteItem(db.Model):
    __tablename__ = 'supplier_quote_items'
    
    id = db.Column(db.Integer, primary_key=True)
    quote_id = db.Column(db.Integer, db.ForeignKey('supplier_quotes.id', ondelete='CASCADE'), nullable=False)
    rfq_item_id = db.Column(db.Integer, db.ForeignKey('rfq_items.id'), nullable=True)
    line_number = db.Column(db.Integer, nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=True)
    description = db.Column(db.Text, nullable=False)
    quantity = db.Column(db.Numeric(15, 2), nullable=False)
    uom = db.Column(db.String(20), nullable=False)
    unit_price = db.Column(db.Numeric(15, 2), nullable=False)
    discount_percent = db.Column(db.Numeric(5, 2), default=0)
    discount_amount = db.Column(db.Numeric(15, 2), default=0)
    tax_percent = db.Column(db.Numeric(5, 2), default=0)
    tax_amount = db.Column(db.Numeric(15, 2), default=0)
    total_price = db.Column(db.Numeric(15, 2), nullable=False)
    lead_time_days = db.Column(db.Integer, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    quote = db.relationship('SupplierQuote', back_populates='items')
    rfq_item = db.relationship('RFQItem')
    product = db.relationship('Product')

class SupplierContract(db.Model):
    __tablename__ = 'supplier_contracts'
    
    id = db.Column(db.Integer, primary_key=True)
    contract_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    contract_type = db.Column(db.String(50), nullable=False)  # framework, blanket, spot, service
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='draft')  # draft, active, expired, terminated, cancelled
    currency = db.Column(db.String(10), nullable=False, default='USD')
    total_value = db.Column(db.Numeric(15, 2), nullable=True)
    payment_terms = db.Column(db.String(100), nullable=True)
    delivery_terms = db.Column(db.String(100), nullable=True)
    penalty_clause = db.Column(db.Text, nullable=True)
    terms_conditions = db.Column(db.Text, nullable=True)
    auto_renewal = db.Column(db.Boolean, default=False)
    renewal_period_months = db.Column(db.Integer, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    supplier = db.relationship('Supplier')
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    approved_by_user = db.relationship('User', foreign_keys=[approved_by])
    items = db.relationship('ContractItem', back_populates='contract', cascade='all, delete-orphan')

class ContractItem(db.Model):
    __tablename__ = 'contract_items'
    
    id = db.Column(db.Integer, primary_key=True)
    contract_id = db.Column(db.Integer, db.ForeignKey('supplier_contracts.id', ondelete='CASCADE'), nullable=False)
    line_number = db.Column(db.Integer, nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=True)
    description = db.Column(db.Text, nullable=False)
    quantity = db.Column(db.Numeric(15, 2), nullable=True)  # Can be null for framework contracts
    uom = db.Column(db.String(20), nullable=False)
    unit_price = db.Column(db.Numeric(15, 2), nullable=False)
    min_order_qty = db.Column(db.Numeric(15, 2), nullable=True)
    max_order_qty = db.Column(db.Numeric(15, 2), nullable=True)
    lead_time_days = db.Column(db.Integer, nullable=True)
    price_valid_from = db.Column(db.Date, nullable=True)
    price_valid_to = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    contract = db.relationship('SupplierContract', back_populates='items')
    product = db.relationship('Product')

class PriceHistory(db.Model):
    __tablename__ = 'price_history'
    
    id = db.Column(db.Integer, primary_key=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=True)
    po_id = db.Column(db.Integer, db.ForeignKey('purchase_orders.id'), nullable=True)
    quote_id = db.Column(db.Integer, db.ForeignKey('supplier_quotes.id'), nullable=True)
    contract_id = db.Column(db.Integer, db.ForeignKey('supplier_contracts.id'), nullable=True)
    price_date = db.Column(db.Date, nullable=False)
    unit_price = db.Column(db.Numeric(15, 2), nullable=False)
    currency = db.Column(db.String(10), nullable=False, default='USD')
    uom = db.Column(db.String(20), nullable=False)
    quantity = db.Column(db.Numeric(15, 2), nullable=True)
    source_type = db.Column(db.String(20), nullable=False)  # po, quote, contract
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    supplier = db.relationship('Supplier')
    product = db.relationship('Product')
    purchase_order = db.relationship('PurchaseOrder')
    quote = db.relationship('SupplierQuote')
    contract = db.relationship('SupplierContract')
