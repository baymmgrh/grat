"""
Add missing columns to work_rosters table using Flask app context
Run: python migrate_work_roster.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db

def migrate():
    app = create_app()
    with app.app_context():
        # Add missing columns using raw SQL
        try:
            db.session.execute(db.text("ALTER TABLE work_rosters ADD COLUMN week_start_date DATE"))
            print("Added: week_start_date")
        except Exception as e:
            if 'duplicate column' in str(e).lower() or 'already exists' in str(e).lower():
                print("Column week_start_date already exists")
            else:
                print(f"week_start_date: {e}")
        
        try:
            db.session.execute(db.text("ALTER TABLE work_rosters ADD COLUMN week_end_date DATE"))
            print("Added: week_end_date")
        except Exception as e:
            if 'duplicate column' in str(e).lower() or 'already exists' in str(e).lower():
                print("Column week_end_date already exists")
            else:
                print(f"week_end_date: {e}")
        
        db.session.commit()
        print("Migration completed!")

if __name__ == '__main__':
    migrate()
