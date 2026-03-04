"""
R&D (Research & Development) Module Models
Manages product development lifecycle from lab scale to production validation

Workflow: LAB_SCALE → PILOT_SCALE → VALIDATION → COMPLETION
"""
from datetime import datetime
from . import db
from sqlalchemy.dialects.sqlite import JSON


# ==================== ENUMS ====================

class RNDProjectStage:
    """Project workflow stages"""
    LAB_SCALE = 'LAB_SCALE'
    PILOT_SCALE = 'PILOT_SCALE'
    VALIDATION = 'VALIDATION'
    COMPLETION = 'COMPLETION'
    CANCELLED = 'CANCELLED'
    
    @classmethod
    def all(cls):
        return [cls.LAB_SCALE, cls.PILOT_SCALE, cls.VALIDATION, cls.COMPLETION, cls.CANCELLED]
    
    @classmethod
    def active_stages(cls):
        return [cls.LAB_SCALE, cls.PILOT_SCALE, cls.VALIDATION]
    
    @classmethod
    def next_stage(cls, current):
        flow = {
            cls.LAB_SCALE: cls.PILOT_SCALE,
            cls.PILOT_SCALE: cls.VALIDATION,
            cls.VALIDATION: cls.COMPLETION
        }
        return flow.get(current)


class RNDApprovalStatus:
    """Approval statuses"""
    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'
    
    @classmethod
    def all(cls):
        return [cls.PENDING, cls.APPROVED, cls.REJECTED]


class RNDExperimentStatus:
    """Experiment result statuses"""
    PENDING = 'PENDING'
    IN_PROGRESS = 'IN_PROGRESS'
    PASSED = 'PASSED'
    FAILED = 'FAILED'
    CANCELLED = 'CANCELLED'
    
    @classmethod
    def all(cls):
        return [cls.PENDING, cls.IN_PROGRESS, cls.PASSED, cls.FAILED, cls.CANCELLED]


# ==================== PROJECT MODEL ====================

