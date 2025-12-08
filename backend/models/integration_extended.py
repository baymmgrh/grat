from datetime import datetime
from . import db

class ExternalConnector(db.Model):
    __tablename__ = 'external_connectors'
    
    id = db.Column(db.Integer, primary_key=True)
    connector_name = db.Column(db.String(200), nullable=False)
    connector_type = db.Column(db.String(50), nullable=False)  # erp, crm, accounting, ecommerce, api
    provider = db.Column(db.String(200), nullable=False)
    endpoint_url = db.Column(db.String(500), nullable=False)
    authentication_type = db.Column(db.String(50), nullable=False)  # api_key, oauth, basic_auth, bearer
    api_key = db.Column(db.String(500), nullable=True)
    api_secret = db.Column(db.String(500), nullable=True)
    username = db.Column(db.String(200), nullable=True)
    password = db.Column(db.String(500), nullable=True)
    oauth_token = db.Column(db.Text, nullable=True)
    oauth_refresh_token = db.Column(db.Text, nullable=True)
    oauth_expires_at = db.Column(db.DateTime, nullable=True)
    headers = db.Column(db.Text, nullable=True)  # JSON format for custom headers
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    rate_limit_per_minute = db.Column(db.Integer, nullable=True)
    timeout_seconds = db.Column(db.Integer, default=30)
    retry_attempts = db.Column(db.Integer, default=3)
    retry_delay_seconds = db.Column(db.Integer, default=5)
    last_sync_at = db.Column(db.DateTime, nullable=True)
    sync_status = db.Column(db.String(50), default='never')  # never, success, failed, in_progress
    sync_error_message = db.Column(db.Text, nullable=True)
    request_count = db.Column(db.Integer, default=0)
    success_count = db.Column(db.Integer, default=0)
    failure_count = db.Column(db.Integer, default=0)
    configuration = db.Column(db.Text, nullable=True)  # JSON format for connector-specific config
    notes = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    created_by_user = db.relationship('User')
    sync_jobs = db.relationship('DataSyncJob', back_populates='source_connector')

class APIEndpoint(db.Model):
    __tablename__ = 'api_endpoints'
    
    id = db.Column(db.Integer, primary_key=True)
    endpoint_path = db.Column(db.String(500), nullable=False)
    http_method = db.Column(db.String(10), nullable=False)  # GET, POST, PUT, DELETE, PATCH
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_public = db.Column(db.Boolean, default=False, nullable=False)  # Public endpoints don't require auth
    rate_limit_per_minute = db.Column(db.Integer, default=100)
    rate_limit_per_hour = db.Column(db.Integer, default=1000)
    rate_limit_per_day = db.Column(db.Integer, default=10000)
    auth_required = db.Column(db.Boolean, default=True, nullable=False)
    roles_allowed = db.Column(db.Text, nullable=True)  # JSON array of role names
    permissions_required = db.Column(db.Text, nullable=True)  # JSON array of permission codes
    request_schema = db.Column(db.Text, nullable=True)  # JSON schema for request validation
    response_schema = db.Column(db.Text, nullable=True)  # JSON schema for response
    cache_ttl_seconds = db.Column(db.Integer, nullable=True)  # Cache time-to-live
    timeout_seconds = db.Column(db.Integer, default=30)
    request_count = db.Column(db.Integer, default=0)
    success_count = db.Column(db.Integer, default=0)
    error_count = db.Column(db.Integer, default=0)
    avg_response_time_ms = db.Column(db.Integer, nullable=True)
    last_accessed_at = db.Column(db.DateTime, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Unique constraint
    __table_args__ = (db.UniqueConstraint('endpoint_path', 'http_method', name='unique_endpoint_method'),)
    
    # Relationships
    created_by_user = db.relationship('User')

class DataSyncJob(db.Model):
    __tablename__ = 'data_sync_jobs'
    
    id = db.Column(db.Integer, primary_key=True)
    job_name = db.Column(db.String(200), nullable=False)
    job_code = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    source_connector_id = db.Column(db.Integer, db.ForeignKey('external_connectors.id'), nullable=False)
    target_system = db.Column(db.String(100), nullable=False)  # local_db, external_api, file_system
    sync_type = db.Column(db.String(50), nullable=False)  # full, incremental, differential
    sync_direction = db.Column(db.String(50), nullable=False)  # import, export, bidirectional
    schedule_type = db.Column(db.String(50), nullable=False)  # manual, interval, cron
    schedule_interval_minutes = db.Column(db.Integer, nullable=True)  # For interval scheduling
    schedule_cron = db.Column(db.String(100), nullable=True)  # Cron expression
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_run_at = db.Column(db.DateTime, nullable=True)
    next_run_at = db.Column(db.DateTime, nullable=True)
    last_run_status = db.Column(db.String(50), default='never')  # never, success, failed, in_progress
    last_run_duration_seconds = db.Column(db.Integer, nullable=True)
    last_run_records_processed = db.Column(db.Integer, nullable=True)
    last_run_records_success = db.Column(db.Integer, nullable=True)
    last_run_records_failed = db.Column(db.Integer, nullable=True)
    last_run_error_message = db.Column(db.Text, nullable=True)
    total_runs = db.Column(db.Integer, default=0)
    successful_runs = db.Column(db.Integer, default=0)
    failed_runs = db.Column(db.Integer, default=0)
    mapping_configuration = db.Column(db.Text, nullable=True)  # JSON field mapping config
    filter_conditions = db.Column(db.Text, nullable=True)  # JSON filter conditions
    transformation_rules = db.Column(db.Text, nullable=True)  # JSON transformation rules
    error_handling = db.Column(db.String(50), default='stop')  # stop, continue, retry
    notification_email = db.Column(db.String(255), nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    source_connector = db.relationship('ExternalConnector', back_populates='sync_jobs')
    created_by_user = db.relationship('User')
    execution_logs = db.relationship('SyncJobExecution', back_populates='job')

class SyncJobExecution(db.Model):
    __tablename__ = 'sync_job_executions'
    
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('data_sync_jobs.id'), nullable=False)
    execution_id = db.Column(db.String(100), nullable=False, index=True)  # UUID for tracking
    started_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='in_progress')  # in_progress, success, failed, cancelled
    duration_seconds = db.Column(db.Integer, nullable=True)
    records_processed = db.Column(db.Integer, default=0)
    records_success = db.Column(db.Integer, default=0)
    records_failed = db.Column(db.Integer, default=0)
    records_skipped = db.Column(db.Integer, default=0)
    error_message = db.Column(db.Text, nullable=True)
    execution_log = db.Column(db.Text, nullable=True)  # Detailed execution log
    triggered_by = db.Column(db.String(50), nullable=False)  # manual, scheduled, api
    triggered_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Relationships
    job = db.relationship('DataSyncJob', back_populates='execution_logs')
    triggered_by_user = db.relationship('User')

