import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../utils/axiosConfig';
import {
  ArrowPathIcon as Activity,
  ArrowDownTrayIcon,
  ArrowPathIcon as RefreshCw,
  ArrowTrendingDownIcon as ArrowDownRight,
  ArrowTrendingUpIcon as ArrowUpRight,
  ArrowTrendingUpIcon,
  CalendarIcon as Calendar,
  ChartBarIcon,
  CheckCircleIcon as CheckCircle,
  ClockIcon,
  CogIcon as Settings,
  CurrencyDollarIcon,
  ExclamationTriangleIcon as AlertTriangle,
  PlusIcon as Plus,
  WrenchIcon as Wrench
} from '@heroicons/react/24/outline';
interface MaintenanceKPIs {
  total_work_orders: number;
  pending_work_orders: number;
  completed_work_orders: number;
  overdue_work_orders: number;
  total_cost_this_month: number;
  avg_completion_time: number;
  mttr: number; // Mean Time To Repair
  mtbf: number; // Mean Time Between Failures
  preventive_percentage: number;
  equipment_uptime: number;
}

interface MaintenanceAlert {
  id: number;
  machine_name: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  created_at: string;
  status: string;
}

interface WorkOrderSummary {
  id: number;
  record_number: string;
  machine_name: string;
  maintenance_type: string;
  priority: string;
  status: string;
  scheduled_date: string;
  assigned_to: string;
  estimated_duration: number;
}

interface MaintenanceTrend {
  month: string;
  preventive: number;
  corrective: number;
  emergency: number;
  cost: number;
}

interface EquipmentPerformance {
  machine_name: string;
  uptime_percentage: number;
  mttr: number;
  mtbf: number;
  maintenance_cost: number;
  last_maintenance: string;
}

const MaintenanceDashboardEnhanced: React.FC = () => {
  const { t } = useLanguage();

  const [kpis, setKpis] = useState<MaintenanceKPIs>({} as MaintenanceKPIs);
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrderSummary[]>([]);
  const [trends, setTrends] = useState<MaintenanceTrend[]>([]);
  const [equipmentPerformance, setEquipmentPerformance] = useState<EquipmentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedMachine, setSelectedMachine] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod, selectedMachine]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch KPIs
      try {
        const kpiResponse = await api.get(`/api/maintenance/dashboard/kpis?period=${selectedPeriod}&machine=${selectedMachine}`);
        setKpis(kpiResponse.data);
      } catch (e) {
        console.log('KPIs endpoint not available');
      }

      // Fetch Alerts
      try {
        const alertsResponse = await api.get('/api/maintenance/alerts?status=active');
        setAlerts(alertsResponse.data.alerts || []);
      } catch (e) {
        console.log('Alerts endpoint not available');
      }

      // Fetch Work Orders
      try {
        const workOrdersResponse = await api.get('/api/maintenance/work-orders/summary');
        setWorkOrders(workOrdersResponse.data.work_orders || []);
      } catch (e) {
        console.log('Work orders endpoint not available');
      }

      // Fetch Trends
      try {
        const trendsResponse = await api.get(`/api/maintenance/analytics/trends?period=${selectedPeriod}`);
        setTrends(trendsResponse.data.trends || []);
      } catch (e) {
        console.log('Trends endpoint not available');
      }

      // Fetch Equipment Performance
      try {
        const performanceResponse = await api.get('/api/maintenance/analytics/equipment-performance');
        setEquipmentPerformance(performanceResponse.data.equipment || []);
      } catch (e) {
        console.log('Equipment performance endpoint not available');
      }

    } catch (error) {
      console.error('Failed to fetch maintenance dashboard data:', error);
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDuration = (hours: number) => {
    if (hours < 24) {
      return `${hours.toFixed(1)} hours`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours.toFixed(1)}h`;
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Dashboard</h1>
          <p className="text-gray-600">Monitor equipment performance and maintenance activities</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 inline mr-2" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Work Orders</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.total_work_orders || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Wrench className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600">
              {kpis.pending_work_orders || 0} pending, {kpis.completed_work_orders || 0} completed
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Equipment Uptime</p>
              <p className="text-2xl font-bold text-gray-900">{(kpis.equipment_uptime || 0).toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+2.3% from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">MTTR</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(kpis.mttr || 0)}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowDownRight className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">-15% improvement</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Cost</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpis.total_cost_this_month || 0)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600">
              {(kpis.preventive_percentage || 0).toFixed(1)}% preventive
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance Trends */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Maintenance Trends</h3>
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="preventive" stackId="1" stroke="#10B981" fill="#10B981" />
              <Area type="monotone" dataKey="corrective" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
              <Area type="monotone" dataKey="emergency" stackId="1" stroke="#EF4444" fill="#EF4444" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Analysis */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Cost Analysis</h3>
            <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="cost" stroke="#3B82F6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts and Work Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Active Alerts</h3>
            <AlertTriangle className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
                <p>No active alerts</p>
                <p className="text-sm">All systems running normally</p>
              </div>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{alert.machine_name}</p>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Work Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Recent Work Orders</h3>
            <Settings className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {workOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No work orders</p>
                <p className="text-sm">Create your first work order</p>
              </div>
            ) : (
              workOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">{order.record_number}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{order.machine_name}</p>
                    <p className="text-xs text-gray-400">
                      {order.maintenance_type} • {order.assigned_to}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">{formatDuration(order.estimated_duration)}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.scheduled_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Equipment Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Equipment Performance</h3>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
              Export Report
            </button>
            <ArrowDownTrayIcon className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Maintenance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {equipmentPerformance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No equipment performance data available</p>
                  </td>
                </tr>
              ) : (
                equipmentPerformance.map((equipment, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{equipment.machine_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900">{equipment.uptime_percentage.toFixed(1)}%</div>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${equipment.uptime_percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(equipment.mttr)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(equipment.mtbf)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(equipment.maintenance_cost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(equipment.last_maintenance).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Plus className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-600">Schedule Maintenance</span>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <CheckCircle className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-600">Complete Work Order</span>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
            <AlertTriangle className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-600">Report Issue</span>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <ChartBarIcon className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-600">View Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDashboardEnhanced;
