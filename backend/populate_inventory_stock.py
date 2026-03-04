"""
Populate inventory stock for testing Warehouse Auto-Deduction
"""
from models import db, Material, Inventory, Product, BillOfMaterials, BOMItem, WorkOrder, WorkOrderBOMItem
from models.warehouse import WarehouseLocation
from app import create_app
from datetime import datetime, timedelta
import random

app = create_app()

with app.app_context():
    print("=" * 60)
    print("POPULATE INVENTORY STOCK FOR TESTING")
    print("=" * 60)
    
    # 1. Update existing inventory with stock
    print("\n1. Updating Inventory Stock...")
    inventories = Inventory.query.limit(50).all()
    
    updated_count = 0
    for inv in inventories:
        # Add random stock between 500-2000
        stock_qty = random.randint(500, 2000)
        inv.quantity_on_hand = stock_qty
        inv.quantity_available = stock_qty
        inv.quantity_reserved = 0
        inv.updated_at = datetime.utcnow()
        updated_count += 1
    
    db.session.commit()
    print(f"   [OK] Updated {updated_count} inventory records with stock")
    
    # 2. Check products
    print("\n2. Checking Products...")
    product = Product.query.first()
    if not product:
        print("   [ERROR] No products found!")
        exit(1)
    print(f"   Using Product: {product.name} (ID: {product.id})")
    
    # 3. Check or create BOM
    print("\n3. Setting up BOM...")
    bom = BillOfMaterials.query.filter_by(product_id=product.id).first()
    
    if not bom:
        print("   Creating new BOM...")
        bom = BillOfMaterials(
            bom_number=f'BOM-TEST-{product.id:04d}',
            product_id=product.id,
            version='1.0',
            is_active=True,
            batch_uom='pcs',
            created_at=datetime.utcnow()
        )
        db.session.add(bom)
        db.session.flush()
        
        # Add BOM items from materials that have inventory
        materials_with_stock = db.session.query(Material).join(
            Inventory, Inventory.material_id == Material.id
        ).filter(Inventory.quantity_on_hand > 0).limit(3).all()
        
        for i, mat in enumerate(materials_with_stock):
            bom_item = BOMItem(
                bom_id=bom.id,
                line_number=i + 1,
                material_id=mat.id,
                quantity=10.0 * (i + 1),
                uom='kg',
                created_at=datetime.utcnow()
            )
            db.session.add(bom_item)
            print(f"   - Added BOM item: {mat.name}, Qty: {10.0 * (i + 1)}")
        
        db.session.commit()
        print(f"   [OK] BOM created with ID: {bom.id}")
    else:
        print(f"   [OK] Using existing BOM ID: {bom.id}")
    
    # 4. Create Test Work Order
    print("\n4. Creating Test Work Order...")
    
    # Delete old test WO if exists
    old_test_wo = WorkOrder.query.filter_by(wo_number='WO-TEST-AUTO-001').first()
    if old_test_wo:
        WorkOrderBOMItem.query.filter_by(work_order_id=old_test_wo.id).delete()
        db.session.delete(old_test_wo)
        db.session.commit()
        print("   Deleted old test WO")
    
    test_wo = WorkOrder(
        wo_number='WO-TEST-AUTO-001',
        product_id=product.id,
        bom_id=bom.id,
        quantity=100,
        quantity_produced=0,
        quantity_good=0,
        quantity_reject=0,
        status='released',
        priority='normal',
        required_date=datetime.utcnow() + timedelta(days=7),
        created_at=datetime.utcnow()
    )
    db.session.add(test_wo)
    db.session.flush()
    print(f"   [OK] Created WO: {test_wo.wo_number} (ID: {test_wo.id})")
    
    # 5. Create WorkOrderBOMItems
    print("\n5. Creating Work Order BOM Items...")
    
    bom_items = BOMItem.query.filter_by(bom_id=bom.id).all()
    for bom_item in bom_items:
        wo_bom_item = WorkOrderBOMItem(
            work_order_id=test_wo.id,
            bom_item_id=bom_item.id,
            material_id=bom_item.material_id,
            product_id=bom_item.product_id,
            quantity_required=float(bom_item.quantity) * test_wo.quantity / 100,
            uom=bom_item.uom
        )
        db.session.add(wo_bom_item)
        
        mat_name = bom_item.material.name if bom_item.material else "Unknown"
        print(f"   - Added: {mat_name}, Qty: {wo_bom_item.quantity_required}")
    
    db.session.commit()
    
    # 6. Verify Material Availability
    print("\n6. Verifying Material Availability...")
    wo_bom_items = WorkOrderBOMItem.query.filter_by(work_order_id=test_wo.id).all()
    all_available = True
    
    for item in wo_bom_items:
        if item.material_id:
            inv = Inventory.query.filter_by(material_id=item.material_id).first()
            available = float(inv.quantity_on_hand) if inv else 0
            required = float(item.quantity_required)
            status = "[OK]" if available >= required else "[SHORTAGE]"
            
            mat_name = item.material.name if item.material else "Unknown"
            print(f"   - {mat_name}")
            print(f"     Required: {required}, Available: {available} {status}")
            
            if available < required:
                all_available = False
    
    # 7. Summary
    print("\n" + "=" * 60)
    print("INVENTORY POPULATED SUCCESSFULLY!")
    print("=" * 60)
    print(f"Inventory Records Updated: {updated_count}")
    print(f"Work Order Created: {test_wo.wo_number} (ID: {test_wo.id})")
    print(f"Product: {product.name}")
    print(f"BOM ID: {bom.id}")
    print(f"Status: {test_wo.status}")
    print(f"BOM Items: {len(wo_bom_items)}")
    print(f"\nMaterial Availability: {'[OK] All Available' if all_available else '[SHORTAGE] Some Insufficient'}")
    
    print("\n" + "=" * 60)
    print("READY FOR TESTING!")
    print("=" * 60)
    print("\nTest Commands:")
    print(f"\n1. Check Material Availability:")
    print(f"   GET /api/production/work-orders/{test_wo.id}/material-availability")
    print(f"\n2. Start Production (Auto-Deduct):")
    print(f"   PUT /api/production/work-orders/{test_wo.id}/status")
    print(f"   Body: {{'status': 'in_progress', 'auto_deduct': true}}")
    print(f"\n3. Verify Inventory Movements:")
    print(f"   SELECT * FROM inventory_movements WHERE reference_id = {test_wo.id}")
    print("=" * 60)
