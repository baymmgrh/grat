from datetime import datetime
from . import db

class WarehouseZone(db.Model):
    __tablename__ = 'warehouse_zones'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    material_type = db.Column(db.String(50), nullable=False)  # finished_goods, raw_materials, packaging_materials, chemical_materials
    zone_type = db.Column(db.String(50), nullable=False, default='storage')  # storage, production, staging, quarantine
    capacity = db.Column(db.Numeric(15, 2), nullable=True)
    capacity_uom = db.Column(db.String(20), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    locations = db.relationship('WarehouseLocation', back_populates='zone', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<WarehouseZone {self.code} - {self.name}>'

class WarehouseLocation(db.Model):
    __tablename__ = 'warehouse_locations'
    
    id = db.Column(db.Integer, primary_key=True)
    zone_id = db.Column(db.Integer, db.ForeignKey('warehouse_zones.id', ondelete='CASCADE'), nullable=False)
    location_code = db.Column(db.String(100), unique=True, nullable=False, index=True)  # ZONE-RACK-LEVEL-POSITION
    rack = db.Column(db.String(50), nullable=False)
    level = db.Column(db.String(50), nullable=False)
    position = db.Column(db.String(50), nullable=False)
    capacity = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    capacity_uom = db.Column(db.String(20), nullable=False)
    occupied = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_available = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    zone = db.relationship('WarehouseZone', back_populates='locations')
    inventory_items = db.relationship('Inventory', back_populates='location', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Location {self.location_code}>'

class Inventory(db.Model):
    __tablename__ = 'inventory'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=True)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id', ondelete='CASCADE'), nullable=True)
    location_id = db.Column(db.Integer, db.ForeignKey('warehouse_locations.id', ondelete='CASCADE'), nullable=False)
    quantity_on_hand = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    quantity_reserved = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    quantity_available = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    min_stock_level = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    max_stock_level = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    batch_number = db.Column(db.String(100), nullable=True, index=True)
    lot_number = db.Column(db.String(100), nullable=True)
    serial_number = db.Column(db.String(100), nullable=True)
    production_date = db.Column(db.Date, nullable=True)
    expiry_date = db.Column(db.Date, nullable=True)
    last_stock_check = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Stock Status
    # For Products (Finished Goods): released, quarantine, reject (from QC)
    # For Materials (Raw Materials): available, on_hold, rejected (from GRN inspection)
    stock_status = db.Column(db.String(20), nullable=False, default='available')
    qc_inspection_id = db.Column(db.Integer, db.ForeignKey('quality_inspections.id'), nullable=True)
    work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=True)
    qc_date = db.Column(db.DateTime, nullable=True)
    qc_notes = db.Column(db.Text, nullable=True)
    
    # GRN reference for materials
    grn_id = db.Column(db.Integer, db.ForeignKey('goods_received_notes.id'), nullable=True)
    supplier_batch = db.Column(db.String(100), nullable=True)  # Batch dari supplier
    
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product', back_populates='inventory_items')
    material = db.relationship('Material', back_populates='inventory_items')
    location = db.relationship('WarehouseLocation', back_populates='inventory_items')
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    
    __table_args__ = (
        db.Index('idx_product_location', 'product_id', 'location_id'),
        db.Index('idx_material_location', 'material_id', 'location_id'),
        db.CheckConstraint('(product_id IS NOT NULL AND material_id IS NULL) OR (product_id IS NULL AND material_id IS NOT NULL)', name='check_product_or_material'),
    )

class InventoryMovement(db.Model):
    __tablename__ = 'inventory_movements'
    
    id = db.Column(db.Integer, primary_key=True)
    inventory_id = db.Column(db.Integer, db.ForeignKey('inventory.id'), nullable=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=True)
    location_id = db.Column(db.Integer, db.ForeignKey('warehouse_locations.id'), nullable=True)
    movement_type = db.Column(db.String(50), nullable=False)  # stock_in, stock_out, transfer, adjust
    movement_date = db.Column(db.Date, nullable=True)
    quantity = db.Column(db.Numeric(15, 2), nullable=False)
    reference_number = db.Column(db.String(100), nullable=True, index=True)
    reference_type = db.Column(db.String(50), nullable=True)  # sales_order, purchase_order, work_order, manual_input
    reference_id = db.Column(db.Integer, nullable=True)
    batch_number = db.Column(db.String(100), nullable=True)
    lot_number = db.Column(db.String(100), nullable=True)
    serial_number = db.Column(db.String(100), nullable=True)
    expiry_date = db.Column(db.Date, nullable=True)
    unit_cost = db.Column(db.Numeric(15, 4), nullable=True)
    total_cost = db.Column(db.Numeric(15, 2), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    inventory = db.relationship('Inventory', backref='movements')
    product = db.relationship('Product')
    material = db.relationship('Material')
    location = db.relationship('WarehouseLocation')
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    
    def __repr__(self):
        return f'<InventoryMovement {self.movement_type} - {self.quantity}>'
    
    __table_args__ = (
        db.Index('idx_reference', 'reference_type', 'reference_id'),
        db.Index('idx_movement_date', 'movement_date'),
    )
