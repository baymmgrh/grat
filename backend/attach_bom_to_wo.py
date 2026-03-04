"""
Attach BOM to existing Work Order and create WO BOM items
"""
from app import create_app
from models import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("=" * 60)
    print("ATTACH BOM TO WORK ORDER")
    print("=" * 60)
    
    # Get the WO
    result = db.session.execute(text("""
        SELECT id, wo_number, product_id, status 
        FROM work_orders 
        WHERE wo_number = 'WO-202512-00001'
    """))
    wo = result.fetchone()
    
    if not wo:
        print("Work Order not found!")
        exit(1)
    
    print(f"\nWork Order: {wo[1]}")
    print(f"Product ID: {wo[2]}")
    print(f"Status: {wo[3]}")
    
    # Find BOM for this product
    result = db.session.execute(text("""
        SELECT id, bom_number FROM bill_of_materials 
        WHERE product_id = :product_id 
        LIMIT 1
    """), {'product_id': wo[2]})
    bom = result.fetchone()
    
    if not bom:
        print(f"\nNo BOM found for product ID {wo[2]}")
        print("Creating BOM...")
        
        # Create BOM
        db.session.execute(text("""
            INSERT INTO bill_of_materials 
            (bom_number, product_id, version, is_active, batch_uom, created_at, updated_at)
            VALUES (:bom_number, :product_id, '1.0', 1, 'pcs', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """), {
            'bom_number': f'BOM-{wo[2]:04d}',
            'product_id': wo[2]
        })
        db.session.commit()
        
        # Get BOM ID
        result = db.session.execute(text("""
            SELECT id FROM bill_of_materials WHERE bom_number = :bom_number
        """), {'bom_number': f'BOM-{wo[2]:04d}'})
        bom_id = result.scalar()
        
        # Add BOM items from materials with stock
        result = db.session.execute(text("""
            SELECT m.id, m.name FROM materials m
            JOIN inventory i ON i.material_id = m.id
            WHERE i.quantity_on_hand > 0
            LIMIT 3
        """))
        materials = result.fetchall()
        
        for i, mat in enumerate(materials):
            db.session.execute(text("""
                INSERT INTO bom_items
                (bom_id, line_number, material_id, quantity, uom, created_at, updated_at)
                VALUES (:bom_id, :line, :mat_id, :qty, 'kg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """), {
                'bom_id': bom_id,
                'line': i + 1,
                'mat_id': mat[0],
                'qty': 0.1 * (i + 1)  # Small qty for testing
            })
            print(f"  - Added: {mat[1]}, Qty: {0.1 * (i + 1)}")
        
        db.session.commit()
        print(f"BOM created with ID: {bom_id}")
    else:
        bom_id = bom[0]
        print(f"\nFound BOM: {bom[1]} (ID: {bom_id})")
    
    # Update WO with BOM
    print(f"\nAttaching BOM {bom_id} to WO {wo[1]}...")
    db.session.execute(text("""
        UPDATE work_orders 
        SET bom_id = :bom_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :wo_id
    """), {'bom_id': bom_id, 'wo_id': wo[0]})
    db.session.commit()
    print("BOM attached!")
    
    # Create WO BOM items
    print("\nCreating Work Order BOM Items...")
    
    # Clear existing
    db.session.execute(text("""
        DELETE FROM work_order_bom_items WHERE work_order_id = :wo_id
    """), {'wo_id': wo[0]})
    
    # Get BOM items
    result = db.session.execute(text("""
        SELECT id, material_id, quantity, uom FROM bom_items WHERE bom_id = :bom_id
    """), {'bom_id': bom_id})
    bom_items = result.fetchall()
    
    wo_qty = 6119.98  # From WO
    
    for i, bom_item in enumerate(bom_items):
        qty_per_unit = float(bom_item[2])
        qty_planned = qty_per_unit * wo_qty
        db.session.execute(text("""
            INSERT INTO work_order_bom_items
            (work_order_id, original_bom_id, original_bom_item_id, line_number, 
             material_id, quantity_per_unit, quantity_planned, uom, created_at, updated_at)
            VALUES (:wo_id, :bom_id, :bom_item_id, :line, :mat_id, :qty_per, :qty_plan, :uom, 
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """), {
            'wo_id': wo[0],
            'bom_id': bom_id,
            'bom_item_id': bom_item[0],
            'line': i + 1,
            'mat_id': bom_item[1],
            'qty_per': qty_per_unit,
            'qty_plan': qty_planned,
            'uom': bom_item[3]
        })
        
        # Get material name
        result = db.session.execute(text("""
            SELECT name FROM materials WHERE id = :mat_id
        """), {'mat_id': bom_item[1]})
        mat_name = result.scalar()
        
        print(f"  - {mat_name}: {qty_planned} {bom_item[3]}")
    
    db.session.commit()
    print(f"\nCreated {len(bom_items)} WO BOM items")
    
    # Verify material availability
    print("\n" + "=" * 60)
    print("MATERIAL AVAILABILITY CHECK")
    print("=" * 60)
    
    result = db.session.execute(text("""
        SELECT 
            m.name,
            wobi.quantity_planned,
            COALESCE(i.quantity_on_hand, 0) as available,
            CASE 
                WHEN COALESCE(i.quantity_on_hand, 0) >= wobi.quantity_planned THEN '[OK]'
                ELSE '[SHORTAGE]'
            END as status
        FROM work_order_bom_items wobi
        LEFT JOIN materials m ON wobi.material_id = m.id
        LEFT JOIN inventory i ON i.material_id = wobi.material_id
        WHERE wobi.work_order_id = :wo_id
    """), {'wo_id': wo[0]})
    
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
    print("SETUP COMPLETE!")
    print("=" * 60)
    print(f"Work Order: {wo[1]} (ID: {wo[0]})")
    print(f"BOM ID: {bom_id}")
    print(f"Status: {wo[3]}")
    print(f"BOM Items: {len(items)}")
    print(f"Material Status: {'[OK] All Available' if all_ok else '[SHORTAGE] Some Insufficient'}")
    
    print("\n" + "=" * 60)
    print("READY TO TEST!")
    print("=" * 60)
    print(f"\n1. Check Material Availability:")
    print(f"   GET /api/production/work-orders/{wo[0]}/material-availability")
    print(f"\n2. Start Production (Auto-Deduct):")
    print(f"   PUT /api/production/work-orders/{wo[0]}/status")
    print(f"   Body: {{'status': 'in_progress', 'auto_deduct': true}}")
    print(f"\n   Note: WO is already 'in_progress', change to 'released' first if needed")
    print("=" * 60)
