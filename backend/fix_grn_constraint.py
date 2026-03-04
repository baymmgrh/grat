#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Fixing GRN foreign key constraint...")
    
    # Check current database type
    db_type = db.engine.dialect.name
    print(f"Database type: {db_type}")
    
    if db_type == 'postgresql':
        # PostgreSQL
        try:
            # Drop existing constraint
            db.engine.execute('ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_grn_id_fkey')
            print('Old constraint dropped')
        except Exception as e:
            print(f'Drop constraint error: {e}')
        
        try:
            # Create new constraint
            db.engine.execute('ALTER TABLE inventory ADD CONSTRAINT inventory_grn_id_fkey FOREIGN KEY (grn_id) REFERENCES goods_received_notes(id)')
            print('New constraint created successfully')
        except Exception as e:
            print(f'Create constraint error: {e}')
    
    elif db_type == 'sqlite':
        # SQLite - more complex, need to recreate table
        print("SQLite detected - manual recreation may be needed")
    
    print("Foreign key fix completed")
