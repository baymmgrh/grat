from datetime import datetime
from . import db

class MaintenanceSchedule(db.Model):
    __tablename__ = 'maintenance_schedules'
    
    id = db.Column(db.Integer, primary_key=True)
    schedule_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=False)
    maintenance_type = db.Column(db.String(50), nullable=False)  # preventive, corrective, predictive
    frequency = db.Column(db.String(50), nullable=False)  # daily, weekly, monthly, quarterly, yearly
    frequency_value = db.Column(db.Integer, nullable=False)  # e.g., every 30 days
    last_maintenance_date = db.Column(db.Date, nullable=True)
    next_maintenance_date = db.Column(db.Date, nullable=False)
    estimated_duration_hours = db.Column(db.Numeric(5, 2), nullable=True)
    maintenance_checklist = db.Column(db.Text, nullable=True)  # JSON format
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    machine = db.relationship('Machine')
    assigned_user = db.relationship('User')

class MaintenanceRecord(db.Model):
    __tablename__ = 'maintenance_records'
    
    id = db.Column(db.Integer, primary_key=True)
    record_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=False)
    schedule_id = db.Column(db.Integer, db.ForeignKey('maintenance_schedules.id'), nullable=True)
    maintenance_type = db.Column(db.String(50), nullable=False)  # preventive, corrective, breakdown, emergency
    maintenance_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    start_time = db.Column(db.DateTime, nullable=True)
    end_time = db.Column(db.DateTime, nullable=True)
    duration_hours = db.Column(db.Numeric(5, 2), nullable=True)
    downtime_hours = db.Column(db.Numeric(5, 2), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='scheduled')  # scheduled, in_progress, completed, cancelled
    problem_description = db.Column(db.Text, nullable=True)
    work_performed = db.Column(db.Text, nullable=True)
    parts_used = db.Column(db.Text, nullable=True)  # JSON format
    cost = db.Column(db.Numeric(15, 2), default=0)
    performed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    machine = db.relationship('Machine', back_populates='maintenance_records')
    schedule = db.relationship('MaintenanceSchedule')
    performed_by_user = db.relationship('User', foreign_keys=[performed_by])
    approved_by_user = db.relationship('User', foreign_keys=[approved_by])

class MaintenanceTask(db.Model):
    __tablename__ = 'maintenance_tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    record_id = db.Column(db.Integer, db.ForeignKey('maintenance_records.id'), nullable=False)
    task_description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), nullable=False, default='pending')  # pending, in_progress, completed
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    completed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    record = db.relationship('MaintenanceRecord')
    assigned_user = db.relationship('User', foreign_keys=[assigned_to])
    completed_user = db.relationship('User', foreign_keys=[completed_by])

class EquipmentHistory(db.Model):
    __tablename__ = 'equipment_history'
    
    id = db.Column(db.Integer, primary_key=True)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=False)
    event_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    event_type = db.Column(db.String(50), nullable=False)  # installation, maintenance, breakdown, repair, upgrade
    description = db.Column(db.Text, nullable=False)
    cost = db.Column(db.Numeric(15, 2), default=0)
    performed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    machine = db.relationship('Machine')
    user = db.relationship('User')
