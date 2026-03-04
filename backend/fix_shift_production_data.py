"""
Fix ShiftProduction data yang tidak sinkron dengan ProductionRecord
"""
from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("=" * 80)
    print("Fixing ShiftProduction data based on ProductionRecord")
    print("=" * 80)
    
    # Check production_records table structure
    print("\nChecking production_records for date 2026-02-02...")
    pr_check = db.session.execute(db.text("""
        SELECT id, production_date, shift, quantity_good, quantity_produced
        FROM production_records
        WHERE CAST(production_date AS DATE) = '2026-02-02'
        ORDER BY id
    """)).fetchall()
    
    print(f"Found {len(pr_check)} records with CAST")
    for pr in pr_check:
        print(f"  PR ID:{pr[0]} | Date:{pr[1]} | Shift:{pr[2]} | Good:{pr[3]} | Total:{pr[4]}")
    
    # Also try without CAST
    pr_check2 = db.session.execute(db.text("""
        SELECT id, production_date, shift, quantity_good, quantity_produced
        FROM production_records
        ORDER BY production_date DESC
        LIMIT 10
    """)).fetchall()
    
    print(f"\nLatest 10 production_records:")
    for pr in pr_check2:
        print(f"  PR ID:{pr[0]} | Date:{pr[1]} | Shift:{pr[2]} | Good:{pr[3]} | Total:{pr[4]}")
    
    # Get corresponding ShiftProduction records
    sp_records = db.session.execute(db.text("""
        SELECT id, production_date, shift, machine_id, product_id, 
               good_quantity, actual_quantity
        FROM shift_productions
        WHERE production_date = '2026-02-02'
        ORDER BY machine_id, shift, id
    """)).fetchall()
    
    print("\nShiftProduction data (before fix):")
    for sp in sp_records:
        print(f"  SP ID:{sp[0]} | Shift:{sp[2]} | Machine:{sp[3]} | Product:{sp[4]} | Good:{sp[5]} | Total:{sp[6]}")
    
    # Fix: Update ShiftProduction based on ProductionRecord
    print("\n" + "=" * 80)
    print("Applying fixes...")
    print("=" * 80)
    
    for pr in pr_records:
        pr_id, pr_date, pr_shift, pr_wo_id, pr_product_id, pr_good, pr_total, pr_machine = pr
        
        shift_key = f"shift_{pr_shift}"
        
        # Find matching ShiftProduction
        sp_match = db.session.execute(db.text("""
            SELECT id, good_quantity, actual_quantity 
            FROM shift_productions 
            WHERE production_date = :date 
              AND shift = :shift 
              AND machine_id = :machine 
              AND product_id = :product
        """), {
            'date': pr_date,
            'shift': shift_key,
            'machine': pr_machine,
            'product': pr_product_id
        }).fetchone()
        
        if sp_match:
            sp_id, sp_good, sp_total = sp_match
            if sp_good != pr_good or sp_total != pr_total:
                print(f"  Fixing SP ID:{sp_id} - Good: {sp_good} -> {pr_good}, Total: {sp_total} -> {pr_total}")
                db.session.execute(db.text("""
                    UPDATE shift_productions 
                    SET good_quantity = :good, 
                        actual_quantity = :total
                    WHERE id = :id
                """), {
                    'good': pr_good,
                    'total': pr_total,
                    'id': sp_id
                })
            else:
                print(f"  SP ID:{sp_id} already correct")
        else:
            print(f"  No matching SP found for PR ID:{pr_id} (Product:{pr_product_id})")
    
    db.session.commit()
    
    # Verify
    print("\n" + "=" * 80)
    print("ShiftProduction data (after fix):")
    print("=" * 80)
    sp_after = db.session.execute(db.text("""
        SELECT sp.id, sp.shift, sp.machine_id, sp.product_id, 
               sp.good_quantity, sp.actual_quantity,
               p.name as product_name
        FROM shift_productions sp
        LEFT JOIN products p ON sp.product_id = p.id
        WHERE sp.production_date = '2026-02-02'
        ORDER BY sp.machine_id, sp.shift, sp.id
    """)).fetchall()
    
    for sp in sp_after:
        print(f"  SP ID:{sp[0]} | Shift:{sp[1]} | Machine:{sp[2]} | Product:{sp[3]} ({sp[6]}) | Good:{sp[4]} | Total:{sp[5]}")
    
    print("\n✅ Fix complete!")
