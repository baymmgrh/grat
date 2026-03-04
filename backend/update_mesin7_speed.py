#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Updating Mesin 7 speed to 20+20 for testing...")
    
    try:
        # Update both shifts to speed 20
        result = db.session.execute(db.text("""
            UPDATE shift_productions 
            SET machine_speed = 20, updated_at = datetime('now')
            WHERE machine_id = 6 AND production_date = '2026-01-28'
        """))
        
        db.session.commit()
        
        print(f"✅ Updated {result.rowcount} records")
        
        # Verify the update
        verify = db.session.execute(db.text("""
            SELECT sp.shift, sp.machine_speed, sp.updated_at
            FROM shift_productions sp
            WHERE sp.machine_id = 6 AND sp.production_date = '2026-01-28'
            ORDER BY sp.shift
        """)).fetchall()
        
        print("\nUpdated data:")
        total_speed = 0
        for row in verify:
            speed = row[1]
            total_speed += speed
            print(f"  Shift {row[0]}: speed = {speed} (updated: {row[2]})")
        
        avg_speed = total_speed / len(verify)
        print(f"\nTotal: {total_speed}, Average: {avg_speed}")
        
        if avg_speed == 20:
            print("✅ CORRECT: 40/2 = 20")
        else:
            print(f"⚠️  Still wrong: {avg_speed}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.session.rollback()
        import traceback
        traceback.print_exc()
