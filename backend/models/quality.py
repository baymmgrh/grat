from datetime import datetime
from . import db

class QualityStandard(db.Model):
    __tablename__ = 'quality_standards'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    standard_type = db.Column(db.String(50), nullable=False)  # incoming, in_process, final
    test_parameters = db.Column(db.Text, nullable=True)  # JSON format
    acceptance_criteria = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product')

class QualityTest(db.Model):
    __tablename__ = 'quality_tests'
    
    id = db.Column(db.Integer, primary_key=True)
    test_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    test_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    test_type = db.Column(db.String(50), nullable=False)  # incoming, in_process, final
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    batch_number = db.Column(db.String(100), nullable=True)
    reference_type = db.Column(db.String(50), nullable=True)  # grn, work_order, sales_order
    reference_id = db.Column(db.Integer, nullable=True)
    standard_id = db.Column(db.Integer, db.ForeignKey('quality_standards.id'), nullable=True)
    result = db.Column(db.String(50), nullable=False, default='pending')  # pending, passed, failed, conditional
    test_results = db.Column(db.Text, nullable=True)  # JSON format
    defects_found = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    tested_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product')
    standard = db.relationship('QualityStandard')
    tested_by_user = db.relationship('User', foreign_keys=[tested_by])
    approved_by_user = db.relationship('User', foreign_keys=[approved_by])

class QualityInspection(db.Model):
    __tablename__ = 'quality_inspections'
    
    id = db.Column(db.Integer, primary_key=True)
    inspection_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    inspection_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    inspection_type = db.Column(db.String(50), nullable=False)  # incoming, in_process, final, audit
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=True)  # Link to Work Order
    batch_number = db.Column(db.String(100), nullable=True)
    sample_size = db.Column(db.Integer, nullable=True)
    defect_count = db.Column(db.Integer, default=0)
    status = db.Column(db.String(50), nullable=False, default='pending')  # pending, in_progress, completed
    result = db.Column(db.String(50), nullable=True)  # accepted, rejected, rework, passed, warning, critical
    
    # Reference for linking to various sources (goods_receipt_item, work_order_ipqc, etc.)
    reference_type = db.Column(db.String(50), nullable=True)
    reference_id = db.Column(db.Integer, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # QC Checklist Results - NEW
    total_checklist_items = db.Column(db.Integer, default=0)
    passed_checklist_items = db.Column(db.Integer, default=0)
    failed_checklist_items = db.Column(db.Integer, default=0)
    
    # Quantity Tracking - NEW
    quantity_inspected = db.Column(db.Numeric(15, 2), nullable=True)
    quantity_passed = db.Column(db.Numeric(15, 2), nullable=True)
    quantity_failed = db.Column(db.Numeric(15, 2), nullable=True)
    
    # Warehouse Disposition - NEW (based on QC result)
    disposition = db.Column(db.String(20), nullable=True)  # released, quarantine, reject
    disposition_date = db.Column(db.DateTime, nullable=True)
    disposition_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    disposition_notes = db.Column(db.Text, nullable=True)
    
    # Transfer to Warehouse - NEW
    transferred_to_warehouse = db.Column(db.Boolean, default=False)
    warehouse_transfer_date = db.Column(db.DateTime, nullable=True)
    warehouse_location_id = db.Column(db.Integer, db.ForeignKey('warehouse_locations.id'), nullable=True)
    
    findings = db.Column(db.Text, nullable=True)
    corrective_actions = db.Column(db.Text, nullable=True)
    inspector_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product')
    work_order = db.relationship('WorkOrder', backref='quality_inspections')
    inspector = db.relationship('User', foreign_keys=[inspector_id])
    disposition_user = db.relationship('User', foreign_keys=[disposition_by])
    warehouse_location = db.relationship('WarehouseLocation')
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    
    def calculate_disposition(self):
        """Calculate disposition based on checklist results"""
        if self.total_checklist_items == 0:
            return None
        
        if self.passed_checklist_items == self.total_checklist_items:
            # All passed = Released
            return 'released'
        elif self.passed_checklist_items == 0:
            # None passed = Reject (needs rework)
            return 'reject'
        else:
            # Partial pass = Quarantine
            return 'quarantine'

class CAPA(db.Model):
    __tablename__ = 'capa'
    
    id = db.Column(db.Integer, primary_key=True)
    capa_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    capa_type = db.Column(db.String(50), nullable=False)  # corrective, preventive
    issue_date = db.Column(db.Date, nullable=False)
    source = db.Column(db.String(100), nullable=True)  # quality_test, inspection, customer_complaint, audit
    reference_id = db.Column(db.Integer, nullable=True)
    problem_description = db.Column(db.Text, nullable=False)
    root_cause = db.Column(db.Text, nullable=True)
    action_plan = db.Column(db.Text, nullable=True)
    responsible_person_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    target_date = db.Column(db.Date, nullable=True)
    completion_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='open')  # open, in_progress, completed, cancelled
    effectiveness_verified = db.Column(db.Boolean, default=False)
    verification_date = db.Column(db.Date, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    responsible_person = db.relationship('User', foreign_keys=[responsible_person_id])
    created_by_user = db.relationship('User', foreign_keys=[created_by])
