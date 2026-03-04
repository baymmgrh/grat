"""
Fix ShiftProduction ID 50 (Cinamoroll) - all fields based on Production Records screenshot
Shift 1, Cinamoroll: GOOD=1620, Produced=1891, Reject=9, Set Sticker=17, Set Packaging=44
"""
from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Fixing ShiftProduction ID 50 (Cinamoroll)...")
    print("Based on Production Records: GOOD=1620, Produced=1891, Reject=9, Set Sticker=17, Set Packaging=44")
    
    # Calculate: Produced = Good + Reject + Rework
    # 1891 = 1620 + 9 + Rework => Rework = 262
    # But screenshot shows: Produced=1891, Good=1620, Reject=9
    # So: 1891 - 1620 - 9 = 262 (Grade B/Rework)
    
    db.session.execute(db.text("""
        UPDATE shift_productions 
        SET good_quantity = 1620, 
            actual_quantity = 1891,
            reject_quantity = 9,
            rework_quantity = 262,
            setting_sticker = 17,
            setting_packaging = 44
        WHERE id = 50
    """))
    
    db.session.commit()
    
    # Verify
    result = db.session.execute(db.text("""
        SELECT sp.id, sp.shift, sp.product_id, 
               sp.good_quantity, sp.actual_quantity, sp.reject_quantity, sp.rework_quantity,
               sp.setting_sticker, sp.setting_packaging,
               p.name as product_name
        FROM shift_productions sp
        LEFT JOIN products p ON sp.product_id = p.id
        WHERE sp.id = 50
    """)).fetchone()
    
    print(f"\nShiftProduction ID 50 after fix:")
    print(f"  Product: {result[9]}")
    print(f"  Good: {result[3]}, Total: {result[4]}, Reject: {result[5]}, Rework: {result[6]}")
    print(f"  Set Sticker: {result[7]}, Set Packaging: {result[8]}")
    
    print("\n✅ Fix complete!")
