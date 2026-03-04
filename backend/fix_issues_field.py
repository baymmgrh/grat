"""
Fix issues field and downtime breakdown for Shift 1a and 1b
"""
from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Fixing issues field and downtime breakdown...")
    
    # Shift 1a (ID 49, Cinamoroll) = 85m downtime
    # Based on user info: downtime should be 85m
    db.session.execute(db.text("""
        UPDATE shift_productions 
        SET downtime_minutes = 85,
            issues = '10 menit - Posisi inkjet tidak maksimal [mesin]; 20 menit - Posisi stiker tidak maksimal [mesin]; 15 menit - Seal bawah tidak maksimal [mesin]; 40 menit - Ganti variant [design]',
            downtime_mesin = 45,
            downtime_operator = 0,
            downtime_material = 0,
            downtime_design = 40,
            downtime_others = 0
        WHERE id = 49
    """))
    
    # Shift 1b (ID 50, Kuromi) = 263m downtime
    db.session.execute(db.text("""
        UPDATE shift_productions 
        SET downtime_minutes = 263,
            issues = '10 menit - Ganti packaging [design]; 20 menit - Rantai pusher feeding tidak maksimal [others]; 20 menit - Posisi inkjet tidak maksimal [mesin]; 20 menit - Posisi stiker tidak maksimal [mesin]; 20 menit - Seal bawah tidak maksimal [mesin]; 60 menit - Ganti variant [design]; 113 menit - Setting awal [design]',
            downtime_mesin = 60,
            downtime_operator = 0,
            downtime_material = 0,
            downtime_design = 183,
            downtime_others = 20
        WHERE id = 50
    """))
    
    db.session.commit()
    
    # Verify
    result = db.session.execute(db.text("""
        SELECT id, product_id, good_quantity, downtime_minutes,
               downtime_mesin, downtime_design, downtime_others
        FROM shift_productions
        WHERE production_date = '2026-02-02' AND machine_id = 4 AND shift = 'shift_1'
        ORDER BY id
    """)).fetchall()
    
    print("\nAfter fix:")
    for sp in result:
        total_breakdown = (sp[4] or 0) + (sp[5] or 0) + (sp[6] or 0)
        print(f"  SP ID:{sp[0]} | Product:{sp[1]} | Good:{sp[2]} | downtime_minutes:{sp[3]} | breakdown total:{total_breakdown}")
    
    print("\n✅ Done!")
