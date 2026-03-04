"""
Populate stock for materials needed by WO-202512-00001
"""
from app import create_app
from models import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("=" * 60)
    print("POPULATE STOCK FOR WO MATERIALS")
    print("=" * 60)
    
    wo_id = 1
    
    # Get materials needed by this WO
    result = db.session.execute(text("""
        SELECT DISTINCT wobi.material_id, wobi.item_name, wobi.quantity_planned
        FROM work_order_bom_items wobi
        WHERE wobi.work_order_id = :wo_id
          AND wobi.material_id IS NOT NULL
    """), {'wo_id': wo_id})
    
    materials = result.fetchall()
    print(f"\nFound {len(materials)} materials needed")
    
    # Get warehouse location
    result = db.session.execute(text("SELECT id FROM warehouse_locations LIMIT 1"))
    location_id = result.scalar()
    
    if not location_id:
        print("[ERROR] No warehouse location found!")
        exit(1)
    
    print(f"Using location ID: {location_id}")
    print("\nUpdating inventory...")
    
    for mat in materials:
        mat_id = mat[0]
        mat_name = mat[1]
        required = float(mat[2])
        
        # Give 2x the required quantity for safety
        stock_qty = required * 2
        
        # Check if inventory exists
        result = db.session.execute(text("""
            SELECT id FROM inventory WHERE material_id = :mat_id
        """), {'mat_id': mat_id})
        inv = result.fetchone()
        
        if inv:
            # Update existing
            db.session.execute(text("""
                UPDATE inventory 
                SET quantity_on_hand = :qty,
                    quantity_available = :qty,
                    quantity_reserved = 0,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :inv_id
            """), {'qty': stock_qty, 'inv_id': inv[0]})
            print(f"  - Updated: {mat_name}: {stock_qty}")
        else:
            # Create new
            db.session.execute(text("""
                INSERT INTO inventory
                (material_id, location_id, quantity_on_hand, quantity_available, 
                 quantity_reserved, min_stock_level, max_stock_level, 
                 stock_status, is_active, created_at, updated_at)
                VALUES (:mat_id, :loc_id, :qty, :qty, 0, 0, 0, 'available', 1,
                        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """), {
                'mat_id': mat_id,
                'loc_id': location_id,
                'qty': stock_qty
            })
            print(f"  - Created: {mat_name}: {stock_qty}")
    
    db.session.commit()
    print(f"\n[OK] Updated {len(materials)} inventory records")
    
    # Verify availability
    print("\n" + "=" * 60)
    print("VERIFICATION")
    print("=" * 60)
    
    result = db.session.execute(text("""
        SELECT 
            wobi.item_name,
            wobi.quantity_planned,
            COALESCE(i.quantity_on_hand, 0) as available,
            CASE 
                WHEN COALESCE(i.quantity_on_hand, 0) >= wobi.quantity_planned THEN '[OK]'
                ELSE '[SHORTAGE]'
            END as status
        FROM work_order_bom_items wobi
        LEFT JOIN inventory i ON i.material_id = wobi.material_id
        WHERE wobi.work_order_id = :wo_id
    """), {'wo_id': wo_id})
    
    items = result.fetchall()
    all_ok = True
    
    for item in items:
        print(f"\n{item[0]}")
        print(f"  Required: {item[1]}")
        print(f"  Available: {item[2]}")
        print(f"  Status: {item[3]}")
        if item[3] == '[SHORTAGE]':
            all_ok = False
    
    print("\n" + "=" * 60)
    if all_ok:
        print("SUCCESS! ALL MATERIALS AVAILABLE!")
    else:
        print("WARNING: Some materials still insufficient")
    print("=" * 60)
    
    print("\n" + "=" * 60)
    print("READY TO TEST WAREHOUSE AUTO-DEDUCTION!")
    print("=" * 60)
    print(f"\n1. Start backend server:")
    print(f"   cd backend")
    print(f"   python run.py")
    print(f"\n2. Test Material Availability API:")
    print(f"   GET http://localhost:5000/api/production/work-orders/1/material-availability")
    print(f"\n3. Change WO status to 'released' (if needed):")
    print(f"   UPDATE work_orders SET status='released' WHERE id=1;")
    print(f"\n4. Test Auto-Deduction:")
    print(f"   PUT http://localhost:5000/api/production/work-orders/1/status")
    print(f"   Body: {{'status': 'in_progress', 'auto_deduct': true}}")
    print(f"\n5. Verify inventory movements created:")
    print(f"   SELECT * FROM inventory_movements WHERE reference_id = 1")
    print(f"\n6. Verify stock reduced:")
    print(f"   SELECT m.name, i.quantity_on_hand FROM inventory i")
    print(f"   JOIN materials m ON i.material_id = m.id")
    print(f"   WHERE i.material_id IN (SELECT material_id FROM work_order_bom_items WHERE work_order_id=1)")
    print("=" * 60)
