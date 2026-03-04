import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import {
  BeakerIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface Project {
  id: number;
  project_number: string;
  project_name: string;
}

interface FormData {
  project_id: number | '';
  title: string;
  experiment_type: string;
  hypothesis: string;
  methodology: string;
  materials_used: string;
  equipment_used: string;
  experiment_date: string;
  duration_hours: number;
  status: string;
  success: boolean | null;
  results_summary: string;
  observations: string;
  conclusions: string;
  recommendations: string;
  notes: string;
}

const ExperimentForm: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    project_id: '',
    title: '',
    experiment_type: 'formulation',
    hypothesis: '',
    methodology: '',
    materials_used: '',
    equipment_used: '',
    experiment_date: new Date().toISOString().split('T')[0],
    duration_hours: 1,
    status: 'planned',
    success: null,
    results_summary: '',
    observations: '',
    conclusions: '',
    recommendations: '',
    notes: ''
  });

  const experimentTypes = [
    { value: 'formulation', label: 'Formulation Testing' },
    { value: 'material_testing', label: 'Material Testing' },
    { value: 'process_optimization', label: 'Process Optimization' },
    { value: 'quality_testing', label: 'Quality Testing' },
    { value: 'prototype', label: 'Prototype Development' },
    { value: 'scale_up', label: 'Scale-up Trial' },
    { value: 'stability', label: 'Stability Testing' },
    { value: 'other', label: 'Other' }
  ];

  const statuses = [
    { value: 'planned', label: 'Planned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    fetchProjects();
    if (isEdit) {
      fetchExperiment();
    }
  }, [id]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/api/rd/projects');
      setProjects(response.data.projects || response.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchExperiment = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/rd/experiments/${id}`);
      const exp = response.data.experiment || response.data;
      setFormData({
        project_id: exp.project_id || '',
        title: exp.title || '',
        experiment_type: exp.experiment_type || 'formulation',
        hypothesis: exp.hypothesis || '',
        methodology: exp.methodology || '',
        materials_used: exp.materials_used || '',
        equipment_used: exp.equipment_used || '',
        experiment_date: exp.experiment_date?.split('T')[0] || '',
        duration_hours: exp.duration_hours || 1,
        status: exp.status || 'planned',
        success: exp.success,
        results_summary: exp.results_summary || '',
        observations: exp.observations || '',
        conclusions: exp.conclusions || '',
        recommendations: exp.recommendations || '',
        notes: exp.notes || ''
      });
    } catch (error) {
      console.error('Error fetching experiment:', error);
      toast.error('Failed to load experiment');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSuccessChange = (value: boolean | null) => {
    setFormData(prev => ({
      ...prev,
      success: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast.error('Please enter experiment title');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        project_id: formData.project_id ? Number(formData.project_id) : null,
        duration_hours: Number(formData.duration_hours)
      };

      if (isEdit) {
        await api.put(`/api/rd/experiments/${id}`, payload);
        toast.success('Experiment updated successfully');
      } else {
        await api.post('/api/rd/experiments', payload);
        toast.success('Experiment created successfully');
      }
      navigate('/app/rd/experiments');
    } catch (error: any) {
      console.error('Error saving experiment:', error);
      toast.error(error.response?.data?.error || 'Failed to save experiment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/app/rd/experiments"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Experiment' : 'New Experiment'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isEdit ? 'Update experiment details and results' : 'Create a new research experiment'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BeakerIcon className="w-5 h-5 text-purple-600" />
            Experiment Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Research Project
              </label>
              <select
                name="project_id"
                value={formData.project_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Project (Optional)</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.project_number} - {project.project_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Experiment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Experiment Type <span className="text-red-500">*</span>
              </label>
              <select
                name="experiment_type"
                value={formData.experiment_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {experimentTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Experiment Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter experiment title"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Experiment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Experiment Date
              </label>
              <div className="relative">
                <CalendarDaysIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  name="experiment_date"
                  value={formData.experiment_date}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (hours)
              </label>
              <input
                type="number"
                name="duration_hours"
                value={formData.duration_hours}
                onChange={handleChange}
                min="0.5"
                step="0.5"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {statuses.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Success */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Result
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => handleSuccessChange(true)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    formData.success === true
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Success
                </button>
                <button
                  type="button"
                  onClick={() => handleSuccessChange(false)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    formData.success === false
                      ? 'bg-red-100 border-red-500 text-red-700'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <XCircleIcon className="w-5 h-5" />
                  Failed
                </button>
                <button
                  type="button"
                  onClick={() => handleSuccessChange(null)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    formData.success === null
                      ? 'bg-gray-100 border-gray-500 text-gray-700'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Pending
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hypothesis & Methodology */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ClipboardDocumentListIcon className="w-5 h-5 text-blue-600" />
            Hypothesis & Methodology
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hypothesis
              </label>
              <textarea
                name="hypothesis"
                value={formData.hypothesis}
                onChange={handleChange}
                rows={3}
                placeholder="State your hypothesis..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Methodology
              </label>
              <textarea
                name="methodology"
                value={formData.methodology}
                onChange={handleChange}
                rows={4}
                placeholder="Describe the experimental methodology..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Materials Used
                </label>
                <textarea
                  name="materials_used"
                  value={formData.materials_used}
                  onChange={handleChange}
                  rows={3}
                  placeholder="List materials used..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Equipment Used
                </label>
                <textarea
                  name="equipment_used"
                  value={formData.equipment_used}
                  onChange={handleChange}
                  rows={3}
                  placeholder="List equipment used..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results & Conclusions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-green-600" />
            Results & Conclusions
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Results Summary
              </label>
              <textarea
                name="results_summary"
                value={formData.results_summary}
                onChange={handleChange}
                rows={3}
                placeholder="Summarize the experiment results..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Observations
              </label>
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                rows={3}
                placeholder="Record your observations..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Conclusions
              </label>
              <textarea
                name="conclusions"
                value={formData.conclusions}
                onChange={handleChange}
                rows={3}
                placeholder="State your conclusions..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recommendations
              </label>
              <textarea
                name="recommendations"
                value={formData.recommendations}
                onChange={handleChange}
                rows={2}
                placeholder="Provide recommendations for future work..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Additional Notes
          </h2>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Any additional notes..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            to="/app/rd/experiments"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <BeakerIcon className="w-5 h-5" />
                {isEdit ? 'Update Experiment' : 'Create Experiment'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExperimentForm;
