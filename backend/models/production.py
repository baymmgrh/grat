from datetime import datetime
from . import db

class Machine(db.Model):
    __tablename__ = 'machines'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    machine_type = db.Column(db.String(100), nullable=False)  # nonwoven_machine, cutting_machine, packing_machine
    manufacturer = db.Column(db.String(200), nullable=True)
    model = db.Column(db.String(100), nullable=True)
    serial_number = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='idle')  # idle, running, maintenance, breakdown, offline
    location = db.Column(db.String(200), nullable=True)
    department = db.Column(db.String(100), nullable=True)
    capacity_per_hour = db.Column(db.Numeric(15, 2), nullable=True)
    capacity_uom = db.Column(db.String(20), nullable=True)
    efficiency = db.Column(db.Numeric(5, 2), default=100)  # percentage
    availability = db.Column(db.Numeric(5, 2), default=100)  # percentage
    last_maintenance = db.Column(db.Date, nullable=True)
    next_maintenance = db.Column(db.Date, nullable=True)
    installation_date = db.Column(db.Date, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    specifications = db.Column(db.Text, nullable=True)
    maintenance_schedule = db.Column(db.String(50), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    work_orders = db.relationship('WorkOrder', back_populates='machine')
    production_records = db.relationship('ProductionRecord', back_populates='machine')
    maintenance_records = db.relationship('MaintenanceRecord', back_populates='machine')
    oee_records = db.relationship('OEERecord', back_populates='machine')
    rosters = db.relationship('EmployeeRoster', back_populates='machine')
    shift_productions = db.relationship('ShiftProduction', back_populates='machine')
    downtime_records = db.relationship('DowntimeRecord', back_populates='machine')
    
    def __repr__(self):
        return f'<Machine {self.code} - {self.name}>'

class BillOfMaterials(db.Model):
    __tablename__ = 'bill_of_materials'
    
    id = db.Column(db.Integer, primary_key=True)
    bom_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    version = db.Column(db.String(20), nullable=False, default='1.0')
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    effective_date = db.Column(db.Date, nullable=True)
    expiry_date = db.Column(db.Date, nullable=True)
    batch_size = db.Column(db.Numeric(15, 2), nullable=False, default=1)
    batch_uom = db.Column(db.String(20), nullable=False)
    pack_per_carton = db.Column(db.Integer, nullable=False, default=1)
    notes = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product', back_populates='boms')
    items = db.relationship('BOMItem', back_populates='bom', cascade='all, delete-orphan')
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    approved_by_user = db.relationship('User', foreign_keys=[approved_by])
    
    # MRP Integration - Remove invalid relationship
    # mrp_requirements = db.relationship('MRPRequirement', back_populates='bom')  # No bom_id in MRPRequirement
    work_orders = db.relationship('WorkOrder', back_populates='bom')

    @property
    def total_cost(self):
        """Calculate total cost of all BOM items"""
        return sum(item.total_cost for item in self.items)

    @property
    def total_materials(self):
        """Count total number of materials in BOM"""
        return len(self.items)

    @property
    def critical_materials(self):
        """Count critical materials in BOM"""
        return len([item for item in self.items if item.is_critical])

class BOMItem(db.Model):
    __tablename__ = 'bom_items'
    
    id = db.Column(db.Integer, primary_key=True)
    bom_id = db.Column(db.Integer, db.ForeignKey('bill_of_materials.id', ondelete='CASCADE'), nullable=False)
    line_number = db.Column(db.Integer, nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=True)
    quantity = db.Column(db.Numeric(20, 10), nullable=False)  # Support up to 10 decimal places for precision
    uom = db.Column(db.String(20), nullable=False)
    scrap_percent = db.Column(db.Numeric(5, 2), default=0)
    is_critical = db.Column(db.Boolean, default=False)
    unit_cost = db.Column(db.Numeric(15, 4), nullable=True)
    percentage = db.Column(db.Numeric(5, 2), default=0)  # Percentage of total BOM cost
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=True)
    lead_time_days = db.Column(db.Integer, default=0)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    bom = db.relationship('BillOfMaterials', back_populates='items')
    product = db.relationship('Product', back_populates='bom_items')
    material = db.relationship('Material', back_populates='bom_items')
    supplier = db.relationship('Supplier', backref='bom_items')
    
    __table_args__ = (
        db.UniqueConstraint('bom_id', 'line_number', name='unique_bom_line'),
    )

    @property
    def item_name(self):
        """Get the name of the material or product"""
        if self.material:
            return self.material.name
        elif self.product:
            return self.product.name
        return "Unknown Item"

    @property
    def item_code(self):
        """Get the code of the material or product"""
        if self.material:
            return self.material.code
        elif self.product:
            return self.product.code
        return "Unknown Code"

    @property
    def item_type(self):
        """Get the type of item (material or product)"""
        if self.material:
            return self.material.material_type
        elif self.product:
            return self.product.material_type
        return "unknown"

    @property
    def effective_quantity(self):
        """Calculate quantity including scrap percentage"""
        base_quantity = float(self.quantity)
        scrap_quantity = base_quantity * (float(self.scrap_percent) / 100)
        return base_quantity + scrap_quantity

    @property
    def total_cost(self):
        """Calculate total cost for this BOM item"""
        if self.unit_cost:
            return float(self.effective_quantity) * float(self.unit_cost)
        elif self.material and self.material.cost_per_unit:
            return float(self.effective_quantity) * float(self.material.cost_per_unit)
        elif self.product and self.product.cost:
            return float(self.effective_quantity) * float(self.product.cost)
        return 0

    @property
    def current_stock(self):
        """Get current stock level from warehouse"""
        if self.material:
            # Get from material inventory
            from .warehouse import Inventory
            inventory = Inventory.query.filter_by(
                material_id=self.material_id,
                is_active=True
            ).first()
            return float(inventory.quantity_on_hand) if inventory else 0
        elif self.product:
            # Get from product inventory
            from .warehouse import Inventory
            inventory = Inventory.query.filter_by(
                product_id=self.product_id,
                is_active=True
            ).first()
            return float(inventory.quantity_on_hand) if inventory else 0
        return 0

    @property
    def shortage_quantity(self):
        """Calculate shortage for production requirements"""
        required_qty = float(self.effective_quantity)
        available_qty = self.current_stock
        return max(0, required_qty - available_qty)

    @property
    def is_shortage(self):
        """Check if there's a shortage for this item"""
        return self.shortage_quantity > 0

class ProductionPlan(db.Model):
    """Master Production Schedule (MPS) - Production Planning"""
    __tablename__ = 'production_plans'
    
    id = db.Column(db.Integer, primary_key=True)
    plan_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    plan_name = db.Column(db.String(200), nullable=False)
    
    # Planning Period
    plan_type = db.Column(db.String(20), nullable=False, default='weekly')  # daily, weekly, monthly
    period_start = db.Column(db.Date, nullable=False)
    period_end = db.Column(db.Date, nullable=False)
    
    # Source References
    sales_forecast_id = db.Column(db.Integer, db.ForeignKey('sales_forecasts.id'), nullable=True)
    based_on = db.Column(db.String(50), nullable=False, default='forecast')  # forecast, sales_order, both, manual
    
    # Planning Details
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    planned_quantity = db.Column(db.Numeric(15, 2), nullable=False)
    uom = db.Column(db.String(20), nullable=False)
    
    # Capacity & Resources
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=True)
    estimated_duration_hours = db.Column(db.Numeric(10, 2), nullable=True)
    required_operators = db.Column(db.Integer, nullable=True)
    
    # Status & Priority
    status = db.Column(db.String(50), nullable=False, default='draft')  # draft, approved, released, completed, cancelled
    priority = db.Column(db.String(20), nullable=False, default='normal')  # low, normal, high, urgent
    
    # Tracking
    actual_quantity = db.Column(db.Numeric(15, 2), default=0)
    completion_percentage = db.Column(db.Numeric(5, 2), default=0)
    
    notes = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product')
    machine = db.relationship('Machine')
    sales_forecast = db.relationship('SalesForecast')
    work_orders = db.relationship('WorkOrder', back_populates='production_plan')
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    approved_by_user = db.relationship('User', foreign_keys=[approved_by])
    
    def __repr__(self):
        return f'<ProductionPlan {self.plan_number} - {self.plan_name}>'

