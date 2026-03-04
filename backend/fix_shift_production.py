"""
Script to sync ShiftProduction with ProductionRecord data
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db
from models.production import ShiftProduction, ProductionRecord
from sqlalchemy import text

def fix_shift_production():
    app = create_app()
    
    with app.app_context():
        # Use raw SQL to avoid event listeners
        with db.engine.connect() as conn:
            # Get current values
            result = conn.execute(text("""
                SELECT sp.id, sp.good_quantity, sp.actual_quantity, sp.quality_rate, sp.oee_score,
                       pr.quantity_good, pr.quantity_produced, pr.quantity_scrap, pr.downtime_minutes
                FROM shift_productions sp
                JOIN production_records pr ON sp.work_order_id = pr.work_order_id 
                    AND DATE(sp.production_date) = DATE(pr.production_date)
                WHERE sp.work_order_id = 16
            """))
            
            rows = result.fetchall()
            for row in rows:
                print(f"SP id={row[0]}: good={row[1]}, actual={row[2]} -> PR good={row[5]}, produced={row[6]}")
            
            # Update ShiftProduction with ProductionRecord values
            conn.execute(text("""
                UPDATE shift_productions 
                SET good_quantity = 12792, 
                    actual_quantity = 13002, 
                    reject_quantity = 10,
                    rework_quantity = 200,
                    quality_rate = ROUND((12792.0 / 13002.0) * 100, 2),
                    efficiency_rate = ROUND(((480.0 - 219.0) / 480.0) * 100, 2),
                    oee_score = ROUND((((480.0 - 219.0) / 480.0) * 100) * ((12792.0 / 13002.0) * 100) / 100, 2)
                WHERE work_order_id = 16
            """))
            conn.commit()
            
            # Verify
            result = conn.execute(text("""
                SELECT id, good_quantity, actual_quantity, quality_rate, oee_score 
                FROM shift_productions WHERE work_order_id = 16
            """))
            row = result.fetchone()
            print(f"\nAFTER UPDATE: id={row[0]}, good={row[1]}, actual={row[2]}, quality={row[3]}, oee={row[4]}")
            
        print("\n✅ ShiftProduction updated successfully!")

if __name__ == '__main__':
    fix_shift_production()
