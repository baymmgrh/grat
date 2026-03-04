#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Testing Daily Controller with simple request...")
    
    try:
        with app.test_client() as client:
            # Test without auth first to see the basic structure
            response = client.get('/api/oee/daily-controller?date=2026-01-29')
            print(f"✓ Response status (no auth): {response.status_code}")
            
            if response.status_code == 401:
                print("✓ Auth required - this is expected")
            else:
                print(f"Response data: {response.get_data(as_text=True)[:200]}...")
                
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        
    # Test the daily controller function name
    try:
        import routes.oee as oee_routes
        print("\n✓ OEE routes imported successfully")
        
        # Find all route functions
        for attr in dir(oee_routes):
            if 'daily' in attr.lower() and 'controller' in attr.lower():
                print(f"  - Found: {attr}")
                
    except Exception as e:
        print(f"Import error: {e}")
