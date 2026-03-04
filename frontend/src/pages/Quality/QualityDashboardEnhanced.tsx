import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  BellIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  KeyIcon,
  BuildingStorefrontIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
interface QualityDashboardData {
  summary: {
    inspections_today: number;
    inspections_this_week: number;
    pass_rate: number;
    active_alerts: number;
    critical_alerts: number;
    open_capas: number;
    overdue_capas: number;
    total_defects_week: number;
  };
  trends: {
    pass_rate: Array<{
      date: string;
      pass_rate: number;
      inspections: number;
    }>;
  };
  machine_performance: Array<{
    machine: string;
    pass_rate: number;
    total_inspections: number;
  }>;
  last_updated: string;
}

interface QualityAlert {
  id: number;
  alert_number: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  product_name?: string;
  machine_name?: string;
  threshold_value?: number;
  actual_value?: number;
  status: string;
  created_at: string;
}

export default function QualityDashboardEnhanced() {
  const [dashboardData, setDashboardData] = useState<QualityDashboardData | null>(null);
  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchAlerts();
    
    // Auto refresh every 5 minutes
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchAlerts();
    }, 300000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axiosInstance.get('/api/quality-enhanced/dashboard');
      setDashboardData(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await axiosInstance.get('/api/quality-enhanced/alerts?status=active');
      setAlerts(response.data.alerts || []);
    } catch (err: any) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  const acknowledgeAlert = async (alertId: number) => {
    try {
      await axiosInstance.put(`/api/quality-enhanced/alerts/${alertId}/acknowledge`);
      fetchAlerts(); // Refresh alerts
    } catch (err: any) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPassRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={fetchDashboardData} className="btn-primary">
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quality Management Dashboard</h1>
          <p className="text-gray-600">Enhanced quality analytics and monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Last updated: {dashboardData ? new Date(dashboardData.last_updated).toLocaleTimeString() : ''}
          </div>
          <Link to="/app/quality/to-warehouse" className="btn-primary inline-flex items-center gap-2">
            <BuildingStorefrontIcon className="h-5 w-5" />
            Transfer ke Warehouse
          </Link>
          <button onClick={fetchDashboardData} className="btn-secondary">
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link to="/app/quality/pending-qc" className="card p-4 hover:shadow-md transition-shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending QC</p>
              <p className="text-lg font-semibold">Work Orders</p>
            </div>
            <ClockIcon className="h-8 w-8 text-blue-500" />
          </div>
        </Link>
        
        <Link to="/app/quality/to-warehouse" className="card p-4 hover:shadow-md transition-shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">QC Selesai</p>
              <p className="text-lg font-semibold">Transfer ke Warehouse</p>
            </div>
            <BuildingStorefrontIcon className="h-8 w-8 text-green-500" />
          </div>
        </Link>
        
        <Link to="/app/quality/tests/new" className="card p-4 hover:shadow-md transition-shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Buat</p>
              <p className="text-lg font-semibold">QC Test Baru</p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-purple-500" />
          </div>
        </Link>
        
        <Link to="/app/shipping/orders/from-qc" className="card p-4 hover:shadow-md transition-shadow border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Siap Kirim</p>
              <p className="text-lg font-semibold">Buat Shipping</p>
            </div>
            <ArrowRightIcon className="h-8 w-8 text-orange-500" />
          </div>
        </Link>
      </div>

      {/* Critical Alerts */}
      {dashboardData?.summary.critical_alerts > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <BellIcon className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-lg font-semibold text-red-800">
              {dashboardData.summary.critical_alerts} Critical Quality Alert{dashboardData.summary.critical_alerts > 1 ? 's' : ''}
            </h3>
          </div>
          <div className="space-y-2">
            {alerts.filter(alert => alert.severity === 'critical' || alert.severity === 'high').slice(0, 3).map((alert) => (
              <div key={alert.id} className={`p-3 rounded-md border ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{alert.title}</span>
                    <p className="text-sm mt-1">{alert.message}</p>
                    {alert.product_name && (
                      <p className="text-xs mt-1">Product: {alert.product_name}</p>
                    )}
                  </div>
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="btn-sm btn-secondary"
                  >
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KeyIcon Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pass Rate (This Week)</p>
              <p className={`text-2xl font-bold ${getPassRateColor(dashboardData?.summary.pass_rate || 0)}`}>
                {dashboardData?.summary.pass_rate || 0}%
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {dashboardData?.summary.inspections_this_week || 0} inspections
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inspections Today</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData?.summary.inspections_today || 0}</p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData?.summary.active_alerts || 0}</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="mt-2 text-sm text-red-600">
            {dashboardData?.summary.critical_alerts || 0} critical
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open CAPAs</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData?.summary.open_capas || 0}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-purple-500" />
          </div>
          <div className="mt-2 text-sm text-red-600">
            {dashboardData?.summary.overdue_capas || 0} overdue
          </div>
        </div>
      </div>

      {/* Pass Rate Trend Chart */}
      {dashboardData?.trends.pass_rate && dashboardData.trends.pass_rate.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pass Rate Trend (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.trends.pass_rate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Pass Rate']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID')}
                />
                <Line type="monotone" dataKey="pass_rate" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Machine Performance */}
      {dashboardData?.machine_performance && dashboardData.machine_performance.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Machine Quality Performance</h3>
          <div className="space-y-4">
            {dashboardData.machine_performance.map((machine, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{machine.machine}</h4>
                  <p className="text-sm text-gray-600">{machine.total_inspections} inspections</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-semibold ${getPassRateColor(machine.pass_rate)}`}>
                    {machine.pass_rate}%
                  </p>
                  <p className="text-sm text-gray-500">Pass Rate</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/app/quality/inspections/new" className="group bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <DocumentTextIcon className="h-8 w-8 text-blue-500" />
            <ArrowTrendingUpIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">New Inspection</h3>
          <p className="text-sm text-gray-600">Create quality inspection record</p>
        </Link>

        <Link to="/app/quality-enhanced/alerts" className="group bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <BellIcon className="h-8 w-8 text-yellow-500" />
            <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
              {dashboardData?.summary.active_alerts || 0}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality Alerts</h3>
          <p className="text-sm text-gray-600">Manage quality alerts and issues</p>
        </Link>

        <Link to="/app/quality-enhanced/analytics" className="group bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <ChartBarIcon className="h-8 w-8 text-purple-500" />
            <EyeIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
          <p className="text-sm text-gray-600">Quality metrics and trends</p>
        </Link>

        <Link to="/app/quality-enhanced/audits" className="group bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <AcademicCapIcon className="h-8 w-8 text-green-500" />
            <ArrowTrendingUpIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality Audits</h3>
          <p className="text-sm text-gray-600">Audit planning and management</p>
        </Link>
      </div>

      {/* Recent Alerts Summary */}
      {alerts.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Quality Alerts</h3>
            <Link to="/app/quality-enhanced/alerts" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className="font-medium text-gray-900">{alert.title}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(alert.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
                {alert.status === 'active' && (
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="btn-sm btn-secondary ml-4"
                  >
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
