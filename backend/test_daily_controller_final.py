#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db, User

app = create_app()

with app.app_context():
    print("Testing Daily Controller with proper auth...")
    
    try:
        with app.test_client() as client:
            # Get a real user and create token
            user = User.query.first()
            if user:
                from flask_jwt_extended import create_access_token
                token = create_access_token(identity=user.id)
                
                response = client.get(
                    '/api/oee/daily-controller?date=2026-01-29',
                    headers={'Authorization': f'Bearer {token}'}
                )
                
                print(f"✓ Response status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.get_json()
                    machines = data.get('machines', {})
                    print(f"✓ Success! Machines returned: {len(machines)}")
                    
                    for machine_id, machine_data in list(machines.items())[:3]:  # Show first 3
                        tidak_tercatat = machine_data.get('waktu_tidak_tercatat', 'N/A')
                        tercatat = machine_data.get('waktu_tercatat', 'N/A')
                        print(f"  - Machine {machine_id}: tercatat={tercatat}, tidak_tercatat={tidak_tercatat}")
                else:
                    print(f"✗ Error: {response.get_data(as_text=True)}")
            else:
                print("✗ No users found in database")
                
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
