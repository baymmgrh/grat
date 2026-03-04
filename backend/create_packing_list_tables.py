"""
Script to create packing_lists and packing_list_items tables
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    # Create only the packing list tables
    from models.production import PackingList, PackingListItem
    
    # Check if tables exist
    from sqlalchemy import inspect, text
    inspector = inspect(db.engine)
    existing_tables = inspector.get_table_names()
    
    tables_to_create = []
    if 'packing_lists' not in existing_tables:
        tables_to_create.append('packing_lists')
    if 'packing_list_items' not in existing_tables:
        tables_to_create.append('packing_list_items')
    
    if tables_to_create:
        print(f"Creating tables: {tables_to_create}")
        db.create_all()
        print("Tables created successfully!")
    else:
        print("Tables already exist.")
        # Check if start_carton_number column exists
        columns = [col['name'] for col in inspector.get_columns('packing_lists')]
        if 'start_carton_number' not in columns:
            print("Adding start_carton_number column...")
            db.session.execute(text('ALTER TABLE packing_lists ADD COLUMN start_carton_number INTEGER DEFAULT 1'))
            db.session.commit()
            print("Column added successfully!")
