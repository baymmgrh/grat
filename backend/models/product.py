from datetime import datetime
from . import db

class Material(db.Model):
    __tablename__ = 'materials'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(100), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    material_type = db.Column(db.String(50), nullable=False)  # raw_materials, packaging_materials, chemical_materials, finished_goods
    category = db.Column(db.String(100), nullable=False)  # specific category within type
    primary_uom = db.Column(db.String(20), nullable=False)  # Kg, Meter, Liter, etc.
    secondary_uom = db.Column(db.String(20), nullable=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=True)
    cost_per_unit = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    min_stock_level = db.Column(db.Numeric(15, 2), default=0)
    max_stock_level = db.Column(db.Numeric(15, 2), default=0)
    reorder_point = db.Column(db.Numeric(15, 2), default=0)
    lead_time_days = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_hazardous = db.Column(db.Boolean, default=False, nullable=False)
    storage_conditions = db.Column(db.Text, nullable=True)  # temperature, humidity requirements
    expiry_days = db.Column(db.Integer, nullable=True)  # shelf life in days
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    supplier = db.relationship('Supplier', back_populates='materials')
    inventory_items = db.relationship('Inventory', back_populates='material')
    purchase_order_items = db.relationship('PurchaseOrderItem', back_populates='material')
    bom_items = db.relationship('BOMItem', back_populates='material')  # BOM Integration
    
    def __repr__(self):
        return f'<Material {self.code} - {self.name}>'

class ProductCategory(db.Model):
    __tablename__ = 'product_categories'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('product_categories.id'), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    parent = db.relationship('ProductCategory', remote_side=[id], backref='children')
    products = db.relationship('Product', back_populates='category')

