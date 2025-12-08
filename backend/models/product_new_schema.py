"""
NEW PRODUCT SCHEMA - Matching Excel Structure Exactly
Based on produk.xlsx file structure
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship

db = SQLAlchemy()

class ProductNew(db.Model):
    """
    Product Master Table - Matches Excel Structure
    """
    __tablename__ = 'products_new'
    
    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Basic Information (Excel Columns 1-2)
    kode_produk = Column(String(50), unique=True, nullable=False)  # Column 1: KODE PRODUK
    nama_produk = Column(String(200), nullable=False)  # Column 2: NAMA PRODUK
    
    # Physical Properties (Excel Columns 3-5)
    gramasi = Column(Float)  # Column 3: GRAMASI
    cd = Column(Float)  # Column 4: CD
    md = Column(Float)  # Column 5: MD
    
    # Packaging Information (Excel Columns 6-7)
    sheet_per_pack = Column(String(20))  # Column 6: Sheet Per Pack (bisa string)
    pack_per_karton = Column(String(20))  # Column 7: Pack per Karton (bisa string)
    berat_kering = Column(String(20))  # Column 8: BERAT KERING (bisa string)
    
    # Batch Information (Excel Columns 9-11)
    ratio = Column(Float)  # Column 9: RATIO
    ingredient = Column(Float)  # Column 10: INGREDIENT
    ukuran_batch_vol = Column(Float)  # Column 11: UKURAN BATCH (VOL)
    ukuran_batch_ctn = Column(Float)  # Column 12: UKURAN BATCH (CTN)
    
    # Material Information (Excel Columns 13-16)
    spunlace = Column(String(50))  # Column 13: SPUNLACE
    rayon = Column(Float)  # Column 14: RAYON
    polyester = Column(Float)  # Column 15: POLYESTER
    es = Column(Float)  # Column 16: ES
    
    # Slitting Information (Excel Columns 17-19)
    slitting_cm = Column(Float)  # Column 17: SLITTING (CM)
    lebar_mr_net_cm = Column(Float)  # Column 18: LEBAR MR NETT (CM)
    lebar_mr_gross_cm = Column(Float)  # Column 19: LEBAR MR GROSS (CM)
    keterangan_slitting = Column(String(100))  # Column 20: KETERANGAN SLITTING
    
    # EPD Machine Information (Excel Columns 21-22)
    no_mesin_epd = Column(String(50))  # Column 21: NO MESIN EPD (bisa string MANUAL)
    speed_epd_pack_menit = Column(String(20))  # Column 22: SPEED EPD (PACK/MENIT) (bisa string MANUAL)
    
    # Fabric Information (Excel Columns 23-25)
    meter_kain = Column(Float)  # Column 23: METER KAIN
    kg_kain = Column(Float)  # Column 24: KG KAIN
    
    # Material Requirements (Excel Columns 26-28)
    kebutuhan_rayon_kg = Column(Float)  # Column 26: KEBUTUHAN RAYON DALAM KG
    kebutuhan_polyester_kg = Column(Float)  # Column 27: KEBUTUHAN POLYESTER DALAM KG
    kebutuhan_es_kg = Column(Float)  # Column 28: KEBUTUHAN ES DALAM KG
    
    # Production Process (Excel Columns 29-32)
    process_produksi = Column(String(200))  # Column 29: PROCESS PRODUKSI
    kode_jumbo_roll = Column(String(50))  # Column 30: KODE JUMBO ROLL (bisa string)
    nama_jumbo_roll = Column(String(200))  # Column 31: NAMA JUMBO ROLL
    kode_main_roll = Column(String(50))  # Column 32: KODE MAIN ROLL (bisa string)
    nama_main_roll = Column(String(200))  # Column 33: NAMA MAIN ROLL
    
    # Mixing Process (Excel Columns 34-36)
    kapasitas_mixing_kg = Column(String(20))  # Column 34: KAPASITAS MIXING DALAM KG (bisa string)
    actual_mixing_kg = Column(String(20))  # Column 35: ACTUAL MIXING DALAM KG (bisa string)
    dosing_kg = Column(String(20))  # Column 36: DOSING DALAM KG (bisa string)
    
    # Additional Fields (Not in Excel but needed for system)
    is_active = Column(Boolean, default=True)
    version = Column(Integer, default=0)  # Versioning system
    notes = Column(Text)  # Additional notes
    
    # Relationships - Hubungan dengan semua modul ERP
    inventory_items = relationship('InventoryItemNew', back_populates='product')
    bom_items = relationship('BOMItemNew', back_populates='product')
    work_orders = relationship('WorkOrderNew', back_populates='product')
    
    # Hubungan dengan modul lain akan ditambahkan setelah import data
    # Sales Order Items
    # sales_order_items = relationship('SalesOrderItem', backref='product_new', foreign_keys='SalesOrderItem.product_id')
    
    # Inventory & Stock
    # inventory_records = relationship('Inventory', backref='product_new', foreign_keys='Inventory.product_id')
    
    # Production Records
    # production_records = relationship('ProductionRecord', backref='product_new', foreign_keys='ProductionRecord.product_id')
    
    # Quality Inspections
    # quality_inspections = relationship('QualityInspection', backref='product_new', foreign_keys='QualityInspection.product_id')
    
    # Work Orders (lama)
    # work_order_items = relationship('WorkOrder', backref='product_new', foreign_keys='WorkOrder.product_id')
    
    # Bill of Materials
    # bom_items_legacy = relationship('BOMItem', backref='product_new', foreign_keys='BOMItem.product_id')
    
    # Product Development
    # product_developments = relationship('ProductDevelopment', backref='product_new', foreign_keys='ProductDevelopment.product_id')
    
    # Product Test Results
    # test_results = relationship('ProductTestResult', backref='product_new', foreign_keys='ProductTestResult.product_id')
    
    def __repr__(self):
        return f'<ProductNew {self.kode_produk}: {self.nama_produk}>'
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'kode_produk': self.kode_produk,
            'nama_produk': self.nama_produk,
            'gramasi': self.gramasi,
            'cd': self.cd,
            'md': self.md,
            'sheet_per_pack': self.sheet_per_pack,
            'pack_per_karton': self.pack_per_karton,
            'berat_kering': self.berat_kering,
            'ratio': self.ratio,
            'ingredient': self.ingredient,
            'ukuran_batch_vol': self.ukuran_batch_vol,
            'ukuran_batch_ctn': self.ukuran_batch_ctn,
            'spunlace': self.spunlace,
            'rayon': self.rayon,
            'polyester': self.polyester,
            'es': self.es,
            'slitting_cm': self.slitting_cm,
            'lebar_mr_net_cm': self.lebar_mr_net_cm,
            'lebar_mr_gross_cm': self.lebar_mr_gross_cm,
            'keterangan_slitting': self.keterangan_slitting,
            'no_mesin_epd': self.no_mesin_epd,
            'speed_epd_pack_menit': self.speed_epd_pack_menit,
            'meter_kain': self.meter_kain,
            'kg_kain': self.kg_kain,
            'kebutuhan_rayon_kg': self.kebutuhan_rayon_kg,
            'kebutuhan_polyester_kg': self.kebutuhan_polyester_kg,
            'kebutuhan_es_kg': self.kebutuhan_es_kg,
            'process_produksi': self.process_produksi,
            'kode_jumbo_roll': self.kode_jumbo_roll,
            'nama_jumbo_roll': self.nama_jumbo_roll,
            'kode_main_roll': self.kode_main_roll,
            'nama_main_roll': self.nama_main_roll,
            'kapasitas_mixing_kg': self.kapasitas_mixing_kg,
            'actual_mixing_kg': self.actual_mixing_kg,
            'dosing_kg': self.dosing_kg,
            'is_active': self.is_active,
            'version': self.version,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class ProductVersion(db.Model):
    """
    Product Version History - Track changes to product specifications
    """
    __tablename__ = 'product_versions'
    
    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Reference to current product
    product_id = Column(Integer, ForeignKey('products_new.id'), nullable=False)
    
    # Version information
    version = Column(Integer, nullable=False)
    change_reason = Column(Text)  # Reason for version change
    
    # Store all previous data as JSON for easy comparison
    previous_data = Column(db.JSON)  # Complete previous product data
    
    # Who made the change
    created_by = Column(Integer, ForeignKey('users.id'))
    
    def __repr__(self):
        return f'<ProductVersion {self.product_id}: v{self.version}>'

# Related Models (Simplified for new schema)
class InventoryItemNew(db.Model):
    """Inventory items linked to new product schema"""
    __tablename__ = 'inventory_items_new'
    
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey('products_new.id'), nullable=False)
    quantity = Column(Float, default=0)
    location = Column(String(100))
    
    product = relationship('ProductNew', back_populates='inventory_items')

class BOMItemNew(db.Model):
    """Bill of Materials items linked to new product schema"""
    __tablename__ = 'bom_items_new'
    
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey('products_new.id'), nullable=False)
    material_code = Column(String(50))
    quantity = Column(Float)
    unit = Column(String(20))
    
    product = relationship('ProductNew', back_populates='bom_items')

class WorkOrderNew(db.Model):
    """Work orders linked to new product schema"""
    __tablename__ = 'work_orders_new'
    
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey('products_new.id'), nullable=False)
    order_number = Column(String(50))
    quantity = Column(Float)
    status = Column(String(20))
    
    product = relationship('ProductNew', back_populates='work_orders')

# Migration helper
def migrate_to_new_schema():
    """
    Helper function to migrate data from old schema to new schema
    """
    from models.product import Product, ProductSpecification, ProductPackaging
    
    print("🔄 Migrating to new product schema...")
    
    # Get all old products
    old_products = Product.query.all()
    
    migrated_count = 0
    
    for old_product in old_products:
        try:
            # Create new product
            new_product = ProductNew()
            
            # Map old fields to new fields
            new_product.kode_produk = old_product.code
            new_product.nama_produk = old_product.name
            
            # Get specifications
            spec = ProductSpecification.query.filter_by(product_id=old_product.id).first()
            if spec:
                new_product.gramasi = spec.gsm
                new_product.cd = spec.width_cm * 10  # Convert cm to mm
                new_product.md = spec.length_m * 1000  # Convert m to mm
                new_product.berat_kering = spec.weight_per_sheet_g
            
            # Get packaging
            packaging = ProductPackaging.query.filter_by(product_id=old_product.id).first()
            if packaging:
                new_product.sheet_per_pack = packaging.sheets_per_pack
                new_product.pack_per_karton = packaging.packs_per_karton
            
            # Set default values
            new_product.version = 0
            new_product.is_active = old_product.is_active
            
            db.session.add(new_product)
            migrated_count += 1
            
        except Exception as e:
            print(f"❌ Error migrating {old_product.code}: {e}")
    
    try:
        db.session.commit()
        print(f"✅ Successfully migrated {migrated_count} products to new schema")
    except Exception as e:
        db.session.rollback()
        print(f"❌ Migration failed: {e}")
    
    return migrated_count
