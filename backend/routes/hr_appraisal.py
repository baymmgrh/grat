from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Employee, AppraisalCycle, AppraisalTemplate, AppraisalCriteria, EmployeeAppraisal, AppraisalScore
from utils.i18n import success_response, error_response, get_message
from utils import generate_number
from datetime import datetime, date
from sqlalchemy import func, and_
from decimal import Decimal
from utils.timezone import get_local_now, get_local_today

hr_appraisal_bp = Blueprint('hr_appraisal', __name__)

# ===============================
# APPRAISAL CYCLES
# ===============================

@hr_appraisal_bp.route('/cycles', methods=['GET'])
@jwt_required()
def get_appraisal_cycles():
    """Get all appraisal cycles"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        status = request.args.get('status')
        
        query = AppraisalCycle.query
        
        if status:
            query = query.filter_by(status=status)
        
        cycles = query.order_by(AppraisalCycle.start_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'cycles': [{
                'id': c.id,
                'cycle_name': c.cycle_name,
                'cycle_type': c.cycle_type,
                'start_date': c.start_date.isoformat(),
                'end_date': c.end_date.isoformat(),
                'self_review_deadline': c.self_review_deadline.isoformat() if c.self_review_deadline else None,
                'manager_review_deadline': c.manager_review_deadline.isoformat() if c.manager_review_deadline else None,
                'status': c.status,
                'description': c.description,
                'total_appraisals': len(c.appraisals),
                'created_at': c.created_at.isoformat()
            } for c in cycles.items],
            'total': cycles.total,
            'pages': cycles.pages,
            'current_page': cycles.page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_appraisal_bp.route('/cycles', methods=['POST'])
@jwt_required()
def create_appraisal_cycle():
    """Create new appraisal cycle"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        required_fields = ['cycle_name', 'cycle_type', 'start_date', 'end_date']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        cycle = AppraisalCycle(
            cycle_name=data['cycle_name'],
            cycle_type=data['cycle_type'],
            start_date=datetime.fromisoformat(data['start_date']).date(),
            end_date=datetime.fromisoformat(data['end_date']).date(),
            self_review_deadline=datetime.fromisoformat(data['self_review_deadline']).date() if data.get('self_review_deadline') else None,
            manager_review_deadline=datetime.fromisoformat(data['manager_review_deadline']).date() if data.get('manager_review_deadline') else None,
            description=data.get('description'),
            created_by=int(user_id)
        )
        
        db.session.add(cycle)
        db.session.commit()
        
        return jsonify({
            'message': 'Appraisal cycle created successfully',
            'cycle': {
                'id': cycle.id,
                'cycle_name': cycle.cycle_name,
                'cycle_type': cycle.cycle_type,
                'start_date': cycle.start_date.isoformat(),
                'end_date': cycle.end_date.isoformat(),
                'status': cycle.status
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_appraisal_bp.route('/cycles/<int:cycle_id>/activate', methods=['POST'])
@jwt_required()
def activate_appraisal_cycle(cycle_id):
    """Activate appraisal cycle and create appraisals for all employees"""
    try:
        data = request.get_json()
        cycle = AppraisalCycle.query.get_or_404(cycle_id)
        
        if cycle.status != 'draft':
            return jsonify(error_response('api.error', error_code=400)), 400
        
        template_id = data.get('template_id')
        if not template_id:
            return jsonify(error_response('api.error', error_code=400)), 400
        
        template = AppraisalTemplate.query.get_or_404(template_id)
        
        # Get all active employees
        employees = Employee.query.filter_by(is_active=True, status='active').all()
        
        created_count = 0
        for employee in employees:
            # Check if appraisal already exists
            existing = EmployeeAppraisal.query.filter_by(
                cycle_id=cycle_id,
                employee_id=employee.id
            ).first()
            
            if not existing:
                appraisal_number = generate_number('APR')
                
                appraisal = EmployeeAppraisal(
                    appraisal_number=appraisal_number,
                    cycle_id=cycle_id,
                    employee_id=employee.id,
                    template_id=template_id,
                    reviewer_id=employee.department.manager_id if employee.department else None
                )
                
                db.session.add(appraisal)
                
                # Create appraisal scores for each criteria
                for criteria in template.criteria:
                    score = AppraisalScore(
                        appraisal_id=appraisal.id,
                        criteria_id=criteria.id
                    )
                    db.session.add(score)
                
                created_count += 1
        
        cycle.status = 'active'
        db.session.commit()
        
        return jsonify({
            'message': f'Appraisal cycle activated. Created {created_count} appraisals.',
            'created_appraisals': created_count
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===============================
# APPRAISAL TEMPLATES
# ===============================

@hr_appraisal_bp.route('/templates', methods=['GET'])
@jwt_required()
def get_appraisal_templates():
    """Get all appraisal templates"""
    try:
        templates = AppraisalTemplate.query.filter_by(is_active=True).all()
        
        return jsonify({
            'templates': [{
                'id': t.id,
                'template_name': t.template_name,
                'description': t.description,
                'criteria_count': len(t.criteria),
                'created_at': t.created_at.isoformat()
            } for t in templates]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_appraisal_bp.route('/templates', methods=['POST'])
@jwt_required()
def create_appraisal_template():
    """Create new appraisal template"""
    try:
        data = request.get_json()
        
        if not data.get('template_name'):
            return jsonify(error_response('api.error', error_code=400)), 400
        
        template = AppraisalTemplate(
            template_name=data['template_name'],
            description=data.get('description')
        )
        
        db.session.add(template)
        db.session.flush()  # Get template ID
        
        # Add criteria if provided
        criteria_data = data.get('criteria', [])
        for idx, criteria_item in enumerate(criteria_data):
            criteria = AppraisalCriteria(
                template_id=template.id,
                criteria_name=criteria_item['criteria_name'],
                description=criteria_item.get('description'),
                weight_percentage=Decimal(str(criteria_item.get('weight_percentage', 0))),
                max_score=criteria_item.get('max_score', 5),
                order_index=idx
            )
            db.session.add(criteria)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Appraisal template created successfully',
            'template': {
                'id': template.id,
                'template_name': template.template_name,
                'criteria_count': len(criteria_data)
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_appraisal_bp.route('/templates/<int:template_id>', methods=['GET'])
@jwt_required()
def get_appraisal_template(template_id):
    """Get appraisal template with criteria"""
    try:
        template = AppraisalTemplate.query.get_or_404(template_id)
        
        return jsonify({
            'template': {
                'id': template.id,
                'template_name': template.template_name,
                'description': template.description,
                'criteria': [{
                    'id': c.id,
                    'criteria_name': c.criteria_name,
                    'description': c.description,
                    'weight_percentage': float(c.weight_percentage),
                    'max_score': c.max_score,
                    'order_index': c.order_index
                } for c in sorted(template.criteria, key=lambda x: x.order_index)]
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===============================
# EMPLOYEE APPRAISALS
# ===============================

@hr_appraisal_bp.route('/appraisals', methods=['GET'])
@jwt_required()
def get_employee_appraisals():
    """Get employee appraisals"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        cycle_id = request.args.get('cycle_id', type=int)
        employee_id = request.args.get('employee_id', type=int)
        status = request.args.get('status')
        
        query = EmployeeAppraisal.query.join(Employee, EmployeeAppraisal.employee_id == Employee.id).join(AppraisalCycle)
        
        if cycle_id:
            query = query.filter(EmployeeAppraisal.cycle_id == cycle_id)
        if employee_id:
            query = query.filter(EmployeeAppraisal.employee_id == employee_id)
        if status:
            query = query.filter(EmployeeAppraisal.overall_status == status)
        
        appraisals = query.order_by(EmployeeAppraisal.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'appraisals': [{
                'id': a.id,
                'appraisal_number': a.appraisal_number,
                'cycle': {
                    'id': a.cycle.id,
                    'cycle_name': a.cycle.cycle_name,
                    'cycle_type': a.cycle.cycle_type
                },
                'employee': {
                    'id': a.employee.id,
                    'employee_number': a.employee.employee_number,
                    'full_name': a.employee.full_name,
                    'department': a.employee.department.name if a.employee.department else None
                },
                'reviewer': {
                    'id': a.reviewer.id,
                    'full_name': a.reviewer.full_name
                } if a.reviewer else None,
                'self_review_status': a.self_review_status,
                'manager_review_status': a.manager_review_status,
                'overall_status': a.overall_status,
                'final_score': float(a.final_score) if a.final_score else None,
                'final_rating': a.final_rating,
                'created_at': a.created_at.isoformat()
            } for a in appraisals.items],
            'total': appraisals.total,
            'pages': appraisals.pages,
            'current_page': appraisals.page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_appraisal_bp.route('/appraisals/<int:appraisal_id>', methods=['GET'])
@jwt_required()
def get_appraisal_detail(appraisal_id):
    """Get detailed appraisal with scores"""
    try:
        appraisal = EmployeeAppraisal.query.get_or_404(appraisal_id)
        
        return jsonify({
            'appraisal': {
                'id': appraisal.id,
                'appraisal_number': appraisal.appraisal_number,
                'cycle': {
                    'id': appraisal.cycle.id,
                    'cycle_name': appraisal.cycle.cycle_name,
                    'cycle_type': appraisal.cycle.cycle_type,
                    'self_review_deadline': appraisal.cycle.self_review_deadline.isoformat() if appraisal.cycle.self_review_deadline else None,
                    'manager_review_deadline': appraisal.cycle.manager_review_deadline.isoformat() if appraisal.cycle.manager_review_deadline else None
                },
                'employee': {
                    'id': appraisal.employee.id,
                    'employee_number': appraisal.employee.employee_number,
                    'full_name': appraisal.employee.full_name,
                    'department': appraisal.employee.department.name if appraisal.employee.department else None,
                    'position': appraisal.employee.position
                },
                'reviewer': {
                    'id': appraisal.reviewer.id,
                    'full_name': appraisal.reviewer.full_name
                } if appraisal.reviewer else None,
                'template': {
                    'id': appraisal.template.id,
                    'template_name': appraisal.template.template_name
                },
                'self_review_status': appraisal.self_review_status,
                'self_review_date': appraisal.self_review_date.isoformat() if appraisal.self_review_date else None,
                'self_overall_score': float(appraisal.self_overall_score) if appraisal.self_overall_score else None,
                'self_comments': appraisal.self_comments,
                'manager_review_status': appraisal.manager_review_status,
                'manager_review_date': appraisal.manager_review_date.isoformat() if appraisal.manager_review_date else None,
                'manager_overall_score': float(appraisal.manager_overall_score) if appraisal.manager_overall_score else None,
                'manager_comments': appraisal.manager_comments,
                'final_score': float(appraisal.final_score) if appraisal.final_score else None,
                'final_rating': appraisal.final_rating,
                'goals_next_period': appraisal.goals_next_period,
                'development_plan': appraisal.development_plan,
                'overall_status': appraisal.overall_status,
                'scores': [{
                    'id': s.id,
                    'criteria': {
                        'id': s.criteria.id,
                        'criteria_name': s.criteria.criteria_name,
                        'description': s.criteria.description,
                        'weight_percentage': float(s.criteria.weight_percentage),
                        'max_score': s.criteria.max_score
                    },
                    'self_score': s.self_score,
                    'self_comments': s.self_comments,
                    'manager_score': s.manager_score,
                    'manager_comments': s.manager_comments,
                    'final_score': s.final_score
                } for s in appraisal.scores]
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@hr_appraisal_bp.route('/appraisals/<int:appraisal_id>/self-review', methods=['POST'])
@jwt_required()
def submit_self_review(appraisal_id):
    """Submit self review"""
    try:
        data = request.get_json()
        appraisal = EmployeeAppraisal.query.get_or_404(appraisal_id)
        
        if appraisal.self_review_status == 'completed':
            return jsonify(error_response('api.error', error_code=400)), 400
        
        # Update appraisal scores
        scores_data = data.get('scores', [])
        for score_data in scores_data:
            score = AppraisalScore.query.filter_by(
                appraisal_id=appraisal_id,
                criteria_id=score_data['criteria_id']
            ).first()
            
            if score:
                score.self_score = score_data.get('self_score')
                score.self_comments = score_data.get('self_comments')
        
        # Update appraisal
        appraisal.self_review_status = 'completed'
        appraisal.self_review_date = get_local_now()
        appraisal.self_overall_score = Decimal(str(data.get('self_overall_score', 0)))
        appraisal.self_comments = data.get('self_comments')
        appraisal.overall_status = 'manager_review'
        
        db.session.commit()
        
        return jsonify(success_response('api.success'))
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@hr_appraisal_bp.route('/appraisals/<int:appraisal_id>/manager-review', methods=['POST'])
@jwt_required()
def submit_manager_review(appraisal_id):
    """Submit manager review"""
    try:
        data = request.get_json()
        appraisal = EmployeeAppraisal.query.get_or_404(appraisal_id)
        
        if appraisal.manager_review_status == 'completed':
            return jsonify(error_response('api.error', error_code=400)), 400
        
        # Update appraisal scores
        scores_data = data.get('scores', [])
        total_weighted_score = Decimal('0')
        total_weight = Decimal('0')
        
        for score_data in scores_data:
            score = AppraisalScore.query.filter_by(
                appraisal_id=appraisal_id,
                criteria_id=score_data['criteria_id']
            ).first()
            
            if score:
                manager_score = score_data.get('manager_score')
                score.manager_score = manager_score
                score.manager_comments = score_data.get('manager_comments')
                score.final_score = manager_score  # Use manager score as final
                
                # Calculate weighted score
                if manager_score and score.criteria.weight_percentage:
                    weighted_score = Decimal(str(manager_score)) * score.criteria.weight_percentage / 100
                    total_weighted_score += weighted_score
                    total_weight += score.criteria.weight_percentage
        
        # Calculate final score and rating
        final_score = total_weighted_score / total_weight * 100 if total_weight > 0 else Decimal('0')
        final_rating = calculate_rating(float(final_score))
        
        # Update appraisal
        appraisal.manager_review_status = 'completed'
        appraisal.manager_review_date = get_local_now()
        appraisal.manager_overall_score = Decimal(str(data.get('manager_overall_score', 0)))
        appraisal.manager_comments = data.get('manager_comments')
        appraisal.final_score = final_score
        appraisal.final_rating = final_rating
        appraisal.goals_next_period = data.get('goals_next_period')
        appraisal.development_plan = data.get('development_plan')
        appraisal.overall_status = 'completed'
        appraisal.completed_at = get_local_now()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Manager review submitted successfully',
            'final_score': float(final_score),
            'final_rating': final_rating
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def calculate_rating(score):
    """Calculate rating based on score"""
    if score >= 90:
        return 'excellent'
    elif score >= 75:
        return 'good'
    elif score >= 60:
        return 'satisfactory'
    else:
        return 'needs_improvement'

# ===============================
# APPRAISAL REPORTS
# ===============================

@hr_appraisal_bp.route('/cycles/<int:cycle_id>/report', methods=['GET'])
@jwt_required()
def get_appraisal_cycle_report(cycle_id):
    """Get appraisal cycle summary report"""
    try:
        cycle = AppraisalCycle.query.get_or_404(cycle_id)
        
        # Get statistics
        total_appraisals = len(cycle.appraisals)
        completed_appraisals = len([a for a in cycle.appraisals if a.overall_status == 'completed'])
        pending_self_review = len([a for a in cycle.appraisals if a.self_review_status == 'pending'])
        pending_manager_review = len([a for a in cycle.appraisals if a.manager_review_status == 'pending'])
        
        # Rating distribution
        rating_distribution = {}
        for appraisal in cycle.appraisals:
            if appraisal.final_rating:
                rating_distribution[appraisal.final_rating] = rating_distribution.get(appraisal.final_rating, 0) + 1
        
        # Average score
        completed_scores = [float(a.final_score) for a in cycle.appraisals if a.final_score]
        average_score = sum(completed_scores) / len(completed_scores) if completed_scores else 0
        
        return jsonify({
            'cycle': {
                'id': cycle.id,
                'cycle_name': cycle.cycle_name,
                'cycle_type': cycle.cycle_type,
                'status': cycle.status
            },
            'statistics': {
                'total_appraisals': total_appraisals,
                'completed_appraisals': completed_appraisals,
                'completion_rate': (completed_appraisals / total_appraisals * 100) if total_appraisals > 0 else 0,
                'pending_self_review': pending_self_review,
                'pending_manager_review': pending_manager_review,
                'average_score': round(average_score, 2),
                'rating_distribution': rating_distribution
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
