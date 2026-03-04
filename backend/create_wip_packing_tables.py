"""
Script to create WIP Stock and Packing List New tables
"""
from app import create_app
from models import db

app = create_app()

with app.app_context():
    # Create only the new tables
    from models.production import WIPStock, WIPStockMovement, PackingListNew, PackingListNewItem
    
    # Check if tables exist
    inspector = db.inspect(db.engine)
    existing_tables = inspector.get_table_names()
    
    tables_to_create = []
    
    if 'wip_stocks' not in existing_tables:
        tables_to_create.append(WIPStock.__table__)
        print("Will create: wip_stocks")
    else:
        print("Table wip_stocks already exists")
    
    if 'wip_stock_movements' not in existing_tables:
        tables_to_create.append(WIPStockMovement.__table__)
        print("Will create: wip_stock_movements")
    else:
        print("Table wip_stock_movements already exists")
    
    if 'packing_lists_new' not in existing_tables:
        tables_to_create.append(PackingListNew.__table__)
        print("Will create: packing_lists_new")
    else:
        print("Table packing_lists_new already exists")
    
    if 'packing_list_new_items' not in existing_tables:
        tables_to_create.append(PackingListNewItem.__table__)
        print("Will create: packing_list_new_items")
    else:
        print("Table packing_list_new_items already exists")
    
    if tables_to_create:
        for table in tables_to_create:
            table.create(db.engine, checkfirst=True)
        print(f"\n✓ Created {len(tables_to_create)} tables successfully!")
    else:
        print("\n✓ All tables already exist!")
