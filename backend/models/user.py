from datetime import datetime
from . import db


class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    department = db.Column(db.String(100), nullable=True)
    position = db.Column(db.String(100), nullable=True)
    bio = db.Column(db.Text, nullable=True)  # User biography/about me
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_admin = db.Column(db.Boolean, default=False, nullable=False)  # Staff Admin (Admin Produksi, Admin Gudang)
    is_super_admin = db.Column(db.Boolean, default=False, nullable=False)  # System Administrator (full access)
    last_login = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Password reset fields
    reset_token = db.Column(db.String(100), nullable=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)
    
    # OAuth fields
    google_id = db.Column(db.String(100), nullable=True, unique=True)
    
    # Relationships
    roles = db.relationship('UserRole', back_populates='user', cascade='all, delete-orphan')
    notifications = db.relationship('Notification', back_populates='user', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def set_password(self, password: str) -> None:
        """Set password using bcrypt hash. Always use this method to set passwords."""
        from flask import current_app
        self.password_hash = current_app.bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password: str) -> bool:
        """Check password against stored hash. Handles both bcrypt and legacy hashes."""
        from flask import current_app
        
        # Check if hash is bcrypt format (starts with $2b$ or $2a$)
        if self.password_hash.startswith('$2b$') or self.password_hash.startswith('$2a$'):
            return current_app.bcrypt.check_password_hash(self.password_hash, password)
        
        # Legacy hash (scrypt/pbkdf2 from werkzeug) - migrate to bcrypt
        from werkzeug.security import check_password_hash
        if check_password_hash(self.password_hash, password):
            # Password correct, migrate to bcrypt
            self.set_password(password)
            db.session.commit()
            return True
        
        return False
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Static method to hash password. Use when creating user outside of instance."""
        from flask import current_app
        return current_app.bcrypt.generate_password_hash(password).decode('utf-8')

class Role(db.Model):
    __tablename__ = 'roles'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = db.relationship('UserRole', back_populates='role', cascade='all, delete-orphan')
    permissions = db.relationship('RolePermission', back_populates='role', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Role {self.name}>'

class UserRole(db.Model):
    __tablename__ = 'user_roles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id', ondelete='CASCADE'), nullable=False)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', back_populates='roles')
    role = db.relationship('Role', back_populates='users')
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'role_id', name='unique_user_role'),
    )

class Permission(db.Model):
    __tablename__ = 'permissions'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    resource = db.Column(db.String(100), nullable=False)  # e.g., 'sales_orders', 'products'
    module = db.Column(db.String(100), nullable=True)  # e.g., 'Sales', 'Purchasing', 'Production'
    action = db.Column(db.String(50), nullable=False)  # e.g., 'create', 'read', 'update', 'delete'
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    roles = db.relationship('RolePermission', back_populates='permission', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Permission {self.name}>'

class RolePermission(db.Model):
    __tablename__ = 'role_permissions'
    
    id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id', ondelete='CASCADE'), nullable=False)
    permission_id = db.Column(db.Integer, db.ForeignKey('permissions.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    role = db.relationship('Role', back_populates='permissions')
    permission = db.relationship('Permission', back_populates='roles')
    
    __table_args__ = (
        db.UniqueConstraint('role_id', 'permission_id', name='unique_role_permission'),
    )
