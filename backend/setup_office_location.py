"""Setup office location for GPS attendance validation"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    try:
        # Insert office location using raw SQL
        db.session.execute(db.text("""
            INSERT INTO office_locations (name, latitude, longitude, radius_meters, is_active, is_default, address)
            VALUES ('Kantor PT. Gratia Makmur Sentosa', -7.513881030958723, 110.69837923296517, 500, 1, 1, 'Jawa Tengah')
        """))
        db.session.commit()
        print("✅ Office location created successfully!")
        print("   Name: Kantor PT. Gratia Makmur Sentosa")
        print("   Latitude: -7.513881030958723")
        print("   Longitude: 110.69837923296517")
        print("   Radius: 500 meters")
    except Exception as e:
        print(f"Error: {e}")
        db.session.rollback()
