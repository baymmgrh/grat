"""
Comprehensive Work Roster API Routes
Handles:
- Work Roster CRUD (WEEKLY based with shifts)
- Role assignments (Leader, Operator, QC, Maintenance, Packing, etc.)
- Machine-based assignments per shift
- Employee skill management
- Roster templates
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from models import db
from models.hr_extended import WorkRoster, WorkRosterAssignment, EmployeeSkill, RosterTemplate
from models.hr import Employee, Department
from models.production import Machine
from utils.timezone import get_local_now, get_local_today

work_roster_bp = Blueprint('work_roster', __name__)

# Helper to get week start (Monday) and end (Sunday) dates
def get_week_dates(date):
    """Get Monday and Sunday of the week containing the given date"""
    if isinstance(date, str):
        date = datetime.fromisoformat(date).date()
    # Monday is 0, Sunday is 6
    monday = date - timedelta(days=date.weekday())
    sunday = monday + timedelta(days=6)
    return monday, sunday

def get_week_number(date):
    """Get ISO week number and year"""
    if isinstance(date, str):
        date = datetime.fromisoformat(date).date()
    return date.isocalendar()[1], date.isocalendar()[0]

# Role definitions with display names and whether they require machine assignment
# Machine-based roles (per mesin produksi): Operator, Helper, Checker, Infeeding, Timbang Box
ROSTER_ROLES_MACHINE = {
    'operator': {'name': 'Operator', 'requires_machine': True, 'color': '#3B82F6', 'order': 1},
    'helper': {'name': 'Helper', 'requires_machine': True, 'color': '#6B7280', 'order': 2},
    'checker': {'name': 'Checker', 'requires_machine': True, 'color': '#F59E0B', 'order': 3},
    'infeeding': {'name': 'Infeeding', 'requires_machine': True, 'color': '#8B5CF6', 'order': 4},
    'timbang_box': {'name': 'Timbang Box', 'requires_machine': True, 'color': '#EC4899', 'order': 5},
}

# Packing Manual Lines (5 lines with product per line)
PACKING_LINES = [
    {'id': 'packing_line_1', 'name': 'Packing Line 1', 'color': '#EC4899'},
    {'id': 'packing_line_2', 'name': 'Packing Line 2', 'color': '#DB2777'},
    {'id': 'packing_line_3', 'name': 'Packing Line 3', 'color': '#BE185D'},
    {'id': 'packing_line_4', 'name': 'Packing Line 4', 'color': '#9D174D'},
    {'id': 'packing_line_5', 'name': 'Packing Line 5', 'color': '#831843'},
]

# General roles (manual input, not tied to production machines)
ROSTER_ROLES_GENERAL = {
    'packing_line_1': {'name': 'Packing Line 1', 'requires_machine': False, 'color': '#EC4899', 'order': 1, 'has_product': True},
    'packing_line_2': {'name': 'Packing Line 2', 'requires_machine': False, 'color': '#DB2777', 'order': 2, 'has_product': True},
    'packing_line_3': {'name': 'Packing Line 3', 'requires_machine': False, 'color': '#BE185D', 'order': 3, 'has_product': True},
    'packing_line_4': {'name': 'Packing Line 4', 'requires_machine': False, 'color': '#9D174D', 'order': 4, 'has_product': True},
    'packing_line_5': {'name': 'Packing Line 5', 'requires_machine': False, 'color': '#831843', 'order': 5, 'has_product': True},
    'qc_ipc': {'name': 'QC IPC', 'requires_machine': False, 'color': '#10B981', 'order': 6},
    'qc_fg': {'name': 'QC Finish Goods', 'requires_machine': False, 'color': '#059669', 'order': 7},
    'distribusi': {'name': 'Distribusi', 'requires_machine': False, 'color': '#6366F1', 'order': 8, 'has_machine_ref': True},
}

# Special machines that appear in roster (Bag Maker, Inkjet, Fliptop)
SPECIAL_MACHINES = [
    {'id': -1, 'name': 'Mesin Bag Maker', 'code': 'BAG'},
    {'id': -2, 'name': 'Mesin Inkjet', 'code': 'INK'},
    {'id': -3, 'name': 'Mesin Fliptop', 'code': 'FLP'},
]

# Combined for backward compatibility
ROSTER_ROLES = {**ROSTER_ROLES_MACHINE, **ROSTER_ROLES_GENERAL}


# ===========================
# WORK ROSTER CRUD
# ===========================

@work_roster_bp.route('/rosters', methods=['GET'])
@jwt_required()
def get_work_rosters():
    """Get weekly work rosters with optional filters"""
    try:
        # Filters
        year = request.args.get('year', type=int)
        week = request.args.get('week', type=int)
        status = request.args.get('status')
        
        query = WorkRoster.query
        
        if year:
            query = query.filter(WorkRoster.year == year)
        if week:
            query = query.filter(WorkRoster.week_number == week)
        if status:
            query = query.filter(WorkRoster.status == status)
        
        rosters = query.order_by(WorkRoster.year.desc(), WorkRoster.week_number.desc()).all()
        
        return jsonify({
            'success': True,
            'rosters': [{
                'id': r.id,
                'year': r.year,
                'week_number': r.week_number,
                'week_start_date': r.week_start_date.isoformat() if r.week_start_date else None,
                'week_end_date': r.week_end_date.isoformat() if r.week_end_date else None,
                'leader_shift_1': r.leader_shift_1.full_name if r.leader_shift_1 else None,
                'leader_shift_2': r.leader_shift_2.full_name if r.leader_shift_2 else None,
                'leader_shift_3': r.leader_shift_3.full_name if r.leader_shift_3 else None,
                'status': r.status,
                'notes': r.notes,
                'assignment_count': len(r.assignments),
                'created_at': r.created_at.isoformat() if r.created_at else None
            } for r in rosters]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@work_roster_bp.route('/rosters/<int:id>', methods=['GET'])
@jwt_required()
def get_work_roster(id):
    """Get single weekly work roster with all assignments grouped by shift"""
    try:
        roster = WorkRoster.query.get(id)
        if not roster:
            return jsonify({'success': False, 'error': 'Roster not found'}), 404
        
        # Group assignments by shift, then by role
        assignments_by_shift = {
            'shift_1': {},
            'shift_2': {},
            'shift_3': {}
        }
        
        for shift in ['shift_1', 'shift_2', 'shift_3']:
            for role_key in ROSTER_ROLES.keys():
                assignments_by_shift[shift][role_key] = []
        
        for a in roster.assignments:
            shift = a.shift or 'shift_1'
            if shift in assignments_by_shift and a.role in assignments_by_shift[shift]:
                assignments_by_shift[shift][a.role].append({
                    'id': a.id,
                    'employee_id': a.employee_id,
                    'employee_name': a.employee.full_name if a.employee else None,
                    'employee_number': a.employee.employee_number if a.employee else None,
                    'machine_id': a.machine_id,
                    'machine_name': a.machine.name if a.machine else None,
                    'position': a.position,
                    'is_backup': a.is_backup,
                    'status': a.status,
                    'notes': a.notes
                })
        
        return jsonify({
            'success': True,
            'roster': {
                'id': roster.id,
                'year': roster.year,
                'week_number': roster.week_number,
                'week_start_date': roster.week_start_date.isoformat() if roster.week_start_date else None,
                'week_end_date': roster.week_end_date.isoformat() if roster.week_end_date else None,
                'leader_shift_1_id': roster.leader_shift_1_id,
                'leader_shift_1_name': roster.leader_shift_1.full_name if roster.leader_shift_1 else None,
                'leader_shift_2_id': roster.leader_shift_2_id,
                'leader_shift_2_name': roster.leader_shift_2.full_name if roster.leader_shift_2 else None,
                'leader_shift_3_id': roster.leader_shift_3_id,
                'leader_shift_3_name': roster.leader_shift_3.full_name if roster.leader_shift_3 else None,
                'status': roster.status,
                'notes': roster.notes,
                'assignments': assignments_by_shift,
                'created_by': roster.created_by_user.username if roster.created_by_user else None,
                'approved_by': roster.approved_by_user.username if roster.approved_by_user else None,
                'approved_at': roster.approved_at.isoformat() if roster.approved_at else None,
                'created_at': roster.created_at.isoformat() if roster.created_at else None,
                'updated_at': roster.updated_at.isoformat() if roster.updated_at else None
            },
            'role_definitions': ROSTER_ROLES
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@work_roster_bp.route('/rosters/by-week', methods=['GET'])
@jwt_required()
def get_roster_by_week():
    """Get roster for a specific week (by date or week number)"""
    try:
        date_str = request.args.get('date')
        year = request.args.get('year', type=int)
        week = request.args.get('week', type=int)
        
        # Determine week from date or week number
        if date_str:
            input_date = datetime.fromisoformat(date_str).date()
            week_number, year = get_week_number(input_date)
        elif year and week:
            week_number = week
        else:
            # Default to current week
            today = get_local_now().date()
            week_number, year = get_week_number(today)
        
        roster = WorkRoster.query.filter_by(
            year=year,
            week_number=week_number
        ).first()
        
        # Calculate week start/end from year and week number using ISO format
        try:
            # ISO week date format: %G = ISO year, %V = ISO week, %u = ISO weekday (1=Monday)
            week_start_dt = datetime.strptime(f'{year}-W{week_number:02d}-1', '%G-W%V-%u')
            week_start = week_start_dt.date()
            week_end = week_start + timedelta(days=6)
        except ValueError:
            # Fallback for edge cases
            from datetime import date
            jan4 = date(year, 1, 4)
            start_of_week1 = jan4 - timedelta(days=jan4.weekday())
            week_start = start_of_week1 + timedelta(weeks=week_number - 1)
            week_end = week_start + timedelta(days=6)
        
        if not roster:
            # Return empty structure for new roster
            return jsonify({
                'success': True,
                'roster': None,
                'week_info': {
                    'year': year,
                    'week_number': week_number,
                    'week_start_date': week_start.isoformat(),
                    'week_end_date': week_end.isoformat()
                },
                'role_definitions': ROSTER_ROLES
            }), 200
        
        # Get full roster data grouped by shift
        assignments_by_shift = {'shift_1': {}, 'shift_2': {}, 'shift_3': {}}
        for shift in ['shift_1', 'shift_2', 'shift_3']:
            for role_key in ROSTER_ROLES.keys():
                assignments_by_shift[shift][role_key] = []
        
        for a in roster.assignments:
            shift = a.shift or 'shift_1'
            if shift in assignments_by_shift and a.role in assignments_by_shift[shift]:
                assignments_by_shift[shift][a.role].append({
                    'id': a.id,
                    'employee_id': a.employee_id,
                    'employee_name': a.employee.full_name if a.employee else None,
                    'employee_number': a.employee.employee_number if a.employee else None,
                    'machine_id': a.machine_id,
                    'machine_name': a.machine.name if a.machine else None,
                    'position': a.position,
                    'is_backup': a.is_backup,
                    'status': a.status,
                    'notes': a.notes
                })
        
        return jsonify({
            'success': True,
            'roster': {
                'id': roster.id,
                'year': roster.year,
                'week_number': roster.week_number,
                'week_start_date': roster.week_start_date.isoformat() if roster.week_start_date else None,
                'week_end_date': roster.week_end_date.isoformat() if roster.week_end_date else None,
                'leader_shift_1_id': roster.leader_shift_1_id,
                'leader_shift_1_name': roster.leader_shift_1.full_name if roster.leader_shift_1 else None,
                'leader_shift_2_id': roster.leader_shift_2_id,
                'leader_shift_2_name': roster.leader_shift_2.full_name if roster.leader_shift_2 else None,
                'leader_shift_3_id': roster.leader_shift_3_id,
                'leader_shift_3_name': roster.leader_shift_3.full_name if roster.leader_shift_3 else None,
                'status': roster.status,
                'notes': roster.notes,
                'assignments': assignments_by_shift
            },
            'role_definitions': ROSTER_ROLES
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@work_roster_bp.route('/rosters', methods=['POST'])
@jwt_required()
def create_work_roster():
    """Create a new weekly work roster with assignments per shift"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Get week info from date or week number
        if 'date' in data:
            input_date = datetime.fromisoformat(data['date']).date()
            week_number, year = get_week_number(input_date)
        else:
            year = data.get('year', get_local_now().year)
            week_number = data.get('week_number', get_local_now().isocalendar()[1])
        
        week_start, week_end = get_week_dates(datetime.strptime(f'{year}-W{week_number:02d}-1', '%Y-W%W-%w').date())
        
        # Check if roster already exists for this week
        existing = WorkRoster.query.filter_by(
            year=year,
            week_number=week_number
        ).first()
        
        if existing:
            return jsonify({
                'success': False, 
                'error': f'Roster untuk minggu ke-{week_number} tahun {year} sudah ada'
            }), 400
        
        # Create roster
        roster = WorkRoster(
            year=year,
            week_number=week_number,
            week_start_date=week_start,
            week_end_date=week_end,
            leader_shift_1_id=data.get('leader_shift_1_id'),
            leader_shift_2_id=data.get('leader_shift_2_id'),
            leader_shift_3_id=data.get('leader_shift_3_id'),
            status=data.get('status', 'draft'),
            notes=data.get('notes'),
            created_by=int(user_id)
        )
        db.session.add(roster)
        db.session.flush()
        
        # Add assignments (grouped by shift, then by role)
        # Format: { 'shift_1': { 'operator': [...], 'qc': [...] }, 'shift_2': {...} }
        assignments = data.get('assignments', {})
        for shift, shift_assignments in assignments.items():
            if isinstance(shift_assignments, dict):
                for role, role_assignments in shift_assignments.items():
                    for idx, assignment in enumerate(role_assignments):
                        new_assignment = WorkRosterAssignment(
                            roster_id=roster.id,
                            employee_id=assignment['employee_id'],
                            shift=shift,
                            role=role,
                            machine_id=assignment.get('machine_id'),
                            position=idx + 1,
                            is_backup=assignment.get('is_backup', False),
                            status='assigned',
                            notes=assignment.get('notes')
                        )
                        db.session.add(new_assignment)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Roster minggu ke-{week_number} berhasil dibuat',
            'roster_id': roster.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@work_roster_bp.route('/rosters/<int:id>', methods=['PUT'])
