from datetime import datetime
from . import db

class Department(db.Model):
    __tablename__ = 'departments'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    manager_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    employees = db.relationship('Employee', back_populates='department', foreign_keys='Employee.department_id')
    manager = db.relationship('Employee', foreign_keys=[manager_id], post_update=True)

class Employee(db.Model):
    __tablename__ = 'employees'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    nik = db.Column(db.String(50), nullable=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, unique=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    full_name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    mobile = db.Column(db.String(50), nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    gender = db.Column(db.String(20), nullable=True)
    marital_status = db.Column(db.String(20), nullable=True)
    address = db.Column(db.Text, nullable=True)
    city = db.Column(db.String(100), nullable=True)
    postal_code = db.Column(db.String(20), nullable=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    position = db.Column(db.String(200), nullable=True)
    employment_type = db.Column(db.String(50), nullable=True)  # permanent, contract, temporary
    pay_type = db.Column(db.String(50), nullable=True, default='monthly')  # fixed, monthly, weekly, daily, piecework, outsourcing
    pay_rate = db.Column(db.Numeric(15, 2), nullable=True)  # Rate per unit: daily rate, weekly rate, or per-piece rate
    outsourcing_vendor_id = db.Column(db.Integer, db.ForeignKey('outsourcing_vendors.id'), nullable=True)
    hire_date = db.Column(db.Date, nullable=True)
    termination_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='active')  # active, on_leave, terminated
    salary = db.Column(db.Numeric(15, 2), nullable=True)
    npwp = db.Column(db.String(30), nullable=True)
    ptkp_status = db.Column(db.String(10), nullable=True, default='TK/0')  # TK/0, TK/1, TK/2, TK/3, K/0, K/1, K/2, K/3
    dependents = db.Column(db.Integer, nullable=True, default=0)  # jumlah tanggungan (0-3)
    has_allowance = db.Column('has_position_allowance', db.Boolean, default=False, nullable=False)  # apakah dapat tunjangan
    position_allowance_amount = db.Column(db.Numeric(15, 2), nullable=True, default=0)  # nominal tunjangan jabatan
    transport_allowance_amount = db.Column(db.Numeric(15, 2), nullable=True, default=0)  # nominal tunjangan transportasi
    emergency_contact_name = db.Column(db.String(200), nullable=True)
    emergency_contact_phone = db.Column(db.String(50), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User')
    department = db.relationship('Department', back_populates='employees', foreign_keys=[department_id])
    attendances = db.relationship('Attendance', back_populates='employee')
    leaves = db.relationship('Leave', back_populates='employee')
    rosters = db.relationship('EmployeeRoster', back_populates='employee')
    outsourcing_vendor = db.relationship('OutsourcingVendor', back_populates='employees')

class ShiftSchedule(db.Model):
    __tablename__ = 'shift_schedules'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    shift_type = db.Column(db.String(50), nullable=False)  # morning, afternoon, night, rotating
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    break_duration_minutes = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    color_code = db.Column(db.String(20), nullable=True)  # For drag-n-drop roster display
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    rosters = db.relationship('EmployeeRoster', back_populates='shift')

class Attendance(db.Model):
    __tablename__ = 'attendances'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=True)  # Made nullable for user-based attendance
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # NEW: User-based attendance
    attendance_date = db.Column(db.Date, nullable=False, index=True)
    shift_id = db.Column(db.Integer, db.ForeignKey('shift_schedules.id'), nullable=True)
    clock_in = db.Column(db.DateTime, nullable=True)
    clock_out = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='present')  # present, absent, late, half_day
    worked_hours = db.Column(db.Numeric(5, 2), default=0)
    overtime_hours = db.Column(db.Numeric(5, 2), default=0)
    notes = db.Column(db.Text, nullable=True)
    
    # Photo verification fields (photo NOT stored, only hash and metadata)
    photo_hash = db.Column(db.String(64), nullable=True)  # SHA-256 hash of photo
    photo_size_bytes = db.Column(db.Integer, nullable=True)  # Original photo size for verification
    face_detected = db.Column(db.Boolean, default=False)  # Was a face detected?
    face_confidence = db.Column(db.Float, nullable=True)  # Face detection confidence (0-100)
    face_count = db.Column(db.Integer, default=0)  # Number of faces in photo
    
    # GPS/Location fields for radius validation
    clock_in_latitude = db.Column(db.Float, nullable=True)
    clock_in_longitude = db.Column(db.Float, nullable=True)
    clock_in_accuracy = db.Column(db.Float, nullable=True)  # GPS accuracy in meters
    clock_in_distance = db.Column(db.Float, nullable=True)  # Distance from office in meters
    clock_in_location_valid = db.Column(db.Boolean, nullable=True)  # Within allowed radius?
    clock_out_latitude = db.Column(db.Float, nullable=True)
    clock_out_longitude = db.Column(db.Float, nullable=True)
    clock_out_accuracy = db.Column(db.Float, nullable=True)
    clock_out_distance = db.Column(db.Float, nullable=True)
    clock_out_location_valid = db.Column(db.Boolean, nullable=True)
    
    # Staff info (for public attendance without employee record)
    staff_jabatan = db.Column(db.String(100), nullable=True)  # Position/Jabatan
    staff_departemen = db.Column(db.String(100), nullable=True)  # Department
    
    # Device/Network metadata
    device_info = db.Column(db.String(500), nullable=True)  # User agent
    ip_address = db.Column(db.String(45), nullable=True)  # IPv4/IPv6
    
    # Verification status
    verification_status = db.Column(db.String(20), default='pending')  # pending, verified, rejected
    verified_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    verified_at = db.Column(db.DateTime, nullable=True)
    rejection_reason = db.Column(db.String(255), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    employee = db.relationship('Employee', back_populates='attendances')
    shift = db.relationship('ShiftSchedule')
    user = db.relationship('User', foreign_keys=[user_id], backref='user_attendances')
    verifier = db.relationship('User', foreign_keys=[verified_by])
    
    __table_args__ = (
        db.Index('idx_employee_date', 'employee_id', 'attendance_date'),
        db.Index('idx_user_date', 'user_id', 'attendance_date'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else (self.employee.name if self.employee else None),
            'attendance_date': self.attendance_date.isoformat() if self.attendance_date else None,
            'clock_in': self.clock_in.isoformat() if self.clock_in else None,
            'clock_out': self.clock_out.isoformat() if self.clock_out else None,
            'status': self.status,
            'worked_hours': float(self.worked_hours) if self.worked_hours else 0,
            'overtime_hours': float(self.overtime_hours) if self.overtime_hours else 0,
            'photo_hash': self.photo_hash,
            'face_detected': self.face_detected,
            'face_confidence': self.face_confidence,
            'face_count': self.face_count,
            'clock_in_latitude': self.clock_in_latitude,
            'clock_in_longitude': self.clock_in_longitude,
            'clock_in_accuracy': self.clock_in_accuracy,
            'clock_in_distance': self.clock_in_distance,
            'clock_in_location_valid': self.clock_in_location_valid,
            'clock_out_latitude': self.clock_out_latitude,
            'clock_out_longitude': self.clock_out_longitude,
            'clock_out_accuracy': self.clock_out_accuracy,
            'clock_out_distance': self.clock_out_distance,
            'clock_out_location_valid': self.clock_out_location_valid,
            'staff_jabatan': self.staff_jabatan,
            'staff_departemen': self.staff_departemen,
            'device_info': self.device_info,
            'ip_address': self.ip_address,
            'verification_status': self.verification_status,
            'verified_by': self.verified_by,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Leave(db.Model):
    __tablename__ = 'leaves'
    
    id = db.Column(db.Integer, primary_key=True)
    leave_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    leave_type = db.Column(db.String(50), nullable=False)  # annual, sick, personal, maternity, unpaid
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    total_days = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='pending')  # pending, approved, rejected, cancelled
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    employee = db.relationship('Employee', back_populates='leaves')
    approved_by_user = db.relationship('User')


class StaffLeaveRequest(db.Model):
    """Leave request for staff using name (not employee_id) - similar to public attendance"""
    __tablename__ = 'staff_leave_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    request_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    staff_name = db.Column(db.String(200), nullable=False, index=True)  # Name-based like attendance
    leave_type = db.Column(db.String(50), nullable=False)  # sakit, izin, cuti_tahunan, cuti_khusus, dinas_luar
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    total_days = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    attachment_path = db.Column(db.String(500), nullable=True)  # For sick note, etc.
    
    # Status & Approval
    status = db.Column(db.String(50), nullable=False, default='pending')  # pending, approved, rejected, cancelled
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    
    # Metadata
    submitted_from_ip = db.Column(db.String(45), nullable=True)
    device_info = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    approver = db.relationship('User', foreign_keys=[approved_by])
    
    def to_dict(self):
        return {
            'id': self.id,
            'request_number': self.request_number,
            'staff_name': self.staff_name,
            'leave_type': self.leave_type,
            'leave_type_label': {
                'sakit': 'Sakit',
                'izin': 'Izin',
                'cuti_tahunan': 'Cuti Tahunan',
                'cuti_khusus': 'Cuti Khusus',
                'dinas_luar': 'Dinas Luar'
            }.get(self.leave_type, self.leave_type),
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'total_days': self.total_days,
            'reason': self.reason,
            'attachment_path': self.attachment_path,
            'status': self.status,
            'status_label': {
                'pending': 'Menunggu Persetujuan',
                'approved': 'Disetujui',
                'rejected': 'Ditolak',
                'cancelled': 'Dibatalkan'
            }.get(self.status, self.status),
            'approved_by': self.approved_by,
            'approver_name': self.approver.full_name if self.approver else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'rejection_reason': self.rejection_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class OfficeLocation(db.Model):
    """Office location settings for GPS radius validation"""
    __tablename__ = 'office_locations'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    radius_meters = db.Column(db.Integer, nullable=False, default=100)  # Allowed radius in meters
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_default = db.Column(db.Boolean, default=False, nullable=False)  # Default office for attendance
    address = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'radius_meters': self.radius_meters,
            'is_active': self.is_active,
            'is_default': self.is_default,
            'address': self.address,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class EmployeeRoster(db.Model):
    __tablename__ = 'employee_rosters'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    shift_id = db.Column(db.Integer, db.ForeignKey('shift_schedules.id'), nullable=False)
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.id'), nullable=True)
    roster_date = db.Column(db.Date, nullable=False)
    is_off_day = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    employee = db.relationship('Employee', back_populates='rosters')
    shift = db.relationship('ShiftSchedule', back_populates='rosters')
    machine = db.relationship('Machine', back_populates='rosters')
    created_by_user = db.relationship('User')
    
    __table_args__ = (
        db.Index('idx_employee_roster_date', 'employee_id', 'roster_date'),
        db.Index('idx_machine_roster_date', 'machine_id', 'roster_date'),
        db.UniqueConstraint('employee_id', 'roster_date', name='unique_employee_roster_date'),
    )


class StaffFace(db.Model):
    """Store face encodings for staff recognition"""
    __tablename__ = 'staff_faces'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, index=True)
    jabatan = db.Column(db.String(200), nullable=True)
    departemen = db.Column(db.String(200), nullable=True)
    face_encoding = db.Column(db.Text, nullable=False)  # JSON string of 128-d face encoding
    photo_path = db.Column(db.String(500), nullable=True)  # Path to reference photo
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'jabatan': self.jabatan,
            'departemen': self.departemen,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class OutsourcingVendor(db.Model):
    """Vendor/perusahaan outsourcing yang menyediakan tenaga kerja"""
    __tablename__ = 'outsourcing_vendors'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    contact_person = db.Column(db.String(200), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    address = db.Column(db.Text, nullable=True)
    bank_name = db.Column(db.String(100), nullable=True)
    bank_account_number = db.Column(db.String(50), nullable=True)
    bank_account_name = db.Column(db.String(200), nullable=True)
    management_fee_percent = db.Column(db.Numeric(5, 2), default=0)  # Fee % yang diambil vendor
    contract_start = db.Column(db.Date, nullable=True)
    contract_end = db.Column(db.Date, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    employees = db.relationship('Employee', back_populates='outsourcing_vendor')
    
    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'contact_person': self.contact_person,
            'phone': self.phone,
            'email': self.email,
            'address': self.address,
            'bank_name': self.bank_name,
            'bank_account_number': self.bank_account_number,
            'bank_account_name': self.bank_account_name,
            'management_fee_percent': float(self.management_fee_percent) if self.management_fee_percent else 0,
            'contract_start': self.contract_start.isoformat() if self.contract_start else None,
            'contract_end': self.contract_end.isoformat() if self.contract_end else None,
            'is_active': self.is_active,
            'notes': self.notes,
            'employee_count': len(self.employees) if self.employees else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class PieceworkLog(db.Model):
    """Log output kerja borongan - catat hasil kerja per hari untuk hitung gaji borongan"""
    __tablename__ = 'piecework_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    work_date = db.Column(db.Date, nullable=False, index=True)
    description = db.Column(db.String(500), nullable=True)  # Deskripsi pekerjaan
    quantity = db.Column(db.Numeric(15, 2), nullable=False, default=0)  # Jumlah output
    unit = db.Column(db.String(50), nullable=True, default='pcs')  # Satuan: pcs, kg, meter, dll
    rate_per_unit = db.Column(db.Numeric(15, 2), nullable=False, default=0)  # Tarif per satuan
    total_amount = db.Column(db.Numeric(15, 2), nullable=False, default=0)  # quantity × rate_per_unit
    work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id'), nullable=True)  # Link ke WO jika ada
    verified_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    verified_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(50), default='pending')  # pending, verified, rejected
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    employee = db.relationship('Employee')
    verifier = db.relationship('User', foreign_keys=[verified_by])
    
    __table_args__ = (
        db.Index('idx_piecework_employee_date', 'employee_id', 'work_date'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'employee_name': self.employee.full_name if self.employee else None,
            'work_date': self.work_date.isoformat() if self.work_date else None,
            'description': self.description,
            'quantity': float(self.quantity),
            'unit': self.unit,
            'rate_per_unit': float(self.rate_per_unit),
            'total_amount': float(self.total_amount),
            'work_order_id': self.work_order_id,
            'verified_by': self.verified_by,
            'verifier_name': self.verifier.full_name if self.verifier else None,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
