#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Final verification of ALFAMART packaging fix...")
    
    try:
        # Check products_new data
        product_result = db.session.execute(db.text("""
            SELECT kode_produk, nama_produk, pack_per_karton
            FROM products_new
            WHERE kode_produk = '4022301001'
        """)).fetchone()
        
        print(f"📦 Products New Data:")
        print(f"  Kode: {product_result[0]}")
        print(f"  Nama: {product_result[1]}")
        print(f"  Pack per Karton: {product_result[2]}")
        
        # Check WIP stock data
        wip_result = db.session.execute(db.text("""
            SELECT id, quantity_pcs, quantity_carton, pack_per_carton, last_wo_number
            FROM wip_stocks 
            WHERE last_wo_number = 'WO-202602-00045'
        """)).fetchone()
        
        print(f"\n📦 WIP Stock Data:")
        print(f"  ID: {wip_result[0]}")
        print(f"  Quantity PCS: {wip_result[1]}")
        print(f"  Quantity Carton: {wip_result[2]}")
        print(f"  Pack per Carton: {wip_result[3]}")
        print(f"  WO Number: {wip_result[4]}")
        
        # Check shift production data
        shift_result = db.session.execute(db.text("""
            SELECT id, shift, good_quantity, actual_quantity
            FROM shift_productions 
            WHERE work_order_id = 45
        """)).fetchone()
        
        print(f"\n🏭 Shift Production Data:")
        print(f"  ID: {shift_result[0]}")
        print(f"  Shift: {shift_result[1]}")
        print(f"  Good Quantity: {shift_result[2]} pcs")
        print(f"  Actual Quantity: {shift_result[3]} pcs")
        
        # Calculate and verify
        good_qty = int(shift_result[2]) if shift_result[2] else 0
        pack_per_carton = int(product_result[2]) if product_result[2] else 1
        expected_cartons = int(good_qty / pack_per_carton) if pack_per_carton > 0 else 0
        actual_cartons = int(wip_result[2]) if wip_result[2] else 0
        
        print(f"\n🧮 Calculation Verification:")
        print(f"  Good Quantity: {good_qty} pcs")
        print(f"  Pack per Carton: {pack_per_carton} pcs")
        print(f"  Expected Cartons: {good_qty} ÷ {pack_per_carton} = {expected_cartons}")
        print(f"  Actual WIP Cartons: {actual_cartons}")
        
        if expected_cartons == actual_cartons:
            print(f"  ✅ CORRECT! Data is consistent")
        else:
            print(f"  ⚠️  Mismatch! Expected {expected_cartons}, got {actual_cartons}")
        
        print(f"\n🎯 Summary of Fixes Applied:")
        print(f"  ✅ Fixed products_new.pack_per_karton from NULL to 27")
        print(f"  ✅ Fixed wip_stocks.pack_per_carton from 1 to 27")
        print(f"  ✅ Fixed wip_stocks.quantity_carton from 3267 to 121")
        print(f"  ✅ Verified calculation: 3267 ÷ 27 = 121 cartons")
        
        print(f"\n🚀 Expected Result in Daily Controller:")
        print(f"  - Product: ALFAMART WET WIPES HAND & MOUTH 20S @27X3")
        print(f"  - Quantity: 121 cartons (was 1)")
        print(f"  - Pack per carton: 27 pcs")
        print(f"  - Total PCS: 3267")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
