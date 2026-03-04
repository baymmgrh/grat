import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../utils/axiosConfig';
import {
  WrenchScrewdriverIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  Cog6ToothIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MaintenanceStats {
  total_records: number;
  scheduled: number;
  in_progress: number;
  completed: number;
  overdue: number;
  total_cost: number;
  avg_downtime: number;
}

interface MaintenanceRecord {
  id: number;
  record_number: string;
  machine_name: string;
  maintenance_type: string;
  maintenance_date: string;
  status: string;
  cost: number;
  priority?: string;
}

interface MaintenanceSchedule {
  id: number;
  schedule_number: string;
  machine_name: string;
  maintenance_type: string;
  frequency: string;
  next_maintenance_date: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const MaintenanceDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, recordsRes, schedulesRes] = await Promise.all([
        api.get('/api/maintenance/stats'),
        api.get('/api/maintenance/records'),
        api.get('/api/maintenance/schedules')
      ]);
      setStats(statsRes.data.stats);
      setRecords(recordsRes.data.records || []);
      setSchedules(schedulesRes.data.schedules || []);
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // Prepare chart data
  const statusChartData = stats ? [
    { name: 'Scheduled', value: stats.scheduled, color: '#F59E0B' },
    { name: 'In Progress', value: stats.in_progress, color: '#3B82F6' },
    { name: 'Completed', value: stats.completed, color: '#10B981' },
    { name: 'Overdue', value: stats.overdue, color: '#EF4444' }
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('maintenance.dashboard') || 'Maintenance Dashboard'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('maintenance.dashboard_desc') || 'Monitor and manage equipment maintenance'}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/app/maintenance/schedule"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CalendarDaysIcon className="w-5 h-5" />
            <span>Schedules</span>
          </Link>
          <Link
            to="/app/maintenance/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>New Work Order</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Work Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Work Orders</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats?.total_records || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <WrenchScrewdriverIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-blue-600 font-medium">{stats?.in_progress || 0} in progress</span>
          </div>
        </div>

        {/* Scheduled */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Scheduled</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {stats?.scheduled || 0}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
              <ClockIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-red-600 font-medium">{stats?.overdue || 0} overdue</span>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats?.completed || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowTrendingUpIcon className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-green-600 font-medium">
              {stats?.total_records ? Math.round((stats.completed / stats.total_records) * 100) : 0}% completion rate
            </span>
          </div>
        </div>

        {/* Total Cost */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Cost</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                Rp {(stats?.total_cost || 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <CurrencyDollarIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Avg downtime: {(stats?.avg_downtime || 0).toFixed(1)} hrs</span>
          </div>
        </div>
      </div>

      {/* Charts and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Status Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Work Orders */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Work Orders
            </h3>
            <Link to="/app/maintenance/list" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Work Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Machine
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {records.slice(0, 5).map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link to={`/app/maintenance/${record.id}`} className="text-blue-600 hover:text-blue-700 font-medium">
                        {record.record_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {record.machine_name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {record.maintenance_type}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(record.maintenance_date).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No maintenance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upcoming Schedules */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Upcoming Scheduled Maintenance
          </h3>
          <Link to="/app/maintenance/schedule" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Manage Schedules →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.slice(0, 6).map((schedule) => (
            <div key={schedule.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{schedule.machine_name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{schedule.maintenance_type}</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {schedule.frequency}
                </span>
              </div>
              <div className="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <CalendarDaysIcon className="w-4 h-4 mr-1" />
                <span>Next: {new Date(schedule.next_maintenance_date).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          ))}
          {schedules.length === 0 && (
            <div className="col-span-3 text-center py-8 text-gray-500">
              No scheduled maintenance found
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          to="/app/maintenance/new"
          className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          <PlusIcon className="w-6 h-6 text-blue-600" />
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100">New Work Order</p>
            <p className="text-sm text-blue-600 dark:text-blue-400">Create maintenance request</p>
          </div>
        </Link>
        <Link
          to="/app/maintenance/list"
          className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
        >
          <DocumentTextIcon className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">Work Orders</p>
            <p className="text-sm text-green-600 dark:text-green-400">View all records</p>
          </div>
        </Link>
        <Link
          to="/app/maintenance/schedule"
          className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
        >
          <CalendarDaysIcon className="w-6 h-6 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-900 dark:text-yellow-100">Schedules</p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">Preventive maintenance</p>
          </div>
        </Link>
        <Link
          to="/app/maintenance/analytics"
          className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
        >
          <ChartBarIcon className="w-6 h-6 text-purple-600" />
          <div>
            <p className="font-medium text-purple-900 dark:text-purple-100">Analytics</p>
            <p className="text-sm text-purple-600 dark:text-purple-400">Reports & insights</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default MaintenanceDashboard;
