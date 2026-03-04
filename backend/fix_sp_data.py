"""
Fix ShiftProduction ID 50 - Good should be 1620, not 2430
"""
from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Fixing ShiftProduction ID 50...")
    
    # SP ID 50 should have good_quantity=1620, actual_quantity=1891 (from PR ID 49)
    db.session.execute(db.text("""
        UPDATE shift_productions 
        SET good_quantity = 1620, 
            actual_quantity = 1891
        WHERE id = 50
    """))
    
    db.session.commit()
    
    # Verify
    result = db.session.execute(db.text("""
        SELECT sp.id, sp.shift, sp.machine_id, sp.product_id, 
               sp.good_quantity, sp.actual_quantity,
               p.name as product_name
        FROM shift_productions sp
        LEFT JOIN products p ON sp.product_id = p.id
        WHERE sp.production_date = '2026-02-02'
        ORDER BY sp.machine_id, sp.shift, sp.id
    """)).fetchall()
    
    print("\nShiftProduction data (after fix):")
    for sp in result:
        print(f"  SP ID:{sp[0]} | Shift:{sp[1]} | Machine:{sp[2]} | Product:{sp[3]} ({sp[6]}) | Good:{sp[4]} | Total:{sp[5]}")
    
    print("\n✅ Fix complete!")
