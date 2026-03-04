"""
Fix ShiftProduction Shift 1 order:
- Shift 1a = Cinamoroll (ID 381): Good=1620, Downtime=85m
- Shift 1b = Kuromi (ID 380): Good=2430, Downtime=263m
"""
from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("=" * 80)
    print("Fixing ShiftProduction Shift 1 order...")
    print("=" * 80)
    
    # Check current data
    print("\nCurrent data:")
    current = db.session.execute(db.text("""
        SELECT sp.id, sp.shift, sp.product_id, sp.good_quantity, sp.downtime_minutes,
               p.name as product_name
        FROM shift_productions sp
        LEFT JOIN products p ON sp.product_id = p.id
        WHERE sp.production_date = '2026-02-02' AND sp.machine_id = 4 AND sp.shift = 'shift_1'
        ORDER BY sp.id
    """)).fetchall()
    
    for sp in current:
        print(f"  SP ID:{sp[0]} | Product:{sp[2]} ({sp[5]}) | Good:{sp[3]} | Downtime:{sp[4]}")
    
    # The order should be based on input time (ID order)
    # SP ID 49 should be Shift 1a (first input) = Cinamoroll
    # SP ID 50 should be Shift 1b (second input) = Kuromi
    
    # But currently:
    # SP ID 49 = Kuromi (should be Cinamoroll)
    # SP ID 50 = Cinamoroll (should be Kuromi)
    
    # We need to swap the product_id and all related data
    
    print("\n" + "=" * 80)
    print("Swapping data between SP ID 49 and 50...")
    print("=" * 80)
    
    # Get data for both records
    sp49 = db.session.execute(db.text("""
        SELECT good_quantity, actual_quantity, reject_quantity, rework_quantity,
               setting_sticker, setting_packaging, downtime_minutes, product_id
        FROM shift_productions WHERE id = 49
    """)).fetchone()
    
    sp50 = db.session.execute(db.text("""
        SELECT good_quantity, actual_quantity, reject_quantity, rework_quantity,
               setting_sticker, setting_packaging, downtime_minutes, product_id
        FROM shift_productions WHERE id = 50
    """)).fetchone()
    
    print(f"SP 49 before: Product={sp49[7]}, Good={sp49[0]}, Total={sp49[1]}, Downtime={sp49[6]}")
    print(f"SP 50 before: Product={sp50[7]}, Good={sp50[0]}, Total={sp50[1]}, Downtime={sp50[6]}")
    
    # Swap: SP 49 gets SP 50's data, SP 50 gets SP 49's data
    db.session.execute(db.text("""
        UPDATE shift_productions 
        SET good_quantity = :good, actual_quantity = :total, 
            reject_quantity = :reject, rework_quantity = :rework,
            setting_sticker = :sticker, setting_packaging = :packaging,
            downtime_minutes = :downtime, product_id = :product
        WHERE id = 49
    """), {
        'good': sp50[0], 'total': sp50[1], 'reject': sp50[2], 'rework': sp50[3],
        'sticker': sp50[4], 'packaging': sp50[5], 'downtime': 85, 'product': sp50[7]
    })
    
    db.session.execute(db.text("""
        UPDATE shift_productions 
        SET good_quantity = :good, actual_quantity = :total, 
            reject_quantity = :reject, rework_quantity = :rework,
            setting_sticker = :sticker, setting_packaging = :packaging,
            downtime_minutes = :downtime, product_id = :product
        WHERE id = 50
    """), {
        'good': sp49[0], 'total': sp49[1], 'reject': sp49[2], 'rework': sp49[3],
        'sticker': sp49[4], 'packaging': sp49[5], 'downtime': 263, 'product': sp49[7]
    })
    
    db.session.commit()
    
    # Verify
    print("\n" + "=" * 80)
    print("After fix:")
    print("=" * 80)
    after = db.session.execute(db.text("""
        SELECT sp.id, sp.shift, sp.product_id, sp.good_quantity, sp.actual_quantity, sp.downtime_minutes,
               p.name as product_name
        FROM shift_productions sp
        LEFT JOIN products p ON sp.product_id = p.id
        WHERE sp.production_date = '2026-02-02' AND sp.machine_id = 4 AND sp.shift = 'shift_1'
        ORDER BY sp.id
    """)).fetchall()
    
    for sp in after:
        print(f"  SP ID:{sp[0]} | Product:{sp[2]} ({sp[6]}) | Good:{sp[3]} | Total:{sp[4]} | Downtime:{sp[5]}m")
    
    print("\n✅ Fix complete!")
    print("  Shift 1a (ID 49) = Cinamoroll, Good=1620, Downtime=85m")
    print("  Shift 1b (ID 50) = Kuromi, Good=2430, Downtime=263m")
