from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, QualityTest, QualityInspection, CAPA, QualityStandard
from models.production import WorkOrder
from models.warehouse import Inventory, InventoryMovement, WarehouseLocation
from utils.i18n import success_response, error_response, get_message
from utils import generate_number
from datetime import datetime
from sqlalchemy import and_, or_
from utils.timezone import get_local_now, get_local_today

quality_bp = Blueprint('quality', __name__)

@quality_bp.route('/tests', methods=['GET'])
@jwt_required()
def get_tests():
    try:
        tests = QualityTest.query.order_by(QualityTest.test_date.desc()).all()
        return jsonify({
            'tests': [{
                'id': t.id,
                'test_number': t.test_number,
                'test_type': t.test_type,
                'product_name': t.product.name,
                'test_date': t.test_date.isoformat(),
                'result': t.result
            } for t in tests]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@quality_bp.route('/tests', methods=['POST'])
@jwt_required()
def create_quality_test():
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())
        
        test_number = generate_number('QT', QualityTest, 'test_number')
        
        test = QualityTest(
            test_number=test_number,
            test_type=data['test_type'],
            product_id=data['product_id'],
            batch_number=data.get('batch_number'),
            lot_number=data.get('lot_number'),
            test_date=datetime.fromisoformat(data['test_date']),
            tested_by=data.get('tested_by'),
            sample_size=data.get('sample_size'),
            test_method=data.get('test_method'),
            test_environment=data.get('test_environment'),
            temperature=data.get('temperature'),
            humidity=data.get('humidity'),
            notes=data.get('notes'),
            result=data.get('overall_result', 'pending'),
            created_by=user_id
        )
        
        db.session.add(test)
        db.session.flush()
        
        # Add test parameters
        for param in data.get('test_parameters', []):
            from models import QualityTestParameter
            test_param = QualityTestParameter(
                test_id=test.id,
                parameter_name=param['parameter_name'],
                expected_value=param['expected_value'],
                actual_value=param['actual_value'],
                unit=param.get('unit'),
                result_status=param['result_status'],
                notes=param.get('notes')
            )
            db.session.add(test_param)
        
        db.session.commit()
        return jsonify({'message': 'Quality test created', 'test_id': test.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@quality_bp.route('/inspections', methods=['GET'])
@jwt_required()
def get_inspections():
    try:
        inspections = QualityInspection.query.order_by(QualityInspection.inspection_date.desc()).all()
        return jsonify({
            'inspections': [{
                'id': i.id,
                'inspection_number': i.inspection_number,
                'inspection_type': i.inspection_type,
                'inspection_date': i.inspection_date.isoformat(),
                'status': i.status,
                'result': i.result
            } for i in inspections]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@quality_bp.route('/inspections', methods=['POST'])
@jwt_required()
def create_inspection():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        inspection_number = generate_number('QI', QualityInspection, 'inspection_number')
        
        inspection = QualityInspection(
            inspection_number=inspection_number,
            inspection_type=data['inspection_type'],
            product_id=data.get('product_id'),
            batch_number=data.get('batch_number'),
            sample_size=data.get('sample_size'),
            inspector_id=user_id
        )
        db.session.add(inspection)
        db.session.commit()
        return jsonify({'message': 'Inspection created', 'inspection_id': inspection.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@quality_bp.route('/capa', methods=['GET'])
@jwt_required()
def get_capas():
    try:
        capas = CAPA.query.order_by(CAPA.issue_date.desc()).all()
        return jsonify({
            'capas': [{
                'id': c.id,
                'capa_number': c.capa_number,
                'capa_type': c.capa_type,
                'issue_date': c.issue_date.isoformat(),
                'status': c.status,
                'problem_description': c.problem_description[:100]
            } for c in capas]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@quality_bp.route('/capa', methods=['POST'])
@jwt_required()
def create_capa():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        capa_number = generate_number('CAPA', CAPA, 'capa_number')
        
        capa = CAPA(
            capa_number=capa_number,
            capa_type=data['capa_type'],
            issue_date=datetime.fromisoformat(data['issue_date']),
            problem_description=data['problem_description'],
            root_cause=data.get('root_cause'),
            action_plan=data.get('action_plan'),
            responsible_person_id=data.get('responsible_person_id'),
            target_date=datetime.fromisoformat(data['target_date']) if data.get('target_date') else None,
            created_by=user_id
        )
        db.session.add(capa)
        db.session.commit()
        return jsonify({'message': 'CAPA created', 'capa_id': capa.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@quality_bp.route('/standards', methods=['GET'])
@jwt_required()
def get_standards():
    try:
        standards = QualityStandard.query.filter_by(is_active=True).all()
        return jsonify({
            'standards': [{
                'id': s.id,
                'code': s.code,
                'name': s.name,
                'standard_type': s.standard_type
            } for s in standards]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============ WORK ORDER QC INTEGRATION ============

@quality_bp.route('/pending-qc', methods=['GET'])
@jwt_required()
def get_pending_qc_work_orders():
    """Get completed work orders that need QC inspection"""
    try:
        # Get completed work orders
        completed_work_orders = WorkOrder.query.filter(
            WorkOrder.status == 'completed'
        ).order_by(WorkOrder.actual_end_date.desc()).all()
        
        # Check which ones already have QC tests
        pending_qc = []
        for wo in completed_work_orders:
            # Check if this work order has a quality test
            existing_test = QualityTest.query.filter(
                QualityTest.reference_type == 'work_order',
                QualityTest.reference_id == wo.id
            ).first()
            
            # Get pack_per_carton from BOM
            pack_per_carton = 0
            if wo.product_id:
                from models.production import BillOfMaterials
                active_bom = BillOfMaterials.query.filter_by(
                    product_id=wo.product_id,
                    is_active=True
                ).first()
                if active_bom and active_bom.pack_per_carton:
                    pack_per_carton = active_bom.pack_per_carton
            
            pending_qc.append({
                'id': wo.id,
                'wo_number': wo.wo_number,
                'product_id': wo.product_id,
                'product_code': wo.product.code if wo.product else None,
                'product_name': wo.product.name if wo.product else None,
                'quantity': float(wo.quantity),
                'quantity_produced': float(wo.quantity_produced or 0),
                'quantity_good': float(wo.quantity_good or 0),
                'quantity_scrap': float(wo.quantity_scrap or 0),
                'uom': wo.uom,
                'pack_per_carton': pack_per_carton,
                'batch_number': wo.batch_number,
                'machine_name': wo.machine.name if wo.machine else None,
                'completed_date': wo.actual_end_date.isoformat() if wo.actual_end_date else None,
                'qc_status': 'completed' if existing_test else 'pending',
                'qc_result': existing_test.result if existing_test else None,
                'qc_test_id': existing_test.id if existing_test else None,
                'qc_test_number': existing_test.test_number if existing_test else None
            })
        
        # Separate into pending and completed QC
        pending = [wo for wo in pending_qc if wo['qc_status'] == 'pending']
        completed = [wo for wo in pending_qc if wo['qc_status'] == 'completed']
        
        return jsonify({
            'pending_qc': pending,
            'completed_qc': completed,
            'total_pending': len(pending),
            'total_completed': len(completed)
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@quality_bp.route('/work-order/<int:wo_id>/qc-test', methods=['POST'])
@jwt_required()
def create_qc_test_for_work_order(wo_id):
    """Create QC test for a completed work order"""
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())
        
        # Get work order
        work_order = WorkOrder.query.get_or_404(wo_id)
        
        if work_order.status != 'completed':
            return jsonify({'error': 'Work order must be completed before QC'}), 400
        
        # Check if QC test already exists
        existing_test = QualityTest.query.filter(
            QualityTest.reference_type == 'work_order',
            QualityTest.reference_id == wo_id
        ).first()
        
        if existing_test:
            return jsonify({'error': 'QC test already exists for this work order', 'test_id': existing_test.id}), 400
        
        # Generate test number
        test_number = generate_number('QT', QualityTest, 'test_number')
        
        # Create QC test
        test = QualityTest(
            test_number=test_number,
            test_type='final',  # Final inspection for completed work order
            product_id=work_order.product_id,
            batch_number=work_order.batch_number or work_order.wo_number,
            reference_type='work_order',
            reference_id=wo_id,
            test_date=get_local_now(),
            tested_by=user_id,
            notes=data.get('notes'),
            result=data.get('result', 'pending')
        )
        
        db.session.add(test)
        db.session.commit()
        
        return jsonify({
            'message': 'QC test created for work order',
            'test_id': test.id,
            'test_number': test.test_number
        }), 201
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@quality_bp.route('/work-order/<int:wo_id>/qc-test', methods=['GET'])
@jwt_required()
def get_qc_test_for_work_order(wo_id):
    """Get QC test for a specific work order"""
    try:
        test = QualityTest.query.filter(
            QualityTest.reference_type == 'work_order',
            QualityTest.reference_id == wo_id
        ).first()
        
        if not test:
            return jsonify({'error': 'No QC test found for this work order'}), 404
        
        return jsonify({
            'test': {
                'id': test.id,
                'test_number': test.test_number,
                'test_type': test.test_type,
                'test_date': test.test_date.isoformat(),
                'result': test.result,
                'notes': test.notes,
                'tested_by': test.tested_by_user.username if test.tested_by_user else None,
                'approved_by': test.approved_by_user.username if test.approved_by_user else None,
                'approved_at': test.approved_at.isoformat() if test.approved_at else None
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@quality_bp.route('/tests/<int:test_id>/result', methods=['PUT'])
@jwt_required()
def update_qc_test_result(test_id):
    """Update QC test result"""
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())
        
        test = QualityTest.query.get_or_404(test_id)
        
        test.result = data.get('result', test.result)
        test.defects_found = data.get('defects_found', test.defects_found)
        test.notes = data.get('notes', test.notes)
        
        # If result is final (passed/failed), set approved
        if data.get('result') in ['passed', 'failed', 'conditional']:
            test.approved_by = user_id
            test.approved_at = get_local_now()
        
        db.session.commit()
        
        return jsonify({
            'message': 'QC test result updated',
            'test_id': test.id,
            'result': test.result
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ===============================
# QC TO WAREHOUSE TRANSFER
# ===============================

@quality_bp.route('/inspections/<int:inspection_id>/set-disposition', methods=['POST'])
@jwt_required()
def set_qc_disposition(inspection_id):
    """
    Set disposition for QC inspection based on checklist results.
    Disposition: released, quarantine, reject
    """
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())
        
        inspection = QualityInspection.query.get_or_404(inspection_id)
        
        # Update checklist counts if provided
        if 'total_checklist_items' in data:
            inspection.total_checklist_items = data['total_checklist_items']
        if 'passed_checklist_items' in data:
            inspection.passed_checklist_items = data['passed_checklist_items']
        if 'failed_checklist_items' in data:
            inspection.failed_checklist_items = data['failed_checklist_items']
        
        # Update quantity tracking
        if 'quantity_inspected' in data:
            inspection.quantity_inspected = data['quantity_inspected']
        if 'quantity_passed' in data:
            inspection.quantity_passed = data['quantity_passed']
        if 'quantity_failed' in data:
            inspection.quantity_failed = data['quantity_failed']
        
        # Calculate or set disposition
        if 'disposition' in data:
            inspection.disposition = data['disposition']
        else:
            inspection.disposition = inspection.calculate_disposition()
        
        inspection.disposition_date = get_local_now()
        inspection.disposition_by = user_id
        inspection.disposition_notes = data.get('disposition_notes')
        
        # Update result based on disposition
        if inspection.disposition == 'released':
            inspection.result = 'pass'
        elif inspection.disposition == 'reject':
            inspection.result = 'fail'
            
            # ============= WASTE INTEGRATION =============
            # Auto-create waste record for rejected items
            from models import WasteRecord, WasteCategory
            
            # Find or create QC Reject waste category
            waste_category = WasteCategory.query.filter_by(name='QC Reject').first()
            if not waste_category:
                waste_category = WasteCategory.query.first()  # Use any category as fallback
            
            if waste_category and inspection.quantity_failed and float(inspection.quantity_failed) > 0:
                from utils import generate_number
                waste_record = WasteRecord(
                    record_number=generate_number('WR', WasteRecord, 'record_number'),
                    category_id=waste_category.id,
                    waste_date=get_local_now(),
                    source_department='Quality Control',
                    work_order_id=inspection.work_order_id,
                    quantity=float(inspection.quantity_failed),
                    uom='pcs',
                    reason=f'QC Rejection - {inspection.inspection_number}: {data.get("disposition_notes", "Failed QC inspection")}',
                    recorded_by=user_id,
                    status='pending'
                )
                db.session.add(waste_record)
        else:
            inspection.result = 'conditional'
        
        inspection.status = 'completed'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Disposition set successfully',
            'inspection_id': inspection.id,
            'disposition': inspection.disposition,
            'result': inspection.result,
            'waste_created': inspection.disposition == 'reject'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@quality_bp.route('/inspections/<int:inspection_id>/transfer-to-warehouse', methods=['POST'])
@jwt_required()
def transfer_qc_to_warehouse(inspection_id):
    """
    Transfer QC passed/quarantine items to Warehouse Finished Goods.
    Creates inventory record with appropriate stock_status.
    """
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())
        
        inspection = QualityInspection.query.get_or_404(inspection_id)
        
        if inspection.transferred_to_warehouse:
            return jsonify({'error': 'Already transferred to warehouse'}), 400
        
        if not inspection.disposition:
            return jsonify({'error': 'Disposition not set. Please set disposition first.'}), 400
        
        if inspection.disposition == 'reject':
            return jsonify({'error': 'Rejected items cannot be transferred to warehouse. Needs rework.'}), 400
        
        # Get warehouse location
        location_id = data.get('location_id')
        if not location_id:
            # Find default finished goods location
            fg_location = WarehouseLocation.query.join(WarehouseLocation.zone).filter(
                WarehouseLocation.zone.has(material_type='finished_goods'),
                WarehouseLocation.is_active == True,
                WarehouseLocation.is_available == True
            ).first()
            
            if not fg_location:
                return jsonify({'error': 'No available finished goods warehouse location'}), 400
            location_id = fg_location.id
        
        location = WarehouseLocation.query.get(location_id)
        if not location:
            return jsonify({'error': 'Warehouse location not found'}), 404
        
        # Get quantity to transfer
        quantity = float(inspection.quantity_passed or inspection.quantity_inspected or 0)
        if quantity <= 0:
            return jsonify({'error': 'No quantity to transfer'}), 400
        
        # Get work order for batch info
        work_order = inspection.work_order
        
        # Create or update inventory record
        existing_inventory = Inventory.query.filter_by(
            product_id=inspection.product_id,
            location_id=location_id,
            batch_number=inspection.batch_number,
            stock_status=inspection.disposition
        ).first()
        
        if existing_inventory:
            existing_inventory.quantity_on_hand += quantity
            existing_inventory.quantity_available += quantity
            existing_inventory.updated_at = get_local_now()
            inventory = existing_inventory
        else:
            inventory = Inventory(
                product_id=inspection.product_id,
                location_id=location_id,
                quantity_on_hand=quantity,
                quantity_available=quantity,
                batch_number=inspection.batch_number,
                production_date=work_order.actual_end.date() if work_order and work_order.actual_end else get_local_now().date(),
                stock_status=inspection.disposition,  # released or quarantine
                qc_inspection_id=inspection.id,
                work_order_id=inspection.work_order_id,
                qc_date=get_local_now(),
                qc_notes=inspection.disposition_notes,
                created_by=user_id
            )
            db.session.add(inventory)
        
        db.session.flush()
        
        # Create inventory movement record
        movement = InventoryMovement(
            inventory_id=inventory.id,
            product_id=inspection.product_id,
            location_id=location_id,
            movement_type='stock_in',
            movement_date=get_local_now().date(),
            quantity=quantity,
            reference_type='qc_inspection',
            reference_id=inspection.id,
            reference_number=inspection.inspection_number,
            batch_number=inspection.batch_number,
            notes=f'Transfer from QC - {inspection.disposition.upper()}',
            created_by=user_id
        )
        db.session.add(movement)
        
        # Update inspection
        inspection.transferred_to_warehouse = True
        inspection.warehouse_transfer_date = get_local_now()
        inspection.warehouse_location_id = location_id
        
        # Update location occupied
        location.occupied = float(location.occupied or 0) + quantity
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully transferred to warehouse as {inspection.disposition.upper()}',
            'inspection_id': inspection.id,
            'inventory_id': inventory.id,
            'location_code': location.location_code,
            'quantity': quantity,
            'stock_status': inspection.disposition
        }), 200
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@quality_bp.route('/inspections/pending-transfer', methods=['GET'])
@jwt_required()
def get_pending_warehouse_transfer():
    """
    Get QC inspections that are completed but not yet transferred to warehouse.
    """
    try:
        inspections = QualityInspection.query.filter(
            QualityInspection.status == 'completed',
            QualityInspection.transferred_to_warehouse == False,
            QualityInspection.disposition.in_(['released', 'quarantine'])
        ).order_by(QualityInspection.inspection_date.desc()).all()
        
        result = []
        for insp in inspections:
            work_order = insp.work_order
            result.append({
                'id': insp.id,
                'inspection_number': insp.inspection_number,
                'inspection_date': insp.inspection_date.isoformat() if insp.inspection_date else None,
                'product_id': insp.product_id,
                'product_name': insp.product.name if insp.product else None,
                'product_code': insp.product.code if insp.product else None,
                'work_order_id': insp.work_order_id,
                'work_order_number': work_order.wo_number if work_order else None,
                'batch_number': insp.batch_number,
                'quantity_passed': float(insp.quantity_passed or 0),
                'disposition': insp.disposition,
                'disposition_date': insp.disposition_date.isoformat() if insp.disposition_date else None,
                'total_checklist_items': insp.total_checklist_items,
                'passed_checklist_items': insp.passed_checklist_items,
                'failed_checklist_items': insp.failed_checklist_items
            })
        
        return jsonify({
            'pending_transfers': result,
            'total_count': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@quality_bp.route('/warehouse/by-status', methods=['GET'])
@jwt_required()
def get_inventory_by_qc_status():
    """
    Get inventory grouped by QC status (released, quarantine, reject).
    """
    try:
        status = request.args.get('status')  # released, quarantine, reject
        
        query = Inventory.query.filter(Inventory.product_id.isnot(None))
        
        if status:
            query = query.filter(Inventory.stock_status == status)
        
        items = query.order_by(Inventory.created_at.desc()).all()
        
        result = []
        for item in items:
            result.append({
                'id': item.id,
                'product_id': item.product_id,
                'product_name': item.product.name if item.product else None,
                'product_code': item.product.code if item.product else None,
                'location_code': item.location.location_code if item.location else None,
                'quantity_on_hand': float(item.quantity_on_hand),
                'quantity_available': float(item.quantity_available),
                'batch_number': item.batch_number,
                'stock_status': item.stock_status,
                'qc_date': item.qc_date.isoformat() if item.qc_date else None,
                'production_date': item.production_date.isoformat() if item.production_date else None
            })
        
        # Summary
        summary = {
            'released': sum(float(i.quantity_on_hand) for i in items if i.stock_status == 'released'),
            'quarantine': sum(float(i.quantity_on_hand) for i in items if i.stock_status == 'quarantine'),
            'reject': sum(float(i.quantity_on_hand) for i in items if i.stock_status == 'reject')
        }
        
        return jsonify({
            'inventory': result,
            'summary': summary,
            'total_count': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============ QC BARANG MASUK (INCOMING MATERIAL QC) ============

@quality_bp.route('/incoming-materials', methods=['GET'])
@jwt_required()
def get_incoming_materials_for_qc():
    """Get received materials that need QC inspection"""
    try:
        from models.purchasing import PurchaseOrder, PurchaseOrderItem
        from models.warehouse import GoodsReceipt, GoodsReceiptItem
        
        status = request.args.get('status', 'pending')
        
        # Get goods receipts that need QC
        query = GoodsReceipt.query.filter(
            GoodsReceipt.status == 'received'
        ).order_by(GoodsReceipt.received_date.desc())
        
        materials = []
        for gr in query.all():
            for item in gr.items:
                # Check if QC already done for this item
                existing_inspection = QualityInspection.query.filter(
                    QualityInspection.reference_type == 'goods_receipt_item',
                    QualityInspection.reference_id == item.id
                ).first()
                
                qc_status = 'pending'
                if existing_inspection:
                    if existing_inspection.result == 'accepted':
                        qc_status = 'passed'
                    elif existing_inspection.result == 'rejected':
                        qc_status = 'rejected'
                    elif existing_inspection.result == 'conditional':
                        qc_status = 'conditional'
                    else:
                        qc_status = 'inspecting'
                
                # Filter by status
                if status != 'all' and qc_status != status:
                    continue
                
                materials.append({
                    'id': item.id,
                    'gr_number': gr.gr_number,
                    'po_number': gr.purchase_order.po_number if gr.purchase_order else None,
                    'supplier_name': gr.purchase_order.supplier.name if gr.purchase_order and gr.purchase_order.supplier else 'Unknown',
                    'material_id': item.material_id,
                    'material_code': item.material.code if item.material else None,
                    'material_name': item.material.name if item.material else None,
                    'batch_number': item.batch_number,
                    'quantity': float(item.quantity_received or 0),
                    'uom': item.uom or 'pcs',
                    'received_date': gr.received_date.isoformat() if gr.received_date else None,
                    'qc_status': qc_status,
                    'inspection_id': existing_inspection.id if existing_inspection else None,
                    'inspector_name': existing_inspection.inspector.username if existing_inspection and existing_inspection.inspector else None,
                    'inspected_date': existing_inspection.inspection_date.isoformat() if existing_inspection and existing_inspection.inspection_date else None,
                })
        
        return jsonify({
            'materials': materials,
            'total': len(materials)
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@quality_bp.route('/incoming-materials/<int:item_id>/inspect', methods=['POST'])
@jwt_required()
def inspect_incoming_material(item_id):
    """Create QC inspection for incoming material"""
    try:
        from models.warehouse import GoodsReceiptItem
        
        data = request.get_json()
        user_id = int(get_jwt_identity())
        
        # Get goods receipt item
        gr_item = GoodsReceiptItem.query.get_or_404(item_id)
        
        # Check if inspection already exists
        existing = QualityInspection.query.filter(
            QualityInspection.reference_type == 'goods_receipt_item',
            QualityInspection.reference_id == item_id
        ).first()
        
        if existing:
            return jsonify({'error': 'Inspection already exists', 'inspection_id': existing.id}), 400
        
        # Generate inspection number
        inspection_number = generate_number('IQC', QualityInspection, 'inspection_number')
        
        # Build notes from form data
        notes_parts = [
            f"Visual Inspection: {data.get('visual_inspection', 'N/A').upper()}",
            f"Packaging Condition: {data.get('packaging_condition', 'N/A')}",
            f"Quantity Verified: {'Yes' if data.get('quantity_verified') else 'No'}",
            f"Sample Size: {data.get('sample_size', 0)}",
            f"Defects Found: {data.get('defect_found', 0)}",
            f"Lab Test Required: {'Yes' if data.get('lab_test_required') else 'No'}",
        ]
        if data.get('notes'):
            notes_parts.append(f"\nNotes: {data.get('notes')}")
        
        # Create inspection
        inspection = QualityInspection(
            inspection_number=inspection_number,
            inspection_type='incoming',
            inspection_date=get_local_now(),
            reference_type='goods_receipt_item',
            reference_id=item_id,
            product_id=gr_item.material_id,
            batch_number=gr_item.batch_number,
            sample_size=data.get('sample_size', 0),
            defect_count=data.get('defect_found', 0),
            status='completed',
            result=data.get('result', 'pending'),
            findings=data.get('notes', ''),
            notes='\n'.join(notes_parts),
            inspector_id=user_id,
            created_by=user_id
        )
        
        db.session.add(inspection)
        db.session.commit()
        
        return jsonify({
            'message': 'Inspection saved successfully',
            'inspection_id': inspection.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============ QC DALAM PROSES (IN-PROCESS QC / IPQC) ============

@quality_bp.route('/in-process', methods=['GET'])
@jwt_required()
def get_in_process_qc():
    """Get active production processes for IPQC"""
    try:
        from models.production import ShiftProduction
        
        status = request.args.get('status', 'all')
        
        # Get active work orders (in_progress status)
        active_work_orders = WorkOrder.query.filter(
            WorkOrder.status == 'in_progress'
        ).order_by(WorkOrder.scheduled_start_date.desc()).all()
        
        processes = []
        for wo in active_work_orders:
            # Get latest shift production data
            latest_sp = ShiftProduction.query.filter_by(
                work_order_id=wo.id
            ).order_by(ShiftProduction.production_date.desc(), ShiftProduction.shift.desc()).first()
            
            # Get IPQC inspections for this work order
            ipqc_inspections = QualityInspection.query.filter(
                QualityInspection.reference_type == 'work_order_ipqc',
                QualityInspection.reference_id == wo.id
            ).order_by(QualityInspection.inspection_date.desc()).all()
            
            # Determine QC status based on latest inspection
            qc_status = 'pending'
            last_inspection = None
            defect_rate = 0
            
            if ipqc_inspections:
                last_insp = ipqc_inspections[0]
                last_inspection = last_insp.inspection_date.isoformat() if last_insp.inspection_date else None
                
                if last_insp.result == 'passed':
                    qc_status = 'passed'
                elif last_insp.result == 'warning':
                    qc_status = 'warning'
                elif last_insp.result == 'critical':
                    qc_status = 'critical'
                
                # Calculate defect rate
                if last_insp.sample_size and last_insp.sample_size > 0:
                    defect_rate = round((last_insp.defect_count or 0) / last_insp.sample_size * 100, 1)
            
            # Filter by status
            if status != 'all' and qc_status != status:
                continue
            
            current_output = float(wo.quantity_produced or 0)
            if latest_sp:
                current_output = float(latest_sp.good_quantity or 0) + float(latest_sp.scrap_quantity or 0)
            
            processes.append({
                'id': wo.id,
                'wo_number': wo.wo_number,
                'product_code': wo.product.code if wo.product else None,
                'product_name': wo.product.name if wo.product else None,
                'machine_name': wo.machine.name if wo.machine else None,
                'operator_name': latest_sp.operator.username if latest_sp and latest_sp.operator else 'N/A',
                'shift': latest_sp.shift if latest_sp else 1,
                'production_date': latest_sp.production_date.isoformat() if latest_sp and latest_sp.production_date else wo.scheduled_start_date.isoformat() if wo.scheduled_start_date else None,
                'current_output': current_output,
                'target_output': float(wo.quantity or 0),
                'uom': wo.uom or 'pcs',
                'qc_status': qc_status,
                'last_inspection': last_inspection,
                'defect_rate': defect_rate,
                'inspection_count': len(ipqc_inspections)
            })
        
        return jsonify({
            'processes': processes,
            'total': len(processes)
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@quality_bp.route('/in-process/<int:wo_id>/inspect', methods=['POST'])
@jwt_required()
def create_ipqc_inspection(wo_id):
    """Create IPQC inspection for active work order"""
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())
        
        # Get work order
        work_order = WorkOrder.query.get_or_404(wo_id)
        
        if work_order.status != 'in_progress':
            return jsonify({'error': 'Work order must be in progress for IPQC'}), 400
        
        # Generate inspection number
        inspection_number = generate_number('IPQC', QualityInspection, 'inspection_number')
        
        # Build notes from form data
        notes_parts = [
            f"Checkpoint: {data.get('checkpoint', 'N/A')}",
            f"Visual Check: {data.get('visual_check', 'N/A').upper()}",
            f"Process Compliance: {data.get('process_compliance', 'N/A')}",
            f"Sample Qty: {data.get('sample_qty', 0)}",
            f"Defect Qty: {data.get('defect_qty', 0)}",
        ]
        
        # Add parameter checks
        for param in data.get('parameter_checks', []):
            notes_parts.append(f"  - {param.get('name')}: Target={param.get('target')}, Actual={param.get('actual')}, Status={param.get('status')}")
        
        # Add defect types
        if data.get('defect_types'):
            notes_parts.append(f"Defect Types: {', '.join(data.get('defect_types', []))}")
        
        if data.get('corrective_action'):
            notes_parts.append(f"Corrective Action: {data.get('corrective_action')}")
        
        if data.get('notes'):
            notes_parts.append(f"Notes: {data.get('notes')}")
        
        # Create inspection
        inspection = QualityInspection(
            inspection_number=inspection_number,
            inspection_type='in_process',
            inspection_date=get_local_now(),
            reference_type='work_order_ipqc',
            reference_id=wo_id,
            product_id=work_order.product_id,
            sample_size=data.get('sample_qty', 0),
            defect_count=data.get('defect_qty', 0),
            status='completed',
            result=data.get('result', 'passed'),
            findings=data.get('corrective_action', ''),
            notes='\n'.join(notes_parts),
            inspector_id=user_id,
            created_by=user_id
        )
        
        db.session.add(inspection)
        db.session.commit()
        
        return jsonify({
            'message': 'IPQC inspection saved successfully',
            'inspection_id': inspection.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
