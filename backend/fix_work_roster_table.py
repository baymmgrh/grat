"""
Fix work_rosters table to match the model schema
Run: python fix_work_roster_table.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db

def fix_table():
    app = create_app()
    with app.app_context():
        # Drop old tables and recreate
        print("Dropping old work roster tables...")
        
        try:
            db.session.execute(db.text("DROP TABLE IF EXISTS work_roster_assignments"))
            print("Dropped: work_roster_assignments")
        except Exception as e:
            print(f"work_roster_assignments: {e}")
        
        try:
            db.session.execute(db.text("DROP TABLE IF EXISTS work_rosters"))
            print("Dropped: work_rosters")
        except Exception as e:
            print(f"work_rosters: {e}")
        
        db.session.commit()
        
        # Recreate tables from model
        print("\nRecreating tables from model...")
        from models.hr_extended import WorkRoster, WorkRosterAssignment
        
        # Create work_rosters table
        db.session.execute(db.text("""
            CREATE TABLE work_rosters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                week_start_date DATE,
                week_end_date DATE,
                week_number INTEGER NOT NULL,
                year INTEGER NOT NULL,
                leader_shift_1_id INTEGER REFERENCES employees(id),
                leader_shift_2_id INTEGER REFERENCES employees(id),
                leader_shift_3_id INTEGER REFERENCES employees(id),
                status VARCHAR(50) DEFAULT 'draft',
                notes TEXT,
                created_by INTEGER REFERENCES users(id),
                approved_by INTEGER REFERENCES users(id),
                approved_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(year, week_number)
            )
        """))
        print("Created: work_rosters")
        
        # Create work_roster_assignments table
        db.session.execute(db.text("""
            CREATE TABLE work_roster_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                roster_id INTEGER NOT NULL REFERENCES work_rosters(id) ON DELETE CASCADE,
                employee_id INTEGER NOT NULL REFERENCES employees(id),
                role VARCHAR(50) NOT NULL,
                shift VARCHAR(20) DEFAULT 'shift_1',
                machine_id INTEGER REFERENCES machines(id),
                position INTEGER DEFAULT 1,
                is_backup BOOLEAN DEFAULT 0,
                status VARCHAR(20) DEFAULT 'assigned',
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """))
        print("Created: work_roster_assignments")
        
        # Create indexes
        db.session.execute(db.text("CREATE INDEX IF NOT EXISTS idx_roster_year_week ON work_rosters(year, week_number)"))
        db.session.execute(db.text("CREATE INDEX IF NOT EXISTS idx_assignment_roster ON work_roster_assignments(roster_id)"))
        db.session.execute(db.text("CREATE INDEX IF NOT EXISTS idx_assignment_employee ON work_roster_assignments(employee_id)"))
        
        db.session.commit()
        print("\n✓ Tables fixed successfully!")

if __name__ == '__main__':
    fix_table()
