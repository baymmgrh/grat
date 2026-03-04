"""
Timezone utilities for the application
Handles conversion between UTC and local timezone (Asia/Jakarta - UTC+7)
Returns naive datetimes in local time for database compatibility
"""
from datetime import datetime, timedelta, timezone
from functools import wraps

# Indonesia timezone offset (UTC+7)
JAKARTA_OFFSET = timedelta(hours=7)
JAKARTA_TZ = timezone(JAKARTA_OFFSET)

def get_local_now():
    """Get current time in local timezone (Asia/Jakarta) as naive datetime"""
    # Get UTC now and add 7 hours, return as naive datetime
    utc_now = datetime.utcnow()
    local_now = utc_now + JAKARTA_OFFSET
    return local_now  # Returns naive datetime in local time

def get_local_today():
    """Get today's date in local timezone"""
    return get_local_now().date()

def utc_to_local(utc_dt):
    """Convert UTC datetime to local timezone (returns naive datetime)"""
    if utc_dt is None:
        return None
    # Handle both naive and aware datetimes
    if utc_dt.tzinfo is not None:
        # Convert to UTC first, then add offset
        utc_dt = utc_dt.astimezone(timezone.utc).replace(tzinfo=None)
    return utc_dt + JAKARTA_OFFSET

def local_to_utc(local_dt):
    """Convert local datetime to UTC (returns naive datetime)"""
    if local_dt is None:
        return None
    # Assume input is in local time, subtract offset
    if local_dt.tzinfo is not None:
        local_dt = local_dt.replace(tzinfo=None)
    return local_dt - JAKARTA_OFFSET

def format_local_datetime(dt, fmt='%Y-%m-%d %H:%M:%S'):
    """Format datetime to local timezone string (assumes input is UTC naive)"""
    if dt is None:
        return None
    local_dt = utc_to_local(dt)
    return local_dt.strftime(fmt)

def format_local_time(dt, fmt='%H:%M:%S'):
    """Format time portion to local timezone string"""
    if dt is None:
        return None
    local_dt = utc_to_local(dt)
    return local_dt.strftime(fmt)

def format_local_date(dt, fmt='%Y-%m-%d'):
    """Format date to local timezone string"""
    if dt is None:
        return None
    local_dt = utc_to_local(dt)
    return local_dt.strftime(fmt)
