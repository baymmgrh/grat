import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGetSalesOrdersQuery } from '../../services/api';
import { format } from 'date-fns';
import {
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  PrinterIcon,
  ShoppingCartIcon,
  TruckIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import axiosInstance from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

interface SalesOrder {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  order_date: string;
  required_date?: string;
  status: string;
  priority: string;
  total_amount: number;
  item_count: number;
  notes?: string;
  created_at: string;
}

const SalesOrderListUpgraded: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showActions, setShowActions] = useState<number | null>(null);

  const { data, isLoading, refetch } = useGetSalesOrdersQuery({
    search: searchTerm,
    status: statusFilter,
    priority: priorityFilter
  });

  const orders = data?.orders || [];

  const stats = useMemo(() => {
    return {
      total_orders: orders.length,
      total_amount: orders.reduce((sum: number, o: SalesOrder) => sum + (o.total_amount || 0), 0),
      pending_count: orders.filter((o: SalesOrder) => ['draft', 'confirmed'].includes(o.status)).length,
      in_production_count: orders.filter((o: SalesOrder) => o.status === 'in_production').length,
      ready_count: orders.filter((o: SalesOrder) => o.status === 'ready').length,
      shipped_count: orders.filter((o: SalesOrder) => o.status === 'shipped').length,
      delivered_count: orders.filter((o: SalesOrder) => o.status === 'delivered').length
    };
  }, [orders]);

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_production', label: 'In Production' },
    { value: 'ready', label: 'Ready' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const priorityOptions = [
    { value: '', label: 'All Priority' },
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bgColor: string; icon: any }> = {
      draft: { color: 'text-gray-600', bgColor: 'bg-gray-100 border-gray-200', icon: ClipboardDocumentListIcon },
      confirmed: { color: 'text-blue-600', bgColor: 'bg-blue-100 border-blue-200', icon: CheckCircleIcon },
      in_production: { color: 'text-yellow-600', bgColor: 'bg-yellow-100 border-yellow-200', icon: ClockIcon },
      ready: { color: 'text-green-600', bgColor: 'bg-green-100 border-green-200', icon: CheckCircleIcon },
      shipped: { color: 'text-purple-600', bgColor: 'bg-purple-100 border-purple-200', icon: TruckIcon },
      delivered: { color: 'text-emerald-600', bgColor: 'bg-emerald-100 border-emerald-200', icon: CheckCircleIcon },
      cancelled: { color: 'text-red-600', bgColor: 'bg-red-100 border-red-200', icon: XMarkIcon }
    };
    return configs[status] || configs.draft;
  };

  const getPriorityConfig = (priority: string) => {
    const configs: Record<string, { color: string; bgColor: string }> = {
      low: { color: 'text-gray-600', bgColor: 'bg-gray-100' },
      normal: { color: 'text-blue-600', bgColor: 'bg-blue-100' },
      high: { color: 'text-orange-600', bgColor: 'bg-orange-100' },
      urgent: { color: 'text-red-600', bgColor: 'bg-red-100' }
    };
    return configs[priority] || configs.normal;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleCancelOrder = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await axiosInstance.put(`/api/sales/orders/${id}`, { status: 'cancelled' });
      toast.success('Order cancelled successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to cancel order');
    }
  };

  const handlePrintOrder = (id: number) => {
    window.open(`/app/sales/orders/${id}/print`, '_blank');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <ShoppingCartIcon className="h-8 w-8" />
              Sales Orders
            </h1>
            <p className="text-emerald-100 mt-1">Manage customer orders and fulfillment</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            <Link
              to="/app/sales/orders/new"
              className="inline-flex items-center px-4 py-2 bg-white text-emerald-600 rounded-lg font-medium hover:bg-emerald-50 transition-colors shadow-md"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Order
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total_orders}</div>
          <div className="text-sm text-gray-500">Total Orders</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 col-span-2">
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_amount)}</div>
          <div className="text-sm text-gray-500">Total Value</div>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.pending_count}</div>
          <div className="text-sm text-blue-600">Pending</div>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.in_production_count}</div>
          <div className="text-sm text-yellow-600">In Production</div>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="text-2xl font-bold text-green-600">{stats.ready_count}</div>
          <div className="text-sm text-green-600">Ready</div>
        </div>
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.shipped_count}</div>
          <div className="text-sm text-purple-600">Shipped</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            {priorityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order: SalesOrder) => {
                const statusConfig = getStatusConfig(order.status);
                const priorityConfig = getPriorityConfig(order.priority || 'normal');
                const StatusIcon = statusConfig.icon;
                
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <Link 
                          to={`/app/sales/orders/${order.id}`}
                          className="font-medium text-emerald-600 hover:text-emerald-800"
                        >
                          {order.order_number}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">{order.customer_name}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {format(new Date(order.order_date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {order.required_date ? (
                        <span className={
                          new Date(order.required_date) < new Date() && !['delivered', 'cancelled'].includes(order.status)
                            ? 'text-red-600 font-medium'
                            : 'text-gray-500'
                        }>
                          {format(new Date(order.required_date), 'dd MMM yyyy')}
                          {new Date(order.required_date) < new Date() && !['delivered', 'cancelled'].includes(order.status) && (
                            <ExclamationTriangleIcon className="h-4 w-4 inline ml-1 text-red-500" />
                          )}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.color}`}>
                        <StatusIcon className="h-3.5 w-3.5 mr-1" />
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityConfig.bgColor} ${priorityConfig.color}`}>
                        {order.priority || 'normal'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {order.item_count || 0} items
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(order.total_amount || 0)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setShowActions(showActions === order.id ? null : order.id)}
                          className="p-1 hover:bg-gray-100 rounded-lg"
                        >
                          <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
                        </button>
                        {showActions === order.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                            <Link
                              to={`/app/sales/orders/${order.id}`}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <EyeIcon className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                            <Link
                              to={`/app/sales/orders/${order.id}/edit`}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <PencilIcon className="h-4 w-4 mr-2" />
                              Edit Order
                            </Link>
                            <Link
                              to={`/app/sales/orders/${order.id}/workflow`}
                              className="flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                            >
                              <ArrowPathIcon className="h-4 w-4 mr-2" />
                              Workflow
                            </Link>
                            <button
                              onClick={() => handlePrintOrder(order.id)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <PrinterIcon className="h-4 w-4 mr-2" />
                              Print
                            </button>
                            {!['delivered', 'cancelled'].includes(order.status) && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <XMarkIcon className="h-4 w-4 mr-2" />
                                Cancel Order
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {orders.length === 0 && !isLoading && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No sales orders</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first sales order.
          </p>
          <div className="mt-6">
            <Link
              to="/app/sales/orders/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Create Order
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesOrderListUpgraded;
