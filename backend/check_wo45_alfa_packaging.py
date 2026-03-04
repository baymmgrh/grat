#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Checking Work Order ID 45 for Alfa product packaging issue...")
    
    try:
        # Get work order details
        wo_result = db.session.execute(db.text("""
            SELECT wo.id, wo.wo_number, wo.quantity, wo.status, 
                   p.code as product_code, p.name as product_name,
                   p.pack_per_carton
            FROM work_orders wo
            LEFT JOIN products p ON wo.product_id = p.id
            WHERE wo.id = 45
        """)).fetchone()
        
        if not wo_result:
            print("❌ Work Order ID 45 not found")
            exit()
        
        print(f"📋 Work Order Details:")
        print(f"  ID: {wo_result[0]}")
        print(f"  WO Number: {wo_result[1]}")
        print(f"  Quantity: {wo_result[2]}")
        print(f"  Status: {wo_result[3]}")
        print(f"  Product Code: {wo_result[4]}")
        print(f"  Product Name: {wo_result[5]}")
        print(f"  Pack per Carton (products table): {wo_result[6]}")
        
        # Check products_new table for more accurate packaging info
        if wo_result[4]:
            product_new_result = db.session.execute(db.text("""
                SELECT kode_produk, nama_produk, pack_per_karton
                FROM products_new
                WHERE kode_produk = :code
            """), {'code': wo_result[4]}).fetchone()
            
            if product_new_result:
                print(f"\n📦 Products New Details:")
                print(f"  Kode Produk: {product_new_result[0]}")
                print(f"  Nama Produk: {product_new_result[1]}")
                print(f"  Pack per Karton: {product_new_result[2]}")
        
        # Check shift productions for this work order
        shift_result = db.session.execute(db.text("""
            SELECT sp.id, sp.shift, sp.actual_quantity, sp.good_quantity,
                   sp.product_id, sp.work_order_id,
                   p.name as product_name, p.pack_per_carton
            FROM shift_productions sp
            LEFT JOIN products p ON sp.product_id = p.id
            WHERE sp.work_order_id = 45
            ORDER BY sp.shift
        """)).fetchall()
        
        print(f"\n🏭 Shift Productions for WO 45:")
        for shift in shift_result:
            print(f"  Shift {shift[1]}:")
            print(f"    ID: {shift[0]}")
            print(f"    Actual Quantity: {shift[2]}")
            print(f"    Good Quantity: {shift[3]}")
            print(f"    Product ID: {shift[4]}")
            print(f"    Product Name: {shift[6]}")
            print(f"    Pack per Carton: {shift[7]}")
            
            # Calculate cartons
            if shift[7] and shift[7] > 0:
                cartons = int(shift[3] / shift[7]) if shift[3] else 0
                print(f"    Calculated Cartons: {cartons}")
        
        # Check WIP stocks
        wip_result = db.session.execute(db.text("""
            SELECT ws.id, ws.wip_batch_no, ws.quantity_pcs, ws.quantity_carton,
                   ws.product_code, ws.product_name
            FROM wip_stocks ws
            WHERE ws.work_order_id = 45
            ORDER BY ws.created_at DESC
        """)).fetchall()
        
        print(f"\n📦 WIP Stocks for WO 45:")
        for wip in wip_result:
            print(f"  Batch {wip[1]}:")
            print(f"    ID: {wip[0]}")
            print(f"    Quantity PCS: {wip[2]}")
            print(f"    Quantity Carton: {wip[3]}")
            print(f"    Product Code: {wip[4]}")
            print(f"    Product Name: {wip[5]}")
        
        # Check if there are any packing lists
        packing_result = db.session.execute(db.text("""
            SELECT pl.id, pl.packing_list_number, pl.total_cartons,
                   pl.product_code, pl.product_name
            FROM packing_lists pl
            WHERE pl.work_order_id = 45
            ORDER BY pl.created_at DESC
        """)).fetchall()
        
        print(f"\n📋 Packing Lists for WO 45:")
        for packing in packing_result:
            print(f"  Packing List {packing[1]}:")
            print(f"    ID: {packing[0]}")
            print(f"    Total Cartons: {packing[2]}")
            print(f"    Product Code: {packing[3]}")
            print(f"    Product Name: {packing[4]}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