@jwt_required()
def update_work_roster(id):
    """Update weekly work roster and assignments"""
    try:
        user_id = get_jwt_identity()
        roster = WorkRoster.query.get(id)
        
        if not roster:
            return jsonify({'success': False, 'error': 'Roster not found'}), 404
        
        data = request.get_json()
        
        # Update roster fields
        if 'leader_shift_1_id' in data:
            roster.leader_shift_1_id = data['leader_shift_1_id']
        if 'leader_shift_2_id' in data:
            roster.leader_shift_2_id = data['leader_shift_2_id']
        if 'leader_shift_3_id' in data:
            roster.leader_shift_3_id = data['leader_shift_3_id']
        if 'status' in data:
            roster.status = data['status']
            if data['status'] == 'published' and not roster.approved_at:
                roster.approved_by = int(user_id)
                roster.approved_at = get_local_now()
        if 'notes' in data:
            roster.notes = data['notes']
        
        # Update assignments if provided (grouped by shift, then by role)
        if 'assignments' in data:
            # Remove existing assignments
            WorkRosterAssignment.query.filter_by(roster_id=id).delete()
            
            # Add new assignments
            assignments = data['assignments']
            for shift, shift_assignments in assignments.items():
                if isinstance(shift_assignments, dict):
                    for role, role_assignments in shift_assignments.items():
                        for idx, assignment in enumerate(role_assignments):
                            new_assignment = WorkRosterAssignment(
                                roster_id=roster.id,
                                employee_id=assignment['employee_id'],
                                shift=shift,
                                role=role,
                                machine_id=assignment.get('machine_id'),
                                position=idx + 1,
                                is_backup=assignment.get('is_backup', False),
                                status=assignment.get('status', 'assigned'),
                                notes=assignment.get('notes')
                            )
                            db.session.add(new_assignment)
        
        roster.updated_at = get_local_now()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Roster berhasil diupdate'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@work_roster_bp.route('/rosters/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_work_roster(id):
    """Delete work roster"""
    try:
        roster = WorkRoster.query.get(id)
        if not roster:
            return jsonify({'success': False, 'error': 'Roster not found'}), 404
        
        if roster.status == 'published':
            return jsonify({
                'success': False, 
                'error': 'Cannot delete published roster'
            }), 400
        
        db.session.delete(roster)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Roster berhasil dihapus'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


