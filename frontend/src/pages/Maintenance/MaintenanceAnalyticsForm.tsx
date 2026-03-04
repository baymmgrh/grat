import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  ArrowDownTrayIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  CheckCircleIcon as CheckCircle,
  ClockIcon,
  CubeIcon,
  CurrencyDollarIcon,
  FunnelIcon
,
  WrenchIcon as Wrench
} from '@heroicons/react/24/outline';
interface AnalyticsFilters {
  date_from: string;
  date_to: string;
  machine_id: string;
  maintenance_type: string;
  department: string;
  report_type: string;
}

interface AnalyticsData {
  summary: {
    total_work_orders: number;
    completed_work_orders: number;
    pending_work_orders: number;
    total_cost: number;
    average_completion_time: number;
    mttr: number; // Mean Time To Repair
    mtbf: number; // Mean Time Between Failures
    availability_rate: number;
  };
  charts: {
    maintenance_by_type: Array<{ name: string; value: number; color: string }>;
    monthly_trends: Array<{ month: string; work_orders: number; cost: number; mttr: number }>;
    machine_performance: Array<{ machine: string; availability: number; mttr: number; cost: number }>;
    cost_breakdown: Array<{ category: string; amount: number; percentage: number }>;
    downtime_analysis: Array<{ reason: string; hours: number; frequency: number }>;
  };
  kpis: {
    preventive_ratio: number;
    emergency_ratio: number;
    cost_per_hour: number;
    parts_cost_ratio: number;
    labor_cost_ratio: number;
    schedule_compliance: number;
  };
}

const MaintenanceAnalyticsForm: React.FC = () => {
  const { t } = useLanguage();

  const [filters, setFilters] = useState<AnalyticsFilters>({
    date_from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    machine_id: '',
    maintenance_type: '',
    department: '',
    report_type: 'overview'
  });

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [machines, setMachines] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  const reportTypes = [
    { value: 'overview', label: 'Overview Report', icon: ChartBarIcon },
    { value: 'performance', label: 'Performance Analysis', icon: ArrowTrendingUpIcon },
    { value: 'cost_analysis', label: 'Cost Analysis', icon: CurrencyDollarIcon },
    { value: 'downtime', label: 'Downtime Analysis', icon: ClockIcon },
    { value: 'parts_usage', label: 'Parts Usage', icon: CubeIcon },
    { value: 'compliance', label: 'Compliance Report', icon: CheckCircle }
  ];

  const maintenanceTypes = [
    'preventive',
    'corrective',
    'emergency',
    'inspection',
    'calibration'
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  useEffect(() => {
    fetchMachines();
    fetchDepartments();
  }, []);

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

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/hr/departments', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments?.map((d: any) => d.name) || []);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const generateAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/maintenance/analytics?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        alert('Failed to generate analytics');
      }
    } catch (error) {
      alert('Error generating analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('format', format);

      const response = await fetch(`/api/maintenance/analytics/export?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `maintenance_analytics_${filters.report_type}_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      alert('Error exporting report');
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)} hrs`;
  };

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value >= threshold) return 'text-green-600';
    if (value >= threshold * 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Analytics</h1>
          <p className="text-gray-600">Comprehensive maintenance performance analysis and reporting</p>
        </div>
        
        {analyticsData && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportReport('excel')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <ArrowDownTrayIcon className="inline h-4 w-4 mr-2" />
              Export Excel
            </button>
            <button
              onClick={() => exportReport('pdf')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <ArrowDownTrayIcon className="inline h-4 w-4 mr-2" />
              Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          <FunnelIcon className="inline h-4 w-4 mr-1" />
          Analytics Filters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              name="report_type"
              value={filters.report_type}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('production.machine')}</label>
            <select
              name="machine_id"
              value={filters.machine_id}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Machines</option>
              {machines.map(machine => (
                <option key={machine.id} value={machine.id}>{machine.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Type</label>
            <select
              name="maintenance_type"
              value={filters.maintenance_type}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              {maintenanceTypes.map(type => (
                <option key={type} value={type}>{type.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              onClick={generateAnalytics}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
              ) : (
                <>
                  <ChartBarIcon className="inline h-4 w-4 mr-2" />
                  Generate Analytics
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Results */}
      {analyticsData && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <Wrench className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Work Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.summary.total_work_orders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {((analyticsData.summary.completed_work_orders / analyticsData.summary.total_work_orders) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">MTTR</p>
                  <p className="text-2xl font-bold text-gray-900">{formatHours(analyticsData.summary.mttr)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">{t('products.bom.total_cost')}</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.summary.total_cost)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getPerformanceColor(analyticsData.summary.availability_rate, 85)}`}>
                  {analyticsData.summary.availability_rate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Equipment Availability</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getPerformanceColor(analyticsData.kpis.preventive_ratio, 70)}`}>
                  {analyticsData.kpis.preventive_ratio.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Preventive Maintenance</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getPerformanceColor(analyticsData.kpis.schedule_compliance, 90)}`}>
                  {analyticsData.kpis.schedule_compliance.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Schedule Compliance</div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Maintenance by Type */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Maintenance by Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.charts.maintenance_by_type}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.charts.maintenance_by_type.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Trends */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.charts.monthly_trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="work_orders" fill="#3B82F6" name="Work Orders" />
                  <Line yAxisId="right" type="monotone" dataKey="mttr" stroke="#EF4444" name="MTTR (hrs)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Machine Performance */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Machine Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.charts.machine_performance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="machine" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="availability" fill="#10B981" name="Availability %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.charts.cost_breakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category} ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {analyticsData.charts.cost_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Downtime Analysis Table */}
          {filters.report_type === 'downtime' && analyticsData.charts.downtime_analysis.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Downtime Analysis</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg per Incident
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.charts.downtime_analysis.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatHours(item.hours)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.frequency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatHours(item.hours / item.frequency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!analyticsData && !loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Generated</h3>
            <p className="text-gray-600 mb-4">
              Configure your filters and click "Generate Analytics" to view maintenance performance data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceAnalyticsForm;
