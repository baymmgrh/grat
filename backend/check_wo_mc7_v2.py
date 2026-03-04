import sys
sys.path.insert(0, '.')
from app import create_app
from models.production import WorkOrder

app = create_app()
with app.app_context():
    # Get WO columns first
    cols = [c.name for c in WorkOrder.__table__.columns]
    print("WO columns:", cols)
    
    wos = WorkOrder.query.filter_by(machine_id=7).order_by(WorkOrder.id.desc()).limit(10).all()
    print("\nRecent WOs for Machine 7:")
    for wo in wos:
        prod_name = wo.product.name if wo.product else "?"
        print(f"  WO#{wo.id} | Status: {wo.status} | Product: {prod_name}")
        print(f"    Qty: {wo.quantity} | Produced: {wo.quantity_produced}")
