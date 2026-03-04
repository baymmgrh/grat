"""
Test completing a Work Order directly
"""
from app import create_app
from models import db
from models.production import WorkOrder
from routes.production_integration import auto_receive_finished_goods
from datetime import datetime

app = create_app()

with app.app_context():
    print("=" * 60)
    print("TEST COMPLETE WORK ORDER")
    print("=" * 60)
    
    # Get latest WO
    wo = WorkOrder.query.filter_by(status='in_progress').first()
    if not wo:
        print("[ERROR] No in_progress work order found!")
        exit(1)
    
    print(f"\nWork Order: {wo.wo_number}")
    print(f"ID: {wo.id}")
    print(f"Status: {wo.status}")
    print(f"Product ID: {wo.product_id}")
    print(f"Quantity Produced: {wo.quantity_produced}")
    print(f"Quantity Good: {wo.quantity_good}")
    
    # Test auto_receive_finished_goods
    print("\n" + "=" * 60)
    print("TESTING AUTO-RECEIVE FINISHED GOODS")
    print("=" * 60)
    
    qty_good = float(wo.quantity_good) if wo.quantity_good else float(wo.quantity_produced or 0)
    print(f"Quantity to receive: {qty_good}")
    
    if qty_good > 0:
        try:
            success, message, inventory_id = auto_receive_finished_goods(wo.id, qty_good, user_id=1)
            print(f"\nResult: {'SUCCESS' if success else 'FAILED'}")
            print(f"Message: {message}")
            print(f"Inventory ID: {inventory_id}")
        except Exception as e:
            import traceback
            print(f"\n[ERROR] Exception occurred:")
            traceback.print_exc()
    else:
        print("\n[WARNING] No quantity to receive!")
    
    # Now try to complete the WO directly
    print("\n" + "=" * 60)
    print("TESTING STATUS UPDATE TO COMPLETED")
    print("=" * 60)
    
    try:
        old_status = wo.status
        wo.status = 'completed'
        wo.actual_end_date = datetime.utcnow()
        
        if wo.machine:
            wo.machine.status = 'idle'
        
        db.session.commit()
        print(f"\n[SUCCESS] Status changed from '{old_status}' to '{wo.status}'")
        
        # Verify
        wo_check = WorkOrder.query.get(wo.id)
        print(f"Verified status: {wo_check.status}")
        
    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"\n[ERROR] Failed to update status:")
        traceback.print_exc()
