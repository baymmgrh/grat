"""
Create test data for Warehouse Auto-Deduction testing
"""
from models import db, WorkOrder, BillOfMaterials, BOMItem, WorkOrderBOMItem, Inventory, Product, Material
from models.warehouse import WarehouseLocation
from app import create_app
from datetime import datetime, timedelta

app = create_app()

with app.app_context():
    print("=" * 60)
    print("CREATING TEST DATA FOR WAREHOUSE AUTO-DEDUCTION")
    print("=" * 60)
    
    # 1. Find or create a product
    print("\n1. Setting up Product...")
    product = Product.query.first()
    if not product:
        print("   [ERROR] No products found in database!")
        print("   Please create a product first.")
        exit(1)
    print(f"   Using Product: {product.name} (ID: {product.id})")
    
    # 2. Find or create materials
    print("\n2. Setting up Materials...")
    materials = Material.query.limit(3).all()
    if len(materials) < 2:
        print("   [ERROR] Not enough materials found!")
        print("   Please create at least 2 materials first.")
        exit(1)
    
    for mat in materials:
        print(f"   - Material: {mat.name} (ID: {mat.id})")
    
    # 3. Create or find BOM
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
        
        # Add BOM items
        for i, mat in enumerate(materials[:2]):
            bom_item = BOMItem(
                bom_id=bom.id,
                line_number=i + 1,
                material_id=mat.id,
                quantity=10.0 * (i + 1),  # 10, 20, etc.
                uom='kg',
                created_at=datetime.utcnow()
            )
            db.session.add(bom_item)
        
        db.session.commit()
        print(f"   [OK] BOM created with ID: {bom.id}")
    else:
        print(f"   [OK] Using existing BOM ID: {bom.id}")
    
    # 4. Setup Inventory with sufficient stock
    print("\n4. Setting up Inventory...")
    
    # Get or create warehouse location
    location = WarehouseLocation.query.first()
    if not location:
        print("   [ERROR] No warehouse location found!")
        print("   Please create warehouse location first.")
        exit(1)
    
    print(f"   Using Location: {location.location_code}")
    
    for mat in materials[:2]:
        inv = Inventory.query.filter_by(material_id=mat.id).first()
        
        if not inv:
            print(f"   Creating inventory for {mat.name}...")
            inv = Inventory(
                material_id=mat.id,
                location_id=location.id,
                quantity_on_hand=1000.0,  # Sufficient stock
                quantity_reserved=0,
                quantity_available=1000.0,
                created_at=datetime.utcnow()
            )
            db.session.add(inv)
        else:
            # Update to ensure sufficient stock
            inv.quantity_on_hand = 1000.0
            inv.quantity_available = 1000.0
            print(f"   Updated inventory for {mat.name}: {inv.quantity_on_hand}")
    
    db.session.commit()
    print("   [OK] Inventory setup complete")
    
    # 5. Create Test Work Order
    print("\n5. Creating Test Work Order...")
    
    # Check if test WO already exists
    test_wo = WorkOrder.query.filter_by(wo_number='WO-TEST-AUTO-001').first()
    
    if test_wo:
        print(f"   Test WO already exists: {test_wo.wo_number}")
        print(f"   Updating to 'released' status...")
        test_wo.status = 'released'
        test_wo.bom_id = bom.id
    else:
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
    
    # 6. Create WorkOrderBOMItems
    print("\n6. Creating Work Order BOM Items...")
    
    # Clear existing items
    WorkOrderBOMItem.query.filter_by(work_order_id=test_wo.id).delete()
    
    bom_items = BOMItem.query.filter_by(bom_id=bom.id).all()
    for bom_item in bom_items:
        wo_bom_item = WorkOrderBOMItem(
            work_order_id=test_wo.id,
            bom_item_id=bom_item.id,
            material_id=bom_item.material_id,
            product_id=bom_item.product_id,
            quantity_required=float(bom_item.quantity) * test_wo.quantity / 100,  # Scale to WO qty
            uom=bom_item.uom
        )
        db.session.add(wo_bom_item)
        
        mat_name = bom_item.material.name if bom_item.material else "Unknown"
        print(f"   - Added: {mat_name}, Qty: {wo_bom_item.quantity_required}")
    
    db.session.commit()
    
    # 7. Summary
    print("\n" + "=" * 60)
    print("TEST DATA CREATED SUCCESSFULLY!")
    print("=" * 60)
    print(f"Work Order: {test_wo.wo_number} (ID: {test_wo.id})")
    print(f"Product: {product.name}")
    print(f"BOM ID: {bom.id}")
    print(f"Status: {test_wo.status}")
    print(f"Quantity: {test_wo.quantity}")
    
    wo_bom_items = WorkOrderBOMItem.query.filter_by(work_order_id=test_wo.id).all()
    print(f"\nBOM Items: {len(wo_bom_items)}")
    for item in wo_bom_items:
        mat_name = item.material.name if item.material else "Unknown"
        inv = Inventory.query.filter_by(material_id=item.material_id).first()
        available = float(inv.quantity_on_hand) if inv else 0
        print(f"  - {mat_name}: Required={item.quantity_required}, Available={available}")
    
    print("\n" + "=" * 60)
    print("READY FOR TESTING!")
    print("=" * 60)
    print("\nNext Steps:")
    print("1. Start backend: python run.py")
    print("2. Test Material Availability:")
    print(f"   GET /api/production/work-orders/{test_wo.id}/material-availability")
    print("\n3. Test Auto-Deduction:")
    print(f"   PUT /api/production/work-orders/{test_wo.id}/status")
    print("   Body: {'status': 'in_progress', 'auto_deduct': true}")
    print("\n4. Verify inventory movements created")
    print("=" * 60)
