from datetime import datetime
from . import db

class WorkOrderBOMItem(db.Model):
    """
    Work Order specific BOM items - Copy of BOM items that can be edited
    without affecting the master BOM. This allows field adjustments.
    """
    __tablename__ = 'work_order_bom_items'
    
    id = db.Column(db.Integer, primary_key=True)
    work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id', ondelete='CASCADE'), nullable=False)
    
    # Original BOM reference (for tracking)
    original_bom_id = db.Column(db.Integer, db.ForeignKey('bill_of_materials.id'), nullable=True)
    original_bom_item_id = db.Column(db.Integer, db.ForeignKey('bom_items.id'), nullable=True)
    
    # Item details (copied from BOM or manually added)
    line_number = db.Column(db.Integer, nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    item_name = db.Column(db.String(200), nullable=False)  # Denormalized for display
    item_code = db.Column(db.String(100), nullable=True)
    item_type = db.Column(db.String(50), nullable=True)  # kain, ingredient, packaging, stiker, etc.
    
    # Quantities - can be edited without affecting master BOM
    quantity_per_unit = db.Column(db.Numeric(20, 10), nullable=False)  # Qty per 1 unit product
    uom = db.Column(db.String(20), nullable=False)
    scrap_percent = db.Column(db.Numeric(5, 2), default=0)
    
    # Actual usage tracking
    quantity_planned = db.Column(db.Numeric(15, 4), nullable=True)  # quantity_per_unit * WO quantity
    quantity_actual = db.Column(db.Numeric(15, 4), nullable=True)   # Actual usage from production
    quantity_variance = db.Column(db.Numeric(15, 4), nullable=True) # Difference
    
    # Cost tracking
    unit_cost = db.Column(db.Numeric(15, 4), nullable=True)
    total_cost_planned = db.Column(db.Numeric(15, 4), nullable=True)
    total_cost_actual = db.Column(db.Numeric(15, 4), nullable=True)
    
    # Edit tracking
    is_modified = db.Column(db.Boolean, default=False)  # True if edited from original BOM
    is_added = db.Column(db.Boolean, default=False)     # True if manually added (not from BOM)
    modified_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    modified_at = db.Column(db.DateTime, nullable=True)
    modification_reason = db.Column(db.Text, nullable=True)
    
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    work_order = db.relationship('WorkOrder', backref=db.backref('wo_bom_items', cascade='all, delete-orphan'))
    material = db.relationship('Material')
    product = db.relationship('Product')
    modified_by_user = db.relationship('User')
    
    __table_args__ = (
        db.UniqueConstraint('work_order_id', 'line_number', name='unique_wo_bom_line'),
        db.Index('idx_wo_bom_work_order', 'work_order_id'),
    )
    
    @property
    def effective_quantity(self):
        """Calculate quantity including scrap percentage"""
        base_quantity = float(self.quantity_per_unit)
        scrap_quantity = base_quantity * (float(self.scrap_percent or 0) / 100)
        return base_quantity + scrap_quantity
    
    @property
    def total_planned_quantity(self):
        """Get planned quantity for the work order"""
        return float(self.quantity_planned) if self.quantity_planned else 0
    
    def __repr__(self):
        return f'<WorkOrderBOMItem WO:{self.work_order_id} Line:{self.line_number} - {self.item_name}>'
