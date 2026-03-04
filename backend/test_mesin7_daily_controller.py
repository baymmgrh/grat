#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db, User

app = create_app()

with app.app_context():
    print("Testing Daily Controller with Mesin 7 data (2026-01-28)...")
    
    try:
        with app.test_client() as client:
            # Get a real user and create token
            user = User.query.first()
            if user:
                from flask_jwt_extended import create_access_token
                token = create_access_token(identity=user.id)
                
                response = client.get(
                    '/api/oee/daily-controller?date=2026-01-28',
                    headers={'Authorization': f'Bearer {token}'}
                )
                
                print(f"Response status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.get_json()
                    machines = data.get('machines', {})
                    
                    # Look for Mesin 7 (ID: 6)
                    if '6' in machines:
                        machine_data = machines['6']
                        print(f"\nMesin 7 Results:")
                        print(f"  Machine Speed: {machine_data.get('machine_speed', 'N/A')}")
                        print(f"  Total Machine Speed: {machine_data.get('total_machine_speed', 'N/A')}")
                        print(f"  Shift Count: {len(machine_data.get('shifts', []))}")
                        
                        shifts = machine_data.get('shifts', [])
                        for shift in shifts:
                            print(f"  Shift {shift.get('shift')}: speed = {shift.get('machine_speed', 'N/A')}")
                        
                        # Manual calculation
                        total_speed = sum(shift.get('machine_speed', 0) for shift in shifts)
                        expected_avg = total_speed / len(shifts) if shifts else 0
                        actual_speed = machine_data.get('machine_speed', 0)
                        
                        print(f"\nCalculation:")
                        print(f"  Total: {total_speed}")
                        print(f"  Expected Average: {total_speed}/{len(shifts)} = {expected_avg}")
                        print(f"  Actual Displayed: {actual_speed}")
                        
                        if expected_avg != actual_speed:
                            print(f"  ⚠️  MISMATCH! Expected {expected_avg}, got {actual_speed}")
                        else:
                            print(f"  ✅ CORRECT!")
                    else:
                        print("Mesin 7 not found in results")
                else:
                    print(f"Error: {response.get_data(as_text=True)}")
            else:
                print("No users found")
                
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
