import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  CogIcon,
  CalendarIcon,
  ArrowPathIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface WorkOrder {
  id: number;
  wo_number: string;
  product_name: string;
  product_code: string;
  machine_id: number;
  machine_name: string;
  status: string;
  priority: string;
  quantity_planned: number;
  quantity_produced: number;
  quantity_good: number;
  quantity_scrap: number;
  quantity_rework: number;
  setting_sticker: number;
  setting_packaging: number;
  progress_percentage: number;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string;
  actual_end: string;
  required_date: string;
  estimated_completion: string;
  is_delayed: boolean;
  delay_hours: number;
  total_downtime_minutes: number;
  created_at: string;
}

const WorkOrderMonitoring: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [machineFilter, setMachineFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (machineFilter) params.append('machine_id', machineFilter);

      const res = await axiosInstance.get(`/api/work-orders/monitoring?${params.toString()}`);
      setWorkOrders(res.data.work_orders || []);
    } catch (error) {
      console.error('Error fetching work orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, machineFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'released': return 'bg-yellow-100 text-yellow-800';
      case 'planned': return 'bg-slate-100 text-slate-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-slate-400';
      default: return 'bg-slate-400';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate summary stats
  const totalWOs = workOrders.length;
  const inProgress = workOrders.filter(wo => wo.status === 'in_progress').length;
  const delayed = workOrders.filter(wo => wo.is_delayed).length;
  const completed = workOrders.filter(wo => wo.status === 'completed').length;
  const avgProgress = totalWOs > 0 
    ? Math.round(workOrders.reduce((sum, wo) => sum + wo.progress_percentage, 0) / totalWOs)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Work Order Monitoring</h1>
          <p className="text-slate-500">Real-time tracking & progress monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${showFilters ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}
          >
            <FunnelIcon className="h-5 w-5" />
            Filter
          </button>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-100 flex items-center gap-2"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Refresh
          </button>
          <Link
            to="/app/production/breakdown-summary"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Breakdown Impact
          </Link>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="">All Status</option>
                <option value="planned">Planned</option>
                <option value="released">Released</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Machine</label>
              <input
                type="text"
                value={machineFilter}
                onChange={(e) => setMachineFilter(e.target.value)}
                placeholder="Machine ID"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-slate-500">Total WO</p>
          <p className="text-2xl font-bold text-slate-800">{totalWOs}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-slate-500">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{inProgress}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-slate-500">Delayed</p>
          <p className="text-2xl font-bold text-red-600">{delayed}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-slate-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{completed}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-slate-500">Avg Progress</p>
          <p className="text-2xl font-bold text-slate-800">{avgProgress}%</p>
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">WO Number</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Product</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Machine</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Priority</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Progress</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Qty</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Downtime</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Required Date</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workOrders.map((wo) => (
                <tr key={wo.id} className={`hover:bg-slate-50 ${wo.is_delayed ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {wo.is_delayed && <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />}
                      <Link
                        to={`/app/production/work-orders/${wo.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {wo.wo_number}
                      </Link>
                    </div>
                    {wo.is_delayed && (
                      <p className="text-xs text-red-600 mt-1">Delayed {wo.delay_hours}h</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{wo.product_name}</p>
                    <p className="text-xs text-slate-500">{wo.product_code}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CogIcon className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-700">{wo.machine_name || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(wo.status)}`}>
                      {wo.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(wo.priority)} mx-auto`} title={wo.priority}></div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(wo.progress_percentage)}`}
                          style={{ width: `${wo.progress_percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-slate-700 w-12 text-right">
                        {wo.progress_percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <p className="text-sm font-medium text-slate-800">
                      {wo.quantity_produced.toLocaleString()} / {wo.quantity_planned.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      Good: {wo.quantity_good.toLocaleString()}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {wo.total_downtime_minutes > 0 ? (
                      <span className="text-sm font-medium text-orange-600">
                        {wo.total_downtime_minutes} min
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <CalendarIcon className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-700">
                        {wo.required_date ? new Date(wo.required_date).toLocaleDateString('id-ID') : '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        to={`/app/production/work-orders/${wo.id}/timeline`}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Timeline"
                      >
                        <ClockIcon className="h-5 w-5" />
                      </Link>
                      <Link
                        to={`/app/production/work-orders/${wo.id}/breakdown`}
                        className="text-orange-600 hover:text-orange-800"
                        title="Breakdown Impact"
                      >
                        <ChartBarIcon className="h-5 w-5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {workOrders.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    No work orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkOrderMonitoring;
