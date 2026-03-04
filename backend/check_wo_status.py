"""
Check Work Order status and BOM items
"""
from app import create_app
from models import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("=" * 60)
    print("WORK ORDER STATUS CHECK")
    print("=" * 60)
    
    # Get WO info
    result = db.session.execute(text("""
        SELECT id, wo_number, bom_id, status, quantity 
        FROM work_orders 
        WHERE wo_number = 'WO-202512-00001'
    """))
    wo = result.fetchone()
    
    if wo:
        print(f"\nWork Order: {wo[1]}")
        print(f"ID: {wo[0]}")
        print(f"BOM ID: {wo[2]}")
        print(f"Status: {wo[3]}")
        print(f"Quantity: {wo[4]}")
        
        # Check BOM items
        result = db.session.execute(text("""
            SELECT COUNT(*) FROM work_order_bom_items WHERE work_order_id = :wo_id
        """), {'wo_id': wo[0]})
        bom_item_count = result.scalar()
        
        print(f"BOM Items: {bom_item_count}")
        
        if bom_item_count > 0:
            print("\n" + "=" * 60)
            print("READY TO TEST!")
            print("=" * 60)
            print(f"\n1. Start backend server:")
            print(f"   cd backend")
            print(f"   python run.py")
            print(f"\n2. Test Material Availability API:")
            print(f"   GET http://localhost:5000/api/production/work-orders/{wo[0]}/material-availability")
            print(f"\n3. Or test via browser/Postman")
            print("=" * 60)
        else:
            print("\n[WARNING] No BOM items found!")
            print("Need to attach BOM items to this WO first")
    else:
        print("\n[ERROR] Work Order not found!")
