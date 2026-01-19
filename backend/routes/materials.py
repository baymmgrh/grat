from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Material, Inventory, InventoryMovement
from sqlalchemy import func, desc, and_, or_
from datetime import datetime, date, timedelta
import json

materials_bp = Blueprint('materials', __name__)


@materials_bp.route('/', methods=['GET'])
@jwt_required()
def get_materials():
    """Get all materials with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        material_type = request.args.get('type')
        search = request.args.get('search', '')
        
        query = Material.query
        
        # Filter by type
        if material_type:
            query = query.filter(Material.material_type == material_type)
        
        # Search filter
        if search:
            query = query.filter(
                or_(
                    Material.name.ilike(f'%{search}%'),
                    Material.code.ilike(f'%{search}%'),
                    Material.description.ilike(f'%{search}%')
                )
            )
        
        # Pagination
        materials = query.order_by(Material.code).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'materials': [{
                'id': m.id,
                'code': m.code,
                'name': m.name,
                'material_type': m.material_type,
                'category': m.category,
                'description': m.description,
                'unit_of_measure': m.primary_uom,
                'cost_per_unit': float(m.cost_per_unit) if m.cost_per_unit else 0,
                'supplier': m.supplier.name if m.supplier else None,
                'is_active': m.is_active,
                'created_at': m.created_at.isoformat() if m.created_at else None
            } for m in materials.items],
            'pagination': {
                'page': materials.page,
                'pages': materials.pages,
                'per_page': materials.per_page,
                'total': materials.total,
                'has_next': materials.has_next,
                'has_prev': materials.has_prev
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@materials_bp.route('/types', methods=['GET'])
@jwt_required()
def get_material_types():
    """Get material types with counts"""
    try:
        types = db.session.query(
            Material.material_type,
            func.count(Material.id).label('count')
        ).group_by(Material.material_type).all()
        
        return jsonify({
            'types': [{
                'type': t.material_type,
                'count': t.count,
                'label': {
                    'raw_materials': 'Raw Materials',
                    'chemical_materials': 'Chemical Materials', 
                    'packaging_materials': 'Packaging Materials'
                }.get(t.material_type, t.material_type.title())
            } for t in types]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@materials_bp.route('/inventory', methods=['GET'])
@jwt_required()
def get_materials_inventory():
    """Get materials with inventory levels"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        material_type = request.args.get('type')
        low_stock_only = request.args.get('low_stock', 'false').lower() == 'true'
        
        # Query materials with inventory
        query = db.session.query(
            Material.id,
            Material.code,
            Material.name,
            Material.material_type,
            Material.unit_of_measure,
            func.coalesce(func.sum(Inventory.quantity_on_hand), 0).label('total_stock'),
            func.coalesce(func.sum(Inventory.quantity_available), 0).label('available_stock'),
            func.coalesce(func.sum(Inventory.quantity_reserved), 0).label('reserved_stock')
        ).outerjoin(Inventory, Material.id == Inventory.material_id).group_by(
            Material.id, Material.code, Material.name, Material.material_type, Material.unit_of_measure
        )
        
        # Filter by type
        if material_type:
            query = query.filter(Material.material_type == material_type)
        
        # Filter low stock (assuming min stock level of 10 for demo)
        if low_stock_only:
            query = query.having(func.coalesce(func.sum(Inventory.quantity_on_hand), 0) < 10)
        
        # Pagination
        results = query.order_by(Material.code).offset((page-1)*per_page).limit(per_page).all()
        total = query.count()
        
        return jsonify({
            'materials': [{
                'id': r.id,
                'code': r.code,
                'name': r.name,
                'material_type': r.material_type,
                'unit_of_measure': r.unit_of_measure,
                'total_stock': float(r.total_stock),
                'available_stock': float(r.available_stock),
                'reserved_stock': float(r.reserved_stock),
                'stock_status': 'low' if r.total_stock < 10 else 'normal'
            } for r in results],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@materials_bp.route('/movements', methods=['GET'])
@jwt_required()
def get_material_movements():
    """Get material inventory movements"""
    try:
        material_id = request.args.get('material_id', type=int)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = db.session.query(
            InventoryMovement.id,
            InventoryMovement.movement_type,
            InventoryMovement.quantity,
            InventoryMovement.reference_number,
            InventoryMovement.notes,
            InventoryMovement.created_at,
            Material.code.label('material_code'),
            Material.name.label('material_name')
        ).join(Material, InventoryMovement.material_id == Material.id)
        
        if material_id:
            query = query.filter(InventoryMovement.material_id == material_id)
        
        movements = query.order_by(desc(InventoryMovement.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'movements': [{
                'id': m.id,
                'movement_type': m.movement_type,
                'quantity': float(m.quantity),
                'reference_number': m.reference_number,
                'notes': m.notes,
                'created_at': m.created_at.isoformat(),
                'material_code': m.material_code,
                'material_name': m.material_name
            } for m in movements.items],
            'pagination': {
                'page': movements.page,
                'pages': movements.pages,
                'per_page': movements.per_page,
                'total': movements.total
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@materials_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_materials_dashboard():
    """Get materials dashboard metrics"""
    try:
        # Basic counts
        total_materials = Material.query.count()
        active_materials = Material.query.filter_by(is_active=True).count()
        
        # By type
        type_counts = db.session.query(
            Material.material_type,
            func.count(Material.id).label('count')
        ).group_by(Material.material_type).all()
        
        # Inventory metrics
        try:
            materials_with_stock = db.session.query(func.count(func.distinct(Inventory.material_id))).scalar() or 0
            total_inventory_value = db.session.query(
                func.sum(Inventory.quantity_on_hand * Material.cost_per_unit)
            ).join(Material, Inventory.material_id == Material.id).scalar() or 0
        except:
            materials_with_stock = 0
            total_inventory_value = 0
        
        # Recent movements
        try:
            recent_movements = InventoryMovement.query.filter(
                InventoryMovement.material_id.isnot(None)
            ).order_by(desc(InventoryMovement.created_at)).limit(5).all()
        except:
            recent_movements = []
        
        return jsonify({
            'summary': {
                'total_materials': total_materials,
                'active_materials': active_materials,
                'materials_with_stock': materials_with_stock,
                'total_inventory_value': float(total_inventory_value)
            },
            'by_type': [{
                'type': t.material_type,
                'count': t.count,
                'label': {
                    'raw_materials': 'Raw Materials',
                    'chemical_materials': 'Chemical Materials',
                    'packaging_materials': 'Packaging Materials'
                }.get(t.material_type, t.material_type.title())
            } for t in type_counts],
            'recent_movements': [{
                'id': m.id,
                'movement_type': m.movement_type,
                'quantity': float(m.quantity),
                'reference_number': m.reference_number,
                'created_at': m.created_at.isoformat()
            } for m in recent_movements]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
