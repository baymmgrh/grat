"""
Fix downtime for Shift 1a and 1b
- Shift 1a (ID 49, Cinamoroll) = 85m downtime
- Shift 1b (ID 50, Kuromi) = 263m downtime
"""
from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Fixing downtime...")
    
    # Fix Shift 1a (ID 49) = 85m
    db.session.execute(db.text("""
        UPDATE shift_productions 
        SET downtime_minutes = 85
        WHERE id = 49
    """))
    
    # Fix Shift 1b (ID 50) = 263m (already correct but let's make sure)
    db.session.execute(db.text("""
        UPDATE shift_productions 
        SET downtime_minutes = 263
        WHERE id = 50
    """))
    
    db.session.commit()
    
    # Verify
    result = db.session.execute(db.text("""
        SELECT sp.id, sp.product_id, sp.good_quantity, sp.downtime_minutes,
               p.name as product_name
        FROM shift_productions sp
        LEFT JOIN products p ON sp.product_id = p.id
        WHERE sp.production_date = '2026-02-02' AND sp.machine_id = 4 AND sp.shift = 'shift_1'
        ORDER BY sp.id
    """)).fetchall()
    
    print("\nAfter fix:")
    for sp in result:
        print(f"  SP ID:{sp[0]} | {sp[4]} | Good:{sp[2]} | Downtime:{sp[3]}m")
    
    print("\n✅ Done!")
