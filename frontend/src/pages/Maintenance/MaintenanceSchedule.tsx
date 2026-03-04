import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  CalendarIcon,
  ClockIcon,
  CogIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  PlayIcon
,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
interface MaintenanceSchedule {
  id: number;
  schedule_number: string;
  machine_id: number;
  machine_name: string;
  maintenance_type: string;
  frequency: string;
  frequency_value: number;
  last_maintenance_date?: string;
  next_maintenance_date: string;
  estimated_duration_hours?: number;
  assigned_to?: number;
  assigned_name?: string;
  is_active: boolean;
  notes?: string;
}

interface Machine {
  id: number;
  name: string;
  code: string;
  status: string;
}

const MaintenanceSchedule: React.FC = () => {
  const { t } = useLanguage();

  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state for creating new schedule
  const [formData, setFormData] = useState({
    machine_id: '',
    maintenance_type: 'preventive',
    frequency: 'monthly',
    frequency_value: 30,
    next_maintenance_date: '',
    estimated_duration_hours: 2,
    assigned_to: '',
    notes: ''
  });

  // Load schedules and machines
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📅 Loading maintenance schedules...');

      // Load schedules
      const schedulesResponse = await axiosInstance.get('/api/maintenance/schedules');
      console.log('📊 Schedules loaded:', schedulesResponse.data);

      // Load machines
      const machinesResponse = await axiosInstance.get('/api/production/machines');
      console.log('🏭 Machines loaded:', machinesResponse.data);

      setSchedules(schedulesResponse.data?.schedules || []);
      setMachines(machinesResponse.data?.machines || []);

      console.log('✅ Schedule data loaded successfully');

    } catch (error: any) {
      console.error('❌ Failed to load schedule data:', error);
      setError(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Create new schedule
  const createSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const scheduleData = {
        ...formData,
        machine_id: parseInt(formData.machine_id),
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        next_maintenance_date: formData.next_maintenance_date
      };

      console.log('📝 Creating schedule:', scheduleData);

      const response = await axiosInstance.post('/api/maintenance/schedules', scheduleData);
      
      if (response.status === 201) {
        console.log('✅ Schedule created successfully');
        setShowCreateModal(false);
        setFormData({
          machine_id: '',
          maintenance_type: 'preventive',
          frequency: 'monthly',
          frequency_value: 30,
          next_maintenance_date: '',
          estimated_duration_hours: 2,
          assigned_to: '',
          notes: ''
        });
        await loadData();
        alert('Maintenance schedule created successfully!');
      }
    } catch (error: any) {
      console.error('❌ Failed to create schedule:', error);
      alert('Failed to create schedule: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate maintenance from schedule
  const generateMaintenance = async (scheduleId: number) => {
    if (!confirm('Generate maintenance record from this schedule?')) {
      return;
    }

    try {
      const response = await axiosInstance.post(`/api/maintenance/schedules/${scheduleId}/generate`);
      
      if (response.status === 201) {
        alert('Maintenance record generated successfully!');
        await loadData();
      }
    } catch (error: any) {
      console.error('❌ Failed to generate maintenance:', error);
      alert('Failed to generate maintenance: ' + error.message);
    }
  };

  // Get frequency display
  const getFrequencyDisplay = (frequency: string, value: number) => {
    const frequencyMap: Record<string, string> = {
      daily: `Every ${value} day(s)`,
      weekly: `Every ${value} week(s)`,
      monthly: `Every ${value} month(s)`,
      quarterly: `Every ${value} quarter(s)`,
      yearly: `Every ${value} year(s)`
    };
    return frequencyMap[frequency] || `Every ${value} ${frequency}`;
  };

  // Get status badge
  const getStatusBadge = (schedule: MaintenanceSchedule) => {
    const nextDate = new Date(schedule.next_maintenance_date);
    const today = new Date();
    const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Overdue</span>;
    } else if (daysUntil <= 7) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Due Soon</span>;
    } else {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Scheduled</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading maintenance schedules...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            <strong>Error:</strong> {error}
          </div>
          <button 
            onClick={loadData}
            className="mt-3 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Maintenance Schedules
            </h1>
            <p className="text-gray-600">
              Manage preventive maintenance schedules and automated planning
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Schedule
            </button>
            
            <button
              onClick={loadData}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <EyeIcon className="h-5 w-5 mr-2" />
            </button>
          </div>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('production.machine')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Maintenance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {schedule.schedule_number}
                    </div>
                    <div className="text-sm text-gray-500">
                      Duration: {schedule.estimated_duration_hours || 'N/A'}h
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CogIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="text-sm text-gray-900">{schedule.machine_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{schedule.maintenance_type}</div>
                    <div className="text-sm text-gray-500">
                      {getFrequencyDisplay(schedule.frequency, schedule.frequency_value)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(schedule.next_maintenance_date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {schedule.last_maintenance_date 
                        ? `Last: ${new Date(schedule.last_maintenance_date).toLocaleDateString()}`
                        : 'No previous maintenance'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(schedule)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => generateMaintenance(schedule.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Generate Maintenance"
                      >
                        <PlayIcon className="h-4 w-4" />
                      </button>
                      
                      <Link
                        to={`/app/maintenance/schedules/${schedule.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Schedule"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      
                      <button
                        onClick={() => {/* TODO: Delete schedule */}}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Schedule"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {schedules.length === 0 && (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No maintenance schedules</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first maintenance schedule.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Schedule
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Schedule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Maintenance Schedule</h3>
              
              <form onSubmit={createSchedule} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('production.machine')}</label>
                  <select
                    value={formData.machine_id}
                    onChange={(e) => setFormData({...formData, machine_id: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    <option value="">Select Machine</option>
                    {machines.map((machine) => (
                      <option key={machine.id} value={machine.id}>
                        {machine.name} ({machine.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Maintenance Type</label>
                  <select
                    value={formData.maintenance_type}
                    onChange={(e) => setFormData({...formData, maintenance_type: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="preventive">Preventive</option>
                    <option value="predictive">Predictive</option>
                    <option value="corrective">Corrective</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Frequency Value</label>
                  <input
                    type="number"
                    value={formData.frequency_value}
                    onChange={(e) => setFormData({...formData, frequency_value: parseInt(e.target.value)})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Next Maintenance Date</label>
                  <input
                    type="datetime-local"
                    value={formData.next_maintenance_date}
                    onChange={(e) => setFormData({...formData, next_maintenance_date: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Duration (hours)</label>
                  <input
                    type="number"
                    value={formData.estimated_duration_hours}
                    onChange={(e) => setFormData({...formData, estimated_duration_hours: parseInt(e.target.value)})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    min="0.5"
                    step="0.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >{t('common.cancel')}</button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceSchedule;
