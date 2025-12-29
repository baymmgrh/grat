from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from models import User

def generate_number(prefix, model, field_name='number'):
    """Generate sequential number for entities"""
    from datetime import datetime
    
    year = datetime.now().strftime('%Y')
    month = datetime.now().strftime('%m')
    
    # Get last number
    last_record = model.query.order_by(getattr(model, field_name).desc()).first()
    
    if last_record:
        last_number = getattr(last_record, field_name)
        # Extract sequence number
        try:
            seq = int(last_number.split('-')[-1])
            new_seq = seq + 1
        except:
            new_seq = 1
    else:
        new_seq = 1
    
    return f"{prefix}-{year}{month}-{new_seq:05d}"

def paginate_query(query, page=1, per_page=50):
    """Helper function to paginate queries"""
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return {
        'items': paginated.items,
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': paginated.page,
        'has_next': paginated.has_next,
        'has_prev': paginated.has_prev
    }

def serialize_model(obj, fields=None, exclude=None):
    """Serialize SQLAlchemy model to dictionary"""
    if fields is None:
        fields = [c.name for c in obj.__table__.columns]
    
    if exclude:
        fields = [f for f in fields if f not in exclude]
    
    result = {}
    for field in fields:
        value = getattr(obj, field)
        
        # Handle different types
        if hasattr(value, 'isoformat'):
            result[field] = value.isoformat()
        elif isinstance(value, (int, float, str, bool, type(None))):
            result[field] = value
        else:
            result[field] = str(value)
    
    return result

def admin_required():
    """Decorator to require admin access"""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user or not user.is_admin:
                return jsonify({'error': 'Admin access required'}), 403
            
            return fn(*args, **kwargs)
        return decorator
    return wrapper

def detect_downtime_category(issue_text: str) -> str:
    """
    Auto-detect downtime category from issue description keywords.
    Returns: 'mesin', 'operator', 'material', 'design', or 'others'
    """
    if not issue_text:
        return 'others'
    
    text_lower = issue_text.lower()
    
    # OPERATOR keywords - check first for specific patterns
    operator_keywords = [
        'keluar jalur (sambungan)', 'sambungan', 'salah setting', 'salah pasang',
        'operator error', 'human error', 'kesalahan operator', 'lupa', 'telat',
        'tidak fokus', 'kurang teliti', 'salah input', 'salah ukur'
    ]
    for kw in operator_keywords:
        if kw in text_lower:
            return 'operator'
    
    # MATERIAL/RAW MATERIAL keywords
    material_keywords = [
        'keluar jalur (kain terlalu tipis', 'keluar jalur (kain gembos', 
        'keluar jalur (kain tidak sesuai', 'kain terlalu tipis', 'kain gembos',
        'kain tidak sesuai', 'material cacat', 'bahan cacat', 'kain cacat',
        'material rusak', 'bahan rusak', 'kain rusak', 'material habis',
        'bahan habis', 'kain habis', 'material kurang', 'bahan kurang',
        'benang putus', 'benang habis', 'kualitas kain', 'kain tipis',
        'raw material', 'bahan baku'
    ]
    for kw in material_keywords:
        if kw in text_lower:
            return 'material'
    
    # MESIN keywords - check after material to avoid false positives
    mesin_keywords = [
        'keluar jalur (bak mesin', 'bak mesin', 'mesin rusak', 'mesin error',
        'mesin mati', 'mesin trouble', 'mesin macet', 'breakdown', 'maintenance',
        'perbaikan mesin', 'ganti sparepart', 'sparepart', 'sensor error',
        'motor rusak', 'bearing', 'belt putus', 'overheating', 'overheat',
        'listrik mati', 'power failure', 'angin habis', 'compressor',
        'pneumatic', 'hidrolik', 'hydraulic', 'kalibrasi', 'calibration',
        'jarum patah', 'jarum bengkok', 'tension', 'needle', 'inkjet'
    ]
    for kw in mesin_keywords:
        if kw in text_lower:
            return 'mesin'
    
    # DESIGN keywords
    design_keywords = [
        'design error', 'desain salah', 'pattern salah', 'pola salah',
        'ukuran salah', 'spec salah', 'spesifikasi salah', 'revisi design',
        'revisi desain', 'sample', 'prototype', 'trial', 'testing design'
    ]
    for kw in design_keywords:
        if kw in text_lower:
            return 'design'
    
    # Generic "keluar jalur" without specific cause -> check context
    if 'keluar jalur' in text_lower:
        # If no specific cause found, default to mesin (most common)
        return 'mesin'
    
    return 'others'