class WorkOrder(db.Model):
    __tablename__ = 'work_orders'
    
    id = db.Column(db.Integer, primary_key=True)
    wo_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    bom_id = db.Column(db.Integer, db.ForeignKey('bill_of_materials.id'), nullable=True)
    production_plan_id = db.Column(db.Integer, db.ForeignKey('production_plans.id'), nullable=True)
    sales_order_id = db.Column(db.Integer, db.ForeignKey('sales_orders.id'), nullable=True)
    
    # Quantity & UOM
    quantity = db.Column(db.Numeric(15, 2), nullable=False)
    uom = db.Column(db.String(20), nullable=False)
    required_date = db.Column(db.Date, nullable=True)
    quantity_produced = db.Column(db.Numeric(15, 2), default=0)
    quantity_good = db.Column(db.Numeric(15, 2), default=0)
    quantity_scrap = db.Column(db.Numeric(15, 2), default=0)
    status = db.Column(db.String(50), nullable=False, default='planned')  # planned, released, in_progress, completed, cancelled
    priority = db.Column(db.String(20), nullable=False, default='normal')  # low, normal, high, urgent
    
    # Source Type - How this WO was created
    source_type = db.Column(db.String(50), nullable=False, default='manual')  # manual, from_bom, from_schedule
    schedule_grid_id = db.Column(db.Integer, nullable=True)  # Link to ScheduleGridItem if from_schedule
    
    # Workflow Integration Fields
    mrp_requirement_id = db.Column(db.Integer, nullable=True)  # Link to MRP requirement
    workflow_status = db.Column(db.String(50), nullable=False, default='pending')  # pending, mrp_analyzed, scheduled, in_production
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=True)
    scheduled_start_date = db.Column(db.DateTime, nullable=True)
    scheduled_end_date = db.Column(db.DateTime, nullable=True)
    actual_start_date = db.Column(db.DateTime, nullable=True)
    actual_end_date = db.Column(db.DateTime, nullable=True)
    production_shift = db.Column(db.String(50), nullable=True)
    batch_number = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    supervisor_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product', back_populates='work_orders')
    bom = db.relationship('BillOfMaterials', back_populates='work_orders')
    production_plan = db.relationship('ProductionPlan', back_populates='work_orders')
    sales_order = db.relationship('SalesOrder')
    machine = db.relationship('Machine', back_populates='work_orders')
    production_records = db.relationship('ProductionRecord', back_populates='work_order', cascade='all, delete-orphan')
    created_by_user = db.relationship('User')
    supervisor = db.relationship('Employee')

