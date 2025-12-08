from datetime import datetime, date
from . import db
from sqlalchemy import func

class QualityMetrics(db.Model):
    """Enhanced quality metrics and KPIs"""
    __tablename__ = 'quality_metrics'
    
    id = db.Column(db.Integer, primary_key=True)
    metric_date = db.Column(db.Date, nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=True)
    
    # Quality KPIs
    total_inspections = db.Column(db.Integer, default=0)
    passed_inspections = db.Column(db.Integer, default=0)
    failed_inspections = db.Column(db.Integer, default=0)
    pass_rate = db.Column(db.Numeric(5, 2), default=0)  # percentage
    
    # Defect metrics
    total_defects = db.Column(db.Integer, default=0)
    critical_defects = db.Column(db.Integer, default=0)
    major_defects = db.Column(db.Integer, default=0)
    minor_defects = db.Column(db.Integer, default=0)
    defect_rate = db.Column(db.Numeric(8, 4), default=0)  # defects per million opportunities
    
    # Cost metrics
    cost_of_quality = db.Column(db.Numeric(15, 2), default=0)
    rework_cost = db.Column(db.Numeric(15, 2), default=0)
    scrap_cost = db.Column(db.Numeric(15, 2), default=0)
    
    # Time metrics
    avg_inspection_time = db.Column(db.Numeric(8, 2), default=0)  # minutes
    first_pass_yield = db.Column(db.Numeric(5, 2), default=0)  # percentage
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product')
    machine = db.relationship('Machine')

class QualityAlert(db.Model):
    """Quality alerts and notifications"""
    __tablename__ = 'quality_alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    alert_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    alert_type = db.Column(db.String(50), nullable=False)  # defect_rate, pass_rate, cost_threshold, spc_violation
    severity = db.Column(db.String(20), nullable=False)  # low, medium, high, critical
    
    # Alert details
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=True)
    inspection_id = db.Column(db.Integer, db.ForeignKey('quality_inspections.id'), nullable=True)
    
    # Threshold values
    threshold_value = db.Column(db.Numeric(10, 4), nullable=True)
    actual_value = db.Column(db.Numeric(10, 4), nullable=True)
    
    # Status tracking
    status = db.Column(db.String(20), nullable=False, default='active')  # active, acknowledged, resolved, closed
    acknowledged_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    acknowledged_at = db.Column(db.DateTime, nullable=True)
    resolved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    resolution_notes = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product')
    machine = db.relationship('Machine')
    inspection = db.relationship('QualityInspection')
    acknowledged_by_user = db.relationship('User', foreign_keys=[acknowledged_by])
    resolved_by_user = db.relationship('User', foreign_keys=[resolved_by])

class QualityTarget(db.Model):
    """Quality targets and goals"""
    __tablename__ = 'quality_targets'
    
    id = db.Column(db.Integer, primary_key=True)
    target_name = db.Column(db.String(200), nullable=False)
    target_type = db.Column(db.String(50), nullable=False)  # pass_rate, defect_rate, cost, time
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=True)
    
    # Target values
    target_value = db.Column(db.Numeric(10, 4), nullable=False)
    warning_threshold = db.Column(db.Numeric(10, 4), nullable=True)
    critical_threshold = db.Column(db.Numeric(10, 4), nullable=True)
    
    # Time period
    period_type = db.Column(db.String(20), nullable=False)  # daily, weekly, monthly, quarterly, yearly
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=True)
    
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product')
    machine = db.relationship('Machine')
    created_by_user = db.relationship('User')

class QualityAnalytics(db.Model):
    """Quality analytics and reporting data"""
    __tablename__ = 'quality_analytics'
    
    id = db.Column(db.Integer, primary_key=True)
    analysis_date = db.Column(db.Date, nullable=False, index=True)
    period_type = db.Column(db.String(20), nullable=False)  # daily, weekly, monthly
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    
    # Aggregated metrics
    total_production = db.Column(db.Integer, default=0)
    total_inspected = db.Column(db.Integer, default=0)
    total_passed = db.Column(db.Integer, default=0)
    total_failed = db.Column(db.Integer, default=0)
    
    # Calculated KPIs
    overall_pass_rate = db.Column(db.Numeric(5, 2), default=0)
    defect_density = db.Column(db.Numeric(8, 4), default=0)
    first_pass_yield = db.Column(db.Numeric(5, 2), default=0)
    cost_of_poor_quality = db.Column(db.Numeric(15, 2), default=0)
    
    # Trend indicators
    pass_rate_trend = db.Column(db.String(20), nullable=True)  # improving, declining, stable
    defect_trend = db.Column(db.String(20), nullable=True)
    cost_trend = db.Column(db.String(20), nullable=True)
    
    # Comparison with targets
    target_achievement = db.Column(db.Numeric(5, 2), default=0)  # percentage
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product')

