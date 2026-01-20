from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.hr import Attendance
from models.user import User
from datetime import datetime, date, timedelta
from utils.timezone import get_local_now, get_local_today
import hashlib
import base64

attendance_bp = Blueprint('attendance', __name__)


def cors_preflight_response():
    """Return proper CORS preflight response"""
    response = make_response()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response


def get_client_ip():
    """Get client IP address"""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    return request.remote_addr


# ==================== PUBLIC ENDPOINTS (No Auth Required) ====================

def to_proper_case(name):
    """Convert name to proper case (capitalize first letter of each word)"""
    if not name:
        return name
    return ' '.join(word.capitalize() for word in name.strip().split())


@attendance_bp.route('/public/check', methods=['POST', 'OPTIONS'])
def public_check_attendance():
    # Handle preflight request
    if request.method == 'OPTIONS':
        return cors_preflight_response()
    
    """Check today's attendance by name"""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        
        if not name:
            return jsonify({'error': 'Nama wajib diisi'}), 400
        
        # Format name to proper case
        formatted_name = to_proper_case(name)
        
        # Get today's attendance for this name
        today = get_local_today()
        attendance = Attendance.query.filter(
            db.func.lower(Attendance.notes) == f'name:{formatted_name.lower()}',
            Attendance.attendance_date == today
        ).first()
        
        # Alternative: check by exact match on a name field we'll add
        if not attendance:
            attendance = Attendance.query.filter(
                Attendance.attendance_date == today,
                Attendance.device_info.like(f'%NAME:{formatted_name}%')
            ).first()
        
        return jsonify({
            'name': formatted_name,
            'today_attendance': attendance.to_dict() if attendance else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/public/clock-in', methods=['POST', 'OPTIONS'])
def public_clock_in():
    # Handle preflight request
    if request.method == 'OPTIONS':
        return cors_preflight_response()
    """Public clock in with photo verification - using name"""
    try:
        from models.hr import Employee
        
        data = request.get_json()
        name = data.get('name', '').strip()
        
        if not name:
            return jsonify({'error': 'Nama wajib diisi'}), 400
        
        # Format name to proper case for consistency
        formatted_name = to_proper_case(name)
        
        # Try to find employee by name (fuzzy match)
        employee = Employee.query.filter(
            db.func.lower(Employee.full_name) == formatted_name.lower()
        ).first()
        
        # If not found, try partial match
        if not employee:
            employee = Employee.query.filter(
                Employee.full_name.ilike(f'%{formatted_name}%')
            ).first()
        
        today = get_local_today()
        now = get_local_now()
        
        # Check if already clocked in today (by name stored in notes)
        existing = Attendance.query.filter(
            Attendance.attendance_date == today,
            Attendance.clock_in.isnot(None),
            Attendance.notes.like(f'%[NAME:{formatted_name}]%')
        ).first()
        
        if existing:
            return jsonify({
                'error': 'Anda sudah melakukan clock in hari ini',
                'clock_in_time': existing.clock_in.strftime('%H:%M:%S')
            }), 400
        
        # Get photo data
        photo_base64 = data.get('photo_base64')
        if not photo_base64:
            return jsonify({'error': 'Foto wajib diambil untuk absensi'}), 400
        
        # Calculate photo hash
        if ',' in photo_base64:
            photo_base64 = photo_base64.split(',')[1]
        
        try:
            photo_bytes = base64.b64decode(photo_base64)
            photo_hash = hashlib.sha256(photo_bytes).hexdigest()
            photo_size = len(photo_bytes)
        except Exception as e:
            return jsonify({'error': f'Invalid photo data: {str(e)}'}), 400
        
        # Face detection results
        face_detected = data.get('face_detected', False)
        face_confidence = data.get('face_confidence', 0)
        face_count = data.get('face_count', 0)
        
        if not face_detected:
            return jsonify({'error': 'Wajah tidak terdeteksi. Pastikan wajah terlihat jelas.'}), 400
        
        if face_count > 1:
            return jsonify({'error': 'Terdeteksi lebih dari satu wajah.'}), 400
        
        # Build notes with name tag
        notes_parts = [f'[NAME:{formatted_name}]']
        
        # Check if late (after 08:30)
        late_threshold = datetime.combine(today, datetime.strptime('08:30', '%H:%M').time())
        status = 'present'
        if now > late_threshold:
            status = 'late'
            late_minutes = int((now - late_threshold).total_seconds() / 60)
            notes_parts.append(f'Terlambat {late_minutes} menit')
        
        # Create attendance record
        attendance = Attendance(
            employee_id=employee.id if employee else None,
            attendance_date=today,
            clock_in=now,
            status=status,
            photo_hash=photo_hash,
            photo_size_bytes=photo_size,
            face_detected=face_detected,
            face_confidence=face_confidence,
            face_count=face_count,
            device_info=request.headers.get('User-Agent', '')[:500],
            ip_address=get_client_ip(),
            verification_status='verified',
            notes=' | '.join(notes_parts)
        )
        
        db.session.add(attendance)
        db.session.commit()
        
        # Return with name included
        result = attendance.to_dict()
        result['attendee_name'] = formatted_name
        
        return jsonify({
            'message': 'Clock in berhasil',
            'attendance': result
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/public/clock-out', methods=['POST', 'OPTIONS'])
def public_clock_out():
    # Handle preflight request
    if request.method == 'OPTIONS':
        return cors_preflight_response()
    """Public clock out - no photo needed, using name"""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        
        if not name:
            return jsonify({'error': 'Nama wajib diisi'}), 400
        
        # Format name to proper case
        formatted_name = to_proper_case(name)
        
        today = get_local_today()
        now = get_local_now()
        
        # Find today's attendance by name
        attendance = Attendance.query.filter(
            Attendance.attendance_date == today,
            Attendance.clock_in.isnot(None),
            Attendance.notes.like(f'%[NAME:{formatted_name}]%')
        ).first()
        
        if not attendance:
            return jsonify({'error': 'Anda belum melakukan clock in hari ini'}), 400
        
        if attendance.clock_out:
            return jsonify({
                'error': 'Anda sudah melakukan clock out hari ini',
                'clock_out_time': attendance.clock_out.strftime('%H:%M:%S')
            }), 400
        
        # Update attendance
        attendance.clock_out = now
        
        # Calculate worked hours
        if attendance.clock_in:
            worked_seconds = (now - attendance.clock_in).total_seconds()
            attendance.worked_hours = round(worked_seconds / 3600, 2)
            
            # Calculate overtime (after 17:00)
            standard_end = datetime.combine(today, datetime.strptime('17:00', '%H:%M').time())
            if now > standard_end:
                overtime_seconds = (now - standard_end).total_seconds()
                attendance.overtime_hours = round(overtime_seconds / 3600, 2)
        
        db.session.commit()
        
        # Return with name included
        result = attendance.to_dict()
        result['attendee_name'] = formatted_name
        
        return jsonify({
            'message': 'Clock out berhasil',
            'attendance': result
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== AUTHENTICATED ENDPOINTS ====================


@attendance_bp.route('/clock-in', methods=['POST'])
@jwt_required()
def clock_in():
    """Clock in with photo verification"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        today = get_local_today()
        now = get_local_now()
        
        # Check if already clocked in today
        existing = Attendance.query.filter(
            Attendance.user_id == user_id,
            Attendance.attendance_date == today,
            Attendance.clock_in.isnot(None)
        ).first()
        
        if existing:
            return jsonify({
                'error': 'Anda sudah melakukan clock in hari ini',
                'clock_in_time': existing.clock_in.strftime('%H:%M:%S')
            }), 400
        
        # Get photo data (base64)
        photo_base64 = data.get('photo_base64')
        if not photo_base64:
            return jsonify({'error': 'Foto wajib diambil untuk absensi'}), 400
        
        # Calculate photo hash (SHA-256)
        # Remove base64 header if present
        if ',' in photo_base64:
            photo_base64 = photo_base64.split(',')[1]
        
        import base64
        try:
            photo_bytes = base64.b64decode(photo_base64)
            photo_hash = hashlib.sha256(photo_bytes).hexdigest()
            photo_size = len(photo_bytes)
        except Exception as e:
            return jsonify({'error': f'Invalid photo data: {str(e)}'}), 400
        
        # Face detection results from frontend
        face_detected = data.get('face_detected', False)
        face_confidence = data.get('face_confidence', 0)
        face_count = data.get('face_count', 0)
        
        # Validate face detection
        if not face_detected:
            return jsonify({'error': 'Wajah tidak terdeteksi. Pastikan wajah terlihat jelas di kamera.'}), 400
        
        if face_count > 1:
            return jsonify({'error': 'Terdeteksi lebih dari satu wajah. Pastikan hanya Anda yang ada di foto.'}), 400
        
        if face_confidence < 70:
            return jsonify({'error': f'Confidence wajah terlalu rendah ({face_confidence:.1f}%). Pastikan pencahayaan cukup.'}), 400
        
        # Create attendance record
        attendance = Attendance(
            user_id=user_id,
            attendance_date=today,
            clock_in=now,
            status='present',
            photo_hash=photo_hash,
            photo_size_bytes=photo_size,
            face_detected=face_detected,
            face_confidence=face_confidence,
            face_count=face_count,
            device_info=request.headers.get('User-Agent', '')[:500],
            ip_address=get_client_ip(),
            verification_status='verified'  # Auto-verified if face detected
        )
        
        # Check if late (after 08:30)
        late_threshold = datetime.combine(today, datetime.strptime('08:30', '%H:%M').time())
        if now > late_threshold:
            attendance.status = 'late'
            late_minutes = int((now - late_threshold).total_seconds() / 60)
            attendance.notes = f'Terlambat {late_minutes} menit'
        
        db.session.add(attendance)
        db.session.commit()
        
        return jsonify({
            'message': 'Clock in berhasil',
            'attendance': attendance.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/clock-out', methods=['POST'])
@jwt_required()
def clock_out():
    """Clock out with photo verification"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        today = get_local_today()
        now = get_local_now()
        
        # Find today's attendance record
        attendance = Attendance.query.filter(
            Attendance.user_id == user_id,
            Attendance.attendance_date == today,
            Attendance.clock_in.isnot(None)
        ).first()
        
        if not attendance:
            return jsonify({'error': 'Anda belum melakukan clock in hari ini'}), 400
        
        if attendance.clock_out:
            return jsonify({
                'error': 'Anda sudah melakukan clock out hari ini',
                'clock_out_time': attendance.clock_out.strftime('%H:%M:%S')
            }), 400
        
        # Get photo data (base64)
        photo_base64 = data.get('photo_base64')
        if not photo_base64:
            return jsonify({'error': 'Foto wajib diambil untuk absensi'}), 400
        
        # Calculate photo hash
        if ',' in photo_base64:
            photo_base64 = photo_base64.split(',')[1]
        
        import base64
        try:
            photo_bytes = base64.b64decode(photo_base64)
            photo_hash = hashlib.sha256(photo_bytes).hexdigest()
        except Exception as e:
            return jsonify({'error': f'Invalid photo data: {str(e)}'}), 400
        
        # Face detection results
        face_detected = data.get('face_detected', False)
        face_confidence = data.get('face_confidence', 0)
        face_count = data.get('face_count', 0)
        
        if not face_detected:
            return jsonify({'error': 'Wajah tidak terdeteksi. Pastikan wajah terlihat jelas di kamera.'}), 400
        
        if face_count > 1:
            return jsonify({'error': 'Terdeteksi lebih dari satu wajah. Pastikan hanya Anda yang ada di foto.'}), 400
        
        # Update attendance record
        attendance.clock_out = now
        
        # Calculate worked hours
        if attendance.clock_in:
            worked_seconds = (now - attendance.clock_in).total_seconds()
            attendance.worked_hours = round(worked_seconds / 3600, 2)
            
            # Calculate overtime (after 17:00)
            standard_end = datetime.combine(today, datetime.strptime('17:00', '%H:%M').time())
            if now > standard_end:
                overtime_seconds = (now - standard_end).total_seconds()
                attendance.overtime_hours = round(overtime_seconds / 3600, 2)
        
        # Check early leave (before 17:00)
        early_threshold = datetime.combine(today, datetime.strptime('17:00', '%H:%M').time())
        if now < early_threshold:
            early_minutes = int((early_threshold - now).total_seconds() / 60)
            if attendance.notes:
                attendance.notes += f'; Pulang awal {early_minutes} menit'
            else:
                attendance.notes = f'Pulang awal {early_minutes} menit'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Clock out berhasil',
            'attendance': attendance.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/today', methods=['GET'])
@jwt_required()
def get_today_attendance():
    """Get current user's attendance for today"""
    try:
        user_id = get_jwt_identity()
        today = get_local_today()
        
        attendance = Attendance.query.filter(
            Attendance.user_id == user_id,
            Attendance.attendance_date == today
        ).first()
        
        return jsonify({
            'attendance': attendance.to_dict() if attendance else None,
            'date': today.isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/history', methods=['GET'])
@jwt_required()
def get_attendance_history():
    """Get current user's attendance history"""
    try:
        user_id = get_jwt_identity()
        
        # Date range
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 30, type=int)
        
        query = Attendance.query.filter(Attendance.user_id == user_id)
        
        if start_date:
            query = query.filter(Attendance.attendance_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
        if end_date:
            query = query.filter(Attendance.attendance_date <= datetime.strptime(end_date, '%Y-%m-%d').date())
        
        # Default to current month if no dates specified
        if not start_date and not end_date:
            today = get_local_today()
            first_day = today.replace(day=1)
            query = query.filter(Attendance.attendance_date >= first_day)
        
        attendances = query.order_by(Attendance.attendance_date.desc()).paginate(page=page, per_page=per_page)
        
        return jsonify({
            'attendances': [a.to_dict() for a in attendances.items],
            'total': attendances.total,
            'pages': attendances.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_attendance_summary():
    """Get attendance summary for current month"""
    try:
        user_id = get_jwt_identity()
        
        # Get month/year from params or use current
        month = request.args.get('month', get_local_today().month, type=int)
        year = request.args.get('year', get_local_today().year, type=int)
        
        # Calculate date range
        first_day = date(year, month, 1)
        if month == 12:
            last_day = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            last_day = date(year, month + 1, 1) - timedelta(days=1)
        
        # Get attendances for the month
        attendances = Attendance.query.filter(
            Attendance.user_id == user_id,
            Attendance.attendance_date >= first_day,
            Attendance.attendance_date <= last_day
        ).all()
        
        # Calculate summary
        total_days = (last_day - first_day).days + 1
        present_days = len([a for a in attendances if a.status in ['present', 'late']])
        late_days = len([a for a in attendances if a.status == 'late'])
        absent_days = total_days - present_days  # Simplified
        total_worked_hours = sum(float(a.worked_hours or 0) for a in attendances)
        total_overtime = sum(float(a.overtime_hours or 0) for a in attendances)
        
        return jsonify({
            'summary': {
                'month': month,
                'year': year,
                'total_work_days': total_days,
                'present_days': present_days,
                'late_days': late_days,
                'absent_days': absent_days,
                'total_worked_hours': round(total_worked_hours, 2),
                'total_overtime_hours': round(total_overtime, 2)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/admin/list', methods=['GET'])
@jwt_required()
def admin_get_all_attendance():
    """Admin: Get all users' attendance"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # Check admin permission
        if not user or not (user.is_admin or user.is_super_admin):
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Filters
        target_date = request.args.get('date', get_local_today().isoformat())
        target_user_id = request.args.get('user_id', type=int)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        query = Attendance.query
        
        if target_date:
            query = query.filter(Attendance.attendance_date == datetime.strptime(target_date, '%Y-%m-%d').date())
        
        if target_user_id:
            query = query.filter(Attendance.user_id == target_user_id)
        
        attendances = query.order_by(Attendance.attendance_date.desc(), Attendance.clock_in.desc()).paginate(page=page, per_page=per_page)
        
        return jsonify({
            'attendances': [a.to_dict() for a in attendances.items],
            'total': attendances.total,
            'pages': attendances.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/admin/verify/<int:attendance_id>', methods=['PUT'])
@jwt_required()
def admin_verify_attendance(attendance_id):
    """Admin: Verify or reject attendance"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not (user.is_admin or user.is_super_admin):
            return jsonify({'error': 'Unauthorized'}), 403
        
        attendance = Attendance.query.get(attendance_id)
        if not attendance:
            return jsonify({'error': 'Attendance not found'}), 404
        
        data = request.get_json()
        action = data.get('action')  # 'verify' or 'reject'
        
        if action == 'verify':
            attendance.verification_status = 'verified'
        elif action == 'reject':
            attendance.verification_status = 'rejected'
            attendance.rejection_reason = data.get('reason', 'Ditolak oleh admin')
        else:
            return jsonify({'error': 'Invalid action'}), 400
        
        attendance.verified_by = user_id
        attendance.verified_at = get_local_now()
        
        db.session.commit()
        
        return jsonify({
            'message': f'Attendance {action}ed',
            'attendance': attendance.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== REPORTS & ANALYTICS ====================


@attendance_bp.route('/report', methods=['GET'])
@jwt_required()
def get_attendance_report():
    """Get attendance report with filters"""
    try:
        # Get filters from query params
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        name_filter = request.args.get('name', '')
        status_filter = request.args.get('status', '')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Build query
        query = Attendance.query
        
        if start_date:
            query = query.filter(Attendance.attendance_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
        if end_date:
            query = query.filter(Attendance.attendance_date <= datetime.strptime(end_date, '%Y-%m-%d').date())
        if name_filter:
            query = query.filter(Attendance.notes.ilike(f'%{name_filter}%'))
        if status_filter:
            query = query.filter(Attendance.status == status_filter)
        
        # Order by date descending
        query = query.order_by(Attendance.attendance_date.desc(), Attendance.clock_in.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Extract name from notes for each record
        records = []
        for att in pagination.items:
            record = att.to_dict()
            # Extract name from notes field [NAME:xxx]
            if att.notes and '[NAME:' in att.notes:
                name_start = att.notes.find('[NAME:') + 6
                name_end = att.notes.find(']', name_start)
                record['attendee_name'] = att.notes[name_start:name_end] if name_end > name_start else ''
            else:
                record['attendee_name'] = ''
            records.append(record)
        
        return jsonify({
            'records': records,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/summary/monthly', methods=['GET'])
@jwt_required()
def get_monthly_summary():
    """Get monthly attendance summary with total hours per person"""
    try:
        year = request.args.get('year', get_local_today().year, type=int)
        month = request.args.get('month', get_local_today().month, type=int)
        
        # Get first and last day of month
        first_day = date(year, month, 1)
        if month == 12:
            last_day = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            last_day = date(year, month + 1, 1) - timedelta(days=1)
        
        # Query attendance for the month
        attendances = Attendance.query.filter(
            Attendance.attendance_date >= first_day,
            Attendance.attendance_date <= last_day
        ).all()
        
        # Group by name and calculate totals
        summary = {}
        for att in attendances:
            # Extract name from notes
            name = ''
            if att.notes and '[NAME:' in att.notes:
                name_start = att.notes.find('[NAME:') + 6
                name_end = att.notes.find(']', name_start)
                name = att.notes[name_start:name_end] if name_end > name_start else 'Unknown'
            
            if not name:
                continue
                
            if name not in summary:
                summary[name] = {
                    'name': name,
                    'total_days': 0,
                    'present_days': 0,
                    'late_days': 0,
                    'total_worked_hours': 0,
                    'total_overtime_hours': 0,
                    'records': []
                }
            
            summary[name]['total_days'] += 1
            if att.status == 'present':
                summary[name]['present_days'] += 1
            elif att.status == 'late':
                summary[name]['late_days'] += 1
            
            if att.worked_hours:
                summary[name]['total_worked_hours'] += float(att.worked_hours)
            if att.overtime_hours:
                summary[name]['total_overtime_hours'] += float(att.overtime_hours)
        
        # Round hours
        for name in summary:
            summary[name]['total_worked_hours'] = round(summary[name]['total_worked_hours'], 2)
            summary[name]['total_overtime_hours'] = round(summary[name]['total_overtime_hours'], 2)
        
        return jsonify({
            'year': year,
            'month': month,
            'summary': list(summary.values()),
            'total_employees': len(summary)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/today/late', methods=['GET'])
@jwt_required()
def get_today_late():
    """Get list of employees who are late today - for HR notification"""
    try:
        today = get_local_today()
        
        # Query late attendance for today
        late_attendances = Attendance.query.filter(
            Attendance.attendance_date == today,
            Attendance.status == 'late'
        ).all()
        
        late_list = []
        for att in late_attendances:
            name = ''
            if att.notes and '[NAME:' in att.notes:
                name_start = att.notes.find('[NAME:') + 6
                name_end = att.notes.find(']', name_start)
                name = att.notes[name_start:name_end] if name_end > name_start else 'Unknown'
            
            late_list.append({
                'id': att.id,
                'name': name,
                'clock_in': att.clock_in.strftime('%H:%M:%S') if att.clock_in else None,
                'notes': att.notes
            })
        
        return jsonify({
            'date': today.isoformat(),
            'late_count': len(late_list),
            'late_employees': late_list
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_attendance_dashboard_stats():
    """Get attendance statistics for dashboard"""
    try:
        today = get_local_today()
        
        # Today's stats
        today_total = Attendance.query.filter(Attendance.attendance_date == today).count()
        today_present = Attendance.query.filter(
            Attendance.attendance_date == today,
            Attendance.status == 'present'
        ).count()
        today_late = Attendance.query.filter(
            Attendance.attendance_date == today,
            Attendance.status == 'late'
        ).count()
        today_clocked_out = Attendance.query.filter(
            Attendance.attendance_date == today,
            Attendance.clock_out.isnot(None)
        ).count()
        
        # This month stats
        first_day_month = date(today.year, today.month, 1)
        month_total = Attendance.query.filter(
            Attendance.attendance_date >= first_day_month,
            Attendance.attendance_date <= today
        ).count()
        month_late = Attendance.query.filter(
            Attendance.attendance_date >= first_day_month,
            Attendance.attendance_date <= today,
            Attendance.status == 'late'
        ).count()
        
        return jsonify({
            'today': {
                'date': today.isoformat(),
                'total': today_total,
                'present': today_present,
                'late': today_late,
                'clocked_out': today_clocked_out
            },
            'month': {
                'year': today.year,
                'month': today.month,
                'total_records': month_total,
                'late_records': month_late,
                'late_percentage': round((month_late / month_total * 100), 1) if month_total > 0 else 0
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
