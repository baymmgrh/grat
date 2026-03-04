"""
Migration script to add consumption calculation fields to product_packaging table
- berat_kering_per_karton (gram) - for kain consumption
- volume_per_pack (ml) - for ingredient consumption  
- berat_akhir_per_karton (gram) - for packaging & stiker consumption
"""
from app import create_app
from models import db

app = create_app()

with app.app_context():
    try:
        # Add columns using raw SQL for SQLite compatibility
        columns_to_add = [
            ('berat_kering_per_karton', 'DECIMAL(10,3)'),
            ('volume_per_pack', 'DECIMAL(10,3)'),
            ('berat_akhir_per_karton', 'DECIMAL(10,3)')
        ]
        
        for col_name, col_type in columns_to_add:
            try:
                db.session.execute(db.text(f'ALTER TABLE product_packaging ADD COLUMN {col_name} {col_type}'))
                print(f"✓ Added column {col_name}")
            except Exception as e:
                if 'duplicate column' in str(e).lower() or 'already exists' in str(e).lower():
                    print(f"- Column {col_name} already exists")
                else:
                    print(f"! Error adding {col_name}: {e}")
        
        db.session.commit()
        print("\nMigration completed successfully!")
        
    except Exception as e:
        db.session.rollback()
        print(f"Migration error: {e}")
