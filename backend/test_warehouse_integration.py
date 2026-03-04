"""
Test script for Warehouse Auto-Deduction Integration
"""
from models import db, WorkOrder, WorkOrderBOMItem, Inventory, InventoryMovement
from models.product import Material, Product
from app import create_app

app = create_app()

with app.app_context():
    print("=" * 60)
    print("WAREHOUSE AUTO-DEDUCTION TEST")
    print("=" * 60)
    
    # 1. Find Work Orders with BOM
    print("\n1. Checking Work Orders with BOM...")
    wos = WorkOrder.query.filter(
        WorkOrder.bom_id.isnot(None),
        WorkOrder.status.in_(['planned', 'released'])
    ).limit(5).all()
    
    print(f"   Found {len(wos)} Work Orders with BOM")
    for wo in wos:
        product_name = wo.product.name if wo.product else "N/A"
        print(f"   - ID: {wo.id}, WO: {wo.wo_number}, Status: {wo.status}, Product: {product_name}")
    
    if not wos:
        print("   WARNING: No Work Orders with BOM found!")
        print("   Creating test data is recommended.")
    else:
        test_wo = wos[0]
        print(f"\n   Using WO ID {test_wo.id} ({test_wo.wo_number}) for testing")
        
        # 2. Check BOM Items
        print(f"\n2. Checking BOM Items for WO {test_wo.wo_number}...")
        bom_items = WorkOrderBOMItem.query.filter_by(work_order_id=test_wo.id).all()
        print(f"   Found {len(bom_items)} BOM items")
        
        for item in bom_items:
            if item.material_id:
                mat = Material.query.get(item.material_id)
                mat_name = mat.name if mat else "Unknown"
                print(f"   - Material: {mat_name}, Required: {item.quantity_required}")
            elif item.product_id:
                prod = Product.query.get(item.product_id)
                prod_name = prod.name if prod else "Unknown"
                print(f"   - Product: {prod_name}, Required: {item.quantity_required}")
        
        # 3. Check Inventory Availability
        print(f"\n3. Checking Inventory Availability...")
        all_available = True
        
        for item in bom_items:
            required_qty = float(item.quantity_required) if item.quantity_required else 0
            
            if item.material_id:
                inv = Inventory.query.filter_by(material_id=item.material_id).first()
                available_qty = float(inv.quantity_on_hand) if inv else 0
                mat = Material.query.get(item.material_id)
                mat_name = mat.name if mat else "Unknown"
                
                status = "[OK]" if available_qty >= required_qty else "[SHORTAGE]"
                print(f"   - {mat_name}: Required={required_qty}, Available={available_qty} {status}")
                
                if available_qty < required_qty:
                    all_available = False
            
            elif item.product_id:
                inv = Inventory.query.filter_by(product_id=item.product_id).first()
                available_qty = float(inv.quantity_on_hand) if inv else 0
                prod = Product.query.get(item.product_id)
                prod_name = prod.name if prod else "Unknown"
                
                status = "[OK]" if available_qty >= required_qty else "[SHORTAGE]"
                print(f"   - {prod_name}: Required={required_qty}, Available={available_qty} {status}")
                
                if available_qty < required_qty:
                    all_available = False
        
        print(f"\n   Overall Status: {'[OK] All materials available' if all_available else '[SHORTAGE] Some materials insufficient'}")
        
        # 4. Check existing inventory movements
        print(f"\n4. Checking Existing Inventory Movements for this WO...")
        movements = InventoryMovement.query.filter_by(
            reference_type='work_order',
            reference_id=test_wo.id
        ).all()
        
        print(f"   Found {len(movements)} existing movements")
        for mov in movements:
            print(f"   - Type: {mov.movement_type}, Qty: {mov.quantity}, Date: {mov.created_at}")
    
    # 5. Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"[OK] Database connection: OK")
    print(f"[OK] Models loaded: OK")
    print(f"{'[OK]' if wos else '[WARN]'} Work Orders with BOM: {len(wos)} found")
    
    if wos:
        test_wo = wos[0]
        bom_items = WorkOrderBOMItem.query.filter_by(work_order_id=test_wo.id).all()
        print(f"{'[OK]' if bom_items else '[WARN]'} BOM Items: {len(bom_items)} found")
        print(f"\nNext Steps:")
        print(f"   1. Start backend server: python run.py")
        print(f"   2. Test API endpoint:")
        print(f"      GET /api/production/work-orders/{test_wo.id}/material-availability")
        print(f"   3. Test status change:")
        print(f"      PUT /api/production/work-orders/{test_wo.id}/status")
        print(f"      Body: {{'status': 'in_progress', 'auto_deduct': true}}")
    else:
        print(f"\n[WARN] No test data available")
        print(f"   Please create a Work Order with BOM first")
    
    print("=" * 60)
