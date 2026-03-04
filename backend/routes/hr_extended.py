from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Employee, Department, ShiftSchedule, Attendance, Leave, EmployeeRoster, Machine
from utils.i18n import success_response, error_response, get_message
from utils import generate_number
from datetime import datetime, date, timedelta
from sqlalchemy import func, and_, or_
from decimal import Decimal
from utils.timezone import get_local_now, get_local_today

hr_extended_bp = Blueprint('hr_extended', __name__)

# ===============================
# ENHANCED EMPLOYEE DATA
# ===============================

@hr_extended_bp.route('/employees/<int:employee_id>', methods=['GET'])
@jwt_required()
def get_employee_detail(employee_id):
    """Get detailed employee information"""
    try:
        employee = Employee.query.get_or_404(employee_id)
        
        return jsonify({
            'employee': {
                'id': employee.id,
                'employee_number': employee.employee_number,
                'nik': employee.nik,
                'npwp': employee.npwp,
                'user_id': employee.user_id,
                'first_name': employee.first_name,
                'last_name': employee.last_name,
                'full_name': employee.full_name,
                'email': employee.email,
                'phone': employee.phone,
                'mobile': employee.mobile,
                'date_of_birth': employee.date_of_birth.isoformat() if employee.date_of_birth else None,
                'gender': employee.gender,
                'marital_status': employee.marital_status,
                'address': employee.address,
                'city': employee.city,
                'postal_code': employee.postal_code,
                'department': {
                    'id': employee.department.id,
                    'code': employee.department.code,
                    'name': employee.department.name
                } if employee.department else None,
                'department_id': employee.department_id,
                'position': employee.position,
                'employment_type': employee.employment_type,
                'pay_type': employee.pay_type or 'monthly',
                'pay_rate': float(employee.pay_rate) if employee.pay_rate else None,
                'outsourcing_vendor_id': employee.outsourcing_vendor_id,
                'outsourcing_vendor': employee.outsourcing_vendor.name if employee.outsourcing_vendor else None,
                'hire_date': employee.hire_date.isoformat() if employee.hire_date else None,
                'termination_date': employee.termination_date.isoformat() if employee.termination_date else None,
                'status': employee.status,
                'salary': float(employee.salary) if employee.salary else None,
                'ptkp_status': employee.ptkp_status or 'TK/0',
                'dependents': employee.dependents or 0,
                'has_allowance': employee.has_allowance or False,
                'position_allowance_amount': float(employee.position_allowance_amount) if employee.position_allowance_amount else 0,
                'transport_allowance_amount': float(employee.transport_allowance_amount) if employee.transport_allowance_amount else 0,
                'emergency_contact_name': employee.emergency_contact_name,
                'emergency_contact_phone': employee.emergency_contact_phone,
                'is_active': employee.is_active,
                'created_at': employee.created_at.isoformat(),
                'updated_at': employee.updated_at.isoformat()
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_extended_bp.route('/employees/<int:employee_id>', methods=['PUT'])
@jwt_required()
def update_employee(employee_id):
    """Update employee information"""
    try:
        data = request.get_json()
        employee = Employee.query.get_or_404(employee_id)
        
        # Update fields if provided
        if 'employee_number' in data and data['employee_number']:
            # Check uniqueness only if changed
            if data['employee_number'] != employee.employee_number:
                existing = Employee.query.filter_by(employee_number=data['employee_number']).first()
                if existing and existing.id != employee_id:
                    return jsonify({'error': 'No. Karyawan sudah digunakan'}), 400
                employee.employee_number = data['employee_number']
        if 'npwp' in data:
            employee.npwp = data['npwp']
        if 'nik' in data:
            employee.nik = data['nik']
        if 'first_name' in data:
            employee.first_name = data['first_name']
        if 'last_name' in data:
            employee.last_name = data['last_name']
        if 'first_name' in data or 'last_name' in data:
            employee.full_name = f"{employee.first_name} {employee.last_name}"
        if 'email' in data:
            employee.email = data['email']
        if 'phone' in data:
            employee.phone = data['phone']
        if 'mobile' in data:
            employee.mobile = data['mobile']
        if 'date_of_birth' in data:
            employee.date_of_birth = datetime.fromisoformat(data['date_of_birth']).date() if data['date_of_birth'] else None
        if 'gender' in data:
            employee.gender = data['gender']
        if 'marital_status' in data:
            employee.marital_status = data['marital_status']
        if 'address' in data:
            employee.address = data['address']
        if 'city' in data:
            employee.city = data['city']
        if 'postal_code' in data:
            employee.postal_code = data['postal_code']
        if 'department_id' in data:
            employee.department_id = data['department_id']
        if 'position' in data:
            employee.position = data['position']
        if 'employment_type' in data:
            employee.employment_type = data['employment_type']
        if 'pay_type' in data:
            employee.pay_type = data['pay_type']
        if 'pay_rate' in data:
            employee.pay_rate = Decimal(str(data['pay_rate'])) if data['pay_rate'] else None
        if 'outsourcing_vendor_id' in data:
            employee.outsourcing_vendor_id = data['outsourcing_vendor_id'] if data['outsourcing_vendor_id'] else None
        if 'hire_date' in data:
            employee.hire_date = datetime.fromisoformat(data['hire_date']).date() if data['hire_date'] else None
        if 'salary' in data:
            employee.salary = Decimal(str(data['salary'])) if data['salary'] else None
        if 'ptkp_status' in data:
            employee.ptkp_status = data['ptkp_status']
        if 'dependents' in data:
            employee.dependents = int(data['dependents']) if data['dependents'] is not None else 0
        if 'has_allowance' in data:
            employee.has_allowance = bool(data['has_allowance'])
        if 'position_allowance_amount' in data:
            employee.position_allowance_amount = Decimal(str(data['position_allowance_amount'])) if data['position_allowance_amount'] else Decimal('0')
        if 'transport_allowance_amount' in data:
            employee.transport_allowance_amount = Decimal(str(data['transport_allowance_amount'])) if data['transport_allowance_amount'] else Decimal('0')
        if 'emergency_contact_name' in data:
            employee.emergency_contact_name = data['emergency_contact_name']
        if 'emergency_contact_phone' in data:
            employee.emergency_contact_phone = data['emergency_contact_phone']
        if 'status' in data:
            employee.status = data['status']
        
        employee.updated_at = get_local_now()
        db.session.commit()
        
        return jsonify(success_response('api.success'))
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_extended_bp.route('/employees/<int:employee_id>', methods=['DELETE'])
@jwt_required()
def delete_employee(employee_id):
    """Hard-delete employee (permanent removal)"""
    try:
        employee = Employee.query.get_or_404(employee_id)
        db.session.delete(employee)
        db.session.commit()
        return jsonify({'message': 'Karyawan berhasil dihapus permanen'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===============================
# ENHANCED ATTENDANCE MANAGEMENT
# ===============================

@hr_extended_bp.route('/attendance', methods=['GET'])
@jwt_required()
def get_attendance_records():
    """Get attendance records with filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        employee_id = request.args.get('employee_id', type=int)
        department_id = request.args.get('department_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        status = request.args.get('status')
        
        query = Attendance.query.join(Employee)
        
        if employee_id:
            query = query.filter(Attendance.employee_id == employee_id)
        if department_id:
            query = query.filter(Employee.department_id == department_id)
        if start_date:
            query = query.filter(Attendance.attendance_date >= datetime.fromisoformat(start_date).date())
        if end_date:
            query = query.filter(Attendance.attendance_date <= datetime.fromisoformat(end_date).date())
        if status:
            query = query.filter(Attendance.status == status)
        
        attendances = query.order_by(Attendance.attendance_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'attendances': [{
                'id': a.id,
                'employee': {
                    'id': a.employee.id,
                    'employee_number': a.employee.employee_number,
                    'full_name': a.employee.full_name,
                    'department': a.employee.department.name if a.employee.department else None
                },
                'attendance_date': a.attendance_date.isoformat(),
                'shift': {
                    'id': a.shift.id,
                    'name': a.shift.name,
                    'start_time': a.shift.start_time.strftime('%H:%M'),
                    'end_time': a.shift.end_time.strftime('%H:%M')
                } if a.shift else None,
                'clock_in': a.clock_in.isoformat() if a.clock_in else None,
                'clock_out': a.clock_out.isoformat() if a.clock_out else None,
                'status': a.status,
                'worked_hours': float(a.worked_hours),
                'overtime_hours': float(a.overtime_hours),
                'notes': a.notes,
                'created_at': a.created_at.isoformat()
            } for a in attendances.items],
            'total': attendances.total,
            'pages': attendances.pages,
            'current_page': attendances.page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_extended_bp.route('/attendance/clock-in', methods=['POST'])
@jwt_required()
def clock_in():
    """Clock in employee"""
    try:
        data = request.get_json()
        employee_id = data.get('employee_id')
        
        if not employee_id:
            return jsonify(error_response('api.error', error_code=400)), 400
        
        today = get_local_today()
        
        # Check if already clocked in today
        existing = Attendance.query.filter_by(
            employee_id=employee_id,
            attendance_date=today
        ).first()
        
        if existing and existing.clock_in:
            return jsonify(error_response('api.error', error_code=400)), 400
        
        # Get employee's scheduled shift for today
        roster = EmployeeRoster.query.filter_by(
            employee_id=employee_id,
            roster_date=today
        ).first()
        
        if existing:
            # Update existing record
            existing.clock_in = get_local_now()
            existing.shift_id = roster.shift_id if roster else None
            existing.status = 'present'
        else:
            # Create new attendance record
            attendance = Attendance(
                employee_id=employee_id,
                attendance_date=today,
                shift_id=roster.shift_id if roster else None,
                clock_in=get_local_now(),
                status='present'
            )
            db.session.add(attendance)
        
        db.session.commit()
        
        return jsonify(success_response('api.success'))
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_extended_bp.route('/attendance/clock-out', methods=['POST'])
@jwt_required()
def clock_out():
    """Clock out employee"""
    try:
        data = request.get_json()
        employee_id = data.get('employee_id')
        
        if not employee_id:
            return jsonify(error_response('api.error', error_code=400)), 400
        
        today = get_local_today()
        
        # Find today's attendance record
        attendance = Attendance.query.filter_by(
            employee_id=employee_id,
            attendance_date=today
        ).first()
        
        if not attendance or not attendance.clock_in:
            return jsonify(error_response('api.error', error_code=400)), 400
        
        if attendance.clock_out:
            return jsonify(error_response('api.error', error_code=400)), 400
        
        # Clock out
        attendance.clock_out = get_local_now()
        
        # Calculate worked hours
        worked_time = attendance.clock_out - attendance.clock_in
        worked_hours = worked_time.total_seconds() / 3600
        
        # Calculate overtime if applicable
        standard_hours = 8  # Standard work day
        overtime_hours = max(0, worked_hours - standard_hours)
        
        attendance.worked_hours = Decimal(str(round(worked_hours, 2)))
        attendance.overtime_hours = Decimal(str(round(overtime_hours, 2)))
        
        db.session.commit()
        
        return jsonify({
            'message': 'Clocked out successfully',
            'worked_hours': float(attendance.worked_hours),
            'overtime_hours': float(attendance.overtime_hours)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_extended_bp.route('/attendance/bulk-mark', methods=['POST'])
@jwt_required()
def bulk_mark_attendance():
    """Bulk mark attendance for multiple employees"""
    try:
        data = request.get_json()
        attendance_date = datetime.fromisoformat(data['attendance_date']).date()
        employee_attendances = data.get('attendances', [])
        
        for emp_attendance in employee_attendances:
            employee_id = emp_attendance['employee_id']
            status = emp_attendance['status']
            
            # Check if attendance already exists
            existing = Attendance.query.filter_by(
                employee_id=employee_id,
                attendance_date=attendance_date
            ).first()
            
            if existing:
                existing.status = status
                existing.notes = emp_attendance.get('notes')
            else:
                attendance = Attendance(
                    employee_id=employee_id,
                    attendance_date=attendance_date,
                    status=status,
                    notes=emp_attendance.get('notes')
                )
                db.session.add(attendance)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Bulk attendance marked for {len(employee_attendances)} employees'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===============================
# LEAVE MANAGEMENT
# ===============================

@hr_extended_bp.route('/leaves', methods=['GET'])
@jwt_required()
def get_leaves():
    """Get leave requests"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        employee_id = request.args.get('employee_id', type=int)
        status = request.args.get('status')
        leave_type = request.args.get('leave_type')
        
        query = Leave.query.join(Employee)
        
        if employee_id:
            query = query.filter(Leave.employee_id == employee_id)
        if status:
            query = query.filter(Leave.status == status)
        if leave_type:
            query = query.filter(Leave.leave_type == leave_type)
        
        leaves = query.order_by(Leave.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'leaves': [{
                'id': l.id,
                'leave_number': l.leave_number,
                'employee': {
                    'id': l.employee.id,
                    'employee_number': l.employee.employee_number,
                    'full_name': l.employee.full_name,
                    'department': l.employee.department.name if l.employee.department else None
                },
                'leave_type': l.leave_type,
                'start_date': l.start_date.isoformat(),
                'end_date': l.end_date.isoformat(),
                'total_days': l.total_days,
                'reason': l.reason,
                'status': l.status,
                'approved_by': l.approved_by_user.full_name if l.approved_by_user else None,
                'approved_at': l.approved_at.isoformat() if l.approved_at else None,
                'created_at': l.created_at.isoformat()
            } for l in leaves.items],
            'total': leaves.total,
            'pages': leaves.pages,
            'current_page': leaves.page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_extended_bp.route('/leaves', methods=['POST'])
@jwt_required()
def create_leave_request():
    """Create new leave request"""
    try:
        data = request.get_json()
        
        required_fields = ['employee_id', 'leave_type', 'start_date', 'end_date', 'reason']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        start_date = datetime.fromisoformat(data['start_date']).date()
        end_date = datetime.fromisoformat(data['end_date']).date()
        total_days = (end_date - start_date).days + 1
        
        leave_number = generate_number('LV')
        
        leave = Leave(
            leave_number=leave_number,
            employee_id=data['employee_id'],
            leave_type=data['leave_type'],
            start_date=start_date,
            end_date=end_date,
            total_days=total_days,
            reason=data['reason'],
            notes=data.get('notes')
        )
        
        db.session.add(leave)
        db.session.commit()
        
        return jsonify({
            'message': 'Leave request created successfully',
            'leave': {
                'id': leave.id,
                'leave_number': leave.leave_number,
                'leave_type': leave.leave_type,
                'total_days': leave.total_days,
                'status': leave.status
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_extended_bp.route('/leaves/<int:leave_id>/approve', methods=['POST'])
@jwt_required()
def approve_leave(leave_id):
    """Approve leave request"""
    try:
        user_id = get_jwt_identity()
        leave = Leave.query.get_or_404(leave_id)
        
        if leave.status != 'pending':
            return jsonify(error_response('api.error', error_code=400)), 400
        
        leave.status = 'approved'
        leave.approved_by = int(user_id)
        leave.approved_at = get_local_now()
        
        db.session.commit()
        
        return jsonify(success_response('api.success'))
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_extended_bp.route('/leaves/<int:leave_id>/reject', methods=['POST'])
@jwt_required()
def reject_leave(leave_id):
    """Reject leave request"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        leave = Leave.query.get_or_404(leave_id)
        
        if leave.status != 'pending':
            return jsonify(error_response('api.error', error_code=400)), 400
        
        leave.status = 'rejected'
        leave.approved_by = int(user_id)
        leave.approved_at = get_local_now()
        leave.notes = data.get('rejection_reason')
        
        db.session.commit()
        
        return jsonify(success_response('api.success'))
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===============================
# HR ROSTER MANAGEMENT
# ===============================

@hr_extended_bp.route('/roster', methods=['GET'])
@jwt_required()
def get_roster():
    """Get employee roster"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        employee_id = request.args.get('employee_id', type=int)
        department_id = request.args.get('department_id', type=int)
        
        query = EmployeeRoster.query.join(Employee).join(ShiftSchedule)
        
        if start_date:
            query = query.filter(EmployeeRoster.roster_date >= datetime.fromisoformat(start_date).date())
        if end_date:
            query = query.filter(EmployeeRoster.roster_date <= datetime.fromisoformat(end_date).date())
        if employee_id:
            query = query.filter(EmployeeRoster.employee_id == employee_id)
        if department_id:
            query = query.filter(Employee.department_id == department_id)
        
        rosters = query.order_by(EmployeeRoster.roster_date.asc()).all()
        
        return jsonify({
            'rosters': [{
                'id': r.id,
                'employee': {
                    'id': r.employee.id,
                    'employee_number': r.employee.employee_number,
                    'full_name': r.employee.full_name,
                    'department': r.employee.department.name if r.employee.department else None
                },
                'shift': {
                    'id': r.shift.id,
                    'name': r.shift.name,
                    'shift_type': r.shift.shift_type,
                    'start_time': r.shift.start_time.strftime('%H:%M'),
                    'end_time': r.shift.end_time.strftime('%H:%M'),
                    'color_code': r.shift.color_code
                },
                'machine': {
                    'id': r.machine.id,
                    'machine_code': r.machine.machine_code,
                    'machine_name': r.machine.machine_name
                } if r.machine else None,
                'roster_date': r.roster_date.isoformat(),
                'is_off_day': r.is_off_day,
                'notes': r.notes,
                'created_at': r.created_at.isoformat()
            } for r in rosters]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_extended_bp.route('/roster', methods=['POST'])
@jwt_required()
def create_roster():
    """Create roster entries"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        roster_entries = data.get('roster_entries', [])
        
        for entry in roster_entries:
            # Check if roster already exists
            existing = EmployeeRoster.query.filter_by(
                employee_id=entry['employee_id'],
                roster_date=datetime.fromisoformat(entry['roster_date']).date()
            ).first()
            
            if existing:
                # Update existing
                existing.shift_id = entry.get('shift_id')
                existing.machine_id = entry.get('machine_id')
                existing.is_off_day = entry.get('is_off_day', False)
                existing.notes = entry.get('notes')
                existing.updated_at = get_local_now()
            else:
                # Create new
                roster = EmployeeRoster(
                    employee_id=entry['employee_id'],
                    shift_id=entry.get('shift_id'),
                    machine_id=entry.get('machine_id'),
                    roster_date=datetime.fromisoformat(entry['roster_date']).date(),
                    is_off_day=entry.get('is_off_day', False),
                    notes=entry.get('notes'),
                    created_by=int(user_id)
                )
                db.session.add(roster)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Created/updated {len(roster_entries)} roster entries'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_extended_bp.route('/roster/bulk-generate', methods=['POST'])
@jwt_required()
def bulk_generate_roster():
    """Bulk generate roster for multiple employees and dates"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        employee_ids = data.get('employee_ids', [])
        start_date = datetime.fromisoformat(data['start_date']).date()
        end_date = datetime.fromisoformat(data['end_date']).date()
        shift_pattern = data.get('shift_pattern', [])  # List of shift_ids for rotation
        
        if not employee_ids or not shift_pattern:
            return jsonify(error_response('api.error', error_code=400)), 400
        
        created_count = 0
        current_date = start_date
        
        while current_date <= end_date:
            for idx, employee_id in enumerate(employee_ids):
                # Check if roster already exists
                existing = EmployeeRoster.query.filter_by(
                    employee_id=employee_id,
                    roster_date=current_date
                ).first()
                
                if not existing:
                    # Use shift pattern rotation
                    shift_id = shift_pattern[idx % len(shift_pattern)]
                    
                    roster = EmployeeRoster(
                        employee_id=employee_id,
                        shift_id=shift_id,
                        roster_date=current_date,
                        created_by=int(user_id)
                    )
                    db.session.add(roster)
                    created_count += 1
            
            current_date += timedelta(days=1)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Generated {created_count} roster entries',
            'created_count': created_count
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===============================
# DEPARTMENTS & SHIFTS
# ===============================

@hr_extended_bp.route('/departments', methods=['POST'])
@jwt_required()
def create_department():
    """Create new department"""
    try:
        data = request.get_json()
        
        required_fields = ['code', 'name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if code already exists
        existing = Department.query.filter_by(code=data['code']).first()
        if existing:
            return jsonify(error_response('api.error', error_code=409)), 409
        
        department = Department(
            code=data['code'],
            name=data['name'],
            description=data.get('description'),
            manager_id=data.get('manager_id')
        )
        
        db.session.add(department)
        db.session.commit()
        
        return jsonify({
            'message': 'Department created successfully',
            'department': {
                'id': department.id,
                'code': department.code,
                'name': department.name
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_extended_bp.route('/shifts', methods=['POST'])
@jwt_required()
def create_shift():
    """Create new shift schedule"""
    try:
        data = request.get_json()
        
        required_fields = ['name', 'shift_type', 'start_time', 'end_time']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        shift = ShiftSchedule(
            name=data['name'],
            shift_type=data['shift_type'],
            start_time=datetime.fromisoformat(data['start_time']).time(),
            end_time=datetime.fromisoformat(data['end_time']).time(),
            break_duration_minutes=data.get('break_duration_minutes', 0),
            color_code=data.get('color_code')
        )
        
        db.session.add(shift)
        db.session.commit()
        
        return jsonify({
            'message': 'Shift schedule created successfully',
            'shift': {
                'id': shift.id,
                'name': shift.name,
                'shift_type': shift.shift_type,
                'start_time': shift.start_time.strftime('%H:%M'),
                'end_time': shift.end_time.strftime('%H:%M')
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
