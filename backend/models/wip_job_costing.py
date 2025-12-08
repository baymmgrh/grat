from models import db
from datetime import datetime
from sqlalchemy import func

class WIPBatch(db.Model):
    """Work in Progress Batch - Tracks production batches through workflow stages"""
    __tablename__ = 'wip_batches'
    
    id = db.Column(db.Integer, primary_key=True)
    wip_batch_no = db.Column(db.String(50), unique=True, nullable=False)
    work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    
    # Production Stage Tracking
    current_stage = db.Column(db.String(50), nullable=False)  # cutting, filling, sealing, packing
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=True)
    line_name = db.Column(db.String(100), nullable=True)
    
    # Quantity Tracking
    qty_started = db.Column(db.Float, nullable=False, default=0)
    qty_completed = db.Column(db.Float, nullable=False, default=0)
    qty_rejected = db.Column(db.Float, nullable=False, default=0)
    qty_in_process = db.Column(db.Float, nullable=False, default=0)
    
    # Time Tracking
    started_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    duration_minutes = db.Column(db.Integer, nullable=True)
    
    # Cost Tracking (Partial Costs)
    material_cost = db.Column(db.Float, nullable=False, default=0)
    labor_cost = db.Column(db.Float, nullable=False, default=0)
    overhead_cost = db.Column(db.Float, nullable=False, default=0)
    total_wip_value = db.Column(db.Float, nullable=False, default=0)
    
    # Status & Control
    status = db.Column(db.String(20), nullable=False, default='open')  # open, in_progress, completed, closed
    operator_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=True)
    shift = db.Column(db.String(20), nullable=True)  # shift_1, shift_2, shift_3
    
    # Audit Trail
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    work_order = db.relationship('WorkOrder', backref='wip_batches')
    product = db.relationship('Product', backref='wip_batches')
    machine = db.relationship('Machine', backref='wip_batches')
    operator = db.relationship('Employee', backref='wip_batches')
    creator = db.relationship('User', backref='wip_batches')
    
    # WIP Stage Movements
    stage_movements = db.relationship('WIPStageMovement', backref='wip_batch', cascade='all, delete-orphan')
    job_cost_entries = db.relationship('JobCostEntry', backref='wip_batch', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<WIPBatch {self.wip_batch_no}>'
    
    @property
    def completion_percentage(self):
        """Calculate completion percentage"""
        if self.qty_started == 0:
            return 0
        return (self.qty_completed / self.qty_started) * 100
    
    @property
    def rejection_rate(self):
        """Calculate rejection rate"""
        total_processed = self.qty_completed + self.qty_rejected
        if total_processed == 0:
            return 0
        return (self.qty_rejected / total_processed) * 100
    
    def update_wip_value(self):
        """Update total WIP value from cost components"""
        self.total_wip_value = self.material_cost + self.labor_cost + self.overhead_cost
        return self.total_wip_value

class WIPStageMovement(db.Model):
    """Track WIP movement between production stages"""
    __tablename__ = 'wip_stage_movements'
    
    id = db.Column(db.Integer, primary_key=True)
    wip_batch_id = db.Column(db.Integer, db.ForeignKey('wip_batches.id'), nullable=False)
    
    # Stage Information
    from_stage = db.Column(db.String(50), nullable=True)  # null for initial stage
    to_stage = db.Column(db.String(50), nullable=False)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=True)
    
    # Movement Details
    qty_moved = db.Column(db.Float, nullable=False)
    movement_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    operator_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=True)
    shift = db.Column(db.String(20), nullable=True)
    
    # Process Results
    processing_time_minutes = db.Column(db.Integer, nullable=True)
    qty_good = db.Column(db.Float, nullable=False, default=0)
    qty_rejected = db.Column(db.Float, nullable=False, default=0)
    rejection_reason = db.Column(db.Text, nullable=True)
    
    # Cost Impact
    stage_cost = db.Column(db.Float, nullable=False, default=0)
    notes = db.Column(db.Text, nullable=True)
    
    # Audit
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    machine = db.relationship('Machine', backref='wip_movements')
    operator = db.relationship('Employee', backref='wip_movements')
    creator = db.relationship('User', backref='wip_movements')
    
    def __repr__(self):
        return f'<WIPStageMovement {self.from_stage} -> {self.to_stage}>'

