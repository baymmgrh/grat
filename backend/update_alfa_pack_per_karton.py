#!/usr/bin/env python3
"""
Update pack_per_karton for ALFA products from 27 to 162
27 adalah banded, 162 adalah pack per karton yang benar
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("=" * 60)
    print("Update pack_per_karton untuk produk ALFA dari 27 ke 162")
    print("=" * 60)
    
    try:
        # Show current ALFA products
        print("\n📋 Produk ALFA saat ini:")
        result = db.session.execute(db.text("""
            SELECT id, kode_produk, nama_produk, pack_per_karton 
            FROM products_new 
            WHERE nama_produk LIKE '%ALFA%' OR nama_produk LIKE '%ALFAMART%'
        """)).fetchall()
        
        for r in result:
            print(f"  {r[0]}: {r[1]} - {r[2]} | pack_per_karton = {r[3]}")
        
        # Update pack_per_karton from 27 to 162
        print("\n🔄 Updating pack_per_karton dari 27 ke 162...")
        update_result = db.session.execute(db.text("""
            UPDATE products_new 
            SET pack_per_karton = 162
            WHERE (nama_produk LIKE '%ALFA%' OR nama_produk LIKE '%ALFAMART%')
        """))
        
        db.session.commit()
        print(f"✅ Updated {update_result.rowcount} produk ALFA")
        
        # Verify the update
        print("\n📋 Produk ALFA setelah update:")
        verify_result = db.session.execute(db.text("""
            SELECT id, kode_produk, nama_produk, pack_per_karton 
            FROM products_new 
            WHERE nama_produk LIKE '%ALFA%' OR nama_produk LIKE '%ALFAMART%'
        """)).fetchall()
        
        for r in verify_result:
            print(f"  {r[0]}: {r[1]} - {r[2]} | pack_per_karton = {r[3]}")
        
        print("\n🎉 Update selesai!")
        print("   27 = banded (salah)")
        print("   162 = pack per karton (benar)")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.session.rollback()
        import traceback
        traceback.print_exc()
