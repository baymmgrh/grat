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
