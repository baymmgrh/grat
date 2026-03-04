#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from models import db

app = create_app()

with app.app_context():
    print("Testing production-records endpoint for WO 45...")
    
    try:
        from models.production import WorkOrder, ProductionRecord
        
        # Check if WO 45 exists
        wo = WorkOrder.query.get(45)
        if wo:
            print(f"✅ Work Order 45 found: {wo.wo_number}")
            print(f"   Status: {wo.status}")
        else:
            print("❌ Work Order 45 not found")
            exit()
        
        # Check production records for WO 45
        records = ProductionRecord.query.filter_by(work_order_id=45).all()
        print(f"\n📊 Production Records for WO 45: {len(records)} records")
        
        for r in records:
            print(f"  Record ID {r.id}:")
            print(f"    Date: {r.production_date}")
            print(f"    Shift: {r.shift}")
            print(f"    Quantity Produced: {r.quantity_produced}")
            print(f"    Quantity Good: {r.quantity_good}")
            
            # Check for potential issues
            try:
                qty_scrap = float(r.quantity_scrap) if r.quantity_scrap else 0
                print(f"    Quantity Scrap: {qty_scrap}")
            except Exception as e:
                print(f"    ⚠️  Error with quantity_scrap: {e}")
            
            try:
                downtime = r.downtime_minutes or 0
                print(f"    Downtime: {downtime}")
            except Exception as e:
                print(f"    ⚠️  Error with downtime_minutes: {e}")
            
            try:
                operator_name = r.operator.name if r.operator else None
                print(f"    Operator: {operator_name}")
            except Exception as e:
                print(f"    ⚠️  Error with operator: {e}")
        
        # Try to build the response like the endpoint does
        print("\n🔧 Testing response building...")
        try:
            response_data = [{
                'id': r.id,
                'production_date': r.production_date.isoformat() if r.production_date else None,
                'shift': r.shift,
                'quantity_produced': float(r.quantity_produced) if r.quantity_produced else 0,
                'quantity_good': float(r.quantity_good) if r.quantity_good else 0,
                'quantity_reject': float(r.quantity_scrap) if r.quantity_scrap else 0,
                'setting_sticker': float(r.setting_sticker) if hasattr(r, 'setting_sticker') and r.setting_sticker else 0,
                'setting_packaging': float(r.setting_packaging) if hasattr(r, 'setting_packaging') and r.setting_packaging else 0,
                'downtime_minutes': r.downtime_minutes or 0,
                'operator_name': r.operator.name if r.operator else None,
                'notes': r.notes
            } for r in records]
            
            print(f"✅ Response built successfully with {len(response_data)} records")
        except Exception as e:
            print(f"❌ Error building response: {e}")
            import traceback
            traceback.print_exc()
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
