#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Checking table structures and WO 45 data...")
    
    try:
        # Check wip_stocks table structure
        wip_cols = db.session.execute(db.text("PRAGMA table_info(wip_stocks)")).fetchall()
        print(f"\n📦 WIP Stocks table columns:")
        for col in wip_cols:
            print(f"  - {col[1]}: {col[2]}")
        
        # Check products_new table for ALFAMART product
        product_new_result = db.session.execute(db.text("""
            SELECT kode_produk, nama_produk, pack_per_karton
            FROM products_new
            WHERE kode_produk LIKE '%4022301001%' OR nama_produk LIKE '%ALFAMART%'
        """)).fetchall()
        
        print(f"\n📦 Products New data for ALFAMART:")
        for product in product_new_result:
            print(f"  Kode: {product[0]}")
            print(f"  Nama: {product[1]}")
            print(f"  Pack per Karton: {product[2]}")
        
        # Check all products_new with pack_per_karton data
        pack_result = db.session.execute(db.text("""
            SELECT kode_produk, nama_produk, pack_per_karton
            FROM products_new
            WHERE pack_per_karton IS NOT NULL AND pack_per_karton > 0
            ORDER BY kode_produk
            LIMIT 10
        """)).fetchall()
        
        print(f"\n📦 Sample products with pack_per_karton data:")
        for product in pack_result:
            print(f"  {product[0]} - {product[1]}: {product[2]} pcs/carton")
        
        # Check WIP stocks structure and data for WO 45
        wip_cols = db.session.execute(db.text("PRAGMA table_info(wip_stocks)")).fetchall()
        
        # Build correct query based on actual columns
        column_names = [col[1] for col in wip_cols]
        
        if 'quantity_pcs' in column_names and 'quantity_carton' in column_names:
            # New structure
            wip_query = """
                SELECT ws.id, ws.quantity_pcs, ws.quantity_carton,
                       ws.product_code, ws.product_name
                FROM wip_stocks ws
                WHERE ws.work_order_id = 45
                ORDER BY ws.created_at DESC
            """
        else:
            # Old structure - check what columns are available
            print(f"\n🔍 Available WIP columns: {column_names}")
            wip_query = f"""
                SELECT {','.join(['ws.' + col for col in column_names if col != 'work_order_id'])}
                FROM wip_stocks ws
                WHERE ws.work_order_id = 45
                ORDER BY ws.created_at DESC
            """
        
        wip_result = db.session.execute(db.text(wip_query)).fetchall()
        
        print(f"\n📦 WIP Stocks for WO 45:")
        for wip in wip_result:
            print(f"  Data: {wip}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
