from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.hr import StaffLeaveRequest, OfficeLocation
from models.user import User
from datetime import datetime, date, timedelta
from utils.timezone import get_local_now, get_local_today
import math

staff_leave_bp = Blueprint('staff_leave', __name__)


def generate_request_number():
    """Generate unique leave request number: LR-YYYYMMDD-XXXX"""
    today = get_local_today()
    prefix = f"LR-{today.strftime('%Y%m%d')}"
    
    # Get count of requests today
    count = StaffLeaveRequest.query.filter(
        StaffLeaveRequest.request_number.like(f'{prefix}%')
    ).count()
    
    return f"{prefix}-{str(count + 1).zfill(4)}"


def to_proper_case(name):
    """Convert name to proper case"""
    if not name:
        return name
    return ' '.join(word.capitalize() for word in name.strip().split())


def get_client_ip():
    """Get client IP address"""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    return request.remote_addr


def calculate_working_days(start_date, end_date):
    """Calculate working days between two dates (excluding weekends)"""
    if isinstance(start_date, str):
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
    if isinstance(end_date, str):
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    
    working_days = 0
    current_date = start_date
    while current_date <= end_date:
        if current_date.weekday() < 5:  # Monday = 0, Friday = 4
            working_days += 1
        current_date += timedelta(days=1)
    return working_days


# ==================== PUBLIC ENDPOINTS (No Auth) ====================

