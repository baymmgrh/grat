from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Experiment, ResearchProject, User
from utils.i18n import success_response, error_response, get_message
from utils import generate_number
from datetime import datetime, date, time
from sqlalchemy import or_
import json
from utils.timezone import get_local_now, get_local_today

rd_experiments_bp = Blueprint('rd_experiments', __name__)

# ===============================
# EXPERIMENTS MANAGEMENT
# ===============================

@rd_experiments_bp.route('/', methods=['GET'])
@jwt_required()
def get_experiments():
    """Get all experiments with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        project_id = request.args.get('project_id', type=int)
        status = request.args.get('status')
        experiment_type = request.args.get('experiment_type')
        search = request.args.get('search')
        
        query = Experiment.query
        
        # Apply filters
        if project_id:
            query = query.filter(Experiment.project_id == project_id)
        if status:
            query = query.filter(Experiment.status == status)
        if experiment_type:
            query = query.filter(Experiment.experiment_type == experiment_type)
        if search:
            query = query.filter(
                or_(
                    Experiment.experiment_name.ilike(f'%{search}%'),
                    Experiment.experiment_number.ilike(f'%{search}%'),
                    Experiment.hypothesis.ilike(f'%{search}%')
                )
            )
        
        experiments = query.order_by(Experiment.experiment_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'experiments': [{
                'id': e.id,
                'experiment_number': e.experiment_number,
                'experiment_name': e.experiment_name,
                'experiment_type': e.experiment_type,
                'project_id': e.project_id,
                'project_name': e.project.project_name if e.project else None,
                'hypothesis': e.hypothesis,
                'methodology': e.methodology,
                'experiment_date': e.experiment_date.isoformat(),
                'start_time': e.start_time.isoformat() if e.start_time else None,
                'end_time': e.end_time.isoformat() if e.end_time else None,
                'duration_hours': float(e.duration_hours) if e.duration_hours else None,
                'status': e.status,
                'success': e.success,
                'success_rate': float(e.success_rate) if e.success_rate else None,
                'conducted_by': e.conducted_by_user.username if e.conducted_by_user else None,
                'reviewed_by': e.reviewed_by_user.username if e.reviewed_by_user else None,
                'reviewed_at': e.reviewed_at.isoformat() if e.reviewed_at else None,
                'created_at': e.created_at.isoformat(),
                'updated_at': e.updated_at.isoformat() if e.updated_at else None
            } for e in experiments.items],
            'total': experiments.total,
            'pages': experiments.pages,
            'current_page': experiments.page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rd_experiments_bp.route('/', methods=['POST'])
@jwt_required()
def create_experiment():
    """Create new experiment"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Generate experiment number
        experiment_number = generate_number('EXP', Experiment, 'experiment_number')
        
        # Parse date and times
        experiment_date = datetime.strptime(data['experiment_date'], '%Y-%m-%d').date()
        start_time = None
        end_time = None
        
        if data.get('start_time'):
            start_time = datetime.strptime(data['start_time'], '%H:%M').time()
        if data.get('end_time'):
            end_time = datetime.strptime(data['end_time'], '%H:%M').time()
        
        # Create experiment
        experiment = Experiment(
            experiment_number=experiment_number,
            project_id=data['project_id'],
            experiment_name=data['experiment_name'],
            experiment_type=data.get('experiment_type', 'laboratory'),
            hypothesis=data.get('hypothesis'),
            methodology=data.get('methodology'),
            experiment_date=experiment_date,
            start_time=start_time,
            end_time=end_time,
            duration_hours=data.get('duration_hours'),
            conditions=json.dumps(data.get('conditions', {})),
            equipment_used=json.dumps(data.get('equipment_used', [])),
            parameters=json.dumps(data.get('parameters', {})),
            conducted_by=data.get('conducted_by', user_id),
            status=data.get('status', 'planned')
        )
        
        db.session.add(experiment)
        db.session.commit()
        
        return jsonify({
            'message': 'Experiment created successfully',
            'experiment_id': experiment.id,
            'experiment_number': experiment_number
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rd_experiments_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_experiment(id):
    """Get experiment details"""
    try:
        experiment = Experiment.query.get_or_404(id)
        
        return jsonify({
            'id': experiment.id,
            'experiment_number': experiment.experiment_number,
            'experiment_name': experiment.experiment_name,
            'experiment_type': experiment.experiment_type,
            'project_id': experiment.project_id,
            'project_name': experiment.project.project_name if experiment.project else None,
            'hypothesis': experiment.hypothesis,
            'methodology': experiment.methodology,
            'experiment_date': experiment.experiment_date.isoformat(),
            'start_time': experiment.start_time.isoformat() if experiment.start_time else None,
            'end_time': experiment.end_time.isoformat() if experiment.end_time else None,
            'duration_hours': float(experiment.duration_hours) if experiment.duration_hours else None,
            'conditions': json.loads(experiment.conditions) if experiment.conditions else {},
            'equipment_used': json.loads(experiment.equipment_used) if experiment.equipment_used else [],
            'parameters': json.loads(experiment.parameters) if experiment.parameters else {},
            'observations': experiment.observations,
            'results': experiment.results,
            'data_collected': json.loads(experiment.data_collected) if experiment.data_collected else {},
            'conclusion': experiment.conclusion,
            'success': experiment.success,
            'success_rate': float(experiment.success_rate) if experiment.success_rate else None,
            'status': experiment.status,
            'conducted_by': experiment.conducted_by,
            'conducted_by_name': experiment.conducted_by_user.username if experiment.conducted_by_user else None,
            'reviewed_by': experiment.reviewed_by,
            'reviewed_by_name': experiment.reviewed_by_user.username if experiment.reviewed_by_user else None,
            'reviewed_at': experiment.reviewed_at.isoformat() if experiment.reviewed_at else None,
            'attachments': json.loads(experiment.attachments) if experiment.attachments else [],
            'materials_count': len(experiment.materials),
            'created_at': experiment.created_at.isoformat(),
            'updated_at': experiment.updated_at.isoformat() if experiment.updated_at else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rd_experiments_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_experiment(id):
    """Update experiment"""
    try:
        experiment = Experiment.query.get_or_404(id)
        data = request.get_json()
        
        # Update fields
        if 'experiment_name' in data:
            experiment.experiment_name = data['experiment_name']
        if 'experiment_type' in data:
            experiment.experiment_type = data['experiment_type']
        if 'hypothesis' in data:
            experiment.hypothesis = data['hypothesis']
        if 'methodology' in data:
            experiment.methodology = data['methodology']
        if 'duration_hours' in data:
            experiment.duration_hours = data['duration_hours']
        if 'conditions' in data:
            experiment.conditions = json.dumps(data['conditions'])
        if 'equipment_used' in data:
            experiment.equipment_used = json.dumps(data['equipment_used'])
        if 'parameters' in data:
            experiment.parameters = json.dumps(data['parameters'])
        if 'observations' in data:
            experiment.observations = data['observations']
        if 'results' in data:
            experiment.results = data['results']
        if 'data_collected' in data:
            experiment.data_collected = json.dumps(data['data_collected'])
        if 'conclusion' in data:
            experiment.conclusion = data['conclusion']
        if 'success' in data:
            experiment.success = data['success']
        if 'success_rate' in data:
            experiment.success_rate = data['success_rate']
        if 'status' in data:
            experiment.status = data['status']
        if 'conducted_by' in data:
            experiment.conducted_by = data['conducted_by']
        if 'attachments' in data:
            experiment.attachments = json.dumps(data['attachments'])
        
        # Update dates and times
        if 'experiment_date' in data and data['experiment_date']:
            experiment.experiment_date = datetime.strptime(data['experiment_date'], '%Y-%m-%d').date()
        if 'start_time' in data and data['start_time']:
            experiment.start_time = datetime.strptime(data['start_time'], '%H:%M').time()
        if 'end_time' in data and data['end_time']:
            experiment.end_time = datetime.strptime(data['end_time'], '%H:%M').time()
        
        experiment.updated_at = get_local_now()
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rd_experiments_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_experiment(id):
    """Delete experiment"""
    try:
        experiment = Experiment.query.get_or_404(id)
        
        # Check if experiment has related materials
        if experiment.materials:
            return jsonify({
                'error': 'Cannot delete experiment with related materials'
            }), 400
        
        db.session.delete(experiment)
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rd_experiments_bp.route('/<int:id>/review', methods=['POST'])
@jwt_required()
def review_experiment(id):
    """Review experiment results"""
    try:
        experiment = Experiment.query.get_or_404(id)
        data = request.get_json()
        user_id = get_jwt_identity()
        
        experiment.reviewed_by = user_id
        experiment.reviewed_at = get_local_now()
        
        if 'success' in data:
            experiment.success = data['success']
        if 'success_rate' in data:
            experiment.success_rate = data['success_rate']
        if 'conclusion' in data:
            experiment.conclusion = data['conclusion']
        
        # Update status based on review
        if data.get('approved', False):
            experiment.status = 'completed'
        elif data.get('rejected', False):
            experiment.status = 'failed'
        
        experiment.updated_at = get_local_now()
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rd_experiments_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_experiments_analytics():
    """Get experiments analytics"""
    try:
        project_id = request.args.get('project_id', type=int)
        
        query = Experiment.query
        if project_id:
            query = query.filter(Experiment.project_id == project_id)
        
        # Basic counts
        total_experiments = query.count()
        completed_experiments = query.filter_by(status='completed').count()
        successful_experiments = query.filter_by(success=True).count()
        failed_experiments = query.filter_by(status='failed').count()
        
        # Status distribution
        status_stats = db.session.query(
            Experiment.status,
            db.func.count(Experiment.id).label('count')
        )
        if project_id:
            status_stats = status_stats.filter(Experiment.project_id == project_id)
        status_stats = status_stats.group_by(Experiment.status).all()
        
        # Type distribution
        type_stats = db.session.query(
            Experiment.experiment_type,
            db.func.count(Experiment.id).label('count')
        )
        if project_id:
            type_stats = type_stats.filter(Experiment.project_id == project_id)
        type_stats = type_stats.group_by(Experiment.experiment_type).all()
        
        # Success rate by type
        success_by_type = db.session.query(
            Experiment.experiment_type,
            db.func.count(Experiment.id).label('total'),
            db.func.sum(db.case([(Experiment.success == True, 1)], else_=0)).label('successful')
        )
        if project_id:
            success_by_type = success_by_type.filter(Experiment.project_id == project_id)
        success_by_type = success_by_type.group_by(Experiment.experiment_type).all()
        
        # Monthly experiment trends
        monthly_experiments = db.session.query(
            db.func.strftime('%Y-%m', Experiment.experiment_date).label('month'),
            db.func.count(Experiment.id).label('count')
        )
        if project_id:
            monthly_experiments = monthly_experiments.filter(Experiment.project_id == project_id)
        monthly_experiments = monthly_experiments.group_by('month').order_by('month').limit(12).all()
        
        return jsonify({
            'summary': {
                'total_experiments': total_experiments,
                'completed_experiments': completed_experiments,
                'successful_experiments': successful_experiments,
                'failed_experiments': failed_experiments,
                'success_rate': (successful_experiments / max(1, completed_experiments)) * 100,
                'completion_rate': (completed_experiments / max(1, total_experiments)) * 100
            },
            'status_distribution': [
                {'status': s.status, 'count': s.count}
                for s in status_stats
            ],
            'type_distribution': [
                {'type': t.experiment_type, 'count': t.count}
                for t in type_stats
            ],
            'success_by_type': [
                {
                    'type': s.experiment_type,
                    'total': s.total,
                    'successful': s.successful,
                    'success_rate': (s.successful / max(1, s.total)) * 100
                }
                for s in success_by_type
            ],
            'monthly_trends': [
                {'month': m.month, 'count': m.count}
                for m in monthly_experiments
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rd_experiments_bp.route('/projects', methods=['GET'])
@jwt_required()
def get_projects_for_experiments():
    """Get available projects for experiments"""
    try:
        projects = ResearchProject.query.filter(
            ResearchProject.status.in_(['planning', 'in_progress', 'testing'])
        ).all()
        
        return jsonify({
            'projects': [{
                'id': p.id,
                'project_number': p.project_number,
                'project_name': p.project_name,
                'status': p.status
            } for p in projects]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
