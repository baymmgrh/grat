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
    hire_date = db.Column(db.Date, nullable=True)
    termination_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='active')  # active, on_leave, terminated
    salary = db.Column(db.Numeric(15, 2), nullable=True)
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
