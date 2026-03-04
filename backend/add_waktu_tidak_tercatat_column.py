#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Adding waktu_tidak_tercatat column to shift_productions table...")
    
    try:
        # Add the missing column
        db.session.execute(db.text("""
            ALTER TABLE shift_productions 
            ADD COLUMN waktu_tidak_tercatat INTEGER DEFAULT 0
        """))
        
        db.session.commit()
        print("✓ Column 'waktu_tidak_tercatat' added successfully")
        
        # Verify the column was added
        result = db.session.execute(db.text("PRAGMA table_info(shift_productions)")).fetchall()
        print("\nUpdated ShiftProduction table columns:")
        for col in result:
            if 'waktu' in col[1].lower() or 'time' in col[1].lower():
                print(f"  - {col[1]}: {col[2]}")
                
    except Exception as e:
        print(f"✗ Error: {e}")
        db.session.rollback()
        
        # Check if column already exists
        result = db.session.execute(db.text("PRAGMA table_info(shift_productions)")).fetchall()
        has_column = any(col[1] == 'waktu_tidak_tercatat' for col in result)
        if has_column:
            print("✓ Column already exists")
        else:
            print("✗ Column does not exist and failed to add")
