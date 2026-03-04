"""
R&D (Research & Development) Routes
Manages product development lifecycle from lab scale to production validation

Workflow: LAB_SCALE → PILOT_SCALE → VALIDATION → COMPLETION
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from sqlalchemy import func, or_, and_

from models import db
from models.rnd import (
    RNDProject, RNDFormula, RNDFormulaItem, RNDExperiment,
    RNDApprovalLog, RNDConversionRecord,
    RNDProjectStage, RNDApprovalStatus, RNDExperimentStatus
)
from models.production import BillOfMaterials, BOMItem, Machine
from models.product import Product, Material
from models.user import User
from utils.timezone import get_local_now, get_local_today
from utils import generate_number

rnd_bp = Blueprint('rnd', __name__, url_prefix='/api/rnd')


# ==================== HELPER FUNCTIONS ====================

def generate_project_number():
    """Generate unique project number: RND-YYYYMM-XXXX"""
    today = get_local_today()
    prefix = f"RND-{today.strftime('%Y%m')}-"
    
    last_project = RNDProject.query.filter(
        RNDProject.project_number.like(f"{prefix}%")
    ).order_by(RNDProject.project_number.desc()).first()
    
    if last_project:
        last_num = int(last_project.project_number.split('-')[-1])
        new_num = last_num + 1
    else:
        new_num = 1
    
    return f"{prefix}{new_num:04d}"


def generate_experiment_number(formula_id):
    """Generate unique experiment number: EXP-FORMULAID-XXXX"""
    prefix = f"EXP-{formula_id}-"
    
    last_exp = RNDExperiment.query.filter(
        RNDExperiment.experiment_number.like(f"{prefix}%")
    ).order_by(RNDExperiment.experiment_number.desc()).first()
    
    if last_exp:
        last_num = int(last_exp.experiment_number.split('-')[-1])
        new_num = last_num + 1
    else:
        new_num = 1
    
    return f"{prefix}{new_num:04d}"


# ==================== PROJECT ROUTES ====================

@rnd_bp.route('/projects', methods=['GET'])
@jwt_required()
def get_projects():
    """Get all R&D projects with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '', type=str)
        stage = request.args.get('stage', '', type=str)
        project_type = request.args.get('project_type', '', type=str)
        priority = request.args.get('priority', '', type=str)
        
        query = RNDProject.query
        
        if search:
            query = query.filter(or_(
                RNDProject.project_number.ilike(f'%{search}%'),
                RNDProject.name.ilike(f'%{search}%'),
                RNDProject.target_product_name.ilike(f'%{search}%')
            ))
        
        if stage:
            query = query.filter(RNDProject.stage == stage)
        
        if project_type:
            query = query.filter(RNDProject.project_type == project_type)
        
        if priority:
            query = query.filter(RNDProject.priority == priority)
        
        query = query.order_by(RNDProject.created_at.desc())
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'projects': [p.to_dict() for p in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@rnd_bp.route('/projects/<int:id>', methods=['GET'])
@jwt_required()
def get_project(id):
    """Get single R&D project with details"""
    try:
        project = RNDProject.query.get(id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        return jsonify({
            'project': project.to_dict(include_formulas=True)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@rnd_bp.route('/projects', methods=['POST'])
@jwt_required()
def create_project():
    """Create new R&D project"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        project = RNDProject(
            project_number=generate_project_number(),
            name=data.get('name'),
            description=data.get('description'),
            project_type=data.get('project_type', 'new_product'),
            priority=data.get('priority', 'medium'),
            stage=RNDProjectStage.LAB_SCALE,
            target_product_id=data.get('target_product_id'),
            target_product_code=data.get('target_product_code'),
            target_product_name=data.get('target_product_name'),
            start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data.get('start_date') else get_local_today(),
            target_completion_date=datetime.strptime(data['target_completion_date'], '%Y-%m-%d').date() if data.get('target_completion_date') else None,
            estimated_budget=data.get('estimated_budget'),
            project_leader_id=data.get('project_leader_id'),
            created_by=user_id
        )
        
        db.session.add(project)
        db.session.commit()
        
        return jsonify({
            'message': 'Project created successfully',
            'project': project.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@rnd_bp.route('/projects/<int:id>', methods=['PUT'])
@jwt_required()
def update_project(id):
    """Update R&D project"""
    try:
        project = RNDProject.query.get(id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        if project.is_locked:
            return jsonify({'error': 'Project is locked and cannot be modified'}), 400
        
        data = request.get_json()
        
        project.name = data.get('name', project.name)
        project.description = data.get('description', project.description)
        project.project_type = data.get('project_type', project.project_type)
        project.priority = data.get('priority', project.priority)
        project.target_product_id = data.get('target_product_id', project.target_product_id)
        project.target_product_code = data.get('target_product_code', project.target_product_code)
        project.target_product_name = data.get('target_product_name', project.target_product_name)
        project.estimated_budget = data.get('estimated_budget', project.estimated_budget)
        project.project_leader_id = data.get('project_leader_id', project.project_leader_id)
        
        if data.get('start_date'):
            project.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        if data.get('target_completion_date'):
            project.target_completion_date = datetime.strptime(data['target_completion_date'], '%Y-%m-%d').date()
        
        project.updated_at = get_local_now()
        db.session.commit()
        
        return jsonify({
            'message': 'Project updated successfully',
            'project': project.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@rnd_bp.route('/projects/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_project(id):
    """Delete R&D project"""
    try:
        project = RNDProject.query.get(id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        if project.is_locked:
            return jsonify({'error': 'Project is locked and cannot be deleted'}), 400
        
        # Check if project has been converted
        conversion = RNDConversionRecord.query.filter_by(project_id=id).first()
        if conversion:
            return jsonify({'error': 'Project has been converted to production and cannot be deleted'}), 400
        
        db.session.delete(project)
        db.session.commit()
        
        return jsonify({'message': 'Project deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== STAGE TRANSITION ROUTES ====================

@rnd_bp.route('/projects/<int:id>/request-approval', methods=['POST'])
@jwt_required()
def request_stage_approval(id):
    """Request approval for stage transition"""
    try:
        user_id = get_jwt_identity()
        project = RNDProject.query.get(id)
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        if project.is_locked:
            return jsonify({'error': 'Project is locked'}), 400
        
        data = request.get_json()
        notes = data.get('notes', '')
        
        # Check if there's already a pending approval
        pending = RNDApprovalLog.query.filter_by(
            project_id=id,
            stage=project.stage,
            status=RNDApprovalStatus.PENDING
        ).first()
        
        if pending:
            return jsonify({'error': 'There is already a pending approval request for this stage'}), 400
        
        # Get next stage
        next_stage = RNDProjectStage.next_stage(project.stage)
        if not next_stage:
            return jsonify({'error': 'No next stage available'}), 400
        
        # Create approval request
        approval = RNDApprovalLog(
            project_id=id,
            stage=project.stage,
            from_stage=project.stage,
            to_stage=next_stage,
            status=RNDApprovalStatus.PENDING,
            notes=notes,
            requested_by=user_id,
            requested_at=get_local_now()
        )
        
        db.session.add(approval)
        db.session.commit()
        
        return jsonify({
            'message': 'Approval request submitted',
            'approval': approval.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@rnd_bp.route('/approvals/<int:id>/approve', methods=['POST'])
@jwt_required()
def approve_stage(id):
    """Approve stage transition"""
    try:
        user_id = get_jwt_identity()
        approval = RNDApprovalLog.query.get(id)
        
        if not approval:
            return jsonify({'error': 'Approval request not found'}), 404
        
        if approval.status != RNDApprovalStatus.PENDING:
            return jsonify({'error': 'Approval request is not pending'}), 400
        
        data = request.get_json()
        
        # Update approval
        approval.status = RNDApprovalStatus.APPROVED
        approval.approver_id = user_id
        approval.approved_at = get_local_now()
        approval.notes = data.get('notes', approval.notes)
        
        # Advance project stage
        project = approval.project
        if approval.to_stage:
            project.stage = approval.to_stage
            
            # If moving to COMPLETION, set completion date
            if approval.to_stage == RNDProjectStage.COMPLETION:
                project.actual_completion_date = get_local_today()
        
        project.updated_at = get_local_now()
        db.session.commit()
        
        return jsonify({
            'message': f'Project advanced to {project.stage}',
            'approval': approval.to_dict(),
            'project': project.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@rnd_bp.route('/approvals/<int:id>/reject', methods=['POST'])
@jwt_required()
def reject_stage(id):
    """Reject stage transition"""
    try:
        user_id = get_jwt_identity()
        approval = RNDApprovalLog.query.get(id)
        
        if not approval:
            return jsonify({'error': 'Approval request not found'}), 404
        
        if approval.status != RNDApprovalStatus.PENDING:
            return jsonify({'error': 'Approval request is not pending'}), 400
        
        data = request.get_json()
        
        approval.status = RNDApprovalStatus.REJECTED
        approval.approver_id = user_id
        approval.approved_at = get_local_now()
        approval.rejection_reason = data.get('rejection_reason', '')
        
        db.session.commit()
        
        return jsonify({
            'message': 'Approval request rejected',
            'approval': approval.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@rnd_bp.route('/approvals/pending', methods=['GET'])
@jwt_required()
def get_pending_approvals():
    """Get all pending approvals"""
    try:
        approvals = RNDApprovalLog.query.filter_by(
            status=RNDApprovalStatus.PENDING
        ).order_by(RNDApprovalLog.requested_at.desc()).all()
        
        return jsonify({
            'approvals': [a.to_dict() for a in approvals]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== FORMULA ROUTES ====================

@rnd_bp.route('/projects/<int:project_id>/formulas', methods=['GET'])
@jwt_required()
def get_formulas(project_id):
    """Get all formulas for a project"""
    try:
        formulas = RNDFormula.query.filter_by(project_id=project_id).order_by(RNDFormula.version).all()
        
        return jsonify({
            'formulas': [f.to_dict(include_items=True) for f in formulas]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@rnd_bp.route('/formulas/<int:id>', methods=['GET'])
@jwt_required()
def get_formula(id):
    """Get single formula with details"""
    try:
        formula = RNDFormula.query.get(id)
        if not formula:
            return jsonify({'error': 'Formula not found'}), 404
        
        return jsonify({
            'formula': formula.to_dict(include_items=True, include_experiments=True)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@rnd_bp.route('/projects/<int:project_id>/formulas', methods=['POST'])
@jwt_required()
def create_formula(project_id):
    """Create new formula for a project"""
    try:
        user_id = get_jwt_identity()
        project = RNDProject.query.get(project_id)
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        if project.is_locked:
            return jsonify({'error': 'Project is locked'}), 400
        
        data = request.get_json()
        
        # Generate version number
        existing_formulas = RNDFormula.query.filter_by(project_id=project_id).count()
        version = data.get('version', f'V{existing_formulas + 1}')
        
        formula = RNDFormula(
            project_id=project_id,
            version=version,
            name=data.get('name'),
            description=data.get('description'),
            batch_size=data.get('batch_size', 1),
            batch_uom=data.get('batch_uom', 'kg'),
            status='draft',
            created_by=user_id
        )
        
        db.session.add(formula)
        db.session.flush()
        
        # Add formula items if provided
        items = data.get('items', [])
        for i, item_data in enumerate(items):
            item = RNDFormulaItem(
                formula_id=formula.id,
                line_number=i + 1,
                material_id=item_data.get('material_id'),
                material_code=item_data.get('material_code'),
                material_name=item_data.get('material_name'),
                quantity=item_data.get('quantity', 0),
                uom=item_data.get('uom', 'kg'),
                unit_cost=item_data.get('unit_cost'),
                percentage=item_data.get('percentage'),
                scrap_percent=item_data.get('scrap_percent', 0),
                is_critical=item_data.get('is_critical', False),
                notes=item_data.get('notes')
            )
            db.session.add(item)
        
        db.session.commit()
        
        # Calculate cost
        formula.calculate_cost()
        db.session.commit()
        
        return jsonify({
            'message': 'Formula created successfully',
            'formula': formula.to_dict(include_items=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@rnd_bp.route('/formulas/<int:id>', methods=['PUT'])
@jwt_required()
def update_formula(id):
    """Update formula"""
    try:
        formula = RNDFormula.query.get(id)
        if not formula:
            return jsonify({'error': 'Formula not found'}), 404
        
        if formula.project.is_locked:
            return jsonify({'error': 'Project is locked'}), 400
        
        data = request.get_json()
        
        formula.name = data.get('name', formula.name)
        formula.description = data.get('description', formula.description)
        formula.batch_size = data.get('batch_size', formula.batch_size)
        formula.batch_uom = data.get('batch_uom', formula.batch_uom)
        formula.status = data.get('status', formula.status)
        formula.updated_at = get_local_now()
        
        # Update items if provided
        if 'items' in data:
            # Remove existing items
            RNDFormulaItem.query.filter_by(formula_id=id).delete()
            
            # Add new items
            for i, item_data in enumerate(data['items']):
                item = RNDFormulaItem(
                    formula_id=id,
                    line_number=i + 1,
                    material_id=item_data.get('material_id'),
                    material_code=item_data.get('material_code'),
                    material_name=item_data.get('material_name'),
                    quantity=item_data.get('quantity', 0),
                    uom=item_data.get('uom', 'kg'),
                    unit_cost=item_data.get('unit_cost'),
                    percentage=item_data.get('percentage'),
                    scrap_percent=item_data.get('scrap_percent', 0),
                    is_critical=item_data.get('is_critical', False),
                    notes=item_data.get('notes')
                )
                db.session.add(item)
        
        db.session.commit()
        
        # Recalculate cost
        formula.calculate_cost()
        db.session.commit()
        
        return jsonify({
            'message': 'Formula updated successfully',
            'formula': formula.to_dict(include_items=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@rnd_bp.route('/formulas/<int:id>/select', methods=['POST'])
@jwt_required()
def select_formula(id):
    """Select formula as the chosen one for production"""
    try:
        formula = RNDFormula.query.get(id)
        if not formula:
            return jsonify({'error': 'Formula not found'}), 404
        
        if formula.project.is_locked:
            return jsonify({'error': 'Project is locked'}), 400
        
        # Deselect all other formulas in the project
        RNDFormula.query.filter_by(project_id=formula.project_id).update({'is_selected': False})
        
        # Select this formula
        formula.is_selected = True
        formula.is_final_candidate = True
        formula.updated_at = get_local_now()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Formula selected successfully',
            'formula': formula.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@rnd_bp.route('/formulas/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_formula(id):
    """Delete formula"""
    try:
        formula = RNDFormula.query.get(id)
        if not formula:
            return jsonify({'error': 'Formula not found'}), 404
        
        if formula.project.is_locked:
            return jsonify({'error': 'Project is locked'}), 400
        
        if formula.is_selected:
            return jsonify({'error': 'Cannot delete selected formula'}), 400
        
        db.session.delete(formula)
        db.session.commit()
        
        return jsonify({'message': 'Formula deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== EXPERIMENT ROUTES ====================

@rnd_bp.route('/formulas/<int:formula_id>/experiments', methods=['GET'])
@jwt_required()
def get_experiments(formula_id):
    """Get all experiments for a formula"""
    try:
        experiments = RNDExperiment.query.filter_by(formula_id=formula_id).order_by(RNDExperiment.trial_date.desc()).all()
        
        return jsonify({
            'experiments': [e.to_dict() for e in experiments]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@rnd_bp.route('/experiments/<int:id>', methods=['GET'])
@jwt_required()
def get_experiment(id):
    """Get single experiment with details"""
    try:
        experiment = RNDExperiment.query.get(id)
        if not experiment:
            return jsonify({'error': 'Experiment not found'}), 404
        
        return jsonify({
            'experiment': experiment.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@rnd_bp.route('/formulas/<int:formula_id>/experiments', methods=['POST'])
@jwt_required()
def create_experiment(formula_id):
    """Create new experiment for a formula"""
    try:
        user_id = get_jwt_identity()
        formula = RNDFormula.query.get(formula_id)
        
        if not formula:
            return jsonify({'error': 'Formula not found'}), 404
        
        if formula.project.is_locked:
            return jsonify({'error': 'Project is locked'}), 400
        
        data = request.get_json()
        
        experiment = RNDExperiment(
            formula_id=formula_id,
            experiment_number=generate_experiment_number(formula_id),
            batch_number=data.get('batch_number'),
            trial_date=datetime.strptime(data['trial_date'], '%Y-%m-%d').date() if data.get('trial_date') else get_local_today(),
            machine_id=data.get('machine_id'),
            status=data.get('status', RNDExperimentStatus.PENDING),
            qc_results=data.get('qc_results'),
            quantity_produced=data.get('quantity_produced'),
            quantity_good=data.get('quantity_good'),
            quantity_rejected=data.get('quantity_rejected'),
            observations=data.get('observations'),
            issues_found=data.get('issues_found'),
            recommendations=data.get('recommendations'),
            conducted_by=user_id
        )
        
        # Calculate yield if quantities provided
        if experiment.quantity_produced and experiment.quantity_good:
            experiment.yield_percentage = (float(experiment.quantity_good) / float(experiment.quantity_produced)) * 100
        
        db.session.add(experiment)
        db.session.commit()
        
        return jsonify({
            'message': 'Experiment created successfully',
            'experiment': experiment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@rnd_bp.route('/experiments/<int:id>', methods=['PUT'])
@jwt_required()
def update_experiment(id):
    """Update experiment"""
    try:
        user_id = get_jwt_identity()
        experiment = RNDExperiment.query.get(id)
        
        if not experiment:
            return jsonify({'error': 'Experiment not found'}), 404
        
        if experiment.formula.project.is_locked:
            return jsonify({'error': 'Project is locked'}), 400
        
        data = request.get_json()
        
        experiment.batch_number = data.get('batch_number', experiment.batch_number)
        experiment.machine_id = data.get('machine_id', experiment.machine_id)
        experiment.status = data.get('status', experiment.status)
        experiment.qc_results = data.get('qc_results', experiment.qc_results)
        experiment.quantity_produced = data.get('quantity_produced', experiment.quantity_produced)
        experiment.quantity_good = data.get('quantity_good', experiment.quantity_good)
        experiment.quantity_rejected = data.get('quantity_rejected', experiment.quantity_rejected)
        experiment.observations = data.get('observations', experiment.observations)
        experiment.issues_found = data.get('issues_found', experiment.issues_found)
        experiment.recommendations = data.get('recommendations', experiment.recommendations)
        
        if data.get('trial_date'):
            experiment.trial_date = datetime.strptime(data['trial_date'], '%Y-%m-%d').date()
        
        # Recalculate yield
        if experiment.quantity_produced and experiment.quantity_good:
            experiment.yield_percentage = (float(experiment.quantity_good) / float(experiment.quantity_produced)) * 100
        
        # If status changed to PASSED/FAILED, record reviewer
        if data.get('status') in [RNDExperimentStatus.PASSED, RNDExperimentStatus.FAILED]:
            experiment.reviewed_by = user_id
            experiment.reviewed_at = get_local_now()
        
        experiment.updated_at = get_local_now()
        db.session.commit()
        
        return jsonify({
            'message': 'Experiment updated successfully',
            'experiment': experiment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@rnd_bp.route('/experiments/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_experiment(id):
    """Delete experiment"""
    try:
        experiment = RNDExperiment.query.get(id)
        if not experiment:
            return jsonify({'error': 'Experiment not found'}), 404
        
        if experiment.formula.project.is_locked:
            return jsonify({'error': 'Project is locked'}), 400
        
        db.session.delete(experiment)
        db.session.commit()
        
        return jsonify({'message': 'Experiment deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== CONVERSION TO PRODUCTION ====================

@rnd_bp.route('/projects/<int:id>/convert-to-production', methods=['POST'])
@jwt_required()
def convert_to_production_bom(id):
    """
    Convert R&D formula to Production BOM
    
    Validation:
    1. Project status must be VALIDATION
    2. Selected formula must have PASSED experiment
    3. Manager approval must be recorded
    
    Execution:
    1. Copy formula items to BillOfMaterials
    2. Create or update Product
    3. Change project status to COMPLETION
    4. Lock project record
    """
    try:
        user_id = get_jwt_identity()
        project = RNDProject.query.get(id)
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        if project.is_locked:
            return jsonify({'error': 'Project is already locked'}), 400
        
        # Validation 1: Check project stage
        if project.stage != RNDProjectStage.VALIDATION:
            return jsonify({
                'error': f'Project must be in VALIDATION stage. Current: {project.stage}'
            }), 400
        
        # Validation 2: Get selected formula
        selected_formula = RNDFormula.query.filter_by(
            project_id=id,
            is_selected=True
        ).first()
        
        if not selected_formula:
            return jsonify({'error': 'No formula selected for this project'}), 400
        
        # Validation 3: Check for passed experiment
        passed_experiment = RNDExperiment.query.filter_by(
            formula_id=selected_formula.id,
            status=RNDExperimentStatus.PASSED
        ).order_by(RNDExperiment.created_at.desc()).first()
        
        if not passed_experiment:
            return jsonify({'error': 'Selected formula has no passed experiments'}), 400
        
        # Validation 4: Check for approval
        approval = RNDApprovalLog.query.filter_by(
            project_id=id,
            stage=RNDProjectStage.VALIDATION,
            status=RNDApprovalStatus.APPROVED
        ).first()
        
        if not approval:
            return jsonify({'error': 'Manager approval required for VALIDATION stage'}), 400
        
        data = request.get_json() or {}
        
        # Get or create product
        product = None
        if project.target_product_id:
            product = Product.query.get(project.target_product_id)
        
        if not product:
            # Create new product
            product_code = project.target_product_code or f"PRD-{project.project_number}"
            product_name = project.target_product_name or project.name
            
            product = Product(
                code=product_code,
                name=product_name,
                description=f"Created from R&D Project: {project.project_number}",
                material_type='finished_goods',
                primary_uom=selected_formula.batch_uom,
                is_active=True,
                is_producible=True
            )
            db.session.add(product)
            db.session.flush()
            
            project.target_product_id = product.id
        
        # Generate BOM number
        bom_number = f"BOM-{product.code}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Create BOM
        bom = BillOfMaterials(
            bom_number=bom_number,
            product_id=product.id,
            version='1.0',
            is_active=True,
            effective_date=get_local_today(),
            batch_size=selected_formula.batch_size,
            batch_uom=selected_formula.batch_uom,
            notes=f"Created from R&D Project: {project.project_number}, Formula: {selected_formula.version}",
            created_by=user_id
        )
        db.session.add(bom)
        db.session.flush()
        
        # Copy formula items to BOM items
        for formula_item in selected_formula.items:
            bom_item = BOMItem(
                bom_id=bom.id,
                line_number=formula_item.line_number,
                material_id=formula_item.material_id,
                quantity=formula_item.quantity,
                uom=formula_item.uom,
                scrap_percent=formula_item.scrap_percent,
                is_critical=formula_item.is_critical,
                unit_cost=formula_item.unit_cost,
                notes=formula_item.notes
            )
            db.session.add(bom_item)
        
        # Create conversion record
        conversion = RNDConversionRecord(
            project_id=id,
            formula_id=selected_formula.id,
            product_id=product.id,
            bom_id=bom.id,
            conversion_date=get_local_now(),
            converted_by=user_id,
            notes=data.get('notes', '')
        )
        db.session.add(conversion)
        
        # Update project status
        project.stage = RNDProjectStage.COMPLETION
        project.actual_completion_date = get_local_today()
        project.is_locked = True
        project.updated_at = get_local_now()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Successfully converted to Production BOM',
            'conversion': conversion.to_dict(),
            'product': {
                'id': product.id,
                'code': product.code,
                'name': product.name
            },
            'bom': {
                'id': bom.id,
                'bom_number': bom.bom_number
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@rnd_bp.route('/conversions', methods=['GET'])
@jwt_required()
def get_conversions():
    """Get all conversion records"""
    try:
        conversions = RNDConversionRecord.query.order_by(RNDConversionRecord.conversion_date.desc()).all()
        
        return jsonify({
            'conversions': [c.to_dict() for c in conversions]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== DASHBOARD & STATS ====================

@rnd_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """Get R&D dashboard statistics"""
    try:
        # Project counts by stage
        stage_counts = db.session.query(
            RNDProject.stage,
            func.count(RNDProject.id)
        ).group_by(RNDProject.stage).all()
        
        projects_by_stage = {stage: count for stage, count in stage_counts}
        
        # Total projects
        total_projects = RNDProject.query.count()
        active_projects = RNDProject.query.filter(
            RNDProject.stage.in_(RNDProjectStage.active_stages())
        ).count()
        completed_projects = RNDProject.query.filter_by(stage=RNDProjectStage.COMPLETION).count()
        
        # Recent experiments
        recent_experiments = RNDExperiment.query.order_by(
            RNDExperiment.created_at.desc()
        ).limit(5).all()
        
        # Pending approvals
        pending_approvals = RNDApprovalLog.query.filter_by(
            status=RNDApprovalStatus.PENDING
        ).count()
        
        # Recent conversions
        recent_conversions = RNDConversionRecord.query.order_by(
            RNDConversionRecord.conversion_date.desc()
        ).limit(5).all()
        
        return jsonify({
            'total_projects': total_projects,
            'active_projects': active_projects,
            'completed_projects': completed_projects,
            'projects_by_stage': projects_by_stage,
            'pending_approvals': pending_approvals,
            'recent_experiments': [e.to_dict() for e in recent_experiments],
            'recent_conversions': [c.to_dict() for c in recent_conversions]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== LOOKUP DATA ====================

@rnd_bp.route('/machines', methods=['GET'])
@jwt_required()
def get_machines():
    """Get available machines for experiments"""
    try:
        machines = Machine.query.filter_by(is_active=True).all()
        
        return jsonify({
            'machines': [{
                'id': m.id,
                'code': m.code,
                'name': m.name,
                'machine_type': m.machine_type
            } for m in machines]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@rnd_bp.route('/materials', methods=['GET'])
@jwt_required()
def get_materials():
    """Get available materials for formulas"""
    try:
        search = request.args.get('search', '', type=str)
        
        query = Material.query.filter_by(is_active=True)
        
        if search:
            query = query.filter(or_(
                Material.code.ilike(f'%{search}%'),
                Material.name.ilike(f'%{search}%')
            ))
        
        materials = query.limit(50).all()
        
        return jsonify({
            'materials': [{
                'id': m.id,
                'code': m.code,
                'name': m.name,
                'material_type': m.material_type,
                'primary_uom': m.primary_uom,
                'cost_per_unit': float(m.cost_per_unit) if m.cost_per_unit else None
            } for m in materials]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@rnd_bp.route('/products', methods=['GET'])
@jwt_required()
def get_products():
    """Get available products for linking"""
    try:
        search = request.args.get('search', '', type=str)
        
        query = Product.query.filter_by(is_active=True)
        
        if search:
            query = query.filter(or_(
                Product.code.ilike(f'%{search}%'),
                Product.name.ilike(f'%{search}%')
            ))
        
        products = query.limit(50).all()
        
        return jsonify({
            'products': [{
                'id': p.id,
                'code': p.code,
                'name': p.name,
                'primary_uom': p.primary_uom
            } for p in products]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
