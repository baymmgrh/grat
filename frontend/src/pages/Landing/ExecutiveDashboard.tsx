import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import axiosInstance from '../../utils/axiosConfig';
import { formatRupiah } from '../../utils/currencyUtils';
import { useLanguage } from '../../contexts/LanguageContext';
interface ExecutiveDashboardData {
  financial: {
    sales_today: number;
    sales_this_month: number;
    revenue_growth: number;
    outstanding_invoices: number;
  };
  production: {
    active_work_orders: number;
    completed_today: number;
    efficiency: number;
  };
  oee: {
    average_oee: number;
    critical_alerts: number;
    machine_utilization: number;
  };
  quality: {
    inspections_today: number;
    pass_rate: number;
  };
  inventory: {
    low_stock_items: number;
    total_value: number;
  };
  purchasing: {
    pending_orders: number;
  };
  hr: {
    total_employees: number;
    today_roster: number;
  };
  maintenance: {
    overdue: number;
  };
  customers: {
    active_customers: number;
    returns_this_month: number;
  };
  rd: {
    active_projects: number;
  };
  waste: {
    this_week_kg: number;
  };
  trends: {
    sales: Array<{ date: string; value: number }>;
  };
  critical_issues: Array<{
    type: string;
    message: string;
    severity: string;
    module: string;
  }>;
  summary: {
    total_modules: number;
    last_updated: string;
  };
}

interface ModuleCard {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  route: string;
  metrics?: {
    primary: { label: string; value: string | number };
    secondary?: { label: string; value: string | number };
  };
}

