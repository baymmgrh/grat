"""
Script to create remaining_stocks table for Sisa Order feature
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    from models.production import RemainingStock
    from sqlalchemy import inspect
    
    inspector = inspect(db.engine)
    existing_tables = inspector.get_table_names()
    
    if 'remaining_stocks' not in existing_tables:
        print("Creating remaining_stocks table...")
        db.create_all()
        print("Table created successfully!")
    else:
        print("Table remaining_stocks already exists.")
