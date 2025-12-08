from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from . import db

class ProductNew(db.Model):
    """
    Product Master Table - Matches Excel Structure Exactly
    35 Columns from Excel + System Fields + Versioning
    """
    __tablename__ = 'products_new'
    
    # System Fields
    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    version = Column(Integer, default=0)  # Version tracking
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Excel Column 1: KODE PRODUK
    kode_produk = Column(String(50), unique=True, nullable=False, index=True)
    
    # Excel Column 2: NAMA PRODUK
    nama_produk = Column(String(200), nullable=False, index=True)
    
    # Excel Column 3: GRAMASI
    gramasi = Column(String(20))  # String untuk handle MANUAL
    
    # Excel Column 4: CD
    cd = Column(String(20))  # String untuk handle MANUAL
    
    # Excel Column 5: MD
    md = Column(String(20))  # String untuk handle MANUAL
    
    # Excel Column 6: Sheet Per Pack
    sheet_per_pack = Column(String(20))
    
    # Excel Column 7: Pack per Karton
    pack_per_karton = Column(String(20))
    
    # Excel Column 8: BERAT KERING
    berat_kering = Column(String(20))
    
    # Excel Column 9: RATIO
    ratio = Column(String(20))
    
    # Excel Column 10: INGREDIENT
    ingredient = Column(String(20))
    
    # Excel Column 11: UKURAN BATCH (VOL)
    ukuran_batch_vol = Column(String(20))
    
    # Excel Column 12: UKURAN BATCH (CTN)
    ukuran_batch_ctn = Column(String(20))
    
    # Excel Column 13: SPUNLACE
    spunlace = Column(String(50))
    
    # Excel Column 14: RAYON
    rayon = Column(String(20))
    
    # Excel Column 15: POLYESTER
    polyester = Column(String(20))
    
    # Excel Column 16: ES
    es = Column(String(20))
    
    # Excel Column 17: SLITTING (CM)
    slitting_cm = Column(String(20))
    
    # Excel Column 18: LEBAR MR NETT (CM)
    lebar_mr_net_cm = Column(String(20))
    
    # Excel Column 19: LEBAR MR GROSS (CM)
    lebar_mr_gross_cm = Column(String(20))
    
    # Excel Column 20: KETERANGAN SLITTING
    keterangan_slitting = Column(String(100))
    
    # Excel Column 21: NO MESIN EPD
    no_mesin_epd = Column(String(50))
    
    # Excel Column 22: SPEED EPD (PACK/MENIT)
    speed_epd_pack_menit = Column(String(20))
    
    # Excel Column 23: METER KAIN
    meter_kain = Column(String(20))
    
    # Excel Column 24: KG KAIN
    kg_kain = Column(String(20))
    
    # Excel Column 25: KEBUTUHAN RAYON DALAM KG
    kebutuhan_rayon_kg = Column(String(20))
    
    # Excel Column 26: KEBUTUHAN POLYESTER DALAM KG
    kebutuhan_polyester_kg = Column(String(20))
    
    # Excel Column 27: KEBUTUHAN ES DALAM KG
    kebutuhan_es_kg = Column(String(20))
    
    # Excel Column 28: PROCESS PRODUKSI
    process_produksi = Column(String(100))
    
    # Excel Column 29: KODE JUMBO ROLL
    kode_jumbo_roll = Column(String(50))
    
    # Excel Column 30: NAMA JUMBO ROLL
    nama_jumbo_roll = Column(String(200))
    
    # Excel Column 31: KODE MAIN ROLL
    kode_main_roll = Column(String(50))
    
    # Excel Column 32: NAMA MAIN ROLL
    nama_main_roll = Column(String(200))
    
    # Excel Column 33: KAPASITAS MIXING DALAM KG
    kapasitas_mixing_kg = Column(String(20))
    
    # Excel Column 34: ACTUAL MIXING DALAM KG
    actual_mixing_kg = Column(String(20))
    
    # Excel Column 35: DOSING DALAM KG
    dosing_kg = Column(String(20))
    
    # Relationships
    versions = db.relationship('ProductVersion', back_populates='product', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<ProductNew {self.kode_produk} - {self.nama_produk} v{self.version}>'
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'kode_produk': self.kode_produk,
            'nama_produk': self.nama_produk,
            'version': self.version,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
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
            'dosing_kg': self.dosing_kg
        }

class ProductVersion(db.Model):
    """
    Product Version History - Track specification changes
    """
    __tablename__ = 'product_versions'
    
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey('products_new.id', ondelete='CASCADE'), nullable=False)
    version = Column(Integer, nullable=False)
    change_type = Column(String(20), default='UPDATE')  # CREATE, UPDATE, DELETE
    change_reason = Column(Text)
    changed_fields = Column(Text)  # JSON string of changed fields
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Store all field values as JSON for comparison
    old_values = Column(Text)  # JSON string of old values
    new_values = Column(Text)  # JSON string of new values
    
    # Relationships
    product = db.relationship('ProductNew', back_populates='versions')
    user = db.relationship('User', backref='product_versions')
    
    def __repr__(self):
        return f'<ProductVersion {self.product.kode_produk} v{self.version}>'
