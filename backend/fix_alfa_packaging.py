#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Fixing ALFAMART product packaging data and checking WO 45...")
    
    try:
        # Step 1: Update products_new for ALFAMART product
        print("🔧 Updating pack_per_karton for ALFAMART product...")
        
        update_result = db.session.execute(db.text("""
            UPDATE products_new 
            SET pack_per_karton = 27
            WHERE kode_produk = '4022301001'
        """))
        
        db.session.commit()
        print(f"✅ Updated {update_result.rowcount} records")
        
        # Verify the update
        verify_result = db.session.execute(db.text("""
            SELECT kode_produk, nama_produk, pack_per_karton
            FROM products_new
            WHERE kode_produk = '4022301001'
        """)).fetchone()
        
        print(f"✅ Verified: {verify_result[0]} - {verify_result[1]}: {verify_result[2]} pcs/carton")
        
        # Step 2: Check WIP stocks for WO 45 with correct query
        print(f"\n📦 Checking WIP Stocks for WO 45...")
        
        wip_result = db.session.execute(db.text("""
            SELECT ws.id, ws.product_id, ws.quantity_pcs, ws.quantity_carton,
                   ws.pack_per_carton, ws.last_wo_number
            FROM wip_stocks ws
            WHERE ws.last_wo_number LIKE '%45%' OR ws.id IN (
                SELECT sp.id FROM shift_productions sp WHERE sp.work_order_id = 45
            )
            ORDER BY ws.updated_at DESC
        """)).fetchall()
        
        print(f"Found {len(wip_result)} WIP stock records:")
        
        for wip in wip_result:
            print(f"\n  WIP Stock ID: {wip[0]}")
            print(f"    Product ID: {wip[1]}")
            print(f"    Quantity PCS: {wip[2]}")
            print(f"    Quantity Carton: {wip[3]}")
            print(f"    Pack per Carton: {wip[4]}")
            print(f"    Last WO: {wip[5]}")
            
            # Calculate expected cartons
            if wip[2] and wip[4]:
                expected_cartons = int(wip[2] / wip[4]) if wip[4] > 0 else 0
                actual_cartons = wip[3] if wip[3] else 0
                print(f"    Expected Cartons: {expected_cartons}")
                print(f"    Actual Cartons: {actual_cartons}")
                
                if expected_cartons != actual_cartons:
                    print(f"    ⚠️  MISMATCH! Expected {expected_cartons}, got {actual_carton}")
                    
                    # Fix the carton quantity
                    if expected_cartons > 0:
                        fix_result = db.session.execute(db.text("""
                            UPDATE wip_stocks 
                            SET quantity_carton = :expected_carton
                            WHERE id = :wip_id
                        """), {'expected_carton': expected_cartons, 'wip_id': wip[0]})
                        
                        db.session.commit()
                        print(f"    ✅ Fixed: Updated carton quantity to {expected_cartons}")
        
        # Step 3: Check shift production data
        print(f"\n🏭 Checking Shift Production for WO 45...")
        
        shift_result = db.session.execute(db.text("""
            SELECT sp.id, sp.shift, sp.actual_quantity, sp.good_quantity,
                   p.code as product_code, p.name as product_name
            FROM shift_productions sp
            LEFT JOIN products p ON sp.product_id = p.id
            WHERE sp.work_order_id = 45
            ORDER BY sp.shift
        """)).fetchall()
        
        for shift in shift_result:
            print(f"\n  Shift {shift[1]}:")
            print(f"    ID: {shift[0]}")
            print(f"    Good Quantity: {shift[3]} pcs")
            print(f"    Product: {shift[4]} - {shift[5]}")
            
            # Calculate cartons based on updated products_new data
            if shift[3]:
                cartons = int(shift[3] / 27)  # 27 pcs per carton
                print(f"    Calculated Cartons: {cartons}")
        
        print(f"\n✅ Data check and fix completed!")
        
    except Exception as e:
        print(f"Error: {e}")
        db.session.rollback()
        import traceback
        traceback.print_exc()