# ===========================
# ROSTER CALENDAR VIEW
# ===========================

@work_roster_bp.route('/rosters/calendar', methods=['GET'])
@jwt_required()
def get_roster_calendar():
    """Get roster overview for calendar display"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            # Default to current month
            today = get_local_now().date()
            start_date = today.replace(day=1)
            end_date = (start_date + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        else:
            start_date = datetime.fromisoformat(start_date).date()
            end_date = datetime.fromisoformat(end_date).date()
        
        rosters = WorkRoster.query.filter(
            WorkRoster.roster_date >= start_date,
            WorkRoster.roster_date <= end_date
        ).order_by(WorkRoster.roster_date, WorkRoster.shift).all()
        
        # Get all machines for header
        machines = Machine.query.filter_by(is_active=True).order_by(Machine.name).all()
        
        # Build calendar data
        calendar_data = {}
        for roster in rosters:
            date_key = roster.roster_date.isoformat()
            if date_key not in calendar_data:
                calendar_data[date_key] = {}
            
            # Count assignments by role
            role_counts = {}
            machine_operators = {}
            
            for a in roster.assignments:
                if a.role not in role_counts:
                    role_counts[a.role] = 0
                role_counts[a.role] += 1
                
                # Track operators per machine
                if a.role == 'operator' and a.machine_id:
                    if a.machine_id not in machine_operators:
                        machine_operators[a.machine_id] = []
                    machine_operators[a.machine_id].append({
                        'employee_id': a.employee_id,
                        'employee_name': a.employee.full_name if a.employee else None
                    })
            
            calendar_data[date_key][roster.shift] = {
                'roster_id': roster.id,
                'status': roster.status,
                'leader_name': roster.leader.full_name if roster.leader else None,
                'role_counts': role_counts,
                'machine_operators': machine_operators,
                'total_assigned': len(roster.assignments)
            }
        
        return jsonify({
            'success': True,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'machines': [{
                'id': m.id,
                'name': m.name,
                'code': m.code
            } for m in machines],
            'calendar': calendar_data,
            'role_definitions': ROSTER_ROLES
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ===========================
# EMPLOYEE SELECTION
# ===========================

@work_roster_bp.route('/employees/available', methods=['GET'])
@jwt_required()
def get_available_employees():
    """Get employees available for roster assignment"""
    try:
        date_str = request.args.get('date')
        shift = request.args.get('shift')
        role = request.args.get('role')
        machine_id = request.args.get('machine_id')
        department_id = request.args.get('department_id')
        search = request.args.get('search', '')
        
        # Base query - active employees
        query = Employee.query.filter(
            Employee.is_active == True,
            Employee.status == 'active'
        )
        
        # Filter by department
        if department_id:
            query = query.filter(Employee.department_id == int(department_id))
        
        # Search by name or employee number
        if search:
            query = query.filter(
                db.or_(
                    Employee.full_name.ilike(f'%{search}%'),
                    Employee.employee_number.ilike(f'%{search}%')
                )
            )
        
        employees = query.order_by(Employee.full_name).all()
        
        # Check which employees are already assigned for this date/shift
        assigned_employee_ids = set()
        if date_str and shift:
            roster_date = datetime.fromisoformat(date_str).date()
            roster = WorkRoster.query.filter_by(
                roster_date=roster_date,
                shift=shift
            ).first()
            if roster:
                assigned_employee_ids = {a.employee_id for a in roster.assignments}
        
        # Get skill info if role/machine specified
        skill_employee_ids = set()
        if role and machine_id:
            skills = EmployeeSkill.query.filter_by(
                skill_type='machine_operation',
                machine_id=int(machine_id)
            ).all()
            skill_employee_ids = {s.employee_id for s in skills}
        
        result = []
        for emp in employees:
            emp_data = {
                'id': emp.id,
                'employee_number': emp.employee_number,
                'full_name': emp.full_name,
                'department': emp.department.name if emp.department else None,
                'position': emp.position,
                'is_assigned': emp.id in assigned_employee_ids,
                'has_skill': emp.id in skill_employee_ids if skill_employee_ids else True
            }
            result.append(emp_data)
        
        return jsonify({
            'success': True,
            'employees': result
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ===========================
# EMPLOYEE SKILLS
# ===========================

@work_roster_bp.route('/employees/<int:employee_id>/skills', methods=['GET'])
@jwt_required()
def get_employee_skills(employee_id):
    """Get skills for an employee"""
    try:
        skills = EmployeeSkill.query.filter_by(employee_id=employee_id).all()
        
        return jsonify({
            'success': True,
            'skills': [{
                'id': s.id,
                'skill_type': s.skill_type,
                'machine_id': s.machine_id,
                'machine_name': s.machine.name if s.machine else None,
                'proficiency_level': s.proficiency_level,
                'certified': s.certified,
                'certification_date': s.certification_date.isoformat() if s.certification_date else None,
                'certification_expiry': s.certification_expiry.isoformat() if s.certification_expiry else None
            } for s in skills]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@work_roster_bp.route('/employees/<int:employee_id>/skills', methods=['POST'])
@jwt_required()
def add_employee_skill(employee_id):
    """Add skill to an employee"""
    try:
        data = request.get_json()
        
        # Check for duplicate
        existing = EmployeeSkill.query.filter_by(
            employee_id=employee_id,
            skill_type=data['skill_type'],
            machine_id=data.get('machine_id')
        ).first()
        
        if existing:
            return jsonify({
                'success': False,
                'error': 'Skill already exists for this employee'
            }), 400
        
        skill = EmployeeSkill(
            employee_id=employee_id,
            skill_type=data['skill_type'],
            machine_id=data.get('machine_id'),
            proficiency_level=data.get('proficiency_level', 'basic'),
            certified=data.get('certified', False),
            certification_date=datetime.fromisoformat(data['certification_date']).date() if data.get('certification_date') else None,
            certification_expiry=datetime.fromisoformat(data['certification_expiry']).date() if data.get('certification_expiry') else None,
            notes=data.get('notes')
        )
        
        db.session.add(skill)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Skill berhasil ditambahkan',
            'skill_id': skill.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@work_roster_bp.route('/skills/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_employee_skill(id):
    """Delete employee skill"""
    try:
        skill = EmployeeSkill.query.get(id)
        if not skill:
            return jsonify({'success': False, 'error': 'Skill not found'}), 404
        
        db.session.delete(skill)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Skill berhasil dihapus'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


# ===========================
# ROSTER TEMPLATES
# ===========================

@work_roster_bp.route('/templates', methods=['GET'])
@jwt_required()
def get_roster_templates():
    """Get roster templates"""
    try:
        templates = RosterTemplate.query.filter_by(is_active=True).all()
        
        return jsonify({
            'success': True,
            'templates': [{
                'id': t.id,
                'name': t.name,
                'description': t.description,
                'shift': t.shift,
                'created_at': t.created_at.isoformat() if t.created_at else None
            } for t in templates]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@work_roster_bp.route('/templates', methods=['POST'])
@jwt_required()
def create_roster_template():
    """Create roster template from current roster"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        template = RosterTemplate(
            name=data['name'],
            description=data.get('description'),
            shift=data['shift'],
            template_data=data.get('template_data'),
            created_by=int(user_id)
        )
        
        db.session.add(template)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Template berhasil dibuat',
            'template_id': template.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@work_roster_bp.route('/rosters/copy', methods=['POST'])