class ProductionRecord(db.Model):
    __tablename__ = 'production_records'
    
    id = db.Column(db.Integer, primary_key=True)
    work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id', ondelete='CASCADE'), nullable=False)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=True)
    operator_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=True)
    production_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    shift = db.Column(db.String(50), nullable=True)
    quantity_produced = db.Column(db.Numeric(15, 2), nullable=False)
    quantity_good = db.Column(db.Numeric(15, 2), nullable=False)
    quantity_scrap = db.Column(db.Numeric(15, 2), default=0)
    uom = db.Column(db.String(20), nullable=False)
    downtime_minutes = db.Column(db.Integer, default=0)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    work_order = db.relationship('WorkOrder', back_populates='production_records')
    machine = db.relationship('Machine', back_populates='production_records')
    operator = db.relationship('Employee')
    
    __table_args__ = (
        db.Index('idx_production_date', 'production_date'),
    )

class ProductionSchedule(db.Model):
    __tablename__ = 'production_schedules'
    
    id = db.Column(db.Integer, primary_key=True)
    schedule_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=False)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=False)
    scheduled_start = db.Column(db.DateTime, nullable=False)
    scheduled_end = db.Column(db.DateTime, nullable=False)
    actual_start = db.Column(db.DateTime, nullable=True)
    actual_end = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='scheduled')  # scheduled, in_progress, completed, cancelled
    shift = db.Column(db.String(50), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    work_order = db.relationship('WorkOrder')
    machine = db.relationship('Machine')
    user = db.relationship('User')

class ShiftProduction(db.Model):
    __tablename__ = 'shift_productions'
    
    id = db.Column(db.Integer, primary_key=True)
    production_date = db.Column(db.Date, nullable=False, index=True)
    shift = db.Column(db.String(20), nullable=False)  # shift_1, shift_2, shift_3
    shift_start = db.Column(db.Time, nullable=False)
    shift_end = db.Column(db.Time, nullable=False)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=True)
    
    # Production Data
    target_quantity = db.Column(db.Numeric(15, 2), nullable=False)
    actual_quantity = db.Column(db.Numeric(15, 2), nullable=False)
    good_quantity = db.Column(db.Numeric(15, 2), nullable=False)
    reject_quantity = db.Column(db.Numeric(15, 2), default=0)
    rework_quantity = db.Column(db.Numeric(15, 2), default=0)
    uom = db.Column(db.String(20), nullable=False)
    
    # Efficiency Metrics
    planned_runtime = db.Column(db.Integer, nullable=False)  # minutes
    actual_runtime = db.Column(db.Integer, nullable=False)  # minutes
    downtime_minutes = db.Column(db.Integer, default=0)
    setup_time = db.Column(db.Integer, default=0)  # minutes
    
    # Downtime by Category (in minutes) - for OEE calculation
    downtime_mesin = db.Column(db.Integer, default=0)  # Machine downtime - max 15%
    downtime_operator = db.Column(db.Integer, default=0)  # Operator downtime - max 7%
    downtime_material = db.Column(db.Integer, default=0)  # Raw material - 0%
    downtime_design = db.Column(db.Integer, default=0)  # Design change - max 8%
    downtime_others = db.Column(db.Integer, default=0)  # Others - max 10%
    idle_time = db.Column(db.Integer, default=0)  # Idle time
    
    # Efficiency Loss by Category (percentage)
    loss_mesin = db.Column(db.Numeric(5, 2), default=0)  # Machine loss %
    loss_operator = db.Column(db.Numeric(5, 2), default=0)  # Operator loss %
    loss_material = db.Column(db.Numeric(5, 2), default=0)  # Material loss %
    loss_design = db.Column(db.Numeric(5, 2), default=0)  # Design change loss %
    loss_others = db.Column(db.Numeric(5, 2), default=0)  # Others loss %
    
    # Quality Data
    quality_rate = db.Column(db.Numeric(5, 2), default=100)  # percentage
    efficiency_rate = db.Column(db.Numeric(5, 2), default=100)  # percentage (after downtime deduction)
    base_efficiency = db.Column(db.Numeric(5, 2), default=100)  # Base efficiency before limits
    oee_score = db.Column(db.Numeric(5, 2), default=100)  # percentage
    
    # Operator Information
    operator_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=True)
    supervisor_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=True)
    
    # Additional Information
    notes = db.Column(db.Text, nullable=True)
    issues = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='completed')  # planned, running, completed, cancelled
    
    # Audit Fields
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    machine = db.relationship('Machine', back_populates='shift_productions')
    product = db.relationship('Product')
    work_order = db.relationship('WorkOrder')
    operator = db.relationship('Employee', foreign_keys=[operator_id])
    supervisor = db.relationship('Employee', foreign_keys=[supervisor_id])
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    approved_by_user = db.relationship('User', foreign_keys=[approved_by])
    downtime_records = db.relationship('DowntimeRecord', back_populates='shift_production')
    
    def __repr__(self):
        return f'<ShiftProduction {self.production_date} {self.shift} - {self.machine.name}>'

