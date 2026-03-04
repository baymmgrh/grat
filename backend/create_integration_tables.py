"""
Script to create integration tables directly using SQLAlchemy
Run this script to create the new tables for:
- ProductionApproval
- Invoice links (work_order_id, production_approval_id)
- Product links (rd_development_id)
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db

def create_tables():
    app = create_app()
    
    with app.app_context():
        # Import all models to ensure they're registered
        from models.production import ProductionApproval
        from models.finance import Invoice
        from models.product import Product
        
        # Create all tables
        db.create_all()
        
        print("✓ Tables created/updated successfully!")
        
        # Verify production_approvals table exists
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        
        if 'production_approvals' in tables:
            print("✓ production_approvals table exists")
            columns = [col['name'] for col in inspector.get_columns('production_approvals')]
            print(f"  Columns: {', '.join(columns[:5])}...")
        else:
            print("✗ production_approvals table NOT found")
        
        # Check invoices table for new columns
        if 'invoices' in tables:
            columns = [col['name'] for col in inspector.get_columns('invoices')]
            if 'work_order_id' in columns:
                print("✓ invoices.work_order_id column exists")
            else:
                print("✗ invoices.work_order_id column NOT found - may need manual ALTER TABLE")
            
            if 'production_approval_id' in columns:
                print("✓ invoices.production_approval_id column exists")
            else:
                print("✗ invoices.production_approval_id column NOT found - may need manual ALTER TABLE")
        
        # Check products table for rd_development_id
        if 'products' in tables:
            columns = [col['name'] for col in inspector.get_columns('products')]
            if 'rd_development_id' in columns:
                print("✓ products.rd_development_id column exists")
            else:
                print("✗ products.rd_development_id column NOT found - may need manual ALTER TABLE")

if __name__ == '__main__':
    create_tables()
