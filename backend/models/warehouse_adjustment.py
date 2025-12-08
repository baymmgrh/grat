from datetime import datetime
from . import db

class InventoryAdjustment(db.Model):
    """Inventory adjustment for stock corrections"""
    __tablename__ = 'inventory_adjustments'
    
    id = db.Column(db.Integer, primary_key=True)
    adjustment_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('warehouse_locations.id'), nullable=False)
    
    # Adjustment Details
    adjustment_type = db.Column(db.String(50), nullable=False)  # positive, negative, recount
    reason = db.Column(db.String(100), nullable=False)  # damaged, expired, theft, counting_error, system_error
    
    # Quantities
    system_quantity = db.Column(db.Numeric(15, 2), nullable=False)  # Current system quantity
    physical_quantity = db.Column(db.Numeric(15, 2), nullable=False)  # Actual counted quantity
    adjustment_quantity = db.Column(db.Numeric(15, 2), nullable=False)  # Difference (physical - system)
    
    # Batch Information
    batch_number = db.Column(db.String(100), nullable=True)
    lot_number = db.Column(db.String(100), nullable=True)
    serial_number = db.Column(db.String(100), nullable=True)
    
    # Cost Impact
    unit_cost = db.Column(db.Numeric(15, 4), nullable=True)
    total_cost_impact = db.Column(db.Numeric(15, 2), nullable=True)  # adjustment_quantity * unit_cost
    
    # Approval Workflow
    status = db.Column(db.String(50), nullable=False, default='pending')  # pending, approved, rejected, applied
    requested_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    
    # Additional Information
    notes = db.Column(db.Text, nullable=True)
    reference_document = db.Column(db.String(200), nullable=True)  # Stock take reference, etc.
    adjustment_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product')
    location = db.relationship('WarehouseLocation')
    requested_by_user = db.relationship('User', foreign_keys=[requested_by])
    approved_by_user = db.relationship('User', foreign_keys=[approved_by])
    
    def __repr__(self):
        return f'<InventoryAdjustment {self.adjustment_number} - {self.adjustment_quantity}>'
    
    @property
    def is_positive(self):
        return self.adjustment_quantity > 0
    
    @property
    def is_negative(self):
        return self.adjustment_quantity < 0
    
    @property
    def variance_percentage(self):
        if self.system_quantity == 0:
            return 0
        return (self.adjustment_quantity / self.system_quantity) * 100

class InventoryTransfer(db.Model):
    """Inventory transfer between locations"""
    __tablename__ = 'inventory_transfers'
    
    id = db.Column(db.Integer, primary_key=True)
    transfer_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    from_location_id = db.Column(db.Integer, db.ForeignKey('warehouse_locations.id'), nullable=False)
    to_location_id = db.Column(db.Integer, db.ForeignKey('warehouse_locations.id'), nullable=False)
    
    # Transfer Details
    quantity = db.Column(db.Numeric(15, 2), nullable=False)
    uom = db.Column(db.String(20), nullable=False)
    
    # Batch Information
    batch_number = db.Column(db.String(100), nullable=True)
    lot_number = db.Column(db.String(100), nullable=True)
    serial_number = db.Column(db.String(100), nullable=True)
    
    # Status Tracking
    status = db.Column(db.String(50), nullable=False, default='pending')  # pending, in_transit, completed, cancelled
    requested_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    shipped_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    received_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Dates
    requested_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    approved_date = db.Column(db.DateTime, nullable=True)
    shipped_date = db.Column(db.DateTime, nullable=True)
    received_date = db.Column(db.DateTime, nullable=True)
    expected_date = db.Column(db.DateTime, nullable=True)
    
    # Additional Information
    reason = db.Column(db.String(200), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    priority = db.Column(db.String(20), nullable=False, default='normal')  # low, normal, high, urgent
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product')
    from_location = db.relationship('WarehouseLocation', foreign_keys=[from_location_id])
    to_location = db.relationship('WarehouseLocation', foreign_keys=[to_location_id])
    requested_by_user = db.relationship('User', foreign_keys=[requested_by])
    approved_by_user = db.relationship('User', foreign_keys=[approved_by])
    shipped_by_user = db.relationship('User', foreign_keys=[shipped_by])
    received_by_user = db.relationship('User', foreign_keys=[received_by])
    
    def __repr__(self):
        return f'<InventoryTransfer {self.transfer_number} - {self.quantity} {self.uom}>'
    
    @property
    def is_overdue(self):
        if self.expected_date and self.status not in ['completed', 'cancelled']:
            return datetime.utcnow() > self.expected_date
        return False