class DowntimeRecord(db.Model):
    __tablename__ = 'downtime_records'
    
    id = db.Column(db.Integer, primary_key=True)
    shift_production_id = db.Column(db.Integer, db.ForeignKey('shift_productions.id'), nullable=False)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=False)
    downtime_date = db.Column(db.Date, nullable=False, index=True)
    
    # Downtime Details
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=True)
    duration_minutes = db.Column(db.Integer, nullable=True)
    
    # Downtime Classification
    downtime_type = db.Column(db.String(50), nullable=False)  # planned, unplanned
    downtime_category = db.Column(db.String(100), nullable=False)  # breakdown, maintenance, setup, material_shortage, quality_issue, operator_break
    downtime_reason = db.Column(db.String(200), nullable=False)
    root_cause = db.Column(db.Text, nullable=True)
    
    # Impact Assessment
    production_loss = db.Column(db.Numeric(15, 2), default=0)  # quantity lost
    cost_impact = db.Column(db.Numeric(15, 2), default=0)  # cost in IDR
    
    # Resolution
    action_taken = db.Column(db.Text, nullable=True)
    resolved_by = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=True)
    prevention_action = db.Column(db.Text, nullable=True)
    
    # Status
    status = db.Column(db.String(50), default='open')  # open, investigating, resolved, closed
    priority = db.Column(db.String(20), default='medium')  # low, medium, high, critical
    
    # Audit Fields
    reported_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    shift_production = db.relationship('ShiftProduction', back_populates='downtime_records')
    machine = db.relationship('Machine', back_populates='downtime_records')
    resolved_by_employee = db.relationship('Employee', foreign_keys=[resolved_by])
    reported_by_user = db.relationship('User', foreign_keys=[reported_by])
    
    def __repr__(self):
        return f'<DowntimeRecord {self.machine.name} - {self.downtime_category}>'