class QualityAudit(db.Model):
    """Quality audit management"""
    __tablename__ = 'quality_audits'
    
    id = db.Column(db.Integer, primary_key=True)
    audit_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    audit_type = db.Column(db.String(50), nullable=False)  # internal, external, supplier, customer
    audit_scope = db.Column(db.String(200), nullable=False)
    
    # Audit details
    planned_date = db.Column(db.Date, nullable=False)
    actual_date = db.Column(db.Date, nullable=True)
    duration_hours = db.Column(db.Numeric(5, 2), nullable=True)
    
    # Audit team
    lead_auditor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    audit_team = db.Column(db.Text, nullable=True)  # JSON format
    auditee_department = db.Column(db.String(100), nullable=True)
    
    # Results
    status = db.Column(db.String(20), nullable=False, default='planned')  # planned, in_progress, completed, cancelled
    overall_rating = db.Column(db.String(20), nullable=True)  # excellent, good, satisfactory, needs_improvement, unsatisfactory
    findings_summary = db.Column(db.Text, nullable=True)
    
    # Metrics
    total_findings = db.Column(db.Integer, default=0)
    critical_findings = db.Column(db.Integer, default=0)
    major_findings = db.Column(db.Integer, default=0)
    minor_findings = db.Column(db.Integer, default=0)
    observations = db.Column(db.Integer, default=0)
    
    # Follow-up
    corrective_actions_required = db.Column(db.Integer, default=0)
    follow_up_date = db.Column(db.Date, nullable=True)
    closure_date = db.Column(db.Date, nullable=True)
    
    notes = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    lead_auditor = db.relationship('User', foreign_keys=[lead_auditor_id])
    created_by_user = db.relationship('User', foreign_keys=[created_by])

class QualityTraining(db.Model):
    """Quality training and competency management"""
    __tablename__ = 'quality_training'
    
    id = db.Column(db.Integer, primary_key=True)
    training_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    training_name = db.Column(db.String(200), nullable=False)
    training_type = db.Column(db.String(50), nullable=False)  # quality_awareness, spc, inspection, audit
    
    # Training details
    description = db.Column(db.Text, nullable=True)
    duration_hours = db.Column(db.Numeric(5, 2), nullable=False)
    competency_level = db.Column(db.String(20), nullable=False)  # basic, intermediate, advanced
    
    # Requirements
    prerequisites = db.Column(db.Text, nullable=True)
    target_audience = db.Column(db.String(200), nullable=True)
    refresh_period_months = db.Column(db.Integer, nullable=True)
    
    # Status
    is_mandatory = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    created_by_user = db.relationship('User')

class QualityCompetency(db.Model):
    """Employee quality competency tracking"""
    __tablename__ = 'quality_competency'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    training_id = db.Column(db.Integer, db.ForeignKey('quality_training.id'), nullable=False)
    
    # Competency details
    completion_date = db.Column(db.Date, nullable=False)
    score = db.Column(db.Numeric(5, 2), nullable=True)
    competency_level = db.Column(db.String(20), nullable=False)  # competent, not_competent, developing
    
    # Certification
    certificate_number = db.Column(db.String(100), nullable=True)
    valid_until = db.Column(db.Date, nullable=True)
    renewal_required = db.Column(db.Boolean, default=False)
    
    # Assessment
    assessor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    assessment_notes = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    employee = db.relationship('Employee')
    training = db.relationship('QualityTraining')
    assessor = db.relationship('User')
    
    # Unique constraint
    __table_args__ = (db.UniqueConstraint('employee_id', 'training_id', 'completion_date', name='_employee_training_completion_uc'),)
