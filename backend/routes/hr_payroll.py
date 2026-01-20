from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Employee, PayrollPeriod, PayrollRecord, SalaryComponent, EmployeeSalaryComponent, Attendance
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

@hr_payroll_bp.route('/periods/<int:period_id>/calculate', methods=['POST'])
@jwt_required()
def calculate_payroll(period_id):
    """Calculate payroll for all employees in a period"""
    try:
        period = PayrollPeriod.query.get_or_404(period_id)
        
        if period.status != 'draft':
            return jsonify(error_response('api.error', error_code=400)), 400
        
        # Get all active employees
        employees = Employee.query.filter_by(is_active=True, status='active').all()
        
        total_gross = Decimal('0')
        total_deductions = Decimal('0')
        total_net = Decimal('0')
        
        for employee in employees:
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
        
        # Update period totals
        period.total_employees = len(employees)
        period.total_gross_salary = total_gross
        period.total_deductions = total_deductions
        period.total_net_salary = total_net
        period.status = 'processing'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Payroll calculated successfully',
            'summary': {
                'total_employees': len(employees),
                'total_gross_salary': float(total_gross),
                'total_deductions': float(total_deductions),
                'total_net_salary': float(total_net)
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def calculate_employee_attendance(employee_id, start_date, end_date):
    """Calculate attendance data for employee in period"""
    attendances = Attendance.query.filter(
        and_(
            Attendance.employee_id == employee_id,
            Attendance.attendance_date >= start_date,
            Attendance.attendance_date <= end_date
        )
    ).all()
    
    total_days = (end_date - start_date).days + 1
    days_worked = len([a for a in attendances if a.status == 'present'])
    days_absent = len([a for a in attendances if a.status == 'absent'])
    total_overtime_hours = sum([float(a.overtime_hours) for a in attendances])
    
    return {
        'total_working_days': total_days,
        'days_worked': days_worked,
        'days_absent': days_absent,
        'overtime_hours': total_overtime_hours
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

def calculate_employee_payroll(employee, period, attendance_data, salary_components):
    """Calculate individual employee payroll"""
    # Basic salary calculation
    basic_salary = Decimal(str(employee.salary or 0))
    
    # Calculate allowances and other earnings
    allowances = Decimal('0')
    for comp in salary_components:
        if comp.salary_component.component_type == 'earning':
            allowances += Decimal(str(comp.amount))
    
    # Calculate overtime
    overtime_rate = basic_salary / Decimal('160')  # Assuming 160 hours per month
    overtime_amount = overtime_rate * Decimal(str(attendance_data['overtime_hours']))
    
    # Gross salary
    gross_salary = basic_salary + allowances + overtime_amount
    
    # Calculate deductions
    tax_deduction = gross_salary * Decimal('0.10')  # 10% tax
    insurance_deduction = gross_salary * Decimal('0.02')  # 2% insurance
    
    total_deductions = tax_deduction + insurance_deduction
    
    # Net salary
    net_salary = gross_salary - total_deductions
    
    # Create or update payroll record
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
    record.tax_deduction = tax_deduction
    record.insurance_deduction = insurance_deduction
    record.total_deductions = total_deductions
    record.net_salary = net_salary
    record.total_working_days = attendance_data['total_working_days']
    record.days_worked = attendance_data['days_worked']
    record.days_absent = attendance_data['days_absent']
    record.overtime_hours = Decimal(str(attendance_data['overtime_hours']))
    
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
                    'department': r.employee.department.name if r.employee.department else None
                },
                'basic_salary': float(r.basic_salary),
                'allowances': float(r.allowances),
                'overtime_amount': float(r.overtime_amount),
                'gross_salary': float(r.gross_salary),
                'total_deductions': float(r.total_deductions),
                'net_salary': float(r.net_salary),
                'days_worked': r.days_worked,
                'days_absent': r.days_absent,
                'overtime_hours': float(r.overtime_hours),
                'status': r.status,
                'payment_date': r.payment_date.isoformat() if r.payment_date else None
            } for r in records.items],
            'total': records.total,
            'pages': records.pages,
            'current_page': records.page
        })
    except Exception as e:
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
        data = request.get_json()
        record = PayrollRecord.query.get_or_404(record_id)
        
        record.status = 'paid'
        record.payment_date = get_local_today()
        record.payment_method = data.get('payment_method', 'bank_transfer')
        
        db.session.commit()
        
        return jsonify(success_response('api.success'))
    except Exception as e:
        db.session.rollback()
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
