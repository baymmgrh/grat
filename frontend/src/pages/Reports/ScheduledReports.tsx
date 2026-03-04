import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  PauseIcon,
  PlayIcon
,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
interface ScheduledReport {
  id: number;
  name: string;
  description: string;
  report_type: string;
  schedule_frequency: string;
  schedule_time: string;
  schedule_day?: string;
  recipients: string[];
  format: string;
  is_active: boolean;
  last_run?: string;
  next_run?: string;
  created_at: string;
}

interface ReportSchedule {
  name: string;
  description: string;
  report_type: string;
  schedule_frequency: string;
  schedule_time: string;
  schedule_day?: string;
  recipients: string;
  format: string;
  parameters: any;
}

const ScheduledReports: React.FC = () => {
  const { t } = useLanguage();

  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState<ReportSchedule>({
    name: '',
    description: '',
    report_type: 'sales',
    schedule_frequency: 'daily',
    schedule_time: '09:00',
    schedule_day: 'monday',
    recipients: '',
    format: 'pdf',
    parameters: {}
  });

  const reportTypes = [
    { value: 'sales', label: 'Sales Report' },
    { value: 'production', label: 'Production Report' },
    { value: 'inventory', label: 'Inventory Report' },
    { value: 'financial', label: 'Financial Report' },
    { value: 'maintenance', label: 'Maintenance Report' },
    { value: 'hr', label: 'HR Report' },
    { value: 'quality', label: 'Quality Report' },
    { value: 'waste', label: 'Waste Report' }
  ];

  const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' }
  ];

  const formats = [
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel' },
    { value: 'csv', label: 'CSV' },
    { value: 'html', label: 'HTML' }
  ];

  const weekDays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  // Load scheduled reports
  const loadScheduledReports = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/reports/scheduled');
      setScheduledReports(response.data?.reports || []);
    } catch (error) {
      console.error('Failed to load scheduled reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScheduledReports();
  }, []);

  // Create scheduled report
  const createScheduledReport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const reportData = {
        ...formData,
        recipients: formData.recipients.split(',').map(email => email.trim())
      };

      await axiosInstance.post('/api/reports/scheduled', reportData);
      
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        report_type: 'sales',
        schedule_frequency: 'daily',
        schedule_time: '09:00',
        schedule_day: 'monday',
        recipients: '',
        format: 'pdf',
        parameters: {}
      });
      
      await loadScheduledReports();
      alert('Scheduled report created successfully!');
    } catch (error) {
      console.error('Failed to create scheduled report:', error);
      alert('Failed to create scheduled report');
    }
  };

  // Toggle report status
  const toggleReportStatus = async (id: number, isActive: boolean) => {
    try {
      await axiosInstance.patch(`/api/reports/scheduled/${id}`, {
        is_active: !isActive
      });
      
      await loadScheduledReports();
    } catch (error) {
      console.error('Failed to toggle report status:', error);
      alert('Failed to update report status');
    }
  };

  // Run report now
  const runReportNow = async (id: number) => {
    try {
      await axiosInstance.post(`/api/reports/scheduled/${id}/run`);
      alert('Report execution started. You will receive the report via email.');
    } catch (error) {
      console.error('Failed to run report:', error);
      alert('Failed to run report');
    }
  };

  // Delete scheduled report
  const deleteScheduledReport = async (id: number) => {
    if (!confirm('Are you sure you want to delete this scheduled report?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/api/reports/scheduled/${id}`);
      await loadScheduledReports();
      alert('Scheduled report deleted successfully!');
    } catch (error) {
      console.error('Failed to delete scheduled report:', error);
      alert('Failed to delete scheduled report');
    }
  };

  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
      : <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Inactive</span>;
  };

  // Get frequency display
  const getFrequencyDisplay = (frequency: string, day?: string, time?: string) => {
    let display = frequency.charAt(0).toUpperCase() + frequency.slice(1);
    
    if (frequency === 'weekly' && day) {
      display += ` on ${day.charAt(0).toUpperCase() + day.slice(1)}`;
    }
    
    if (time) {
      display += ` at ${time}`;
    }
    
    return display;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading scheduled reports...</span>
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
              Scheduled Reports
            </h1>
            <p className="text-gray-600">
              Automate report generation and delivery on schedule
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Schedule Report
          </button>
        </div>
      </div>

      {/* Scheduled Reports Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scheduledReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {report.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {report.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {reportTypes.find(t => t.value === report.report_type)?.label || report.report_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                      {getFrequencyDisplay(report.schedule_frequency, report.schedule_day, report.schedule_time)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-1" />
                      {report.recipients.length} recipient(s)
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(report.is_active)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.last_run 
                      ? new Date(report.last_run).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => runReportNow(report.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Run Now"
                      >
                        <PlayIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => toggleReportStatus(report.id, report.is_active)}
                        className={`${report.is_active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                        title={report.is_active ? 'Pause' : 'Activate'}
                      >
                        {report.is_active ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                      </button>
                      
                      <button
                        onClick={() => deleteScheduledReport(report.id)}
                        className="text-red-600 hover:text-red-900"
                        title={t('common.delete')}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {scheduledReports.length === 0 && (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled reports</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first scheduled report.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Schedule Report
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule New Report</h3>
              
              <form onSubmit={createScheduledReport} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Report Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('common.description')}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Report Type</label>
                  <select
                    value={formData.report_type}
                    onChange={(e) => setFormData({...formData, report_type: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {reportTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Frequency</label>
                  <select
                    value={formData.schedule_frequency}
                    onChange={(e) => setFormData({...formData, schedule_frequency: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {frequencies.map((freq) => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.schedule_frequency === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Day of Week</label>
                    <select
                      value={formData.schedule_day}
                      onChange={(e) => setFormData({...formData, schedule_day: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      {weekDays.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <input
                    type="time"
                    value={formData.schedule_time}
                    onChange={(e) => setFormData({...formData, schedule_time: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Recipients (comma-separated emails)</label>
                  <textarea
                    value={formData.recipients}
                    onChange={(e) => setFormData({...formData, recipients: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={2}
                    placeholder="email1@company.com, email2@company.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Format</label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({...formData, format: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {formats.map((format) => (
                      <option key={format.value} value={format.value}>
                        {format.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >{t('common.cancel')}</button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Schedule Report
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

export default ScheduledReports;
