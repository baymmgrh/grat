"""
Populate Work Order BOM Items from BOM
"""
from app import create_app
from models import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("=" * 60)
    print("POPULATE WO BOM ITEMS")
    print("=" * 60)
    
    wo_id = 1
    bom_id = 261
    wo_qty = 6119.98
    
    # Get BOM items
    result = db.session.execute(text("""
        SELECT bi.id, bi.material_id, bi.product_id, bi.quantity, bi.uom, bi.line_number,
               COALESCE(m.name, p.name) as item_name,
               COALESCE(m.code, p.code) as item_code
        FROM bom_items bi
        LEFT JOIN materials m ON bi.material_id = m.id
        LEFT JOIN products p ON bi.product_id = p.id
        WHERE bi.bom_id = :bom_id
        ORDER BY bi.line_number
    """), {'bom_id': bom_id})
    
    bom_items = result.fetchall()
    print(f"\nFound {len(bom_items)} BOM items")
    
    if len(bom_items) == 0:
        print("[ERROR] No BOM items found in BOM!")
        exit(1)
    
    # Clear existing WO BOM items
    db.session.execute(text("""
        DELETE FROM work_order_bom_items WHERE work_order_id = :wo_id
    """), {'wo_id': wo_id})
    
    print("\nCreating WO BOM Items...")
    
    for bom_item in bom_items:
        qty_per_unit = float(bom_item[3])
        qty_planned = qty_per_unit * wo_qty
        
        db.session.execute(text("""
            INSERT INTO work_order_bom_items
            (work_order_id, original_bom_id, original_bom_item_id, line_number,
             material_id, product_id, item_name, item_code,
             quantity_per_unit, quantity_planned, uom,
             created_at, updated_at)
            VALUES (:wo_id, :bom_id, :bom_item_id, :line_number,
                    :material_id, :product_id, :item_name, :item_code,
                    :qty_per_unit, :qty_planned, :uom,
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """), {
            'wo_id': wo_id,
            'bom_id': bom_id,
            'bom_item_id': bom_item[0],
            'line_number': bom_item[5],
            'material_id': bom_item[1],
            'product_id': bom_item[2],
            'item_name': bom_item[6] or 'Unknown',
            'item_code': bom_item[7],
            'qty_per_unit': qty_per_unit,
            'qty_planned': qty_planned,
            'uom': bom_item[4]
        })
        
        print(f"  - {bom_item[6]}: {qty_planned} {bom_item[4]}")
    
    db.session.commit()
    print(f"\n[OK] Created {len(bom_items)} WO BOM items")
    
    # Check material availability
    print("\n" + "=" * 60)
    print("MATERIAL AVAILABILITY")
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
    print("READY TO TEST!")
    print("=" * 60)
    print(f"Work Order ID: {wo_id}")
    print(f"BOM Items: {len(items)}")
    print(f"Material Status: {'[OK] All Available' if all_ok else '[SHORTAGE] Need to add stock'}")
    
    print("\n" + "=" * 60)
    print("TEST COMMANDS")
    print("=" * 60)
    print(f"\n1. Start backend:")
    print(f"   python run.py")
    print(f"\n2. Test Material Availability:")
    print(f"   GET http://localhost:5000/api/production/work-orders/{wo_id}/material-availability")
    print(f"\n3. If materials available, test Auto-Deduction:")
    print(f"   Note: WO is 'in_progress', change to 'released' first:")
    print(f"   UPDATE work_orders SET status='released' WHERE id={wo_id};")
    print(f"   Then:")
    print(f"   PUT http://localhost:5000/api/production/work-orders/{wo_id}/status")
    print(f"   Body: {{'status': 'in_progress', 'auto_deduct': true}}")
    print("=" * 60)
