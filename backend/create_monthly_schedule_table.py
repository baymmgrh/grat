"""
Script to create monthly_schedules table and update schedule_grid_items table
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    # Create monthly_schedules table
    db.session.execute(text("""
        CREATE TABLE IF NOT EXISTS monthly_schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            product_id INTEGER NOT NULL REFERENCES products(id),
            machine_id INTEGER REFERENCES machines(id),
            target_ctn NUMERIC(15, 2) DEFAULT 0,
            target_pack NUMERIC(15, 2) DEFAULT 0,
            scheduled_ctn NUMERIC(15, 2) DEFAULT 0,
            remaining_ctn NUMERIC(15, 2) DEFAULT 0,
            priority VARCHAR(20) DEFAULT 'normal',
            spek_kain VARCHAR(100),
            color VARCHAR(50) DEFAULT 'bg-blue-500',
            notes TEXT,
            status VARCHAR(50) DEFAULT 'draft',
            created_by INTEGER REFERENCES users(id),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(year, month, product_id, machine_id)
        )
    """))
    
    # Add monthly_schedule_id column to schedule_grid_items if not exists
    try:
        db.session.execute(text("""
            ALTER TABLE schedule_grid_items ADD COLUMN monthly_schedule_id INTEGER REFERENCES monthly_schedules(id)
        """))
        print("✅ Added monthly_schedule_id column to schedule_grid_items")
    except Exception as e:
        if 'duplicate column' in str(e).lower() or 'already exists' in str(e).lower():
            print("ℹ️ monthly_schedule_id column already exists")
        else:
            print(f"⚠️ Could not add column: {e}")
    
    db.session.commit()
    
    print("✅ monthly_schedules table created successfully!")
    
    # Verify tables
    result = db.session.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='monthly_schedules'"))
    if result.fetchone():
        print("✅ Table 'monthly_schedules' verified in database")
        
        # Show columns
        cols = db.session.execute(text("PRAGMA table_info(monthly_schedules)"))
        print("\nTable columns:")
        for col in cols:
            print(f"  - {col[1]}: {col[2]}")
    else:
        print("❌ Table 'monthly_schedules' not found!")
