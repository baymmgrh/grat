"""
Unit of Measure (UoM) Routes
CRUD untuk master satuan dan konversi antar satuan.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.uom import UnitOfMeasure, UoMConversion
from utils.i18n import success_response, error_response
from utils.timezone import get_local_now

uom_bp = Blueprint('uom', __name__)


# ============= UNIT OF MEASURE (MASTER SATUAN) =============

@uom_bp.route('/units', methods=['GET'])
@jwt_required()
def get_units():
    """Get all units of measure"""
    try:
        category = request.args.get('category')
        search = request.args.get('search', '')
        active_only = request.args.get('active_only', 'true').lower() == 'true'

        query = UnitOfMeasure.query

        if active_only:
            query = query.filter(UnitOfMeasure.is_active == True)

        if category:
            query = query.filter(UnitOfMeasure.category == category)

        if search:
            query = query.filter(
                db.or_(
                    UnitOfMeasure.code.ilike(f'%{search}%'),
                    UnitOfMeasure.name.ilike(f'%{search}%')
                )
            )

        units = query.order_by(UnitOfMeasure.category, UnitOfMeasure.code).all()

        return jsonify({
            'units': [u.to_dict() for u in units],
            'total': len(units)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@uom_bp.route('/units/<int:id>', methods=['GET'])
@jwt_required()
def get_unit(id):
    """Get single unit of measure with its conversions"""
    try:
        unit = UnitOfMeasure.query.get_or_404(id)

        unit_data = unit.to_dict()

        # Get conversions where this unit is the source
        conversions_from = UoMConversion.query.filter_by(
            from_uom_id=id, is_active=True
        ).all()

        # Get conversions where this unit is the target
        conversions_to = UoMConversion.query.filter_by(
            to_uom_id=id, is_active=True
        ).all()

        unit_data['conversions_from'] = [c.to_dict() for c in conversions_from]
        unit_data['conversions_to'] = [c.to_dict() for c in conversions_to]

        return jsonify({'unit': unit_data}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@uom_bp.route('/units', methods=['POST'])
@jwt_required()
def create_unit():
    """Create new unit of measure"""
    try:
        data = request.get_json()

        if not data.get('code') or not data.get('name'):
            return error_response('Code dan name wajib diisi'), 400

        code = data['code'].upper().strip()

        # Check duplicate
        existing = UnitOfMeasure.query.filter_by(code=code).first()
        if existing:
            return error_response(f'Satuan dengan kode {code} sudah ada'), 400

        unit = UnitOfMeasure(
            code=code,
            name=data['name'].strip(),
            category=data.get('category', 'unit'),
            description=data.get('description'),
            is_active=True
        )
        db.session.add(unit)
        db.session.commit()

        return jsonify({
            'message': 'Satuan berhasil dibuat',
            'unit': unit.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@uom_bp.route('/units/<int:id>', methods=['PUT'])
@jwt_required()
def update_unit(id):
    """Update unit of measure"""
    try:
        unit = UnitOfMeasure.query.get_or_404(id)
        data = request.get_json()

        if 'code' in data:
            new_code = data['code'].upper().strip()
            existing = UnitOfMeasure.query.filter(
                UnitOfMeasure.code == new_code,
                UnitOfMeasure.id != id
            ).first()
            if existing:
                return error_response(f'Satuan dengan kode {new_code} sudah ada'), 400
            unit.code = new_code

        if 'name' in data:
            unit.name = data['name'].strip()
        if 'category' in data:
            unit.category = data['category']
        if 'description' in data:
            unit.description = data['description']
        if 'is_active' in data:
            unit.is_active = data['is_active']

        db.session.commit()

        return jsonify({
            'message': 'Satuan berhasil diupdate',
            'unit': unit.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@uom_bp.route('/units/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_unit(id):
    """Delete unit of measure (soft delete — set inactive)"""
    try:
        unit = UnitOfMeasure.query.get_or_404(id)

        # Check if used in conversions
        conversion_count = UoMConversion.query.filter(
            db.or_(
                UoMConversion.from_uom_id == id,
                UoMConversion.to_uom_id == id
            ),
            UoMConversion.is_active == True
        ).count()

        if conversion_count > 0:
            return error_response(
                f'Satuan ini masih digunakan di {conversion_count} konversi. '
                f'Hapus konversi terlebih dahulu atau nonaktifkan satuan.'
            ), 400

        unit.is_active = False
        db.session.commit()

        return jsonify({'message': 'Satuan berhasil dinonaktifkan'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============= UOM CONVERSIONS =============

@uom_bp.route('/conversions', methods=['GET'])
@jwt_required()
def get_conversions():
    """Get UoM conversions with filters"""
    try:
        material_id = request.args.get('material_id', type=int)
        product_id = request.args.get('product_id', type=int)
        from_uom_id = request.args.get('from_uom_id', type=int)
        to_uom_id = request.args.get('to_uom_id', type=int)
        scope = request.args.get('scope')  # global, material, product

        query = UoMConversion.query.filter(UoMConversion.is_active == True)

        if material_id:
            # Get conversions for specific material + global defaults
            query = query.filter(
                db.or_(
                    UoMConversion.material_id == material_id,
                    db.and_(UoMConversion.material_id.is_(None), UoMConversion.product_id.is_(None))
                )
            )
        elif product_id:
            # Get conversions for specific product + global defaults
            query = query.filter(
                db.or_(
                    UoMConversion.product_id == product_id,
                    db.and_(UoMConversion.material_id.is_(None), UoMConversion.product_id.is_(None))
                )
            )
        elif scope == 'global':
            query = query.filter(
                UoMConversion.material_id.is_(None),
                UoMConversion.product_id.is_(None)
            )
        elif scope == 'material':
            query = query.filter(UoMConversion.material_id.isnot(None))
        elif scope == 'product':
            query = query.filter(UoMConversion.product_id.isnot(None))

        if from_uom_id:
            query = query.filter(UoMConversion.from_uom_id == from_uom_id)
        if to_uom_id:
            query = query.filter(UoMConversion.to_uom_id == to_uom_id)

        conversions = query.order_by(UoMConversion.from_uom_id, UoMConversion.to_uom_id).all()

        return jsonify({
            'conversions': [c.to_dict() for c in conversions],
            'total': len(conversions)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@uom_bp.route('/conversions', methods=['POST'])
@jwt_required()
def create_conversion():
    """Create UoM conversion"""
    try:
        data = request.get_json()

        from_uom_id = data.get('from_uom_id')
        to_uom_id = data.get('to_uom_id')
        conversion_factor = data.get('conversion_factor')

        if not from_uom_id or not to_uom_id or not conversion_factor:
            return error_response('from_uom_id, to_uom_id, dan conversion_factor wajib diisi'), 400

        if from_uom_id == to_uom_id:
            return error_response('Satuan asal dan tujuan tidak boleh sama'), 400

        if float(conversion_factor) <= 0:
            return error_response('Conversion factor harus lebih dari 0'), 400

        # Validate UoMs exist
        from_uom = UnitOfMeasure.query.get(from_uom_id)
        to_uom = UnitOfMeasure.query.get(to_uom_id)
        if not from_uom or not to_uom:
            return error_response('Satuan tidak ditemukan'), 404

        material_id = data.get('material_id')
        product_id = data.get('product_id')

        # Check duplicate
        existing = UoMConversion.query.filter_by(
            from_uom_id=from_uom_id,
            to_uom_id=to_uom_id,
            material_id=material_id,
            product_id=product_id
        ).first()
        if existing:
            return error_response('Konversi ini sudah ada'), 400

        conversion = UoMConversion(
            from_uom_id=from_uom_id,
            to_uom_id=to_uom_id,
            conversion_factor=float(conversion_factor),
            material_id=material_id,
            product_id=product_id,
            notes=data.get('notes'),
            is_active=True
        )
        db.session.add(conversion)

        # Auto-create reverse conversion
        reverse = UoMConversion(
            from_uom_id=to_uom_id,
            to_uom_id=from_uom_id,
            conversion_factor=round(1.0 / float(conversion_factor), 10),
            material_id=material_id,
            product_id=product_id,
            notes=f'Auto-reverse: {data.get("notes", "")}',
            is_active=True
        )
        db.session.add(reverse)

        db.session.commit()

        return jsonify({
            'message': f'Konversi berhasil dibuat: 1 {from_uom.code} = {conversion_factor} {to_uom.code}',
            'conversion': conversion.to_dict(),
            'reverse_conversion': reverse.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@uom_bp.route('/conversions/<int:id>', methods=['PUT'])
@jwt_required()
def update_conversion(id):
    """Update UoM conversion"""
    try:
        conversion = UoMConversion.query.get_or_404(id)
        data = request.get_json()

        if 'conversion_factor' in data:
            new_factor = float(data['conversion_factor'])
            if new_factor <= 0:
                return error_response('Conversion factor harus lebih dari 0'), 400
            conversion.conversion_factor = new_factor

            # Update reverse conversion if exists
            reverse = UoMConversion.query.filter_by(
                from_uom_id=conversion.to_uom_id,
                to_uom_id=conversion.from_uom_id,
                material_id=conversion.material_id,
                product_id=conversion.product_id
            ).first()
            if reverse:
                reverse.conversion_factor = round(1.0 / new_factor, 10)

        if 'notes' in data:
            conversion.notes = data['notes']
        if 'is_active' in data:
            conversion.is_active = data['is_active']

        db.session.commit()

        return jsonify({
            'message': 'Konversi berhasil diupdate',
            'conversion': conversion.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@uom_bp.route('/conversions/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_conversion(id):
    """Delete UoM conversion (and its reverse)"""
    try:
        conversion = UoMConversion.query.get_or_404(id)

        # Find and delete reverse
        reverse = UoMConversion.query.filter_by(
            from_uom_id=conversion.to_uom_id,
            to_uom_id=conversion.from_uom_id,
            material_id=conversion.material_id,
            product_id=conversion.product_id
        ).first()

        if reverse:
            db.session.delete(reverse)

        db.session.delete(conversion)
        db.session.commit()

        return jsonify({'message': 'Konversi berhasil dihapus'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============= CONVERSION HELPER =============

@uom_bp.route('/convert', methods=['GET'])
@jwt_required()
def convert_quantity():
    """
    Convert quantity between UoMs for a specific material/product.
    Query params: from_uom_id, to_uom_id, quantity, material_id (optional), product_id (optional)
    """
    try:
        from_uom_id = request.args.get('from_uom_id', type=int)
        to_uom_id = request.args.get('to_uom_id', type=int)
        quantity = request.args.get('quantity', type=float)
        material_id = request.args.get('material_id', type=int)
        product_id = request.args.get('product_id', type=int)

        if not from_uom_id or not to_uom_id or quantity is None:
            return error_response('from_uom_id, to_uom_id, dan quantity wajib diisi'), 400

        if from_uom_id == to_uom_id:
            from_uom = UnitOfMeasure.query.get(from_uom_id)
            return jsonify({
                'from_quantity': quantity,
                'from_uom': from_uom.code if from_uom else '?',
                'to_quantity': quantity,
                'to_uom': from_uom.code if from_uom else '?',
                'conversion_factor': 1.0
            }), 200

        # Look for specific conversion first (material/product), then global
        conversion = None

        if material_id:
            conversion = UoMConversion.query.filter_by(
                from_uom_id=from_uom_id, to_uom_id=to_uom_id,
                material_id=material_id, is_active=True
            ).first()

        if not conversion and product_id:
            conversion = UoMConversion.query.filter_by(
                from_uom_id=from_uom_id, to_uom_id=to_uom_id,
                product_id=product_id, is_active=True
            ).first()

        if not conversion:
            # Fallback to global
            conversion = UoMConversion.query.filter_by(
                from_uom_id=from_uom_id, to_uom_id=to_uom_id,
                material_id=None, product_id=None, is_active=True
            ).first()

        if not conversion:
            from_uom = UnitOfMeasure.query.get(from_uom_id)
            to_uom = UnitOfMeasure.query.get(to_uom_id)
            return error_response(
                f'Tidak ada konversi dari {from_uom.code if from_uom else "?"} '
                f'ke {to_uom.code if to_uom else "?"}'
            ), 404

        factor = float(conversion.conversion_factor)
        result = round(quantity * factor, 6)

        return jsonify({
            'from_quantity': quantity,
            'from_uom': conversion.from_uom.code,
            'to_quantity': result,
            'to_uom': conversion.to_uom.code,
            'conversion_factor': factor,
            'scope': conversion.to_dict()['scope']
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============= UOM CATEGORIES =============

@uom_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_uom_categories():
    """Get available UoM categories"""
    return jsonify({
        'categories': [
            {'code': 'unit', 'name': 'Satuan (pcs, roll, pack, carton, dll)'},
            {'code': 'weight', 'name': 'Berat (kg, gram, ton)'},
            {'code': 'length', 'name': 'Panjang (meter, cm, mm)'},
            {'code': 'volume', 'name': 'Volume (liter, ml, m³)'},
            {'code': 'area', 'name': 'Luas (m², cm²)'}
        ]
    }), 200
