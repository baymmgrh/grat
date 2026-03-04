"""
Fix attendance table - make employee_id nullable
SQLite doesn't support ALTER COLUMN, so we need to recreate the table
"""
import sqlite3
import os

# Get database path - check both possible databases
db_files = ['erp.db', 'erp_database.db']
base_dir = os.path.dirname(__file__)

for db_file in db_files:
    db_path = os.path.join(base_dir, db_file)
    if not os.path.exists(db_path):
        print(f"⏭️ {db_file} not found, skipping...")
        continue
    
    print(f"\n{'='*50}")
    print(f"Database: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check current schema
        cursor.execute("PRAGMA table_info(attendances)")
        columns = cursor.fetchall()
        
        if not columns:
            print("  ⏭️ attendances table not found, skipping...")
            conn.close()
            continue
            
        print("\nCurrent columns:")
        for col in columns:
            print(f"  {col[1]}: {col[2]}, notnull={col[3]}")
        
        # Check if employee_id is NOT NULL (col[3] == 1 means NOT NULL)
        employee_col = next((c for c in columns if c[1] == 'employee_id'), None)
        if employee_col and employee_col[3] == 1:
            print("\n⚠️ employee_id has NOT NULL constraint, fixing...")
            
            # Create new table with nullable employee_id
            cursor.execute("DROP TABLE IF EXISTS attendances_new")
            cursor.execute("""
                CREATE TABLE attendances_new (
                    id INTEGER PRIMARY KEY,
                    employee_id INTEGER REFERENCES employees(id),
                    user_id INTEGER REFERENCES users(id),
                    attendance_date DATE NOT NULL,
                    shift_id INTEGER REFERENCES shift_schedules(id),
                    clock_in DATETIME,
                    clock_out DATETIME,
                    status VARCHAR(50) NOT NULL DEFAULT 'present',
                    worked_hours NUMERIC(5,2) DEFAULT 0,
                    overtime_hours NUMERIC(5,2) DEFAULT 0,
                    notes TEXT,
                    photo_hash VARCHAR(64),
                    photo_size_bytes INTEGER,
                    face_detected BOOLEAN DEFAULT 0,
                    face_confidence FLOAT,
                    face_count INTEGER DEFAULT 0,
                    device_info VARCHAR(500),
                    ip_address VARCHAR(45),
                    verification_status VARCHAR(20) DEFAULT 'pending',
                    verified_by INTEGER REFERENCES users(id),
                    verified_at DATETIME,
                    rejection_reason VARCHAR(255),
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME
                )
            """)
            
            # Copy data
            cursor.execute("""
                INSERT INTO attendances_new 
                SELECT * FROM attendances
            """)
            
            # Drop old table
            cursor.execute("DROP TABLE attendances")
            
            # Rename new table
            cursor.execute("ALTER TABLE attendances_new RENAME TO attendances")
            
            # Recreate indexes
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_employee_date ON attendances(employee_id, attendance_date)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_date ON attendances(user_id, attendance_date)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendances(attendance_date)")
            
            conn.commit()
            print("✅ Fixed! employee_id is now nullable")
        else:
            print("\n✅ employee_id is already nullable or column not found")
    
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
    finally:
        conn.close()

print("\n" + "="*50)
print("Done!")