export default function ExecutiveDashboard() {
    const { t } = useLanguage();

const [dashboardData, setDashboardData] = useState<ExecutiveDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axiosInstance.get('/dashboard/executive');
      setDashboardData(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('id-ID').format(value);
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
    if (value < 0) return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
          <button
            onClick={fetchDashboardData}
            className="btn-primary"
          >
          </button>
        </div>
      </div>
    );
  }

  const moduleCards: ModuleCard[] = [
    {
      id: 'sales',
      name: 'Sales & CRM',
      description: 'Customer management and sales tracking',
      icon: BuildingStorefrontIcon,
      color: 'bg-blue-500',
      route: '/app/sales',
      metrics: {
        primary: { label: 'Today Sales', value: formatRupiah(dashboardData?.financial.sales_today || 0) },
        secondary: { label: 'Growth', value: `${dashboardData?.financial.revenue_growth || 0}%` }
      }
    },
    {
      id: 'production',
      name: t('navigation.production'),
      description: 'Manufacturing and work order management',
      icon: CogIcon,
      color: 'bg-green-500',
      route: '/app/production',
      metrics: {
        primary: { label: 'Active Orders', value: dashboardData?.production.active_work_orders || 0 },
        secondary: { label: 'Efficiency', value: `${dashboardData?.production.efficiency || 0}%` }
      }
    },
    {
      id: 'oee',
      name: 'OEE Analytics',
      description: 'Overall Equipment Effectiveness monitoring',
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      route: '/app/oee',
      metrics: {
        primary: { label: 'Avg OEE', value: `${dashboardData?.oee.average_oee || 0}%` },
        secondary: { label: 'Utilization', value: `${dashboardData?.oee.machine_utilization || 0}%` }
      }
    },
    {
      id: 'inventory',
      name: 'Inventory',
      description: 'Stock management and warehouse operations',
      icon: CubeIcon,
      color: 'bg-orange-500',
      route: '/app/inventory',
      metrics: {
        primary: { label: 'Total Value', value: formatRupiah(dashboardData?.inventory.total_value || 0) },
        secondary: { label: 'Low Stock', value: dashboardData?.inventory.low_stock_items || 0 }
      }
    },
    {
      id: 'purchasing',
      name: 'Purchasing',
      description: 'Supplier management and procurement',
      icon: ShoppingCartIcon,
      color: 'bg-indigo-500',
      route: '/app/purchasing',
      metrics: {
        primary: { label: 'Pending POs', value: dashboardData?.purchasing.pending_orders || 0 }
      }
    },
    {
      id: 'quality',
      name: 'Quality Control',
      description: 'Quality assurance and testing',
      icon: CheckCircleIcon,
      color: 'bg-teal-500',
      route: '/app/quality',
      metrics: {
        primary: { label: 'Pass Rate', value: `${dashboardData?.quality.pass_rate || 0}%` },
        secondary: { label: 'Today Tests', value: dashboardData?.quality.inspections_today || 0 }
      }
    },
    {
      id: 'maintenance',
      name: t('navigation.maintenance'),
      description: 'Equipment maintenance scheduling',
      icon: WrenchScrewdriverIcon,
      color: 'bg-red-500',
      route: '/app/maintenance',
      metrics: {
        primary: { label: 'Overdue', value: dashboardData?.maintenance.overdue || 0 }
      }
    },
    {
      id: 'hr',
      name: 'Human Resources',
      description: 'Employee management and payroll',
      icon: UsersIcon,
      color: 'bg-pink-500',
      route: '/app/hr',
      metrics: {
        primary: { label: 'Employees', value: dashboardData?.hr.total_employees || 0 },
        secondary: { label: 'Today Roster', value: dashboardData?.hr.today_roster || 0 }
      }
    },
    {
      id: 'finance',
      name: t('navigation.finance'),
      description: 'Financial management and accounting',
      icon: BanknotesIcon,
      color: 'bg-yellow-500',
      route: '/app/finance',
      metrics: {
        primary: { label: 'Outstanding', value: formatRupiah(dashboardData?.financial.outstanding_invoices || 0) }
      }
    },
    {
      id: 'shipping',
      name: 'Shipping',
      description: 'Logistics and delivery management',
      icon: TruckIcon,
      color: 'bg-cyan-500',
      route: '/app/shipping'
    },
    {
      id: 'rd',
      name: 'R&D',
      description: 'Research and development projects',
      icon: BeakerIcon,
      color: 'bg-violet-500',
      route: '/app/rd',
      metrics: {
        primary: { label: 'Active Projects', value: dashboardData?.rd.active_projects || 0 }
      }
    },
    {
      id: 'returns',
      name: 'Returns',
      description: 'Customer return management',
      icon: ShoppingBagIcon,
      color: 'bg-rose-500',
      route: '/app/returns',
      metrics: {
        primary: { label: 'This Month', value: dashboardData?.customers.returns_this_month || 0 }
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
                <p className="text-gray-600">Comprehensive business intelligence and KPIs</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Last updated: {dashboardData ? new Date(dashboardData.summary.last_updated).toLocaleTimeString() : ''}
                </div>
                <button
                  onClick={fetchDashboardData}
                  className="btn-secondary"
                  disabled={loading}
                >
                  <ArrowRightIcon className="h-4 w-4 mr-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Critical Issues Alert */}
        {dashboardData?.critical_issues && dashboardData.critical_issues.length > 0 && (
          <div className="mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <BellIcon className="h-5 w-5 text-red-500 mr-2" />
                <h3 className="text-lg font-semibold text-red-800">Critical Issues Requiring Attention</h3>
              </div>
              <div className="space-y-2">
                {dashboardData.critical_issues.map((issue, index) => (
                  <div key={index} className={`p-3 rounded-md border ${getSeverityColor(issue.severity)}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{issue.message}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-white">{issue.module}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KeyIcon Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatRupiah(dashboardData?.financial.sales_this_month || 0)}
                </p>
              </div>
              <div className="flex items-center">
                {getTrendIcon(dashboardData?.financial.revenue_growth || 0)}
                <span className={`ml-1 text-sm font-medium ${
                  (dashboardData?.financial.revenue_growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {dashboardData?.financial.revenue_growth || 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Production Efficiency</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.production.efficiency || 0}%</p>
              </div>
              <CogIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average OEE</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.oee.average_oee || 0}%</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Quality Pass Rate</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.quality.pass_rate || 0}%</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-teal-500" />
            </div>
          </div>
        </div>

        {/* Sales Trend Chart */}
        {dashboardData?.trends.sales && dashboardData.trends.sales.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend (Last 7 Days)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData.trends.sales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tickFormatter={(value) => formatRupiah(value)} />
                  <Tooltip 
                    formatter={(value: number) => [formatRupiah(value), t('navigation.sales')]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID')}
                  />
                  <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Module Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {moduleCards.map((module) => (
            <Link
              key={module.id}
              to={module.route}
              className="group bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-gray-300"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${module.color}`}>
                    <module.icon className="h-6 w-6 text-white" />
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{module.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{module.description}</p>
                
                {module.metrics && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{module.metrics.primary.label}</span>
                      <span className="text-sm font-semibold text-gray-900">{module.metrics.primary.value}</span>
                    </div>
                    {module.metrics.secondary && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{module.metrics.secondary.label}</span>
                        <span className="text-sm font-semibold text-gray-900">{module.metrics.secondary.value}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/app/oee/records/new" className="btn-primary text-center">
              New OEE Record
            </Link>
            <Link to="/app/production/work-orders/new" className="btn-secondary text-center">
              Create Work Order
            </Link>
            <Link to="/app/quality/inspections/new" className="btn-secondary text-center">
              Quality Inspection
            </Link>
            <Link to="/app/maintenance/schedules" className="btn-secondary text-center">
              View Maintenance
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
