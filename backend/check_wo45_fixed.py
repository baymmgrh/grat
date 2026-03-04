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
        # First check table structures
        print("🔍 Checking table structures...")
        
        # Check products table structure
        products_cols = db.session.execute(db.text("PRAGMA table_info(products)")).fetchall()
        print(f"\n📋 Products table columns:")
        for col in products_cols:
            print(f"  - {col[1]}: {col[2]}")
        
        # Check work order details
        wo_result = db.session.execute(db.text("""
            SELECT wo.id, wo.wo_number, wo.quantity, wo.status, 
                   p.code as product_code, p.name as product_name
            FROM work_orders wo
            LEFT JOIN products p ON wo.product_id = p.id
            WHERE wo.id = 45
        """)).fetchone()
        
        if not wo_result:
            print("❌ Work Order ID 45 not found")
            exit()
        
        print(f"\n📋 Work Order Details:")
        print(f"  ID: {wo_result[0]}")
        print(f"  WO Number: {wo_result[1]}")
        print(f"  Quantity: {wo_result[2]}")
        print(f"  Status: {wo_result[3]}")
        print(f"  Product Code: {wo_result[4]}")
        print(f"  Product Name: {wo_result[5]}")
        
        # Check products_new table for packaging info
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
            else:
                print(f"\n❌ No data found in products_new for code: {wo_result[4]}")
        
        # Check shift productions for this work order
        shift_result = db.session.execute(db.text("""
            SELECT sp.id, sp.shift, sp.actual_quantity, sp.good_quantity,
                   sp.product_id, sp.work_order_id,
                   p.name as product_name
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
            
            # Calculate expected cartons based on products_new data
            if wip[4] and product_new_result and product_new_result[2]:
                expected_cartons = int(wip[2] / product_new_result[2]) if wip[2] else 0
                actual_cartons = wip[3] if wip[3] else 0
                print(f"    Expected Cartons (27 pcs/carton): {expected_cartons}")
                print(f"    Actual Cartons: {actual_cartons}")
                if expected_cartons != actual_cartons:
                    print(f"    ⚠️  MISMATCH! Expected {expected_cartons}, got {actual_cartons}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