class RNDProject(db.Model):
    """
    Master table for R&D Projects
    Manages the lifecycle of product development
    """
    __tablename__ = 'rnd_projects'
    
    id = db.Column(db.Integer, primary_key=True)
    project_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Project categorization
    project_type = db.Column(db.String(50), nullable=False, default='new_product')  # new_product, improvement, cost_reduction
    priority = db.Column(db.String(20), nullable=False, default='medium')  # low, medium, high, critical
    
    # Workflow stage
    stage = db.Column(db.String(30), nullable=False, default=RNDProjectStage.LAB_SCALE)
    is_locked = db.Column(db.Boolean, default=False, nullable=False)  # Locked after COMPLETION
    
    # Target product (optional - can be new or existing)
    target_product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    target_product_code = db.Column(db.String(100), nullable=True)  # For new products not yet created
    target_product_name = db.Column(db.String(255), nullable=True)
    
    # Timeline
    start_date = db.Column(db.Date, nullable=True)
    target_completion_date = db.Column(db.Date, nullable=True)
    actual_completion_date = db.Column(db.Date, nullable=True)
    
    # Budget
    estimated_budget = db.Column(db.Numeric(15, 2), nullable=True)
    actual_cost = db.Column(db.Numeric(15, 2), nullable=True)
    
    # Team
    project_leader_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Audit
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    target_product = db.relationship('Product', foreign_keys=[target_product_id])
    project_leader = db.relationship('User', foreign_keys=[project_leader_id])
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    formulas = db.relationship('RNDFormula', back_populates='project', cascade='all, delete-orphan')
    approval_logs = db.relationship('RNDApprovalLog', back_populates='project', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<RNDProject {self.project_number} - {self.name}>'
    
    def can_advance_stage(self):
        """Check if project can advance to next stage"""
        if self.is_locked or self.stage == RNDProjectStage.COMPLETION:
            return False, "Project is locked or already completed"
        
        # Check for selected formula
        selected_formula = RNDFormula.query.filter_by(
            project_id=self.id, 
            is_selected=True
        ).first()
        
        if not selected_formula:
            return False, "No formula selected for this project"
        
        # Check for passed experiment on selected formula
        passed_experiment = RNDExperiment.query.filter_by(
            formula_id=selected_formula.id,
            status=RNDExperimentStatus.PASSED
        ).order_by(RNDExperiment.created_at.desc()).first()
        
        if not passed_experiment:
            return False, "Selected formula has no passed experiments"
        
        # Check for manager approval for current stage
        approval = RNDApprovalLog.query.filter_by(
            project_id=self.id,
            stage=self.stage,
            status=RNDApprovalStatus.APPROVED
        ).first()
        
        if not approval:
            return False, f"Manager approval required for {self.stage} stage"
        
        return True, "Ready to advance"
    
    def to_dict(self, include_formulas=False):
        result = {
            'id': self.id,
            'project_number': self.project_number,
            'name': self.name,
            'description': self.description,
            'project_type': self.project_type,
            'priority': self.priority,
            'stage': self.stage,
            'is_locked': self.is_locked,
            'target_product_id': self.target_product_id,
            'target_product_code': self.target_product_code,
            'target_product_name': self.target_product_name,
            'target_product': {
                'id': self.target_product.id,
                'code': self.target_product.code,
                'name': self.target_product.name
            } if self.target_product else None,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'target_completion_date': self.target_completion_date.isoformat() if self.target_completion_date else None,
            'actual_completion_date': self.actual_completion_date.isoformat() if self.actual_completion_date else None,
            'estimated_budget': float(self.estimated_budget) if self.estimated_budget else None,
            'actual_cost': float(self.actual_cost) if self.actual_cost else None,
            'project_leader_id': self.project_leader_id,
            'project_leader_name': self.project_leader.full_name if self.project_leader else None,
            'created_by': self.created_by,
            'created_by_name': self.created_by_user.full_name if self.created_by_user else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'formula_count': len(self.formulas),
            'selected_formula': None
        }
        
        # Get selected formula
        selected = next((f for f in self.formulas if f.is_selected), None)
        if selected:
            result['selected_formula'] = {
                'id': selected.id,
                'version': selected.version,
                'name': selected.name
            }
        
        if include_formulas:
            result['formulas'] = [f.to_dict() for f in self.formulas]
        
        return result


# ==================== FORMULA MODEL ====================

class RNDFormula(db.Model):
    """
    Formula iterations for R&D projects
    Each project can have multiple formula versions
    """
    __tablename__ = 'rnd_formulas'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('rnd_projects.id', ondelete='CASCADE'), nullable=False)
    
    # Version control
    version = db.Column(db.String(20), nullable=False)  # V1, V1.1, V2, etc.
    name = db.Column(db.String(255), nullable=True)  # Optional descriptive name
    description = db.Column(db.Text, nullable=True)
    
    # Selection flags
    is_selected = db.Column(db.Boolean, default=False, nullable=False)  # Selected for production
    is_final_candidate = db.Column(db.Boolean, default=False, nullable=False)  # Final candidate
    
    # Cost estimation
    total_estimated_cost = db.Column(db.Numeric(15, 2), nullable=True)
    cost_per_unit = db.Column(db.Numeric(15, 4), nullable=True)
    
    # Batch info
    batch_size = db.Column(db.Numeric(15, 2), nullable=False, default=1)
    batch_uom = db.Column(db.String(20), nullable=False, default='kg')
    
    # Status
    status = db.Column(db.String(30), nullable=False, default='draft')  # draft, testing, approved, rejected
    
    # Audit
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = db.relationship('RNDProject', back_populates='formulas')
    items = db.relationship('RNDFormulaItem', back_populates='formula', cascade='all, delete-orphan')
    experiments = db.relationship('RNDExperiment', back_populates='formula', cascade='all, delete-orphan')
    created_by_user = db.relationship('User')
    
    def __repr__(self):
        return f'<RNDFormula {self.version} - Project {self.project_id}>'
    
    def calculate_cost(self):
        """Calculate total cost from formula items"""
        total = sum(
            float(item.quantity or 0) * float(item.unit_cost or 0)
            for item in self.items
        )
        self.total_estimated_cost = total
        if self.batch_size and float(self.batch_size) > 0:
            self.cost_per_unit = total / float(self.batch_size)
        return total
    
    def to_dict(self, include_items=True, include_experiments=False):
        result = {
            'id': self.id,
            'project_id': self.project_id,
            'version': self.version,
            'name': self.name,
            'description': self.description,
            'is_selected': self.is_selected,
            'is_final_candidate': self.is_final_candidate,
            'total_estimated_cost': float(self.total_estimated_cost) if self.total_estimated_cost else None,
            'cost_per_unit': float(self.cost_per_unit) if self.cost_per_unit else None,
            'batch_size': float(self.batch_size) if self.batch_size else 1,
            'batch_uom': self.batch_uom,
            'status': self.status,
            'created_by': self.created_by,
            'created_by_name': self.created_by_user.full_name if self.created_by_user else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'item_count': len(self.items),
            'experiment_count': len(self.experiments),
            'last_experiment_status': None
        }
        
        # Get last experiment status
        if self.experiments:
            last_exp = max(self.experiments, key=lambda x: x.created_at)
            result['last_experiment_status'] = last_exp.status
        
        if include_items:
            result['items'] = [item.to_dict() for item in self.items]
        
        if include_experiments:
            result['experiments'] = [exp.to_dict() for exp in self.experiments]
        
        return result


