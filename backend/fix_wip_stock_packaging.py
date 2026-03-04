#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Fixing WIP Stock pack_per_carton for ALFAMART product...")
    
    try:
        # Update WIP stock pack_per_carton and quantity_carton
        print("🔧 Updating WIP Stock data...")
        
        # Get the WIP stock record for WO 45
        wip_result = db.session.execute(db.text("""
            SELECT id, quantity_pcs, quantity_carton, pack_per_carton
            FROM wip_stocks 
            WHERE last_wo_number = 'WO-202602-00045'
        """)).fetchone()
        
        if wip_result:
            wip_id = wip_result[0]
            quantity_pcs = wip_result[1]
            current_carton = wip_result[2]
            current_pack = wip_result[3]
            
            print(f"Current WIP Stock:")
            print(f"  ID: {wip_id}")
            print(f"  Quantity PCS: {quantity_pcs}")
            print(f"  Quantity Carton: {current_carton}")
            print(f"  Pack per Carton: {current_pack}")
            
            # Calculate correct values
            correct_pack_per_carton = 27
            correct_quantity_carton = int(quantity_pcs / correct_pack_per_carton)
            
            print(f"\nCorrect values should be:")
            print(f"  Pack per Carton: {correct_pack_per_carton}")
            print(f"  Quantity Carton: {correct_quantity_carton}")
            
            # Update the WIP stock
            update_result = db.session.execute(db.text("""
                UPDATE wip_stocks 
                SET pack_per_carton = :pack_per_carton,
                    quantity_carton = :quantity_carton,
                    updated_at = datetime('now')
                WHERE id = :wip_id
            """), {
                'pack_per_carton': correct_pack_per_carton,
                'quantity_carton': correct_quantity_carton,
                'wip_id': wip_id
            })
            
            db.session.commit()
            print(f"✅ Updated WIP Stock: {update_result.rowcount} records")
            
            # Verify the update
            verify_result = db.session.execute(db.text("""
                SELECT id, quantity_pcs, quantity_carton, pack_per_carton
                FROM wip_stocks 
                WHERE id = :wip_id
            """), {'wip_id': wip_id}).fetchone()
            
            print(f"\n✅ Verified updated WIP Stock:")
            print(f"  Quantity PCS: {verify_result[1]}")
            print(f"  Quantity Carton: {verify_result[2]}")
            print(f"  Pack per Carton: {verify_result[3]}")
            
            # Double-check calculation
            expected_cartons = int(verify_result[1] / verify_result[3])
            print(f"  Expected Cartons: {expected_cartons}")
            
            if verify_result[2] == expected_cartons:
                print(f"  ✅ CORRECT! Cartons match calculation")
            else:
                print(f"  ⚠️  Still mismatch: {verify_result[2]} vs {expected_cartons}")
        
        else:
            print("❌ No WIP stock found for WO 45")
        
        # Also check if there are other WIP stocks with wrong pack_per_carton for this product
        print(f"\n🔍 Checking other WIP stocks for product 4022301001...")
        
        other_wips = db.session.execute(db.text("""
            SELECT ws.id, ws.quantity_pcs, ws.quantity_carton, ws.pack_per_carton,
                   ws.last_wo_number
            FROM wip_stocks ws
            WHERE ws.product_id = 383 AND ws.pack_per_carton != 27
        """)).fetchall()
        
        if other_wips:
            print(f"Found {len(other_wips)} other WIP stocks with wrong pack_per_carton:")
            for wip in other_wips:
                print(f"  ID {wip[0]} ({wip[4]}): {wip[3]} pcs/carton (should be 27)")
                
                # Fix this too
                correct_cartons = int(wip[1] / 27)
                db.session.execute(db.text("""
                    UPDATE wip_stocks 
                    SET pack_per_carton = 27,
                        quantity_carton = :correct_cartons,
                        updated_at = datetime('now')
                    WHERE id = :wip_id
                """), {'correct_cartons': correct_cartons, 'wip_id': wip[0]})
            
            db.session.commit()
            print(f"✅ Fixed {len(other_wips)} additional WIP stocks")
        else:
            print("✅ No other WIP stocks need fixing")
        
        print(f"\n🎉 All packaging data fixed for ALFAMART product!")
        
    except Exception as e:
        print(f"Error: {e}")
        db.session.rollback()
        import traceback
        traceback.print_exc()
