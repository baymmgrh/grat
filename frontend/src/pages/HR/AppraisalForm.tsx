import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  CalendarIcon as Calendar,
  ChatBubbleLeftRightIcon as MessageSquare,
  CheckIcon as Save,
  DocumentTextIcon,
  ExclamationCircleIcon,
  StarIcon as Star,
  UserIcon as User,
  ViewfinderCircleIcon as Target

} from '@heroicons/react/24/outline';
interface Employee {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  department: {
    name: string;
  };
}

interface AppraisalCycle {
  id: number;
  cycle_name: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface AppraisalTemplate {
  id: number;
  template_name: string;
  description: string;
}

interface AppraisalFormData {
  appraisal_number: string;
  cycle_id: number;
  employee_id: number;
  template_id: number;
  reviewer_id: number | null;
  self_overall_score: number;
  self_comments: string;
  manager_overall_score: number;
  manager_comments: string;
  final_rating: string;
  goals_next_period: string;
  development_plan: string;
  overall_status: string;
}

const AppraisalForm: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<AppraisalFormData>({
    appraisal_number: '',
    cycle_id: 0,
    employee_id: 0,
    template_id: 0,
    reviewer_id: null,
    self_overall_score: 0,
    self_comments: '',
    manager_overall_score: 0,
    manager_comments: '',
    final_rating: '',
    goals_next_period: '',
    development_plan: '',
    overall_status: 'draft'
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cycles, setCycles] = useState<AppraisalCycle[]>([]);
  const [templates, setTemplates] = useState<AppraisalTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ratingOptions = [
    { value: 'excellent', label: 'Excellent (4.5-5.0)', color: 'text-green-600' },
    { value: 'good', label: 'Good (3.5-4.4)', color: 'text-blue-600' },
    { value: 'satisfactory', label: 'Satisfactory (2.5-3.4)', color: 'text-yellow-600' },
    { value: 'needs_improvement', label: 'Needs Improvement (1.0-2.4)', color: 'text-red-600' }
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'self_review', label: 'Self Review' },
    { value: 'manager_review', label: 'Manager Review' },
    { value: 'completed', label: 'Completed' }
  ];