class Webhook(db.Model):
    __tablename__ = 'webhooks'
    
    id = db.Column(db.Integer, primary_key=True)
    webhook_name = db.Column(db.String(200), nullable=False)
    webhook_url = db.Column(db.String(500), nullable=False)
    http_method = db.Column(db.String(10), default='POST', nullable=False)
    content_type = db.Column(db.String(100), default='application/json')
    secret_token = db.Column(db.String(500), nullable=True)  # For webhook signature verification
    custom_headers = db.Column(db.Text, nullable=True)  # JSON format
    events = db.Column(db.Text, nullable=False)  # JSON array of event names
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    retry_count = db.Column(db.Integer, default=3)
    retry_delay_seconds = db.Column(db.Integer, default=60)
    timeout_seconds = db.Column(db.Integer, default=30)
    success_count = db.Column(db.Integer, default=0)
    failure_count = db.Column(db.Integer, default=0)
    last_triggered_at = db.Column(db.DateTime, nullable=True)
    last_success_at = db.Column(db.DateTime, nullable=True)
    last_failure_at = db.Column(db.DateTime, nullable=True)
    last_error_message = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    created_by_user = db.relationship('User')
    delivery_logs = db.relationship('WebhookDelivery', back_populates='webhook')

class WebhookDelivery(db.Model):
    __tablename__ = 'webhook_deliveries'
    
    id = db.Column(db.Integer, primary_key=True)
    webhook_id = db.Column(db.Integer, db.ForeignKey('webhooks.id'), nullable=False)
    delivery_id = db.Column(db.String(100), nullable=False, index=True)  # UUID for tracking
    event_type = db.Column(db.String(100), nullable=False)
    event_data = db.Column(db.Text, nullable=True)  # JSON event payload
    request_headers = db.Column(db.Text, nullable=True)  # JSON request headers
    request_body = db.Column(db.Text, nullable=True)
    response_status_code = db.Column(db.Integer, nullable=True)
    response_headers = db.Column(db.Text, nullable=True)  # JSON response headers
    response_body = db.Column(db.Text, nullable=True)
    response_time_ms = db.Column(db.Integer, nullable=True)
    status = db.Column(db.String(50), nullable=False)  # success, failed, pending, retrying
    attempt_count = db.Column(db.Integer, default=1)
    max_attempts = db.Column(db.Integer, default=3)
    next_retry_at = db.Column(db.DateTime, nullable=True)
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    delivered_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    webhook = db.relationship('Webhook', back_populates='delivery_logs')
