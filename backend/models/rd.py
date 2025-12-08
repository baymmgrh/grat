from datetime import datetime
from . import db

class ResearchProject(db.Model):
    __tablename__ = 'research_projects'
    
    id = db.Column(db.Integer, primary_key=True)
    project_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    project_name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    project_type = db.Column(db.String(50), nullable=False, default='research')  # research, development, innovation, improvement
    objective = db.Column(db.Text, nullable=True)
    start_date = db.Column(db.Date, nullable=True)
    target_completion_date = db.Column(db.Date, nullable=True)
    actual_completion_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='planning')  # planning, in_progress, testing, completed, on_hold, cancelled
    priority = db.Column(db.String(20), nullable=False, default='normal')  # low, normal, high, urgent
    budget = db.Column(db.Numeric(15, 2), default=0)
    actual_cost = db.Column(db.Numeric(15, 2), default=0)
    project_leader_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    team_members = db.Column(db.Text, nullable=True)  # JSON array of user IDs
    expected_outcomes = db.Column(db.Text, nullable=True)
    milestones = db.Column(db.Text, nullable=True)  # JSON array of milestones
    risk_assessment = db.Column(db.Text, nullable=True)
    success_criteria = db.Column(db.Text, nullable=True)
    progress_percentage = db.Column(db.Integer, default=0)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project_leader = db.relationship('User')
    experiments = db.relationship('Experiment', back_populates='project', cascade='all, delete-orphan')
    product_developments = db.relationship('ProductDevelopment', back_populates='project', cascade='all, delete-orphan')
    materials = db.relationship('RDMaterial', back_populates='project', cascade='all, delete-orphan')
    reports = db.relationship('ResearchReport', back_populates='project', cascade='all, delete-orphan')

class Experiment(db.Model):
    __tablename__ = 'experiments'
    
    id = db.Column(db.Integer, primary_key=True)
    experiment_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    project_id = db.Column(db.Integer, db.ForeignKey('research_projects.id'), nullable=False)
    experiment_name = db.Column(db.String(255), nullable=False)
    experiment_type = db.Column(db.String(50), nullable=False, default='laboratory')  # laboratory, field, simulation, pilot
    hypothesis = db.Column(db.Text, nullable=True)
    methodology = db.Column(db.Text, nullable=True)
    experiment_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=True)
    end_time = db.Column(db.Time, nullable=True)
    duration_hours = db.Column(db.Numeric(5, 2), nullable=True)
    conditions = db.Column(db.Text, nullable=True)  # JSON format
    equipment_used = db.Column(db.Text, nullable=True)  # JSON array
    parameters = db.Column(db.Text, nullable=True)  # JSON format
    observations = db.Column(db.Text, nullable=True)
    results = db.Column(db.Text, nullable=True)
    data_collected = db.Column(db.Text, nullable=True)  # JSON format
    conclusion = db.Column(db.Text, nullable=True)
    success = db.Column(db.Boolean, default=False)
    success_rate = db.Column(db.Numeric(5, 2), nullable=True)  # percentage
    status = db.Column(db.String(50), nullable=False, default='planned')  # planned, in_progress, completed, failed, cancelled
    conducted_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    attachments = db.Column(db.Text, nullable=True)  # JSON array of file paths
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = db.relationship('ResearchProject', back_populates='experiments')
    conducted_by_user = db.relationship('User', foreign_keys=[conducted_by])
    reviewed_by_user = db.relationship('User', foreign_keys=[reviewed_by])
    materials = db.relationship('RDMaterial', back_populates='experiment', cascade='all, delete-orphan')

