from datetime import datetime
from . import db


class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    notification_type = db.Column(db.String(50), nullable=False)  # info, warning, error, success, alert
    category = db.Column(db.String(50), nullable=False)  # sales, production, inventory, quality, maintenance, etc.
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    reference_type = db.Column(db.String(50), nullable=True)  # sales_order, work_order, purchase_order, etc.
    reference_id = db.Column(db.Integer, nullable=True)
    priority = db.Column(db.String(20), nullable=False, default='normal')  # low, normal, high, urgent
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    read_at = db.Column(db.DateTime, nullable=True)
    is_dismissed = db.Column(db.Boolean, default=False, nullable=False)
    action_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = db.relationship('User', back_populates='notifications')
    
    __table_args__ = (
        db.Index('idx_user_read', 'user_id', 'is_read'),
    )

class SystemAlert(db.Model):
    __tablename__ = 'system_alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    alert_type = db.Column(db.String(50), nullable=False)  # low_stock, maintenance_due, quality_issue, overdue_order
    severity = db.Column(db.String(20), nullable=False)  # info, warning, critical
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    source_module = db.Column(db.String(50), nullable=False)  # inventory, production, sales, etc.
    reference_type = db.Column(db.String(50), nullable=True)
    reference_id = db.Column(db.Integer, nullable=True)
    threshold_value = db.Column(db.Numeric(15, 2), nullable=True)
    current_value = db.Column(db.Numeric(15, 2), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    acknowledged = db.Column(db.Boolean, default=False, nullable=False)
    acknowledged_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    acknowledged_at = db.Column(db.DateTime, nullable=True)
    resolved = db.Column(db.Boolean, default=False, nullable=False)
    resolved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    acknowledged_by_user = db.relationship('User', foreign_keys=[acknowledged_by])
    resolved_by_user = db.relationship('User', foreign_keys=[resolved_by])
