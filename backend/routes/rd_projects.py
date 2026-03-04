from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, ResearchProject, User
from utils.i18n import success_response, error_response, get_message
from utils import generate_number
from datetime import datetime, date
from sqlalchemy import or_
import json
from utils.timezone import get_local_now, get_local_today

rd_projects_bp = Blueprint('rd_projects', __name__)

# ===============================
# RESEARCH PROJECTS MANAGEMENT
# ===============================

@rd_projects_bp.route('/', methods=['GET'])
@jwt_required()
def get_projects():
    """Get all research projects with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        priority = request.args.get('priority')
        project_type = request.args.get('project_type')
        search = request.args.get('search')
        
        query = ResearchProject.query
        
        # Apply filters
        if status:
            query = query.filter(ResearchProject.status == status)
        if priority:
            query = query.filter(ResearchProject.priority == priority)
        if project_type:
            query = query.filter(ResearchProject.project_type == project_type)
        if search:
            query = query.filter(
                or_(
                    ResearchProject.project_name.ilike(f'%{search}%'),
                    ResearchProject.project_number.ilike(f'%{search}%'),
                    ResearchProject.description.ilike(f'%{search}%')
                )
            )
        
        projects = query.order_by(ResearchProject.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'projects': [{
                'id': p.id,
                'project_number': p.project_number,
                'project_name': p.project_name,
                'description': p.description,
                'project_type': p.project_type,
                'status': p.status,
                'priority': p.priority,
                'budget': float(p.budget) if p.budget else 0,
                'actual_cost': float(p.actual_cost) if p.actual_cost else 0,
                'progress_percentage': p.progress_percentage,
                'start_date': p.start_date.isoformat() if p.start_date else None,
                'target_completion_date': p.target_completion_date.isoformat() if p.target_completion_date else None,
                'actual_completion_date': p.actual_completion_date.isoformat() if p.actual_completion_date else None,
                'project_leader': p.project_leader.username if p.project_leader else None,
                'team_members': json.loads(p.team_members) if p.team_members else [],
                'created_at': p.created_at.isoformat(),
                'updated_at': p.updated_at.isoformat() if p.updated_at else None
            } for p in projects.items],
            'total': projects.total,
            'pages': projects.pages,
            'current_page': projects.page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rd_projects_bp.route('/', methods=['POST'])
@jwt_required()
def create_project():
    """Create new research project"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Generate project number
        project_number = generate_number('RDP', ResearchProject, 'project_number')
        
        # Parse dates
        start_date = None
        target_completion_date = None
        
        if data.get('start_date'):
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        if data.get('target_completion_date'):
            target_completion_date = datetime.strptime(data['target_completion_date'], '%Y-%m-%d').date()
        
        # Create project
        project = ResearchProject(
            project_number=project_number,
            project_name=data['project_name'],
            description=data.get('description'),
            project_type=data.get('project_type', 'research'),
            objective=data.get('objective'),
            start_date=start_date,
            target_completion_date=target_completion_date,
            status=data.get('status', 'planning'),
            priority=data.get('priority', 'normal'),
            budget=data.get('budget', 0),
            project_leader_id=data.get('project_leader_id', user_id),
            team_members=json.dumps(data.get('team_members', [])),
            expected_outcomes=data.get('expected_outcomes'),
            milestones=json.dumps(data.get('milestones', [])),
            risk_assessment=data.get('risk_assessment'),
            success_criteria=data.get('success_criteria'),
            notes=data.get('notes')
        )
        
        db.session.add(project)
        db.session.commit()
        
        return jsonify({
            'message': 'Research project created successfully',
            'project_id': project.id,
            'project_number': project_number
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rd_projects_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_project(id):
    """Get project details"""
    try:
        project = ResearchProject.query.get_or_404(id)
        
        return jsonify({
            'id': project.id,
            'project_number': project.project_number,
            'project_name': project.project_name,
            'description': project.description,
            'project_type': project.project_type,
            'objective': project.objective,
            'start_date': project.start_date.isoformat() if project.start_date else None,
            'target_completion_date': project.target_completion_date.isoformat() if project.target_completion_date else None,
            'actual_completion_date': project.actual_completion_date.isoformat() if project.actual_completion_date else None,
            'status': project.status,
            'priority': project.priority,
            'budget': float(project.budget) if project.budget else 0,
            'actual_cost': float(project.actual_cost) if project.actual_cost else 0,
            'progress_percentage': project.progress_percentage,
            'project_leader_id': project.project_leader_id,
            'project_leader': project.project_leader.username if project.project_leader else None,
            'team_members': json.loads(project.team_members) if project.team_members else [],
            'expected_outcomes': project.expected_outcomes,
            'milestones': json.loads(project.milestones) if project.milestones else [],
            'risk_assessment': project.risk_assessment,
            'success_criteria': project.success_criteria,
            'notes': project.notes,
            'experiments_count': len(project.experiments),
            'product_developments_count': len(project.product_developments),
            'materials_count': len(project.materials),
            'reports_count': len(project.reports),
            'created_at': project.created_at.isoformat(),
            'updated_at': project.updated_at.isoformat() if project.updated_at else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rd_projects_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_project(id):
    """Update project"""
    try:
        project = ResearchProject.query.get_or_404(id)
        data = request.get_json()
        
        # Update fields
        if 'project_name' in data:
            project.project_name = data['project_name']
        if 'description' in data:
            project.description = data['description']
        if 'project_type' in data:
            project.project_type = data['project_type']
        if 'objective' in data:
            project.objective = data['objective']
        if 'status' in data:
            project.status = data['status']
        if 'priority' in data:
            project.priority = data['priority']
        if 'budget' in data:
            project.budget = data['budget']
        if 'actual_cost' in data:
            project.actual_cost = data['actual_cost']
        if 'progress_percentage' in data:
            project.progress_percentage = data['progress_percentage']
        if 'project_leader_id' in data:
            project.project_leader_id = data['project_leader_id']
        if 'team_members' in data:
            project.team_members = json.dumps(data['team_members'])
        if 'expected_outcomes' in data:
            project.expected_outcomes = data['expected_outcomes']
        if 'milestones' in data:
            project.milestones = json.dumps(data['milestones'])
        if 'risk_assessment' in data:
            project.risk_assessment = data['risk_assessment']
        if 'success_criteria' in data:
            project.success_criteria = data['success_criteria']
        if 'notes' in data:
            project.notes = data['notes']
        
        # Update dates
        if 'start_date' in data and data['start_date']:
            project.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        if 'target_completion_date' in data and data['target_completion_date']:
            project.target_completion_date = datetime.strptime(data['target_completion_date'], '%Y-%m-%d').date()
        if 'actual_completion_date' in data and data['actual_completion_date']:
            project.actual_completion_date = datetime.strptime(data['actual_completion_date'], '%Y-%m-%d').date()
        
        # Auto-complete project if progress is 100%
        if project.progress_percentage == 100 and project.status != 'completed':
            project.status = 'completed'
            if not project.actual_completion_date:
                project.actual_completion_date = get_local_today()
        
        project.updated_at = get_local_now()
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rd_projects_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_project(id):
    """Delete project"""
    try:
        project = ResearchProject.query.get_or_404(id)
        
        # Check if project has related data
        if project.experiments or project.product_developments or project.materials or project.reports:
            return jsonify({
                'error': 'Cannot delete project with related experiments, products, materials, or reports'
            }), 400
        
        db.session.delete(project)
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rd_projects_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_projects_analytics():
    """Get projects analytics"""
    try:
        # Basic counts
        total_projects = ResearchProject.query.count()
        active_projects = ResearchProject.query.filter(
            ResearchProject.status.in_(['planning', 'in_progress', 'testing'])
        ).count()
        completed_projects = ResearchProject.query.filter_by(status='completed').count()
        cancelled_projects = ResearchProject.query.filter_by(status='cancelled').count()
        
        # Budget analysis
        total_budget = db.session.query(db.func.sum(ResearchProject.budget)).scalar() or 0
        total_actual_cost = db.session.query(db.func.sum(ResearchProject.actual_cost)).scalar() or 0
        
        # Status distribution
        status_stats = db.session.query(
            ResearchProject.status,
            db.func.count(ResearchProject.id).label('count')
        ).group_by(ResearchProject.status).all()
        
        # Priority distribution
        priority_stats = db.session.query(
            ResearchProject.priority,
            db.func.count(ResearchProject.id).label('count')
        ).group_by(ResearchProject.priority).all()
        
        # Type distribution
        type_stats = db.session.query(
            ResearchProject.project_type,
            db.func.count(ResearchProject.id).label('count')
        ).group_by(ResearchProject.project_type).all()
        
        # Monthly project creation trend (last 12 months)
        from sqlalchemy import extract
        monthly_projects = db.session.query(
            extract('year', ResearchProject.created_at).label('year'),
            extract('month', ResearchProject.created_at).label('month'),
            db.func.count(ResearchProject.id).label('count')
        ).group_by('year', 'month').order_by('year', 'month').limit(12).all()
        
        return jsonify({
            'summary': {
                'total_projects': total_projects,
                'active_projects': active_projects,
                'completed_projects': completed_projects,
                'cancelled_projects': cancelled_projects,
                'completion_rate': (completed_projects / max(1, total_projects)) * 100,
                'total_budget': float(total_budget),
                'total_actual_cost': float(total_actual_cost),
                'budget_utilization': (float(total_actual_cost) / max(1, float(total_budget))) * 100
            },
            'status_distribution': [
                {'status': s.status, 'count': s.count}
                for s in status_stats
            ],
            'priority_distribution': [
                {'priority': p.priority, 'count': p.count}
                for p in priority_stats
            ],
            'type_distribution': [
                {'type': t.project_type, 'count': t.count}
                for t in type_stats
            ],
            'monthly_trends': [
                {'month': f"{int(m.year)}-{int(m.month):02d}", 'count': m.count}
                for m in monthly_projects
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rd_projects_bp.route('/<int:id>/progress', methods=['PUT'])
@jwt_required()
def update_project_progress(id):
    """Update project progress"""
    try:
        project = ResearchProject.query.get_or_404(id)
        data = request.get_json()
        
        progress = data.get('progress_percentage', 0)
        if not (0 <= progress <= 100):
            return jsonify(error_response('api.error', error_code=400)), 400
        
        project.progress_percentage = progress
        
        # Auto-update status based on progress
        if progress == 0:
            project.status = 'planning'
        elif progress < 100:
            if project.status == 'planning':
                project.status = 'in_progress'
        else:  # progress == 100
            project.status = 'completed'
            if not project.actual_completion_date:
                project.actual_completion_date = get_local_today()
        
        project.updated_at = get_local_now()
        db.session.commit()
        
        return jsonify({
            'message': 'Project progress updated successfully',
            'progress_percentage': project.progress_percentage,
            'status': project.status
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rd_projects_bp.route('/team-members', methods=['GET'])
@jwt_required()
def get_team_members():
    """Get available team members (users)"""
    try:
        users = User.query.filter_by(is_active=True).all()
        
        return jsonify({
            'team_members': [{
                'id': u.id,
                'username': u.username,
                'full_name': u.full_name,
                'email': u.email
            } for u in users]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