  useEffect(() => {
    fetchEmployees();
    fetchCycles();
    fetchTemplates();
    if (isEdit) {
      fetchAppraisal();
    } else {
      generateAppraisalNumber();
    }
  }, [id]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/hr/employees?status=active', {
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

  const fetchCycles = async () => {
    try {
      const response = await fetch('/api/hr/appraisal/cycles?status=active', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCycles(data.cycles || []);
      }
    } catch (error) {
      console.error('Failed to fetch cycles:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/hr/appraisal/templates', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const generateAppraisalNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    const appraisalNumber = `APR-${year}${month}-${timestamp}`;
    
    setFormData(prev => ({ ...prev, appraisal_number: appraisalNumber }));
  };

  const fetchAppraisal = async () => {
    try {
      const response = await fetch(`/api/hr/appraisal/appraisals/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          appraisal_number: data.appraisal_number,
          cycle_id: data.cycle_id,
          employee_id: data.employee_id,
          template_id: data.template_id,
          reviewer_id: data.reviewer_id,
          self_overall_score: data.self_overall_score || 0,
          self_comments: data.self_comments || '',
          manager_overall_score: data.manager_overall_score || 0,
          manager_comments: data.manager_comments || '',
          final_rating: data.final_rating || '',
          goals_next_period: data.goals_next_period || '',
          development_plan: data.development_plan || '',
          overall_status: data.overall_status
        });
      }
    } catch (error) {
      console.error('Failed to fetch appraisal:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.employee_id === 0) {
      setError('Please select an employee');
      setLoading(false);
      return;
    }

    try {
      const url = isEdit ? `/api/hr/appraisal/appraisals/${id}` : '/api/hr/appraisal/appraisals';
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
        navigate('/app/hr/appraisals');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save appraisal');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['cycle_id', 'employee_id', 'template_id', 'reviewer_id', 'self_overall_score', 'manager_overall_score'].includes(name) 
        ? (value === '' ? (name.includes('_id') ? (name === 'reviewer_id' ? null : 0) : 0) : Number(value))
        : value
    }));
  };

  const selectedEmployee = employees.find(emp => emp.id === formData.employee_id);
  const selectedCycle = cycles.find(cycle => cycle.id === formData.cycle_id);
  const selectedTemplate = templates.find(template => template.id === formData.template_id);
  const selectedRating = ratingOptions.find(rating => rating.value === formData.final_rating);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Performance Appraisal' : 'New Performance Appraisal'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update employee performance appraisal' : 'Create new performance appraisal record'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <ExclamationCircleIcon className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Appraisal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appraisal Number *
                </label>
                <input
                  type="text"
                  name="appraisal_number"
                  value={formData.appraisal_number}
                  onChange={handleInputChange}
                  required
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Appraisal Cycle *
                </label>
                <select
                  name="cycle_id"
                  value={formData.cycle_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Cycle</option>
                  {cycles.map(cycle => (
                    <option key={cycle.id} value={cycle.id}>
                      {cycle.cycle_name} ({cycle.start_date} - {cycle.end_date})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Employee *
                </label>
                <select
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.employee_number} - {employee.first_name} {employee.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appraisal Template *
                </label>
                <select
                  name="template_id"
                  value={formData.template_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Template</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.template_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Self Assessment */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Self Assessment
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Star className="inline h-4 w-4 mr-1" />
                  Self Overall Score (1-5)
                </label>
                <input
                  type="number"
                  name="self_overall_score"
                  value={formData.self_overall_score}
                  onChange={handleInputChange}
                  min="1"
                  max="5"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.status')}</label>
                <select
                  name="overall_status"
                  value={formData.overall_status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="inline h-4 w-4 mr-1" />
                Self Comments
              </label>
              <textarea
                name="self_comments"
                value={formData.self_comments}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Employee's self-assessment comments..."
              />
            </div>
          </div>

          {/* Manager Assessment */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Manager Assessment
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager Overall Score (1-5)
                </label>
                <input
                  type="number"
                  name="manager_overall_score"
                  value={formData.manager_overall_score}
                  onChange={handleInputChange}
                  min="1"
                  max="5"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Final Rating
                </label>
                <select
                  name="final_rating"
                  value={formData.final_rating}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Rating</option>
                  {ratingOptions.map(rating => (
                    <option key={rating.value} value={rating.value}>
                      {rating.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager Comments
              </label>
              <textarea
                name="manager_comments"
                value={formData.manager_comments}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Manager's assessment comments..."
              />
            </div>
          </div>

          {/* Development Plan */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              <Target className="inline h-4 w-4 mr-1" />
              Development Planning
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Goals for Next Period
              </label>
              <textarea
                name="goals_next_period"
                value={formData.goals_next_period}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Set goals and objectives for the next performance period..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Development Plan
              </label>
              <textarea
                name="development_plan"
                value={formData.development_plan}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Professional development plan and training recommendations..."
              />
            </div>
          </div>

          {/* Summary */}
          {(formData.self_overall_score > 0 || formData.manager_overall_score > 0) && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Performance Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formData.self_overall_score || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Self Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {formData.manager_overall_score || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Manager Score</div>
                </div>
                <div>
                  <div className={`text-lg font-bold ${selectedRating?.color || 'text-gray-600'}`}>
                    {selectedRating?.label.split(' ')[0] || 'Not Set'}
                  </div>
                  <div className="text-sm text-gray-600">Final Rating</div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/hr/appraisals')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <X className="inline h-4 w-4 mr-2" />{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="inline h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update Appraisal' : 'Save Appraisal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppraisalForm;
