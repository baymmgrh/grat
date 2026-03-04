from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, ResearchReport, ResearchProject, User
from utils.i18n import success_response, error_response, get_message
from utils import generate_number
from datetime import datetime, date
from sqlalchemy import or_
import json
from utils.timezone import get_local_now, get_local_today

rd_reports_bp = Blueprint('rd_reports', __name__)

# ===============================
# RESEARCH REPORTS MANAGEMENT
# ===============================

@rd_reports_bp.route('/', methods=['GET'])
@jwt_required()
def get_reports():
    """Get all research reports with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        project_id = request.args.get('project_id', type=int)
        report_type = request.args.get('report_type')
        status = request.args.get('status')
        search = request.args.get('search')
        
        query = ResearchReport.query
        
        # Apply filters
        if project_id:
            query = query.filter(ResearchReport.project_id == project_id)
        if report_type:
            query = query.filter(ResearchReport.report_type == report_type)
        if status:
            query = query.filter(ResearchReport.status == status)
        if search:
            query = query.filter(
                or_(
                    ResearchReport.report_title.ilike(f'%{search}%'),
                    ResearchReport.report_number.ilike(f'%{search}%'),
                    ResearchReport.executive_summary.ilike(f'%{search}%')
                )
            )
        
        reports = query.order_by(ResearchReport.report_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'reports': [{
                'id': r.id,
                'report_number': r.report_number,
                'report_title': r.report_title,
                'report_type': r.report_type,
                'project_id': r.project_id,
                'project_name': r.project.project_name if r.project else None,
                'report_date': r.report_date.isoformat(),
                'period_from': r.period_from.isoformat() if r.period_from else None,
                'period_to': r.period_to.isoformat() if r.period_to else None,
                'status': r.status,
                'prepared_by': r.prepared_by_user.username if r.prepared_by_user else None,
                'reviewed_by': r.reviewed_by_user.username if r.reviewed_by_user else None,
                'approved_by': r.approved_by_user.username if r.approved_by_user else None,
                'reviewed_at': r.reviewed_at.isoformat() if r.reviewed_at else None,
                'approved_at': r.approved_at.isoformat() if r.approved_at else None,
                'created_at': r.created_at.isoformat(),
                'updated_at': r.updated_at.isoformat() if r.updated_at else None
            } for r in reports.items],
            'total': reports.total,
            'pages': reports.pages,
            'current_page': reports.page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rd_reports_bp.route('/', methods=['POST'])
@jwt_required()
def create_report():
    """Create new research report"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Generate report number
        report_number = generate_number('RPT', ResearchReport, 'report_number')
        
        # Parse dates
        report_date = datetime.strptime(data['report_date'], '%Y-%m-%d').date()
        period_from = None
        period_to = None
        
        if data.get('period_from'):
            period_from = datetime.strptime(data['period_from'], '%Y-%m-%d').date()
        if data.get('period_to'):
            period_to = datetime.strptime(data['period_to'], '%Y-%m-%d').date()
        
        # Create report
        report = ResearchReport(
            report_number=report_number,
            project_id=data['project_id'],
            report_title=data['report_title'],
            report_type=data['report_type'],
            report_date=report_date,
            period_from=period_from,
            period_to=period_to,
            executive_summary=data.get('executive_summary'),
            objectives=data.get('objectives'),
            methodology=data.get('methodology'),
            findings=data.get('findings'),
            conclusions=data.get('conclusions'),
            recommendations=data.get('recommendations'),
            future_work=data.get('future_work'),
            budget_utilization=data.get('budget_utilization'),
            challenges_faced=data.get('challenges_faced'),
            achievements=data.get('achievements'),
            attachments=json.dumps(data.get('attachments', [])),
            status=data.get('status', 'draft'),
            prepared_by=user_id
        )
        
        db.session.add(report)
        db.session.commit()
        
        return jsonify({
            'message': 'Research report created successfully',
            'report_id': report.id,
            'report_number': report_number
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rd_reports_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_report(id):
    """Get report details"""
    try:
        report = ResearchReport.query.get_or_404(id)
        
        return jsonify({
            'id': report.id,
            'report_number': report.report_number,
            'report_title': report.report_title,
            'report_type': report.report_type,
            'project_id': report.project_id,
            'project_name': report.project.project_name if report.project else None,
            'report_date': report.report_date.isoformat(),
            'period_from': report.period_from.isoformat() if report.period_from else None,
            'period_to': report.period_to.isoformat() if report.period_to else None,
            'executive_summary': report.executive_summary,
            'objectives': report.objectives,
            'methodology': report.methodology,
            'findings': report.findings,
            'conclusions': report.conclusions,
            'recommendations': report.recommendations,
            'future_work': report.future_work,
            'budget_utilization': report.budget_utilization,
            'challenges_faced': report.challenges_faced,
            'achievements': report.achievements,
            'attachments': json.loads(report.attachments) if report.attachments else [],
            'status': report.status,
            'prepared_by': report.prepared_by,
            'prepared_by_name': report.prepared_by_user.username if report.prepared_by_user else None,
            'reviewed_by': report.reviewed_by,
            'reviewed_by_name': report.reviewed_by_user.username if report.reviewed_by_user else None,
            'approved_by': report.approved_by,
            'approved_by_name': report.approved_by_user.username if report.approved_by_user else None,
            'reviewed_at': report.reviewed_at.isoformat() if report.reviewed_at else None,
            'approved_at': report.approved_at.isoformat() if report.approved_at else None,
            'created_at': report.created_at.isoformat(),
            'updated_at': report.updated_at.isoformat() if report.updated_at else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rd_reports_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_report(id):
    """Update report"""
    try:
        report = ResearchReport.query.get_or_404(id)
        data = request.get_json()
        
        # Check if user can edit this report
        user_id = get_jwt_identity()
        if report.prepared_by != user_id and report.status not in ['draft', 'review']:
            return jsonify(error_response('api.error', error_code=403)), 403
        
        # Update fields
        if 'report_title' in data:
            report.report_title = data['report_title']
        if 'report_type' in data:
            report.report_type = data['report_type']
        if 'executive_summary' in data:
            report.executive_summary = data['executive_summary']
        if 'objectives' in data:
            report.objectives = data['objectives']
        if 'methodology' in data:
            report.methodology = data['methodology']
        if 'findings' in data:
            report.findings = data['findings']
        if 'conclusions' in data:
            report.conclusions = data['conclusions']
        if 'recommendations' in data:
            report.recommendations = data['recommendations']
        if 'future_work' in data:
            report.future_work = data['future_work']
        if 'budget_utilization' in data:
            report.budget_utilization = data['budget_utilization']
        if 'challenges_faced' in data:
            report.challenges_faced = data['challenges_faced']
        if 'achievements' in data:
            report.achievements = data['achievements']
        if 'attachments' in data:
            report.attachments = json.dumps(data['attachments'])
        if 'status' in data:
            report.status = data['status']
        
        # Update dates
        if 'report_date' in data and data['report_date']:
            report.report_date = datetime.strptime(data['report_date'], '%Y-%m-%d').date()
        if 'period_from' in data and data['period_from']:
            report.period_from = datetime.strptime(data['period_from'], '%Y-%m-%d').date()
        if 'period_to' in data and data['period_to']:
            report.period_to = datetime.strptime(data['period_to'], '%Y-%m-%d').date()
        
        report.updated_at = get_local_now()
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rd_reports_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_report(id):
    """Delete report"""
    try:
        report = ResearchReport.query.get_or_404(id)
        user_id = get_jwt_identity()
        
        # Check if user can delete this report
        if report.prepared_by != user_id and report.status not in ['draft']:
            return jsonify(error_response('api.error', error_code=403)), 403
        
        db.session.delete(report)
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rd_reports_bp.route('/<int:id>/review', methods=['POST'])
@jwt_required()
def review_report(id):
    """Review report"""
    try:
        report = ResearchReport.query.get_or_404(id)
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if report.status != 'review':
            return jsonify(error_response('api.error', error_code=400)), 400
        
        report.reviewed_by = user_id
        report.reviewed_at = get_local_now()
        
        if data.get('approved', False):
            report.status = 'approved'
        elif data.get('rejected', False):
            report.status = 'draft'  # Send back to draft for revision
        
        report.updated_at = get_local_now()
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rd_reports_bp.route('/<int:id>/approve', methods=['POST'])
@jwt_required()
def approve_report(id):
    """Approve report for publication"""
    try:
        report = ResearchReport.query.get_or_404(id)
        user_id = get_jwt_identity()
        
        if report.status != 'approved':
            return jsonify(error_response('api.error', error_code=400)), 400
        
        report.approved_by = user_id
        report.approved_at = get_local_now()
        report.status = 'published'
        
        report.updated_at = get_local_now()
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rd_reports_bp.route('/<int:id>/submit', methods=['POST'])
@jwt_required()
def submit_report(id):
    """Submit report for review"""
    try:
        report = ResearchReport.query.get_or_404(id)
        user_id = get_jwt_identity()
        
        if report.prepared_by != user_id:
            return jsonify(error_response('api.error', error_code=403)), 403
        
        if report.status != 'draft':
            return jsonify(error_response('api.error', error_code=400)), 400
        
        report.status = 'review'
        report.updated_at = get_local_now()
        
        db.session.commit()
        
        return jsonify(success_response('api.success')), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rd_reports_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_reports_analytics():
    """Get reports analytics"""
    try:
        project_id = request.args.get('project_id', type=int)
        
        query = ResearchReport.query
        if project_id:
            query = query.filter(ResearchReport.project_id == project_id)
        
        # Basic counts
        total_reports = query.count()
        draft_reports = query.filter_by(status='draft').count()
        published_reports = query.filter_by(status='published').count()
        
        # Type distribution
        type_stats = db.session.query(
            ResearchReport.report_type,
            db.func.count(ResearchReport.id).label('count')
        )
        if project_id:
            type_stats = type_stats.filter(ResearchReport.project_id == project_id)
        type_stats = type_stats.group_by(ResearchReport.report_type).all()
        
        # Status distribution
        status_stats = db.session.query(
            ResearchReport.status,
            db.func.count(ResearchReport.id).label('count')
        )
        if project_id:
            status_stats = status_stats.filter(ResearchReport.project_id == project_id)
        status_stats = status_stats.group_by(ResearchReport.status).all()
        
        # Monthly report trends
        monthly_reports = db.session.query(
            db.func.strftime('%Y-%m', ResearchReport.report_date).label('month'),
            db.func.count(ResearchReport.id).label('count')
        )
        if project_id:
            monthly_reports = monthly_reports.filter(ResearchReport.project_id == project_id)
        monthly_reports = monthly_reports.group_by('month').order_by('month').limit(12).all()
        
        return jsonify({
            'summary': {
                'total_reports': total_reports,
                'draft_reports': draft_reports,
                'published_reports': published_reports,
                'publication_rate': (published_reports / max(1, total_reports)) * 100
            },
            'type_distribution': [
                {'type': t.report_type, 'count': t.count}
                for t in type_stats
            ],
            'status_distribution': [
                {'status': s.status, 'count': s.count}
                for s in status_stats
            ],
            'monthly_trends': [
                {'month': m.month, 'count': m.count}
                for m in monthly_reports
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rd_reports_bp.route('/projects', methods=['GET'])
@jwt_required()
def get_projects_for_reports():
    """Get available projects for reports"""
    try:
        projects = ResearchProject.query.all()
        
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
