"""
Migration script: Merge products_new columns/data into products table.
- Adds detail columns to products table
- Copies data from products_new matched by code = kode_produk
- Renames products_new to products_new_backup
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db

app = create_app()

# Columns to add to products table (from products_new)
NEW_COLUMNS = [
    # Physical Properties
    ("gramasi", "REAL"),
    ("cd", "REAL"),
    ("md", "REAL"),
    # Packaging  
    ("sheet_per_pack", "VARCHAR(20)"),
    ("pack_per_karton", "VARCHAR(20)"),
    ("berat_kering", "VARCHAR(20)"),
    # Batch
    ("ratio", "REAL"),
    ("ingredient", "REAL"),
    ("ukuran_batch_vol", "REAL"),
    ("ukuran_batch_ctn", "REAL"),
    # Material
    ("spunlace", "VARCHAR(50)"),
    ("rayon", "REAL"),
    ("polyester", "REAL"),
    ("es", "REAL"),
    # Slitting
    ("slitting_cm", "REAL"),
    ("lebar_mr_net_cm", "REAL"),
    ("lebar_mr_gross_cm", "REAL"),
    ("keterangan_slitting", "VARCHAR(100)"),
    # EPD Machine
    ("no_mesin_epd", "VARCHAR(50)"),
    ("speed_epd_pack_menit", "VARCHAR(20)"),
    # Fabric
    ("meter_kain", "REAL"),
    ("kg_kain", "REAL"),
    # Material Requirements
    ("kebutuhan_rayon_kg", "REAL"),
    ("kebutuhan_polyester_kg", "REAL"),
    ("kebutuhan_es_kg", "REAL"),
    # Production Process
    ("process_produksi", "VARCHAR(200)"),
    ("kode_jumbo_roll", "VARCHAR(50)"),
    ("nama_jumbo_roll", "VARCHAR(200)"),
    ("kode_main_roll", "VARCHAR(50)"),
    ("nama_main_roll", "VARCHAR(200)"),
    # Mixing
    ("kapasitas_mixing_kg", "VARCHAR(20)"),
    ("actual_mixing_kg", "VARCHAR(20)"),
    ("dosing_kg", "VARCHAR(20)"),
    # System
    ("version", "INTEGER"),
    ("notes", "TEXT"),
]


def run_migration():
    with app.app_context():
        conn = db.engine.raw_connection()
        cursor = conn.cursor()
        
        try:
            # ============ STEP 1: Add columns to products ============
            print("=" * 60)
            print("STEP 1: Adding columns to products table")
            print("=" * 60)
            
            # Get existing columns
            cursor.execute("PRAGMA table_info(products)")
            existing_cols = {row[1] for row in cursor.fetchall()}
            
            added = 0
            skipped = 0
            for col_name, col_type in NEW_COLUMNS:
                if col_name in existing_cols:
                    print(f"  ⏭ {col_name} already exists, skipping")
                    skipped += 1
                else:
                    cursor.execute(f"ALTER TABLE products ADD COLUMN {col_name} {col_type}")
                    print(f"  ✅ Added {col_name} ({col_type})")
                    added += 1
            
            print(f"\n  Summary: {added} added, {skipped} skipped")
            conn.commit()
            
            # ============ STEP 2: Copy data from products_new ============
            print("\n" + "=" * 60)
            print("STEP 2: Copying data from products_new → products")
            print("=" * 60)
            
            # Check if products_new exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='products_new'")
            if not cursor.fetchone():
                print("  ❌ products_new table not found! Skipping data copy.")
                return
            
            # Get matching products
            cursor.execute("""
                SELECT p.id, p.code, pn.id as pn_id
                FROM products p
                JOIN products_new pn ON p.code = pn.kode_produk
            """)
            matches = cursor.fetchall()
            print(f"  Found {len(matches)} matching products by code")
            
            # Get actual column names in products_new
            cursor.execute("PRAGMA table_info(products_new)")
            pn_actual_cols = {row[1] for row in cursor.fetchall()}
            
            # Only copy columns that exist in BOTH the new columns list AND products_new
            copy_cols = [col_name for col_name, _ in NEW_COLUMNS if col_name in pn_actual_cols]
            print(f"  Columns to copy: {len(copy_cols)} (of {len(NEW_COLUMNS)} defined)")
            skipped_cols = [col_name for col_name, _ in NEW_COLUMNS if col_name not in pn_actual_cols]
            if skipped_cols:
                print(f"  Skipped (not in source): {skipped_cols}")
            
            updated = 0
            for p_id, p_code, pn_id in matches:
                # Get data from products_new
                col_selects = ", ".join(copy_cols)
                cursor.execute(f"SELECT {col_selects} FROM products_new WHERE id = ?", (pn_id,))
                row = cursor.fetchone()
                
                if row:
                    # Build SET clause
                    set_clauses = []
                    values = []
                    for i, col_name in enumerate(copy_cols):
                        if row[i] is not None:
                            set_clauses.append(f"{col_name} = ?")
                            values.append(row[i])
                    
                    if set_clauses:
                        values.append(p_id)
                        sql = f"UPDATE products SET {', '.join(set_clauses)} WHERE id = ?"
                        cursor.execute(sql, values)
                        updated += 1
            
            conn.commit()
            print(f"  ✅ Updated {updated} products with data from products_new")
            
            # ============ STEP 3: Insert products only in products_new ============
            print("\n" + "=" * 60)
            print("STEP 3: Checking products only in products_new")
            print("=" * 60)
            
            cursor.execute("""
                SELECT pn.kode_produk, pn.nama_produk
                FROM products_new pn
                LEFT JOIN products p ON pn.kode_produk = p.code
                WHERE p.id IS NULL
            """)
            only_new = cursor.fetchall()
            print(f"  Found {len(only_new)} products only in products_new:")
            for code, name in only_new:
                print(f"    - {code}: {name}")
            
            # Insert real products (skip test data)
            test_codes = {'TEST-999999', 'GLOVES', 'DRY WIPES', 'BED SHEET', 'MASKER', 'FABRIC NON WOVEN'}
            inserted = 0
            for code, name in only_new:
                if code in test_codes:
                    print(f"  ⏭ Skipping test product: {code}")
                    continue
                
                # Get full data from products_new
                cursor.execute("SELECT * FROM products_new WHERE kode_produk = ?", (code,))
                pn_row = cursor.fetchone()
                cursor.execute("PRAGMA table_info(products_new)")
                pn_cols = [col[1] for col in cursor.fetchall()]
                pn_data = dict(zip(pn_cols, pn_row))
                
                # Insert into products with mapped fields
                cursor.execute("""
                    INSERT INTO products (code, name, is_active, material_type, primary_uom, price, cost,
                        gramasi, cd, md, sheet_per_pack, pack_per_karton, berat_kering,
                        ratio, ingredient, ukuran_batch_vol, ukuran_batch_ctn,
                        spunlace, rayon, polyester, es,
                        slitting_cm, lebar_mr_net_cm, lebar_mr_gross_cm, keterangan_slitting,
                        no_mesin_epd, speed_epd_pack_menit,
                        meter_kain, kg_kain,
                        kebutuhan_rayon_kg, kebutuhan_polyester_kg, kebutuhan_es_kg,
                        process_produksi, kode_jumbo_roll, nama_jumbo_roll, kode_main_roll, nama_main_roll,
                        kapasitas_mixing_kg, actual_mixing_kg, dosing_kg,
                        version, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?,
                        ?, ?, ?, ?,
                        ?, ?, ?, ?,
                        ?, ?,
                        ?, ?,
                        ?, ?, ?,
                        ?, ?, ?, ?, ?,
                        ?, ?, ?,
                        ?, ?)
                """, (
                    code, name, pn_data.get('is_active', True), 'finished_goods', 'PCS', 0, 0,
                    pn_data.get('gramasi'), pn_data.get('cd'), pn_data.get('md'),
                    pn_data.get('sheet_per_pack'), pn_data.get('pack_per_karton'), pn_data.get('berat_kering'),
                    pn_data.get('ratio'), pn_data.get('ingredient'),
                    pn_data.get('ukuran_batch_vol'), pn_data.get('ukuran_batch_ctn'),
                    pn_data.get('spunlace'), pn_data.get('rayon'), pn_data.get('polyester'), pn_data.get('es'),
                    pn_data.get('slitting_cm'), pn_data.get('lebar_mr_net_cm'), pn_data.get('lebar_mr_gross_cm'),
                    pn_data.get('keterangan_slitting'),
                    pn_data.get('no_mesin_epd'), pn_data.get('speed_epd_pack_menit'),
                    pn_data.get('meter_kain'), pn_data.get('kg_kain'),
                    pn_data.get('kebutuhan_rayon_kg'), pn_data.get('kebutuhan_polyester_kg'), pn_data.get('kebutuhan_es_kg'),
                    pn_data.get('process_produksi'), pn_data.get('kode_jumbo_roll'), pn_data.get('nama_jumbo_roll'),
                    pn_data.get('kode_main_roll'), pn_data.get('nama_main_roll'),
                    pn_data.get('kapasitas_mixing_kg'), pn_data.get('actual_mixing_kg'), pn_data.get('dosing_kg'),
                    pn_data.get('version', 0), pn_data.get('notes'),
                ))
                inserted += 1
                print(f"  ✅ Inserted {code}: {name}")
            
            conn.commit()
            print(f"  Summary: {inserted} inserted, {len(only_new) - inserted} skipped (test data)")
            
            # ============ STEP 4: Rename products_new → backup ============
            print("\n" + "=" * 60)
            print("STEP 4: Renaming products_new → products_new_backup")
            print("=" * 60)
            
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='products_new_backup'")
            if cursor.fetchone():
                cursor.execute("DROP TABLE products_new_backup")
                print("  ⏭ Dropped existing products_new_backup")
            
            cursor.execute("ALTER TABLE products_new RENAME TO products_new_backup")
            conn.commit()
            print("  ✅ Renamed products_new → products_new_backup")
            
            # ============ FINAL: Verify ============
            print("\n" + "=" * 60)
            print("FINAL: Verification")
            print("=" * 60)
            
            cursor.execute("SELECT COUNT(*) FROM products")
            total = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM products WHERE gramasi IS NOT NULL")
            with_data = cursor.fetchone()[0]
            print(f"  Total products: {total}")
            print(f"  Products with enriched data: {with_data}")
            print(f"\n🎉 Migration complete!")
            
        except Exception as e:
            conn.rollback()
            print(f"\n❌ Migration failed: {e}")
            import traceback
            traceback.print_exc()
        finally:
            cursor.close()
            conn.close()


if __name__ == '__main__':
    run_migration()
