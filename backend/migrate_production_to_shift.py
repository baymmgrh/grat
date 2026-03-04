"""
Script to migrate existing ProductionRecord data to ShiftProduction
Run this once to sync historical data
"""
from app import create_app
from models import db
from models.production import ProductionRecord, ShiftProduction, WorkOrder
from datetime import datetime, time

def migrate_production_records():
    app = create_app()
    with app.app_context():
        # Get all ProductionRecord that don't have corresponding ShiftProduction
        records = ProductionRecord.query.all()
        
        migrated = 0
        skipped = 0
        errors = 0
        
        for record in records:
            try:
                # Check if ShiftProduction already exists for this record
                existing = ShiftProduction.query.filter_by(
                    work_order_id=record.work_order_id,
                    production_date=record.production_date.date() if record.production_date else None,
                    shift=f"shift_{record.shift}" if record.shift else "shift_1"
                ).first()
                
                if existing:
                    print(f"Skipping record {record.id} - ShiftProduction already exists")
                    skipped += 1
                    continue
                
                # Get work order for additional info
                wo = WorkOrder.query.get(record.work_order_id)
                if not wo:
                    print(f"Skipping record {record.id} - WorkOrder not found")
                    skipped += 1
                    continue
                
                # Calculate values
                production_date = record.production_date.date() if record.production_date else datetime.now().date()
                shift_key = f"shift_{record.shift}" if record.shift else "shift_1"
                
                # Shift times
                shift_times = {
                    'shift_1': (time(7, 0), time(15, 0)),
                    'shift_2': (time(15, 0), time(23, 0)),
                    'shift_3': (time(23, 0), time(7, 0))
                }
                shift_start, shift_end = shift_times.get(shift_key, (time(7, 0), time(15, 0)))
                
                # Calculate metrics
                planned_runtime = 480  # Default 8 hours
                downtime_minutes = record.downtime_minutes or 0
                actual_runtime = planned_runtime - downtime_minutes
                
                quantity_produced = float(record.quantity_produced) if record.quantity_produced else 0
                quantity_good = float(record.quantity_good) if record.quantity_good else 0
                quantity_scrap = float(record.quantity_scrap) if record.quantity_scrap else 0
                
                # Quality rate
                quality_rate = (quantity_good / quantity_produced * 100) if quantity_produced > 0 else 100
                
                # Efficiency rate (simple calculation based on downtime)
                efficiency_rate = ((planned_runtime - downtime_minutes) / planned_runtime * 100) if planned_runtime > 0 else 100
                
                # OEE score
                oee_score = (efficiency_rate * quality_rate) / 100
                
                # Create ShiftProduction
                shift_production = ShiftProduction(
                    production_date=production_date,
                    shift=shift_key,
                    shift_start=shift_start,
                    shift_end=shift_end,
                    machine_id=wo.machine_id,
                    product_id=wo.product_id,
                    work_order_id=record.work_order_id,
                    target_quantity=wo.quantity or 0,
                    actual_quantity=quantity_produced,
                    good_quantity=quantity_good,
                    reject_quantity=quantity_scrap,
                    rework_quantity=0,
                    uom=record.uom or 'pcs',
                    planned_runtime=planned_runtime,
                    actual_runtime=actual_runtime,
                    downtime_minutes=downtime_minutes,
                    # Default downtime to 'others' since we don't have category breakdown
                    downtime_mesin=0,
                    downtime_operator=0,
                    downtime_material=0,
                    downtime_design=0,
                    downtime_others=downtime_minutes,
                    # Loss percentages
                    loss_mesin=0,
                    loss_operator=0,
                    loss_material=0,
                    loss_design=0,
                    loss_others=round((downtime_minutes / planned_runtime * 100) if planned_runtime > 0 else 0, 2),
                    # Rates
                    quality_rate=round(quality_rate, 2),
                    efficiency_rate=round(efficiency_rate, 2),
                    oee_score=round(oee_score, 2),
                    operator_id=record.operator_id,
                    notes=record.notes,
                    status='completed'
                )
                
                db.session.add(shift_production)
                migrated += 1
                print(f"Migrated record {record.id} -> ShiftProduction")
                
            except Exception as e:
                print(f"Error migrating record {record.id}: {e}")
                errors += 1
        
        # Commit all changes
        db.session.commit()
        
        print(f"\n=== Migration Complete ===")
        print(f"Migrated: {migrated}")
        print(f"Skipped: {skipped}")
        print(f"Errors: {errors}")
        print(f"Total ShiftProduction records: {ShiftProduction.query.count()}")

if __name__ == '__main__':
    migrate_production_records()
