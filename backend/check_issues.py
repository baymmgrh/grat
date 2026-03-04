"""
Check issues field in ShiftProduction
"""
from app import create_app
from models import db

app = create_app()

with app.app_context():
    result = db.session.execute(db.text("""
        SELECT id, product_id, good_quantity, downtime_minutes, issues,
               downtime_mesin, downtime_operator, downtime_material, downtime_design, downtime_others
        FROM shift_productions
        WHERE production_date = '2026-02-02' AND machine_id = 4 AND shift = 'shift_1'
        ORDER BY id
    """)).fetchall()
    
    for sp in result:
        print(f"SP ID:{sp[0]} | Product:{sp[1]} | Good:{sp[2]} | downtime_minutes:{sp[3]}")
        print(f"  issues: {sp[4][:100] if sp[4] else 'None'}...")
        print(f"  downtime_mesin:{sp[5]} | operator:{sp[6]} | material:{sp[7]} | design:{sp[8]} | others:{sp[9]}")
        print()
