"""
Script to create work_order_bom_items table
Run this script to add the table for Work Order specific BOM items
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db
from models.work_order_bom import WorkOrderBOMItem

def create_wo_bom_table():
    app = create_app()
    with app.app_context():
        # Create the table
        db.create_all()
        print("✅ work_order_bom_items table created successfully!")
        
        # Verify table exists
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        
        if 'work_order_bom_items' in tables:
            print("✅ Table 'work_order_bom_items' verified in database")
            
            # Show columns
            columns = inspector.get_columns('work_order_bom_items')
            print("\nTable columns:")
            for col in columns:
                print(f"  - {col['name']}: {col['type']}")
        else:
            print("❌ Table 'work_order_bom_items' not found!")

if __name__ == '__main__':
    create_wo_bom_table()
