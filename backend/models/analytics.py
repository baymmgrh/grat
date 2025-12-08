from datetime import datetime
from . import db

class KPI(db.Model):
    __tablename__ = 'kpis'
    
    id = db.Column(db.Integer, primary_key=True)
    kpi_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    kpi_name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # sales, production, quality, finance, hr
    description = db.Column(db.Text, nullable=True)
    measurement_unit = db.Column(db.String(50), nullable=False)
    target_value = db.Column(db.Numeric(15, 2), nullable=True)
    threshold_min = db.Column(db.Numeric(15, 2), nullable=True)
    threshold_max = db.Column(db.Numeric(15, 2), nullable=True)
    calculation_formula = db.Column(db.Text, nullable=True)
    data_source = db.Column(db.String(100), nullable=True)
    frequency = db.Column(db.String(20), nullable=False)  # daily, weekly, monthly, quarterly, yearly
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = db.relationship('User')
    metrics = db.relationship('MetricData', back_populates='kpi')

class MetricData(db.Model):
    __tablename__ = 'metric_data'
    
    id = db.Column(db.Integer, primary_key=True)
    kpi_id = db.Column(db.Integer, db.ForeignKey('kpis.id'), nullable=False)
    metric_date = db.Column(db.Date, nullable=False, index=True)
    actual_value = db.Column(db.Numeric(15, 2), nullable=False)
    target_value = db.Column(db.Numeric(15, 2), nullable=True)
    variance = db.Column(db.Numeric(15, 2), nullable=True)
    variance_percentage = db.Column(db.Numeric(5, 2), nullable=True)
    status = db.Column(db.String(20), nullable=False)  # on_target, below_target, above_target
    notes = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    kpi = db.relationship('KPI', back_populates='metrics')
    created_by_user = db.relationship('User')
    
    __table_args__ = (
        db.Index('idx_kpi_date', 'kpi_id', 'metric_date'),
    )

class AnalyticsReport(db.Model):
    __tablename__ = 'analytics_reports'
    
    id = db.Column(db.Integer, primary_key=True)
    report_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    report_name = db.Column(db.String(255), nullable=False)
    report_type = db.Column(db.String(50), nullable=False)  # sales, production, inventory, financial, custom
    category = db.Column(db.String(50), nullable=True)
    description = db.Column(db.Text, nullable=True)
    report_period = db.Column(db.String(20), nullable=False)  # daily, weekly, monthly, quarterly, yearly, custom
    period_start_date = db.Column(db.Date, nullable=False)
    period_end_date = db.Column(db.Date, nullable=False)
    filters = db.Column(db.Text, nullable=True)  # JSON format
    data_query = db.Column(db.Text, nullable=True)
    report_data = db.Column(db.Text, nullable=True)  # JSON format
    charts_config = db.Column(db.Text, nullable=True)  # JSON format
    file_path = db.Column(db.String(1000), nullable=True)
    file_format = db.Column(db.String(20), nullable=True)  # pdf, excel, csv
    status = db.Column(db.String(50), nullable=False, default='draft')  # draft, generated, scheduled, archived
    is_scheduled = db.Column(db.Boolean, default=False)
    schedule_frequency = db.Column(db.String(20), nullable=True)
    generated_at = db.Column(db.DateTime, nullable=True)
    generated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    generated_by_user = db.relationship('User')
