"""
Product New Schema - Backward compatibility layer
Points to unified 'products' table after merge.
Related models (InventoryItemNew, BOMItemNew, WorkOrderNew) reference backup tables.
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship

# Re-export Product as ProductNew for backward compatibility
from .product import Product as ProductNew

# These related models reference products_new_backup tables
# They are kept for import compatibility but the actual tables may not be actively used
from . import db


class InventoryItemNew(db.Model):
    """Inventory items linked to product schema (legacy)"""
    __tablename__ = 'inventory_items_new'

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, nullable=False)
    quantity = Column(Float, default=0)
    location = Column(String(100))


class BOMItemNew(db.Model):
    """Bill of Materials items linked to product schema (legacy)"""
    __tablename__ = 'bom_items_new'

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, nullable=False)
    material_code = Column(String(50))
    quantity = Column(Float)
    unit = Column(String(20))


class WorkOrderNew(db.Model):
    """Work orders linked to product schema (legacy)"""
    __tablename__ = 'work_orders_new'

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, nullable=False)
    order_number = Column(String(50))
    quantity = Column(Float)
    status = Column(String(20))


# Migration helper (deprecated - migration already done)
def migrate_to_new_schema():
    print("Migration already completed. products_new merged into products.")
    return 0
