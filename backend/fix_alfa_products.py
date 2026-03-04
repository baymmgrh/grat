#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Updating pack_per_karton for all ALFA products to 27...")
    
    try:
        # Find all ALFA products
        alfa_products = db.session.execute(db.text("""
            SELECT kode_produk, nama_produk, pack_per_karton
            FROM products_new
            WHERE nama_produk LIKE '%ALFA%' OR nama_produk LIKE '%ALFAMART%'
            ORDER BY nama_produk
        """)).fetchall()
        
        print(f"\n📦 Found {len(alfa_products)} ALFA products:")
        for product in alfa_products:
            print(f"  {product[0]} - {product[1]}: pack_per_karton = {product[2]}")
        
        # Update all ALFA products to pack_per_karton = 27
        update_result = db.session.execute(db.text("""
            UPDATE products_new 
            SET pack_per_karton = 27
            WHERE nama_produk LIKE '%ALFA%' OR nama_produk LIKE '%ALFAMART%'
        """))
        
        db.session.commit()
        print(f"\n✅ Updated {update_result.rowcount} ALFA products to pack_per_karton = 27")
        
        # Verify the update
        verify_result = db.session.execute(db.text("""
            SELECT kode_produk, nama_produk, pack_per_karton
            FROM products_new
            WHERE nama_produk LIKE '%ALFA%' OR nama_produk LIKE '%ALFAMART%'
            ORDER BY nama_produk
        """)).fetchall()
        
        print(f"\n✅ Verified ALFA products after update:")
        for product in verify_result:
            status = "✅" if product[2] == 27 else "❌"
            print(f"  {status} {product[0]} - {product[1]}: pack_per_karton = {product[2]}")
        
        # Also update WIP stocks for these products
        print(f"\n🔧 Updating WIP stocks for ALFA products...")
        
        # Get product IDs for ALFA products
        alfa_product_ids = db.session.execute(db.text("""
            SELECT p.id, p.code, p.name
            FROM products p
            WHERE p.name LIKE '%ALFA%' OR p.name LIKE '%ALFAMART%'
        """)).fetchall()
        
        print(f"Found {len(alfa_product_ids)} ALFA products in products table:")
        for product in alfa_product_ids:
            print(f"  ID {product[0]}: {product[1]} - {product[2]}")
            
            # Update WIP stocks for this product
            wip_update = db.session.execute(db.text("""
                UPDATE wip_stocks 
                SET pack_per_carton = 27,
                    quantity_carton = CAST(quantity_pcs / 27 AS INTEGER),
                    updated_at = datetime('now')
                WHERE product_id = :product_id AND pack_per_carton != 27
            """), {'product_id': product[0]})
            
            if wip_update.rowcount > 0:
                print(f"    ✅ Updated {wip_update.rowcount} WIP stock records")
        
        db.session.commit()
        print(f"\n🎉 All ALFA products updated successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
        db.session.rollback()
        import traceback
        traceback.print_exc()
