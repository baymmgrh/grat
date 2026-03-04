"""
Custom BOM - Allows editing BOM details per transaction without modifying master BOM
Used in: Sales Orders, Production Schedules, Forecasts
"""
from datetime import datetime
from . import db

class CustomBOM(db.Model):
    """Custom BOM for specific transactions - does not affect master BOM"""
    __tablename__ = 'custom_boms'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Reference to master BOM (optional - can be created from scratch)
    master_bom_id = db.Column(db.Integer, db.ForeignKey('bill_of_materials.id'), nullable=True)
    
    # Reference to source transaction
    reference_type = db.Column(db.String(50), nullable=False)  # sales_order, schedule, forecast, work_order
    reference_id = db.Column(db.Integer, nullable=False)
    
    # Product info
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    
    # BOM details (can be different from master)
    batch_size = db.Column(db.Numeric(15, 2), nullable=False, default=1)
    batch_uom = db.Column(db.String(20), nullable=False, default='pcs')
    pack_per_carton = db.Column(db.Integer, nullable=True)
    
    # Status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    
    # Audit
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    master_bom = db.relationship('BillOfMaterials', backref='custom_boms')
    product = db.relationship('Product')
    items = db.relationship('CustomBOMItem', back_populates='custom_bom', cascade='all, delete-orphan')
    created_by_user = db.relationship('User')
    
    def to_dict(self):
        return {
            'id': self.id,
            'master_bom_id': self.master_bom_id,
            'master_bom_number': self.master_bom.bom_number if self.master_bom else None,
            'reference_type': self.reference_type,
            'reference_id': self.reference_id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'product_code': self.product.code if self.product else None,
            'batch_size': float(self.batch_size) if self.batch_size else 1,
            'batch_uom': self.batch_uom,
            'pack_per_carton': self.pack_per_carton,
            'is_active': self.is_active,
            'notes': self.notes,
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def create_from_master(cls, master_bom_id, reference_type, reference_id, created_by=None):
        """Create a custom BOM by copying from master BOM"""
        from models.production import BillOfMaterials
        
        master = BillOfMaterials.query.get(master_bom_id)
        if not master:
            return None
        
        custom = cls(
            master_bom_id=master_bom_id,
            reference_type=reference_type,
            reference_id=reference_id,
            product_id=master.product_id,
            batch_size=master.batch_size,
            batch_uom=master.batch_uom,
            pack_per_carton=master.pack_per_carton,
            created_by=created_by
        )
        db.session.add(custom)
        db.session.flush()
        
        # Copy items
        for master_item in master.items:
            custom_item = CustomBOMItem(
                custom_bom_id=custom.id,
                line_number=master_item.line_number,
                item_type=master_item.item_type,
                item_code=master_item.item_code,
                item_name=master_item.item_name,
                material_id=master_item.material_id,
                quantity=master_item.quantity,
                uom=master_item.uom,
                scrap_percent=master_item.scrap_percent,
                is_critical=master_item.is_critical,
                unit_cost=master_item.unit_cost,
                notes=master_item.notes
            )
            db.session.add(custom_item)
        
        return custom


class CustomBOMItem(db.Model):
    """Custom BOM Item - can be modified without affecting master BOM"""
    __tablename__ = 'custom_bom_items'
    
    id = db.Column(db.Integer, primary_key=True)
    custom_bom_id = db.Column(db.Integer, db.ForeignKey('custom_boms.id', ondelete='CASCADE'), nullable=False)
    
    # Item details
    line_number = db.Column(db.Integer, nullable=False)
    item_type = db.Column(db.String(50), nullable=False)  # raw_materials, packaging_materials, chemical_materials
    item_code = db.Column(db.String(100), nullable=False)
    item_name = db.Column(db.String(200), nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=True)
    
    # Quantity (can be different from master)
    quantity = db.Column(db.Numeric(15, 4), nullable=False)
    uom = db.Column(db.String(20), nullable=False)
    scrap_percent = db.Column(db.Numeric(5, 2), default=0)
    
    # Flags
    is_critical = db.Column(db.Boolean, default=False)
    is_modified = db.Column(db.Boolean, default=False)  # Track if modified from master
    is_added = db.Column(db.Boolean, default=False)  # Track if added (not in master)
    is_removed = db.Column(db.Boolean, default=False)  # Track if removed from master
    
    # Cost
    unit_cost = db.Column(db.Numeric(15, 4), default=0)
    
    # Notes
    notes = db.Column(db.Text, nullable=True)
    modification_reason = db.Column(db.Text, nullable=True)  # Why was it modified
    
    # Relationships
    custom_bom = db.relationship('CustomBOM', back_populates='items')
    material = db.relationship('Material')
    
    def to_dict(self):
        return {
            'id': self.id,
            'custom_bom_id': self.custom_bom_id,
            'line_number': self.line_number,
            'item_type': self.item_type,
            'item_code': self.item_code,
            'item_name': self.item_name,
            'material_id': self.material_id,
            'quantity': float(self.quantity) if self.quantity else 0,
            'uom': self.uom,
            'scrap_percent': float(self.scrap_percent) if self.scrap_percent else 0,
            'is_critical': self.is_critical,
            'is_modified': self.is_modified,
            'is_added': self.is_added,
            'is_removed': self.is_removed,
            'unit_cost': float(self.unit_cost) if self.unit_cost else 0,
            'notes': self.notes,
            'modification_reason': self.modification_reason
        }
