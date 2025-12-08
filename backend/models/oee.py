from datetime import datetime, timedelta
from . import db
from sqlalchemy import func

class OEERecord(db.Model):
    __tablename__ = 'oee_records'
    
    id = db.Column(db.Integer, primary_key=True)
    record_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=False)
    work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=True)
    record_date = db.Column(db.Date, nullable=False, index=True)
    shift = db.Column(db.String(50), nullable=True)
    
    # Time metrics
    planned_production_time = db.Column(db.Integer, nullable=False)  # minutes
    downtime = db.Column(db.Integer, default=0)  # minutes
    actual_production_time = db.Column(db.Integer, default=0)  # minutes
    
    # Performance metrics
    ideal_cycle_time = db.Column(db.Numeric(10, 2), nullable=True)  # seconds per unit
    total_pieces_produced = db.Column(db.Integer, default=0)
    good_pieces = db.Column(db.Integer, default=0)
    rejected_pieces = db.Column(db.Integer, default=0)
    
    # OEE calculations
    availability = db.Column(db.Numeric(5, 2), default=0)  # percentage
    performance = db.Column(db.Numeric(5, 2), default=0)  # percentage
    quality = db.Column(db.Numeric(5, 2), default=0)  # percentage
    oee = db.Column(db.Numeric(5, 2), default=0)  # percentage
    
    notes = db.Column(db.Text, nullable=True)
    recorded_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    machine = db.relationship('Machine', back_populates='oee_records')
    work_order = db.relationship('WorkOrder')
    recorded_by_user = db.relationship('User')
    downtime_records = db.relationship('OEEDowntimeRecord', back_populates='oee_record')
    defect_records = db.relationship('QualityDefect', back_populates='oee_record')

class OEEDowntimeRecord(db.Model):
    __tablename__ = 'oee_downtime_records'
    
    id = db.Column(db.Integer, primary_key=True)
    oee_record_id = db.Column(db.Integer, db.ForeignKey('oee_records.id'), nullable=False)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=False)
    downtime_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=True)
    duration_minutes = db.Column(db.Integer, nullable=True)
    downtime_category = db.Column(db.String(50), nullable=False)  # breakdown, changeover, setup, planned_maintenance, no_material, no_operator
    reason = db.Column(db.Text, nullable=True)
    action_taken = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='ongoing')  # ongoing, resolved
    recorded_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    oee_record = db.relationship('OEERecord', back_populates='downtime_records')
    machine = db.relationship('Machine')
    recorded_by_user = db.relationship('User')

class QualityDefect(db.Model):
    __tablename__ = 'quality_defects'
    
    id = db.Column(db.Integer, primary_key=True)
    oee_record_id = db.Column(db.Integer, db.ForeignKey('oee_records.id'), nullable=False)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=False)
    work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=True)
    defect_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    defect_type = db.Column(db.String(100), nullable=False)  # tear, hole, contamination, discoloration, size_variation
    defect_category = db.Column(db.String(50), nullable=False)  # minor, major, critical
    quantity = db.Column(db.Integer, nullable=False)
    batch_number = db.Column(db.String(100), nullable=True)
    root_cause = db.Column(db.Text, nullable=True)
    corrective_action = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='identified')  # identified, investigating, resolved
    recorded_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    oee_record = db.relationship('OEERecord', back_populates='defect_records')
    machine = db.relationship('Machine')
    work_order = db.relationship('WorkOrder')
    recorded_by_user = db.relationship('User')

class MachinePerformance(db.Model):
    __tablename__ = 'machine_performance'
    
    id = db.Column(db.Integer, primary_key=True)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=False)
    performance_date = db.Column(db.Date, nullable=False, index=True)
    shift = db.Column(db.String(50), nullable=True)
    total_runtime_hours = db.Column(db.Numeric(10, 2), default=0)
    total_downtime_hours = db.Column(db.Numeric(10, 2), default=0)
    total_output = db.Column(db.Numeric(15, 2), default=0)
    target_output = db.Column(db.Numeric(15, 2), default=0)
    efficiency_percentage = db.Column(db.Numeric(5, 2), default=0)
    utilization_percentage = db.Column(db.Numeric(5, 2), default=0)
    average_oee = db.Column(db.Numeric(5, 2), default=0)
    energy_consumed_kwh = db.Column(db.Numeric(15, 2), default=0)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    machine = db.relationship('Machine')
    
    __table_args__ = (
        db.Index('idx_machine_performance_date', 'machine_id', 'performance_date'),
    )