class ProductionApproval(db.Model):
    """Production Approval - Manager approval before forwarding to Finance"""
    __tablename__ = 'production_approvals'
    
    id = db.Column(db.Integer, primary_key=True)
    approval_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    
    # Reference to Work Order
    work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=False)
    wip_batch_id = db.Column(db.Integer, db.ForeignKey('wip_batches.id'), nullable=True)
    
    # Production Summary (editable by manager)
    quantity_produced = db.Column(db.Numeric(15, 2), nullable=False)
    quantity_good = db.Column(db.Numeric(15, 2), nullable=False)
    quantity_reject = db.Column(db.Numeric(15, 2), default=0)
    
    # Cost Summary (editable by manager)
    material_cost = db.Column(db.Numeric(15, 2), default=0)
    labor_cost = db.Column(db.Numeric(15, 2), default=0)
    overhead_cost = db.Column(db.Numeric(15, 2), default=0)
    total_cost = db.Column(db.Numeric(15, 2), default=0)
    cost_per_unit = db.Column(db.Numeric(15, 4), default=0)
    
    # OEE Summary
    oee_score = db.Column(db.Numeric(5, 2), default=0)
    efficiency_rate = db.Column(db.Numeric(5, 2), default=0)
    quality_rate = db.Column(db.Numeric(5, 2), default=0)
    
    # Downtime Summary
    total_downtime_minutes = db.Column(db.Integer, default=0)
    downtime_cost = db.Column(db.Numeric(15, 2), default=0)
    
    # Approval Status
    status = db.Column(db.String(30), default='pending')  # pending, approved, rejected, revision_requested
    
    # Manager Notes/Edits
    manager_notes = db.Column(db.Text, nullable=True)
    adjustment_reason = db.Column(db.Text, nullable=True)  # If manager made changes
    
    # Original values (before manager edit)
    original_quantity_good = db.Column(db.Numeric(15, 2), nullable=True)
    original_total_cost = db.Column(db.Numeric(15, 2), nullable=True)
    
    # Approval tracking
    submitted_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    
    # Finance forwarding
    forwarded_to_finance = db.Column(db.Boolean, default=False)
    forwarded_at = db.Column(db.DateTime, nullable=True)
    invoice_id = db.Column(db.Integer, nullable=True)  # Link to finance invoice
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    work_order = db.relationship('WorkOrder', backref='production_approvals')
    submitter = db.relationship('User', foreign_keys=[submitted_by], backref='submitted_approvals')
    reviewer = db.relationship('User', foreign_keys=[reviewed_by], backref='reviewed_approvals')
    
    def to_dict(self):
        return {
            'id': self.id,
            'approval_number': self.approval_number,
            'work_order_id': self.work_order_id,
            'wo_number': self.work_order.wo_number if self.work_order else None,
            'product_name': self.work_order.product.name if self.work_order and self.work_order.product else None,
            'wip_batch_id': self.wip_batch_id,
            'quantity_produced': float(self.quantity_produced),
            'quantity_good': float(self.quantity_good),
            'quantity_reject': float(self.quantity_reject or 0),
            'material_cost': float(self.material_cost or 0),
            'labor_cost': float(self.labor_cost or 0),
            'overhead_cost': float(self.overhead_cost or 0),
            'total_cost': float(self.total_cost or 0),
            'cost_per_unit': float(self.cost_per_unit or 0),
            'oee_score': float(self.oee_score or 0),
            'efficiency_rate': float(self.efficiency_rate or 0),
            'quality_rate': float(self.quality_rate or 0),
            'total_downtime_minutes': self.total_downtime_minutes,
            'downtime_cost': float(self.downtime_cost or 0),
            'status': self.status,
            'manager_notes': self.manager_notes,
            'adjustment_reason': self.adjustment_reason,
            'original_quantity_good': float(self.original_quantity_good) if self.original_quantity_good else None,
            'original_total_cost': float(self.original_total_cost) if self.original_total_cost else None,
            'submitted_by': self.submitted_by,
            'submitter_name': self.submitter.full_name if self.submitter else None,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'reviewed_by': self.reviewed_by,
            'reviewer_name': self.reviewer.full_name if self.reviewer else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'forwarded_to_finance': self.forwarded_to_finance,
            'forwarded_at': self.forwarded_at.isoformat() if self.forwarded_at else None,
            'invoice_id': self.invoice_id
        }


