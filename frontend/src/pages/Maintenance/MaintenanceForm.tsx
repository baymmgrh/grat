import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import {
  WrenchScrewdriverIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Machine {
  id: number;
  name: string;
  code: string;
  status: string;
}

interface Employee {
  id: number;
  full_name: string;
  employee_id: string;
  department?: string;
}

interface MaintenanceTask {
  id?: number;
  task_name: string;
  description: string;
  estimated_time_hours: number;
  status: string;
}

interface MaintenancePart {
  id?: number;
  part_name: string;
  quantity: number;
  unit_cost: number;
  supplier: string;
}

interface FormData {
  machine_id: number | '';
  maintenance_type: string;
  scheduled_date: string;
  estimated_duration_hours: number;
  priority: string;
  description: string;
  assigned_to: number | '';
  preventive_schedule: string;
  cost_estimate: number;
  safety_requirements: string;
  notes: string;
  tasks: MaintenanceTask[];
  required_parts: MaintenancePart[];
}

const MaintenanceForm: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    machine_id: '',
    maintenance_type: 'preventive',
    scheduled_date: new Date().toISOString().split('T')[0],
    estimated_duration_hours: 1,
    priority: 'medium',
    description: '',
    assigned_to: '',
    preventive_schedule: '',
    cost_estimate: 0,
    safety_requirements: '',
    notes: '',
    tasks: [],
    required_parts: []
  });

  const maintenanceTypes = [
    { value: 'preventive', label: 'Preventive Maintenance' },
    { value: 'corrective', label: 'Corrective Maintenance' },
    { value: 'predictive', label: 'Predictive Maintenance' },
    { value: 'breakdown', label: 'Breakdown Repair' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'calibration', label: 'Calibration' },
    { value: 'overhaul', label: 'Overhaul' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical', color: 'text-red-600' }
  ];

  useEffect(() => {
    fetchMachines();
    fetchEmployees();
    if (isEdit) {
      fetchRecord();
    }
  }, [id]);

  const fetchMachines = async () => {
    try {
      const response = await api.get('/api/production/machines');
      setMachines(response.data.machines || response.data || []);
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/api/hr/employees');
      setEmployees(response.data.employees || response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/maintenance/records/${id}`);
      const record = response.data.record;
      setFormData({
        machine_id: record.machine_id,
        maintenance_type: record.maintenance_type,
        scheduled_date: record.scheduled_date?.split('T')[0] || record.maintenance_date?.split('T')[0] || '',
        estimated_duration_hours: record.estimated_duration_hours || 1,
        priority: record.priority || 'medium',
        description: record.problem_description || record.description || '',
        assigned_to: record.assigned_to || record.performed_by || '',
        preventive_schedule: record.preventive_schedule || '',
        cost_estimate: record.cost_estimate || record.cost || 0,
        safety_requirements: record.safety_requirements || '',
        notes: record.notes || '',
        tasks: record.tasks || [],
        required_parts: record.required_parts || []
      });
    } catch (error) {
      console.error('Error fetching record:', error);
      toast.error('Failed to load maintenance record');
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

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  // Task management
  const addTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, { task_name: '', description: '', estimated_time_hours: 0.5, status: 'pending' }]
    }));
  };

  const updateTask = (index: number, field: keyof MaintenanceTask, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => i === index ? { ...task, [field]: value } : task)
    }));
  };

  const removeTask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
  };

  // Parts management
  const addPart = () => {
    setFormData(prev => ({
      ...prev,
      required_parts: [...prev.required_parts, { part_name: '', quantity: 1, unit_cost: 0, supplier: '' }]
    }));
  };

  const updatePart = (index: number, field: keyof MaintenancePart, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      required_parts: prev.required_parts.map((part, i) => i === index ? { ...part, [field]: value } : part)
    }));
  };

  const removePart = (index: number) => {
    setFormData(prev => ({
      ...prev,
      required_parts: prev.required_parts.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.machine_id) {
      toast.error('Please select a machine');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        machine_id: Number(formData.machine_id),
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null
      };

      if (isEdit) {
        await api.patch(`/api/maintenance/records/${id}`, payload);
        toast.success('Maintenance record updated successfully');
      } else {
        await api.post('/api/maintenance/maintenance', payload);
        toast.success('Maintenance work order created successfully');
      }
      navigate('/app/maintenance/list');
    } catch (error: any) {
      console.error('Error saving maintenance:', error);
      toast.error(error.response?.data?.error || 'Failed to save maintenance record');
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
          to="/app/maintenance/list"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Maintenance Record' : 'New Maintenance Work Order'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isEdit ? 'Update maintenance details' : 'Schedule a new maintenance task'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Cog6ToothIcon className="w-5 h-5 text-blue-600" />
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Machine */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Machine <span className="text-red-500">*</span>
              </label>
              <select
                name="machine_id"
                value={formData.machine_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Machine</option>
                {machines.map(machine => (
                  <option key={machine.id} value={machine.id}>
                    {machine.code} - {machine.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Maintenance Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maintenance Type <span className="text-red-500">*</span>
              </label>
              <select
                name="maintenance_type"
                value={formData.maintenance_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {maintenanceTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Scheduled Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Scheduled Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CalendarDaysIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  name="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Estimated Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estimated Duration (hours)
              </label>
              <div className="relative">
                <ClockIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="estimated_duration_hours"
                  value={formData.estimated_duration_hours}
                  onChange={handleNumberChange}
                  min="0.5"
                  step="0.5"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {priorities.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assigned To
              </label>
              <div className="relative">
                <UserIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Technician</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employee_id} - {emp.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cost Estimate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cost Estimate (Rp)
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="cost_estimate"
                  value={formData.cost_estimate}
                  onChange={handleNumberChange}
                  min="0"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description / Problem
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Describe the maintenance task or problem..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Safety Requirements */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span className="flex items-center gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
                Safety Requirements
              </span>
            </label>
            <textarea
              name="safety_requirements"
              value={formData.safety_requirements}
              onChange={handleChange}
              rows={2}
              placeholder="List any safety precautions or PPE required..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-green-600" />
              Maintenance Tasks
            </h2>
            <button
              type="button"
              onClick={addTask}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Add Task
            </button>
          </div>

          {formData.tasks.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No tasks added. Click "Add Task" to add maintenance tasks.
            </p>
          ) : (
            <div className="space-y-4">
              {formData.tasks.map((task, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-medium text-gray-500">Task #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeTask(index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Task Name"
                      value={task.task_name}
                      onChange={(e) => updateTask(index, 'task_name', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={task.description}
                      onChange={(e) => updateTask(index, 'description', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Est. Hours"
                      value={task.estimated_time_hours}
                      onChange={(e) => updateTask(index, 'estimated_time_hours', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.5"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Required Parts */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <WrenchScrewdriverIcon className="w-5 h-5 text-purple-600" />
              Required Parts
            </h2>
            <button
              type="button"
              onClick={addPart}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Add Part
            </button>
          </div>

          {formData.required_parts.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No parts added. Click "Add Part" to add required spare parts.
            </p>
          ) : (
            <div className="space-y-4">
              {formData.required_parts.map((part, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-medium text-gray-500">Part #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removePart(index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder="Part Name"
                      value={part.part_name}
                      onChange={(e) => updatePart(index, 'part_name', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={part.quantity}
                      onChange={(e) => updatePart(index, 'quantity', parseInt(e.target.value) || 0)}
                      min="1"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Unit Cost"
                      value={part.unit_cost}
                      onChange={(e) => updatePart(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                      min="0"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Supplier"
                      value={part.supplier}
                      onChange={(e) => updatePart(index, 'supplier', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
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
            placeholder="Any additional notes or instructions..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            to="/app/maintenance/list"
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
                <WrenchScrewdriverIcon className="w-5 h-5" />
                {isEdit ? 'Update Record' : 'Create Work Order'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MaintenanceForm;
