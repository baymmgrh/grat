"""
Migration script to create staff leave and office location tables,
and add GPS columns to attendance table
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    # Add GPS columns to attendances table
    try:
        db.session.execute(db.text('''
            ALTER TABLE attendances ADD COLUMN IF NOT EXISTS clock_in_latitude FLOAT;
        '''))
        db.session.execute(db.text('''
            ALTER TABLE attendances ADD COLUMN IF NOT EXISTS clock_in_longitude FLOAT;
        '''))
        db.session.execute(db.text('''
            ALTER TABLE attendances ADD COLUMN IF NOT EXISTS clock_in_accuracy FLOAT;
        '''))
        db.session.execute(db.text('''
            ALTER TABLE attendances ADD COLUMN IF NOT EXISTS clock_in_distance FLOAT;
        '''))
        db.session.execute(db.text('''
            ALTER TABLE attendances ADD COLUMN IF NOT EXISTS clock_in_location_valid BOOLEAN;
        '''))
        db.session.execute(db.text('''
            ALTER TABLE attendances ADD COLUMN IF NOT EXISTS clock_out_latitude FLOAT;
        '''))
        db.session.execute(db.text('''
            ALTER TABLE attendances ADD COLUMN IF NOT EXISTS clock_out_longitude FLOAT;
        '''))
        db.session.execute(db.text('''
            ALTER TABLE attendances ADD COLUMN IF NOT EXISTS clock_out_accuracy FLOAT;
        '''))
        db.session.execute(db.text('''
            ALTER TABLE attendances ADD COLUMN IF NOT EXISTS clock_out_distance FLOAT;
        '''))
        db.session.execute(db.text('''
            ALTER TABLE attendances ADD COLUMN IF NOT EXISTS clock_out_location_valid BOOLEAN;
        '''))
        db.session.commit()
        print("✓ GPS columns added to attendances table")
    except Exception as e:
        print(f"Note: GPS columns might already exist or error: {e}")
        db.session.rollback()

    # Create staff_leave_requests table
    try:
        db.session.execute(db.text('''
            CREATE TABLE IF NOT EXISTS staff_leave_requests (
                id SERIAL PRIMARY KEY,
                request_number VARCHAR(50) UNIQUE NOT NULL,
                staff_name VARCHAR(200) NOT NULL,
                leave_type VARCHAR(50) NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                total_days INTEGER NOT NULL,
                reason TEXT NOT NULL,
                attachment_path VARCHAR(500),
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                approved_by INTEGER REFERENCES users(id),
                approved_at TIMESTAMP,
                rejection_reason TEXT,
                submitted_from_ip VARCHAR(45),
                device_info VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        '''))
        db.session.execute(db.text('''
            CREATE INDEX IF NOT EXISTS idx_staff_leave_staff_name ON staff_leave_requests(staff_name);
        '''))
        db.session.execute(db.text('''
            CREATE INDEX IF NOT EXISTS idx_staff_leave_request_number ON staff_leave_requests(request_number);
        '''))
        db.session.commit()
        print("✓ staff_leave_requests table created")
    except Exception as e:
        print(f"Note: staff_leave_requests table might already exist or error: {e}")
        db.session.rollback()

    # Create office_locations table
    try:
        db.session.execute(db.text('''
            CREATE TABLE IF NOT EXISTS office_locations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                latitude FLOAT NOT NULL,
                longitude FLOAT NOT NULL,
                radius_meters INTEGER NOT NULL DEFAULT 100,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                is_default BOOLEAN NOT NULL DEFAULT FALSE,
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        '''))
        db.session.commit()
        print("✓ office_locations table created")
    except Exception as e:
        print(f"Note: office_locations table might already exist or error: {e}")
        db.session.rollback()

    print("\n✅ Migration completed!")