class ProductDevelopment(db.Model):
    __tablename__ = 'product_developments'
    
    id = db.Column(db.Integer, primary_key=True)
    development_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    project_id = db.Column(db.Integer, db.ForeignKey('research_projects.id'), nullable=True)
    product_name = db.Column(db.String(255), nullable=False)
    product_category = db.Column(db.String(100), nullable=True)
    product_type = db.Column(db.String(50), nullable=False, default='new')  # new, improvement, variant
    target_specifications = db.Column(db.Text, nullable=True)  # JSON format
    current_specifications = db.Column(db.Text, nullable=True)  # JSON format
    current_version = db.Column(db.String(20), nullable=False, default='1.0')
    development_stage = db.Column(db.String(50), nullable=False)  # concept, design, prototype, testing, pilot, production, launched
    target_launch_date = db.Column(db.Date, nullable=True)
    actual_launch_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='concept')  # concept, development, testing, approved, rejected, on_hold
    market_potential = db.Column(db.String(50), nullable=True)  # high, medium, low
    target_market = db.Column(db.Text, nullable=True)
    competitive_analysis = db.Column(db.Text, nullable=True)
    estimated_development_cost = db.Column(db.Numeric(15, 2), default=0)
    actual_development_cost = db.Column(db.Numeric(15, 2), default=0)
    estimated_production_cost = db.Column(db.Numeric(15, 2), default=0)
    target_selling_price = db.Column(db.Numeric(15, 2), default=0)
    roi_projection = db.Column(db.Numeric(5, 2), nullable=True)  # percentage
    development_progress = db.Column(db.Integer, default=0)  # percentage
    quality_standards = db.Column(db.Text, nullable=True)  # JSON format
    regulatory_requirements = db.Column(db.Text, nullable=True)
    intellectual_property = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = db.relationship('ResearchProject', back_populates='product_developments')
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    approved_by_user = db.relationship('User', foreign_keys=[approved_by])
    prototypes = db.relationship('Prototype', back_populates='product_development', cascade='all, delete-orphan')
    test_results = db.relationship('ProductTestResult', back_populates='product_development', cascade='all, delete-orphan')

class RDMaterial(db.Model):
    __tablename__ = 'rd_materials'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('research_projects.id'), nullable=True)
    experiment_id = db.Column(db.Integer, db.ForeignKey('experiments.id'), nullable=True)
    material_name = db.Column(db.String(255), nullable=False)
    material_code = db.Column(db.String(100), nullable=True)
    material_type = db.Column(db.String(100), nullable=True)  # raw_material, chemical, equipment, consumable
    category = db.Column(db.String(100), nullable=True)
    specification = db.Column(db.Text, nullable=True)
    quantity_requested = db.Column(db.Numeric(15, 2), nullable=False)
    quantity_used = db.Column(db.Numeric(15, 2), default=0)
    quantity_remaining = db.Column(db.Numeric(15, 2), default=0)
    uom = db.Column(db.String(20), nullable=False)
    unit_cost = db.Column(db.Numeric(15, 2), default=0)
    total_cost = db.Column(db.Numeric(15, 2), default=0)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=True)
    supplier_name = db.Column(db.String(200), nullable=True)
    purchase_date = db.Column(db.Date, nullable=True)
    usage_date = db.Column(db.Date, nullable=True)
    expiry_date = db.Column(db.Date, nullable=True)
    storage_location = db.Column(db.String(100), nullable=True)
    storage_conditions = db.Column(db.Text, nullable=True)
    safety_requirements = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='requested')  # requested, ordered, received, in_use, consumed, expired
    requested_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = db.relationship('ResearchProject', back_populates='materials')
    experiment = db.relationship('Experiment', back_populates='materials')
    supplier = db.relationship('Supplier')
    requested_by_user = db.relationship('User', foreign_keys=[requested_by])
    approved_by_user = db.relationship('User', foreign_keys=[approved_by])

