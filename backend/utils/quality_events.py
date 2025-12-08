"""
Quality Event Listeners
Auto-update production status based on quality inspection results
"""
from sqlalchemy import event
from datetime import datetime

def register_quality_events(app):
    """Register all quality-related event listeners"""
    
    from models.quality import QualityInspection
    from models.production import WorkOrder
    from models import db
    
    @event.listens_for(QualityInspection, 'after_update')
    def quality_inspection_completed(mapper, connection, target):
        """
        Auto-update production status when quality inspection is completed
        """
        if target.status == 'completed' and target.result:
            with app.app_context():
                try:
                    # Get related work order
                    work_order = None
                    if target.work_order_id:
                        work_order = db.session.query(WorkOrder).get(target.work_order_id)
                    
                    if work_order:
                        # Update work order based on quality result
                        if target.result == 'pass':
                            # Quality passed - mark as quality approved
                            work_order.quality_status = 'passed'
                            if work_order.status == 'completed':
                                work_order.status = 'quality_approved'
                            
                            print(f"✓ Quality PASSED for Work Order {work_order.order_number}")
                            
                        elif target.result == 'fail':
                            # Quality failed - mark for rework or rejection
                            work_order.quality_status = 'failed'
                            
                            # Check if rework is possible
                            if target.action_taken and 'rework' in target.action_taken.lower():
                                work_order.status = 'rework'
                                print(f"⚠ Quality FAILED - Work Order {work_order.order_number} sent to REWORK")
                            else:
                                work_order.status = 'rejected'
                                print(f"✗ Quality FAILED - Work Order {work_order.order_number} REJECTED")
                        
                        elif target.result == 'conditional':
                            # Conditional pass - may need minor fixes
                            work_order.quality_status = 'conditional'
                            print(f"⚠ Quality CONDITIONAL for Work Order {work_order.order_number}")
                        
                        db.session.commit()
                        
                except Exception as e:
                    print(f"✗ Failed to update production status from quality: {str(e)}")
                    db.session.rollback()
    
    @event.listens_for(QualityInspection, 'after_insert')
    def quality_inspection_created(mapper, connection, target):
        """
        Auto-update production status when quality inspection is created
        """
        if target.work_order_id:
            with app.app_context():
                try:
                    work_order = db.session.query(WorkOrder).get(target.work_order_id)
                    
                    if work_order and work_order.status == 'completed':
                        # Mark as under quality inspection
                        work_order.status = 'quality_inspection'
                        work_order.quality_status = 'pending'
                        
                        db.session.commit()
                        
                        print(f"✓ Work Order {work_order.order_number} marked for quality inspection")
                        
                except Exception as e:
                    print(f"✗ Failed to update production status: {str(e)}")
                    db.session.rollback()
    
    print("✓ Quality event listeners registered")


def update_production_from_quality(quality_inspection_id):
    """
    Manually update production status from quality inspection
    Can be called from API or other functions
    """
    from models.quality import QualityInspection
    from models.production import WorkOrder
    from models import db
    
    inspection = QualityInspection.query.get(quality_inspection_id)
    if not inspection:
        raise ValueError(f"Quality Inspection {quality_inspection_id} not found")
    
    if not inspection.work_order_id:
        raise ValueError("Quality Inspection not linked to Work Order")
    
    work_order = WorkOrder.query.get(inspection.work_order_id)
    if not work_order:
        raise ValueError(f"Work Order {inspection.work_order_id} not found")
    
    # Update based on quality result
    if inspection.result == 'pass':
        work_order.quality_status = 'passed'
        if work_order.status == 'completed':
            work_order.status = 'quality_approved'
    elif inspection.result == 'fail':
        work_order.quality_status = 'failed'
        if inspection.action_taken and 'rework' in inspection.action_taken.lower():
            work_order.status = 'rework'
        else:
            work_order.status = 'rejected'
    elif inspection.result == 'conditional':
        work_order.quality_status = 'conditional'
    
    db.session.commit()
    
    return work_order


def trigger_rework_workflow(work_order_id):
    """
    Trigger rework workflow for failed quality inspection
    """
    from models.production import WorkOrder
    from models.quality import QualityInspection
    from models import db
    
    work_order = WorkOrder.query.get(work_order_id)
    if not work_order:
        raise ValueError(f"Work Order {work_order_id} not found")
    
    # Reset work order for rework
    work_order.status = 'rework'
    work_order.quality_status = 'pending_rework'
    
    # Create rework inspection record
    rework_inspection = QualityInspection(
        work_order_id=work_order_id,
        inspection_type='rework',
        status='pending',
        notes=f"Rework inspection for WO {work_order.order_number}"
    )
    
    db.session.add(rework_inspection)
    db.session.commit()
    
    return work_order, rework_inspection