class WeeklyProductionPlan(db.Model):
    """Weekly Production Plan - Rencana produksi mingguan dari PPIC"""
    __tablename__ = 'weekly_production_plans'
    
    id = db.Column(db.Integer, primary_key=True)
    plan_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    
    # Periode minggu
    week_number = db.Column(db.Integer, nullable=False)  # 1-52
    year = db.Column(db.Integer, nullable=False)
    week_start = db.Column(db.Date, nullable=False)
    week_end = db.Column(db.Date, nullable=False)
    
    # Status
    status = db.Column(db.String(30), default='draft')  # draft, submitted, approved, in_progress, completed, cancelled
    
    # Approval
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    
    # Notes
    notes = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_weekly_plans')
    approver = db.relationship('User', foreign_keys=[approved_by], backref='approved_weekly_plans')
    items = db.relationship('WeeklyProductionPlanItem', backref='plan', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_items=True):
        result = {
            'id': self.id,
            'plan_number': self.plan_number,
            'week_number': self.week_number,
            'year': self.year,
            'week_start': self.week_start.isoformat() if self.week_start else None,
            'week_end': self.week_end.isoformat() if self.week_end else None,
            'status': self.status,
            'created_by': self.created_by,
            'creator_name': self.creator.full_name if self.creator else None,
            'approved_by': self.approved_by,
            'approver_name': self.approver.full_name if self.approver else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'total_items': self.items.count(),
            'total_quantity': sum(float(item.planned_quantity or 0) for item in self.items.all())
        }
        if include_items:
            result['items'] = [item.to_dict() for item in self.items.all()]
        return result