class ResearchReport(db.Model):
    __tablename__ = 'research_reports'
    
    id = db.Column(db.Integer, primary_key=True)
    report_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    project_id = db.Column(db.Integer, db.ForeignKey('research_projects.id'), nullable=False)
    report_title = db.Column(db.String(255), nullable=False)
    report_type = db.Column(db.String(50), nullable=False)  # progress, final, interim, technical, patent
    report_date = db.Column(db.Date, nullable=False)
    period_from = db.Column(db.Date, nullable=True)
    period_to = db.Column(db.Date, nullable=True)
    executive_summary = db.Column(db.Text, nullable=True)
    objectives = db.Column(db.Text, nullable=True)
    methodology = db.Column(db.Text, nullable=True)
    findings = db.Column(db.Text, nullable=True)
    conclusions = db.Column(db.Text, nullable=True)
    recommendations = db.Column(db.Text, nullable=True)
    future_work = db.Column(db.Text, nullable=True)
    budget_utilization = db.Column(db.Text, nullable=True)
    challenges_faced = db.Column(db.Text, nullable=True)
    achievements = db.Column(db.Text, nullable=True)
    attachments = db.Column(db.Text, nullable=True)  # JSON array of file paths
    status = db.Column(db.String(50), nullable=False, default='draft')  # draft, review, approved, published
    prepared_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = db.relationship('ResearchProject', back_populates='reports')
    prepared_by_user = db.relationship('User', foreign_keys=[prepared_by])
    reviewed_by_user = db.relationship('User', foreign_keys=[reviewed_by])
    approved_by_user = db.relationship('User', foreign_keys=[approved_by])

class Prototype(db.Model):
    __tablename__ = 'prototypes'
    
    id = db.Column(db.Integer, primary_key=True)
    prototype_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    product_development_id = db.Column(db.Integer, db.ForeignKey('product_developments.id'), nullable=False)
    prototype_name = db.Column(db.String(255), nullable=False)
    version = db.Column(db.String(20), nullable=False, default='1.0')
    prototype_type = db.Column(db.String(50), nullable=False)  # concept, functional, visual, production
    development_date = db.Column(db.Date, nullable=False)
    specifications = db.Column(db.Text, nullable=True)  # JSON format
    materials_used = db.Column(db.Text, nullable=True)  # JSON format
    manufacturing_process = db.Column(db.Text, nullable=True)
    cost_to_build = db.Column(db.Numeric(15, 2), default=0)
    testing_status = db.Column(db.String(50), nullable=False, default='pending')  # pending, in_progress, completed, failed
    performance_results = db.Column(db.Text, nullable=True)  # JSON format
    feedback = db.Column(db.Text, nullable=True)
    improvements_needed = db.Column(db.Text, nullable=True)
    next_iteration_plan = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='active')  # active, obsolete, approved, rejected
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product_development = db.relationship('ProductDevelopment', back_populates='prototypes')
    created_by_user = db.relationship('User')
    test_results = db.relationship('ProductTestResult', back_populates='prototype', cascade='all, delete-orphan')

class ProductTestResult(db.Model):
    __tablename__ = 'product_test_results'
    
    id = db.Column(db.Integer, primary_key=True)
    test_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    product_development_id = db.Column(db.Integer, db.ForeignKey('product_developments.id'), nullable=False)
    prototype_id = db.Column(db.Integer, db.ForeignKey('prototypes.id'), nullable=True)
    test_name = db.Column(db.String(255), nullable=False)
    test_type = db.Column(db.String(50), nullable=False)  # functional, performance, durability, safety, usability
    test_standard = db.Column(db.String(100), nullable=True)
    test_date = db.Column(db.Date, nullable=False)
    test_duration = db.Column(db.Numeric(5, 2), nullable=True)  # hours
    test_conditions = db.Column(db.Text, nullable=True)  # JSON format
    test_parameters = db.Column(db.Text, nullable=True)  # JSON format
    expected_results = db.Column(db.Text, nullable=True)
    actual_results = db.Column(db.Text, nullable=True)
    test_data = db.Column(db.Text, nullable=True)  # JSON format
    pass_fail_status = db.Column(db.String(20), nullable=False)  # pass, fail, conditional
    score = db.Column(db.Numeric(5, 2), nullable=True)  # percentage or rating
    deviations = db.Column(db.Text, nullable=True)
    recommendations = db.Column(db.Text, nullable=True)
    retest_required = db.Column(db.Boolean, default=False)
    tested_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    attachments = db.Column(db.Text, nullable=True)  # JSON array of file paths
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product_development = db.relationship('ProductDevelopment', back_populates='test_results')
    prototype = db.relationship('Prototype', back_populates='test_results')
    tested_by_user = db.relationship('User', foreign_keys=[tested_by])
    reviewed_by_user = db.relationship('User', foreign_keys=[reviewed_by])