class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(100), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey('product_categories.id'), nullable=True)
    nonwoven_category = db.Column(db.String(100), nullable=True)  # Wet Tissue, Dry Tissue, etc.
    primary_uom = db.Column(db.String(20), nullable=False)  # Meter, Kg, Roll, etc.
    secondary_uom = db.Column(db.String(20), nullable=True)
    price = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    cost = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    material_type = db.Column(db.String(50), nullable=False)  # finished_goods, raw_materials, packaging_materials, chemical_materials
    min_stock_level = db.Column(db.Numeric(15, 2), default=0)
    max_stock_level = db.Column(db.Numeric(15, 2), default=0)
    reorder_point = db.Column(db.Numeric(15, 2), default=0)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_sellable = db.Column(db.Boolean, default=True, nullable=False)
    is_purchasable = db.Column(db.Boolean, default=True, nullable=False)
    is_producible = db.Column(db.Boolean, default=False, nullable=False)
    lead_time_days = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ===== Merged from products_new =====
    # Physical Properties
    gramasi = db.Column(db.Float, nullable=True)  # GSM
    cd = db.Column(db.Float, nullable=True)
    md = db.Column(db.Float, nullable=True)
    # Packaging
    sheet_per_pack = db.Column(db.String(20), nullable=True)
    pack_per_karton = db.Column(db.String(20), nullable=True)
    berat_kering = db.Column(db.String(20), nullable=True)
    # Batch
    ratio = db.Column(db.Float, nullable=True)
    ingredient = db.Column(db.Float, nullable=True)
    ukuran_batch_vol = db.Column(db.Float, nullable=True)
    ukuran_batch_ctn = db.Column(db.Float, nullable=True)
    # Material
    spunlace = db.Column(db.String(50), nullable=True)
    rayon = db.Column(db.Float, nullable=True)
    polyester = db.Column(db.Float, nullable=True)
    es = db.Column(db.Float, nullable=True)
    # Slitting
    slitting_cm = db.Column(db.Float, nullable=True)
    lebar_mr_net_cm = db.Column(db.Float, nullable=True)
    lebar_mr_gross_cm = db.Column(db.Float, nullable=True)
    keterangan_slitting = db.Column(db.String(100), nullable=True)
    # EPD Machine
    no_mesin_epd = db.Column(db.String(50), nullable=True)
    speed_epd_pack_menit = db.Column(db.String(20), nullable=True)
    # Fabric
    meter_kain = db.Column(db.Float, nullable=True)
    kg_kain = db.Column(db.Float, nullable=True)
    # Material Requirements
    kebutuhan_rayon_kg = db.Column(db.Float, nullable=True)
    kebutuhan_polyester_kg = db.Column(db.Float, nullable=True)
    kebutuhan_es_kg = db.Column(db.Float, nullable=True)
    # Production Process
    process_produksi = db.Column(db.String(200), nullable=True)
    kode_jumbo_roll = db.Column(db.String(50), nullable=True)
    nama_jumbo_roll = db.Column(db.String(200), nullable=True)
    kode_main_roll = db.Column(db.String(50), nullable=True)
    nama_main_roll = db.Column(db.String(200), nullable=True)
    # Mixing
    kapasitas_mixing_kg = db.Column(db.String(20), nullable=True)
    actual_mixing_kg = db.Column(db.String(20), nullable=True)
    dosing_kg = db.Column(db.String(20), nullable=True)
    # System
    version = db.Column(db.Integer, default=0)
    notes = db.Column(db.Text, nullable=True)

    # Relationships
    category = db.relationship('ProductCategory', back_populates='products')
    specification = db.relationship('ProductSpecification', back_populates='product', uselist=False, cascade='all, delete-orphan')
    packaging = db.relationship('ProductPackaging', back_populates='product', uselist=False, cascade='all, delete-orphan')
    sales_order_items = db.relationship('SalesOrderItem', back_populates='product')
    purchase_order_items = db.relationship('PurchaseOrderItem', back_populates='product')
    inventory_items = db.relationship('Inventory', back_populates='product')
    
    # BOM Integration
    boms = db.relationship('BillOfMaterials', back_populates='product', cascade='all, delete-orphan')  # BOMs for this product
    bom_items = db.relationship('BOMItem', back_populates='product')  # This product used in other BOMs
    
    work_orders = db.relationship('WorkOrder', back_populates='product')

    def __repr__(self):
        return f'<Product {self.code} - {self.name}>'

    def to_dict(self):
        """Convert to dictionary for API responses (compatible with ProductNew format)"""
        return {
            'id': self.id,
            'kode_produk': self.code,
            'nama_produk': self.name,
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
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

class ProductSpecification(db.Model):
    __tablename__ = 'product_specifications'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), unique=True, nullable=False)
    gsm = db.Column(db.Numeric(10, 2), nullable=True)  # Grams per Square Meter
    width_cm = db.Column(db.Numeric(10, 2), nullable=True)  # Width in centimeters
    length_m = db.Column(db.Numeric(10, 2), nullable=True)  # Length in meters
    thickness_mm = db.Column(db.Numeric(10, 3), nullable=True)
    color = db.Column(db.String(100), nullable=True)
    weight_per_sheet_g = db.Column(db.Numeric(10, 3), nullable=True)  # Weight per sheet in grams
    absorbency = db.Column(db.String(100), nullable=True)
    tensile_strength = db.Column(db.String(100), nullable=True)
    ph_level = db.Column(db.String(50), nullable=True)
    fragrance = db.Column(db.String(100), nullable=True)
    alcohol_content = db.Column(db.String(50), nullable=True)
    specifications_json = db.Column(db.Text, nullable=True)  # JSON for additional specs
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    product = db.relationship('Product', back_populates='specification')

class ProductPackaging(db.Model):
    __tablename__ = 'product_packaging'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), unique=True, nullable=False)
    sheets_per_pack = db.Column(db.Integer, nullable=True)
    packs_per_karton = db.Column(db.Integer, nullable=True)
    sheets_per_karton = db.Column(db.Integer, nullable=True)  # Calculated field
    pack_weight_kg = db.Column(db.Numeric(10, 3), nullable=True)
    karton_weight_kg = db.Column(db.Numeric(10, 3), nullable=True)
    pack_dimensions = db.Column(db.String(100), nullable=True)  # LxWxH in cm
    karton_dimensions = db.Column(db.String(100), nullable=True)  # LxWxH in cm
    barcode_pack = db.Column(db.String(100), nullable=True)
    barcode_karton = db.Column(db.String(100), nullable=True)
    
    # Consumption calculation fields (per karton, will be divided by packs_per_karton for per pack)
    berat_kering_per_karton = db.Column(db.Numeric(10, 3), nullable=True)  # gram - for kain consumption
    volume_per_pack = db.Column(db.Numeric(10, 3), nullable=True)  # ml - for ingredient consumption
    berat_akhir_per_karton = db.Column(db.Numeric(10, 3), nullable=True)  # gram - for packaging & stiker consumption
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    product = db.relationship('Product', back_populates='packaging')