class WeeklyProductionPlanItem(db.Model):
    """Item dalam Weekly Production Plan"""
    __tablename__ = 'weekly_production_plan_items'
    
    id = db.Column(db.Integer, primary_key=True)
    plan_id = db.Column(db.Integer, db.ForeignKey('weekly_production_plans.id'), nullable=False)
    
    # Produk yang akan diproduksi
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    
    # Quantity
    planned_quantity = db.Column(db.Numeric(15, 2), nullable=False)
    uom = db.Column(db.String(20), default='pcs')
    
    # Priority
    priority = db.Column(db.Integer, default=1)  # 1=highest
    
    # Tanggal produksi yang direncanakan dalam minggu
    planned_date = db.Column(db.Date, nullable=True)
    
    # Machine yang direncanakan (optional)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=True)
    
    # Material check status
    material_status = db.Column(db.String(30), default='pending')  # pending, available, shortage
    shortage_items = db.Column(db.Text, nullable=True)  # JSON string of shortage materials
    
    # Work Order yang dibuat dari item ini
    work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=True)
    
    # Notes
    notes = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product', backref='weekly_plan_items')
    machine = db.relationship('Machine', backref='weekly_plan_items')
    work_order = db.relationship('WorkOrder', backref='weekly_plan_item')
    
    def to_dict(self):
        return {
            'id': self.id,
            'plan_id': self.plan_id,
            'product_id': self.product_id,
            'product_code': self.product.code if self.product else None,
            'product_name': self.product.name if self.product else None,
            'planned_quantity': float(self.planned_quantity or 0),
            'uom': self.uom,
            'priority': self.priority,
            'planned_date': self.planned_date.isoformat() if self.planned_date else None,
            'machine_id': self.machine_id,
            'machine_name': self.machine.name if self.machine else None,
            'material_status': self.material_status,
            'shortage_items': self.shortage_items,
            'work_order_id': self.work_order_id,
            'wo_number': self.work_order.wo_number if self.work_order else None,
            'notes': self.notes
        }


