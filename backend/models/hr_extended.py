from datetime import datetime
from . import db

# ===============================
# PAYROLL MODELS
# ===============================

class PayrollPeriod(db.Model):
    __tablename__ = 'payroll_periods'
    
    id = db.Column(db.Integer, primary_key=True)
    period_name = db.Column(db.String(100), nullable=False)  # "January 2024", "Q1 2024"
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(50), nullable=False, default='draft')  # draft, processing, completed, locked
    total_employees = db.Column(db.Integer, default=0)
    total_gross_salary = db.Column(db.Numeric(15, 2), default=0)
    total_deductions = db.Column(db.Numeric(15, 2), default=0)
    total_net_salary = db.Column(db.Numeric(15, 2), default=0)
    processed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    processed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    payroll_records = db.relationship('PayrollRecord', back_populates='period', cascade='all, delete-orphan')
    processed_by_user = db.relationship('User')

class PayrollRecord(db.Model):
    __tablename__ = 'payroll_records'
    
    id = db.Column(db.Integer, primary_key=True)
    payroll_period_id = db.Column(db.Integer, db.ForeignKey('payroll_periods.id'), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    
    # Basic Salary Components
    basic_salary = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    allowances = db.Column(db.Numeric(15, 2), default=0)  # Transport, meal, etc.
    overtime_amount = db.Column(db.Numeric(15, 2), default=0)
    bonus = db.Column(db.Numeric(15, 2), default=0)
    commission = db.Column(db.Numeric(15, 2), default=0)
    
    # Attendance Based
    total_working_days = db.Column(db.Integer, default=0)
    days_worked = db.Column(db.Integer, default=0)
    days_absent = db.Column(db.Integer, default=0)
    overtime_hours = db.Column(db.Numeric(5, 2), default=0)
    late_hours = db.Column(db.Numeric(5, 2), default=0)
    
    # Gross Salary
    gross_salary = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    
    # Deductions
    tax_deduction = db.Column(db.Numeric(15, 2), default=0)
    insurance_deduction = db.Column(db.Numeric(15, 2), default=0)
    pension_deduction = db.Column(db.Numeric(15, 2), default=0)
    loan_deduction = db.Column(db.Numeric(15, 2), default=0)
    other_deductions = db.Column(db.Numeric(15, 2), default=0)
    total_deductions = db.Column(db.Numeric(15, 2), default=0)
    
    # Net Salary
    net_salary = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    
    # Status
    status = db.Column(db.String(50), nullable=False, default='calculated')  # calculated, approved, paid
    payment_date = db.Column(db.Date, nullable=True)
    payment_method = db.Column(db.String(50), nullable=True)  # bank_transfer, cash, cheque
    
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    period = db.relationship('PayrollPeriod', back_populates='payroll_records')
    employee = db.relationship('Employee')

class SalaryComponent(db.Model):
    __tablename__ = 'salary_components'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    component_type = db.Column(db.String(50), nullable=False)  # earning, deduction
    calculation_type = db.Column(db.String(50), nullable=False)  # fixed, percentage, hourly
    is_taxable = db.Column(db.Boolean, default=True)
    is_active = db.Column(db.Boolean, default=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

class EmployeeSalaryComponent(db.Model):
    __tablename__ = 'employee_salary_components'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    salary_component_id = db.Column(db.Integer, db.ForeignKey('salary_components.id'), nullable=False)
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    effective_from = db.Column(db.Date, nullable=False)
    effective_to = db.Column(db.Date, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    employee = db.relationship('Employee')
    salary_component = db.relationship('SalaryComponent')

# ===============================
# APPRAISAL MODELS
# ===============================

class AppraisalCycle(db.Model):
    __tablename__ = 'appraisal_cycles'
    
    id = db.Column(db.Integer, primary_key=True)
    cycle_name = db.Column(db.String(100), nullable=False)  # "Annual Review 2024", "Mid-Year 2024"
    cycle_type = db.Column(db.String(50), nullable=False)  # annual, semi_annual, quarterly
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    self_review_deadline = db.Column(db.Date, nullable=True)
    manager_review_deadline = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='draft')  # draft, active, completed, closed
    description = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    appraisals = db.relationship('EmployeeAppraisal', back_populates='cycle', cascade='all, delete-orphan')
    created_by_user = db.relationship('User')

class AppraisalTemplate(db.Model):
    __tablename__ = 'appraisal_templates'
    
    id = db.Column(db.Integer, primary_key=True)
    template_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    criteria = db.relationship('AppraisalCriteria', back_populates='template', cascade='all, delete-orphan')

class AppraisalCriteria(db.Model):
    __tablename__ = 'appraisal_criteria'
    
    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('appraisal_templates.id'), nullable=False)
    criteria_name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    weight_percentage = db.Column(db.Numeric(5, 2), nullable=False)  # 0-100
    max_score = db.Column(db.Integer, nullable=False, default=5)
    order_index = db.Column(db.Integer, default=0)
    
    # Relationships
    template = db.relationship('AppraisalTemplate', back_populates='criteria')

class EmployeeAppraisal(db.Model):
    __tablename__ = 'employee_appraisals'
    
    id = db.Column(db.Integer, primary_key=True)
    appraisal_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    cycle_id = db.Column(db.Integer, db.ForeignKey('appraisal_cycles.id'), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    template_id = db.Column(db.Integer, db.ForeignKey('appraisal_templates.id'), nullable=False)
    reviewer_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=True)  # Manager/Reviewer
    
    # Self Assessment
    self_review_status = db.Column(db.String(50), default='pending')  # pending, completed
    self_review_date = db.Column(db.DateTime, nullable=True)
    self_overall_score = db.Column(db.Numeric(5, 2), nullable=True)
    self_comments = db.Column(db.Text, nullable=True)
    
    # Manager Assessment
    manager_review_status = db.Column(db.String(50), default='pending')  # pending, completed
    manager_review_date = db.Column(db.DateTime, nullable=True)
    manager_overall_score = db.Column(db.Numeric(5, 2), nullable=True)
    manager_comments = db.Column(db.Text, nullable=True)
    
    # Final Results
    final_score = db.Column(db.Numeric(5, 2), nullable=True)
    final_rating = db.Column(db.String(50), nullable=True)  # excellent, good, satisfactory, needs_improvement
    goals_next_period = db.Column(db.Text, nullable=True)
    development_plan = db.Column(db.Text, nullable=True)
    
    # Status
    overall_status = db.Column(db.String(50), default='draft')  # draft, self_review, manager_review, completed
    completed_at = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    cycle = db.relationship('AppraisalCycle', back_populates='appraisals')
    employee = db.relationship('Employee', foreign_keys=[employee_id])
    reviewer = db.relationship('Employee', foreign_keys=[reviewer_id])
    template = db.relationship('AppraisalTemplate')
    scores = db.relationship('AppraisalScore', back_populates='appraisal', cascade='all, delete-orphan')

class AppraisalScore(db.Model):
    __tablename__ = 'appraisal_scores'
    
    id = db.Column(db.Integer, primary_key=True)
    appraisal_id = db.Column(db.Integer, db.ForeignKey('employee_appraisals.id'), nullable=False)
    criteria_id = db.Column(db.Integer, db.ForeignKey('appraisal_criteria.id'), nullable=False)
    
    # Self Assessment
    self_score = db.Column(db.Integer, nullable=True)
    self_comments = db.Column(db.Text, nullable=True)
    
    # Manager Assessment
    manager_score = db.Column(db.Integer, nullable=True)
    manager_comments = db.Column(db.Text, nullable=True)
    
    # Final Score
    final_score = db.Column(db.Integer, nullable=True)
    
    # Relationships
    appraisal = db.relationship('EmployeeAppraisal', back_populates='scores')
    criteria = db.relationship('AppraisalCriteria')

# ===============================
# TRAINING MODELS
# ===============================

class TrainingCategory(db.Model):
    __tablename__ = 'training_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    programs = db.relationship('TrainingProgram', back_populates='category')

class TrainingProgram(db.Model):
    __tablename__ = 'training_programs'
    
    id = db.Column(db.Integer, primary_key=True)
    program_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    program_name = db.Column(db.String(200), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('training_categories.id'), nullable=False)
    description = db.Column(db.Text, nullable=True)
    objectives = db.Column(db.Text, nullable=True)
    duration_hours = db.Column(db.Integer, nullable=False)
    training_type = db.Column(db.String(50), nullable=False)  # internal, external, online, workshop
    max_participants = db.Column(db.Integer, nullable=True)
    cost_per_participant = db.Column(db.Numeric(15, 2), default=0)
    trainer_name = db.Column(db.String(200), nullable=True)
    trainer_company = db.Column(db.String(200), nullable=True)
    prerequisites = db.Column(db.Text, nullable=True)
    materials_provided = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = db.relationship('TrainingCategory', back_populates='programs')
    sessions = db.relationship('TrainingSession', back_populates='program', cascade='all, delete-orphan')
    created_by_user = db.relationship('User')

class TrainingSession(db.Model):
    __tablename__ = 'training_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    session_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    program_id = db.Column(db.Integer, db.ForeignKey('training_programs.id'), nullable=False)
    session_name = db.Column(db.String(200), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=True)
    end_time = db.Column(db.Time, nullable=True)
    location = db.Column(db.String(200), nullable=True)
    venue_details = db.Column(db.Text, nullable=True)
    max_participants = db.Column(db.Integer, nullable=True)
    current_participants = db.Column(db.Integer, default=0)
    status = db.Column(db.String(50), default='scheduled')  # scheduled, ongoing, completed, cancelled
    trainer_name = db.Column(db.String(200), nullable=True)
    total_cost = db.Column(db.Numeric(15, 2), default=0)
    notes = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    program = db.relationship('TrainingProgram', back_populates='sessions')
    enrollments = db.relationship('TrainingEnrollment', back_populates='session', cascade='all, delete-orphan')
    created_by_user = db.relationship('User')

class TrainingEnrollment(db.Model):
    __tablename__ = 'training_enrollments'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('training_sessions.id'), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    enrollment_date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    enrollment_status = db.Column(db.String(50), default='enrolled')  # enrolled, attended, completed, cancelled, no_show
    
    # Attendance
    attendance_status = db.Column(db.String(50), nullable=True)  # present, absent, partial
    attendance_percentage = db.Column(db.Numeric(5, 2), default=0)
    
    # Assessment
    pre_assessment_score = db.Column(db.Numeric(5, 2), nullable=True)
    post_assessment_score = db.Column(db.Numeric(5, 2), nullable=True)
    final_score = db.Column(db.Numeric(5, 2), nullable=True)
    pass_status = db.Column(db.String(50), nullable=True)  # pass, fail, pending
    
    # Certification
    certificate_issued = db.Column(db.Boolean, default=False)
    certificate_number = db.Column(db.String(100), nullable=True)
    certificate_date = db.Column(db.Date, nullable=True)
    certificate_valid_until = db.Column(db.Date, nullable=True)
    
    # Feedback
    feedback_rating = db.Column(db.Integer, nullable=True)  # 1-5
    feedback_comments = db.Column(db.Text, nullable=True)
    
    notes = db.Column(db.Text, nullable=True)
    enrolled_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    session = db.relationship('TrainingSession', back_populates='enrollments')
    employee = db.relationship('Employee')
    enrolled_by_user = db.relationship('User')
    
    __table_args__ = (
        db.UniqueConstraint('session_id', 'employee_id', name='unique_session_employee'),
    )

class TrainingRequest(db.Model):
    __tablename__ = 'training_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    request_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    program_id = db.Column(db.Integer, db.ForeignKey('training_programs.id'), nullable=True)
    requested_training = db.Column(db.String(200), nullable=False)  # If program_id is null
    justification = db.Column(db.Text, nullable=False)
    preferred_date = db.Column(db.Date, nullable=True)
    estimated_cost = db.Column(db.Numeric(15, 2), nullable=True)
    priority = db.Column(db.String(50), default='medium')  # low, medium, high, urgent
    status = db.Column(db.String(50), default='pending')  # pending, approved, rejected, completed
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    employee = db.relationship('Employee')
    program = db.relationship('TrainingProgram')
    approved_by_user = db.relationship('User')
