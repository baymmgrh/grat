import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGetDashboardOverviewQuery, useGetExecutiveDashboardQuery } from '../../services/api'
import { formatRupiah } from '../../utils/currencyUtils';
import axiosInstance from '../../utils/axiosConfig'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  BeakerIcon,
  BellIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CogIcon,
  CubeIcon,
  KeyIcon,
  UsersIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

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

export default function Dashboard() {
  const { data: overview, isLoading } = useGetDashboardOverviewQuery({})
  const { data: executiveData, isLoading: executiveLoading, refetch: refetchExecutive } = useGetExecutiveDashboardQuery({})
  const { t } = useLanguage();
  const [companyName, setCompanyName] = useState(t('company.name'))

  useEffect(() => {
    loadCompanySettings()
    
    // Listen for company settings update event
    const handleCompanyUpdate = () => {
      loadCompanySettings()
    }
    
    window.addEventListener('companySettingsUpdated', handleCompanyUpdate)
    
    // Refresh executive data every 5 minutes
    const interval = setInterval(() => {
      refetchExecutive()
    }, 300000)
    
    return () => {
      window.removeEventListener('companySettingsUpdated', handleCompanyUpdate)
      clearInterval(interval)
    }
  }, [refetchExecutive])

  const loadCompanySettings = async () => {
    try {
      const response = await axiosInstance.get('/api/settings/company')
      if (response.data && response.data.name) {
        setCompanyName(response.data.name)
      }
    } catch (error) {
      console.error('Error loading company settings:', error)
      // Keep default if API fails
    }
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('id-ID').format(value)
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUpIcon className="h-4 w-4 text-green-500" />
    if (value < 0) return <ArrowDownIcon className="h-4 w-4 text-red-500" />
    return null
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isLoading || executiveLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-gray-600">
            {t('dashboard.welcome')} {companyName} - {t('analytics.business_intelligence')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Last updated: {executiveData ? new Date(executiveData.summary.last_updated).toLocaleTimeString() : ''}
          </div>
          <button
            onClick={() => refetchExecutive()}
            className="btn-secondary"
            disabled={executiveLoading}
          >
            <ArrowRightIcon className="h-4 w-4 mr-2" />
          </button>
        </div>
      </div>

      {/* Critical Issues Alert */}
      {executiveData?.critical_issues && executiveData.critical_issues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <BellIcon className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-lg font-semibold text-red-800">Critical Issues Requiring Attention</h3>
          </div>
          <div className="space-y-2">
            {executiveData.critical_issues.map((issue, index) => (
              <div key={index} className={`p-3 rounded-md border ${getSeverityColor(issue.severity)}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{issue.message}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-white">{issue.module}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KeyIcon Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Sales</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatRupiah(executiveData?.financial.sales_this_month || 0)}
              </p>
            </div>
            <div className="flex items-center">
              {getTrendIcon(executiveData?.financial.revenue_growth || 0)}
              <span className={`ml-1 text-sm font-medium ${
                (executiveData?.financial.revenue_growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {executiveData?.financial.revenue_growth || 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Production Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">{executiveData?.production.efficiency || 0}%</p>
            </div>
            <CogIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average OEE</p>
              <p className="text-2xl font-bold text-gray-900">{executiveData?.oee.average_oee || 0}%</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Quality Pass Rate</p>
              <p className="text-2xl font-bold text-gray-900">{executiveData?.quality.pass_rate || 0}%</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-teal-500" />
          </div>
        </div>
      </div>

      {/* Sales Trend Chart */}
      {executiveData?.trends.sales && executiveData.trends.sales.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={executiveData.trends.sales}>
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

      {/* Module Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Sales Module */}
        <Link to="/app/sales" className="group bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-gray-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-blue-500">
                <BuildingStorefrontIcon className="h-6 w-6 text-white" />
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sales & CRM</h3>
            <p className="text-sm text-gray-600 mb-4">Customer management and sales tracking</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Today Sales</span>
                <span className="text-sm font-semibold text-gray-900">{formatRupiah(executiveData?.financial.sales_today || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Growth</span>
                <span className="text-sm font-semibold text-gray-900">{executiveData?.financial.revenue_growth || 0}%</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Production Module */}
        <Link to="/app/production" className="group bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-gray-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-green-500">
                <CogIcon className="h-6 w-6 text-white" />
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('navigation.production')}</h3>
            <p className="text-sm text-gray-600 mb-4">Manufacturing and work order management</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Active Orders</span>
                <span className="text-sm font-semibold text-gray-900">{executiveData?.production.active_work_orders || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Efficiency</span>
                <span className="text-sm font-semibold text-gray-900">{executiveData?.production.efficiency || 0}%</span>
              </div>
            </div>
          </div>
        </Link>

        {/* OEE Module */}
        <Link to="/app/oee" className="group bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-gray-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-purple-500">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">OEE Analytics</h3>
            <p className="text-sm text-gray-600 mb-4">Overall Equipment Effectiveness monitoring</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Avg OEE</span>
                <span className="text-sm font-semibold text-gray-900">{executiveData?.oee.average_oee || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Utilization</span>
                <span className="text-sm font-semibold text-gray-900">{executiveData?.oee.machine_utilization || 0}%</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Inventory Module */}
        <Link to="/app/inventory" className="group bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-gray-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-orange-500">
                <CubeIcon className="h-6 w-6 text-white" />
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Inventory</h3>
            <p className="text-sm text-gray-600 mb-4">Stock management and warehouse operations</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Total Value</span>
                <span className="text-sm font-semibold text-gray-900">{formatRupiah(executiveData?.inventory.total_value || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Low Stock</span>
                <span className="text-sm font-semibold text-gray-900">{executiveData?.inventory.low_stock_items || 0}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Quality Module */}
        <Link to="/app/quality" className="group bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-gray-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-teal-500">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality Control</h3>
            <p className="text-sm text-gray-600 mb-4">Quality assurance and testing</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Pass Rate</span>
                <span className="text-sm font-semibold text-gray-900">{executiveData?.quality.pass_rate || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Today Tests</span>
                <span className="text-sm font-semibold text-gray-900">{executiveData?.quality.inspections_today || 0}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* HR Module */}
        <Link to="/app/hr" className="group bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-gray-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-pink-500">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Human Resources</h3>
            <p className="text-sm text-gray-600 mb-4">Employee management and payroll</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Employees</span>
                <span className="text-sm font-semibold text-gray-900">{executiveData?.hr.total_employees || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Today Roster</span>
                <span className="text-sm font-semibold text-gray-900">{executiveData?.hr.today_roster || 0}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Maintenance Module */}
        <Link to="/app/maintenance" className="group bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-gray-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-red-500">
                <WrenchScrewdriverIcon className="h-6 w-6 text-white" />
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('navigation.maintenance')}</h3>
            <p className="text-sm text-gray-600 mb-4">Equipment maintenance scheduling</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Overdue</span>
                <span className="text-sm font-semibold text-gray-900">{executiveData?.maintenance.overdue || 0}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* R&D Module */}
        <Link to="/app/rd" className="group bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-gray-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-violet-500">
                <BeakerIcon className="h-6 w-6 text-white" />
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">R&D</h3>
            <p className="text-sm text-gray-600 mb-4">Research and development projects</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Active Projects</span>
                <span className="text-sm font-semibold text-gray-900">{executiveData?.rd.active_projects || 0}</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
  )
}
