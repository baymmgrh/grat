from datetime import datetime
from . import db

class MaterialIssue(db.Model):
    """Material issue for production work orders"""
    __tablename__ = 'material_issues'
    
    id = db.Column(db.Integer, primary_key=True)
    issue_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=False)
    issue_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    requested_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    issued_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Status and workflow
    status = db.Column(db.String(50), nullable=False, default='pending')  # pending, approved, issued, cancelled
    priority = db.Column(db.String(20), nullable=False, default='normal')  # low, normal, high, urgent
    
    # Issue details
    issue_type = db.Column(db.String(50), nullable=False, default='production')  # production, maintenance, rework
    department = db.Column(db.String(100), nullable=True)
    cost_center = db.Column(db.String(100), nullable=True)
    
    # Dates
    required_date = db.Column(db.DateTime, nullable=True)
    approved_date = db.Column(db.DateTime, nullable=True)
    issued_date = db.Column(db.DateTime, nullable=True)
    
    # Additional information
    notes = db.Column(db.Text, nullable=True)
    special_instructions = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    work_order = db.relationship('WorkOrder')
    requested_by_user = db.relationship('User', foreign_keys=[requested_by])
    approved_by_user = db.relationship('User', foreign_keys=[approved_by])
    issued_by_user = db.relationship('User', foreign_keys=[issued_by])
    items = db.relationship('MaterialIssueItem', back_populates='material_issue', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<MaterialIssue {self.issue_number} - {self.status}>'
    
    @property
    def total_items(self):
        return len(self.items)
    
    @property
    def total_cost(self):
        return sum(item.total_cost for item in self.items if item.total_cost)

class MaterialIssueItem(db.Model):
    """Individual items in a material issue"""
    __tablename__ = 'material_issue_items'
    
    id = db.Column(db.Integer, primary_key=True)
    material_issue_id = db.Column(db.Integer, db.ForeignKey('material_issues.id', ondelete='CASCADE'), nullable=False)
    line_number = db.Column(db.Integer, nullable=False)
    
    # Material details
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    description = db.Column(db.Text, nullable=False)
    
    # Quantities
    required_quantity = db.Column(db.Numeric(15, 2), nullable=False)
    issued_quantity = db.Column(db.Numeric(15, 2), default=0)
    returned_quantity = db.Column(db.Numeric(15, 2), default=0)
    uom = db.Column(db.String(20), nullable=False)
    
    # Inventory details
    warehouse_location_id = db.Column(db.Integer, db.ForeignKey('warehouse_locations.id'), nullable=True)
    batch_number = db.Column(db.String(100), nullable=True)
    lot_number = db.Column(db.String(100), nullable=True)
    serial_number = db.Column(db.String(100), nullable=True)
    
    # Cost information
    unit_cost = db.Column(db.Numeric(15, 4), nullable=True)
    total_cost = db.Column(db.Numeric(15, 2), nullable=True)
    
    # Status
    status = db.Column(db.String(50), nullable=False, default='pending')  # pending, issued, partial, returned
    
    # Additional information
    notes = db.Column(db.Text, nullable=True)
    substitute_material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    material_issue = db.relationship('MaterialIssue', back_populates='items')
    material = db.relationship('Material', foreign_keys=[material_id])
    product = db.relationship('Product')
    warehouse_location = db.relationship('WarehouseLocation')
    substitute_material = db.relationship('Material', foreign_keys=[substitute_material_id])
    
    def __repr__(self):
        return f'<MaterialIssueItem {self.line_number} - {self.required_quantity} {self.uom}>'
    
    @property
    def pending_quantity(self):
        return self.required_quantity - self.issued_quantity
    
    @property
    def is_fully_issued(self):
        return self.issued_quantity >= self.required_quantity
    
    @property
    def is_partially_issued(self):
        return self.issued_quantity > 0 and self.issued_quantity < self.required_quantity

class MaterialReturn(db.Model):
    """Material return from production"""
    __tablename__ = 'material_returns'
    
    id = db.Column(db.Integer, primary_key=True)
    return_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    material_issue_id = db.Column(db.Integer, db.ForeignKey('material_issues.id'), nullable=False)
    return_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    returned_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    received_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Return details
    return_type = db.Column(db.String(50), nullable=False)  # unused, defective, excess
    reason = db.Column(db.String(200), nullable=True)
    condition = db.Column(db.String(50), nullable=False)  # good, damaged, expired
    
    # Status
    status = db.Column(db.String(50), nullable=False, default='pending')  # pending, received, processed
    
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    material_issue = db.relationship('MaterialIssue')
    returned_by_user = db.relationship('User', foreign_keys=[returned_by])
    received_by_user = db.relationship('User', foreign_keys=[received_by])
    items = db.relationship('MaterialReturnItem', back_populates='material_return', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<MaterialReturn {self.return_number} - {self.return_type}>'

class MaterialReturnItem(db.Model):
    """Individual items in a material return"""
    __tablename__ = 'material_return_items'
    
    id = db.Column(db.Integer, primary_key=True)
    material_return_id = db.Column(db.Integer, db.ForeignKey('material_returns.id', ondelete='CASCADE'), nullable=False)
    material_issue_item_id = db.Column(db.Integer, db.ForeignKey('material_issue_items.id'), nullable=False)
    
    # Return quantities
    returned_quantity = db.Column(db.Numeric(15, 2), nullable=False)
    accepted_quantity = db.Column(db.Numeric(15, 2), default=0)
    rejected_quantity = db.Column(db.Numeric(15, 2), default=0)
    uom = db.Column(db.String(20), nullable=False)
    
    # Condition details
    condition = db.Column(db.String(50), nullable=False)  # good, damaged, expired
    disposition = db.Column(db.String(50), nullable=True)  # restock, scrap, rework, quarantine
    
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    material_return = db.relationship('MaterialReturn', back_populates='items')
    material_issue_item = db.relationship('MaterialIssueItem')
    
    def __repr__(self):
        return f'<MaterialReturnItem {self.returned_quantity} {self.uom} - {self.condition}>'
