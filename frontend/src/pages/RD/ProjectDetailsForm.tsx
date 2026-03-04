import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  BeakerIcon as Beaker,
  CheckIcon as Save,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon as AlertTriangle,
  PlusIcon as Plus,
  TrashIcon as Trash2,
  ViewfinderCircleIcon as Target

} from '@heroicons/react/24/outline';
interface ProjectFormData {
  project_number: string;
  title: string;
  description: string;
  project_type: string;
  priority: string;
  status: string;
  start_date: string;
  end_date: string;
  budget_allocated: number;
  budget_spent: number;
  project_manager_id: number;
  department: string;
  objectives: ProjectObjective[];
  milestones: ProjectMilestone[];
  team_members: ProjectTeamMember[];
  resources: ProjectResource[];
  risks: ProjectRisk[];
  notes: string;
}

interface ProjectObjective {
  id?: number;
  objective: string;
  target_value: string;
  current_value: string;
  unit: string;
  is_achieved: boolean;
}

interface ProjectMilestone {
  id?: number;
  milestone_name: string;
  target_date: string;
  actual_date: string;
  status: string;
  description: string;
}

interface ProjectTeamMember {
  id?: number;
  employee_id: number;
  role: string;
  allocation_percentage: number;
  start_date: string;
  end_date: string;
}

interface ProjectResource {
  id?: number;
  resource_type: string;
  resource_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  supplier: string;
}

interface ProjectRisk {
  id?: number;
  risk_description: string;
  probability: string;
  impact: string;
  mitigation_plan: string;
  status: string;
}

const ProjectDetailsForm: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<ProjectFormData>({
    project_number: '',
    title: '',
    description: '',
    project_type: 'research',
    priority: 'medium',
    status: 'planning',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    budget_allocated: 0,
    budget_spent: 0,
    project_manager_id: 0,
    department: '',
    objectives: [],
    milestones: [],
    team_members: [],
    resources: [],
    risks: [],
    notes: ''
  });

  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const projectTypes = [
    { value: 'research', label: 'Research' },
    { value: 'development', label: 'Development' },
    { value: 'innovation', label: 'Innovation' },
    { value: 'improvement', label: 'Process Improvement' },
    { value: 'feasibility', label: 'Feasibility Study' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
  ];

  const statuses = [
    { value: 'planning', label: 'Planning', color: 'bg-gray-100 text-gray-800' },
    { value: 'active', label: 'Active', color: 'bg-blue-100 text-blue-800' },
    { value: 'on_hold', label: 'On Hold', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
  ];

  const riskLevels = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    if (isEdit && id) {
      fetchProject();
    }
  }, [id]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/hr/employees', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/hr/departments', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments?.map((d: any) => d.name) || []);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/rd/projects/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData(data.project);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = isEdit ? `/api/rd/projects/${id}` : '/api/rd/projects';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        navigate('/app/rd/projects');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save project');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addObjective = () => {
    setFormData(prev => ({
      ...prev,
      objectives: [...prev.objectives, {
        objective: '',
        target_value: '',
        current_value: '',
        unit: '',
        is_achieved: false
      }]
    }));
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, {
        milestone_name: '',
        target_date: '',
        actual_date: '',
        status: 'pending',
        description: ''
      }]
    }));
  };

  const addTeamMember = () => {
    setFormData(prev => ({
      ...prev,
      team_members: [...prev.team_members, {
        employee_id: 0,
        role: '',
        allocation_percentage: 100,
        start_date: formData.start_date,
        end_date: formData.end_date
      }]
    }));
  };

  const addResource = () => {
    setFormData(prev => ({
      ...prev,
      resources: [...prev.resources, {
        resource_type: 'equipment',
        resource_name: '',
        quantity: 1,
        unit_cost: 0,
        total_cost: 0,
        supplier: ''
      }]
    }));
  };

  const addRisk = () => {
    setFormData(prev => ({
      ...prev,
      risks: [...prev.risks, {
        risk_description: '',
        probability: 'medium',
        impact: 'medium',
        mitigation_plan: '',
        status: 'identified'
      }]
    }));
  };

  const removeItem = (section: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section as keyof typeof prev].filter((_: any, i: number) => i !== index)
    }));
  };

  const updateItem = (section: string, index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section as keyof typeof prev].map((item: any, i: number) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateBudgetUtilization = () => {
    if (formData.budget_allocated === 0) return 0;
    return (formData.budget_spent / formData.budget_allocated) * 100;
  };

  const calculateResourceCost = () => {
    return formData.resources.reduce((sum, resource) => sum + resource.total_cost, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit R&D Project' : 'Create R&D Project'}
          </h1>
          <p className="text-gray-600">Comprehensive project management and tracking</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              <Beaker className="inline h-4 w-4 mr-1" />
              Project Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Number</label>
                <input
                  type="text"
                  value={formData.project_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, project_number: e.target.value }))}
                  placeholder="Auto-generated if empty"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Type *</label>
                <select
                  value={formData.project_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, project_type: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {projectTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="Enter project title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  rows={4}
                  placeholder="Detailed project description and scope"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Manager *</label>
                <select
                  value={formData.project_manager_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, project_manager_id: parseInt(e.target.value) }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Project Manager</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} - {emp.position}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget Allocated</label>
                <input
                  type="number"
                  value={formData.budget_allocated}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget_allocated: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget Spent</label>
                <input
                  type="number"
                  value={formData.budget_spent}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget_spent: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Budget Summary */}
          {formData.budget_allocated > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Budget Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Allocated:</span>
                  <div className="font-medium text-blue-900">{formatCurrency(formData.budget_allocated)}</div>
                </div>
                <div>
                  <span className="text-blue-700">Spent:</span>
                  <div className="font-medium text-blue-900">{formatCurrency(formData.budget_spent)}</div>
                </div>
                <div>
                  <span className="text-blue-700">Remaining:</span>
                  <div className="font-medium text-blue-900">{formatCurrency(formData.budget_allocated - formData.budget_spent)}</div>
                </div>
                <div>
                  <span className="text-blue-700">Utilization:</span>
                  <div className="font-medium text-blue-900">{calculateBudgetUtilization().toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Project Objectives */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                <Target className="inline h-4 w-4 mr-1" />
                Project Objectives
              </h3>
              <button
                type="button"
                onClick={addObjective}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus className="inline h-4 w-4 mr-1" />
                Add Objective
              </button>
            </div>

            {formData.objectives.map((objective, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Objective #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeItem('objectives', index)}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objective Description *</label>
                    <input
                      type="text"
                      value={objective.objective}
                      onChange={(e) => updateItem('objectives', index, 'objective', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
                    <input
                      type="text"
                      value={objective.target_value}
                      onChange={(e) => updateItem('objectives', index, 'target_value', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Value</label>
                    <input
                      type="text"
                      value={objective.current_value}
                      onChange={(e) => updateItem('objectives', index, 'current_value', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input
                      type="text"
                      value={objective.unit}
                      onChange={(e) => updateItem('objectives', index, 'unit', e.target.value)}
                      placeholder="e.g., %, kg, units"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={objective.is_achieved}
                        onChange={(e) => updateItem('objectives', index, 'is_achieved', e.target.checked)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-green-600">Achieved</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/rd/projects')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <X className="inline h-4 w-4 mr-2" />{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <Save className="inline h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectDetailsForm;