class OEETarget(db.Model):
    __tablename__ = 'oee_targets'
    
    id = db.Column(db.Integer, primary_key=True)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=False)
    target_type = db.Column(db.String(50), nullable=False)  # daily, weekly, monthly, yearly
    target_availability = db.Column(db.Numeric(5, 2), default=90)  # percentage
    target_performance = db.Column(db.Numeric(5, 2), default=95)  # percentage
    target_quality = db.Column(db.Numeric(5, 2), default=99)  # percentage
    target_oee = db.Column(db.Numeric(5, 2), default=85)  # percentage
    effective_from = db.Column(db.Date, nullable=False)
    effective_to = db.Column(db.Date, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    machine = db.relationship('Machine')
    created_by_user = db.relationship('User')

class OEEAlert(db.Model):
    __tablename__ = 'oee_alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=False)
    alert_type = db.Column(db.String(50), nullable=False)  # low_oee, downtime_extended, quality_issue, maintenance_due
    severity = db.Column(db.String(20), nullable=False, default='medium')  # low, medium, high, critical
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    threshold_value = db.Column(db.Numeric(10, 2), nullable=True)
    actual_value = db.Column(db.Numeric(10, 2), nullable=True)
    alert_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    status = db.Column(db.String(50), nullable=False, default='active')  # active, acknowledged, resolved
    acknowledged_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    acknowledged_at = db.Column(db.DateTime, nullable=True)
    resolved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    resolution_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    machine = db.relationship('Machine')
    acknowledged_by_user = db.relationship('User', foreign_keys=[acknowledged_by])
    resolved_by_user = db.relationship('User', foreign_keys=[resolved_by])

class MaintenanceImpact(db.Model):
    __tablename__ = 'maintenance_impacts'
    
    id = db.Column(db.Integer, primary_key=True)
    maintenance_record_id = db.Column(db.Integer, db.ForeignKey('maintenance_records.id'), nullable=False)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=False)
    impact_date = db.Column(db.Date, nullable=False)
    planned_downtime_hours = db.Column(db.Numeric(10, 2), default=0)
    actual_downtime_hours = db.Column(db.Numeric(10, 2), default=0)
    production_loss_units = db.Column(db.Numeric(15, 2), default=0)
    revenue_impact = db.Column(db.Numeric(15, 2), default=0)
    oee_before_maintenance = db.Column(db.Numeric(5, 2), nullable=True)
    oee_after_maintenance = db.Column(db.Numeric(5, 2), nullable=True)
    improvement_percentage = db.Column(db.Numeric(5, 2), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    maintenance_record = db.relationship('MaintenanceRecord')
    machine = db.relationship('Machine')

class OEEAnalytics(db.Model):
    __tablename__ = 'oee_analytics'
    
    id = db.Column(db.Integer, primary_key=True)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=False)
    analysis_date = db.Column(db.Date, nullable=False)
    period_type = db.Column(db.String(20), nullable=False)  # daily, weekly, monthly
    total_records = db.Column(db.Integer, default=0)
    avg_availability = db.Column(db.Numeric(5, 2), default=0)
    avg_performance = db.Column(db.Numeric(5, 2), default=0)
    avg_quality = db.Column(db.Numeric(5, 2), default=0)
    avg_oee = db.Column(db.Numeric(5, 2), default=0)
    best_oee = db.Column(db.Numeric(5, 2), default=0)
    worst_oee = db.Column(db.Numeric(5, 2), default=0)
    total_downtime_hours = db.Column(db.Numeric(10, 2), default=0)
    total_production_hours = db.Column(db.Numeric(10, 2), default=0)
    total_units_produced = db.Column(db.Numeric(15, 2), default=0)
    total_good_units = db.Column(db.Numeric(15, 2), default=0)
    defect_rate = db.Column(db.Numeric(5, 2), default=0)
    maintenance_hours = db.Column(db.Numeric(10, 2), default=0)
    breakdown_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    machine = db.relationship('Machine')
    
    __table_args__ = (
        db.Index('idx_oee_analytics_machine_date', 'machine_id', 'analysis_date'),
        db.UniqueConstraint('machine_id', 'analysis_date', 'period_type', name='uq_oee_analytics_machine_period'),
    )
