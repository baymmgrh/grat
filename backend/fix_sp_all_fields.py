"""
Fix ShiftProduction data - sync all fields from ProductionRecord
"""
from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("=" * 80)
    print("Checking ProductionRecord data for 2026-02-02...")
    print("=" * 80)
    
    # Get all production records with all fields
    pr_records = db.session.execute(db.text("""
        SELECT pr.id, pr.production_date, pr.shift, pr.work_order_id, pr.product_id,
               pr.quantity_good, pr.quantity_produced, pr.quantity_scrap,
               wo.machine_id
        FROM production_records pr
        LEFT JOIN work_orders wo ON pr.work_order_id = wo.id
        WHERE CAST(pr.production_date AS DATE) = '2026-02-02'
        ORDER BY wo.machine_id, pr.shift, pr.id
    """)).fetchall()
    
    print(f"\nProductionRecord data ({len(pr_records)} records):")
    for pr in pr_records:
        print(f"  PR ID:{pr[0]} | Shift:{pr[2]} | Machine:{pr[8]} | Product:{pr[4]} | Good:{pr[5]} | Total:{pr[6]} | Reject:{pr[7]}")
    
    # Get ShiftProduction records
    print("\n" + "=" * 80)
    print("ShiftProduction data (before fix):")
    print("=" * 80)
    sp_records = db.session.execute(db.text("""
        SELECT sp.id, sp.shift, sp.machine_id, sp.product_id, 
               sp.good_quantity, sp.actual_quantity, sp.reject_quantity, sp.rework_quantity,
               sp.setting_sticker, sp.setting_packaging,
               p.name as product_name
        FROM shift_productions sp
        LEFT JOIN products p ON sp.product_id = p.id
        WHERE sp.production_date = '2026-02-02'
        ORDER BY sp.machine_id, sp.shift, sp.id
    """)).fetchall()
    
    for sp in sp_records:
        print(f"  SP ID:{sp[0]} | Shift:{sp[1]} | Product:{sp[3]} ({sp[10]}) | Good:{sp[4]} | Total:{sp[5]} | Reject:{sp[6]} | Rework:{sp[7]} | Sticker:{sp[8]} | Packaging:{sp[9]}")
