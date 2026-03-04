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
  ExclamationTriangleIcon,
  MapPinIcon,
  ClockIcon as Timer,
  UserIcon as User,
  XCircleIcon,
  XMarkIcon
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

interface ShiftSchedule {
  id: number;
  shift_name: string;
  start_time: string;
  end_time: string;
  break_duration: number;
}

interface AttendanceFormData {
  employee_id: number;
  attendance_date: string;
  shift_id: number | null;
  clock_in: string;
  clock_out: string;
  status: string;
  worked_hours: number;
  overtime_hours: number;
  notes: string;
}

const AttendanceForm: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<AttendanceFormData>({
    employee_id: 0,
    attendance_date: new Date().toISOString().split('T')[0],
    shift_id: null,
    clock_in: '',
    clock_out: '',
    status: 'present',
    worked_hours: 0,
    overtime_hours: 0,
    notes: ''
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<ShiftSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const statusOptions = [
    { value: 'present', label: 'Present', color: 'text-green-600', icon: CheckCircle },
    { value: 'absent', label: 'Absent', color: 'text-red-600', icon: XCircle },
    { value: 'late', label: 'Late', color: 'text-orange-600', icon: ClockIcon },
    { value: 'half_day', label: 'Half Day', color: 'text-blue-600', icon: Timer }
  ];

  useEffect(() => {
    fetchEmployees();
    fetchShifts();
    if (isEdit) {
      fetchAttendance();
    }
  }, [id]);

  useEffect(() => {
    // Auto-calculate worked hours when clock in/out times are set
    if (formData.clock_in && formData.clock_out) {
      calculateWorkedHours();
    }
  }, [formData.clock_in, formData.clock_out]);

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

  const fetchShifts = async () => {
    try {
      const response = await fetch('/api/hr/shifts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setShifts(data.shifts || []);
      }
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await fetch(`/api/hr/attendances/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          employee_id: data.employee_id,
          attendance_date: data.attendance_date,
          shift_id: data.shift_id,
          clock_in: data.clock_in ? data.clock_in.substring(11, 16) : '',
          clock_out: data.clock_out ? data.clock_out.substring(11, 16) : '',
          status: data.status,
          worked_hours: data.worked_hours || 0,
          overtime_hours: data.overtime_hours || 0,
          notes: data.notes || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    }
  };

  const calculateWorkedHours = () => {
    if (!formData.clock_in || !formData.clock_out) return;

    const clockIn = new Date(`${formData.attendance_date}T${formData.clock_in}`);
    const clockOut = new Date(`${formData.attendance_date}T${formData.clock_out}`);
    
    // Handle overnight shifts
    if (clockOut < clockIn) {
      clockOut.setDate(clockOut.getDate() + 1);
    }

    const diffMs = clockOut.getTime() - clockIn.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    const selectedShift = shifts.find(s => s.id === formData.shift_id);
    const standardHours = selectedShift ? 8 : 8; // Default 8 hours
    
    const workedHours = Math.max(0, diffHours - (selectedShift?.break_duration || 60) / 60);
    const overtimeHours = Math.max(0, workedHours - standardHours);
    const regularHours = workedHours - overtimeHours;

    setFormData(prev => ({
      ...prev,
      worked_hours: Math.round(regularHours * 100) / 100,
      overtime_hours: Math.round(overtimeHours * 100) / 100
    }));
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

    if (formData.status === 'present' && (!formData.clock_in || !formData.clock_out)) {
      setError('ClockIcon in and clock out times are required for present status');
      setLoading(false);
      return;
    }

    try {
      const url = isEdit 
        ? `/api/hr/attendances/${id}` 
        : '/api/hr/attendances';
      
      const method = isEdit ? 'PUT' : 'POST';

      // Prepare data for submission
      const submitData = {
        ...formData,
        clock_in: formData.clock_in ? `${formData.attendance_date}T${formData.clock_in}:00` : null,
        clock_out: formData.clock_out ? `${formData.attendance_date}T${formData.clock_out}:00` : null
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        navigate('/app/hr/attendance');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save attendance');
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
      [name]: ['employee_id', 'shift_id', 'worked_hours', 'overtime_hours'].includes(name) 
        ? (value === '' ? (name.includes('_id') ? (name === 'shift_id' ? null : 0) : 0) : Number(value))
        : value
    }));
  };

  const setCurrentTime = (field: 'clock_in' | 'clock_out') => {
    const now = new Date();
    const timeString = now.toTimeString().substring(0, 5);
    setFormData(prev => ({
      ...prev,
      [field]: timeString
    }));
  };

  const selectedEmployee = employees.find(emp => emp.id === formData.employee_id);
  const selectedShift = shifts.find(shift => shift.id === formData.shift_id);
  const selectedStatus = statusOptions.find(status => status.value === formData.status);
  const StatusIcon = selectedStatus?.icon || CheckCircle;

  const getTotalHours = () => {
    return formData.worked_hours + formData.overtime_hours;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Attendance' : 'New Attendance Record'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update employee attendance record' : 'Record employee attendance for the day'}
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
              Attendance Information
            </h3>

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
                {selectedEmployee && (
                  <p className="mt-1 text-sm text-gray-500">
                    Department: {selectedEmployee.department?.name || 'N/A'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Attendance Date *
                </label>
                <input
                  type="date"
                  name="attendance_date"
                  value={formData.attendance_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPinIcon className="inline h-4 w-4 mr-1" />
                  Shift Schedule
                </label>
                <select
                  name="shift_id"
                  value={formData.shift_id || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No Specific Shift</option>
                  {shifts.map(shift => (
                    <option key={shift.id} value={shift.id}>
                      {shift.shift_name} ({shift.start_time} - {shift.end_time})
                    </option>
                  ))}
                </select>
                {selectedShift && (
                  <p className="mt-1 text-sm text-gray-500">
                    Break: {selectedShift.break_duration} minutes
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
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
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <span>{selectedStatus.label}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Time Information */}
          {formData.status === 'present' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Time Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ClockIcon className="inline h-4 w-4 mr-1" />
                    ClockIcon In Time *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      name="clock_in"
                      value={formData.clock_in}
                      onChange={handleInputChange}
                      required
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setCurrentTime('clock_in')}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ClockIcon Out Time *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      name="clock_out"
                      value={formData.clock_out}
                      onChange={handleInputChange}
                      required
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setCurrentTime('clock_out')}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Timer className="inline h-4 w-4 mr-1" />
                    Regular Hours
                  </label>
                  <input
                    type="number"
                    name="worked_hours"
                    value={formData.worked_hours}
                    onChange={handleInputChange}
                    min="0"
                    max="24"
                    step="0.25"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overtime Hours
                  </label>
                  <input
                    type="number"
                    name="overtime_hours"
                    value={formData.overtime_hours}
                    onChange={handleInputChange}
                    min="0"
                    max="12"
                    step="0.25"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Hours
                  </label>
                  <div className="px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg text-blue-700 font-medium">
                    {getTotalHours().toFixed(2)} hours
                  </div>
                </div>
              </div>

              {/* Time Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Time Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">ClockIcon In:</span>
                    <div className="font-medium">{formData.clock_in || 'Not set'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">ClockIcon Out:</span>
                    <div className="font-medium">{formData.clock_out || 'Not set'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Regular:</span>
                    <div className="font-medium text-green-600">{formData.worked_hours}h</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Overtime:</span>
                    <div className="font-medium text-orange-600">{formData.overtime_hours}h</div>
                  </div>
                </div>
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
              placeholder="Enter any additional notes about this attendance record..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/hr/attendance')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <X className="inline h-4 w-4 mr-2" />{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="inline h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update Attendance' : 'Save Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceForm;
