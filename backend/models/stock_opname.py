"""
Stock Opname (Physical Inventory Count) Models
"""
from datetime import datetime
from . import db

class StockOpnameOrder(db.Model):
    """Perintah Stok Opname - Stock Count Order/Command"""
    __tablename__ = 'stock_opname_orders'
    
    id = db.Column(db.Integer, primary_key=True)
    opname_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    
    # Scope of count
    zone_id = db.Column(db.Integer, db.ForeignKey('warehouse_zones.id'), nullable=True)  # Null = all zones
    location_id = db.Column(db.Integer, db.ForeignKey('warehouse_locations.id'), nullable=True)  # Specific location
    
    # Type: full (semua barang), partial (barang tertentu), cycle (ABC class tertentu)
    opname_type = db.Column(db.String(20), nullable=False, default='full')
    
    # Dates
    scheduled_date = db.Column(db.Date, nullable=False)
    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)
    
    # Status: draft, scheduled, in_progress, completed, cancelled
    status = db.Column(db.String(20), nullable=False, default='draft')
    
    # Assigned team
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    team_members = db.Column(db.Text, nullable=True)  # JSON array of user IDs
    
    # Summary (filled after completion)
    total_items = db.Column(db.Integer, default=0)
    counted_items = db.Column(db.Integer, default=0)
    variance_items = db.Column(db.Integer, default=0)
    total_variance_value = db.Column(db.Numeric(15, 2), default=0)
    
    notes = db.Column(db.Text, nullable=True)
    
    # Approval
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    
    # Audit
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    zone = db.relationship('WarehouseZone', foreign_keys=[zone_id])
    location = db.relationship('WarehouseLocation', foreign_keys=[location_id])
    assigned_user = db.relationship('User', foreign_keys=[assigned_to])
    approved_by_user = db.relationship('User', foreign_keys=[approved_by])
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    items = db.relationship('StockOpnameItem', back_populates='opname_order', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'opname_number': self.opname_number,
            'zone_id': self.zone_id,
            'zone_name': self.zone.name if self.zone else 'Semua Zona',
            'location_id': self.location_id,
            'location_code': self.location.location_code if self.location else None,
            'opname_type': self.opname_type,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'status': self.status,
            'assigned_to': self.assigned_to,
            'assigned_to_name': self.assigned_user.full_name if self.assigned_user else None,
            'total_items': self.total_items,
            'counted_items': self.counted_items,
            'variance_items': self.variance_items,
            'total_variance_value': float(self.total_variance_value) if self.total_variance_value else 0,
            'notes': self.notes,
            'approved_by': self.approved_by,
            'approved_by_name': self.approved_by_user.full_name if self.approved_by_user else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'created_by': self.created_by,
            'created_by_name': self.created_by_user.full_name if self.created_by_user else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class StockOpnameItem(db.Model):
    """Item hasil penghitungan stok opname"""
    __tablename__ = 'stock_opname_items'
    
    id = db.Column(db.Integer, primary_key=True)
    opname_order_id = db.Column(db.Integer, db.ForeignKey('stock_opname_orders.id', ondelete='CASCADE'), nullable=False)
    
    # Item reference
    inventory_id = db.Column(db.Integer, db.ForeignKey('inventory.id'), nullable=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=True)
    location_id = db.Column(db.Integer, db.ForeignKey('warehouse_locations.id'), nullable=False)
    
    # Item details (snapshot at count time)
    item_code = db.Column(db.String(100), nullable=False)
    item_name = db.Column(db.String(255), nullable=False)
    batch_number = db.Column(db.String(100), nullable=True)
    uom = db.Column(db.String(20), nullable=False)
    
    # Quantities
    system_qty = db.Column(db.Numeric(15, 2), nullable=False, default=0)  # Qty in system
    counted_qty = db.Column(db.Numeric(15, 2), nullable=True)  # Qty counted
    variance_qty = db.Column(db.Numeric(15, 2), nullable=True)  # counted - system
    
    # Value
    unit_cost = db.Column(db.Numeric(15, 4), nullable=True)
    variance_value = db.Column(db.Numeric(15, 2), nullable=True)
    
    # Status: pending, counted, verified
    status = db.Column(db.String(20), nullable=False, default='pending')
    
    # Count info
    counted_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    counted_at = db.Column(db.DateTime, nullable=True)
    
    # Verification (double count)
    verified_qty = db.Column(db.Numeric(15, 2), nullable=True)
    verified_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    verified_at = db.Column(db.DateTime, nullable=True)
    
    notes = db.Column(db.Text, nullable=True)
    
    # Adjustment reference (if adjustment created)
    adjustment_id = db.Column(db.Integer, db.ForeignKey('inventory_adjustments.id'), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    opname_order = db.relationship('StockOpnameOrder', back_populates='items')
    inventory = db.relationship('Inventory')
    product = db.relationship('Product')
    material = db.relationship('Material')
    location = db.relationship('WarehouseLocation')
    counted_by_user = db.relationship('User', foreign_keys=[counted_by])
    verified_by_user = db.relationship('User', foreign_keys=[verified_by])
    
    def to_dict(self):
        return {
            'id': self.id,
            'opname_order_id': self.opname_order_id,
            'inventory_id': self.inventory_id,
            'product_id': self.product_id,
            'material_id': self.material_id,
            'location_id': self.location_id,
            'location_code': self.location.location_code if self.location else None,
            'item_code': self.item_code,
            'item_name': self.item_name,
            'batch_number': self.batch_number,
            'uom': self.uom,
            'system_qty': float(self.system_qty) if self.system_qty else 0,
            'counted_qty': float(self.counted_qty) if self.counted_qty is not None else None,
            'variance_qty': float(self.variance_qty) if self.variance_qty is not None else None,
            'unit_cost': float(self.unit_cost) if self.unit_cost else 0,
            'variance_value': float(self.variance_value) if self.variance_value is not None else None,
            'status': self.status,
            'counted_by': self.counted_by,
            'counted_by_name': self.counted_by_user.full_name if self.counted_by_user else None,
            'counted_at': self.counted_at.isoformat() if self.counted_at else None,
            'verified_qty': float(self.verified_qty) if self.verified_qty is not None else None,
            'verified_by': self.verified_by,
            'verified_by_name': self.verified_by_user.full_name if self.verified_by_user else None,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'notes': self.notes,
            'adjustment_id': self.adjustment_id
        }
