import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ChartBarIcon,
  CheckCircleIcon,
  CogIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  PauseIcon,
  PlayIcon

} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface WIPBatch {
  id: number;
  wip_batch_no: string;
  work_order_no: string;
  product_name: string;
  current_stage: string;
  machine_name?: string;
  line_name?: string;
  qty_started: number;
  qty_completed: number;
  qty_rejected: number;
  qty_in_process: number;
  completion_percentage: number;
  rejection_rate: number;
  material_cost: number;
  labor_cost: number;
  overhead_cost: number;
  total_wip_value: number;
  status: string;
  operator_name?: string;
  shift?: string;
  started_at?: string;
  completed_at?: string;
  duration_minutes?: number;
}

interface DashboardData {
  summary: {
    total_wip_value: number;
    total_batches: number;
    active_batches: number;
    completed_batches: number;
  };
  stage_distribution: Record<string, { count: number; value: number }>;
  wip_trend: Array<{ date: string; wip_value: number }>;
  stage_performance: Array<{
    stage: string;
    avg_processing_time: number;
    total_good: number;
    total_rejected: number;
    rejection_rate: number;
  }>;
  cost_breakdown: Record<string, number>;
}

interface BottleneckData {
  bottleneck_analysis: Array<{
    stage: string;
    batch_count: number;
    total_wip_value: number;
    avg_qty_in_process: number;
    is_bottleneck: boolean;
    severity: 'high' | 'medium' | 'low';
  }>;
  total_bottlenecks: number;
}

const WIPDashboard: React.FC = () => {
  const { t } = useLanguage();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [bottleneckData, setBottleneckData] = useState<BottleneckData | null>(null);
  const [wipBatches, setWipBatches] = useState<WIPBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchDashboardData();
    fetchBottleneckData();
    fetchWIPBatches();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      const response = await axiosInstance.get('/api/wip/wip-dashboard', {
        params: {
          date_from: dateRange.from,
          date_to: dateRange.to
        }
      });
      setDashboardData(response.data);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error.response?.data?.error || 'Failed to fetch dashboard data');
    }
  };

  const fetchBottleneckData = async () => {
    try {
      const response = await axiosInstance.get('/api/wip/wip-analytics/bottleneck');
      setBottleneckData(response.data);
    } catch (error: any) {
      console.error('Failed to fetch bottleneck data:', error);
    }
  };

  const fetchWIPBatches = async () => {
    try {
      const response = await axiosInstance.get('/api/wip/wip-batches', {
        params: {
          status: 'open,in_progress',
          date_from: dateRange.from,
          date_to: dateRange.to
        }
      });
      setWipBatches(response.data.wip_batches || []);
    } catch (error: any) {
      console.error('Failed to fetch WIP batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <PlayIcon className="h-5 w-5 text-blue-500" />;
      case 'in_progress':
        return <CogIcon className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default:
        return <PauseIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Chart colors
  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316'];

  // Prepare chart data
  const stageDistributionData = dashboardData ? Object.entries(dashboardData.stage_distribution).map(([stage, data]) => ({
    stage: stage.replace('_', ' ').toUpperCase(),
    count: data.count,
    value: data.value
  })) : [];

  const costBreakdownData = dashboardData ? Object.entries(dashboardData.cost_breakdown).map(([type, value]) => ({
    name: type.replace('_', ' ').toUpperCase(),
    value: value
  })) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading WIP dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button onClick={fetchDashboardData} className="btn-primary">
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WIP Dashboard</h1>
          <p className="text-gray-600">Work in Progress Monitoring & Job Costing</p>
        </div>
        
        {/* Date Range FunnelIcon */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="input-field"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total WIP Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboardData.summary.total_wip_value)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Batches</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.summary.active_batches}
                </p>
                <p className="text-xs text-gray-500">
                  of {dashboardData.summary.total_batches} total
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed Batches</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.summary.completed_batches}
                </p>
                <p className="text-xs text-gray-500">
                  {((dashboardData.summary.completed_batches / dashboardData.summary.total_batches) * 100).toFixed(1)}% completion rate
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Bottlenecks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bottleneckData?.total_bottlenecks || 0}
                </p>
                <p className="text-xs text-gray-500">stages need attention</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">WIP by Production Stage</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stageDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3B82F6" name="Batch Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">Cost Breakdown</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* WIP Trend */}
      {dashboardData && dashboardData.wip_trend.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">WIP Value Trend (Last 7 Days)</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dashboardData.wip_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area type="monotone" dataKey="wip_value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Bottleneck Analysis */}
      {bottleneckData && bottleneckData.bottleneck_analysis.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">Bottleneck Analysis</h3>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Production Stage</th>
                    <th>Batch Count</th>
                    <th>WIP Value</th>
                    <th>Avg Qty in Process</th>
                    <th>Severity</th>
                    <th>{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {bottleneckData.bottleneck_analysis.map((bottleneck, index) => (
                    <tr key={index}>
                      <td className="font-medium">
                        {bottleneck.stage.replace('_', ' ').toUpperCase()}
                      </td>
                      <td>{bottleneck.batch_count}</td>
                      <td>{formatCurrency(bottleneck.total_wip_value)}</td>
                      <td>{bottleneck.avg_qty_in_process.toFixed(1)}</td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(bottleneck.severity)}`}>
                          {bottleneck.severity.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {bottleneck.is_bottleneck ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Active WIP Batches */}
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Active WIP Batches</h3>
            <Link to="/app/production/wip-batches" className="btn-primary">
              View All Batches
            </Link>
          </div>
        </div>
        <div className="card-body">
          {wipBatches.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>WIP Batch No</th>
                    <th>Work Order</th>
                    <th>{t('production.product')}</th>
                    <th>Current Stage</th>
                    <th>Progress</th>
                    <th>WIP Value</th>
                    <th>{t('common.status')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {wipBatches.slice(0, 10).map((batch) => (
                    <tr key={batch.id}>
                      <td className="font-medium">{batch.wip_batch_no}</td>
                      <td>{batch.work_order_no}</td>
                      <td>{batch.product_name}</td>
                      <td>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {batch.current_stage.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${batch.completion_percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">
                            {batch.completion_percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td>{formatCurrency(batch.total_wip_value)}</td>
                      <td>
                        <div className="flex items-center">
                          {getStatusIcon(batch.status)}
                          <span className="ml-1 text-sm capitalize">{batch.status}</span>
                        </div>
                      </td>
                      <td>
                        <Link
                          to={`/app/production/wip-batches/${batch.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active WIP Batches</h3>
              <p className="text-gray-500">No work in progress batches found for the selected date range.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/app/production/wip-batches/new" className="card hover:shadow-lg transition-shadow">
          <div className="card-body text-center">
            <PlayIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-gray-900">Start New WIP Batch</h3>
            <p className="text-gray-500">Create WIP batch from work order</p>
          </div>
        </Link>

        <Link to="/app/production/job-costs" className="card hover:shadow-lg transition-shadow">
          <div className="card-body text-center">
            <CurrencyDollarIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-gray-900">Job Costing</h3>
            <p className="text-gray-500">Track production costs</p>
          </div>
        </Link>

        <Link to="/app/production/wip-analytics" className="card hover:shadow-lg transition-shadow">
          <div className="card-body text-center">
            <ChartBarIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-gray-900">WIP Analytics</h3>
            <p className="text-gray-500">Advanced WIP analysis</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default WIPDashboard;
