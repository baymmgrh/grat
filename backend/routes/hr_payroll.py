from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Employee, PayrollPeriod, PayrollRecord, SalaryComponent, EmployeeSalaryComponent, Attendance, PieceworkLog
from utils.i18n import success_response, error_response, get_message
from utils import generate_number
from datetime import datetime, date
from sqlalchemy import func, and_
from decimal import Decimal
from utils.timezone import get_local_now, get_local_today

hr_payroll_bp = Blueprint('hr_payroll', __name__)

# ===============================
# PAYROLL PERIODS
# ===============================

@hr_payroll_bp.route('/periods', methods=['GET'])
@jwt_required()
def get_payroll_periods():
    """Get all payroll periods"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        status = request.args.get('status')
        
        query = PayrollPeriod.query
        
        if status:
            query = query.filter_by(status=status)
        
        periods = query.order_by(PayrollPeriod.start_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'periods': [{
                'id': p.id,
                'period_name': p.period_name,
                'start_date': p.start_date.isoformat(),
                'end_date': p.end_date.isoformat(),
                'status': p.status,
                'total_employees': p.total_employees,
                'total_gross_salary': float(p.total_gross_salary),
                'total_deductions': float(p.total_deductions),
                'total_net_salary': float(p.total_net_salary),
                'processed_at': p.processed_at.isoformat() if p.processed_at else None,
                'created_at': p.created_at.isoformat()
            } for p in periods.items],
            'total': periods.total,
            'pages': periods.pages,
            'current_page': periods.page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_payroll_bp.route('/periods', methods=['POST'])
@jwt_required()
def create_payroll_period():
    """Create new payroll period"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Validate required fields
        required_fields = ['period_name', 'start_date', 'end_date']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check for overlapping periods
        start_date = datetime.fromisoformat(data['start_date']).date()
        end_date = datetime.fromisoformat(data['end_date']).date()
        
        existing = PayrollPeriod.query.filter(
            and_(
                PayrollPeriod.start_date <= end_date,
                PayrollPeriod.end_date >= start_date
            )
        ).first()
        
        if existing:
            return jsonify(error_response('api.error', error_code=409)), 409
        
        period = PayrollPeriod(
            period_name=data['period_name'],
            start_date=start_date,
            end_date=end_date,
            processed_by=int(user_id)
        )
        
        db.session.add(period)
        db.session.commit()
        
        return jsonify({
            'message': 'Payroll period created successfully',
            'period': {
                'id': period.id,
                'period_name': period.period_name,
                'start_date': period.start_date.isoformat(),
                'end_date': period.end_date.isoformat(),
                'status': period.status
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_payroll_bp.route('/periods/<int:period_id>/approve', methods=['POST'])
@jwt_required()
def approve_payroll_period(period_id):
    """Approve payroll period and all its records"""
    try:
        period = PayrollPeriod.query.get_or_404(period_id)
        
        if period.status != 'processing':
            return jsonify({'error': 'Only processing periods can be approved'}), 400
        
        period.status = 'completed'
        period.processed_at = datetime.utcnow()
        
        # Approve all records in this period
        records = PayrollRecord.query.filter_by(payroll_period_id=period_id).all()
        for record in records:
            if record.status == 'calculated':
                record.status = 'approved'
        
        db.session.commit()
        
        return jsonify({'message': 'Payroll period approved successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_payroll_bp.route('/periods/<int:period_id>/calculate', methods=['POST'])
@jwt_required()
def calculate_payroll(period_id):
    """Calculate payroll for all employees in a period"""
    try:
        period = PayrollPeriod.query.get_or_404(period_id)
        
        if period.status not in ('draft', 'processing'):
            return jsonify({'error': 'Periode sudah diapprove/dikunci, tidak bisa dihitung ulang'}), 400
        
        # Get all active employees
        employees = Employee.query.filter_by(is_active=True, status='active').all()
        
        total_gross = Decimal('0')
        total_deductions = Decimal('0')
        total_net = Decimal('0')
        calculated_count = 0
        skipped = []
        
        for employee in employees:
            # Skip employees without salary set
            if not employee.salary or float(employee.salary) <= 0:
                skipped.append({
                    'employee_id': employee.id,
                    'name': employee.full_name,
                    'reason': 'Gaji pokok belum diisi'
                })
                continue
            
            # Calculate attendance data
            attendance_data = calculate_employee_attendance(employee.id, period.start_date, period.end_date)
            
            # Get employee salary components
            salary_components = get_employee_salary_components(employee.id)
            
            # Calculate payroll record
            payroll_record = calculate_employee_payroll(
                employee, period, attendance_data, salary_components
            )
            
            total_gross += payroll_record.gross_salary
            total_deductions += payroll_record.total_deductions
            total_net += payroll_record.net_salary
            calculated_count += 1
        
        # Update period totals
        period.total_employees = calculated_count
        period.total_gross_salary = total_gross
        period.total_deductions = total_deductions
        period.total_net_salary = total_net
        period.status = 'processing'
        period.processed_by = int(get_jwt_identity())
        period.processed_at = datetime.utcnow()
        
        db.session.commit()
        
        message = f'Payroll berhasil dihitung untuk {calculated_count} karyawan.'
        if skipped:
            message += f' {len(skipped)} karyawan dilewati karena gaji pokok belum diisi.'
        
        return jsonify({
            'message': message,
            'summary': {
                'total_employees': calculated_count,
                'total_gross_salary': float(total_gross),
                'total_deductions': float(total_deductions),
                'total_net_salary': float(total_net),
                'skipped': skipped
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def calculate_employee_attendance(employee_id, start_date, end_date):
    """Calculate attendance data for employee in period using real attendance records"""
    from datetime import timedelta
    
    attendances = Attendance.query.filter(
        and_(
            Attendance.employee_id == employee_id,
            Attendance.attendance_date >= start_date,
            Attendance.attendance_date <= end_date
        )
    ).all()
    
    # Count working days excluding Sundays (weekday() == 6)
    total_working_days = 0
    current = start_date
    while current <= end_date:
        if current.weekday() != 6:  # Exclude Sunday
            total_working_days += 1
        current += timedelta(days=1)
    
    # Count attendance: present, late, half_day all count as worked
    days_worked = len([a for a in attendances if a.status in ('present', 'late', 'half_day')])
    days_absent = len([a for a in attendances if a.status == 'absent'])
    total_overtime_hours = sum([float(a.overtime_hours or 0) for a in attendances])
    total_late_hours = sum([float(a.late_hours or 0) for a in attendances if hasattr(a, 'late_hours') and a.late_hours])
    total_worked_hours = sum([float(a.worked_hours or 0) for a in attendances])
    
    # If no attendance records at all, assume full attendance (belum ada data absensi = hadir penuh)
    if len(attendances) == 0 and total_working_days > 0:
        days_worked = total_working_days
        days_absent = 0
    
    return {
        'total_working_days': total_working_days,
        'days_worked': days_worked,
        'days_absent': days_absent,
        'overtime_hours': total_overtime_hours,
        'late_hours': total_late_hours,
        'worked_hours': total_worked_hours
    }

def get_employee_salary_components(employee_id):
    """Get active salary components for employee"""
    components = EmployeeSalaryComponent.query.filter(
        and_(
            EmployeeSalaryComponent.employee_id == employee_id,
            EmployeeSalaryComponent.is_active == True,
            EmployeeSalaryComponent.effective_from <= get_local_today()
        )
    ).join(SalaryComponent).all()
    
    return components

def _parse_note_decimal(notes, key):
    """Parse a decimal value from pipe-delimited notes string, e.g. 'position_allowance:500000'"""
    if not notes:
        return 0
    for part in notes.split('|'):
        if part.startswith(f'{key}:'):
            try:
                return float(part.split(':', 1)[1])
            except (ValueError, IndexError):
                return 0
    return 0

def get_ter_category(ptkp_status):
    """Determine TER category (A/B/C) from PTKP status.
    PP 58/2023:
      Kategori A: TK/0, TK/1, K/0
      Kategori B: TK/2, TK/3, K/1, K/2
      Kategori C: K/3
    """
    status = (ptkp_status or 'TK/0').upper().strip()
    if status in ('TK/0', 'TK/1', 'K/0'):
        return 'A'
    elif status in ('TK/2', 'TK/3', 'K/1', 'K/2'):
        return 'B'
    elif status == 'K/3':
        return 'C'
    return 'A'  # default

# ===== TABEL TER PP 58/2023 =====
# Format: (batas_atas_bruto_bulanan, tarif_persen)
# Batas atas = None berarti tak terbatas
TER_TABLE = {
    'A': [
        (5400000, Decimal('0')),
        (5650000, Decimal('0.0025')),
        (5950000, Decimal('0.005')),
        (6300000, Decimal('0.0075')),
        (6750000, Decimal('0.01')),
        (7500000, Decimal('0.0125')),
        (8550000, Decimal('0.015')),
        (9650000, Decimal('0.0175')),
        (10050000, Decimal('0.02')),
        (10350000, Decimal('0.0225')),
        (10700000, Decimal('0.025')),
        (11050000, Decimal('0.03')),
        (11600000, Decimal('0.035')),
        (12500000, Decimal('0.04')),
        (13750000, Decimal('0.05')),
        (15100000, Decimal('0.06')),
        (16950000, Decimal('0.07')),
        (19750000, Decimal('0.08')),
        (24150000, Decimal('0.09')),
        (26450000, Decimal('0.10')),
        (28000000, Decimal('0.11')),
        (30050000, Decimal('0.12')),
        (32400000, Decimal('0.13')),
        (35400000, Decimal('0.14')),
        (39100000, Decimal('0.15')),
        (43850000, Decimal('0.16')),
        (47800000, Decimal('0.17')),
        (51400000, Decimal('0.18')),
        (56300000, Decimal('0.19')),
        (62200000, Decimal('0.20')),
        (68600000, Decimal('0.21')),
        (77500000, Decimal('0.22')),
        (89000000, Decimal('0.23')),
        (103000000, Decimal('0.24')),
        (125000000, Decimal('0.25')),
        (157000000, Decimal('0.26')),
        (206000000, Decimal('0.27')),
        (337000000, Decimal('0.28')),
        (454000000, Decimal('0.29')),
        (550000000, Decimal('0.30')),
        (695000000, Decimal('0.31')),
        (910000000, Decimal('0.32')),
        (1400000000, Decimal('0.33')),
        (None, Decimal('0.34')),
    ],
    'B': [
        (6200000, Decimal('0')),
        (6500000, Decimal('0.0025')),
        (6850000, Decimal('0.005')),
        (7300000, Decimal('0.0075')),
        (9200000, Decimal('0.01')),
        (10750000, Decimal('0.015')),
        (11250000, Decimal('0.02')),
        (11600000, Decimal('0.025')),
        (12600000, Decimal('0.03')),
        (13600000, Decimal('0.035')),
        (14950000, Decimal('0.04')),
        (16400000, Decimal('0.05')),
        (18450000, Decimal('0.06')),
        (21850000, Decimal('0.07')),
        (26000000, Decimal('0.08')),
        (27700000, Decimal('0.09')),
        (29350000, Decimal('0.10')),
        (31450000, Decimal('0.11')),
        (33950000, Decimal('0.12')),
        (37100000, Decimal('0.13')),
        (41100000, Decimal('0.14')),
        (45800000, Decimal('0.15')),
        (49500000, Decimal('0.16')),
        (53800000, Decimal('0.17')),
        (58500000, Decimal('0.18')),
        (64000000, Decimal('0.19')),
        (71000000, Decimal('0.20')),
        (80000000, Decimal('0.21')),
        (93000000, Decimal('0.22')),
        (109000000, Decimal('0.23')),
        (129000000, Decimal('0.24')),
        (163000000, Decimal('0.25')),
        (211000000, Decimal('0.26')),
        (374000000, Decimal('0.27')),
        (459000000, Decimal('0.28')),
        (555000000, Decimal('0.29')),
        (704000000, Decimal('0.30')),
        (957000000, Decimal('0.31')),
        (1405000000, Decimal('0.32')),
        (None, Decimal('0.33')),
    ],
    'C': [
        (6600000, Decimal('0')),
        (6950000, Decimal('0.0025')),
        (7350000, Decimal('0.005')),
        (7800000, Decimal('0.0075')),
        (8850000, Decimal('0.01')),
        (9800000, Decimal('0.0125')),
        (10950000, Decimal('0.015')),
        (11200000, Decimal('0.0175')),
        (12050000, Decimal('0.02')),
        (12950000, Decimal('0.025')),
        (14150000, Decimal('0.03')),
        (15550000, Decimal('0.035')),
        (17050000, Decimal('0.04')),
        (19500000, Decimal('0.05')),
        (22700000, Decimal('0.06')),
        (26600000, Decimal('0.07')),
        (28100000, Decimal('0.08')),
        (30100000, Decimal('0.09')),
        (32600000, Decimal('0.10')),
        (35400000, Decimal('0.11')),
        (38900000, Decimal('0.12')),
        (43000000, Decimal('0.13')),
        (47400000, Decimal('0.14')),
        (51200000, Decimal('0.15')),
        (55800000, Decimal('0.16')),
        (60400000, Decimal('0.17')),
        (66700000, Decimal('0.18')),
        (74500000, Decimal('0.19')),
        (83200000, Decimal('0.20')),
        (95000000, Decimal('0.21')),
        (110000000, Decimal('0.22')),
        (134000000, Decimal('0.23')),
        (169000000, Decimal('0.24')),
        (221000000, Decimal('0.25')),
        (390000000, Decimal('0.26')),
        (463000000, Decimal('0.27')),
        (561000000, Decimal('0.28')),
        (709000000, Decimal('0.29')),
        (965000000, Decimal('0.30')),
        (1419000000, Decimal('0.31')),
        (None, Decimal('0.32')),
    ],
}

def calculate_pph21_ter(gross_monthly, ptkp_status):
    """Calculate PPh 21 using TER (Tarif Efektif Rata-rata) PP 58/2023.
    
    Args:
        gross_monthly: Penghasilan bruto bulanan (Decimal)
        ptkp_status: Status PTKP karyawan (TK/0, K/1, dll)
    
    Returns:
        PPh 21 bulanan (Decimal, rounded)
    """
    if gross_monthly <= 0:
        return Decimal('0')
    
    category = get_ter_category(ptkp_status)
    table = TER_TABLE.get(category, TER_TABLE['A'])
    
    gross = int(gross_monthly)
    rate = Decimal('0')
    
    for upper_limit, ter_rate in table:
        if upper_limit is None or gross <= upper_limit:
            rate = ter_rate
            break
    
    pph21 = (gross_monthly * rate).quantize(Decimal('1'))
    return pph21

def calculate_piecework_total(employee_id, start_date, end_date):
    """Calculate total piecework earnings for borongan employees"""
    logs = PieceworkLog.query.filter(
        and_(
            PieceworkLog.employee_id == employee_id,
            PieceworkLog.work_date >= start_date,
            PieceworkLog.work_date <= end_date,
            PieceworkLog.status.in_(['pending', 'verified'])
        )
    ).all()
    
    total = sum(Decimal(str(log.total_amount or 0)) for log in logs)
    count = len(logs)
    total_qty = sum(Decimal(str(log.quantity or 0)) for log in logs)
    return {'total_amount': total, 'log_count': count, 'total_quantity': total_qty}

def calculate_employee_payroll(employee, period, attendance_data, salary_components):
    """Calculate individual employee payroll based on pay_type category.
    
    Pay types:
    - fixed    : Gaji tetap dari manajemen pusat (top management), tidak ada potongan absensi
    - monthly  : Gaji bulanan reguler, ada potongan absensi proporsional
    - weekly   : Gaji mingguan = pay_rate × minggu dalam periode
    - daily    : Gaji harian = pay_rate × hari hadir
    - piecework: Gaji borongan = total output × tarif per unit (dari PieceworkLog)
    - outsourcing: Gaji via vendor outsourcing, dicatat tapi dibayar ke vendor bukan langsung
    """
    pay_type = employee.pay_type or 'monthly'
    monthly_salary = Decimal(str(employee.salary or 0))
    pay_rate = Decimal(str(employee.pay_rate or 0))
    
    total_working_days = attendance_data.get('total_working_days', 0)
    days_worked = attendance_data.get('days_worked', 0)
    days_absent = attendance_data.get('days_absent', 0)
    overtime_hours = Decimal(str(attendance_data.get('overtime_hours', 0)))
    
    # ===== CALCULATE BASE SALARY BY PAY TYPE =====
    basic_salary = Decimal('0')
    absence_deduction = Decimal('0')
    overtime_amount = Decimal('0')
    piecework_amount = Decimal('0')
    
    if pay_type == 'fixed':
        # Fixed: gaji tetap penuh, tidak ada potongan absensi
        basic_salary = monthly_salary
        # Overtime tetap dihitung
        if basic_salary > 0:
            overtime_rate = (basic_salary / Decimal('173')) * Decimal('1.5')
            overtime_amount = overtime_rate * overtime_hours
    
    elif pay_type == 'monthly':
        # Monthly: gaji bulanan dengan potongan absensi proporsional
        basic_salary = monthly_salary
        if days_absent > 0 and total_working_days > 0:
            daily_rate = basic_salary / Decimal(str(total_working_days))
            absence_deduction = daily_rate * Decimal(str(days_absent))
        if basic_salary > 0:
            overtime_rate = (basic_salary / Decimal('173')) * Decimal('1.5')
            overtime_amount = overtime_rate * overtime_hours
    
    elif pay_type == 'weekly':
        # Weekly: pay_rate per minggu × jumlah minggu dalam periode
        from datetime import timedelta
        weeks_in_period = Decimal(str(max(1, ((period.end_date - period.start_date).days + 1) / 7)))
        basic_salary = (pay_rate * weeks_in_period).quantize(Decimal('1'))
        # Potongan proporsional jika absent
        if days_absent > 0 and total_working_days > 0:
            daily_rate = basic_salary / Decimal(str(total_working_days))
            absence_deduction = daily_rate * Decimal(str(days_absent))
    
    elif pay_type == 'daily':
        # Daily: pay_rate per hari × hari hadir (days_worked)
        basic_salary = (pay_rate * Decimal(str(days_worked))).quantize(Decimal('1'))
        # Tidak ada absence deduction karena sudah dihitung dari hari hadir saja
    
    elif pay_type == 'piecework':
        # Borongan: total dari PieceworkLog dalam periode
        pw = calculate_piecework_total(employee.id, period.start_date, period.end_date)
        piecework_amount = pw['total_amount']
        basic_salary = piecework_amount
        # Borongan tidak ada absence deduction, dibayar sesuai output
    
    elif pay_type == 'outsourcing':
        # Outsourcing: gaji bulanan seperti monthly, tapi dicatat sebagai bayar ke vendor
        basic_salary = monthly_salary
        if days_absent > 0 and total_working_days > 0:
            daily_rate = basic_salary / Decimal(str(total_working_days))
            absence_deduction = daily_rate * Decimal(str(days_absent))
    
    else:
        # Default fallback ke monthly
        basic_salary = monthly_salary
    
    # ===== ALLOWANCES & COMPONENT DEDUCTIONS =====
    allowances = Decimal('0')
    position_allowance = Decimal('0')
    transport_allowance = Decimal('0')
    component_deductions = Decimal('0')
    
    # Tunjangan jabatan (1x per periode) & transportasi (per hari masuk)
    if employee.has_allowance:
        if employee.position_allowance_amount:
            position_allowance = Decimal(str(employee.position_allowance_amount))
            allowances += position_allowance
        if employee.transport_allowance_amount:
            daily_transport = Decimal(str(employee.transport_allowance_amount))
            transport_allowance = (daily_transport * Decimal(str(days_worked))).quantize(Decimal('1'))
            allowances += transport_allowance
    
    for comp in salary_components:
        if comp.salary_component.component_type == 'earning':
            allowances += Decimal(str(comp.amount))
        elif comp.salary_component.component_type == 'deduction':
            component_deductions += Decimal(str(comp.amount))
    
    # ===== GROSS SALARY =====
    gross_salary = basic_salary + allowances + overtime_amount
    
    # ===== BPJS (EMPLOYEE SHARE) =====
    insurance_deduction = Decimal('0')
    pension_deduction = Decimal('0')
    
    if pay_type not in ('outsourcing', 'piecework', 'daily'):
        # BPJS Kesehatan: 1% employee share (max base 12jt)
        bpjs_base = min(gross_salary, Decimal('12000000'))
        insurance_deduction = (bpjs_base * Decimal('0.01')).quantize(Decimal('1'))
        
        # BPJS Ketenagakerjaan JHT: 2% employee share
        pension_deduction = (gross_salary * Decimal('0.02')).quantize(Decimal('1'))
    
    # ===== PPh 21 — TER PP 58/2023, DITANGGUNG PERUSAHAAN =====
    # PPh 21 dihitung dari bruto untuk pelaporan, tapi TIDAK dipotong dari gaji karyawan.
    # Untuk perpajakan: bruto + PPh 21 ditanggung = dasar pengenaan TER (gross-up sederhana).
    # Karena ditanggung perusahaan, kita hitung PPh 21 dari bruto bersih (setelah BPJS).
    tax_deduction = Decimal('0')
    
    if pay_type not in ('outsourcing', 'piecework', 'daily'):
        ptkp_status = employee.ptkp_status or 'TK/0'
        # Bruto untuk TER = gross_salary - absence_deduction (penghasilan efektif)
        effective_gross = gross_salary - absence_deduction
        tax_deduction = calculate_pph21_ter(effective_gross, ptkp_status)
    
    # ===== TOTAL DEDUCTIONS =====
    # PPh 21 TIDAK masuk total_deductions karena ditanggung perusahaan
    total_deductions = insurance_deduction + pension_deduction + absence_deduction + component_deductions
    
    # ===== NET SALARY =====
    net_salary = gross_salary - total_deductions
    if net_salary < 0:
        net_salary = Decimal('0')
    
    # ===== CREATE OR UPDATE RECORD =====
    existing_record = PayrollRecord.query.filter_by(
        payroll_period_id=period.id,
        employee_id=employee.id
    ).first()
    
    if existing_record:
        record = existing_record
    else:
        record = PayrollRecord(
            payroll_period_id=period.id,
            employee_id=employee.id
        )
        db.session.add(record)
    
    # Update record values
    record.basic_salary = basic_salary
    record.allowances = allowances
    record.overtime_amount = overtime_amount
    record.gross_salary = gross_salary
    record.tax_deduction = tax_deduction  # dicatat untuk pelaporan, tapi tidak dipotong
    record.insurance_deduction = insurance_deduction
    record.pension_deduction = pension_deduction
    record.absence_deduction = absence_deduction
    record.other_deductions = component_deductions
    record.total_deductions = total_deductions
    record.net_salary = net_salary
    record.total_working_days = attendance_data['total_working_days']
    record.days_worked = attendance_data['days_worked']
    record.days_absent = attendance_data['days_absent']
    record.overtime_hours = overtime_hours
    record.late_hours = Decimal(str(attendance_data.get('late_hours', 0)))
    record.notes = f'pay_type:{pay_type}|ptkp:{employee.ptkp_status or "TK/0"}|pph21_company:{tax_deduction}|position_allowance:{position_allowance}|transport_allowance:{transport_allowance}'
    
    return record

# ===============================
# PAYROLL RECORDS
# ===============================

@hr_payroll_bp.route('/periods/<int:period_id>/records', methods=['GET'])
@jwt_required()
def get_payroll_records(period_id):
    """Get payroll records for a period"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        records = PayrollRecord.query.filter_by(payroll_period_id=period_id)\
            .join(Employee).paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'records': [{
                'id': r.id,
                'employee': {
                    'id': r.employee.id,
                    'employee_number': r.employee.employee_number,
                    'full_name': r.employee.full_name,
                    'department': r.employee.department.name if r.employee.department else None,
                    'pay_type': r.employee.pay_type or 'monthly',
                    'position': r.employee.position,
                    'has_allowance': r.employee.has_allowance or False,
                    'position_allowance_amount': float(r.employee.position_allowance_amount or 0),
                    'transport_allowance_amount': float(r.employee.transport_allowance_amount or 0),
                    'outsourcing_vendor': r.employee.outsourcing_vendor.name if r.employee.outsourcing_vendor else None
                },
                'basic_salary': float(r.basic_salary),
                'allowances': float(r.allowances),
                'overtime_amount': float(r.overtime_amount),
                'bonus': float(r.bonus or 0),
                'commission': float(r.commission or 0),
                'gross_salary': float(r.gross_salary),
                'tax_deduction': float(r.tax_deduction or 0),
                'insurance_deduction': float(r.insurance_deduction or 0),
                'pension_deduction': float(r.pension_deduction or 0),
                'absence_deduction': float(r.absence_deduction or 0),
                'loan_deduction': float(r.loan_deduction or 0),
                'other_deductions': float(r.other_deductions or 0),
                'total_deductions': float(r.total_deductions),
                'net_salary': float(r.net_salary),
                'total_working_days': r.total_working_days,
                'days_worked': r.days_worked,
                'days_absent': r.days_absent,
                'overtime_hours': float(r.overtime_hours),
                'late_hours': float(r.late_hours or 0),
                'status': r.status,
                'payment_date': r.payment_date.isoformat() if r.payment_date else None,
                'payment_method': r.payment_method,
                'notes': r.notes,
                'position_allowance': _parse_note_decimal(r.notes, 'position_allowance'),
                'transport_allowance': _parse_note_decimal(r.notes, 'transport_allowance')
            } for r in records.items],
            'total': records.total,
            'pages': records.pages,
            'current_page': records.page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_payroll_bp.route('/records', methods=['POST'])
@jwt_required()
def create_payroll_record():
    """Create individual payroll record"""
    try:
        data = request.get_json()
        
        required_fields = ['payroll_period_id', 'employee_id', 'basic_salary']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if record already exists
        existing = PayrollRecord.query.filter_by(
            payroll_period_id=data['payroll_period_id'],
            employee_id=data['employee_id']
        ).first()
        
        if existing:
            return jsonify({'error': 'Payroll record already exists for this employee in this period'}), 409
        
        gross_salary = Decimal(str(data.get('basic_salary', 0))) + Decimal(str(data.get('allowances', 0))) + \
                       Decimal(str(data.get('overtime_amount', 0))) + Decimal(str(data.get('bonus', 0))) + \
                       Decimal(str(data.get('commission', 0)))
        
        total_deductions = Decimal(str(data.get('tax_deduction', 0))) + Decimal(str(data.get('insurance_deduction', 0))) + \
                           Decimal(str(data.get('pension_deduction', 0))) + Decimal(str(data.get('loan_deduction', 0))) + \
                           Decimal(str(data.get('other_deductions', 0)))
        
        record = PayrollRecord(
            payroll_period_id=data['payroll_period_id'],
            employee_id=data['employee_id'],
            basic_salary=Decimal(str(data.get('basic_salary', 0))),
            allowances=Decimal(str(data.get('allowances', 0))),
            overtime_amount=Decimal(str(data.get('overtime_amount', 0))),
            bonus=Decimal(str(data.get('bonus', 0))),
            commission=Decimal(str(data.get('commission', 0))),
            gross_salary=gross_salary,
            tax_deduction=Decimal(str(data.get('tax_deduction', 0))),
            insurance_deduction=Decimal(str(data.get('insurance_deduction', 0))),
            pension_deduction=Decimal(str(data.get('pension_deduction', 0))),
            loan_deduction=Decimal(str(data.get('loan_deduction', 0))),
            other_deductions=Decimal(str(data.get('other_deductions', 0))),
            total_deductions=total_deductions,
            net_salary=gross_salary - total_deductions,
            total_working_days=data.get('total_working_days', 0),
            days_worked=data.get('days_worked', 0),
            days_absent=data.get('days_absent', 0),
            overtime_hours=Decimal(str(data.get('overtime_hours', 0))),
            status=data.get('status', 'calculated'),
            payment_method=data.get('payment_method'),
            payment_date=datetime.fromisoformat(data['payment_date']).date() if data.get('payment_date') else None,
            notes=data.get('notes')
        )
        
        db.session.add(record)
        db.session.commit()
        
        return jsonify({
            'message': 'Payroll record created successfully',
            'id': record.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_payroll_bp.route('/records/<int:record_id>', methods=['GET'])
@jwt_required()
def get_payroll_record(record_id):
    """Get individual payroll record"""
    try:
        r = PayrollRecord.query.get_or_404(record_id)
        
        return jsonify({
            'id': r.id,
            'payroll_period_id': r.payroll_period_id,
            'employee_id': r.employee_id,
            'basic_salary': float(r.basic_salary),
            'allowances': float(r.allowances),
            'overtime_amount': float(r.overtime_amount),
            'bonus': float(r.bonus) if r.bonus else 0,
            'commission': float(r.commission) if r.commission else 0,
            'gross_salary': float(r.gross_salary),
            'tax_deduction': float(r.tax_deduction),
            'insurance_deduction': float(r.insurance_deduction),
            'pension_deduction': float(r.pension_deduction) if r.pension_deduction else 0,
            'loan_deduction': float(r.loan_deduction) if r.loan_deduction else 0,
            'other_deductions': float(r.other_deductions) if r.other_deductions else 0,
            'total_deductions': float(r.total_deductions),
            'net_salary': float(r.net_salary),
            'total_working_days': r.total_working_days,
            'days_worked': r.days_worked,
            'days_absent': r.days_absent,
            'overtime_hours': float(r.overtime_hours),
            'late_hours': float(r.late_hours) if r.late_hours else 0,
            'status': r.status,
            'payment_date': r.payment_date.isoformat() if r.payment_date else None,
            'payment_method': r.payment_method,
            'notes': r.notes
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_payroll_bp.route('/records/<int:record_id>', methods=['PUT'])
@jwt_required()
def update_payroll_record(record_id):
    """Update individual payroll record"""
    try:
        record = PayrollRecord.query.get_or_404(record_id)
        data = request.get_json()
        
        if record.status == 'paid':
            return jsonify({'error': 'Cannot edit a paid payroll record'}), 400
        
        # Update fields
        for field in ['basic_salary', 'allowances', 'overtime_amount', 'bonus', 'commission',
                      'tax_deduction', 'insurance_deduction', 'pension_deduction', 'loan_deduction',
                      'other_deductions']:
            if field in data:
                setattr(record, field, Decimal(str(data[field])))
        
        for field in ['total_working_days', 'days_worked', 'days_absent']:
            if field in data:
                setattr(record, field, data[field])
        
        if 'overtime_hours' in data:
            record.overtime_hours = Decimal(str(data['overtime_hours']))
        if 'status' in data:
            record.status = data['status']
        if 'payment_method' in data:
            record.payment_method = data['payment_method']
        if 'payment_date' in data:
            record.payment_date = datetime.fromisoformat(data['payment_date']).date() if data['payment_date'] else None
        if 'notes' in data:
            record.notes = data['notes']
        
        # Recalculate totals
        record.gross_salary = record.basic_salary + record.allowances + record.overtime_amount + \
                              (record.bonus or 0) + (record.commission or 0)
        record.total_deductions = record.tax_deduction + record.insurance_deduction + \
                                  (record.pension_deduction or 0) + (record.loan_deduction or 0) + \
                                  (record.other_deductions or 0)
        record.net_salary = record.gross_salary - record.total_deductions
        
        db.session.commit()
        
        return jsonify({'message': 'Payroll record updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_payroll_bp.route('/records/<int:record_id>/approve', methods=['POST'])
@jwt_required()
def approve_payroll_record(record_id):
    """Approve individual payroll record"""
    try:
        record = PayrollRecord.query.get_or_404(record_id)
        
        record.status = 'approved'
        db.session.commit()
        
        return jsonify(success_response('api.success'))
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_payroll_bp.route('/records/<int:record_id>/pay', methods=['POST'])
@jwt_required()
def mark_payroll_paid(record_id):
    """Mark payroll record as paid"""
    try:
        data = request.get_json() or {}
        record = PayrollRecord.query.get_or_404(record_id)
        
        record.status = 'paid'
        record.payment_date = get_local_today()
        record.payment_method = data.get('payment_method', 'bank_transfer')
        
        db.session.commit()
        
        return jsonify(success_response('api.success'))
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_payroll_bp.route('/records/<int:record_id>/payslip', methods=['GET'])
@jwt_required()
def get_payslip(record_id):
    """Get detailed payslip data for a payroll record"""
    try:
        r = PayrollRecord.query.get_or_404(record_id)
        period = r.period
        employee = r.employee
        
        # Calculate absence deduction from stored data
        absence_deduction = Decimal('0')
        if r.days_absent and r.days_absent > 0 and r.total_working_days and r.total_working_days > 0:
            daily_rate = r.basic_salary / Decimal(str(r.total_working_days))
            absence_deduction = daily_rate * Decimal(str(r.days_absent))
        
        # Get employee salary components for detail
        components = EmployeeSalaryComponent.query.filter_by(
            employee_id=employee.id,
            is_active=True
        ).join(SalaryComponent).all()
        
        earning_components = []
        deduction_components = []
        for comp in components:
            item = {
                'name': comp.salary_component.name,
                'type': comp.salary_component.component_type,
                'calculation_type': comp.salary_component.calculation_type,
                'amount': float(comp.amount)
            }
            if comp.salary_component.component_type == 'earning':
                earning_components.append(item)
            else:
                deduction_components.append(item)
        
        return jsonify({
            'id': r.id,
            'period': {
                'id': period.id,
                'period_name': period.period_name,
                'start_date': period.start_date.isoformat(),
                'end_date': period.end_date.isoformat(),
                'status': period.status
            },
            'employee': {
                'id': employee.id,
                'employee_number': employee.employee_number,
                'full_name': employee.full_name,
                'department': employee.department.name if employee.department else None,
                'position': employee.position if hasattr(employee, 'position') else None
            },
            'basic_salary': float(r.basic_salary),
            'allowances': float(r.allowances),
            'overtime_amount': float(r.overtime_amount),
            'bonus': float(r.bonus) if r.bonus else 0,
            'commission': float(r.commission) if r.commission else 0,
            'gross_salary': float(r.gross_salary),
            'tax_deduction': float(r.tax_deduction),
            'insurance_deduction': float(r.insurance_deduction),
            'pension_deduction': float(r.pension_deduction) if r.pension_deduction else 0,
            'loan_deduction': float(r.loan_deduction) if r.loan_deduction else 0,
            'other_deductions': float(r.other_deductions) if r.other_deductions else 0,
            'absence_deduction': float(absence_deduction),
            'total_deductions': float(r.total_deductions),
            'net_salary': float(r.net_salary),
            'total_working_days': r.total_working_days,
            'days_worked': r.days_worked,
            'days_absent': r.days_absent,
            'overtime_hours': float(r.overtime_hours),
            'late_hours': float(r.late_hours) if r.late_hours else 0,
            'status': r.status,
            'payment_date': r.payment_date.isoformat() if r.payment_date else None,
            'payment_method': r.payment_method,
            'notes': r.notes,
            'earning_components': earning_components,
            'deduction_components': deduction_components
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===============================
# SALARY COMPONENTS
# ===============================

@hr_payroll_bp.route('/salary-components', methods=['GET'])
@jwt_required()
def get_salary_components():
    """Get all salary components"""
    try:
        components = SalaryComponent.query.filter_by(is_active=True).all()
        
        return jsonify({
            'components': [{
                'id': c.id,
                'name': c.name,
                'component_type': c.component_type,
                'calculation_type': c.calculation_type,
                'is_taxable': c.is_taxable,
                'description': c.description
            } for c in components]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_payroll_bp.route('/salary-components', methods=['POST'])
@jwt_required()
def create_salary_component():
    """Create new salary component"""
    try:
        data = request.get_json()
        
        required_fields = ['name', 'component_type', 'calculation_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        component = SalaryComponent(
            name=data['name'],
            component_type=data['component_type'],
            calculation_type=data['calculation_type'],
            is_taxable=data.get('is_taxable', True),
            description=data.get('description')
        )
        
        db.session.add(component)
        db.session.commit()
        
        return jsonify({
            'message': 'Salary component created successfully',
            'component': {
                'id': component.id,
                'name': component.name,
                'component_type': component.component_type,
                'calculation_type': component.calculation_type
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_payroll_bp.route('/employees/<int:employee_id>/salary-components', methods=['GET'])
@jwt_required()
def get_employee_salary_components_route(employee_id):
    """Get salary components for specific employee"""
    try:
        components = EmployeeSalaryComponent.query.filter_by(
            employee_id=employee_id,
            is_active=True
        ).join(SalaryComponent).all()
        
        return jsonify({
            'components': [{
                'id': c.id,
                'salary_component': {
                    'id': c.salary_component.id,
                    'name': c.salary_component.name,
                    'component_type': c.salary_component.component_type,
                    'calculation_type': c.salary_component.calculation_type
                },
                'amount': float(c.amount),
                'effective_from': c.effective_from.isoformat(),
                'effective_to': c.effective_to.isoformat() if c.effective_to else None
            } for c in components]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_payroll_bp.route('/employees/<int:employee_id>/salary-components', methods=['POST'])
@jwt_required()
def assign_salary_component():
    """Assign salary component to employee"""
    try:
        data = request.get_json()
        employee_id = request.view_args['employee_id']
        
        required_fields = ['salary_component_id', 'amount', 'effective_from']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Deactivate existing component of same type if exists
        existing = EmployeeSalaryComponent.query.filter_by(
            employee_id=employee_id,
            salary_component_id=data['salary_component_id'],
            is_active=True
        ).first()
        
        if existing:
            existing.is_active = False
            existing.effective_to = datetime.fromisoformat(data['effective_from']).date()
        
        # Create new component assignment
        component = EmployeeSalaryComponent(
            employee_id=employee_id,
            salary_component_id=data['salary_component_id'],
            amount=Decimal(str(data['amount'])),
            effective_from=datetime.fromisoformat(data['effective_from']).date(),
            effective_to=datetime.fromisoformat(data['effective_to']).date() if data.get('effective_to') else None
        )
        
        db.session.add(component)
        db.session.commit()
        
        return jsonify({
            'message': 'Salary component assigned successfully',
            'component': {
                'id': component.id,
                'amount': float(component.amount),
                'effective_from': component.effective_from.isoformat()
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ===============================
# OUTSOURCING VENDORS
# ===============================

from models import OutsourcingVendor

@hr_payroll_bp.route('/outsourcing-vendors', methods=['GET'])
@jwt_required()
def get_outsourcing_vendors():
    """Get all outsourcing vendors"""
    try:
        vendors = OutsourcingVendor.query.filter_by(is_active=True).order_by(OutsourcingVendor.name).all()
        return jsonify({'vendors': [v.to_dict() for v in vendors]})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_payroll_bp.route('/outsourcing-vendors', methods=['POST'])
@jwt_required()
def create_outsourcing_vendor():
    """Create outsourcing vendor"""
    try:
        data = request.get_json()
        if not data.get('name'):
            return jsonify({'error': 'Nama vendor wajib diisi'}), 400
        
        code = data.get('code') or generate_number('OV')
        if OutsourcingVendor.query.filter_by(code=code).first():
            return jsonify({'error': f'Kode {code} sudah digunakan'}), 400
        
        vendor = OutsourcingVendor(
            code=code,
            name=data['name'],
            contact_person=data.get('contact_person'),
            phone=data.get('phone'),
            email=data.get('email'),
            address=data.get('address'),
            bank_name=data.get('bank_name'),
            bank_account_number=data.get('bank_account_number'),
            bank_account_name=data.get('bank_account_name'),
            management_fee_percent=data.get('management_fee_percent', 0),
            contract_start=datetime.strptime(data['contract_start'], '%Y-%m-%d').date() if data.get('contract_start') else None,
            contract_end=datetime.strptime(data['contract_end'], '%Y-%m-%d').date() if data.get('contract_end') else None,
            notes=data.get('notes')
        )
        db.session.add(vendor)
        db.session.commit()
        return jsonify({'message': 'Vendor outsourcing berhasil ditambahkan', 'vendor': vendor.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_payroll_bp.route('/outsourcing-vendors/<int:vendor_id>', methods=['GET'])
@jwt_required()
def get_outsourcing_vendor(vendor_id):
    """Get single outsourcing vendor"""
    try:
        vendor = OutsourcingVendor.query.get_or_404(vendor_id)
        result = vendor.to_dict()
        # Include employees under this vendor
        result['employees'] = [{
            'id': e.id,
            'employee_number': e.employee_number,
            'full_name': e.full_name,
            'position': e.position,
            'salary': float(e.salary) if e.salary else 0
        } for e in vendor.employees if e.is_active]
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_payroll_bp.route('/outsourcing-vendors/<int:vendor_id>', methods=['PUT'])
@jwt_required()
def update_outsourcing_vendor(vendor_id):
    """Update outsourcing vendor"""
    try:
        vendor = OutsourcingVendor.query.get_or_404(vendor_id)
        data = request.get_json()
        
        for field in ['name', 'contact_person', 'phone', 'email', 'address',
                       'bank_name', 'bank_account_number', 'bank_account_name',
                       'management_fee_percent', 'notes', 'is_active']:
            if field in data:
                setattr(vendor, field, data[field])
        
        if 'contract_start' in data:
            vendor.contract_start = datetime.strptime(data['contract_start'], '%Y-%m-%d').date() if data['contract_start'] else None
        if 'contract_end' in data:
            vendor.contract_end = datetime.strptime(data['contract_end'], '%Y-%m-%d').date() if data['contract_end'] else None
        
        db.session.commit()
        return jsonify({'message': 'Vendor berhasil diupdate', 'vendor': vendor.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ===============================
# PIECEWORK LOGS (BORONGAN)
# ===============================

@hr_payroll_bp.route('/piecework-logs', methods=['GET'])
@jwt_required()
def get_piecework_logs():
    """Get piecework logs with filters"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        employee_id = request.args.get('employee_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        status = request.args.get('status')
        
        query = PieceworkLog.query
        
        if employee_id:
            query = query.filter_by(employee_id=employee_id)
        if start_date:
            query = query.filter(PieceworkLog.work_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
        if end_date:
            query = query.filter(PieceworkLog.work_date <= datetime.strptime(end_date, '%Y-%m-%d').date())
        if status:
            query = query.filter_by(status=status)
        
        logs = query.order_by(PieceworkLog.work_date.desc()).paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'logs': [l.to_dict() for l in logs.items],
            'total': logs.total,
            'pages': logs.pages,
            'current_page': logs.page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_payroll_bp.route('/piecework-logs', methods=['POST'])
@jwt_required()
def create_piecework_log():
    """Create piecework log entry"""
    try:
        data = request.get_json()
        
        required = ['employee_id', 'work_date', 'quantity', 'rate_per_unit']
        for field in required:
            if field not in data:
                return jsonify({'error': f'{field} wajib diisi'}), 400
        
        # Verify employee is piecework type
        employee = Employee.query.get(data['employee_id'])
        if not employee:
            return jsonify({'error': 'Karyawan tidak ditemukan'}), 404
        
        quantity = Decimal(str(data['quantity']))
        rate = Decimal(str(data['rate_per_unit']))
        total = (quantity * rate).quantize(Decimal('1'))
        
        log = PieceworkLog(
            employee_id=data['employee_id'],
            work_date=datetime.strptime(data['work_date'], '%Y-%m-%d').date(),
            description=data.get('description'),
            quantity=quantity,
            unit=data.get('unit', 'pcs'),
            rate_per_unit=rate,
            total_amount=total,
            work_order_id=data.get('work_order_id'),
            notes=data.get('notes')
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({'message': 'Log borongan berhasil ditambahkan', 'log': log.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_payroll_bp.route('/piecework-logs/<int:log_id>', methods=['PUT'])
@jwt_required()
def update_piecework_log(log_id):
    """Update piecework log"""
    try:
        log = PieceworkLog.query.get_or_404(log_id)
        data = request.get_json()
        
        if 'quantity' in data or 'rate_per_unit' in data:
            qty = Decimal(str(data.get('quantity', log.quantity)))
            rate = Decimal(str(data.get('rate_per_unit', log.rate_per_unit)))
            log.quantity = qty
            log.rate_per_unit = rate
            log.total_amount = (qty * rate).quantize(Decimal('1'))
        
        for field in ['description', 'unit', 'work_order_id', 'notes']:
            if field in data:
                setattr(log, field, data[field])
        
        if 'work_date' in data:
            log.work_date = datetime.strptime(data['work_date'], '%Y-%m-%d').date()
        
        db.session.commit()
        return jsonify({'message': 'Log borongan berhasil diupdate', 'log': log.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_payroll_bp.route('/piecework-logs/<int:log_id>/verify', methods=['POST'])
@jwt_required()
def verify_piecework_log(log_id):
    """Verify/approve piecework log"""
    try:
        log = PieceworkLog.query.get_or_404(log_id)
        data = request.get_json() or {}
        
        action = data.get('action', 'verify')  # verify or reject
        
        if action == 'verify':
            log.status = 'verified'
        elif action == 'reject':
            log.status = 'rejected'
            log.notes = data.get('reason', log.notes)
        
        log.verified_by = int(get_jwt_identity())
        log.verified_at = datetime.utcnow()
        
        db.session.commit()
        return jsonify({'message': f'Log borongan {log.status}', 'log': log.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_payroll_bp.route('/piecework-logs/bulk', methods=['POST'])
@jwt_required()
def bulk_create_piecework_logs():
    """Bulk create piecework logs for multiple entries"""
    try:
        data = request.get_json()
        logs_data = data.get('logs', [])
        
        if not logs_data:
            return jsonify({'error': 'Data log kosong'}), 400
        
        created = []
        for item in logs_data:
            quantity = Decimal(str(item['quantity']))
            rate = Decimal(str(item['rate_per_unit']))
            total = (quantity * rate).quantize(Decimal('1'))
            
            log = PieceworkLog(
                employee_id=item['employee_id'],
                work_date=datetime.strptime(item['work_date'], '%Y-%m-%d').date(),
                description=item.get('description'),
                quantity=quantity,
                unit=item.get('unit', 'pcs'),
                rate_per_unit=rate,
                total_amount=total,
                work_order_id=item.get('work_order_id'),
                notes=item.get('notes')
            )
            db.session.add(log)
            created.append(log)
        
        db.session.commit()
        return jsonify({
            'message': f'{len(created)} log borongan berhasil ditambahkan',
            'count': len(created)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
