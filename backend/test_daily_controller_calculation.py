#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Testing Daily Controller calculation with 20+20=20...")
    
    try:
        # Simulate the exact daily controller logic for Mesin 7
        # Get the updated data
        result = db.session.execute(db.text("""
            SELECT sp.machine_id, sp.shift, sp.machine_speed, sp.production_date,
                   sp.good_quantity, sp.downtime_minutes, sp.idle_time, sp.waktu_tidak_tercatat
            FROM shift_productions sp
            WHERE sp.machine_id = 6 AND sp.production_date = '2026-01-28'
            ORDER BY sp.shift
        """)).fetchall()
        
        print("Mesin 7 Data (2026-01-28):")
        
        # Simulate daily controller calculation
        total_grade_a = 0
        total_downtime = 0
        total_idle = 0
        total_machine_speed = 0
        user_waktu_tidak_tercatat = 0
        shift_count = 0
        
        for row in result:
            shift_num = 1 if 'shift_1' in str(row[1]) else 2
            grade_a = int(row[4]) if row[4] else 0
            downtime = int(row[5]) if row[5] else 0
            idle = int(row[6]) if row[6] else 0
            speed = int(row[7]) if row[7] else 0
            tidak_tercatat = int(row[8]) if row[8] else 0
            
            total_grade_a += grade_a
            total_downtime += downtime
            total_idle += idle
            total_machine_speed += speed
            user_waktu_tidak_tercatat += tidak_tercatat
            shift_count += 1
            
            print(f"  Shift {shift_num}: grade_a={grade_a}, downtime={downtime}, idle={idle}, speed={speed}, tidak_tercatat={tidak_tercatat}")
        
        print(f"\nDaily Controller Calculation:")
        print(f"  total_grade_a = {total_grade_a}")
        print(f"  total_downtime = {total_downtime}")
        print(f"  total_idle = {total_idle}")
        print(f"  total_machine_speed = {total_machine_speed}")
        print(f"  shift_count = {shift_count}")
        print(f"  user_waktu_tidak_tercatat = {user_waktu_tidak_tercatat}")
        
        # Calculate runtime
        import math
        machine_speed_per_minute = total_machine_speed / shift_count if shift_count > 0 else 0
        runtime = 0
        if machine_speed_per_minute > 0:
            runtime = int(math.floor(total_grade_a / machine_speed_per_minute + 0.5))
        
        print(f"\n  machine_speed_per_minute = {total_machine_speed} / {shift_count} = {machine_speed_per_minute}")
        print(f"  runtime = {total_grade_a} / {machine_speed_per_minute} = {runtime}")
        
        # Calculate average time and waktu tidak tercatat
        average_time = 510 * shift_count if shift_count > 0 else 510
        waktu_tercatat = runtime + total_downtime + total_idle
        
        print(f"\n  average_time (default) = 510 × {shift_count} = {average_time}")
        print(f"  waktu_tercatat = {runtime} + {total_downtime} + {total_idle} = {waktu_tercatat}")
        
        # Apply the new logic
        if user_waktu_tidak_tercatat > 0:
            waktu_tidak_tercatat = user_waktu_tidak_tercatat
            average_time = waktu_tercatat + waktu_tidak_tercatat
            print(f"  Using user input: waktu_tidak_tercatat = {waktu_tidak_tercatat}")
            print(f"  Adjusted average_time = {waktu_tercatat} + {waktu_tidak_tercatat} = {average_time}")
        else:
            waktu_tidak_tercatat = max(0, average_time - waktu_tercatat)
            print(f"  Calculated: waktu_tidak_tercatat = max(0, {average_time} - {waktu_tercatat}) = {waktu_tidak_tercatat}")
        
        print(f"\n🎯 Final Results:")
        print(f"  Machine Speed: {machine_speed_per_minute}")
        print(f"  Average Time: {average_time}")
        print(f"  Waktu Tercatat: {waktu_tercatat}")
        print(f"  Waktu Tidak Tercatat: {waktu_tidak_tercatat}")
        
        if waktu_tidak_tercatat == 0:
            print("  ✅ PERFECT! No waktu tidak tercatat!")
        else:
            print(f"  ⚠️  Still has {waktu_tidak_tercatat} menit waktu tidak tercatat")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
