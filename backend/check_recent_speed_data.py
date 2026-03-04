#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Checking recent machine speed data...")
    
    try:
        # Get recent shift data
        result = db.session.execute(db.text("""
            SELECT sp.machine_id, sp.shift, sp.machine_speed, sp.production_date,
                   m.name as machine_name
            FROM shift_productions sp
            LEFT JOIN machines m ON sp.machine_id = m.id
            WHERE sp.production_date >= '2026-01-27'
            ORDER BY sp.production_date DESC, sp.machine_id, sp.shift
            LIMIT 20
        """)).fetchall()
        
        print(f"Found {len(result)} recent shift records:")
        
        # Group by machine and date
        data = {}
        for row in result:
            key = f"{row[0]}_{row[3]}"  # machine_id_date
            if key not in data:
                data[key] = {
                    'machine_id': row[0],
                    'name': row[4] or f"Machine {row[0]}",
                    'date': row[3],
                    'shifts': []
                }
            data[key]['shifts'].append({
                'shift': row[1],
                'speed': row[2] or 0
            })
        
        # Display each machine's data
        for key, machine_data in data.items():
            print(f"\n{machine_data['name']} (ID: {machine_data['machine_id']}) - {machine_data['date']}:")
            total_speed = 0
            for shift_data in machine_data['shifts']:
                speed = shift_data['speed']
                total_speed += speed
                print(f"  Shift {shift_data['shift']}: speed = {speed}")
            
            if len(machine_data['shifts']) > 0:
                avg_speed = total_speed / len(machine_data['shifts'])
                print(f"  Total: {total_speed}, Average: {avg_speed}")
                
                # Check calculation
                if total_speed == 40 and avg_speed != 20:
                    print(f"  ⚠️  ERROR: 40/{len(machine_data['shifts'])} = {avg_speed} (should be 20)")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
