from datetime import datetime
from . import db

class BackupRecord(db.Model):
    __tablename__ = 'backup_records'
    
    id = db.Column(db.Integer, primary_key=True)
    backup_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    backup_type = db.Column(db.String(50), nullable=False)  # full, incremental, differential
    backup_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    file_name = db.Column(db.String(500), nullable=False)
    file_path = db.Column(db.String(1000), nullable=False)
    file_size_mb = db.Column(db.Numeric(15, 2), nullable=True)
    compression_type = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='in_progress')  # in_progress, completed, failed
    is_scheduled = db.Column(db.Boolean, default=False)
    retention_days = db.Column(db.Integer, default=30)
    expiry_date = db.Column(db.DateTime, nullable=True)
    checksum = db.Column(db.String(255), nullable=True)
    error_message = db.Column(db.Text, nullable=True)
    duration_seconds = db.Column(db.Integer, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    created_by_user = db.relationship('User')
