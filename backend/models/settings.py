from datetime import datetime
from . import db

class SystemSetting(db.Model):
    __tablename__ = 'system_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    setting_key = db.Column(db.String(100), unique=True, nullable=False, index=True)
    setting_category = db.Column(db.String(50), nullable=False)  # general, security, notification, integration, backup
    setting_name = db.Column(db.String(200), nullable=False)
    setting_value = db.Column(db.Text, nullable=True)
    data_type = db.Column(db.String(20), nullable=False)  # string, integer, boolean, json, date
    description = db.Column(db.Text, nullable=True)
    is_editable = db.Column(db.Boolean, default=True, nullable=False)
    is_encrypted = db.Column(db.Boolean, default=False, nullable=False)
    default_value = db.Column(db.Text, nullable=True)
    validation_rules = db.Column(db.Text, nullable=True)  # JSON format
    updated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    updated_by_user = db.relationship('User')

class CompanyProfile(db.Model):
    __tablename__ = 'company_profile'
    
    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(255), nullable=False)
    legal_name = db.Column(db.String(255), nullable=True)
    tax_id = db.Column(db.String(100), nullable=True)
    registration_number = db.Column(db.String(100), nullable=True)
    industry = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    fax = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    website = db.Column(db.String(200), nullable=True)
    address = db.Column(db.Text, nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    postal_code = db.Column(db.String(20), nullable=True)
    logo_path = db.Column(db.String(500), nullable=True)
    currency = db.Column(db.String(10), default='IDR')
    timezone = db.Column(db.String(50), default='Asia/Jakarta')
    date_format = db.Column(db.String(50), default='DD/MM/YYYY')
    time_format = db.Column(db.String(20), default='24')
    fiscal_year_start = db.Column(db.String(10), default='01-01')  # MM-DD format
    default_language = db.Column(db.String(10), default='id')
    updated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    updated_by_user = db.relationship('User')