class JobCostEntry(db.Model):
    """Job Costing entries for tracking costs per WIP batch"""
    __tablename__ = 'job_cost_entries'
    
    id = db.Column(db.Integer, primary_key=True)
    job_cost_no = db.Column(db.String(50), unique=True, nullable=False)
    
    # Reference Links
    wip_batch_id = db.Column(db.Integer, db.ForeignKey('wip_batches.id'), nullable=False)
    work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=False)
    
    # Cost Categories
    cost_type = db.Column(db.String(20), nullable=False)  # material, labor, overhead
    cost_category = db.Column(db.String(50), nullable=False)  # raw_material, direct_labor, machine_overhead, etc.
    
    # Cost Details
    description = db.Column(db.String(200), nullable=False)
    quantity = db.Column(db.Float, nullable=False, default=1)
    unit_cost = db.Column(db.Float, nullable=False, default=0)
    total_cost = db.Column(db.Float, nullable=False, default=0)
    
    # Allocation
    allocation_basis = db.Column(db.String(50), nullable=True)  # per_unit, per_hour, per_batch
    allocation_rate = db.Column(db.Float, nullable=True)
    
    # Time & Stage
    cost_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    production_stage = db.Column(db.String(50), nullable=True)
    shift = db.Column(db.String(20), nullable=True)
    
    # References
    # material_issue_id = db.Column(db.Integer, db.ForeignKey('material_issues.id'), nullable=True)  # TODO: Add when MaterialIssue model exists
    timesheet_id = db.Column(db.Integer, nullable=True)  # Link to timesheet if available
    
    # Status
    status = db.Column(db.String(20), nullable=False, default='active')  # active, reversed, adjusted
    
    # Audit Trail
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    work_order = db.relationship('WorkOrder', backref='job_cost_entries')
    # material_issue = db.relationship('MaterialIssue', backref='job_cost_entries')  # TODO: Add when MaterialIssue model exists
    creator = db.relationship('User', backref='job_cost_entries')
    
    def __repr__(self):
        return f'<JobCostEntry {self.job_cost_no}>'
    
    def calculate_total_cost(self):
        """Calculate total cost from quantity and unit cost"""
        self.total_cost = self.quantity * self.unit_cost
        return self.total_cost

class WIPSummary(db.Model):
    """Daily WIP Summary for reporting and dashboard"""
    __tablename__ = 'wip_summaries'
    
    id = db.Column(db.Integer, primary_key=True)
    summary_date = db.Column(db.Date, nullable=False)
    
    # Production Line/Machine
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=True)
    line_name = db.Column(db.String(100), nullable=True)
    shift = db.Column(db.String(20), nullable=True)
    
    # WIP Quantities
    opening_wip_qty = db.Column(db.Float, nullable=False, default=0)
    input_qty = db.Column(db.Float, nullable=False, default=0)
    output_qty = db.Column(db.Float, nullable=False, default=0)
    closing_wip_qty = db.Column(db.Float, nullable=False, default=0)
    
    # WIP Values (Rupiah)
    opening_wip_value = db.Column(db.Float, nullable=False, default=0)
    input_value = db.Column(db.Float, nullable=False, default=0)
    output_value = db.Column(db.Float, nullable=False, default=0)
    closing_wip_value = db.Column(db.Float, nullable=False, default=0)
    
    # Cost Breakdown
    material_cost = db.Column(db.Float, nullable=False, default=0)
    labor_cost = db.Column(db.Float, nullable=False, default=0)
    overhead_cost = db.Column(db.Float, nullable=False, default=0)
    
    # Performance Metrics
    avg_processing_time = db.Column(db.Float, nullable=True)  # minutes
    rejection_rate = db.Column(db.Float, nullable=False, default=0)  # percentage
    efficiency_rate = db.Column(db.Float, nullable=False, default=0)  # percentage
    
    # Audit
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    machine = db.relationship('Machine', backref='wip_summaries')
    creator = db.relationship('User', backref='wip_summaries')
    
    def __repr__(self):
        return f'<WIPSummary {self.summary_date} - {self.line_name}>'

