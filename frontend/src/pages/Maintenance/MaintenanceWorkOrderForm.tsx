import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  CheckIcon as Save,
  ClockIcon,
  CogIcon as Settings,
  CubeIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon as AlertTriangle,
  PlusIcon as Plus,
  TrashIcon as Trash2

} from '@heroicons/react/24/outline';
interface WorkOrderFormData {
  work_order_number: string;
  title: string;
  description: string;
  machine_id: number;
  maintenance_type: string;
  priority: string;
  assigned_to: number;
  scheduled_date: string;
  estimated_hours: number;
  estimated_cost: number;
  status: string;
  parts_required: WorkOrderPart[];
  tasks: WorkOrderTask[];
  notes: string;
}

interface WorkOrderPart {
  id?: number;
  part_name: string;
  quantity: number;
  unit_cost: number;
  supplier: string;
}

interface WorkOrderTask {
  id?: number;
  task_description: string;
  estimated_time: number;
  is_completed: boolean;
  assigned_technician: string;
}

const MaintenanceWorkOrderForm: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<WorkOrderFormData>({
    work_order_number: '',
    title: '',
    description: '',
    machine_id: 0,
    maintenance_type: 'preventive',
    priority: 'medium',
    assigned_to: 0,
    scheduled_date: new Date().toISOString().split('T')[0],
    estimated_hours: 0,
    estimated_cost: 0,
    status: 'pending',
    parts_required: [],
    tasks: [],
    notes: ''
  });

  const [machines, setMachines] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const maintenanceTypes = [
    { value: 'preventive', label: 'Preventive Maintenance' },
    { value: 'corrective', label: 'Corrective Maintenance' },
    { value: 'emergency', label: 'Emergency Repair' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'calibration', label: 'Calibration' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
  ];

  const statuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    fetchMachines();
    fetchTechnicians();
    if (isEdit && id) {
      fetchWorkOrder();
    }
  }, [id]);

  const fetchMachines = async () => {
    try {
      const response = await fetch('/api/production/machines', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMachines(data.machines || []);
      }
    } catch (error) {
      console.error('Failed to fetch machines:', error);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await fetch('/api/hr/employees?department=maintenance', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTechnicians(data.employees || []);
      }
    } catch (error) {
      console.error('Failed to fetch technicians:', error);
    }
  };

  const fetchWorkOrder = async () => {
    try {
      const response = await fetch(`/api/maintenance/work-orders/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData(data.work_order);
      }
    } catch (error) {
      console.error('Failed to fetch work order:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = isEdit ? `/api/maintenance/work-orders/${id}` : '/api/maintenance/work-orders';
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
        navigate('/app/maintenance/work-orders');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save work order');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addPart = () => {
    setFormData(prev => ({
      ...prev,
      parts_required: [...prev.parts_required, {
        part_name: '',
        quantity: 1,
        unit_cost: 0,
        supplier: ''
      }]
    }));
  };

  const addTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, {
        task_description: '',
        estimated_time: 0,
        is_completed: false,
        assigned_technician: ''
      }]
    }));
  };

  const removePart = (index: number) => {
    setFormData(prev => ({
      ...prev,
      parts_required: prev.parts_required.filter((_, i) => i !== index)
    }));
  };

  const removeTask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
  };

  const updatePart = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      parts_required: prev.parts_required.map((part, i) => 
        i === index ? { ...part, [field]: value } : part
      )
    }));
  };

  const updateTask = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }));
  };

  const calculateTotalCost = () => {
    const partsCost = formData.parts_required.reduce((sum, part) => 
      sum + (part.quantity * part.unit_cost), 0
    );
    return partsCost + formData.estimated_cost;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Work Order' : 'Create Work Order'}
          </h1>
          <p className="text-gray-600">Manage maintenance work orders and tasks</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              <Settings className="inline h-4 w-4 mr-1" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Order Number
                </label>
                <input
                  type="text"
                  value={formData.work_order_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, work_order_number: e.target.value }))}
                  placeholder="Auto-generated if empty"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority *
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="Brief description of the work order"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  rows={3}
                  placeholder="Detailed description of the maintenance work required"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Assignment & Scheduling */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Assignment & Scheduling
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Machine *
                </label>
                <select
                  value={formData.machine_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, machine_id: parseInt(e.target.value) }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Machine</option>
                  {machines.map(machine => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name} - {machine.code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maintenance Type *
                </label>
                <select
                  value={formData.maintenance_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, maintenance_type: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {maintenanceTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Technician *
                </label>
                <select
                  value={formData.assigned_to}
                  onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: parseInt(e.target.value) }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Technician</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.full_name} - {tech.position}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date *
                </label>
                <input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Labor Cost
                </label>
                <input
                  type="number"
                  value={formData.estimated_cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_cost: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Parts Required */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                <CubeIcon className="inline h-4 w-4 mr-1" />
                Parts Required
              </h3>
              <button
                type="button"
                onClick={addPart}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus className="inline h-4 w-4 mr-1" />
                Add Part
              </button>
            </div>

            {formData.parts_required.map((part, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Part Name</label>
                  <input
                    type="text"
                    value={part.part_name}
                    onChange={(e) => updatePart(index, 'part_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.quantity')}</label>
                  <input
                    type="number"
                    value={part.quantity}
                    onChange={(e) => updatePart(index, 'quantity', parseInt(e.target.value) || 0)}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('products.bom.unit_cost')}</label>
                  <input
                    type="number"
                    value={part.unit_cost}
                    onChange={(e) => updatePart(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={part.supplier}
                    onChange={(e) => updatePart(index, 'supplier', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removePart(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Tasks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                <DocumentTextIcon className="inline h-4 w-4 mr-1" />
              </h3>
              <button
                type="button"
                onClick={addTask}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus className="inline h-4 w-4 mr-1" />
                Add Task
              </button>
            </div>

            {formData.tasks.map((task, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Description</label>
                  <input
                    type="text"
                    value={task.task_description}
                    onChange={(e) => updateTask(index, 'task_description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Est. Time (hrs)</label>
                  <input
                    type="number"
                    value={task.estimated_time}
                    onChange={(e) => updateTask(index, 'estimated_time', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeTask(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cost Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Cost Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Labor Cost:</span>
                <span className="font-medium text-blue-900 ml-2">
                  Rp {formData.estimated_cost.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Parts Cost:</span>
                <span className="font-medium text-blue-900 ml-2">
                  Rp {formData.parts_required.reduce((sum, part) => sum + (part.quantity * part.unit_cost), 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Total Cost:</span>
                <span className="font-bold text-blue-900 ml-2">
                  Rp {calculateTotalCost().toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Any additional notes or special instructions"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/maintenance/work-orders')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <X className="inline h-4 w-4 mr-2" />{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <Save className="inline h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update Work Order' : 'Create Work Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceWorkOrderForm;