@jwt_required()
def copy_roster():
    """Copy roster from one week to another"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        source_year = data.get('source_year')
        source_week = data.get('source_week')
        target_year = data.get('target_year')
        target_week = data.get('target_week')
        
        # Get source roster
        source = WorkRoster.query.filter_by(
            year=source_year,
            week_number=source_week
        ).first()
        
        if not source:
            return jsonify({
                'success': False,
                'error': f'Roster sumber minggu ke-{source_week} tahun {source_year} tidak ditemukan'
            }), 404
        
        # Check if target exists
        existing = WorkRoster.query.filter_by(
            year=target_year,
            week_number=target_week
        ).first()
        
        if existing:
            return jsonify({
                'success': False,
                'error': f'Roster untuk minggu ke-{target_week} tahun {target_year} sudah ada'
            }), 400
        
        # Calculate target week dates
        target_week_start, target_week_end = get_week_dates(
            datetime.strptime(f'{target_year}-W{target_week:02d}-1', '%Y-W%W-%w').date()
        )
        
        # Create new roster
        new_roster = WorkRoster(
            year=target_year,
            week_number=target_week,
            week_start_date=target_week_start,
            week_end_date=target_week_end,
            leader_shift_1_id=source.leader_shift_1_id,
            leader_shift_2_id=source.leader_shift_2_id,
            leader_shift_3_id=source.leader_shift_3_id,
            status='draft',
            notes=f'Copied from week {source_week}/{source_year}',
            created_by=int(user_id)
        )
        db.session.add(new_roster)
        db.session.flush()
        
        # Copy assignments
        for a in source.assignments:
            new_assignment = WorkRosterAssignment(
                roster_id=new_roster.id,
                employee_id=a.employee_id,
                shift=a.shift,
                role=a.role,
                machine_id=a.machine_id,
                position=a.position,
                is_backup=a.is_backup,
                status='assigned',
                notes=a.notes
            )
            db.session.add(new_assignment)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Roster berhasil dicopy ke {target_date}',
            'roster_id': new_roster.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


# ===========================
# PRODUCTION INTEGRATION
# ===========================

@work_roster_bp.route('/operators/for-production', methods=['GET'])
@jwt_required()
def get_operators_for_production():
    """
    Get operators assigned for production input
    Used by Production module to select operators from HR
    Finds roster by the week containing the given date
    """
    try:
        date_str = request.args.get('date')
        shift = request.args.get('shift', 'shift_1')
        machine_id = request.args.get('machine_id')
        
        if not date_str:
            date_str = get_local_now().date().isoformat()
        
        roster_date = datetime.fromisoformat(date_str).date()
        
        # Get week number from date
        week_number, year = get_week_number(roster_date)
        
        # Find roster for this week
        roster = WorkRoster.query.filter_by(
            year=year,
            week_number=week_number
        ).first()
        
        if not roster:
            return jsonify({
                'success': True,
                'date': roster_date.isoformat(),
                'operators': []
            }), 200
        
        # Build query for assignments
        query = db.session.query(WorkRosterAssignment).filter(
            WorkRosterAssignment.roster_id == roster.id,
            WorkRosterAssignment.role == 'operator',
            WorkRosterAssignment.shift == shift
        )
        
        if machine_id:
            query = query.filter(WorkRosterAssignment.machine_id == int(machine_id))
        
        assignments = query.all()
        
        operators = []
        for a in assignments:
            operators.append({
                'employee_id': a.employee_id,
                'employee_number': a.employee.employee_number if a.employee else None,
                'full_name': a.employee.full_name if a.employee else None,
                'machine_id': a.machine_id,
                'machine_name': a.machine.name if a.machine else None,
                'shift': a.shift,
                'is_backup': a.is_backup
            })
        
        return jsonify({
            'success': True,
            'date': roster_date.isoformat(),
            'week_number': week_number,
            'year': year,
            'operators': operators
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@work_roster_bp.route('/role-definitions', methods=['GET'])
@jwt_required()
def get_role_definitions():
    """Get all role definitions"""
    return jsonify({
        'success': True,
        'roles': ROSTER_ROLES
    }), 200
