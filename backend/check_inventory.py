#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db, Inventory

app = create_app()

with app.app_context():
    print("Fixing GRN foreign key for SQLite...")
    
    # For SQLite, we need to recreate the table without the constraint
    # or make the constraint nullable and not enforced
    
    # Check if table exists and get its structure
    inspector = db.inspect(db.engine)
    columns = inspector.get_columns('inventory')
    
    print("Current inventory table columns:")
    for col in columns:
        print(f"  - {col['name']}: {col['type']}")
    
    # Get foreign key constraints
    fks = inspector.get_foreign_keys('inventory')
    print("\nCurrent foreign keys:")
    for fk in fks:
        print(f"  - {fk}")
    
    # For SQLite, we'll just remove the constraint by making the column nullable
    # SQLite doesn't enforce foreign keys by default unless PRAGMA foreign_keys = ON
    
    print("\nFor SQLite, foreign keys are not enforced by default.")
    print("The error might be from SQLAlchemy validation, not actual database constraint.")
    print("Trying to proceed with production input...")
