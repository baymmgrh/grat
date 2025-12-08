from datetime import datetime
from . import db

class WasteCategory(db.Model):
    __tablename__ = 'waste_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    waste_type = db.Column(db.String(50), nullable=False)  # production_waste, packaging_waste, chemical_waste, general_waste
    hazard_level = db.Column(db.String(20), nullable=True)  # none, low, medium, high
    disposal_method = db.Column(db.String(200), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    waste_records = db.relationship('WasteRecord', back_populates='category')
    waste_targets = db.relationship('WasteTarget', back_populates='category')

class WasteRecord(db.Model):
    __tablename__ = 'waste_records'
    
    id = db.Column(db.Integer, primary_key=True)
    record_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey('waste_categories.id'), nullable=False)
    waste_date = db.Column(db.Date, nullable=False, index=True)
    source_department = db.Column(db.String(100), nullable=True)
    source_machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=True)
    work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=True)
    quantity = db.Column(db.Numeric(15, 2), nullable=False)
    uom = db.Column(db.String(20), nullable=False)
    weight_kg = db.Column(db.Numeric(15, 3), nullable=True)
    estimated_value = db.Column(db.Numeric(15, 2), default=0)
    reason = db.Column(db.Text, nullable=True)
    disposal_method = db.Column(db.String(200), nullable=True)
    disposal_date = db.Column(db.Date, nullable=True)
    disposal_cost = db.Column(db.Numeric(15, 2), default=0)
    status = db.Column(db.String(50), nullable=False, default='recorded')  # recorded, collected, disposed
    recorded_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = db.relationship('WasteCategory', back_populates='waste_records')
    machine = db.relationship('Machine')
    work_order = db.relationship('WorkOrder')
    recorded_by_user = db.relationship('User')

class WasteTarget(db.Model):
    __tablename__ = 'waste_targets'
    
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('waste_categories.id'), nullable=False)
    target_period = db.Column(db.String(20), nullable=False)  # monthly, quarterly, yearly
    period_start_date = db.Column(db.Date, nullable=False)
    period_end_date = db.Column(db.Date, nullable=False)
    target_quantity = db.Column(db.Numeric(15, 2), nullable=False)
    target_percentage = db.Column(db.Numeric(5, 2), nullable=True)  # % of production
    actual_quantity = db.Column(db.Numeric(15, 2), default=0)
    actual_percentage = db.Column(db.Numeric(5, 2), default=0)
    uom = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='active')  # active, completed, exceeded
    notes = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = db.relationship('WasteCategory', back_populates='waste_targets')
    created_by_user = db.relationship('User')

class WasteDisposal(db.Model):
    __tablename__ = 'waste_disposals'
    
    id = db.Column(db.Integer, primary_key=True)
    disposal_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    disposal_date = db.Column(db.Date, nullable=False, index=True)
    disposal_company = db.Column(db.String(255), nullable=True)
    disposal_method = db.Column(db.String(100), nullable=False)  # landfill, recycling, incineration, treatment
    total_weight_kg = db.Column(db.Numeric(15, 3), nullable=False)
    total_cost = db.Column(db.Numeric(15, 2), default=0)
    vehicle_number = db.Column(db.String(50), nullable=True)
    driver_name = db.Column(db.String(200), nullable=True)
    manifest_number = db.Column(db.String(100), nullable=True)
    certificate_number = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='scheduled')  # scheduled, collected, completed
    notes = db.Column(db.Text, nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    approved_by_user = db.relationship('User')