@staff_leave_bp.route('/public/submit', methods=['POST', 'OPTIONS'])
def public_submit_leave():
    """Public endpoint for staff to submit leave request"""
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    
    try:
        data = request.get_json()
        
        # Validate required fields
        staff_name = data.get('staff_name', '').strip()
        leave_type = data.get('leave_type', '').strip()
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        reason = data.get('reason', '').strip()
        
        if not staff_name:
            return jsonify({'error': 'Nama wajib diisi'}), 400
        if not leave_type:
            return jsonify({'error': 'Tipe izin/cuti wajib dipilih'}), 400
        if not start_date or not end_date:
            return jsonify({'error': 'Tanggal mulai dan selesai wajib diisi'}), 400
        if not reason:
            return jsonify({'error': 'Alasan wajib diisi'}), 400
        
        # Validate leave type
        valid_types = ['sakit', 'izin', 'cuti_tahunan', 'cuti_khusus', 'dinas_luar']
        if leave_type not in valid_types:
            return jsonify({'error': 'Tipe izin tidak valid'}), 400
        
        # Parse dates
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Format tanggal tidak valid (YYYY-MM-DD)'}), 400
        
        if end < start:
            return jsonify({'error': 'Tanggal selesai harus setelah tanggal mulai'}), 400
        
        # Calculate working days
        total_days = calculate_working_days(start, end)
        
        # Create leave request
        leave_request = StaffLeaveRequest(
            request_number=generate_request_number(),
            staff_name=to_proper_case(staff_name),
            leave_type=leave_type,
            start_date=start,
            end_date=end,
            total_days=total_days,
            reason=reason,
            status='pending',
            submitted_from_ip=get_client_ip(),
            device_info=request.headers.get('User-Agent', '')[:500]
        )
        
        db.session.add(leave_request)
        db.session.commit()
        
        return jsonify({
            'message': 'Pengajuan izin/cuti berhasil dikirim',
            'leave_request': leave_request.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@staff_leave_bp.route('/public/check', methods=['POST', 'OPTIONS'])
def public_check_leave_status():
    """Check leave request status by name"""
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    
    try:
        data = request.get_json()
        staff_name = data.get('staff_name', '').strip()
        
        if not staff_name:
            return jsonify({'error': 'Nama wajib diisi'}), 400
        
        formatted_name = to_proper_case(staff_name)
        
        # Get leave requests for this staff
        requests = StaffLeaveRequest.query.filter(
            db.func.lower(StaffLeaveRequest.staff_name) == formatted_name.lower()
        ).order_by(StaffLeaveRequest.created_at.desc()).limit(10).all()
        
        return jsonify({
            'staff_name': formatted_name,
            'leave_requests': [r.to_dict() for r in requests]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@staff_leave_bp.route('/public/cancel/<int:request_id>', methods=['POST', 'OPTIONS'])
def public_cancel_leave(request_id):
    """Cancel a pending leave request"""
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    
    try:
        data = request.get_json()
        staff_name = data.get('staff_name', '').strip()
        
        if not staff_name:
            return jsonify({'error': 'Nama wajib diisi untuk verifikasi'}), 400
        
        formatted_name = to_proper_case(staff_name)
        
        leave_request = StaffLeaveRequest.query.get(request_id)
        if not leave_request:
            return jsonify({'error': 'Pengajuan tidak ditemukan'}), 404
        
        # Verify ownership
        if leave_request.staff_name.lower() != formatted_name.lower():
            return jsonify({'error': 'Anda tidak berhak membatalkan pengajuan ini'}), 403
        
        if leave_request.status != 'pending':
            return jsonify({'error': 'Hanya pengajuan dengan status menunggu yang bisa dibatalkan'}), 400
        
        leave_request.status = 'cancelled'
        db.session.commit()
        
        return jsonify({
            'message': 'Pengajuan berhasil dibatalkan',
            'leave_request': leave_request.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== AUTHENTICATED ENDPOINTS (Admin/HR) ====================

@staff_leave_bp.route('/list', methods=['GET'])
@jwt_required()
def get_leave_requests():
    """Get all leave requests with filters"""
    try:
        # Filters
        status = request.args.get('status', '')
        staff_name = request.args.get('staff_name', '')
        leave_type = request.args.get('leave_type', '')
        start_date = request.args.get('start_date', '')
        end_date = request.args.get('end_date', '')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = StaffLeaveRequest.query
        
        if status:
            query = query.filter(StaffLeaveRequest.status == status)
        if staff_name:
            query = query.filter(StaffLeaveRequest.staff_name.ilike(f'%{staff_name}%'))
        if leave_type:
            query = query.filter(StaffLeaveRequest.leave_type == leave_type)
        if start_date:
            query = query.filter(StaffLeaveRequest.start_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
        if end_date:
            query = query.filter(StaffLeaveRequest.end_date <= datetime.strptime(end_date, '%Y-%m-%d').date())
        
        pagination = query.order_by(StaffLeaveRequest.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'leave_requests': [r.to_dict() for r in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@staff_leave_bp.route('/pending', methods=['GET'])
@jwt_required()
def get_pending_requests():
    """Get pending leave requests for approval"""
    try:
        requests = StaffLeaveRequest.query.filter(
            StaffLeaveRequest.status == 'pending'
        ).order_by(StaffLeaveRequest.created_at.asc()).all()
        
        return jsonify({
            'pending_count': len(requests),
            'leave_requests': [r.to_dict() for r in requests]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@staff_leave_bp.route('/approve/<int:request_id>', methods=['POST'])
@jwt_required()
def approve_leave(request_id):
    """Approve a leave request"""
    try:
        user_id = get_jwt_identity()
        
        leave_request = StaffLeaveRequest.query.get(request_id)
        if not leave_request:
            return jsonify({'error': 'Pengajuan tidak ditemukan'}), 404
        
        if leave_request.status != 'pending':
            return jsonify({'error': 'Pengajuan sudah diproses sebelumnya'}), 400
        
        leave_request.status = 'approved'
        leave_request.approved_by = user_id
        leave_request.approved_at = get_local_now()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Pengajuan disetujui',
            'leave_request': leave_request.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@staff_leave_bp.route('/reject/<int:request_id>', methods=['POST'])
@jwt_required()
def reject_leave(request_id):
    """Reject a leave request"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        leave_request = StaffLeaveRequest.query.get(request_id)
        if not leave_request:
            return jsonify({'error': 'Pengajuan tidak ditemukan'}), 404
        
        if leave_request.status != 'pending':
            return jsonify({'error': 'Pengajuan sudah diproses sebelumnya'}), 400
        
        rejection_reason = data.get('reason', 'Ditolak oleh admin')
        
        leave_request.status = 'rejected'
        leave_request.approved_by = user_id
        leave_request.approved_at = get_local_now()
        leave_request.rejection_reason = rejection_reason
        
        db.session.commit()
        
        return jsonify({
            'message': 'Pengajuan ditolak',
            'leave_request': leave_request.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@staff_leave_bp.route('/calendar', methods=['GET'])
@jwt_required()
def get_leave_calendar():
    """Get leave data for calendar view"""
    try:
        year = request.args.get('year', get_local_today().year, type=int)
        month = request.args.get('month', get_local_today().month, type=int)
        
        # Get first and last day of month
        first_day = date(year, month, 1)
        if month == 12:
            last_day = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            last_day = date(year, month + 1, 1) - timedelta(days=1)
        
        # Get approved leaves that overlap with this month
        leaves = StaffLeaveRequest.query.filter(
            StaffLeaveRequest.status == 'approved',
            StaffLeaveRequest.start_date <= last_day,
            StaffLeaveRequest.end_date >= first_day
        ).all()
        
        # Build calendar events
        events = []
        for leave in leaves:
            events.append({
                'id': leave.id,
                'title': f"{leave.staff_name} - {leave.leave_type_label}",
                'staff_name': leave.staff_name,
                'leave_type': leave.leave_type,
                'start': leave.start_date.isoformat(),
                'end': leave.end_date.isoformat(),
                'color': {
                    'sakit': '#ef4444',
                    'izin': '#f59e0b',
                    'cuti_tahunan': '#3b82f6',
                    'cuti_khusus': '#8b5cf6',
                    'dinas_luar': '#10b981'
                }.get(leave.leave_type, '#6b7280')
            })
        
        return jsonify({
            'year': year,
            'month': month,
            'events': events
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== OFFICE LOCATION MANAGEMENT ====================

@staff_leave_bp.route('/office-locations', methods=['GET'])
@jwt_required()
def get_office_locations():
    """Get all office locations"""
    try:
        locations = OfficeLocation.query.filter(OfficeLocation.is_active == True).all()
        return jsonify({
            'locations': [loc.to_dict() for loc in locations]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@staff_leave_bp.route('/office-locations', methods=['POST'])
@jwt_required()
def create_office_location():
    """Create new office location"""
    try:
        data = request.get_json()
        
        name = data.get('name', '').strip()
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        radius_meters = data.get('radius_meters', 100)
        address = data.get('address', '').strip()
        is_default = data.get('is_default', False)
        
        if not name or latitude is None or longitude is None:
            return jsonify({'error': 'Nama, latitude, dan longitude wajib diisi'}), 400
        
        # If this is set as default, unset other defaults
        if is_default:
            OfficeLocation.query.update({OfficeLocation.is_default: False})
        
        location = OfficeLocation(
            name=name,
            latitude=float(latitude),
            longitude=float(longitude),
            radius_meters=int(radius_meters),
            address=address,
            is_default=is_default
        )
        
        db.session.add(location)
        db.session.commit()
        
        return jsonify({
            'message': 'Lokasi kantor berhasil ditambahkan',
            'location': location.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@staff_leave_bp.route('/office-locations/<int:location_id>', methods=['PUT'])
@jwt_required()
def update_office_location(location_id):
    """Update office location"""
    try:
        location = OfficeLocation.query.get(location_id)
        if not location:
            return jsonify({'error': 'Lokasi tidak ditemukan'}), 404
        
        data = request.get_json()
        
        if 'name' in data:
            location.name = data['name'].strip()
        if 'latitude' in data:
            location.latitude = float(data['latitude'])
        if 'longitude' in data:
            location.longitude = float(data['longitude'])
        if 'radius_meters' in data:
            location.radius_meters = int(data['radius_meters'])
        if 'address' in data:
            location.address = data['address'].strip()
        if 'is_active' in data:
            location.is_active = data['is_active']
        if 'is_default' in data and data['is_default']:
            # Unset other defaults
            OfficeLocation.query.filter(OfficeLocation.id != location_id).update({OfficeLocation.is_default: False})
            location.is_default = True
        
        db.session.commit()
        
        return jsonify({
            'message': 'Lokasi kantor berhasil diupdate',
            'location': location.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@staff_leave_bp.route('/office-locations/<int:location_id>', methods=['DELETE'])
@jwt_required()
def delete_office_location(location_id):
    """Delete office location"""
    try:
        location = OfficeLocation.query.get(location_id)
        if not location:
            return jsonify({'error': 'Lokasi tidak ditemukan'}), 404
        
        location.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Lokasi kantor berhasil dihapus'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Public endpoint to get default office location (for attendance GPS validation)
@staff_leave_bp.route('/public/office-location', methods=['GET', 'OPTIONS'])
def get_default_office_location():
    """Get default office location for GPS validation"""
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        return response
    
    try:
        location = OfficeLocation.query.filter(
            OfficeLocation.is_active == True,
            OfficeLocation.is_default == True
        ).first()
        
        if not location:
            # Fallback to first active location
            location = OfficeLocation.query.filter(OfficeLocation.is_active == True).first()
        
        if not location:
            return jsonify({
                'location': None,
                'message': 'Lokasi kantor belum dikonfigurasi'
            }), 200
        
        return jsonify({
            'location': location.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
