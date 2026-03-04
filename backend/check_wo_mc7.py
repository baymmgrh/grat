import sys
sys.path.insert(0, '.')
from app import create_app
from models.production import WorkOrder, Machine
from datetime import date

app = create_app()
with app.app_context():
    # Find WOs for machine 7
    wos = WorkOrder.query.filter_by(machine_id=7).order_by(WorkOrder.id.desc()).limit(10).all()
    print("Recent WOs for Machine 7:")
    for wo in wos:
        prod_name = wo.product.name if wo.product else "?"
        print(f"  WO#{wo.id} | Status: {wo.status} | Product: {prod_name}")
        print(f"    Qty: {wo.quantity} | Produced: {wo.quantity_produced} | Due: {wo.due_date}")
        print(f"    Start: {wo.start_date} | End: {wo.end_date}")
        print()
