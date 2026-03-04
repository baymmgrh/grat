"""
Product Excel Schema - Backward compatibility layer
Provides ProductNew as an alias for the unified Product model.
All routes using ProductNew will now transparently use the products table.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from . import db
from .product import Product


# ProductNew is now just an alias for the unified Product model.
# The Product model has all the merged columns (gramasi, cd, md, pack_per_karton, etc.)
# and a to_dict() method that outputs API-compatible format (kode_produk, nama_produk).
ProductNew = Product


class ProductVersion(db.Model):
    """
    Product Version History - Track specification changes
    """
    __tablename__ = 'product_versions'

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    version = Column(Integer, nullable=False)
    change_type = Column(String(20), default='UPDATE')
    change_reason = Column(Text)
    changed_fields = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    old_values = Column(Text)
    new_values = Column(Text)

    # Relationships
    product = db.relationship('Product', backref=db.backref('versions', cascade='all, delete-orphan'))
    user = db.relationship('User', backref='product_versions')

    def __repr__(self):
        return f'<ProductVersion {self.product_id} v{self.version}>'
