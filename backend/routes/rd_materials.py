from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, RDMaterial, ResearchProject, Experiment, Supplier, User
from utils.i18n import success_response, error_response, get_message
from utils import generate_number
from datetime import datetime, date
from sqlalchemy import or_
import json
from utils.timezone import get_local_now, get_local_today

rd_materials_bp = Blueprint('rd_materials', __name__)

# ===============================
# R&D MATERIALS MANAGEMENT
# ===============================

@rd_materials_bp.route('/', methods=['GET'])
@jwt_required()
def get_materials():
    """Get all R&D materials with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        project_id = request.args.get('project_id', type=int)
        experiment_id = request.args.get('experiment_id', type=int)
        material_type = request.args.get('material_type')
        status = request.args.get('status')
        search = request.args.get('search')
        
        query = RDMaterial.query
        
        # Apply filters
        if project_id:
            query = query.filter(RDMaterial.project_id == project_id)
        if experiment_id:
            query = query.filter(RDMaterial.experiment_id == experiment_id)
        if material_type:
            query = query.filter(RDMaterial.material_type == material_type)
        if status:
            query = query.filter(RDMaterial.status == status)
        if search:
            query = query.filter(
                or_(
                    RDMaterial.material_name.ilike(f'%{search}%'),
                    RDMaterial.material_code.ilike(f'%{search}%'),
                    RDMaterial.supplier_name.ilike(f'%{search}%')
                )
            )
        
        materials = query.order_by(RDMaterial.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'materials': [{
                'id': m.id,
                'material_name': m.material_name,
                'material_code': m.material_code,
                'material_type': m.material_type,
                'category': m.category,
                'specification': m.specification,
                'project_id': m.project_id,
                'project_name': m.project.project_name if m.project else None,
                'experiment_id': m.experiment_id,
                'experiment_name': m.experiment.experiment_name if m.experiment else None,
                'quantity_requested': float(m.quantity_requested),
                'quantity_used': float(m.quantity_used),
                'quantity_remaining': float(m.quantity_remaining),
                'uom': m.uom,
                'unit_cost': float(m.unit_cost),
                'total_cost': float(m.total_cost),
                'supplier_id': m.supplier_id,
                'supplier_name': m.supplier_name,
                'purchase_date': m.purchase_date.isoformat() if m.purchase_date else None,
                'usage_date': m.usage_date.isoformat() if m.usage_date else None,
                'expiry_date': m.expiry_date.isoformat() if m.expiry_date else None,
                'storage_location': m.storage_location,
                'status': m.status,
                'requested_by': m.requested_by_user.username if m.requested_by_user else None,
                'approved_by': m.approved_by_user.username if m.approved_by_user else None,
                'created_at': m.created_at.isoformat(),
                'updated_at': m.updated_at.isoformat() if m.updated_at else None
            } for m in materials.items],
            'total': materials.total,
            'pages': materials.pages,
            'current_page': materials.page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rd_materials_bp.route('/', methods=['POST'])
@jwt_required()
def create_material_request():
    """Create new material request"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Parse dates
        purchase_date = None
        usage_date = None
        expiry_date = None
        
        if data.get('purchase_date'):
            purchase_date = datetime.strptime(data['purchase_date'], '%Y-%m-%d').date()
        if data.get('usage_date'):
            usage_date = datetime.strptime(data['usage_date'], '%Y-%m-%d').date()
        if data.get('expiry_date'):
            expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
        
        # Calculate total cost
        quantity_requested = data['quantity_requested']
        unit_cost = data.get('unit_cost', 0)
        total_cost = quantity_requested * unit_cost
        
        # Create material request
        material = RDMaterial(
            project_id=data.get('project_id'),
            experiment_id=data.get('experiment_id'),
            material_name=data['material_name'],
            material_code=data.get('material_code'),
            material_type=data.get('material_type', 'raw_material'),
            category=data.get('category'),
            specification=data.get('specification'),
            quantity_requested=quantity_requested,
            quantity_remaining=quantity_requested,  # Initially same as requested
            uom=data['uom'],
            unit_cost=unit_cost,
            total_cost=total_cost,
            supplier_id=data.get('supplier_id'),
            supplier_name=data.get('supplier_name'),
            purchase_date=purchase_date,
            usage_date=usage_date,
            expiry_date=expiry_date,
            storage_location=data.get('storage_location'),
            storage_conditions=data.get('storage_conditions'),
            safety_requirements=data.get('safety_requirements'),
            status=data.get('status', 'requested'),
            requested_by=user_id,
            notes=data.get('notes')
        )
        
        db.session.add(material)
        db.session.commit()
        
        return jsonify({
            'message': 'Material request created successfully',
            'material_id': material.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rd_materials_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_material(id):
    """Get material details"""
    try:
        material = RDMaterial.query.get_or_404(id)
        
        return jsonify({
            'id': material.id,
            'material_name': material.material_name,
            'material_code': material.material_code,
            'material_type': material.material_type,
            'category': material.category,
            'specification': material.specification,
            'project_id': material.project_id,
            'project_name': material.project.project_name if material.project else None,
            'experiment_id': material.experiment_id,
            'experiment_name': material.experiment.experiment_name if material.experiment else None,
            'quantity_requested': float(material.quantity_requested),
            'quantity_used': float(material.quantity_used),
            'quantity_remaining': float(material.quantity_remaining),
            'uom': material.uom,
            'unit_cost': float(material.unit_cost),
            'total_cost': float(material.total_cost),
            'supplier_id': material.supplier_id,
            'supplier_name': material.supplier_name,
            'purchase_date': material.purchase_date.isoformat() if material.purchase_date else None,
            'usage_date': material.usage_date.isoformat() if material.usage_date else None,
            'expiry_date': material.expiry_date.isoformat() if material.expiry_date else None,
            'storage_location': material.storage_location,
            'storage_conditions': material.storage_conditions,
            'safety_requirements': material.safety_requirements,
            'status': material.status,
            'requested_by': material.requested_by,
            'requested_by_name': material.requested_by_user.username if material.requested_by_user else None,
            'approved_by': material.approved_by,
            'approved_by_name': material.approved_by_user.username if material.approved_by_user else None,
            'notes': material.notes,
            'created_at': material.created_at.isoformat(),
            'updated_at': material.updated_at.isoformat() if material.updated_at else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rd_materials_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_material(id):
    """Update material"""
    try:
        material = RDMaterial.query.get_or_404(id)
        data = request.get_json()
        
        # Update fields
        if 'material_name' in data:
            material.material_name = data['material_name']
        if 'material_code' in data:
            material.material_code = data['material_code']
        if 'material_type' in data:
            material.material_type = data['material_type']
        if 'category' in data:
            material.category = data['category']
        if 'specification' in data:
            material.specification = data['specification']
        if 'quantity_requested' in data:
            material.quantity_requested = data['quantity_requested']
        if 'quantity_used' in data:
            material.quantity_used = data['quantity_used']
            # Update remaining quantity
            material.quantity_remaining = material.quantity_requested - material.quantity_used
        if 'uom' in data:
            material.uom = data['uom']
        if 'unit_cost' in data:
            material.unit_cost = data['unit_cost']
            # Recalculate total cost
            material.total_cost = material.quantity_requested * material.unit_cost
        if 'supplier_id' in data:
            material.supplier_id = data['supplier_id']
        if 'supplier_name' in data:
            material.supplier_name = data['supplier_name']
        if 'storage_location' in data:
            material.storage_location = data['storage_location']
        if 'storage_conditions' in data:
            material.storage_conditions = data['storage_conditions']
        if 'safety_requirements' in data:
            material.safety_requirements = data['safety_requirements']
        if 'status' in data:
            material.status = data['status']
        if 'notes' in data:
            material.notes = data['notes']
        
        # Update dates
        if 'purchase_date' in data and data['purchase_date']:
            material.purchase_date = datetime.strptime(data['purchase_date'], '%Y-%m-%d').date()
        if 'usage_date' in data and data['usage_date']:
            material.usage_date = datetime.strptime(data['usage_date'], '%Y-%m-%d').date()
        if 'expiry_date' in data and data['expiry_date']:
            material.expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
        
        # Auto-update status based on usage
        if material.quantity_used >= material.quantity_requested:
            material.status = 'consumed'
        elif material.quantity_used > 0:
            material.status = 'in_use'
        
        material.updated_at = get_local_now()
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rd_materials_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_material(id):
    """Delete material"""
    try:
        material = RDMaterial.query.get_or_404(id)
        
        # Check if material is in use
        if material.status in ['in_use', 'consumed']:
            return jsonify({
                'error': 'Cannot delete material that is in use or consumed'
            }), 400
        
        db.session.delete(material)
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rd_materials_bp.route('/<int:id>/approve', methods=['POST'])
@jwt_required()
def approve_material_request(id):
    """Approve material request"""
    try:
        material = RDMaterial.query.get_or_404(id)
        user_id = get_jwt_identity()
        
        if material.status != 'requested':
            return jsonify(error_response('api.error', error_code=400)), 400
        
        material.approved_by = user_id
        material.status = 'ordered'
        material.updated_at = get_local_now()
        
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rd_materials_bp.route('/<int:id>/receive', methods=['POST'])
@jwt_required()
def receive_material(id):
    """Mark material as received"""
    try:
        material = RDMaterial.query.get_or_404(id)
        data = request.get_json()
        
        if material.status != 'ordered':
            return jsonify(error_response('api.error', error_code=400)), 400
        
        material.status = 'received'
        if data.get('actual_quantity'):
            material.quantity_requested = data['actual_quantity']
            material.quantity_remaining = data['actual_quantity']
        if data.get('actual_cost'):
            material.unit_cost = data['actual_cost']
            material.total_cost = material.quantity_requested * material.unit_cost
        if data.get('storage_location'):
            material.storage_location = data['storage_location']
        
        material.updated_at = get_local_now()
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rd_materials_bp.route('/<int:id>/use', methods=['POST'])
@jwt_required()
def use_material(id):
    """Record material usage"""
    try:
        material = RDMaterial.query.get_or_404(id)
        data = request.get_json()
        
        if material.status not in ['received', 'in_use']:
            return jsonify(error_response('api.error', error_code=400)), 400
        
        quantity_to_use = data['quantity_used']
        
        if quantity_to_use > material.quantity_remaining:
            return jsonify(error_response('api.error', error_code=400)), 400
        
        material.quantity_used += quantity_to_use
        material.quantity_remaining -= quantity_to_use
        
        if not material.usage_date:
            material.usage_date = get_local_today()
        
        # Update status
        if material.quantity_remaining <= 0:
            material.status = 'consumed'
        else:
            material.status = 'in_use'
        
        material.updated_at = get_local_now()
        db.session.commit()
        
        return jsonify({
            'message': 'Material usage recorded successfully',
            'quantity_remaining': float(material.quantity_remaining)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rd_materials_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_materials_analytics():
    """Get materials analytics"""
    try:
        project_id = request.args.get('project_id', type=int)
        
        query = RDMaterial.query
        if project_id:
            query = query.filter(RDMaterial.project_id == project_id)
        
        # Basic counts
        total_materials = query.count()
        requested_materials = query.filter_by(status='requested').count()
        received_materials = query.filter_by(status='received').count()
        consumed_materials = query.filter_by(status='consumed').count()
        
        # Cost analysis
        total_cost = db.session.query(db.func.sum(RDMaterial.total_cost))
        if project_id:
            total_cost = total_cost.filter(RDMaterial.project_id == project_id)
        total_cost = total_cost.scalar() or 0
        
        # Type distribution
        type_stats = db.session.query(
            RDMaterial.material_type,
            db.func.count(RDMaterial.id).label('count'),
            db.func.sum(RDMaterial.total_cost).label('total_cost')
        )
        if project_id:
            type_stats = type_stats.filter(RDMaterial.project_id == project_id)
        type_stats = type_stats.group_by(RDMaterial.material_type).all()
        
        # Status distribution
        status_stats = db.session.query(
            RDMaterial.status,
            db.func.count(RDMaterial.id).label('count')
        )
        if project_id:
            status_stats = status_stats.filter(RDMaterial.project_id == project_id)
        status_stats = status_stats.group_by(RDMaterial.status).all()
        
        # Expiring materials (within 30 days)
        expiring_materials = query.filter(
            RDMaterial.expiry_date.between(get_local_today(), get_local_today().replace(day=get_local_today().day + 30))
        ).count()
        
        return jsonify({
            'summary': {
                'total_materials': total_materials,
                'requested_materials': requested_materials,
                'received_materials': received_materials,
                'consumed_materials': consumed_materials,
                'expiring_materials': expiring_materials,
                'total_cost': float(total_cost),
                'utilization_rate': (consumed_materials / max(1, received_materials)) * 100
            },
            'type_distribution': [
                {
                    'type': t.material_type,
                    'count': t.count,
                    'total_cost': float(t.total_cost) if t.total_cost else 0
                }
                for t in type_stats
            ],
            'status_distribution': [
                {'status': s.status, 'count': s.count}
                for s in status_stats
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rd_materials_bp.route('/suppliers', methods=['GET'])
@jwt_required()
def get_suppliers():
    """Get available suppliers"""
    try:
        suppliers = Supplier.query.filter_by(is_active=True).all()
        
        return jsonify({
            'suppliers': [{
                'id': s.id,
                'company_name': s.company_name,
                'contact_person': s.contact_person,
                'phone': s.phone,
                'email': s.email
            } for s in suppliers]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
