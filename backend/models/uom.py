"""
Unit of Measure (UoM) Models
Master data satuan dan konversi antar satuan.
Konversi bersifat fleksibel per item (material/product), bukan global.
"""
from datetime import datetime
from . import db


class UnitOfMeasure(db.Model):
    """Master satuan barang — pcs, roll, kg, pack, karton, liter, dll."""
    __tablename__ = 'units_of_measure'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False, index=True)  # PCS, ROLL, KG, PACK, CTN, LTR
    name = db.Column(db.String(100), nullable=False)  # Pieces, Roll, Kilogram, Pack, Carton, Liter
    category = db.Column(db.String(50), nullable=False, default='unit')  # unit, weight, length, volume, area
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    conversions_from = db.relationship('UoMConversion', foreign_keys='UoMConversion.from_uom_id',
                                       back_populates='from_uom', cascade='all, delete-orphan')
    conversions_to = db.relationship('UoMConversion', foreign_keys='UoMConversion.to_uom_id',
                                     back_populates='to_uom', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<UoM {self.code} - {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'category': self.category,
            'description': self.description,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class UoMConversion(db.Model):
    """
    Konversi antar satuan, terikat ke material/product tertentu.
    Contoh: Stiker Brand X → 1 ROLL = 2000 PCS (untuk produk A)
            Stiker Brand X → 1 ROLL = 1500 PCS (untuk produk B)
            Packaging Y    → 1 ROLL = 1940 PCS
            Finished Good Z → 1 CTN = 24 PACK (tapi ROLL ≠ PCS)
    
    Jika material_id dan product_id keduanya NULL, berarti konversi global (default).
    """
    __tablename__ = 'uom_conversions'

    id = db.Column(db.Integer, primary_key=True)
    from_uom_id = db.Column(db.Integer, db.ForeignKey('units_of_measure.id', ondelete='CASCADE'), nullable=False)
    to_uom_id = db.Column(db.Integer, db.ForeignKey('units_of_measure.id', ondelete='CASCADE'), nullable=False)
    conversion_factor = db.Column(db.Numeric(20, 10), nullable=False)  # 1 from_uom = X to_uom

    # Scope: tied to specific material or product (NULL = global default)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id', ondelete='CASCADE'), nullable=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=True)

    is_active = db.Column(db.Boolean, default=True, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    from_uom = db.relationship('UnitOfMeasure', foreign_keys=[from_uom_id], back_populates='conversions_from')
    to_uom = db.relationship('UnitOfMeasure', foreign_keys=[to_uom_id], back_populates='conversions_to')
    material = db.relationship('Material', backref='uom_conversions')
    product = db.relationship('Product', backref='uom_conversions')

    __table_args__ = (
        db.UniqueConstraint('from_uom_id', 'to_uom_id', 'material_id', 'product_id',
                            name='unique_uom_conversion'),
    )

    def __repr__(self):
        scope = ''
        if self.material_id:
            scope = f' (material={self.material_id})'
        elif self.product_id:
            scope = f' (product={self.product_id})'
        return f'<UoMConversion 1 {self.from_uom.code if self.from_uom else "?"} = {self.conversion_factor} {self.to_uom.code if self.to_uom else "?"}{scope}>'

    def to_dict(self):
        return {
            'id': self.id,
            'from_uom_id': self.from_uom_id,
            'from_uom_code': self.from_uom.code if self.from_uom else None,
            'from_uom_name': self.from_uom.name if self.from_uom else None,
            'to_uom_id': self.to_uom_id,
            'to_uom_code': self.to_uom.code if self.to_uom else None,
            'to_uom_name': self.to_uom.name if self.to_uom else None,
            'conversion_factor': float(self.conversion_factor),
            'material_id': self.material_id,
            'material_name': self.material.name if self.material else None,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'scope': 'material' if self.material_id else ('product' if self.product_id else 'global'),
            'is_active': self.is_active,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
