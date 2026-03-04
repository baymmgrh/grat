"""
Simple script to populate inventory stock using direct SQL
"""
from app import create_app
from models import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("=" * 60)
    print("POPULATE INVENTORY STOCK (Direct SQL)")
    print("=" * 60)
    
    # 1. Update inventory stock
    print("\n1. Updating inventory stock...")
    result = db.session.execute(text("""
        UPDATE inventory 
        SET quantity_on_hand = 1000,
            quantity_available = 1000,
            quantity_reserved = 0,
            updated_at = CURRENT_TIMESTAMP
        WHERE id <= 50
    """))
    db.session.commit()
    print(f"   [OK] Updated {result.rowcount} inventory records")
    
    # 2. Check updated inventory
    print("\n2. Checking updated inventory...")
    result = db.session.execute(text("""
        SELECT i.id, m.name, i.quantity_on_hand, i.quantity_available
        FROM inventory i
        LEFT JOIN materials m ON i.material_id = m.id
        WHERE i.quantity_on_hand > 0
        LIMIT 10
    """))
    
    rows = result.fetchall()
    print(f"   Found {len(rows)} inventory records with stock:")
    for row in rows:
        print(f"   - ID:{row[0]}, {row[1]}, Qty:{row[2]}")
    
    # 3. Check if BOM exists
    print("\n3. Checking BOM...")
    result = db.session.execute(text("""
        SELECT COUNT(*) FROM bill_of_materials
    """))
    bom_count = result.scalar()
    print(f"   Total BOMs: {bom_count}")
    
    if bom_count == 0:
        print("   Creating test BOM...")
        
        # Get first product
        result = db.session.execute(text("SELECT id, name FROM products LIMIT 1"))
        product = result.fetchone()
        
        if product:
            # Create BOM
            db.session.execute(text("""
                INSERT INTO bill_of_materials 
                (bom_number, product_id, version, is_active, batch_uom, created_at, updated_at)
                VALUES ('BOM-TEST-0001', :product_id, '1.0', 1, 'pcs', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """), {'product_id': product[0]})
            db.session.commit()
            
            # Get BOM ID
            result = db.session.execute(text("SELECT id FROM bill_of_materials WHERE bom_number = 'BOM-TEST-0001'"))
            bom_id = result.scalar()
            
            # Get materials with stock
            result = db.session.execute(text("""
                SELECT m.id, m.name FROM materials m
                JOIN inventory i ON i.material_id = m.id
                WHERE i.quantity_on_hand > 0
                LIMIT 3
            """))
            materials = result.fetchall()
            
            # Add BOM items
            for i, mat in enumerate(materials):
                db.session.execute(text("""
                    INSERT INTO bom_items
                    (bom_id, line_number, material_id, quantity, uom, created_at, updated_at)
                    VALUES (:bom_id, :line, :mat_id, :qty, 'kg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """), {
                    'bom_id': bom_id,
                    'line': i + 1,
                    'mat_id': mat[0],
                    'qty': 10.0 * (i + 1)
                })
                print(f"   - Added BOM item: {mat[1]}, Qty: {10.0 * (i + 1)}")
            
            db.session.commit()
            print(f"   [OK] BOM created with ID: {bom_id}")
    
    # 4. Create test Work Order
    print("\n4. Creating test Work Order...")
    
    # Delete old test WO
    db.session.execute(text("DELETE FROM work_order_bom_items WHERE work_order_id IN (SELECT id FROM work_orders WHERE wo_number = 'WO-TEST-AUTO-001')"))
    db.session.execute(text("DELETE FROM work_orders WHERE wo_number = 'WO-TEST-AUTO-001'"))
    db.session.commit()
    
    # Get product and BOM
    result = db.session.execute(text("SELECT id FROM products LIMIT 1"))
    product_id = result.scalar()
    
    result = db.session.execute(text("SELECT id FROM bill_of_materials LIMIT 1"))
    bom_id = result.scalar()
    
    if product_id and bom_id:
        # Create WO
        db.session.execute(text("""
            INSERT INTO work_orders
            (wo_number, product_id, bom_id, quantity, quantity_produced, quantity_good, 
             quantity_scrap, status, priority, uom, required_date, created_at, updated_at)
            VALUES ('WO-TEST-AUTO-001', :product_id, :bom_id, 100, 0, 0, 0, 
                    'released', 'normal', 'pcs', date('now', '+7 days'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """), {'product_id': product_id, 'bom_id': bom_id})
        db.session.commit()
        
        # Get WO ID
        result = db.session.execute(text("SELECT id FROM work_orders WHERE wo_number = 'WO-TEST-AUTO-001'"))
        wo_id = result.scalar()
        
        print(f"   [OK] Created WO-TEST-AUTO-001 (ID: {wo_id})")
        
        # Create WO BOM items
        result = db.session.execute(text("""
            SELECT id, material_id, quantity, uom FROM bom_items WHERE bom_id = :bom_id
        """), {'bom_id': bom_id})
        bom_items = result.fetchall()
        
        for bom_item in bom_items:
            qty_required = float(bom_item[2]) * 100 / 100  # Scale to WO qty
            db.session.execute(text("""
                INSERT INTO work_order_bom_items
                (work_order_id, bom_item_id, material_id, quantity_required, uom)
                VALUES (:wo_id, :bom_item_id, :mat_id, :qty, :uom)
            """), {
                'wo_id': wo_id,
                'bom_item_id': bom_item[0],
                'mat_id': bom_item[1],
                'qty': qty_required,
                'uom': bom_item[3]
            })
        
        db.session.commit()
        print(f"   [OK] Created {len(bom_items)} WO BOM items")
        
        # 5. Verify material availability
        print("\n5. Verifying Material Availability...")
        result = db.session.execute(text("""
            SELECT 
                m.name,
                wobi.quantity_required,
                COALESCE(i.quantity_on_hand, 0) as available,
                CASE 
                    WHEN COALESCE(i.quantity_on_hand, 0) >= wobi.quantity_required THEN '[OK]'
                    ELSE '[SHORTAGE]'
                END as status
            FROM work_order_bom_items wobi
            LEFT JOIN materials m ON wobi.material_id = m.id
            LEFT JOIN inventory i ON i.material_id = wobi.material_id
            WHERE wobi.work_order_id = :wo_id
        """), {'wo_id': wo_id})
        
        items = result.fetchall()
        all_ok = True
        for item in items:
            print(f"   - {item[0]}")
            print(f"     Required: {item[1]}, Available: {item[2]} {item[3]}")
            if item[3] == '[SHORTAGE]':
                all_ok = False
        
        # Summary
        print("\n" + "=" * 60)
        print("SETUP COMPLETE!")
        print("=" * 60)
        print(f"Work Order: WO-TEST-AUTO-001 (ID: {wo_id})")
        print(f"Status: released")
        print(f"BOM Items: {len(items)}")
        print(f"Material Status: {'[OK] All Available' if all_ok else '[SHORTAGE] Some Insufficient'}")
        
        print("\n" + "=" * 60)
        print("READY FOR TESTING!")
        print("=" * 60)
        print("\nTest Commands:")
        print(f"\n1. Check Material Availability:")
        print(f"   GET /api/production/work-orders/{wo_id}/material-availability")
        print(f"\n2. Start Production (Auto-Deduct):")
        print(f"   PUT /api/production/work-orders/{wo_id}/status")
        print(f"   Body: {{'status': 'in_progress', 'auto_deduct': true}}")
        print(f"\n3. Check Inventory Movements:")
        print(f"   SELECT * FROM inventory_movements WHERE reference_id = {wo_id}")
        print("=" * 60)
    else:
        print("   [ERROR] Product or BOM not found!")
