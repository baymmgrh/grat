"""
R&D Integration Routes
Connects R&D Legacy module with Products, Production, Warehouse, and Quality modules
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.rd import ResearchProject, Experiment, ProductDevelopment, RDMaterial, Prototype
from models.product import Product, Material
from models.production import BillOfMaterials, BOMItem, Machine
from models.warehouse import WarehouseZone, WarehouseLocation, Inventory
from models.quality import QualityTest
from utils.i18n import success_response, error_response
from utils import generate_number
from utils.timezone import get_local_now
from datetime import datetime
from sqlalchemy import or_

rd_integration_bp = Blueprint('rd_integration', __name__)

# ===============================
# PRODUCT INTEGRATION
# ===============================

@rd_integration_bp.route('/products/lookup', methods=['GET'])
@jwt_required()
def lookup_products():
    """Get products for linking to R&D developments"""
    try:
        search = request.args.get('search', '')
        category = request.args.get('category')
        limit = request.args.get('limit', 50, type=int)
        
        query = Product.query
        
        if search:
            query = query.filter(
                or_(
                    Product.code.ilike(f'%{search}%'),
                    Product.name.ilike(f'%{search}%')
                )
            )
        if category:
            query = query.filter(Product.category == category)
            
        products = query.limit(limit).all()
        
        return jsonify({
            'products': [{
                'id': p.id,
                'code': p.code,
                'name': p.name,
                'category': p.category,
                'type': p.type,
                'uom': p.uom,
                'has_bom': bool(p.bom)
            } for p in products]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@rd_integration_bp.route('/products/create-from-development/<int:dev_id>', methods=['POST'])
@jwt_required()
def create_product_from_development(dev_id):
    """Create a new product from R&D product development"""
    try:
        user_id = get_jwt_identity()
        development = ProductDevelopment.query.get_or_404(dev_id)
        
        if development.status != 'approved':
            return jsonify({'error': 'Product development must be approved first'}), 400
        
        data = request.get_json() or {}
        
        # Generate product code
        product_code = data.get('code') or generate_number('PRD', Product, 'code')
        
        # Check if product already exists
        existing = Product.query.filter_by(code=product_code).first()
        if existing:
            return jsonify({'error': f'Product with code {product_code} already exists'}), 400
        
        # Create new product
        product = Product(
            code=product_code,
            name=development.product_name,
            category=development.product_category or 'Finished Goods',
            type=data.get('type', 'finished_good'),
            uom=data.get('uom', 'pcs'),
            description=data.get('description', development.notes),
            selling_price=float(development.target_selling_price) if development.target_selling_price else 0,
            created_by=user_id
        )
        
        db.session.add(product)
        
        # Link development to product
        development.linked_product_id = product.id
        development.actual_launch_date = get_local_now().date()
        development.development_stage = 'launched'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Product created successfully',
            'product': {
                'id': product.id,
                'code': product.code,
                'name': product.name
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ===============================
# BOM / PRODUCTION INTEGRATION
# ===============================

@rd_integration_bp.route('/bom/lookup', methods=['GET'])
@jwt_required()
def lookup_boms():
    """Get BOMs for reference"""
    try:
        search = request.args.get('search', '')
        product_id = request.args.get('product_id', type=int)
        limit = request.args.get('limit', 50, type=int)
        
        query = BillOfMaterials.query
        
        if search:
            query = query.filter(
                or_(
                    BillOfMaterials.bom_number.ilike(f'%{search}%'),
                    BillOfMaterials.name.ilike(f'%{search}%')
                )
            )
        if product_id:
            query = query.filter(BillOfMaterials.product_id == product_id)
            
        boms = query.limit(limit).all()
        
        return jsonify({
            'boms': [{
                'id': b.id,
                'bom_number': b.bom_number,
                'name': b.name,
                'product_id': b.product_id,
                'product_name': b.product.name if b.product else None,
                'version': b.version,
                'is_active': b.is_active,
                'item_count': len(b.items) if b.items else 0
            } for b in boms]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@rd_integration_bp.route('/bom/create-from-prototype/<int:prototype_id>', methods=['POST'])
@jwt_required()
def create_bom_from_prototype(prototype_id):
    """Create BOM from R&D prototype specifications"""
    try:
        user_id = get_jwt_identity()
        prototype = Prototype.query.get_or_404(prototype_id)
        development = prototype.product_development
        
        if not development:
            return jsonify({'error': 'Prototype must be linked to a product development'}), 400
        
        data = request.get_json() or {}
        product_id = data.get('product_id')
        
        if not product_id:
            return jsonify({'error': 'product_id is required'}), 400
        
        product = Product.query.get_or_404(product_id)
        
        # Generate BOM number
        bom_number = generate_number('BOM', BillOfMaterials, 'bom_number')
        
        # Create BOM
        bom = BillOfMaterials(
            bom_number=bom_number,
            name=f"BOM - {product.name}",
            product_id=product.id,
            version='1.0',
            is_active=True,
            batch_size=data.get('batch_size', 1),
            batch_uom=data.get('batch_uom', product.uom or 'pcs'),
            notes=f"Created from R&D Prototype: {prototype.prototype_number}",
            created_by=user_id
        )
        
        db.session.add(bom)
        db.session.flush()
        
        # Add prototype materials as BOM items if available
        if prototype.bill_of_materials:
            import json
            try:
                proto_bom = json.loads(prototype.bill_of_materials)
                line_number = 1
                for item in proto_bom:
                    material = Material.query.filter_by(code=item.get('material_code')).first()
                    bom_item = BOMItem(
                        bom_id=bom.id,
                        line_number=line_number,
                        material_id=material.id if material else None,
                        material_code=item.get('material_code'),
                        material_name=item.get('material_name'),
                        quantity=item.get('quantity', 0),
                        uom=item.get('uom', 'kg'),
                        notes=item.get('notes')
                    )
                    db.session.add(bom_item)
                    line_number += 1
            except (json.JSONDecodeError, TypeError):
                pass
        
        db.session.commit()
        
        return jsonify({
            'message': 'BOM created successfully',
            'bom': {
                'id': bom.id,
                'bom_number': bom.bom_number,
                'name': bom.name,
                'product_id': bom.product_id
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ===============================
# MATERIALS / WAREHOUSE INTEGRATION
# ===============================

@rd_integration_bp.route('/materials/lookup', methods=['GET'])
@jwt_required()
def lookup_materials():
    """Get materials from warehouse for R&D use"""
    try:
        search = request.args.get('search', '')
        category = request.args.get('category')
        limit = request.args.get('limit', 50, type=int)
        
        query = Material.query
        
        if search:
            query = query.filter(
                or_(
                    Material.code.ilike(f'%{search}%'),
                    Material.name.ilike(f'%{search}%')
                )
            )
        if category:
            query = query.filter(Material.category == category)
            
        materials = query.limit(limit).all()
        
        return jsonify({
            'materials': [{
                'id': m.id,
                'code': m.code,
                'name': m.name,
                'category': m.category,
                'uom': m.uom,
                'unit_price': float(m.unit_price) if m.unit_price else 0,
                'current_stock': float(m.current_stock) if hasattr(m, 'current_stock') and m.current_stock else 0
            } for m in materials]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@rd_integration_bp.route('/materials/request-from-warehouse', methods=['POST'])
@jwt_required()
def request_material_from_warehouse():
    """Request material from warehouse for R&D project"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        project_id = data.get('project_id')
        experiment_id = data.get('experiment_id')
        material_id = data.get('material_id')
        quantity = data.get('quantity', 0)
        
        if not material_id or not quantity:
            return jsonify({'error': 'material_id and quantity are required'}), 400
        
        material = Material.query.get_or_404(material_id)
        
        # Create RD Material request linked to warehouse material
        rd_material = RDMaterial(
            project_id=project_id,
            experiment_id=experiment_id,
            material_name=material.name,
            material_code=material.code,
            material_type=material.category,
            quantity_requested=quantity,
            quantity_remaining=quantity,
            uom=material.uom,
            unit_cost=float(material.unit_price) if material.unit_price else 0,
            total_cost=float(material.unit_price * quantity) if material.unit_price else 0,
            status='requested',
            requested_by=user_id,
            warehouse_material_id=material_id  # Link to warehouse
        )
        
        db.session.add(rd_material)
        db.session.commit()
        
        return jsonify({
            'message': 'Material request created',
            'rd_material': {
                'id': rd_material.id,
                'material_name': rd_material.material_name,
                'quantity_requested': float(rd_material.quantity_requested),
                'status': rd_material.status
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@rd_integration_bp.route('/warehouses/lookup', methods=['GET'])
@jwt_required()
def lookup_warehouses():
    """Get warehouse zones for storage location"""
    try:
        zones = WarehouseZone.query.filter_by(is_active=True).all()
        
        return jsonify({
            'warehouses': [{
                'id': z.id,
                'code': z.code,
                'name': z.name,
                'type': z.zone_type,
                'description': z.description
            } for z in zones]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===============================
# MACHINE / EQUIPMENT INTEGRATION
# ===============================

@rd_integration_bp.route('/machines/lookup', methods=['GET'])
@jwt_required()
def lookup_machines():
    """Get machines for experiment equipment"""
    try:
        search = request.args.get('search', '')
        machine_type = request.args.get('type')
        limit = request.args.get('limit', 50, type=int)
        
        query = Machine.query.filter_by(is_active=True)
        
        if search:
            query = query.filter(
                or_(
                    Machine.code.ilike(f'%{search}%'),
                    Machine.name.ilike(f'%{search}%')
                )
            )
        if machine_type:
            query = query.filter(Machine.type == machine_type)
            
        machines = query.limit(limit).all()
        
        return jsonify({
            'machines': [{
                'id': m.id,
                'code': m.code,
                'name': m.name,
                'type': m.type,
                'status': m.status,
                'location': m.location
            } for m in machines]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===============================
# QUALITY INTEGRATION
# ===============================

@rd_integration_bp.route('/quality/create-test-from-experiment/<int:exp_id>', methods=['POST'])
@jwt_required()
def create_quality_test_from_experiment(exp_id):
    """Create quality test based on R&D experiment results"""
    try:
        user_id = get_jwt_identity()
        experiment = Experiment.query.get_or_404(exp_id)
        
        if experiment.status != 'completed':
            return jsonify({'error': 'Experiment must be completed first'}), 400
        
        data = request.get_json() or {}
        
        # Create quality test based on experiment
        test = QualityTest(
            test_number=generate_number('QT', QualityTest, 'test_number'),
            test_name=f"R&D Test - {experiment.experiment_name}",
            test_type='rd_experiment',
            source_type='experiment',
            source_id=experiment.id,
            test_date=get_local_now(),
            parameters=experiment.parameters,
            results=experiment.results,
            status='completed' if experiment.success else 'failed',
            passed=experiment.success,
            conducted_by=user_id,
            notes=f"Created from R&D Experiment: {experiment.experiment_number}"
        )
        
        db.session.add(test)
        db.session.commit()
        
        return jsonify({
            'message': 'Quality test created',
            'test': {
                'id': test.id,
                'test_number': test.test_number,
                'test_name': test.test_name,
                'passed': test.passed
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@rd_integration_bp.route('/quality/tests', methods=['GET'])
@jwt_required()
def get_rd_quality_tests():
    """Get quality tests related to R&D"""
    try:
        experiment_id = request.args.get('experiment_id', type=int)
        
        query = QualityTest.query.filter_by(source_type='experiment')
        
        if experiment_id:
            query = query.filter_by(source_id=experiment_id)
        
        tests = query.order_by(QualityTest.test_date.desc()).limit(50).all()
        
        return jsonify({
            'tests': [{
                'id': t.id,
                'test_number': t.test_number,
                'test_name': t.test_name,
                'test_date': t.test_date.isoformat() if t.test_date else None,
                'passed': t.passed,
                'status': t.status
            } for t in tests]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===============================
# SUPPLIER INTEGRATION
# ===============================

@rd_integration_bp.route('/suppliers/lookup', methods=['GET'])
@jwt_required()
def lookup_suppliers():
    """Get suppliers for R&D material procurement"""
    try:
        from models.purchasing import Supplier
        
        search = request.args.get('search', '')
        limit = request.args.get('limit', 50, type=int)
        
        query = Supplier.query.filter_by(is_active=True)
        
        if search:
            query = query.filter(
                or_(
                    Supplier.code.ilike(f'%{search}%'),
                    Supplier.name.ilike(f'%{search}%')
                )
            )
            
        suppliers = query.limit(limit).all()
        
        return jsonify({
            'suppliers': [{
                'id': s.id,
                'code': s.code,
                'name': s.name,
                'contact_person': s.contact_person,
                'phone': s.phone,
                'email': s.email
            } for s in suppliers]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