class ProductChangeover(db.Model):
    """Product Changeover - Ganti produk di tengah produksi"""
    __tablename__ = 'product_changeovers'
    
    id = db.Column(db.Integer, primary_key=True)
    changeover_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    
    # Work Order yang di-pause
    from_work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=False)
    # Work Order yang akan dijalankan (bisa null jika belum ditentukan)
    to_work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=True)
    
    # Machine yang melakukan changeover
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=False)
    
    # Alasan changeover
    reason = db.Column(db.String(50), nullable=False)  # material_shortage, target_exceeded, priority_change, quality_issue, customer_request, other
    reason_detail = db.Column(db.Text, nullable=True)
    
    # Status WO sebelumnya saat di-pause
    from_wo_status = db.Column(db.String(30), nullable=True)  # status sebelum pause
    from_wo_progress = db.Column(db.Numeric(15, 2), default=0)  # qty produced saat pause
    from_wo_target = db.Column(db.Numeric(15, 2), default=0)  # target qty
    
    # Waktu changeover
    changeover_start = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    changeover_end = db.Column(db.DateTime, nullable=True)
    setup_time_minutes = db.Column(db.Integer, default=0)  # waktu setup mesin untuk produk baru
    
    # Status changeover
    status = db.Column(db.String(30), default='in_progress')  # in_progress, completed, cancelled
    
    # Operator/User
    initiated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    completed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Notes
    notes = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    from_work_order = db.relationship('WorkOrder', foreign_keys=[from_work_order_id], backref='changeovers_from')
    to_work_order = db.relationship('WorkOrder', foreign_keys=[to_work_order_id], backref='changeovers_to')
    machine = db.relationship('Machine', backref='changeovers')
    initiator = db.relationship('User', foreign_keys=[initiated_by], backref='initiated_changeovers')
    completer = db.relationship('User', foreign_keys=[completed_by], backref='completed_changeovers')
    
    def to_dict(self):
        return {
            'id': self.id,
            'changeover_number': self.changeover_number,
            'from_work_order_id': self.from_work_order_id,
            'from_wo_number': self.from_work_order.wo_number if self.from_work_order else None,
            'from_product_name': self.from_work_order.product.name if self.from_work_order and self.from_work_order.product else None,
            'to_work_order_id': self.to_work_order_id,
            'to_wo_number': self.to_work_order.wo_number if self.to_work_order else None,
            'to_product_name': self.to_work_order.product.name if self.to_work_order and self.to_work_order.product else None,
            'machine_id': self.machine_id,
            'machine_name': self.machine.name if self.machine else None,
            'reason': self.reason,
            'reason_detail': self.reason_detail,
            'from_wo_status': self.from_wo_status,
            'from_wo_progress': float(self.from_wo_progress or 0),
            'from_wo_target': float(self.from_wo_target or 0),
            'progress_percentage': round((float(self.from_wo_progress or 0) / float(self.from_wo_target or 1)) * 100, 1),
            'changeover_start': self.changeover_start.isoformat() if self.changeover_start else None,
            'changeover_end': self.changeover_end.isoformat() if self.changeover_end else None,
            'setup_time_minutes': self.setup_time_minutes,
            'status': self.status,
            'initiated_by': self.initiated_by,
            'initiator_name': self.initiator.full_name if self.initiator else None,
            'completed_by': self.completed_by,
            'completer_name': self.completer.full_name if self.completer else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class RemainingStock(db.Model):
    """Sisa Order - Stok produk sisa produksi lama (input manual)"""
    __tablename__ = 'remaining_stocks'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Product reference (optional - bisa dari database atau input manual)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    
    # Manual input fields (jika tidak dari database product)
    product_name = db.Column(db.String(200), nullable=False)
    product_code = db.Column(db.String(100), nullable=True)
    
    # Quantity
    qty_karton = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    qty_pcs = db.Column(db.Numeric(15, 2), nullable=True)  # Optional: qty dalam pcs
    pack_per_carton = db.Column(db.Integer, nullable=True)  # Isi per karton
    
    # Additional info
    notes = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(100), nullable=True)  # Lokasi penyimpanan
    
    # Tracking
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    updated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product', backref='remaining_stocks')
    created_by_user = db.relationship('User', foreign_keys=[created_by])
    updated_by_user = db.relationship('User', foreign_keys=[updated_by])
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'product_code': self.product_code,
            'qty_karton': float(self.qty_karton) if self.qty_karton else 0,
            'qty_pcs': float(self.qty_pcs) if self.qty_pcs else None,
            'pack_per_carton': self.pack_per_carton,
            'notes': self.notes,
            'location': self.location,
            'created_by': self.created_by,
            'created_by_name': self.created_by_user.full_name if self.created_by_user else None,
            'updated_by': self.updated_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class PackingList(db.Model):
    """Packing List - Daftar karton yang diproduksi per Work Order"""
    __tablename__ = 'packing_lists'
    
    id = db.Column(db.Integer, primary_key=True)
    work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=False)
    
    # Product info (auto from work order)
    product_name = db.Column(db.String(200), nullable=False)
    
    # Total karton (auto-calculated from actual production)
    total_karton = db.Column(db.Integer, default=0)
    
    # Last carton number used (for tracking, resets at 10000)
    last_carton_number = db.Column(db.Integer, default=0)
    
    # Start carton number (user input)
    start_carton_number = db.Column(db.Integer, default=1)
    
    # Current batch mixing
    current_batch_mixing = db.Column(db.String(100), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    work_order = db.relationship('WorkOrder', backref='packing_list')
    items = db.relationship('PackingListItem', backref='packing_list', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_items=False):
        result = {
            'id': self.id,
            'work_order_id': self.work_order_id,
            'product_name': self.product_name,
            'total_karton': self.total_karton,
            'last_carton_number': self.last_carton_number,
            'start_carton_number': self.start_carton_number,
            'current_batch_mixing': self.current_batch_mixing,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'items_count': self.items.count()
        }
        if include_items:
            result['items'] = [item.to_dict() for item in self.items.order_by(PackingListItem.carton_number).all()]
        return result


class PackingListItem(db.Model):
    """Item dalam Packing List - Detail per karton"""
    __tablename__ = 'packing_list_items'
    
    id = db.Column(db.Integer, primary_key=True)
    packing_list_id = db.Column(db.Integer, db.ForeignKey('packing_lists.id'), nullable=False)
    
    # Nomor karton (1-10000, reset ke 1 setelah 10000)
    carton_number = db.Column(db.Integer, nullable=False)
    
    # Berat karton dalam kg
    weight_kg = db.Column(db.Numeric(10, 3), nullable=True)
    
    # Batch mixing
    batch_mixing = db.Column(db.String(100), nullable=True)
    
    # Flag untuk menandai awal batch mixing baru
    is_batch_start = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'packing_list_id': self.packing_list_id,
            'carton_number': self.carton_number,
            'weight_kg': float(self.weight_kg) if self.weight_kg else None,
            'batch_mixing': self.batch_mixing,
            'is_batch_start': self.is_batch_start,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
