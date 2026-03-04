#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db
from datetime import date

app = create_app()

with app.app_context():
    print("Checking actual machine speed data in database...")
    
    try:
        # Get actual shift data for today
        result = db.session.execute(db.text("""
            SELECT sp.machine_id, sp.shift, sp.machine_speed, sp.production_date,
                   m.name as machine_name
            FROM shift_productions sp
            LEFT JOIN machines m ON sp.machine_id = m.id
            WHERE sp.production_date = '2026-01-29'
            ORDER BY sp.machine_id, sp.shift
        """)).fetchall()
        
        print(f"Found {len(result)} shift records for 2026-01-29:")
        
        # Group by machine
        machines = {}
        for row in result:
            machine_id = row[0]
            if machine_id not in machines:
                machines[machine_id] = {
                    'name': row[4] or f"Machine {machine_id}",
                    'shifts': []
                }
            machines[machine_id]['shifts'].append({
                'shift': row[1],
                'speed': row[2] or 0
            })
        
        # Display each machine's data
        for machine_id, data in machines.items():
            print(f"\n{data['name']} (ID: {machine_id}):")
            total_speed = 0
            for shift_data in data['shifts']:
                speed = shift_data['speed']
                total_speed += speed
                print(f"  Shift {shift_data['shift']}: speed = {speed}")
            
            if len(data['shifts']) > 0:
                avg_speed = total_speed / len(data['shifts'])
                print(f"  Total: {total_speed}, Average: {avg_speed}")
                
                # Check if this matches the calculation
                if avg_speed == 21 and total_speed == 40:
                    print(f"  ⚠️  WARNING: 40/2 = 20, but showing {avg_speed}!")
                elif avg_speed != 21 and total_speed == 40:
                    print(f"  ✅ CORRECT: 40/2 = {avg_speed}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
