"""
Production Event Listeners
Auto-trigger WIP accounting when production status changes
"""
from sqlalchemy import event
from datetime import datetime

def register_production_events(app):
    """Register all production-related event listeners"""
    
    from models.production import WorkOrder
    from models.wip_accounting import WIPLedger
    from models.wip_job_costing import WIPBatch, WIPWorkflowIntegration
    from models import db
    
    @event.listens_for(WorkOrder, 'after_update')
    def work_order_status_changed(mapper, connection, target):
        """
        Auto-create WIP Ledger when Work Order status changes to 'in_progress'
        Note: WIP Batch creation is handled in production record endpoint to avoid database locking
        """
        # Only trigger if status changed to 'in_progress'
        if target.status == 'in_progress' and False:  # Disabled to prevent database locking
            # Check if WIP Ledger already exists
            existing_wip = connection.execute(
                db.select(WIPLedger).where(WIPLedger.work_order_id == target.id)
            ).first()
            
            if not existing_wip:
                # Create WIP Ledger
                with app.app_context():
                    import time
                    max_retries = 3
                    retry_count = 0
                    
                    while retry_count < max_retries:
                        try:
                            from utils.costing_helper import calculate_standard_costs_from_bom
                            from models.product import Product
                            from sqlalchemy.orm import Session
                            
                            # Create new session to avoid locking issues
                            new_session = Session(bind=db.engine)
                            
                            # Get product
                            product = new_session.get(Product, target.product_id)
                            
                            # Calculate standard costs from BOM
                            standard_material, standard_labor, standard_overhead = calculate_standard_costs_from_bom(
                                product_id=target.product_id,
                                quantity=target.quantity
                            )
                            
                            # Create WIP Ledger
                            wip_ledger = WIPLedger(
                                work_order_id=target.id,
                                work_order_number=target.order_number,
                                product_id=target.product_id,
                                product_name=product.name if product else None,
                                planned_quantity=target.quantity,
                                standard_material_cost=standard_material,
                                standard_labor_cost=standard_labor,
                                standard_overhead_cost=standard_overhead,
                                total_standard_cost=standard_material + standard_labor + standard_overhead,
                                status='active',
                                start_date=datetime.utcnow()
                            )
                            
                            new_session.add(wip_ledger)
                            new_session.commit()
                            new_session.close()
                            
                            print(f"✓ Auto-created WIP Ledger for Work Order {target.wo_number}")
                            break
                            
                        except Exception as e:
                            retry_count += 1
                            if new_session:
                                new_session.rollback()
                                new_session.close()
                            
                            if retry_count >= max_retries:
                                print(f"✗ Failed to auto-create WIP Ledger after {max_retries} retries: {str(e)}")
                            else:
                                time.sleep(0.1 * retry_count)  # Exponential backoff
            
            # Also create WIP Batch for job costing
            existing_batch = connection.execute(
                db.select(WIPBatch).where(WIPBatch.work_order_id == target.id)
            ).first()
            
            if not existing_batch:
                with app.app_context():
                    import time
                    max_retries = 3
                    retry_count = 0
                    
                    while retry_count < max_retries:
                        try:
                            # Create new session to avoid locking issues
                            from sqlalchemy.orm import Session
                            new_session = Session(bind=db.engine)
                            
                            wip_batch = WIPBatch(
                                wip_batch_no=f"WIP-{target.wo_number}",
                                work_order_id=target.id,
                                product_id=target.product_id,
                                current_stage='started',
                                qty_started=float(target.quantity or 0),
                                qty_in_process=float(target.quantity or 0),
                                status='in_progress',
                                created_by=1  # System user
                            )
                            new_session.add(wip_batch)
                            new_session.commit()
                            new_session.close()
                            
                            print(f"✓ Auto-created WIP Batch for Work Order {target.wo_number}")
                            break
                            
                        except Exception as e:
                            retry_count += 1
                            if new_session:
                                new_session.rollback()
                                new_session.close()
                            
                            if retry_count >= max_retries:
                                print(f"✗ Failed to auto-create WIP Batch after {max_retries} retries: {str(e)}")
                            else:
                                time.sleep(0.1 * retry_count)  # Exponential backoff
    
    @event.listens_for(WorkOrder, 'after_update')
    def work_order_completed(mapper, connection, target):
        """
        Auto-close WIP Ledger when Work Order is completed
        """
        if target.status == 'completed':
            # Update WIP Ledger status
            with app.app_context():
                try:
                    wip_ledger = db.session.query(WIPLedger).filter_by(
                        work_order_id=target.id
                    ).first()
                    
                    if wip_ledger and wip_ledger.status == 'active':
                        wip_ledger.status = 'completed'
                        wip_ledger.end_date = datetime.utcnow()
                        wip_ledger.actual_quantity = target.quantity_produced or target.quantity
                        
                        db.session.commit()
                        
                        print(f"✓ Auto-closed WIP Ledger for Work Order {target.order_number}")
                        
                except Exception as e:
                    print(f"✗ Failed to auto-close WIP Ledger: {str(e)}")
                    db.session.rollback()
    
    print("✓ Production event listeners registered")


def create_wip_ledger_from_work_order(work_order_id):
    """
    Manually create WIP Ledger from Work Order
    Can be called from API or other functions
    """
    from models.production import WorkOrder
    from models.wip_accounting import WIPLedger
    from models.product import Product
    from utils.costing_helper import calculate_standard_costs_from_bom
    from models import db
    
    work_order = WorkOrder.query.get(work_order_id)
    if not work_order:
        raise ValueError(f"Work Order {work_order_id} not found")
    
    # Check if WIP Ledger already exists
    existing = WIPLedger.query.filter_by(work_order_id=work_order_id).first()
    if existing:
        return existing
    
    # Get product
    product = Product.query.get(work_order.product_id)
    
    # Calculate standard costs from BOM
    standard_material, standard_labor, standard_overhead = calculate_standard_costs_from_bom(
        product_id=work_order.product_id,
        quantity=work_order.quantity
    )
    
    # Create WIP Ledger
    wip_ledger = WIPLedger(
        work_order_id=work_order.id,
        work_order_number=work_order.order_number,
        product_id=work_order.product_id,
        product_name=product.name if product else None,
        planned_quantity=work_order.quantity,
        standard_material_cost=standard_material,
        standard_labor_cost=standard_labor,
        standard_overhead_cost=standard_overhead,
        total_standard_cost=standard_material + standard_labor + standard_overhead,
        status='active',
        start_date=datetime.utcnow()
    )
    
    db.session.add(wip_ledger)
    db.session.commit()
    
    return wip_ledger


def close_wip_ledger_from_work_order(work_order_id):
    """
    Manually close WIP Ledger when Work Order is completed
    Can be called from API or other functions
    """
    from models.production import WorkOrder
    from models.wip_accounting import WIPLedger
    from models import db
    
    work_order = WorkOrder.query.get(work_order_id)
    if not work_order:
        raise ValueError(f"Work Order {work_order_id} not found")
    
    wip_ledger = WIPLedger.query.filter_by(work_order_id=work_order_id).first()
    if not wip_ledger:
        raise ValueError(f"WIP Ledger not found for Work Order {work_order_id}")
    
    if wip_ledger.status != 'active':
        return wip_ledger  # Already closed
    
    wip_ledger.status = 'completed'
    wip_ledger.end_date = datetime.utcnow()
    wip_ledger.actual_quantity = work_order.quantity_produced or work_order.quantity
    
    db.session.commit()
    
    return wip_ledger
