#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db
from datetime import date

app = create_app()

with app.app_context():
    print("Testing Daily Controller...")
    
    try:
        # Test the daily controller logic directly
        from routes.oee import daily_controller
        
        # Create a mock request
        from flask import Flask
        with app.test_request_context('/api/oee/daily-controller?date=2026-01-29'):
            # Mock JWT identity
            from flask_jwt_extended import create_access_token
            with app.test_request_context(headers={'Authorization': f'Bearer {create_access_token(identity=1)}'}):
                response = daily_controller()
                print("✓ Daily Controller executed successfully")
                print(f"Response status: {response[1]}")
                
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        
    # Check if the new field exists in database
    try:
        result = db.session.execute(db.text("PRAGMA table_info(shift_productions)")).fetchall()
        print("\nShiftProduction table columns:")
        for col in result:
            print(f"  - {col[1]}: {col[2]}")
            
        # Check if waktu_tidak_tercatat column exists
        has_waktu_tidak_tercatat = any(col[1] == 'waktu_tidak_tercatat' for col in result)
        print(f"\nHas 'waktu_tidak_tercatat' column: {has_waktu_tidak_tercatat}")
        
    except Exception as e:
        print(f"Database check error: {e}")
