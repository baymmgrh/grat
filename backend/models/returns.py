from datetime import datetime
from . import db

class CustomerReturn(db.Model):
    __tablename__ = 'customer_returns'
    
    id = db.Column(db.Integer, primary_key=True)
    return_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    sales_order_id = db.Column(db.Integer, db.ForeignKey('sales_orders.id'), nullable=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    return_date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    reason = db.Column(db.String(200), nullable=False)  # defective, wrong_item, damaged, etc.
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='received')  # received, qc_pending, qc_approved, qc_rejected, processed
    
    # Return details
    total_items = db.Column(db.Integer, default=0)
    total_value = db.Column(db.Numeric(15, 2), default=0)
    
    # Processing info
    received_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    processed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    processed_date = db.Column(db.DateTime, nullable=True)
    
    # QC info
    qc_required = db.Column(db.Boolean, default=True, nullable=False)
    qc_status = db.Column(db.String(50), nullable=True)  # pending, passed, failed
    qc_date = db.Column(db.DateTime, nullable=True)
    qc_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    qc_notes = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sales_order = db.relationship('SalesOrder', back_populates='returns')
    customer = db.relationship('Customer')
    items = db.relationship('ReturnItem', back_populates='customer_return', cascade='all, delete-orphan')
    qc_records = db.relationship('ReturnQCRecord', back_populates='customer_return', cascade='all, delete-orphan')
    received_by_user = db.relationship('User', foreign_keys=[received_by])
    processed_by_user = db.relationship('User', foreign_keys=[processed_by])
    qc_by_user = db.relationship('User', foreign_keys=[qc_by])

class ReturnItem(db.Model):
    __tablename__ = 'return_items'
    
    id = db.Column(db.Integer, primary_key=True)
    return_id = db.Column(db.Integer, db.ForeignKey('customer_returns.id', ondelete='CASCADE'), nullable=False)
    sales_order_item_id = db.Column(db.Integer, db.ForeignKey('sales_order_items.id'), nullable=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    
    # Item details
    quantity_returned = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(15, 2), nullable=False)
    total_value = db.Column(db.Numeric(15, 2), nullable=False)
    
    # Condition details
    condition_received = db.Column(db.String(50), nullable=False)  # good, damaged, defective, unusable
    defect_description = db.Column(db.Text, nullable=True)
    
    # QC Results
    qc_status = db.Column(db.String(50), nullable=True)  # pending, passed, failed
    qc_quantity_approved = db.Column(db.Integer, default=0)
    qc_quantity_rejected = db.Column(db.Integer, default=0)
    
    # Final disposition
    disposition = db.Column(db.String(50), nullable=True)  # rework, warehouse, waste, scrap
    warehouse_location = db.Column(db.String(100), nullable=True)
    waste_category = db.Column(db.String(50), nullable=True)
    
    # Batch/Serial tracking
    batch_number = db.Column(db.String(100), nullable=True)
    serial_numbers = db.Column(db.Text, nullable=True)  # JSON array of serial numbers
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    customer_return = db.relationship('CustomerReturn', back_populates='items')
    sales_order_item = db.relationship('SalesOrderItem')
    product = db.relationship('Product')

class ReturnQCRecord(db.Model):
    __tablename__ = 'return_qc_records'
    
    id = db.Column(db.Integer, primary_key=True)
    return_id = db.Column(db.Integer, db.ForeignKey('customer_returns.id', ondelete='CASCADE'), nullable=False)
    return_item_id = db.Column(db.Integer, db.ForeignKey('return_items.id', ondelete='CASCADE'), nullable=True)
    
    # QC Details
    qc_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    qc_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Inspection results
    visual_inspection = db.Column(db.String(50), nullable=False)  # pass, fail
    functional_test = db.Column(db.String(50), nullable=True)     # pass, fail, not_applicable
    dimensional_check = db.Column(db.String(50), nullable=True)   # pass, fail, not_applicable
    
    # Overall result
    overall_result = db.Column(db.String(50), nullable=False)  # approved, rejected, conditional
    
    # Quantities
    quantity_inspected = db.Column(db.Integer, nullable=False)
    quantity_approved = db.Column(db.Integer, default=0)
    quantity_rejected = db.Column(db.Integer, default=0)
    
    # Notes and recommendations
    defects_found = db.Column(db.Text, nullable=True)
    qc_notes = db.Column(db.Text, nullable=True)
    recommendation = db.Column(db.String(100), nullable=True)  # rework, scrap, return_to_supplier, warehouse
    
    # Photos/attachments
    photos = db.Column(db.Text, nullable=True)  # JSON array of photo URLs
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    customer_return = db.relationship('CustomerReturn', back_populates='qc_records')
    return_item = db.relationship('ReturnItem')
    qc_by_user = db.relationship('User')

class ReturnDisposition(db.Model):
    __tablename__ = 'return_dispositions'
    
    id = db.Column(db.Integer, primary_key=True)
    return_id = db.Column(db.Integer, db.ForeignKey('customer_returns.id'), nullable=False)
    return_item_id = db.Column(db.Integer, db.ForeignKey('return_items.id'), nullable=False)
    
    # Disposition details
    disposition_type = db.Column(db.String(50), nullable=False)  # rework, warehouse, waste, scrap
    quantity = db.Column(db.Integer, nullable=False)
    
    # Target locations
    warehouse_location = db.Column(db.String(100), nullable=True)  # If going to warehouse
    waste_category = db.Column(db.String(50), nullable=True)       # If going to waste
    work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=True)  # If rework needed
    
    # Processing details
    processed_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    processed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    
    # Status tracking
    status = db.Column(db.String(50), nullable=False, default='pending')  # pending, completed, cancelled
    completed_date = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    customer_return = db.relationship('CustomerReturn')
    return_item = db.relationship('ReturnItem')
    work_order = db.relationship('WorkOrder')
    processed_by_user = db.relationship('User')
