"""
Seed departments into the database
Run this script from the backend folder:
python seed_departments.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, Department

departments_data = [
    {'code': 'DCC', 'name': 'Document Control Centre'},
    {'code': 'ACC', 'name': 'Accounting'},
    {'code': 'EPD', 'name': 'End Product'},
    {'code': 'PPIC', 'name': 'Production Planning and Inventory Control'},
    {'code': 'HRD', 'name': 'Human Resources Department'},
    {'code': 'MKT', 'name': 'Marketing'},
    {'code': 'QC', 'name': 'Quality Control'},
    {'code': 'QAS', 'name': 'Quality Assurance'},
    {'code': 'MTC', 'name': 'Maintenance'},
    {'code': 'PRC', 'name': 'Purchasing'},
    {'code': 'RND', 'name': 'Research and Development'},
    {'code': 'PRD', 'name': 'Production'},
]

def seed_departments():
    app = create_app()
    with app.app_context():
        added = 0
        updated = 0
        
        for dept_data in departments_data:
            existing = Department.query.filter_by(code=dept_data['code']).first()
            if existing:
                existing.name = dept_data['name']
                existing.is_active = True
                updated += 1
                print(f"Updated: {dept_data['code']} - {dept_data['name']}")
            else:
                dept = Department(
                    code=dept_data['code'],
                    name=dept_data['name'],
                    is_active=True
                )
                db.session.add(dept)
                added += 1
                print(f"Added: {dept_data['code']} - {dept_data['name']}")
        
        db.session.commit()
        print(f"\nDone! Added: {added}, Updated: {updated}")

if __name__ == '__main__':
    seed_departments()
