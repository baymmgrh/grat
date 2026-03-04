import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  CalendarIcon as Calendar,
  CheckCircleIcon,
  CheckIcon as Save,
  ClockIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  HashtagIcon as Hash,
  InformationCircleIcon as StatusIcon,
  UserIcon as User

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

interface LeaveFormData {
  leave_number: string;
  employee_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
  notes: string;
}

const LeaveForm: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<LeaveFormData>({
    leave_number: '',
    employee_id: 0,
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    total_days: 0,
    reason: '',
    status: 'pending',
    notes: ''
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const leaveTypes = [
    { value: 'annual', label: 'Annual Leave', color: 'text-blue-600', description: 'Paid vacation leave' },
    { value: 'sick', label: 'Sick Leave', color: 'text-red-600', description: 'Medical leave' },
    { value: 'personal', label: 'Personal Leave', color: 'text-purple-600', description: 'Personal matters' },
    { value: 'maternity', label: 'Maternity Leave', color: 'text-pink-600', description: 'Maternity/paternity leave' },
    { value: 'unpaid', label: 'Unpaid Leave', color: 'text-gray-600', description: 'Leave without pay' },
    { value: 'emergency', label: 'Emergency Leave', color: 'text-orange-600', description: 'Emergency situations' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'text-yellow-600', icon: Pause },
    { value: 'approved', label: 'Approved', color: 'text-green-600', icon: CheckCircle },
    { value: 'rejected', label: 'Rejected', color: 'text-red-600', icon: XCircle },
    { value: 'cancelled', label: 'Cancelled', color: 'text-gray-600', icon: X }
  ];

  useEffect(() => {
    fetchEmployees();
    if (isEdit) {
      fetchLeave();
    } else {
      generateLeaveNumber();
    }
  }, [id]);

  useEffect(() => {
    // Auto-calculate total days when dates are set
    if (formData.start_date && formData.end_date) {
      calculateTotalDays();
    }
  }, [formData.start_date, formData.end_date]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/hr/employees?status=active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const generateLeaveNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    const leaveNumber = `LV-${year}${month}-${timestamp}`;
    
    setFormData(prev => ({
      ...prev,
      leave_number: leaveNumber
    }));
  };

  const fetchLeave = async () => {
    try {
      const response = await fetch(`/api/hr/leaves/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          leave_number: data.leave_number,
          employee_id: data.employee_id,
          leave_type: data.leave_type,
          start_date: data.start_date,
          end_date: data.end_date,
          total_days: data.total_days,
          reason: data.reason || '',
          status: data.status,
          notes: data.notes || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch leave:', error);
    }
  };

  const calculateTotalDays = () => {
    if (!formData.start_date || !formData.end_date) return;

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    
    if (endDate < startDate) {
      setError('End date cannot be before start date');
      return;
    }

    // Calculate business days (excluding weekends)
    let totalDays = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      // Count Monday to Friday (1-5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        totalDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setFormData(prev => ({
      ...prev,
      total_days: totalDays
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.employee_id === 0) {
      setError('Please select an employee');
      setLoading(false);
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      setError('Start date and end date are required');
      setLoading(false);
      return;
    }

    if (formData.total_days <= 0) {
      setError('Leave duration must be at least 1 business day');
      setLoading(false);
      return;
    }

    if (!formData.reason.trim()) {
      setError('Reason for leave is required');
      setLoading(false);
      return;
    }

    try {
      const url = isEdit 
        ? `/api/hr/leaves/${id}` 
        : '/api/hr/leaves';
      
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
        navigate('/app/hr/leaves');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save leave request');
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
      [name]: ['employee_id', 'total_days'].includes(name) 
        ? (value === '' ? 0 : Number(value))
        : value
    }));
  };

  const selectedEmployee = employees.find(emp => emp.id === formData.employee_id);
  const selectedLeaveType = leaveTypes.find(type => type.value === formData.leave_type);
  const selectedStatus = statusOptions.find(status => status.value === formData.status);
  const StatusIcon = selectedStatus?.icon || Pause;

  const getMinEndDate = () => {
    return formData.start_date;
  };

  const getDateDifference = () => {
    if (!formData.start_date || !formData.end_date) return 0;
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end dates
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Leave Request' : 'New Leave Request'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update leave request details' : 'Submit new leave request for employee'}
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

          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Leave Request Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="inline h-4 w-4 mr-1" />
                  Leave Number *
                </label>
                <input
                  type="text"
                  name="leave_number"
                  value={formData.leave_number}
                  onChange={handleInputChange}
                  required
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
                />
              </div>

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
                {selectedEmployee && (
                  <p className="mt-1 text-sm text-gray-500">
                    Department: {selectedEmployee.department?.name || 'N/A'}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leave Type *
                </label>
                <select
                  name="leave_type"
                  value={formData.leave_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {leaveTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {selectedLeaveType && (
                  <p className={`mt-1 text-sm ${selectedLeaveType.color}`}>
                    {selectedLeaveType.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.status')}</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                {selectedStatus && (
                  <div className={`mt-1 flex items-center gap-1 text-sm ${selectedStatus.color}`}>
                    <StatusIcon className="h-4 w-4" />
                    <span>{selectedStatus.label}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Date Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Leave Period
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Start Date *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  required
                  min={getMinEndDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ClockIcon className="inline h-4 w-4 mr-1" />
                  Business Days
                </label>
                <div className="px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg text-blue-700 font-medium">
                  {formData.total_days} days
                </div>
              </div>
            </div>

            {/* Date Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Leave Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Start:</span>
                  <div className="font-medium">
                    {formData.start_date ? new Date(formData.start_date).toLocaleDateString('id-ID') : 'Not set'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">End:</span>
                  <div className="font-medium">
                    {formData.end_date ? new Date(formData.end_date).toLocaleDateString('id-ID') : 'Not set'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <div className="font-medium text-blue-600">{formData.total_days} business days</div>
                </div>
                <div>
                  <span className="text-gray-600">Calendar Days:</span>
                  <div className="font-medium text-gray-600">{getDateDifference()} total days</div>
                </div>
              </div>
            </div>
          </div>

          {/* Reason and Notes */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Leave Details
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="inline h-4 w-4 mr-1" />
                Reason for Leave *
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Please provide a detailed reason for your leave request..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any additional information or special instructions..."
              />
            </div>
          </div>

          {/* Leave Type Information */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Leave Type Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Type:</span>
                <div className={`font-medium ${selectedLeaveType?.color}`}>
                  {selectedLeaveType?.label}
                </div>
              </div>
              <div>
                <span className="text-blue-600">Duration:</span>
                <div className="font-medium">{formData.total_days} business days</div>
              </div>
              <div>
                <span className="text-blue-600">Status:</span>
                <div className={`font-medium ${selectedStatus?.color}`}>
                  {selectedStatus?.label}
                </div>
              </div>
            </div>
            {selectedLeaveType && (
              <div className="mt-2 text-sm text-blue-700">
                <strong>Description:</strong> {selectedLeaveType.description}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/hr/leaves')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <X className="inline h-4 w-4 mr-2" />{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="inline h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update Leave Request' : 'Submit Leave Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveForm;
