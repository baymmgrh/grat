"""
Add source_type and schedule_grid_id columns to work_orders table
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db
from sqlalchemy import text

def add_columns():
    app = create_app()
    with app.app_context():
        try:
            # Check if columns exist
            result = db.session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'work_orders' AND column_name = 'source_type'
            """))
            
            if result.fetchone():
                print("Columns already exist")
                return
            
            # Add source_type column
            db.session.execute(text("""
                ALTER TABLE work_orders 
                ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'manual'
            """))
            print("Added source_type column")
            
            # Add schedule_grid_id column
            db.session.execute(text("""
                ALTER TABLE work_orders 
                ADD COLUMN IF NOT EXISTS schedule_grid_id INTEGER
            """))
            print("Added schedule_grid_id column")
            
            db.session.commit()
            print("Migration completed successfully!")
            
        except Exception as e:
            db.session.rollback()
            print(f"Error: {e}")
            
            # Try SQLite syntax
            try:
                db.session.execute(text("""
                    ALTER TABLE work_orders ADD COLUMN source_type VARCHAR(50) DEFAULT 'manual'
                """))
                db.session.execute(text("""
                    ALTER TABLE work_orders ADD COLUMN schedule_grid_id INTEGER
                """))
                db.session.commit()
                print("Migration completed successfully (SQLite)!")
            except Exception as e2:
                print(f"SQLite Error: {e2}")

if __name__ == '__main__':
    add_columns()
