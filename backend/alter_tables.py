"""
Script to add new columns to existing tables (SQLite compatible)
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db
from sqlalchemy import text, inspect

def column_exists(inspector, table_name, column_name):
    """Check if column exists in table"""
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

def alter_tables():
    app = create_app()
    
    with app.app_context():
        inspector = inspect(db.engine)
        
        # Add columns to invoices table
        if not column_exists(inspector, 'invoices', 'work_order_id'):
            try:
                db.session.execute(text("""
                    ALTER TABLE invoices ADD COLUMN work_order_id INTEGER REFERENCES work_orders(id)
                """))
                db.session.commit()
                print("✓ Added invoices.work_order_id")
            except Exception as e:
                db.session.rollback()
                print(f"✗ invoices.work_order_id: {e}")
        else:
            print("✓ invoices.work_order_id already exists")
        
        if not column_exists(inspector, 'invoices', 'production_approval_id'):
            try:
                db.session.execute(text("""
                    ALTER TABLE invoices ADD COLUMN production_approval_id INTEGER REFERENCES production_approvals(id)
                """))
                db.session.commit()
                print("✓ Added invoices.production_approval_id")
            except Exception as e:
                db.session.rollback()
                print(f"✗ invoices.production_approval_id: {e}")
        else:
            print("✓ invoices.production_approval_id already exists")
        
        # Add rd_development_id to products table
        if not column_exists(inspector, 'products', 'rd_development_id'):
            try:
                db.session.execute(text("""
                    ALTER TABLE products ADD COLUMN rd_development_id INTEGER REFERENCES product_developments(id)
                """))
                db.session.commit()
                print("✓ Added products.rd_development_id")
            except Exception as e:
                db.session.rollback()
                print(f"✗ products.rd_development_id: {e}")
        else:
            print("✓ products.rd_development_id already exists")
        
        print("\n✓ All ALTER TABLE commands executed!")

if __name__ == '__main__':
    alter_tables()
