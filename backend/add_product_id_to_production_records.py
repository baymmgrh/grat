#!/usr/bin/env python3
"""
Migration script to add product_id column to production_records table
for supporting multiple products per shift feature.
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Adding product_id column to production_records table...")
    
    try:
        # Check if column already exists
        result = db.session.execute(db.text("PRAGMA table_info(production_records)")).fetchall()
        columns = [row[1] for row in result]
        
        if 'product_id' in columns:
            print("✅ Column product_id already exists in production_records table")
        else:
            # Add the column
            db.session.execute(db.text("""
                ALTER TABLE production_records 
                ADD COLUMN product_id INTEGER REFERENCES products(id)
            """))
            db.session.commit()
            print("✅ Added product_id column to production_records table")
        
        # Optionally, populate product_id from work_order for existing records
        print("\n📊 Populating product_id from work_order for existing records...")
        
        update_result = db.session.execute(db.text("""
            UPDATE production_records 
            SET product_id = (
                SELECT product_id FROM work_orders 
                WHERE work_orders.id = production_records.work_order_id
            )
            WHERE product_id IS NULL
        """))
        db.session.commit()
        
        print(f"✅ Updated {update_result.rowcount} records with product_id from work_order")
        
        # Verify
        verify = db.session.execute(db.text("""
            SELECT COUNT(*) as total,
                   COUNT(product_id) as with_product
            FROM production_records
        """)).fetchone()
        
        print(f"\n📈 Verification:")
        print(f"   Total records: {verify[0]}")
        print(f"   Records with product_id: {verify[1]}")
        
        print("\n🎉 Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.session.rollback()
        import traceback
        traceback.print_exc()
