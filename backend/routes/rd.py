from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, ResearchProject, Experiment, ProductDevelopment, RDMaterial, ResearchReport, Prototype, ProductTestResult
from utils.i18n import success_response, error_response, get_message
from utils import generate_number
from datetime import datetime
import json

# Import all R&D sub-blueprints
from .rd_projects import rd_projects_bp
from .rd_experiments import rd_experiments_bp
from .rd_products import rd_products_bp
from .rd_materials import rd_materials_bp
from .rd_reports import rd_reports_bp

rd_bp = Blueprint('rd', __name__)

# Register sub-blueprints
rd_bp.register_blueprint(rd_projects_bp, url_prefix='/projects')
rd_bp.register_blueprint(rd_experiments_bp, url_prefix='/experiments')
rd_bp.register_blueprint(rd_products_bp, url_prefix='/products')
rd_bp.register_blueprint(rd_materials_bp, url_prefix='/materials')
rd_bp.register_blueprint(rd_reports_bp, url_prefix='/reports')

# ===============================
# R&D DASHBOARD & OVERVIEW
# ===============================

@rd_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_rd_dashboard():
    """Get R&D dashboard overview"""
    try:
        # Projects summary
        total_projects = ResearchProject.query.count()
        active_projects = ResearchProject.query.filter(
            ResearchProject.status.in_(['planning', 'in_progress', 'testing'])
        ).count()
        completed_projects = ResearchProject.query.filter_by(status='completed').count()
        
        # Experiments summary
        total_experiments = Experiment.query.count()
        successful_experiments = Experiment.query.filter_by(success=True).count()
        
        # Product developments summary
        total_products = ProductDevelopment.query.count()
        launched_products = ProductDevelopment.query.filter_by(development_stage='launched').count()
        
        # Materials summary
        total_materials = RDMaterial.query.count()
        pending_materials = RDMaterial.query.filter_by(status='requested').count()
        
        # Reports summary
        total_reports = ResearchReport.query.count()
        published_reports = ResearchReport.query.filter_by(status='published').count()
        
        # Budget analysis
        total_budget = db.session.query(db.func.sum(ResearchProject.budget)).scalar() or 0
        total_spent = db.session.query(db.func.sum(ResearchProject.actual_cost)).scalar() or 0
        materials_cost = db.session.query(db.func.sum(RDMaterial.total_cost)).scalar() or 0
        
        # Recent activities
        recent_projects = ResearchProject.query.order_by(
            ResearchProject.created_at.desc()
        ).limit(5).all()
        
        recent_experiments = Experiment.query.order_by(
            Experiment.experiment_date.desc()
        ).limit(5).all()
        
        return jsonify({
            'summary': {
                'projects': {
                    'total': total_projects,
                    'active': active_projects,
                    'completed': completed_projects,
                    'completion_rate': (completed_projects / max(1, total_projects)) * 100
                },
                'experiments': {
                    'total': total_experiments,
                    'successful': successful_experiments,
                    'success_rate': (successful_experiments / max(1, total_experiments)) * 100
                },
                'products': {
                    'total': total_products,
                    'launched': launched_products,
                    'launch_rate': (launched_products / max(1, total_products)) * 100
                },
                'materials': {
                    'total': total_materials,
                    'pending': pending_materials
                },
                'reports': {
                    'total': total_reports,
                    'published': published_reports,
                    'publication_rate': (published_reports / max(1, total_reports)) * 100
                },
                'budget': {
                    'total_budget': float(total_budget),
                    'total_spent': float(total_spent),
                    'materials_cost': float(materials_cost),
                    'utilization_rate': (float(total_spent) / max(1, float(total_budget))) * 100
                }
            },
            'recent_projects': [{
                'id': p.id,
                'project_number': p.project_number,
                'project_name': p.project_name,
                'status': p.status,
                'created_at': p.created_at.isoformat()
            } for p in recent_projects],
            'recent_experiments': [{
                'id': e.id,
                'experiment_number': e.experiment_number,
                'experiment_name': e.experiment_name,
                'status': e.status,
                'success': e.success,
                'experiment_date': e.experiment_date.isoformat()
            } for e in recent_experiments]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rd_bp.route('/analytics', methods=['GET'])
@jwt_required(optional=True)
def get_rd_analytics():
    """Get comprehensive R&D analytics"""
    try:
        # Project status distribution
        project_status = db.session.query(
            ResearchProject.status,
            db.func.count(ResearchProject.id).label('count')
        ).group_by(ResearchProject.status).all()
        
        # Experiment counts
        total_experiments = Experiment.query.count()
        successful_experiments = Experiment.query.filter(Experiment.success == True).count()
        
        # Product development stages
        product_stages = db.session.query(
            ProductDevelopment.development_stage,
            db.func.count(ProductDevelopment.id).label('count')
        ).group_by(ProductDevelopment.development_stage).all()
        
        # Budget utilization by project
        budget_utilization = db.session.query(
            ResearchProject.project_name,
            ResearchProject.budget,
            ResearchProject.actual_cost
        ).filter(ResearchProject.budget > 0).limit(10).all()
        
        return jsonify({
            'project_status_distribution': [
                {'status': s.status or 'unknown', 'count': s.count}
                for s in project_status
            ],
            'experiment_summary': {
                'total': total_experiments,
                'successful': successful_experiments,
                'success_rate': (successful_experiments / max(1, total_experiments)) * 100
            },
            'product_development_stages': [
                {'stage': s.development_stage or 'unknown', 'count': s.count}
                for s in product_stages
            ],
            'budget_utilization': [
                {
                    'project_name': b.project_name,
                    'budget': float(b.budget or 0),
                    'actual_cost': float(b.actual_cost or 0),
                    'utilization_rate': (float(b.actual_cost or 0) / float(b.budget)) * 100 if b.budget else 0
                }
                for b in budget_utilization
            ]
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ===============================
# LEGACY ENDPOINTS (for backward compatibility)
# ===============================

@rd_bp.route('/projects', methods=['GET'])
@jwt_required()
def legacy_get_projects():
    """Legacy endpoint - redirects to new structure"""
    try:
        projects = ResearchProject.query.all()
        return jsonify({
            'projects': [{
                'id': p.id,
                'project_number': p.project_number,
                'project_name': p.project_name,
                'status': p.status,
                'priority': p.priority,
                'budget': float(p.budget),
                'actual_cost': float(p.actual_cost)
            } for p in projects]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