# WIP Workflow Integration Functions
class WIPWorkflowIntegration:
    """Integration functions for WIP with production workflow"""
    
    @staticmethod
    def create_wip_batch_from_work_order(work_order_id, user_id):
        """Create initial WIP batch when work order starts"""
        from .production import WorkOrder
        
        work_order = WorkOrder.query.get(work_order_id)
        if not work_order:
            return None
            
        wip_batch = WIPBatch(
            wip_batch_no=f"WIP-{work_order.wo_number}",
            work_order_id=work_order_id,
            product_id=work_order.product_id,
            current_stage='ready_to_start',
            qty_started=work_order.quantity_to_produce,
            qty_in_process=work_order.quantity_to_produce,
            status='open',
            created_by=user_id
        )
        
        db.session.add(wip_batch)
        db.session.flush()
        
        # Create initial job cost entry for material issue
        WIPWorkflowIntegration.create_material_cost_entry(wip_batch.id, work_order_id, user_id)
        
        return wip_batch
    
    @staticmethod
    def move_wip_to_stage(wip_batch_id, to_stage, qty_moved, machine_id=None, operator_id=None, user_id=None):
        """Move WIP batch to next production stage"""
        wip_batch = WIPBatch.query.get(wip_batch_id)
        if not wip_batch:
            return None
            
        # Create stage movement record
        movement = WIPStageMovement(
            wip_batch_id=wip_batch_id,
            from_stage=wip_batch.current_stage,
            to_stage=to_stage,
            qty_moved=qty_moved,
            machine_id=machine_id,
            operator_id=operator_id,
            created_by=user_id
        )
        
        # Update WIP batch current stage
        wip_batch.current_stage = to_stage
        wip_batch.machine_id = machine_id
        
        db.session.add(movement)
        db.session.flush()
        
        return movement
    
    @staticmethod
    def complete_wip_stage(wip_batch_id, qty_good, qty_rejected, processing_time, stage_cost, user_id):
        """Complete current WIP stage with results"""
        wip_batch = WIPBatch.query.get(wip_batch_id)
        if not wip_batch:
            return None
            
        # Update quantities
        wip_batch.qty_completed += qty_good
        wip_batch.qty_rejected += qty_rejected
        wip_batch.qty_in_process = wip_batch.qty_started - wip_batch.qty_completed - wip_batch.qty_rejected
        
        # Add stage cost to appropriate category
        if wip_batch.current_stage in ['cutting', 'filling', 'sealing']:
            wip_batch.labor_cost += stage_cost
        else:
            wip_batch.overhead_cost += stage_cost
            
        wip_batch.update_wip_value()
        
        # Create job cost entry for this stage
        job_cost = JobCostEntry(
            job_cost_no=f"JC-{wip_batch.wip_batch_no}-{wip_batch.current_stage}",
            wip_batch_id=wip_batch_id,
            work_order_id=wip_batch.work_order_id,
            cost_type='labor' if wip_batch.current_stage in ['cutting', 'filling', 'sealing'] else 'overhead',
            cost_category=f"{wip_batch.current_stage}_cost",
            description=f"Stage cost for {wip_batch.current_stage}",
            quantity=qty_good,
            unit_cost=stage_cost / qty_good if qty_good > 0 else 0,
            total_cost=stage_cost,
            production_stage=wip_batch.current_stage,
            created_by=user_id
        )
        
        db.session.add(job_cost)
        
        # Check if WIP is complete
        if wip_batch.qty_in_process <= 0:
            wip_batch.status = 'completed'
            wip_batch.completed_at = datetime.utcnow()
            
        return wip_batch
    
    @staticmethod
    def create_material_cost_entry(wip_batch_id, work_order_id, user_id):
        """Create material cost entry when materials are issued"""
        wip_batch = WIPBatch.query.get(wip_batch_id)
        if not wip_batch:
            return None
            
        # Calculate material cost from BOM
        from .production import WorkOrder
        work_order = WorkOrder.query.get(work_order_id)
        
        # Simplified material cost calculation
        # In real implementation, this would calculate from BOM and material issues
        estimated_material_cost = work_order.quantity_to_produce * 50000  # IDR 50k per unit
        
        wip_batch.material_cost = estimated_material_cost
        wip_batch.update_wip_value()
        
        # Create job cost entry
        job_cost = JobCostEntry(
            job_cost_no=f"JC-{wip_batch.wip_batch_no}-MAT",
            wip_batch_id=wip_batch_id,
            work_order_id=work_order_id,
            cost_type='material',
            cost_category='raw_material',
            description='Material cost for production',
            quantity=work_order.quantity_to_produce,
            unit_cost=50000,  # IDR 50k per unit
            total_cost=estimated_material_cost,
            created_by=user_id
        )
        
        db.session.add(job_cost)
        return job_cost
    
    @staticmethod
    def get_wip_dashboard_data(date_from=None, date_to=None):
        """Get WIP dashboard data for monitoring"""
        query = db.session.query(WIPBatch)
        
        if date_from:
            query = query.filter(WIPBatch.created_at >= date_from)
        if date_to:
            query = query.filter(WIPBatch.created_at <= date_to)
            
        wip_batches = query.all()
        
        # Calculate summary metrics
        total_wip_value = sum(batch.total_wip_value for batch in wip_batches if batch.status != 'completed')
        total_batches = len(wip_batches)
        active_batches = len([b for b in wip_batches if b.status in ['open', 'in_progress']])
        completed_batches = len([b for b in wip_batches if b.status == 'completed'])
        
        # Stage distribution
        stage_distribution = {}
        for batch in wip_batches:
            if batch.status != 'completed':
                stage = batch.current_stage
                if stage not in stage_distribution:
                    stage_distribution[stage] = {'count': 0, 'value': 0}
                stage_distribution[stage]['count'] += 1
                stage_distribution[stage]['value'] += batch.total_wip_value
        
        return {
            'total_wip_value': total_wip_value,
            'total_batches': total_batches,
            'active_batches': active_batches,
            'completed_batches': completed_batches,
            'stage_distribution': stage_distribution,
            'wip_batches': wip_batches
        }
