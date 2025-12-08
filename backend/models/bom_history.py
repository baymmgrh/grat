"""
BOM History and Version Tracking Models
"""
from datetime import datetime
from . import db

class BOMHistory(db.Model):
    """Track BOM version history and changes"""
    __tablename__ = 'bom_history'
    
    id = db.Column(db.Integer, primary_key=True)
    bom_id = db.Column(db.Integer, db.ForeignKey('bill_of_materials.id', ondelete='CASCADE'), nullable=False)
    version = db.Column(db.String(20), nullable=False)
    change_type = db.Column(db.String(50), nullable=False)  # created, updated, activated, deactivated
    change_description = db.Column(db.Text, nullable=True)
    changed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    changed_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Snapshot of BOM data at this version
    snapshot_data = db.Column(db.JSON, nullable=True)  # Store complete BOM structure
    
    # Relationships
    bom = db.relationship('BillOfMaterials', backref='history')
    changed_by_user = db.relationship('User', foreign_keys=[changed_by])
    
    def __repr__(self):
        return f'<BOMHistory BOM#{self.bom_id} v{self.version} - {self.change_type}>'

class BOMImportLog(db.Model):
    """Track BOM imports from Excel"""
    __tablename__ = 'bom_import_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    import_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    imported_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    file_name = db.Column(db.String(255), nullable=True)
    
    # Statistics
    products_added = db.Column(db.Integer, default=0)
    products_updated = db.Column(db.Integer, default=0)
    materials_added = db.Column(db.Integer, default=0)
    materials_updated = db.Column(db.Integer, default=0)
    boms_created = db.Column(db.Integer, default=0)
    boms_updated = db.Column(db.Integer, default=0)
    
    # Status
    status = db.Column(db.String(50), default='completed')  # completed, failed, partial
    error_message = db.Column(db.Text, nullable=True)
    
    # Import details
    import_summary = db.Column(db.JSON, nullable=True)
    
    # Relationships
    imported_by_user = db.relationship('User', foreign_keys=[imported_by])
    
    def __repr__(self):
        return f'<BOMImportLog {self.import_date} - {self.status}>'
