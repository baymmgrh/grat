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
    
    # ISTIRAHAT - break/prayer time (check FIRST - highest priority)
    istirahat_keywords = [
        'istirahat', 'sholat', 'solat', 'shalat', 'break',
        'toilet', 'makan', 'minum'
    ]
    for kw in istirahat_keywords:
        if kw in text_lower:
            return 'istirahat'
    
    # IDLE TIME keywords - waiting for materials/resources (check early - high priority)
    idle_keywords = [
        'tunggu kain', 'ambil kain', 'tunggu stiker', 'tunggu packaging', 'tunggu mixing',
        'tunggu bahan', 'tunggu material', 'tunggu label', 'tunggu box',
        'tunggu karton', 'tunggu lem', 'tunggu tinta', 'tunggu order',
        'tunggu obat', 'tunggu ingredient', 'tunggu produk', 'tunggu instruksi', 'tunggu approval',
        'tunggu qc', 'tunggu hasil qc', 'tunggu bahan kimia',
        'tunggu temperatur stabil', 'tunggu temperatur',
        'tunggu temperature stabil', 'tunggu temperature',
        'tunggu keranjang', 'tunggu trolley', 'tunggu troli',
        'menunggu kain', 'menunggu stiker', 'menunggu packaging', 'menunggu mixing',
        'menunggu obat', 'menunggu tinta',
        'nunggu kain', 'nunggu stiker', 'nunggu packaging', 'nunggu mixing',
        'nunggu obat', 'nunggu tinta',
        'kain belum datang', 'stiker belum datang', 'obat belum datang',
        'packaging belum datang', 'box belum datang', 'mixing belum siap',
        'ingredient habis', 'obat habis', 'stiker habis', 'packing habis',
        'packaging habis', 'label habis', 'karton habis', 'box habis',
        'keranjang habis', 'trolley habis', 'troli habis',
        'lem habis', 'tinta habis', 'kain habis',
        'waiting for', 'idle', 'standby', 'menganggur',
        'tidak ada order', 'no order', 'menghabiskan order', 'menhabiskan order',
        'susun produk'
    ]
    for kw in idle_keywords:
        if kw in text_lower:
            return 'idle'
    
    # SPECIAL CASE: "setting mc/mesin" - depends on position
    # If first entry → design (changeover/setup awal)
    # If not first → mesin (adjustment mesin)
    if 'setting mc' in text_lower or 'setting mesin' in text_lower:
        return 'design' if is_first_entry else 'mesin'
    
    # SPECIAL CASE: "setting dan tunggu temperatur" → always design (setup awal)
    if 'setting dan tunggu temperatur' in text_lower or 'setting tunggu temperatur' in text_lower:
        return 'design'
    
    # INKJET keywords - categorize as mesin (check before operator so "setting inkjet" → mesin)
    inkjet_keywords = [
        'inkjet', 'ink jet', 'ink-jet', 'inkjet error', 'inkjet macet', 
        'printer inkjet', 'head inkjet', 'tinta inkjet', 'cartridge inkjet',
        'setting inkjet'
    ]
    for kw in inkjet_keywords:
        if kw in text_lower:
            return 'mesin'
    
    # OPERATOR keywords - check first for specific patterns
    operator_keywords = [
        'keluar jalur (sambungan)', 'sambungan', 'salah setting', 'salah pasang',
        'operator error', 'human error', 'kesalahan operator', 'lupa', 'telat',
        'tidak fokus', 'kurang teliti', 'salah input', 'salah ukur',
        'setting'
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
        'bahan habis', 'material kurang', 'bahan kurang',
        'benang putus', 'benang habis', 'kualitas kain', 'kain tipis',
        'raw material', 'bahan baku'
    ]
    for kw in material_keywords:
        if kw in text_lower:
            return 'material'
    
    # MESIN keywords - comprehensive machine-related issues
    mesin_keywords = [
        # Generic mesin
        'keluar jalur (bak mesin', 'bak mesin', 'mesin rusak', 'mesin error',
        'mesin mati', 'mesin trouble', 'mesin macet', 'breakdown', 'maintenance',
        'ganti sparepart', 'sparepart',
        # Seal issues (bocor, melipat, rapuh, etc)
        'seal bocor', 'seal melipat', 'seal rapuh', 'seal samping', 'seal bawah',
        'endseal', 'end seal',
        # Temperature / suhu
        'temperature', 'suhu',
        # Lipatan kain / folding mechanism
        'lipatan', 'folding', 'penjepit',
        # Pisau / blade
        'pisau',
        # Tekanan angin / air pressure
        'tekanan angin', 'angin bocor', 'angin habis', 'angin drop',
        # MC Press
        'mc press',
        # Product getting sealed (machine malfunction)
        'terseal', 'keseal', 'ke seal',
        # Dosing mechanism
        'dosing',
        # Stacking mechanism
        'stacking',
        # Pound / punching
        'pound',
        # Selang / hoses
        'selang',
        # Sensor
        'sensor',
        # Perbaikan (repair) — in production context always machine repair
        'perbaikan',
        # Tumpukan
        'tumpukan',
        # Menggulung
        'menggulung',
        # Electrical / mechanical
        'motor rusak', 'bearing', 'belt putus', 'overheating', 'overheat',
        'listrik mati', 'power failure', 'compressor',
        'pneumatic', 'hidrolik', 'hydraulic', 'kalibrasi', 'calibration',
        'jarum patah', 'jarum bengkok', 'tension', 'needle',
        # Stacker / conveyor
        'stacker', 'vanbelt', 'conveyor',
        # Stiker position (machine alignment)
        'posisi stiker',
        # Kain issues (machine alignment)
        'lebar kain tidak maksimal', 'lebar kain',
        # Specific items
        'baut stacking lepas',
        'produk bocor',
        # Feeding / pusher mechanism
        'pusher', 'feeding',
        # Stability issues (machine-related)
        'tidak stabil', 'tidak maksimal', 'simetris',
        # Tidak rapi (machine alignment)
        'tidak rapi',
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
        'cleaning', 'warmup', 'persiapan produksi',
        'repack', 'repacking', 're-pack', 're packing',
        'pasang kain', 'pasang packaging'
    ]
    for kw in design_keywords:
        if kw in text_lower:
            return 'design'
    
    # Generic "keluar jalur" without specific cause -> check context
    if 'keluar jalur' in text_lower:
        # If no specific cause found, default to mesin (most common)
        return 'mesin'
    
    return 'others'
