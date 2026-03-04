#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db, Inventory

app = create_app()

with app.app_context():
    print("Testing inventory model...")
    
    # Try to create a simple inventory record to test the model
    try:
        # Test if model can be instantiated without errors
        test_inventory = Inventory()
        print("✓ Inventory model instantiated successfully")
        
        # Test database connection
        result = db.session.execute(db.text("SELECT COUNT(*) FROM inventory")).fetchone()
        print(f"✓ Database connection OK, inventory records: {result[0]}")
        
        print("✓ All tests passed - model should work correctly")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
