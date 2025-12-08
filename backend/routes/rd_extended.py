from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.hr import Employee, Department
from utils.i18n import success_response, error_response, get_message
from utils import generate_number
from datetime import datetime
from sqlalchemy import func, desc

rd_extended_bp = Blueprint('rd_extended', __name__)

# R&D Reports Endpoints
@rd_extended_bp.route('/reports', methods=['GET'])
@jwt_required()
def get_rd_reports():
    try:
        report_type = request.args.get('report_type', 'overview')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        project_id = request.args.get('project_id')
        project_type = request.args.get('project_type')
        department = request.args.get('department')
        status = request.args.get('status')
        
        # Mock data for comprehensive R&D reporting
        # In real implementation, this would query actual project data
        
        summary = {
            'total_projects': 24,
            'active_projects': 8,
            'completed_projects': 12,
            'total_budget': 2500000000,  # 2.5B IDR
            'budget_utilized': 1875000000,  # 1.875B IDR
            'average_duration': 156,  # days
            'success_rate': 75.0,
            'roi': 18.5
        }
        
        # Chart data
        projects_by_type = [
            {'name': 'Research', 'value': 8, 'color': '#3B82F6'},
            {'name': 'Development', 'value': 10, 'color': '#10B981'},
            {'name': 'Innovation', 'value': 4, 'color': '#F59E0B'},
            {'name': 'Improvement', 'value': 2, 'color': '#EF4444'}
        ]
        
        projects_by_status = [
            {'name': 'Planning', 'value': 3, 'color': '#6B7280'},
            {'name': 'Active', 'value': 8, 'color': '#3B82F6'},
            {'name': 'On Hold', 'value': 1, 'color': '#F59E0B'},
            {'name': 'Completed', 'value': 12, 'color': '#10B981'}
        ]
        
        budget_utilization = [
            {'month': 'Jan', 'allocated': 200000000, 'spent': 150000000, 'projects': 2},
            {'month': 'Feb', 'allocated': 250000000, 'spent': 200000000, 'projects': 3},
            {'month': 'Mar', 'allocated': 300000000, 'spent': 275000000, 'projects': 4},
            {'month': 'Apr', 'allocated': 280000000, 'spent': 220000000, 'projects': 3},
            {'month': 'May', 'allocated': 320000000, 'spent': 290000000, 'projects': 5},
            {'month': 'Jun', 'allocated': 350000000, 'spent': 315000000, 'projects': 4}
        ]
        
        completion_trends = [
            {'month': 'Jan', 'completed': 2, 'started': 3},
            {'month': 'Feb', 'completed': 1, 'started': 2},
            {'month': 'Mar', 'completed': 3, 'started': 4},
            {'month': 'Apr', 'completed': 2, 'started': 1},
            {'month': 'May', 'completed': 2, 'started': 3},
            {'month': 'Jun', 'completed': 2, 'started': 2}
        ]
        
        department_performance = [
            {'department': 'R&D Engineering', 'projects': 8, 'budget': 800000000, 'success_rate': 87.5},
            {'department': 'Product Development', 'projects': 6, 'budget': 600000000, 'success_rate': 83.3},
            {'department': 'Innovation Lab', 'projects': 4, 'budget': 500000000, 'success_rate': 75.0},
            {'department': 'Quality Research', 'projects': 3, 'budget': 300000000, 'success_rate': 66.7},
            {'department': 'Process Improvement', 'projects': 3, 'budget': 300000000, 'success_rate': 100.0}
        ]
        
        roi_analysis = [
            {'project_type': 'Research', 'investment': 800000000, 'returns': 920000000, 'roi': 15.0},
            {'project_type': 'Development', 'investment': 1000000000, 'returns': 1250000000, 'roi': 25.0},
            {'project_type': 'Innovation', 'investment': 400000000, 'returns': 460000000, 'roi': 15.0},
            {'project_type': 'Improvement', 'investment': 175000000, 'returns': 192500000, 'roi': 10.0}
        ]
        
        # Detailed projects data
        projects = [
            {
                'project_number': 'RDP-202410-00001',
                'title': 'Advanced Material Research for Automotive Components',
                'type': 'research',
                'status': 'active',
                'start_date': '2024-01-15',
                'end_date': '2024-12-15',
                'budget_allocated': 500000000,
                'budget_spent': 325000000,
                'progress': 65,
                'manager': 'Dr. Ahmad Wijaya'
            },
            {
                'project_number': 'RDP-202410-00002',
                'title': 'IoT Integration for Smart Manufacturing',
                'type': 'development',
                'status': 'active',
                'start_date': '2024-02-01',
                'end_date': '2024-11-30',
                'budget_allocated': 750000000,
                'budget_spent': 450000000,
                'progress': 60,
                'manager': 'Ir. Sari Indrawati'
            },
            {
                'project_number': 'RDP-202410-00003',
                'title': 'Energy Efficiency Optimization System',
                'type': 'innovation',
                'status': 'completed',
                'start_date': '2023-09-01',
                'end_date': '2024-03-31',
                'budget_allocated': 400000000,
                'budget_spent': 380000000,
                'progress': 100,
                'manager': 'Dr. Budi Santoso'
            },
            {
                'project_number': 'RDP-202410-00004',
                'title': 'Quality Control Process Enhancement',
                'type': 'improvement',
                'status': 'on_hold',
                'start_date': '2024-03-15',
                'end_date': '2024-09-15',
                'budget_allocated': 200000000,
                'budget_spent': 75000000,
                'progress': 25,
                'manager': 'Ir. Maya Kusuma'
            },
            {
                'project_number': 'RDP-202410-00005',
                'title': 'Sustainable Packaging Development',
                'type': 'development',
                'status': 'planning',
                'start_date': '2024-07-01',
                'end_date': '2025-06-30',
                'budget_allocated': 600000000,
                'budget_spent': 0,
                'progress': 5,
                'manager': 'Dr. Rina Hartati'
            }
        ]
        
        return jsonify({
            'summary': summary,
            'charts': {
                'projects_by_type': projects_by_type,
                'projects_by_status': projects_by_status,
                'budget_utilization': budget_utilization,
                'completion_trends': completion_trends,
                'department_performance': department_performance,
                'roi_analysis': roi_analysis
            },
            'projects': projects
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rd_extended_bp.route('/reports/export', methods=['GET'])
@jwt_required()
def export_rd_reports():
    try:
        format_type = request.args.get('format', 'excel')
        report_type = request.args.get('report_type', 'overview')
        
        # Mock response - actual implementation would generate file
        return jsonify({
            'message': f'R&D report export in {format_type} format would be generated here',
            'download_url': f'/downloads/rd_report_{report_type}.{format_type}'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Project Details Extended Endpoints
@rd_extended_bp.route('/projects/<int:project_id>/details', methods=['GET'])
@jwt_required()
def get_project_details(project_id):
    try:
        # Mock detailed project data
        project_details = {
            'id': project_id,
            'project_number': f'RDP-202410-{project_id:05d}',
            'title': 'Advanced Material Research for Automotive Components',
            'description': 'Research and development of lightweight, durable materials for automotive applications with focus on sustainability and cost-effectiveness.',
            'project_type': 'research',
            'priority': 'high',
            'status': 'active',
            'start_date': '2024-01-15',
            'end_date': '2024-12-15',
            'budget_allocated': 500000000,
            'budget_spent': 325000000,
            'project_manager_id': 1,
            'department': 'R&D Engineering',
            'objectives': [
                {
                    'id': 1,
                    'objective': 'Develop lightweight composite material',
                    'target_value': '30',
                    'current_value': '22',
                    'unit': '% weight reduction',
                    'is_achieved': False
                },
                {
                    'id': 2,
                    'objective': 'Achieve cost reduction in production',
                    'target_value': '15',
                    'current_value': '12',
                    'unit': '% cost reduction',
                    'is_achieved': False
                },
                {
                    'id': 3,
                    'objective': 'Meet sustainability standards',
                    'target_value': '95',
                    'current_value': '98',
                    'unit': '% compliance',
                    'is_achieved': True
                }
            ],
            'milestones': [
                {
                    'id': 1,
                    'milestone_name': 'Material Research Phase Complete',
                    'target_date': '2024-04-30',
                    'actual_date': '2024-04-28',
                    'status': 'completed',
                    'description': 'Complete initial material research and feasibility study'
                },
                {
                    'id': 2,
                    'milestone_name': 'Prototype Development',
                    'target_date': '2024-08-31',
                    'actual_date': '',
                    'status': 'in_progress',
                    'description': 'Develop and test initial prototypes'
                },
                {
                    'id': 3,
                    'milestone_name': 'Testing and Validation',
                    'target_date': '2024-11-30',
                    'actual_date': '',
                    'status': 'pending',
                    'description': 'Comprehensive testing and validation of final product'
                }
            ],
            'team_members': [
                {
                    'id': 1,
                    'employee_id': 1,
                    'role': 'Project Manager',
                    'allocation_percentage': 100,
                    'start_date': '2024-01-15',
                    'end_date': '2024-12-15'
                },
                {
                    'id': 2,
                    'employee_id': 2,
                    'role': 'Senior Researcher',
                    'allocation_percentage': 80,
                    'start_date': '2024-01-15',
                    'end_date': '2024-12-15'
                },
                {
                    'id': 3,
                    'employee_id': 3,
                    'role': 'Materials Engineer',
                    'allocation_percentage': 60,
                    'start_date': '2024-02-01',
                    'end_date': '2024-10-31'
                }
            ],
            'resources': [
                {
                    'id': 1,
                    'resource_type': 'equipment',
                    'resource_name': 'Advanced Materials Testing Machine',
                    'quantity': 1,
                    'unit_cost': 150000000,
                    'total_cost': 150000000,
                    'supplier': 'TechLab Equipment'
                },
                {
                    'id': 2,
                    'resource_type': 'materials',
                    'resource_name': 'Carbon Fiber Composite Materials',
                    'quantity': 100,
                    'unit_cost': 500000,
                    'total_cost': 50000000,
                    'supplier': 'Advanced Materials Co.'
                },
                {
                    'id': 3,
                    'resource_type': 'software',
                    'resource_name': 'CAD/CAM Software License',
                    'quantity': 5,
                    'unit_cost': 25000000,
                    'total_cost': 125000000,
                    'supplier': 'Design Software Inc.'
                }
            ],
            'risks': [
                {
                    'id': 1,
                    'risk_description': 'Material supply chain disruption',
                    'probability': 'medium',
                    'impact': 'high',
                    'mitigation_plan': 'Identify alternative suppliers and maintain buffer stock',
                    'status': 'active'
                },
                {
                    'id': 2,
                    'risk_description': 'Technical challenges in composite bonding',
                    'probability': 'high',
                    'impact': 'medium',
                    'mitigation_plan': 'Collaborate with external research institutions',
                    'status': 'mitigated'
                }
            ],
            'notes': 'Project is progressing well with strong team collaboration. Regular stakeholder meetings scheduled monthly.'
        }
        
        return jsonify({'project': project_details}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rd_extended_bp.route('/projects/<int:project_id>/details', methods=['PUT'])
@jwt_required()
def update_project_details(project_id):
    try:
        data = request.get_json()
        
        # Mock response - actual implementation would update project details
        return jsonify({'message': 'Project details updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rd_extended_bp.route('/projects/details', methods=['POST'])
@jwt_required()
def create_project_details():
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())
        
        # Mock response - actual implementation would create new project
        project_number = generate_number('RDP', None, None)
        
        return jsonify({
            'message': 'Project created successfully',
            'project_id': 999,
            'project_number': project_number
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
