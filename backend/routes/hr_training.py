from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Employee, TrainingCategory, TrainingProgram, TrainingSession, TrainingEnrollment, TrainingRequest
from utils.i18n import success_response, error_response, get_message
from utils import generate_number
from datetime import datetime, date
from sqlalchemy import func, and_, or_
from decimal import Decimal
from utils.timezone import get_local_now, get_local_today

hr_training_bp = Blueprint('hr_training', __name__)

# ===============================
# TRAINING CATEGORIES
# ===============================

@hr_training_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_training_categories():
    """Get all training categories"""
    try:
        categories = TrainingCategory.query.filter_by(is_active=True).all()
        
        return jsonify({
            'categories': [{
                'id': c.id,
                'name': c.name,
                'description': c.description,
                'program_count': len(c.programs),
                'created_at': c.created_at.isoformat()
            } for c in categories]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_training_bp.route('/categories', methods=['POST'])
@jwt_required()
def create_training_category():
    """Create new training category"""
    try:
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify(error_response('api.error', error_code=400)), 400
        
        category = TrainingCategory(
            name=data['name'],
            description=data.get('description')
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'message': 'Training category created successfully',
            'category': {
                'id': category.id,
                'name': category.name,
                'description': category.description
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===============================
# TRAINING PROGRAMS
# ===============================

@hr_training_bp.route('/programs', methods=['GET'])
@jwt_required()
def get_training_programs():
    """Get all training programs"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        category_id = request.args.get('category_id', type=int)
        training_type = request.args.get('training_type')
        search = request.args.get('search', '')
        
        query = TrainingProgram.query.filter_by(is_active=True)
        
        if category_id:
            query = query.filter_by(category_id=category_id)
        if training_type:
            query = query.filter_by(training_type=training_type)
        if search:
            query = query.filter(
                or_(
                    TrainingProgram.program_name.ilike(f'%{search}%'),
                    TrainingProgram.program_code.ilike(f'%{search}%')
                )
            )
        
        programs = query.order_by(TrainingProgram.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'programs': [{
                'id': p.id,
                'program_code': p.program_code,
                'program_name': p.program_name,
                'category': {
                    'id': p.category.id,
                    'name': p.category.name
                },
                'training_type': p.training_type,
                'duration_hours': p.duration_hours,
                'cost_per_participant': float(p.cost_per_participant),
                'max_participants': p.max_participants,
                'trainer_name': p.trainer_name,
                'active_sessions': len([s for s in p.sessions if s.status in ['scheduled', 'ongoing']]),
                'created_at': p.created_at.isoformat()
            } for p in programs.items],
            'total': programs.total,
            'pages': programs.pages,
            'current_page': programs.page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_training_bp.route('/programs', methods=['POST'])
@jwt_required()
def create_training_program():
    """Create new training program"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        required_fields = ['program_name', 'category_id', 'training_type', 'duration_hours']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        program_code = generate_number('TRN')
        
        program = TrainingProgram(
            program_code=program_code,
            program_name=data['program_name'],
            category_id=data['category_id'],
            description=data.get('description'),
            objectives=data.get('objectives'),
            duration_hours=data['duration_hours'],
            training_type=data['training_type'],
            max_participants=data.get('max_participants'),
            cost_per_participant=Decimal(str(data.get('cost_per_participant', 0))),
            trainer_name=data.get('trainer_name'),
            trainer_company=data.get('trainer_company'),
            prerequisites=data.get('prerequisites'),
            materials_provided=data.get('materials_provided'),
            created_by=int(user_id)
        )
        
        db.session.add(program)
        db.session.commit()
        
        return jsonify({
            'message': 'Training program created successfully',
            'program': {
                'id': program.id,
                'program_code': program.program_code,
                'program_name': program.program_name,
                'training_type': program.training_type,
                'duration_hours': program.duration_hours
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_training_bp.route('/programs/<int:program_id>', methods=['GET'])
@jwt_required()
def get_training_program(program_id):
    """Get training program details"""
    try:
        program = TrainingProgram.query.get_or_404(program_id)
        
        return jsonify({
            'program': {
                'id': program.id,
                'program_code': program.program_code,
                'program_name': program.program_name,
                'category': {
                    'id': program.category.id,
                    'name': program.category.name
                },
                'description': program.description,
                'objectives': program.objectives,
                'duration_hours': program.duration_hours,
                'training_type': program.training_type,
                'max_participants': program.max_participants,
                'cost_per_participant': float(program.cost_per_participant),
                'trainer_name': program.trainer_name,
                'trainer_company': program.trainer_company,
                'prerequisites': program.prerequisites,
                'materials_provided': program.materials_provided,
                'sessions': [{
                    'id': s.id,
                    'session_code': s.session_code,
                    'session_name': s.session_name,
                    'start_date': s.start_date.isoformat(),
                    'end_date': s.end_date.isoformat(),
                    'location': s.location,
                    'status': s.status,
                    'current_participants': s.current_participants,
                    'max_participants': s.max_participants
                } for s in program.sessions],
                'created_at': program.created_at.isoformat()
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===============================
# TRAINING SESSIONS
# ===============================

@hr_training_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_training_sessions():
    """Get all training sessions"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        program_id = request.args.get('program_id', type=int)
        status = request.args.get('status')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = TrainingSession.query.join(TrainingProgram)
        
        if program_id:
            query = query.filter(TrainingSession.program_id == program_id)
        if status:
            query = query.filter(TrainingSession.status == status)
        if start_date:
            query = query.filter(TrainingSession.start_date >= datetime.fromisoformat(start_date).date())
        if end_date:
            query = query.filter(TrainingSession.end_date <= datetime.fromisoformat(end_date).date())
        
        sessions = query.order_by(TrainingSession.start_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'sessions': [{
                'id': s.id,
                'session_code': s.session_code,
                'session_name': s.session_name,
                'program': {
                    'id': s.program.id,
                    'program_code': s.program.program_code,
                    'program_name': s.program.program_name,
                    'training_type': s.program.training_type
                },
                'start_date': s.start_date.isoformat(),
                'end_date': s.end_date.isoformat(),
                'start_time': s.start_time.strftime('%H:%M') if s.start_time else None,
                'end_time': s.end_time.strftime('%H:%M') if s.end_time else None,
                'location': s.location,
                'status': s.status,
                'current_participants': s.current_participants,
                'max_participants': s.max_participants,
                'trainer_name': s.trainer_name,
                'total_cost': float(s.total_cost),
                'created_at': s.created_at.isoformat()
            } for s in sessions.items],
            'total': sessions.total,
            'pages': sessions.pages,
            'current_page': sessions.page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_training_bp.route('/sessions', methods=['POST'])
@jwt_required()
def create_training_session():
    """Create new training session"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        required_fields = ['program_id', 'session_name', 'start_date', 'end_date']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        session_code = generate_number('TRS')
        
        session = TrainingSession(
            session_code=session_code,
            program_id=data['program_id'],
            session_name=data['session_name'],
            start_date=datetime.fromisoformat(data['start_date']).date(),
            end_date=datetime.fromisoformat(data['end_date']).date(),
            start_time=datetime.fromisoformat(data['start_time']).time() if data.get('start_time') else None,
            end_time=datetime.fromisoformat(data['end_time']).time() if data.get('end_time') else None,
            location=data.get('location'),
            venue_details=data.get('venue_details'),
            max_participants=data.get('max_participants'),
            trainer_name=data.get('trainer_name'),
            total_cost=Decimal(str(data.get('total_cost', 0))),
            notes=data.get('notes'),
            created_by=int(user_id)
        )
        
        db.session.add(session)
        db.session.commit()
        
        return jsonify({
            'message': 'Training session created successfully',
            'session': {
                'id': session.id,
                'session_code': session.session_code,
                'session_name': session.session_name,
                'start_date': session.start_date.isoformat(),
                'end_date': session.end_date.isoformat(),
                'status': session.status
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_training_bp.route('/sessions/<int:session_id>', methods=['GET'])
@jwt_required()
def get_training_session(session_id):
    """Get training session details with enrollments"""
    try:
        session = TrainingSession.query.get_or_404(session_id)
        
        return jsonify({
            'session': {
                'id': session.id,
                'session_code': session.session_code,
                'session_name': session.session_name,
                'program': {
                    'id': session.program.id,
                    'program_code': session.program.program_code,
                    'program_name': session.program.program_name,
                    'duration_hours': session.program.duration_hours,
                    'training_type': session.program.training_type
                },
                'start_date': session.start_date.isoformat(),
                'end_date': session.end_date.isoformat(),
                'start_time': session.start_time.strftime('%H:%M') if session.start_time else None,
                'end_time': session.end_time.strftime('%H:%M') if session.end_time else None,
                'location': session.location,
                'venue_details': session.venue_details,
                'status': session.status,
                'current_participants': session.current_participants,
                'max_participants': session.max_participants,
                'trainer_name': session.trainer_name,
                'total_cost': float(session.total_cost),
                'notes': session.notes,
                'enrollments': [{
                    'id': e.id,
                    'employee': {
                        'id': e.employee.id,
                        'employee_number': e.employee.employee_number,
                        'full_name': e.employee.full_name,
                        'department': e.employee.department.name if e.employee.department else None
                    },
                    'enrollment_date': e.enrollment_date.isoformat(),
                    'enrollment_status': e.enrollment_status,
                    'attendance_status': e.attendance_status,
                    'attendance_percentage': float(e.attendance_percentage),
                    'final_score': float(e.final_score) if e.final_score else None,
                    'pass_status': e.pass_status,
                    'certificate_issued': e.certificate_issued
                } for e in session.enrollments],
                'created_at': session.created_at.isoformat()
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===============================
# TRAINING ENROLLMENTS
# ===============================

@hr_training_bp.route('/sessions/<int:session_id>/enroll', methods=['POST'])
@jwt_required()
def enroll_employees(session_id):
    """Enroll employees in training session"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        session = TrainingSession.query.get_or_404(session_id)
        employee_ids = data.get('employee_ids', [])
        
        if not employee_ids:
            return jsonify(error_response('api.error', error_code=400)), 400
        
        # Check capacity
        if session.max_participants and (session.current_participants + len(employee_ids)) > session.max_participants:
            return jsonify(error_response('api.error', error_code=400)), 400
        
        enrolled_count = 0
        for employee_id in employee_ids:
            # Check if already enrolled
            existing = TrainingEnrollment.query.filter_by(
                session_id=session_id,
                employee_id=employee_id
            ).first()
            
            if not existing:
                enrollment = TrainingEnrollment(
                    session_id=session_id,
                    employee_id=employee_id,
                    enrollment_date=get_local_today(),
                    enrolled_by=int(user_id)
                )
                db.session.add(enrollment)
                enrolled_count += 1
        
        # Update session participant count
        session.current_participants += enrolled_count
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully enrolled {enrolled_count} employees',
            'enrolled_count': enrolled_count
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_training_bp.route('/enrollments/<int:enrollment_id>/attendance', methods=['POST'])
@jwt_required()
def update_attendance(enrollment_id):
    """Update training attendance"""
    try:
        data = request.get_json()
        enrollment = TrainingEnrollment.query.get_or_404(enrollment_id)
        
        enrollment.attendance_status = data.get('attendance_status')
        enrollment.attendance_percentage = Decimal(str(data.get('attendance_percentage', 0)))
        
        db.session.commit()
        
        return jsonify(success_response('api.success'))
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_training_bp.route('/enrollments/<int:enrollment_id>/assessment', methods=['POST'])
@jwt_required()
def update_assessment(enrollment_id):
    """Update training assessment scores"""
    try:
        data = request.get_json()
        enrollment = TrainingEnrollment.query.get_or_404(enrollment_id)
        
        enrollment.pre_assessment_score = Decimal(str(data.get('pre_assessment_score', 0))) if data.get('pre_assessment_score') else None
        enrollment.post_assessment_score = Decimal(str(data.get('post_assessment_score', 0))) if data.get('post_assessment_score') else None
        enrollment.final_score = Decimal(str(data.get('final_score', 0))) if data.get('final_score') else None
        enrollment.pass_status = data.get('pass_status')
        
        db.session.commit()
        
        return jsonify(success_response('api.success'))
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_training_bp.route('/enrollments/<int:enrollment_id>/certificate', methods=['POST'])
@jwt_required()
def issue_certificate(enrollment_id):
    """Issue training certificate"""
    try:
        data = request.get_json()
        enrollment = TrainingEnrollment.query.get_or_404(enrollment_id)
        
        if enrollment.pass_status != 'pass':
            return jsonify(error_response('api.error', error_code=400)), 400
        
        certificate_number = generate_number('CERT')
        
        enrollment.certificate_issued = True
        enrollment.certificate_number = certificate_number
        enrollment.certificate_date = get_local_today()
        enrollment.certificate_valid_until = datetime.fromisoformat(data['valid_until']).date() if data.get('valid_until') else None
        
        db.session.commit()
        
        return jsonify({
            'message': 'Certificate issued successfully',
            'certificate_number': certificate_number
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===============================
# TRAINING REQUESTS
# ===============================

@hr_training_bp.route('/requests', methods=['GET'])
@jwt_required()
def get_training_requests():
    """Get all training requests"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        status = request.args.get('status')
        employee_id = request.args.get('employee_id', type=int)
        
        query = TrainingRequest.query.join(Employee)
        
        if status:
            query = query.filter(TrainingRequest.status == status)
        if employee_id:
            query = query.filter(TrainingRequest.employee_id == employee_id)
        
        requests = query.order_by(TrainingRequest.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'requests': [{
                'id': r.id,
                'request_number': r.request_number,
                'employee': {
                    'id': r.employee.id,
                    'employee_number': r.employee.employee_number,
                    'full_name': r.employee.full_name,
                    'department': r.employee.department.name if r.employee.department else None
                },
                'program': {
                    'id': r.program.id,
                    'program_name': r.program.program_name
                } if r.program else None,
                'requested_training': r.requested_training,
                'justification': r.justification,
                'preferred_date': r.preferred_date.isoformat() if r.preferred_date else None,
                'estimated_cost': float(r.estimated_cost) if r.estimated_cost else None,
                'priority': r.priority,
                'status': r.status,
                'approved_at': r.approved_at.isoformat() if r.approved_at else None,
                'created_at': r.created_at.isoformat()
            } for r in requests.items],
            'total': requests.total,
            'pages': requests.pages,
            'current_page': requests.page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_training_bp.route('/requests', methods=['POST'])
@jwt_required()
def create_training_request():
    """Create new training request"""
    try:
        data = request.get_json()
        
        required_fields = ['employee_id', 'requested_training', 'justification']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        request_number = generate_number('TRQ')
        
        training_request = TrainingRequest(
            request_number=request_number,
            employee_id=data['employee_id'],
            program_id=data.get('program_id'),
            requested_training=data['requested_training'],
            justification=data['justification'],
            preferred_date=datetime.fromisoformat(data['preferred_date']).date() if data.get('preferred_date') else None,
            estimated_cost=Decimal(str(data.get('estimated_cost', 0))) if data.get('estimated_cost') else None,
            priority=data.get('priority', 'medium'),
            notes=data.get('notes')
        )
        
        db.session.add(training_request)
        db.session.commit()
        
        return jsonify({
            'message': 'Training request created successfully',
            'request': {
                'id': training_request.id,
                'request_number': training_request.request_number,
                'requested_training': training_request.requested_training,
                'status': training_request.status
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_training_bp.route('/requests/<int:request_id>/approve', methods=['POST'])
@jwt_required()
def approve_training_request(request_id):
    """Approve training request"""
    try:
        user_id = get_jwt_identity()
        training_request = TrainingRequest.query.get_or_404(request_id)
        
        if training_request.status != 'pending':
            return jsonify(error_response('api.error', error_code=400)), 400
        
        training_request.status = 'approved'
        training_request.approved_by = int(user_id)
        training_request.approved_at = get_local_now()
        
        db.session.commit()
        
        return jsonify(success_response('api.success'))
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_training_bp.route('/requests/<int:request_id>/reject', methods=['POST'])
@jwt_required()
def reject_training_request(request_id):
    """Reject training request"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        training_request = TrainingRequest.query.get_or_404(request_id)
        
        if training_request.status != 'pending':
            return jsonify(error_response('api.error', error_code=400)), 400
        
        training_request.status = 'rejected'
        training_request.approved_by = int(user_id)
        training_request.approved_at = get_local_now()
        training_request.rejection_reason = data.get('rejection_reason')
        
        db.session.commit()
        
        return jsonify(success_response('api.success'))
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===============================
# TRAINING REPORTS
# ===============================

@hr_training_bp.route('/reports/employee-training-history/<int:employee_id>', methods=['GET'])
@jwt_required()
def get_employee_training_history(employee_id):
    """Get training history for specific employee"""
    try:
        enrollments = TrainingEnrollment.query.filter_by(employee_id=employee_id)\
            .join(TrainingSession).join(TrainingProgram).all()
        
        return jsonify({
            'employee_id': employee_id,
            'training_history': [{
                'session': {
                    'id': e.session.id,
                    'session_code': e.session.session_code,
                    'session_name': e.session.session_name,
                    'start_date': e.session.start_date.isoformat(),
                    'end_date': e.session.end_date.isoformat()
                },
                'program': {
                    'id': e.session.program.id,
                    'program_name': e.session.program.program_name,
                    'training_type': e.session.program.training_type,
                    'duration_hours': e.session.program.duration_hours
                },
                'enrollment_date': e.enrollment_date.isoformat(),
                'enrollment_status': e.enrollment_status,
                'attendance_status': e.attendance_status,
                'attendance_percentage': float(e.attendance_percentage),
                'final_score': float(e.final_score) if e.final_score else None,
                'pass_status': e.pass_status,
                'certificate_issued': e.certificate_issued,
                'certificate_number': e.certificate_number,
                'certificate_date': e.certificate_date.isoformat() if e.certificate_date else None
            } for e in enrollments]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_training_bp.route('/reports/training-effectiveness', methods=['GET'])
@jwt_required()
def get_training_effectiveness_report():
    """Get training effectiveness report"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = TrainingSession.query
        
        if start_date:
            query = query.filter(TrainingSession.start_date >= datetime.fromisoformat(start_date).date())
        if end_date:
            query = query.filter(TrainingSession.end_date <= datetime.fromisoformat(end_date).date())
        
        sessions = query.all()
        
        total_sessions = len(sessions)
        total_participants = sum([s.current_participants for s in sessions])
        completed_sessions = len([s for s in sessions if s.status == 'completed'])
        
        # Calculate completion rates, pass rates, etc.
        all_enrollments = []
        for session in sessions:
            all_enrollments.extend(session.enrollments)
        
        completed_enrollments = len([e for e in all_enrollments if e.enrollment_status == 'completed'])
        passed_enrollments = len([e for e in all_enrollments if e.pass_status == 'pass'])
        certificates_issued = len([e for e in all_enrollments if e.certificate_issued])
        
        completion_rate = (completed_enrollments / total_participants * 100) if total_participants > 0 else 0
        pass_rate = (passed_enrollments / completed_enrollments * 100) if completed_enrollments > 0 else 0
        certification_rate = (certificates_issued / passed_enrollments * 100) if passed_enrollments > 0 else 0
        
        return jsonify({
            'summary': {
                'total_sessions': total_sessions,
                'completed_sessions': completed_sessions,
                'total_participants': total_participants,
                'completion_rate': round(completion_rate, 2),
                'pass_rate': round(pass_rate, 2),
                'certification_rate': round(certification_rate, 2)
            },
            'sessions': [{
                'id': s.id,
                'session_name': s.session_name,
                'program_name': s.program.program_name,
                'start_date': s.start_date.isoformat(),
                'status': s.status,
                'participants': s.current_participants,
                'completion_rate': (len([e for e in s.enrollments if e.enrollment_status == 'completed']) / s.current_participants * 100) if s.current_participants > 0 else 0
            } for s in sessions]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