class RNDFormulaItem(db.Model):
    """
    Items/materials in a formula
    Links to existing materials in the system
    """
    __tablename__ = 'rnd_formula_items'
    
    id = db.Column(db.Integer, primary_key=True)
    formula_id = db.Column(db.Integer, db.ForeignKey('rnd_formulas.id', ondelete='CASCADE'), nullable=False)
    
    line_number = db.Column(db.Integer, nullable=False)
    
    # Material reference (can be existing or new)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=True)
    material_code = db.Column(db.String(100), nullable=True)  # For display/manual entry
    material_name = db.Column(db.String(255), nullable=False)
    
    # Quantity and cost
    quantity = db.Column(db.Numeric(20, 10), nullable=False)
    uom = db.Column(db.String(20), nullable=False)
    unit_cost = db.Column(db.Numeric(15, 4), nullable=True)
    
    # Specifications
    percentage = db.Column(db.Numeric(8, 4), nullable=True)  # Percentage of total
    scrap_percent = db.Column(db.Numeric(5, 2), default=0)
    is_critical = db.Column(db.Boolean, default=False)
    
    notes = db.Column(db.Text, nullable=True)
    
    # Audit
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    formula = db.relationship('RNDFormula', back_populates='items')
    material = db.relationship('Material')
    
    __table_args__ = (
        db.UniqueConstraint('formula_id', 'line_number', name='unique_formula_line'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'formula_id': self.formula_id,
            'line_number': self.line_number,
            'material_id': self.material_id,
            'material_code': self.material_code or (self.material.code if self.material else None),
            'material_name': self.material_name,
            'quantity': float(self.quantity) if self.quantity else 0,
            'uom': self.uom,
            'unit_cost': float(self.unit_cost) if self.unit_cost else None,
            'percentage': float(self.percentage) if self.percentage else None,
            'scrap_percent': float(self.scrap_percent) if self.scrap_percent else 0,
            'is_critical': self.is_critical,
            'notes': self.notes,
            'total_cost': float(self.quantity or 0) * float(self.unit_cost or 0)
        }


# ==================== EXPERIMENT MODEL ====================

class RNDExperiment(db.Model):
    """
    Experiment/trial records for formula testing
    Each experiment is linked to a specific formula version
    """
    __tablename__ = 'rnd_experiments'
    
    id = db.Column(db.Integer, primary_key=True)
    formula_id = db.Column(db.Integer, db.ForeignKey('rnd_formulas.id', ondelete='CASCADE'), nullable=False)
    
    # Experiment identification
    experiment_number = db.Column(db.String(50), nullable=False, index=True)
    batch_number = db.Column(db.String(50), nullable=True)
    
    # Trial details
    trial_date = db.Column(db.Date, nullable=False)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=True)
    
    # Status
    status = db.Column(db.String(30), nullable=False, default=RNDExperimentStatus.PENDING)
    
    # Results - flexible JSON format for various QC parameters
    qc_results = db.Column(JSON, nullable=True)  # Stores various lab test results
    
    # Output metrics
    quantity_produced = db.Column(db.Numeric(15, 2), nullable=True)
    quantity_good = db.Column(db.Numeric(15, 2), nullable=True)
    quantity_rejected = db.Column(db.Numeric(15, 2), nullable=True)
    yield_percentage = db.Column(db.Numeric(5, 2), nullable=True)
    
    # Observations
    observations = db.Column(db.Text, nullable=True)
    issues_found = db.Column(db.Text, nullable=True)
    recommendations = db.Column(db.Text, nullable=True)
    
    # Conducted by
    conducted_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    
    # Audit
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    formula = db.relationship('RNDFormula', back_populates='experiments')
    machine = db.relationship('Machine')
    conducted_by_user = db.relationship('User', foreign_keys=[conducted_by])
    reviewed_by_user = db.relationship('User', foreign_keys=[reviewed_by])
    
    def __repr__(self):
        return f'<RNDExperiment {self.experiment_number} - {self.status}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'formula_id': self.formula_id,
            'experiment_number': self.experiment_number,
            'batch_number': self.batch_number,
            'trial_date': self.trial_date.isoformat() if self.trial_date else None,
            'machine_id': self.machine_id,
            'machine_name': self.machine.name if self.machine else None,
            'status': self.status,
            'qc_results': self.qc_results,
            'quantity_produced': float(self.quantity_produced) if self.quantity_produced else None,
            'quantity_good': float(self.quantity_good) if self.quantity_good else None,
            'quantity_rejected': float(self.quantity_rejected) if self.quantity_rejected else None,
            'yield_percentage': float(self.yield_percentage) if self.yield_percentage else None,
            'observations': self.observations,
            'issues_found': self.issues_found,
            'recommendations': self.recommendations,
            'conducted_by': self.conducted_by,
            'conducted_by_name': self.conducted_by_user.full_name if self.conducted_by_user else None,
            'reviewed_by': self.reviewed_by,
            'reviewed_by_name': self.reviewed_by_user.full_name if self.reviewed_by_user else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


