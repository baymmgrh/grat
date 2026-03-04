import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import axiosInstance from '../../utils/axiosConfig';
import { formatRupiah } from '../../utils/currencyUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  ShoppingCartIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface DashboardMetrics {
  lead_metrics: {
    total_leads: number;
    new_leads: number;
    qualified_leads: number;
    converted_leads: number;
    conversion_rate: number;
  };
  opportunity_metrics: {
    total_opportunities: number;
    total_value: number;
    won_opportunities: number;
    won_value: number;
    win_rate: number;
  };
  quotation_metrics: {
    total_quotations: number;
    pending_quotations: number;
    accepted_quotations: number;
    acceptance_rate: number;
  };
  activity_metrics: {
    total_activities: number;
    pending_activities: number;
    overdue_activities: number;
  };
}

const SalesDashboard: React.FC = () => {
  const { t } = useLanguage();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardMetrics();
  }, []);

  const loadDashboardMetrics = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/sales/analytics/dashboard');
      setMetrics(response.data);
    } catch (error) {
      console.error('Error loading dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load dashboard</h3>
        <p className="mt-1 text-sm text-gray-500">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sales Dashboard</h1>
            <p className="text-blue-100 mt-2">Comprehensive CRM and Sales Management</p>
          </div>
          <ChartBarIcon className="h-12 w-12 text-blue-200" />
        </div>
      </div>

      {/* CRM Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales CRM Modules</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link
            to="/app/sales/leads"
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
          >
            <UserGroupIcon className="h-8 w-8 text-gray-600 group-hover:text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600">Leads</span>
          </Link>

          <Link
            to="/app/sales/opportunities"
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors group"
          >
            <FunnelIcon className="h-8 w-8 text-gray-600 group-hover:text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900 group-hover:text-green-600">Pipeline</span>
          </Link>

          <Link
            to="/app/sales/quotations"
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors group"
          >
            <DocumentTextIcon className="h-8 w-8 text-gray-600 group-hover:text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-900 group-hover:text-purple-600">Quotations</span>
          </Link>

          <Link
            to="/app/sales/activities"
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors group"
          >
            <CalendarIcon className="h-8 w-8 text-gray-600 group-hover:text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-900 group-hover:text-orange-600">Activities</span>
          </Link>

          <Link
            to="/app/sales/customers"
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
          >
            <BuildingOfficeIcon className="h-8 w-8 text-gray-600 group-hover:text-indigo-600 mb-2" />
            <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">Customers</span>
          </Link>

          <Link
            to="/app/sales/orders"
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors group"
          >
            <ShoppingCartIcon className="h-8 w-8 text-gray-600 group-hover:text-red-600 mb-2" />
            <span className="text-sm font-medium text-gray-900 group-hover:text-red-600">Orders</span>
          </Link>
        </div>
      </div>

      {/* KeyIcon Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Lead Conversion Rate */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Lead Conversion</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatPercentage(metrics.lead_metrics.conversion_rate)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-600">
              {metrics.lead_metrics.converted_leads} of {metrics.lead_metrics.total_leads} leads converted
            </div>
          </div>
        </div>

        {/* Pipeline Value */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BanknotesIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pipeline Value</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatRupiah(metrics.opportunity_metrics.total_value)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-600">
              {metrics.opportunity_metrics.total_opportunities} active opportunities
            </div>
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FunnelIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Win Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatPercentage(metrics.opportunity_metrics.win_rate)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-600">
              {metrics.opportunity_metrics.won_opportunities} deals won
            </div>
          </div>
        </div>

        {/* Quote Acceptance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Quote Acceptance</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatPercentage(metrics.quotation_metrics.acceptance_rate)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-600">
              {metrics.quotation_metrics.accepted_quotations} of {metrics.quotation_metrics.total_quotations} quotes accepted
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          to="/app/sales/leads/new"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600 group-hover:text-blue-700" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-700">Add New Lead</h3>
              <p className="text-sm text-gray-600">Capture new lead information</p>
            </div>
          </div>
        </Link>

        <Link
          to="/app/sales/opportunities/new"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center">
            <FunnelIcon className="h-8 w-8 text-green-600 group-hover:text-green-700" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-green-700">Create Opportunity</h3>
              <p className="text-sm text-gray-600">Start new sales opportunity</p>
            </div>
          </div>
        </Link>

        <Link
          to="/app/sales/quotations/new"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-purple-600 group-hover:text-purple-700" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-purple-700">New Quotation</h3>
              <p className="text-sm text-gray-600">Generate price quote</p>
            </div>
          </div>
        </Link>

        <Link
          to="/app/sales/activities/new"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-orange-600 group-hover:text-orange-700" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-orange-700">Schedule Activity</h3>
              <p className="text-sm text-gray-600">Plan sales activities</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Additional Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/app/sales/forecasts"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-indigo-600 group-hover:text-indigo-700" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-700">Sales Forecasts</h3>
              <p className="text-sm text-gray-600">Manage sales predictions</p>
            </div>
          </div>
        </Link>

        <Link
          to="/app/sales/orders"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center">
            <ShoppingCartIcon className="h-8 w-8 text-teal-600 group-hover:text-teal-700" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-teal-700">Sales Orders</h3>
              <p className="text-sm text-gray-600">View and manage orders</p>
            </div>
          </div>
        </Link>

        <Link
          to="/app/sales/customers"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-8 w-8 text-pink-600 group-hover:text-pink-700" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-pink-700">Customer Database</h3>
              <p className="text-sm text-gray-600">Manage customer records</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Lead Pipeline</h3>
            <Link to="/app/sales/leads" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All →
            </Link>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Leads</span>
              <span className="font-semibold text-gray-900">{metrics.lead_metrics.total_leads}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">New Leads</span>
              <span className="font-semibold text-blue-600">{metrics.lead_metrics.new_leads}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Qualified Leads</span>
              <span className="font-semibold text-green-600">{metrics.lead_metrics.qualified_leads}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Converted Leads</span>
              <span className="font-semibold text-purple-600">{metrics.lead_metrics.converted_leads}</span>
            </div>
          </div>
        </div>

        {/* Opportunity Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Sales Pipeline</h3>
            <Link to="/app/sales/opportunities" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View Pipeline →
            </Link>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Opportunities</span>
              <span className="font-semibold text-gray-900">{metrics.opportunity_metrics.total_opportunities}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pipeline Value</span>
              <span className="font-semibold text-blue-600">{formatRupiah(metrics.opportunity_metrics.total_value)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Won Deals</span>
              <span className="font-semibold text-green-600">{metrics.opportunity_metrics.won_opportunities}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Won Value</span>
              <span className="font-semibold text-green-600">{formatRupiah(metrics.opportunity_metrics.won_value)}</span>
            </div>
          </div>
        </div>

        {/* Activity Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Activities</h3>
            <Link to="/app/sales/activities" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All →
            </Link>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Activities</span>
              <span className="font-semibold text-gray-900">{metrics.activity_metrics.total_activities}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Activities</span>
              <span className="font-semibold text-blue-600">{metrics.activity_metrics.pending_activities}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Overdue Activities</span>
              <span className="font-semibold text-red-600">{metrics.activity_metrics.overdue_activities}</span>
            </div>
          </div>
        </div>

        {/* Quotation Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Quotations</h3>
            <Link to="/app/sales/quotations" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All →
            </Link>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Quotations</span>
              <span className="font-semibold text-gray-900">{metrics.quotation_metrics.total_quotations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Quotes</span>
              <span className="font-semibold text-yellow-600">{metrics.quotation_metrics.pending_quotations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Accepted Quotes</span>
              <span className="font-semibold text-green-600">{metrics.quotation_metrics.accepted_quotations}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
