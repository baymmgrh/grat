from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("=" * 80)
    print("ShiftProduction records for 2026-02-02:")
    print("=" * 80)
    result = db.session.execute(db.text("""
        SELECT sp.id, sp.production_date, sp.shift, sp.machine_id, sp.product_id, 
               sp.good_quantity, sp.actual_quantity, sp.planned_runtime,
               p.name as product_name
        FROM shift_productions sp
        LEFT JOIN products p ON sp.product_id = p.id
        WHERE sp.production_date = '2026-02-02' 
        ORDER BY sp.machine_id, sp.shift, sp.id
    """)).fetchall()
    
    for r in result:
        print(f"ID:{r[0]} | Shift:{r[2]} | Machine:{r[3]} | Product:{r[4]} ({r[8]}) | Good:{r[5]} | Total:{r[6]} | Planned:{r[7]}")
    
    print("\n" + "=" * 80)
    print("ProductionRecord records (all):")
    print("=" * 80)
    result2 = db.session.execute(db.text("""
        SELECT pr.id, pr.production_date, pr.shift, pr.work_order_id, pr.product_id,
               pr.quantity_good, pr.quantity_produced,
               p.name as product_name,
               wo.machine_id
        FROM production_records pr
        LEFT JOIN products p ON COALESCE(pr.product_id, (SELECT product_id FROM work_orders WHERE id = pr.work_order_id)) = p.id
        LEFT JOIN work_orders wo ON pr.work_order_id = wo.id
        ORDER BY pr.production_date DESC, wo.machine_id, pr.shift, pr.id
        LIMIT 20
    """)).fetchall()
    
    for r in result2:
        print(f"ID:{r[0]} | Date:{r[1]} | Shift:{r[2]} | Machine:{r[8]} | WO:{r[3]} | Product:{r[4]} ({r[7]}) | Good:{r[5]} | Total:{r[6]}")
