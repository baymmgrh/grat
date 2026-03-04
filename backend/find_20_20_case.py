#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Checking ALL machine speed data to find 20+20=21 case...")
    
    try:
        # Get all recent data with speed = 20
        result = db.session.execute(db.text("""
            SELECT sp.machine_id, sp.shift, sp.machine_speed, sp.production_date,
                   m.name as machine_name
            FROM shift_productions sp
            LEFT JOIN machines m ON sp.machine_id = m.id
            WHERE sp.machine_speed = 20 AND sp.production_date >= '2026-01-27'
            ORDER BY sp.production_date DESC, sp.machine_id, sp.shift
        """)).fetchall()
        
        print(f"Found {len(result)} records with speed = 20:")
        
        # Group by machine and date
        machines = {}
        for row in result:
            key = f"{row[0]}_{row[3]}"  # machine_id_date
            if key not in machines:
                machines[key] = {
                    'machine_id': row[0],
                    'name': row[4] or f"Machine {row[0]}",
                    'date': row[3],
                    'shifts': []
                }
            machines[key]['shifts'].append({
                'shift': row[1],
                'speed': row[2]
            })
        
        # Look for machines with multiple shifts of speed 20
        found_20_20 = False
        for key, machine_data in machines.items():
            if len(machine_data['shifts']) >= 2:
                all_20 = all(shift['speed'] == 20 for shift in machine_data['shifts'])
                if all_20:
                    found_20_20 = True
                    print(f"\n🎯 FOUND: {machine_data['name']} (ID: {machine_data['machine_id']}) - {machine_data['date']}:")
                    for shift_data in machine_data['shifts']:
                        print(f"  Shift {shift_data['shift']}: speed = {shift_data['speed']}")
                    
                    total_speed = 20 * len(machine_data['shifts'])
                    avg_speed = total_speed / len(machine_data['shifts'])
                    print(f"  Total: {total_speed}, Average: {avg_speed}")
                    
                    if avg_speed != 20:
                        print(f"  ⚠️  ERROR: Should be 20, but calculated as {avg_speed}")
        
        if not found_20_20:
            print("\n❌ No machine found with multiple shifts all having speed = 20")
            print("\nAll machines with speed 20 (single shift only):")
            for key, machine_data in machines.items():
                if len(machine_data['shifts']) == 1:
                    print(f"  {machine_data['name']} - {machine_data['date']}: 1 shift only")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
