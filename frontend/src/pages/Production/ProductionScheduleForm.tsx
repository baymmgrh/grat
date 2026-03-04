import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  CalendarIcon as Calendar,
  CheckIcon as Save,
  ClockIcon,
  CogIcon as Settings,
  DocumentTextIcon,
  ExclamationCircleIcon,
  UserIcon as User,
  XMarkIcon as X
} from '@heroicons/react/24/outline';
interface WorkOrder {
  id: number;
  wo_number: string;
  product: {
    name: string;
    code: string;
  };
  quantity: number;
  status: string;
}

interface Machine {
  id: number;
  name: string;
  code: string;
  status: string;
  department: string;
}

interface ScheduleFormData {
  work_order_id: number;
  machine_id: number;
  scheduled_start: string;
  scheduled_end: string;
  shift: string;
  notes: string;
}

const ProductionScheduleForm: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<ScheduleFormData>({
    work_order_id: 0,
    machine_id: 0,
    scheduled_start: '',
    scheduled_end: '',
    shift: 'shift_1',
    notes: ''
  });

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const shifts = [
    { value: 'shift_1', label: 'Shift 1 (06:30 - 15:00)' },
    { value: 'shift_2', label: 'Shift 2 (15:00 - 23:00)' },
    { value: 'shift_3', label: 'Shift 3 (23:00 - 06:30)' }
  ];

  useEffect(() => {
    fetchWorkOrders();
    fetchMachines();
    if (isEdit) {
      fetchSchedule();
    }
  }, [id]);

  useEffect(() => {
    // Auto-set end time based on shift selection
    if (formData.scheduled_start && formData.shift) {
      const startDate = new Date(formData.scheduled_start);
      let endDate = new Date(startDate);

      switch (formData.shift) {
        case 'shift_1':
          endDate.setHours(15, 0, 0, 0);
          break;
        case 'shift_2':
          endDate.setHours(23, 0, 0, 0);
          break;
        case 'shift_3':
          endDate.setDate(endDate.getDate() + 1);
          endDate.setHours(6, 30, 0, 0);
          break;
      }

      setFormData(prev => ({
        ...prev,
        scheduled_end: endDate.toISOString().slice(0, 16)
      }));
    }
  }, [formData.scheduled_start, formData.shift]);

  const fetchWorkOrders = async () => {
    try {
      const response = await fetch('/api/production/work-orders?status=released,in_progress', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setWorkOrders(data.work_orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch work orders:', error);
    }
  };

  const fetchMachines = async () => {
    try {
      const response = await fetch('/api/production/machines?status=available,running', {
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

  const fetchSchedule = async () => {
    try {
      const response = await fetch(`/api/production/schedules/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          work_order_id: data.work_order_id,
          machine_id: data.machine_id,
          scheduled_start: data.scheduled_start.slice(0, 16),
          scheduled_end: data.scheduled_end.slice(0, 16),
          shift: data.shift || 'shift_1',
          notes: data.notes || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    const startTime = new Date(formData.scheduled_start);
    const endTime = new Date(formData.scheduled_end);

    if (endTime <= startTime) {
      setError('End time must be after start time');
      setLoading(false);
      return;
    }

    try {
      const url = isEdit 
        ? `/api/production/schedules/${id}` 
        : '/api/production/schedules';
      
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
        navigate('/app/production/schedules');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save schedule');
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
      [name]: name.includes('_id') ? Number(value) : value
    }));
  };

  const selectedWorkOrder = workOrders.find(wo => wo.id === formData.work_order_id);
  const selectedMachine = machines.find(m => m.id === formData.machine_id);

  const getMinStartTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  const calculateDuration = () => {
    if (formData.scheduled_start && formData.scheduled_end) {
      const start = new Date(formData.scheduled_start);
      const end = new Date(formData.scheduled_end);
      const diffMs = end.getTime() - start.getTime();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60) * 10) / 10;
      return diffHours > 0 ? diffHours : 0;
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Production Schedule' : 'New Production Schedule'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update production schedule details' : 'Schedule production work order on machine'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <ExclamationCircleIcon className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Work Order and Machine Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="inline h-4 w-4 mr-1" />
                Work Order *
              </label>
              <select
                name="work_order_id"
                value={formData.work_order_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Work Order</option>
                {workOrders.map(wo => (
                  <option key={wo.id} value={wo.id}>
                    {wo.wo_number} - {wo.product.name} ({wo.quantity} pcs)
                  </option>
                ))}
              </select>
              {selectedWorkOrder && (
                <p className="mt-1 text-sm text-gray-500">
                  Product: {selectedWorkOrder.product.code} - {selectedWorkOrder.product.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Settings className="inline h-4 w-4 mr-1" />
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
              {selectedMachine && (
                <p className="mt-1 text-sm text-gray-500">
                  Department: {selectedMachine.department} • Status: {selectedMachine.status}
                </p>
              )}
            </div>
          </div>

          {/* Schedule Summary */}
          {selectedWorkOrder && selectedMachine && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Schedule Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Work Order:</span>
                  <div className="font-medium">{selectedWorkOrder.wo_number}</div>
                </div>
                <div>
                  <span className="text-blue-600">Machine:</span>
                  <div className="font-medium">{selectedMachine.name}</div>
                </div>
                <div>
                  <span className="text-blue-600">Quantity:</span>
                  <div className="font-medium">{selectedWorkOrder.quantity} pcs</div>
                </div>
              </div>
            </div>
          )}

          {/* Shift Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Shift *
            </label>
            <select
              name="shift"
              value={formData.shift}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {shifts.map(shift => (
                <option key={shift.value} value={shift.value}>
                  {shift.label}
                </option>
              ))}
            </select>
          </div>

          {/* Schedule Timing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Scheduled Start *
              </label>
              <input
                type="datetime-local"
                name="scheduled_start"
                value={formData.scheduled_start}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Scheduled End *
              </label>
              <input
                type="datetime-local"
                name="scheduled_end"
                value={formData.scheduled_end}
                onChange={handleInputChange}
                required
                min={formData.scheduled_start}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ClockIcon className="inline h-4 w-4 mr-1" />
                Duration (Hours)
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                {calculateDuration().toFixed(1)} hours
              </div>
            </div>
          </div>

          {/* Time Validation */}
          {formData.scheduled_start && formData.scheduled_end && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <strong>Schedule Details:</strong>
              </div>
              <div className="mt-1 text-sm">
                <span className="text-gray-600">Start:</span> {new Date(formData.scheduled_start).toLocaleString('id-ID')}
              </div>
              <div className="text-sm">
                <span className="text-gray-600">End:</span> {new Date(formData.scheduled_end).toLocaleString('id-ID')}
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Duration:</span> {calculateDuration()} hours
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DocumentTextIcon className="inline h-4 w-4 mr-1" />
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter any scheduling notes or special instructions..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/production/schedules')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <X className="inline h-4 w-4 mr-2" />{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="inline h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update Schedule' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductionScheduleForm;
