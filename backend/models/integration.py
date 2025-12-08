from datetime import datetime
from . import db

class ThirdPartyAPI(db.Model):
    __tablename__ = 'third_party_apis'
    
    id = db.Column(db.Integer, primary_key=True)
    api_name = db.Column(db.String(200), nullable=False)
    api_type = db.Column(db.String(50), nullable=False)  # logistics, payment, accounting, ecommerce
    provider = db.Column(db.String(200), nullable=False)
    endpoint_url = db.Column(db.String(500), nullable=False)
    authentication_type = db.Column(db.String(50), nullable=False)  # api_key, oauth, basic_auth
    api_key = db.Column(db.String(500), nullable=True)
    api_secret = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    rate_limit = db.Column(db.Integer, nullable=True)
    timeout_seconds = db.Column(db.Integer, default=30)
    retry_attempts = db.Column(db.Integer, default=3)
    configuration = db.Column(db.Text, nullable=True)  # JSON format
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    logs = db.relationship('IntegrationLog', back_populates='api')

class IntegrationLog(db.Model):
    __tablename__ = 'integration_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    api_id = db.Column(db.Integer, db.ForeignKey('third_party_apis.id'), nullable=False)
    log_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    request_method = db.Column(db.String(10), nullable=False)  # GET, POST, PUT, DELETE
    request_url = db.Column(db.String(1000), nullable=False)
    request_headers = db.Column(db.Text, nullable=True)
    request_body = db.Column(db.Text, nullable=True)
    response_status_code = db.Column(db.Integer, nullable=True)
    response_headers = db.Column(db.Text, nullable=True)
    response_body = db.Column(db.Text, nullable=True)
    response_time_ms = db.Column(db.Integer, nullable=True)
    status = db.Column(db.String(50), nullable=False)  # success, error, timeout
    error_message = db.Column(db.Text, nullable=True)
    reference_type = db.Column(db.String(50), nullable=True)
    reference_id = db.Column(db.Integer, nullable=True)
    initiated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    api = db.relationship('ThirdPartyAPI', back_populates='logs')
    user = db.relationship('User')
