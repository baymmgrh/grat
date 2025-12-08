import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import {
  CubeIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface WIPLedger {
  id: number;
  work_order_number: string;
  product_name: string;
  planned_quantity: number;
  actual_quantity: number;
  standard_total_cost: number;
  actual_total_cost: number;
  total_variance: number;
  status: string;
  is_posted_to_gl: boolean;
  cogm_posted: boolean;
}

interface DashboardStats {
  total_wip_value: number;
  total_variance: number;
  open_wip_count: number;
  completed_not_transferred: number;
  significant_variances: number;
}

export default function WIPLedger() {
  const [ledgers, setLedgers] = useState<WIPLedger[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_wip_value: 0,
    total_variance: 0,
    open_wip_count: 0,
    completed_not_transferred: 0,
    significant_variances: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard stats
      const statsRes = await axiosInstance.get('/api/wip-accounting/dashboard');
      setStats(statsRes.data.statistics);
      
      // Load ledgers
      const params: any = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      
      const ledgersRes = await axiosInstance.get('/api/wip-accounting/ledger', { params });
      setLedgers(ledgersRes.data.ledgers);
      
    } catch (error) {
      console.error('Error loading WIP data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">WIP Ledger</h1>
        <p className="text-gray-600">Work in Progress cost tracking and variance analysis</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total WIP Value</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(stats.total_wip_value)}</p>
            </div>
            <CubeIcon className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Variance</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(stats.total_variance)}</p>
            </div>
            <ChartBarIcon className="h-12 w-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Open WIP</p>
              <p className="text-3xl font-bold mt-2">{stats.open_wip_count}</p>
            </div>
            <ClockIcon className="h-12 w-12 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Ready to Transfer</p>
              <p className="text-3xl font-bold mt-2">{stats.completed_not_transferred}</p>
            </div>
            <CheckCircleIcon className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Significant Variances</p>
              <p className="text-3xl font-bold mt-2">{stats.significant_variances}</p>
            </div>
            <ExclamationTriangleIcon className="h-12 w-12 text-red-200" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All WIP
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'open'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('closed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'closed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Closed
          </button>
        </div>
      </div>

      {/* WIP Ledger List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Work Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Standard Cost
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actual Cost
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ledgers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <CubeIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p>No WIP ledgers found</p>
                  </td>
                </tr>
              ) : (
                ledgers.map((ledger) => (
                  <tr key={ledger.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {ledger.work_order_number}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{ledger.product_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">
                        {ledger.planned_quantity.toLocaleString()} / {ledger.actual_quantity.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Plan / Actual</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatCurrency(ledger.standard_total_cost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatCurrency(ledger.actual_total_cost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`flex items-center justify-end space-x-1 ${
                        ledger.total_variance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {ledger.total_variance > 0 ? (
                          <ArrowTrendingUpIcon className="h-4 w-4" />
                        ) : (
                          <ArrowTrendingDownIcon className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">
                          {formatCurrency(Math.abs(ledger.total_variance))}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 text-right">
                        {ledger.total_variance > 0 ? 'Unfavorable' : 'Favorable'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ledger.status)}`}>
                        {ledger.status.toUpperCase()}
                      </span>
                      {ledger.is_posted_to_gl && (
                        <div className="text-xs text-green-600 mt-1">✓ Posted to GL</div>
                      )}
                      {ledger.cogm_posted && (
                        <div className="text-xs text-blue-600 mt-1">✓ COGM Posted</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/app/finance/wip-ledger/${ledger.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
