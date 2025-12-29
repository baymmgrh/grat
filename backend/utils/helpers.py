"""
Utility helper functions
"""
import random
import string
from datetime import datetime


def generate_number(prefix, model=None, field_name='number'):
    """Generate sequential number for entities"""
    if model is None:
        # Fallback to old behavior for backward compatibility
        length = field_name if isinstance(field_name, int) else 6
        number_part = ''.join(random.choices(string.digits, k=length))
        timestamp = datetime.now().strftime("%y%m%d")
        
        if prefix:
            return f"{prefix}{timestamp}{number_part}"
        else:
            return f"{timestamp}{number_part}"
    
    # New behavior for database models
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


def generate_code(prefix: str = "", length: int = 8) -> str:
    """
    Generate a unique alphanumeric code
    
    Args:
        prefix: Optional prefix for the code
        length: Length of the random part
    
    Returns:
        Generated code string
    """
    # Generate random alphanumeric part
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    
    if prefix:
        return f"{prefix}{random_part}"
    else:
        return random_part


def format_currency(amount: float, currency: str = "IDR") -> str:
    """
    Format currency amount
    
    Args:
        amount: Amount to format
        currency: Currency code (default IDR)
    
    Returns:
        Formatted currency string
    """
    if currency == "IDR":
        return f"Rp {amount:,.0f}"
    else:
        return f"{currency} {amount:,.2f}"


def validate_email(email: str) -> bool:
    """
    Simple email validation
    """
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename by removing invalid characters
    """
    import re
    # Remove invalid characters
    sanitized = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove multiple underscores
    sanitized = re.sub(r'_+', '_', sanitized)
    return sanitized.strip('_')


def calculate_percentage(part: float, total: float) -> float:
    """
    Calculate percentage safely
    """
    if total == 0:
        return 0.0
    return round((part / total) * 100, 2)


def truncate_string(text: str, max_length: int = 50) -> str:
    """
    Truncate string with ellipsis if too long
    """
    if len(text) <= max_length:
        return text
    return text[:max_length-3] + "..."


def detect_downtime_category(issue_text: str, is_first_entry: bool = False) -> str:
    """
    Auto-detect downtime category from issue description keywords.
    Returns: 'mesin', 'operator', 'material', 'design', 'idle', or 'others'
    
    Args:
        issue_text: The downtime reason/issue description
        is_first_entry: Whether this is the first downtime entry (affects 'setting mc/mesin' categorization)
    """
    if not issue_text:
        return 'others'
    
    text_lower = issue_text.lower()
    
    # IDLE TIME keywords - waiting for materials/resources (check first - high priority)
    idle_keywords = [
        'tunggu kain', 'tunggu stiker', 'tunggu packaging', 'tunggu mixing',
        'tunggu bahan', 'tunggu material', 'tunggu label', 'tunggu box',
        'tunggu karton', 'tunggu lem', 'tunggu tinta', 'tunggu order',
        'menunggu kain', 'menunggu stiker', 'menunggu packaging', 'menunggu mixing',
        'nunggu kain', 'nunggu stiker', 'nunggu packaging', 'nunggu mixing',
        'waiting for', 'idle', 'standby'
    ]
    for kw in idle_keywords:
        if kw in text_lower:
            return 'idle'
    
    # SPECIAL CASE: "setting mc/mesin" - depends on position
    # If first entry → design (changeover/setup awal)
    # If not first → mesin (adjustment mesin)
    if 'setting mc' in text_lower or 'setting mesin' in text_lower:
        return 'design' if is_first_entry else 'mesin'
    
    # INKJET keywords - categorize as mesin
    inkjet_keywords = [
        'inkjet', 'ink jet', 'ink-jet', 'inkjet error', 'inkjet macet', 
        'printer inkjet', 'head inkjet', 'tinta inkjet', 'cartridge inkjet'
    ]
    for kw in inkjet_keywords:
        if kw in text_lower:
            return 'mesin'
    
    # OPERATOR keywords - check first for specific patterns
    operator_keywords = [
        'keluar jalur (sambungan)', 'sambungan', 'salah setting', 'salah pasang',
        'operator error', 'human error', 'kesalahan operator', 'lupa', 'telat',
        'tidak fokus', 'kurang teliti', 'salah input', 'salah ukur', 'setting'
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
        'jarum patah', 'jarum bengkok', 'tension', 'needle'
    ]
    for kw in mesin_keywords:
        if kw in text_lower:
            return 'mesin'
    
    # DESIGN keywords
    design_keywords = [
        'design error', 'desain salah', 'pattern salah', 'pola salah',
        'ukuran salah', 'spec salah', 'spesifikasi salah', 'revisi design',
        'revisi desain', 'sample', 'prototype', 'trial', 'testing design',
        'changeover', 'ganti produk', 'ganti order', 'ganti', 'sanitasi',
        'cleaning', 'warmup', 'persiapan produksi'
    ]
    for kw in design_keywords:
        if kw in text_lower:
            return 'design'
    
    # Generic "keluar jalur" without specific cause -> check context
    if 'keluar jalur' in text_lower:
        # If no specific cause found, default to mesin (most common)
        return 'mesin'
    
    return 'others'
