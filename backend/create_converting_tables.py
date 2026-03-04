"""Script to create/update Converting tables using Flask app context"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config
from flask import Flask
from models import db, ConvertingMachine, ConvertingProduction

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

with app.app_context():
    # Drop and recreate converting_productions table with new schema
    try:
        ConvertingProduction.__table__.drop(db.engine, checkfirst=True)
        print("✓ Old converting_productions table dropped")
    except Exception as e:
        print(f"Note: {e}")
    
    # Create tables
    ConvertingMachine.__table__.create(db.engine, checkfirst=True)
    ConvertingProduction.__table__.create(db.engine, checkfirst=True)
    print("✓ Converting tables created with new schema")
    
    # Seed machines
    machines_data = [
        ('CVT-PERF-01', 'Perforating 1', 'perforating', 100),
        ('CVT-PERF-02', 'Perforating 2', 'perforating', 100),
        ('CVT-SLIT-01', 'Slitting 1', 'slitting', 150),
        ('CVT-SLIT-02', 'Slitting 2', 'slitting', 150),
        ('CVT-LAMI-01', 'Laminasi Kain', 'laminasi', 80),
        ('CVT-BAGM-01', 'Bagmaker', 'bagmaker', 60),
        ('CVT-FOLD-200A', 'Folding 200 (1)', 'folding', 200),
        ('CVT-FOLD-200B', 'Folding 200 (2)', 'folding', 200),
        ('CVT-FOLD-280', 'Folding 280', 'folding', 180),
        ('CVT-FOLD-320', 'Folding 320', 'folding', 160),
        ('CVT-FOLD-600', 'Folding 600', 'folding', 120),
        ('CVT-CUT-01', 'Cutting', 'cutting', 200),
    ]
    
    created = 0
    for code, name, mtype, speed in machines_data:
        existing = ConvertingMachine.query.filter_by(code=code).first()
        if not existing:
            machine = ConvertingMachine(
                code=code,
                name=name,
                machine_type=mtype,
                default_speed=speed,
                target_efficiency=60
            )
            db.session.add(machine)
            created += 1
    
    db.session.commit()
    print(f"✓ {created} machines seeded (12 total)")
