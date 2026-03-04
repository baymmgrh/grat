import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import { formatRupiah } from '../../utils/currencyUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowTrendingUpIcon as ArrowUpIcon,
  ArrowTrendingDownIcon as ArrowDownIcon,
  BanknotesIcon,
  ChartBarIcon,
  CogIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

interface ExecutiveMetrics {
  financial: {
    revenue: number;
    profit: number;
    expenses: number;
    revenue_growth: number;
  };
  operations: {
    production_output: number;
    quality_rate: number;
    on_time_delivery: number;
    capacity_utilization: number;
  };
  hr: {
    total_employees: number;
    attendance_rate: number;
    turnover_rate: number;
    training_completion: number;
  };
  inventory: {
    total_value: number;
    turnover_ratio: number;
    stockout_incidents: number;
    waste_percentage: number;
  };
}

interface Alert {
  id: number;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
}

const ExecutiveDashboard: React.FC = () => {
  const { t } = useLanguage();

  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Load executive metrics
  const loadExecutiveMetrics = async () => {
    try {
      setLoading(true);
      
      const response = await axiosInstance.get('/api/reports/executive', {
        params: { period: selectedPeriod }
      });
      
      setMetrics(response.data?.metrics);
      setAlerts(response.data?.alerts || []);
      
    } catch (error) {
      console.error('Failed to load executive metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExecutiveMetrics();
  }, [selectedPeriod]);

  // Get trend icon
  const getTrendIcon = (value: number) => {
    if (value > 0) {
      return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
    } else if (value < 0) {
      return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  // Get alert icon
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  // Format currency
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading executive dashboard...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Failed to load executive metrics. Please try again.
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
              Executive Dashboard
            </h1>
            <p className="text-gray-600">
              High-level business insights and key performance indicators
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            
            <button
              onClick={loadExecutiveMetrics}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <EyeIcon className="h-5 w-5 mr-2" />
            </button>
          </div>
        </div>
      </div>

      {/* KeyIcon Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Financial Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue</h3>
            <BanknotesIcon className="h-8 w-8 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {formatRupiah(metrics.financial.revenue)}
          </div>
          <div className="flex items-center">
            {getTrendIcon(metrics.financial.revenue_growth)}
            <span className={`ml-1 text-sm ${metrics.financial.revenue_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(Math.abs(metrics.financial.revenue_growth))} vs last period
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('navigation.production')}</h3>
            <CogIcon className="h-8 w-8 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {metrics.operations.production_output.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">
            Units produced
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quality Rate</h3>
            <ChartBarIcon className="h-8 w-8 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {formatPercentage(metrics.operations.quality_rate)}
          </div>
          <div className="text-sm text-gray-500">
            Quality compliance
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Employees</h3>
            <UsersIcon className="h-8 w-8 text-indigo-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {metrics.hr.total_employees}
          </div>
          <div className="text-sm text-gray-500">
            {formatPercentage(metrics.hr.attendance_rate)} attendance
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Financial Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Performance</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Revenue</span>
              <span className="font-semibold">{formatRupiah(metrics.financial.revenue)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Profit</span>
              <span className="font-semibold text-green-600">{formatRupiah(metrics.financial.profit)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Expenses</span>
              <span className="font-semibold text-red-600">{formatRupiah(metrics.financial.expenses)}</span>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Profit Margin</span>
                <span className="font-semibold">
                  {formatPercentage((metrics.financial.profit / metrics.financial.revenue) * 100)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Operational Excellence</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">On-Time Delivery</span>
              <span className="font-semibold">{formatPercentage(metrics.operations.on_time_delivery)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Capacity Utilization</span>
              <span className="font-semibold">{formatPercentage(metrics.operations.capacity_utilization)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Quality Rate</span>
              <span className="font-semibold">{formatPercentage(metrics.operations.quality_rate)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Waste Percentage</span>
              <span className="font-semibold text-red-600">{formatPercentage(metrics.inventory.waste_percentage)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* HR & Inventory Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* HR Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Human Resources</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Employees</span>
              <span className="font-semibold">{metrics.hr.total_employees}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Attendance Rate</span>
              <span className="font-semibold">{formatPercentage(metrics.hr.attendance_rate)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Turnover Rate</span>
              <span className="font-semibold text-yellow-600">{formatPercentage(metrics.hr.turnover_rate)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Training Completion</span>
              <span className="font-semibold">{formatPercentage(metrics.hr.training_completion)}</span>
            </div>
          </div>
        </div>

        {/* Inventory Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Management</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Value</span>
              <span className="font-semibold">{formatRupiah(metrics.inventory.total_value)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Turnover Ratio</span>
              <span className="font-semibold">{metrics.inventory.turnover_ratio.toFixed(1)}x</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Stockout Incidents</span>
              <span className="font-semibold text-red-600">{metrics.inventory.stockout_incidents}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Waste Percentage</span>
              <span className="font-semibold text-red-600">{formatPercentage(metrics.inventory.waste_percentage)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts & Notifications */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Executive Alerts</h3>
        
        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start p-3 border border-gray-200 rounded-lg">
                <div className="flex-shrink-0 mr-3">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{alert.title}</div>
                  <div className="text-sm text-gray-600 mt-1">{alert.message}</div>
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts</h3>
            <p className="text-gray-500">All systems are operating normally.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
