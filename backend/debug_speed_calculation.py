#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Debugging machine speed calculation logic...")
    
    # Simulate the exact logic from daily controller
    try:
        # Get Mesin 7 data for 2026-01-28
        result = db.session.execute(db.text("""
            SELECT sp.machine_id, sp.shift, sp.machine_speed, sp.production_date,
                   m.name as machine_name
            FROM shift_productions sp
            LEFT JOIN machines m ON sp.machine_id = m.id
            WHERE sp.production_date = '2026-01-28' AND sp.machine_id = 6
            ORDER BY sp.shift
        """)).fetchall()
        
        print(f"Mesin 7 data for 2026-01-28:")
        
        # Simulate machines_data structure
        machines_data = {
            '6': {
                'shifts': [],
                'total_machine_speed': 0
            }
        }
        
        total_speed = 0
        for row in result:
            shift_num = 1 if 'shift_1' in str(row[1]) else 2
            shift_speed = int(row[2]) if row[2] else 0
            total_speed += shift_speed
            
            machines_data['6']['shifts'].append({
                'shift': shift_num,
                'machine_speed': shift_speed
            })
            
            print(f"  Shift {shift_num}: speed = {shift_speed}")
        
        # Apply the exact logic from daily controller
        machines_data['6']['total_machine_speed'] += total_speed
        shift_count = len(machines_data['6']['shifts'])
        
        print(f"\nDaily Controller Logic:")
        print(f"  machine_speed_total = {machines_data['6']['total_machine_speed']}")
        print(f"  shift_count = {shift_count}")
        
        machine_speed_per_minute = machines_data['6']['total_machine_speed'] / shift_count if shift_count > 0 else 0
        
        print(f"  machine_speed_per_minute = {machines_data['6']['total_machine_speed']} / {shift_count} = {machine_speed_per_minute}")
        
        # Check if it's integer
        if machine_speed_per_minute.is_integer():
            print(f"  ✅ Result is integer: {int(machine_speed_per_minute)}")
        else:
            print(f"  ⚠️  Result is float: {machine_speed_per_minute}")
            print(f"  Rounded: {round(machine_speed_per_minute)}")
            print(f"  Int cast: {int(machine_speed_per_minute)}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
