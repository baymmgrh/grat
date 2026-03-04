#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db
from datetime import date

app = create_app()

with app.app_context():
    print("Testing Daily Controller after column addition...")
    
    try:
        # Test accessing some shift production data
        result = db.session.execute(db.text("""
            SELECT COUNT(*) as count, 
                   COALESCE(SUM(waktu_tidak_tercatat), 0) as total_waktu_tidak_tercatat
            FROM shift_productions 
            WHERE production_date = '2026-01-29'
        """)).fetchone()
        
        print(f"✓ Shift productions for 2026-01-29: {result[0]} records")
        print(f"✓ Total waktu_tidak_tercatat: {result[1]} minutes")
        
        # Test the daily controller endpoint
        with app.test_client() as client:
            # Create a test token
            from flask_jwt_extended import create_access_token
            token = create_access_token(identity=1)
            
            response = client.get(
                '/api/oee/daily-controller?date=2026-01-29',
                headers={'Authorization': f'Bearer {token}'}
            )
            
            print(f"✓ Daily Controller response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.get_json()
                machines = data.get('machines', {})
                print(f"✓ Machines returned: {len(machines)}")
                
                for machine_id, machine_data in machines.items():
                    tidak_tercatat = machine_data.get('waktu_tidak_tercatat', 'N/A')
                    print(f"  - Machine {machine_id}: waktu_tidak_tercatat = {tidak_tercatat}")
            else:
                print(f"✗ Error response: {response.get_data(as_text=True)}")
                
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
