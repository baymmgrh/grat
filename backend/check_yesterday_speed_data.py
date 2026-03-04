#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Checking machine speed data for 2026-01-28 (yesterday)...")
    
    try:
        # Get data for yesterday with update times
        result = db.session.execute(db.text("""
            SELECT sp.machine_id, sp.shift, sp.machine_speed, sp.production_date,
                   sp.created_at, sp.updated_at,
                   m.name as machine_name
            FROM shift_productions sp
            LEFT JOIN machines m ON sp.machine_id = m.id
            WHERE sp.production_date = '2026-01-28'
            ORDER BY sp.machine_id, sp.shift
        """)).fetchall()
        
        print(f"Data for 2026-01-28:")
        
        # Group by machine
        machines = {}
        for row in result:
            machine_id = row[0]
            if machine_id not in machines:
                machines[machine_id] = {
                    'name': row[6] or f"Machine {machine_id}",
                    'shifts': []
                }
            machines[machine_id]['shifts'].append({
                'shift': row[1],
                'speed': row[2] or 0,
                'created_at': row[4],
                'updated_at': row[5]
            })
        
        # Display each machine's data
        for machine_id, machine_data in machines.items():
            print(f"\n{machine_data['name']} (ID: {machine_id}):")
            total_speed = 0
            for shift_data in machine_data['shifts']:
                speed = shift_data['speed']
                total_speed += speed
                print(f"  Shift {shift_data['shift']}: speed = {speed}")
                print(f"    Created: {shift_data['created_at']}")
                print(f"    Updated: {shift_data['updated_at']}")
            
            if len(machine_data['shifts']) > 0:
                avg_speed = total_speed / len(machine_data['shifts'])
                print(f"  Total: {total_speed}, Average: {avg_speed}")
                
                # Check if this is the problematic case
                if len(machine_data['shifts']) == 2 and total_speed == 40:
                    if avg_speed == 20:
                        print(f"  ✅ CORRECT: 40/2 = 20")
                    else:
                        print(f"  ⚠️  ERROR: 40/2 = {avg_speed} (should be 20)")
                        print(f"  🚨 This explains the 8 menit waktu tidak tercatat!")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
