from datetime import datetime
from . import db

class AdvancedUserRole(db.Model):
    __tablename__ = 'advanced_user_roles'
    
    id = db.Column(db.Integer, primary_key=True)
    role_name = db.Column(db.String(100), unique=True, nullable=False)
    role_code = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_system_role = db.Column(db.Boolean, default=False)  # System roles cannot be deleted
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    permissions = db.relationship('AdvancedRolePermission', back_populates='role', cascade='all, delete-orphan')
    user_roles = db.relationship('AdvancedUserRoleAssignment', back_populates='role')

class AdvancedPermission(db.Model):
    __tablename__ = 'advanced_permissions'
    
    id = db.Column(db.Integer, primary_key=True)
    permission_name = db.Column(db.String(100), unique=True, nullable=False)
    permission_code = db.Column(db.String(50), unique=True, nullable=False)
    category = db.Column(db.String(50), nullable=False)  # system, data, user_management, reports, etc.
    description = db.Column(db.Text, nullable=True)
    is_system_permission = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    role_permissions = db.relationship('AdvancedRolePermission', back_populates='permission')

class AdvancedRolePermission(db.Model):
    __tablename__ = 'advanced_role_permissions'
    
    id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey('advanced_user_roles.id'), nullable=False)
    permission_id = db.Column(db.Integer, db.ForeignKey('advanced_permissions.id'), nullable=False)
    granted_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    granted_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Unique constraint
    __table_args__ = (db.UniqueConstraint('role_id', 'permission_id', name='unique_role_permission'),)
    
    # Relationships
    role = db.relationship('AdvancedUserRole', back_populates='permissions')
    permission = db.relationship('AdvancedPermission', back_populates='role_permissions')
    granted_by_user = db.relationship('User', foreign_keys=[granted_by])

class AdvancedUserRoleAssignment(db.Model):
    __tablename__ = 'advanced_user_role_assignments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('advanced_user_roles.id'), nullable=False)
    assigned_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Unique constraint
    __table_args__ = (db.UniqueConstraint('user_id', 'role_id', name='unique_user_role'),)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id])
    role = db.relationship('AdvancedUserRole', back_populates='user_roles')
    assigned_by_user = db.relationship('User', foreign_keys=[assigned_by])

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    session_id = db.Column(db.String(255), nullable=True)
    action = db.Column(db.String(50), nullable=False)  # create, read, update, delete, login, logout
    resource_type = db.Column(db.String(100), nullable=False)  # user, product, order, etc.
    resource_id = db.Column(db.String(100), nullable=True)
    resource_name = db.Column(db.String(255), nullable=True)
    old_values = db.Column(db.Text, nullable=True)  # JSON format
    new_values = db.Column(db.Text, nullable=True)  # JSON format
    ip_address = db.Column(db.String(45), nullable=True)  # IPv6 support
    user_agent = db.Column(db.Text, nullable=True)
    request_method = db.Column(db.String(10), nullable=True)  # GET, POST, PUT, DELETE
    request_url = db.Column(db.String(1000), nullable=True)
    status = db.Column(db.String(20), nullable=False, default='success')  # success, failed, warning
    error_message = db.Column(db.Text, nullable=True)
    duration_ms = db.Column(db.Integer, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = db.relationship('User')

class SystemConfiguration(db.Model):
    __tablename__ = 'system_configurations'
    
    id = db.Column(db.Integer, primary_key=True)
    config_key = db.Column(db.String(100), unique=True, nullable=False, index=True)
    config_category = db.Column(db.String(50), nullable=False)  # general, database, security, performance, logging
    config_name = db.Column(db.String(200), nullable=False)
    config_value = db.Column(db.Text, nullable=True)
    data_type = db.Column(db.String(20), nullable=False)  # string, integer, boolean, json, array
    description = db.Column(db.Text, nullable=True)
    is_editable = db.Column(db.Boolean, default=True, nullable=False)
    is_sensitive = db.Column(db.Boolean, default=False, nullable=False)  # Hide value in UI
    default_value = db.Column(db.Text, nullable=True)
    validation_pattern = db.Column(db.String(500), nullable=True)  # Regex pattern
    min_value = db.Column(db.Integer, nullable=True)
    max_value = db.Column(db.Integer, nullable=True)
    allowed_values = db.Column(db.Text, nullable=True)  # JSON array of allowed values
    requires_restart = db.Column(db.Boolean, default=False, nullable=False)
    updated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    updated_by_user = db.relationship('User')

class BackupConfiguration(db.Model):
    __tablename__ = 'backup_configurations'
    
    id = db.Column(db.Integer, primary_key=True)
    config_name = db.Column(db.String(100), unique=True, nullable=False)
    backup_type = db.Column(db.String(50), nullable=False)  # full, incremental, differential
    schedule_type = db.Column(db.String(50), nullable=False)  # manual, daily, weekly, monthly
    schedule_time = db.Column(db.Time, nullable=True)  # Time of day for scheduled backups
    schedule_days = db.Column(db.String(20), nullable=True)  # Days of week (1,2,3,4,5,6,7)
    retention_days = db.Column(db.Integer, default=30, nullable=False)
    max_backup_count = db.Column(db.Integer, default=10, nullable=False)
    include_files = db.Column(db.Boolean, default=True, nullable=False)
    compress_backup = db.Column(db.Boolean, default=True, nullable=False)
    compression_level = db.Column(db.Integer, default=6, nullable=False)  # 1-9
    backup_path = db.Column(db.String(1000), nullable=True)
    exclude_tables = db.Column(db.Text, nullable=True)  # JSON array of table names
    include_tables = db.Column(db.Text, nullable=True)  # JSON array of table names
    notification_email = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    created_by_user = db.relationship('User')
