"""
Migration script to populate WIP Stock from existing production records.
This migrates historical production data to the new WIP Stock system.
"""
from app import create_app
from models import db, WorkOrder, Product
from models.production import WIPStock, WIPStockMovement, ShiftProduction
from sqlalchemy import func, text
from datetime import datetime

app = create_app()

def get_pack_per_carton(product_code, product_name):
    """Get pack_per_carton from products_new table"""
    pack_per_carton = 1
    
    # Try by product code first
    if product_code:
        result = db.session.execute(
            text('SELECT pack_per_karton FROM products_new WHERE kode_produk = :code'),
            {'code': product_code}
        ).fetchone()
        if result and result[0]:
            return int(result[0])
    
    # Fallback: try by product name - prioritize @24 packaging (standard)
    if product_name:
        search_name = product_name
        if search_name.upper().startswith('WIP '):
            search_name = search_name[4:]
        # Prioritize @24 suffix (standard packaging) over other variants
        result = db.session.execute(
            text("SELECT pack_per_karton FROM products_new WHERE nama_produk LIKE :name ORDER BY CASE WHEN nama_produk LIKE '%@24' THEN 0 WHEN nama_produk LIKE '%@24%' THEN 1 ELSE 2 END, pack_per_karton DESC LIMIT 1"),
            {'name': f'%{search_name}%'}
        ).fetchone()
        if result and result[0]:
            return int(result[0])
    
    return pack_per_carton

with app.app_context():
    print("=" * 60)
    print("Migrating Production Records to WIP Stock")
    print("=" * 60)
    
    # Clear existing WIP stock data for re-migration
    print("\nClearing existing WIP stock data...")
    WIPStockMovement.query.delete()
    WIPStock.query.delete()
    db.session.commit()
    print("✓ Cleared existing data")
    
    # Get all completed/in_progress work orders with production
    work_orders = WorkOrder.query.filter(
        WorkOrder.status.in_(['completed', 'in_progress']),
        WorkOrder.quantity_good > 0
    ).all()
    
    print(f"\nFound {len(work_orders)} work orders with production output")
    
    products_updated = {}
    
    for wo in work_orders:
        product_id = wo.product_id
        good_qty = float(wo.quantity_good or 0)
        
        if good_qty <= 0:
            continue
        
        # Get product info
        product = db.session.get(Product, product_id)
        if not product:
            print(f"  ⚠ Product not found for WO {wo.wo_number}")
            continue
        
        # Get pack_per_carton from products_new table
        pack_per_carton = get_pack_per_carton(product.code, product.name)
        carton_qty = int(good_qty / pack_per_carton) if pack_per_carton > 0 else 0
        pcs_qty = int(good_qty)
        
        if product_id not in products_updated:
            products_updated[product_id] = {
                'name': product.name,
                'code': product.code,
                'total_pcs': 0,
                'total_carton': 0,
                'pack_per_carton': pack_per_carton,
                'last_wo': wo.wo_number,
                'wo_count': 0
            }
        
        products_updated[product_id]['total_pcs'] += pcs_qty
        products_updated[product_id]['total_carton'] += carton_qty
        products_updated[product_id]['last_wo'] = wo.wo_number
        products_updated[product_id]['wo_count'] += 1
    
    print(f"\n{len(products_updated)} products with WIP to migrate")
    print("-" * 60)
    
    # Create or update WIP Stock records
    for product_id, data in products_updated.items():
        # Check if WIP stock already exists
        wip_stock = WIPStock.query.filter_by(product_id=product_id).first()
        
        if wip_stock:
            print(f"  ✓ {data['code']} - {data['name']}: Already exists, skipping")
            continue
        
        # Create new WIP stock
        wip_stock = WIPStock(
            product_id=product_id,
            quantity_pcs=data['total_pcs'],
            quantity_carton=data['total_carton'],
            pack_per_carton=data['pack_per_carton'],
            last_wo_number=data['last_wo'],
            last_updated_at=datetime.utcnow()
        )
        db.session.add(wip_stock)
        db.session.flush()
        
        # Create initial movement record
        movement = WIPStockMovement(
            wip_stock_id=wip_stock.id,
            product_id=product_id,
            movement_type='in',
            quantity_pcs=data['total_pcs'],
            quantity_carton=data['total_carton'],
            balance_pcs=data['total_pcs'],
            balance_carton=data['total_carton'],
            reference_type='migration',
            reference_id=0,
            reference_number='MIGRATION',
            notes=f"Migrasi dari {data['wo_count']} Work Order historis",
            created_by=1
        )
        db.session.add(movement)
        
        print(f"  ✓ {data['code']} - {data['name']}: {data['total_carton']} karton ({data['total_pcs']:,} pcs) from {data['wo_count']} WO")
    
    db.session.commit()
    
    print("\n" + "=" * 60)
    print("✓ Migration completed!")
    print("=" * 60)
    
    # Show summary
    total_wip = WIPStock.query.count()
    total_cartons = db.session.query(func.sum(WIPStock.quantity_carton)).scalar() or 0
    total_pcs = db.session.query(func.sum(WIPStock.quantity_pcs)).scalar() or 0
    
    print(f"\nWIP Stock Summary:")
    print(f"  - Total Products: {total_wip}")
    print(f"  - Total Cartons: {total_cartons:,}")
    print(f"  - Total Pcs: {total_pcs:,}")
