"""
Test the update_work_order_status function directly
"""
from app import create_app
from models import db
from models.production import WorkOrder
from datetime import datetime

app = create_app()

with app.app_context():
    print("=" * 60)
    print("TEST UPDATE_WORK_ORDER_STATUS FUNCTION")
    print("=" * 60)
    
    # Import the function
    from routes.production_integration import auto_receive_finished_goods
    
    wo_id = 2  # WO with production data
    
    wo = WorkOrder.query.get(wo_id)
    if not wo:
        print(f"[ERROR] WO {wo_id} not found")
        exit(1)
    
    print(f"\nWork Order: {wo.wo_number}")
    print(f"Status: {wo.status}")
    print(f"Product ID: {wo.product_id}")
    print(f"Quantity Produced: {wo.quantity_produced}")
    print(f"Quantity Good: {wo.quantity_good}")
    print(f"Actual End Date: {wo.actual_end_date}")
    
    # Simulate what the API does
    print("\n" + "=" * 60)
    print("SIMULATING API LOGIC")
    print("=" * 60)
    
    new_status = 'completed'
    auto_deduct = True
    
    old_status = wo.status
    integration_results = {}
    
    # Update status
    wo.status = new_status
    
    # The condition that might be failing
    print(f"\nCondition check: new_status == 'completed' and not wo.actual_end_date")
    print(f"  new_status == 'completed': {new_status == 'completed'}")
    print(f"  wo.actual_end_date: {wo.actual_end_date}")
    print(f"  not wo.actual_end_date: {not wo.actual_end_date}")
    print(f"  Combined: {new_status == 'completed' and not wo.actual_end_date}")
    
    if new_status == 'completed' and not wo.actual_end_date:
        wo.actual_end_date = datetime.utcnow()
        if wo.machine:
            wo.machine.status = 'idle'
        
        # AUTO-RECEIVE FINISHED GOODS
        if auto_deduct and wo.quantity_produced > 0:
            user_id = 1
            qty_good = float(wo.quantity_good) if wo.quantity_good else float(wo.quantity_produced)
            print(f"\nCalling auto_receive_finished_goods with qty: {qty_good}")
            
            try:
                success, message, inventory_id = auto_receive_finished_goods(wo_id, qty_good, user_id)
                integration_results['finished_goods_receipt'] = {
                    'success': success,
                    'message': message,
                    'inventory_id': inventory_id,
                    'quantity_received': qty_good
                }
                print(f"Result: success={success}, message={message}")
            except Exception as e:
                import traceback
                print(f"[ERROR] auto_receive_finished_goods failed:")
                traceback.print_exc()
                db.session.rollback()
                exit(1)
    else:
        print("\n[INFO] Skipped auto-receive (condition not met)")
    
    try:
        db.session.commit()
        print(f"\n[SUCCESS] Committed! Status: {wo.status}")
    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"\n[ERROR] Commit failed:")
        traceback.print_exc()
        exit(1)
    
    # Verify
    wo_check = db.session.get(WorkOrder, wo_id)
    print(f"\nVerified status: {wo_check.status}")
    print(f"Verified actual_end_date: {wo_check.actual_end_date}")
