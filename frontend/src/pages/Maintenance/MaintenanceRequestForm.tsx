import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  CalendarIcon as Calendar,
  CheckIcon as Save,
  ClockIcon,
  CogIcon as Settings,
  CubeIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon as AlertTriangle,
  UserIcon as User,
  WrenchIcon as Wrench

} from '@heroicons/react/24/outline';
interface Machine {
  id: number;
  name: string;
  code: string;
  status: string;
}

interface MaintenanceRequestData {
  machine_id: number;
  maintenance_type: string;
  priority: string;
  scheduled_date: string;
  estimated_duration_hours: number;
  description: string;
  assigned_to: string;
  cost_estimate: number;
  safety_requirements: string;
  notes: string;
  tasks: MaintenanceTask[];
  required_parts: RequiredPart[];
}

interface MaintenanceTask {
  task_name: string;
  description: string;
  estimated_time_hours: number;
  required_parts: string;
  status: string;
}

interface RequiredPart {
  part_name: string;
  quantity: number;
  unit_cost: number;
  supplier: string;
  availability_status: string;
}

const MaintenanceRequestForm: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<MaintenanceRequestData>({
    machine_id: 0,
    maintenance_type: 'preventive',
    priority: 'medium',
    scheduled_date: new Date().toISOString().split('T')[0],
    estimated_duration_hours: 4,
    description: '',
    assigned_to: '',
    cost_estimate: 0,
    safety_requirements: '',
    notes: '',
    tasks: [],
    required_parts: []
  });

  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const maintenanceTypes = [
    'preventive',
    'corrective',
    'emergency',
    'predictive',
    'condition_based'
  ];

  const priorities = [
    'low',
    'medium',
    'high',
    'critical'
  ];

  const taskStatuses = [
    'pending',
    'in_progress',
    'completed',
    'cancelled'
  ];

  const availabilityStatuses = [
    'available',
    'ordered',
    'backordered',
    'discontinued'
  ];

  useEffect(() => {
    fetchMachines();
    if (isEdit) {
      fetchMaintenanceRequest();
    }
  }, [id]);

  const fetchMachines = async () => {
    try {
      const response = await fetch('/api/production/machines?status=active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMachines(data.machines || []);
      }
    } catch (error) {
      console.error('Failed to fetch machines:', error);
    }
  };

  const fetchMaintenanceRequest = async () => {
    try {
      const response = await fetch(`/api/maintenance/records/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          machine_id: data.machine_id,
          maintenance_type: data.maintenance_type,
          priority: data.priority || 'medium',
          scheduled_date: data.scheduled_date ? data.scheduled_date.split('T')[0] : '',
          estimated_duration_hours: data.estimated_duration_hours || 4,
          description: data.description || '',
          assigned_to: data.assigned_to || '',
          cost_estimate: data.cost_estimate || 0,
          safety_requirements: data.safety_requirements || '',
          notes: data.notes || '',
          tasks: data.tasks || [],
          required_parts: data.required_parts || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch maintenance request:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.machine_id === 0) {
      setError('Please select a machine');
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError('Please provide a description');
      setLoading(false);
      return;
    }

    try {
      const url = isEdit 
        ? `/api/maintenance/records/${id}` 
        : '/api/maintenance/maintenance';
      
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
        navigate('/app/maintenance/records');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save maintenance request');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' 
        ? (value === '' ? 0 : Number(value))
        : value
    }));
  };

  const addTask = () => {
    const newTask: MaintenanceTask = {
      task_name: '',
      description: '',
      estimated_time_hours: 1,
      required_parts: '',
      status: 'pending'
    };

    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
  };

  const removeTask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
  };

  const updateTask = (index: number, field: keyof MaintenanceTask, value: any) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }));
  };

  const addPart = () => {
    const newPart: RequiredPart = {
      part_name: '',
      quantity: 1,
      unit_cost: 0,
      supplier: '',
      availability_status: 'available'
    };

    setFormData(prev => ({
      ...prev,
      required_parts: [...prev.required_parts, newPart]
    }));
  };

  const removePart = (index: number) => {
    setFormData(prev => ({
      ...prev,
      required_parts: prev.required_parts.filter((_, i) => i !== index)
    }));
  };

  const updatePart = (index: number, field: keyof RequiredPart, value: any) => {
    setFormData(prev => ({
      ...prev,
      required_parts: prev.required_parts.map((part, i) => 
        i === index ? { ...part, [field]: value } : part
      )
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTotalEstimatedCost = () => {
    const partsCost = formData.required_parts.reduce((total, part) => 
      total + (part.quantity * part.unit_cost), 0
    );
    return formData.cost_estimate + partsCost;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Maintenance Request' : 'New Maintenance Request'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update maintenance request details' : 'Schedule new maintenance work'}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(formData.priority)}`}>
          {formData.priority.toUpperCase()} PRIORITY
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              <Settings className="inline h-4 w-4 mr-1" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CubeIcon className="inline h-4 w-4 mr-1" />
                  Machine *
                </label>
                <select
                  name="machine_id"
                  value={formData.machine_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Machine</option>
                  {machines.map(machine => (
                    <option key={machine.id} value={machine.id}>
                      {machine.code} - {machine.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Wrench className="inline h-4 w-4 mr-1" />
                  Maintenance Type *
                </label>
                <select
                  name="maintenance_type"
                  value={formData.maintenance_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {maintenanceTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AlertTriangle className="inline h-4 w-4 mr-1" />
                  Priority *
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {priorities.map(priority => (
                    <option key={priority} value={priority}>
                      {priority.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Scheduled Date *
                </label>
                <input
                  type="date"
                  name="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ClockIcon className="inline h-4 w-4 mr-1" />
                  Estimated Duration (hours)
                </label>
                <input
                  type="number"
                  name="estimated_duration_hours"
                  value={formData.estimated_duration_hours}
                  onChange={handleInputChange}
                  min="0.5"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Assigned To
                </label>
                <input
                  type="text"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleInputChange}
                  placeholder="Technician name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="inline h-4 w-4 mr-1" />
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                placeholder="Describe the maintenance work to be performed..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Cost Estimate */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              <CurrencyDollarIcon className="inline h-4 w-4 mr-1" />
              Cost Estimate
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Labor Cost Estimate
                </label>
                <input
                  type="number"
                  name="cost_estimate"
                  value={formData.cost_estimate}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-end">
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Estimated Cost
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-medium">
                    Rp {getTotalEstimatedCost().toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Safety Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Safety Requirements
            </label>
            <textarea
              name="safety_requirements"
              value={formData.safety_requirements}
              onChange={handleInputChange}
              rows={2}
              placeholder="List safety precautions and requirements..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={2}
              placeholder="Any additional information..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/maintenance/records')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <X className="inline h-4 w-4 mr-2" />{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="inline h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update Request' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceRequestForm;
