#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Checking CURRENT machine speed data after user edit...")
    
    try:
        # Get the most recent data for today
        result = db.session.execute(db.text("""
            SELECT sp.machine_id, sp.shift, sp.machine_speed, sp.production_date,
                   sp.created_at, sp.updated_at,
                   m.name as machine_name
            FROM shift_productions sp
            LEFT JOIN machines m ON sp.machine_id = m.id
            WHERE sp.production_date >= '2026-01-29'
            ORDER BY sp.updated_at DESC, sp.machine_id, sp.shift
            LIMIT 10
        """)).fetchall()
        
        print(f"Recent shift productions (ordered by updated_at):")
        
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
                'speed': row[2] or 0,
                'created_at': row[4],
                'updated_at': row[5]
            })
        
        # Display each machine's data
        for key, machine_data in machines.items():
            print(f"\n{machine_data['name']} (ID: {machine_data['machine_id']}) - {machine_data['date']}:")
            total_speed = 0
            for shift_data in machine_data['shifts']:
                speed = shift_data['speed']
                total_speed += speed
                print(f"  Shift {shift_data['shift']}: speed = {speed} (updated: {shift_data['updated_at']})")
            
            if len(machine_data['shifts']) > 0:
                avg_speed = total_speed / len(machine_data['shifts'])
                print(f"  Total: {total_speed}, Average: {avg_speed}")
                
                if total_speed == 40 and avg_speed != 20:
                    print(f"  ⚠️  ERROR: 40/{len(machine_data['shifts'])} = {avg_speed} (should be 20)")
                elif total_speed == 40 and avg_speed == 20:
                    print(f"  ✅ CORRECT: 40/2 = 20")
        
        # Also check if there are any duplicate records
        print(f"\nChecking for duplicate records...")
        duplicate_check = db.session.execute(db.text("""
            SELECT machine_id, production_date, shift, COUNT(*) as count
            FROM shift_productions 
            WHERE production_date >= '2026-01-29'
            GROUP BY machine_id, production_date, shift
            HAVING COUNT(*) > 1
        """)).fetchall()
        
        if duplicate_check:
            print(f"⚠️  Found duplicate records:")
            for dup in duplicate_check:
                print(f"  Machine {dup[0]}, Date {dup[1]}, Shift {dup[2]}: {dup[3]} records")
        else:
            print("✅ No duplicate records found")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