# ==================== APPROVAL LOG MODEL ====================

class RNDApprovalLog(db.Model):
    """
    Approval gate records for stage transitions
    Required for moving between workflow stages
    """
    __tablename__ = 'rnd_approval_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('rnd_projects.id', ondelete='CASCADE'), nullable=False)
    
    # Stage transition
    stage = db.Column(db.String(30), nullable=False)  # Stage being approved
    from_stage = db.Column(db.String(30), nullable=True)  # Previous stage
    to_stage = db.Column(db.String(30), nullable=True)  # Target stage
    
    # Approval details
    status = db.Column(db.String(20), nullable=False, default=RNDApprovalStatus.PENDING)
    approver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    
    # Notes and reason
    notes = db.Column(db.Text, nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    
    # Requested by
    requested_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    requested_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Audit
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    project = db.relationship('RNDProject', back_populates='approval_logs')
    approver = db.relationship('User', foreign_keys=[approver_id])
    requested_by_user = db.relationship('User', foreign_keys=[requested_by])
    
    def __repr__(self):
        return f'<RNDApprovalLog Project {self.project_id} - {self.stage} - {self.status}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'stage': self.stage,
            'from_stage': self.from_stage,
            'to_stage': self.to_stage,
            'status': self.status,
            'approver_id': self.approver_id,
            'approver_name': self.approver.full_name if self.approver else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'notes': self.notes,
            'rejection_reason': self.rejection_reason,
            'requested_by': self.requested_by,
            'requested_by_name': self.requested_by_user.full_name if self.requested_by_user else None,
            'requested_at': self.requested_at.isoformat() if self.requested_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


# ==================== CONVERSION RECORD MODEL ====================

class RNDConversionRecord(db.Model):
    """
    Records of successful conversions from R&D to Production BOM
    Maintains audit trail and links between R&D and Production
    """
    __tablename__ = 'rnd_conversion_records'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Source
    project_id = db.Column(db.Integer, db.ForeignKey('rnd_projects.id'), nullable=False)
    formula_id = db.Column(db.Integer, db.ForeignKey('rnd_formulas.id'), nullable=False)
    
    # Target
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    bom_id = db.Column(db.Integer, db.ForeignKey('bill_of_materials.id'), nullable=True)
    
    # Conversion details
    conversion_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    converted_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Notes
    notes = db.Column(db.Text, nullable=True)
    
    # Audit
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    project = db.relationship('RNDProject')
    formula = db.relationship('RNDFormula')
    product = db.relationship('Product')
    bom = db.relationship('BillOfMaterials')
    converted_by_user = db.relationship('User')
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'project_number': self.project.project_number if self.project else None,
            'formula_id': self.formula_id,
            'formula_version': self.formula.version if self.formula else None,
            'product_id': self.product_id,
            'product_code': self.product.code if self.product else None,
            'product_name': self.product.name if self.product else None,
            'bom_id': self.bom_id,
            'bom_number': self.bom.bom_number if self.bom else None,
            'conversion_date': self.conversion_date.isoformat() if self.conversion_date else None,
            'converted_by': self.converted_by,
            'converted_by_name': self.converted_by_user.full_name if self.converted_by_user else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
