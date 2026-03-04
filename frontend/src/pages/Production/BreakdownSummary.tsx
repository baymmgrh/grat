import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  CogIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface AffectedWO {
  wo_number: string;
  product_name: string;
  machine_name: string;
  status: string;
  progress_percentage: number;
  breakdown_minutes: number;
  required_date: string;
}

interface BreakdownSummary {
  date_from: string;
  date_to: string;
  total_affected_wos: number;
  total_breakdown_minutes: number;
  total_breakdown_hours: number;
  affected_work_orders: AffectedWO[];
}

const BreakdownSummary: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BreakdownSummary | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get('/api/work-orders/breakdown-summary');
        setData(res.data);
      } catch (error) {
        console.error('Error fetching breakdown summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-red-600">Failed to load data</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              to="/app/production/work-orders-monitoring"
              className="text-slate-600 hover:text-slate-800"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">Machine Breakdown Impact</h1>
          </div>
          <p className="text-slate-500">Work orders affected by machine breakdowns</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Affected Work Orders</p>
              <p className="text-3xl font-bold text-red-600">{data.total_affected_wos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-orange-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Breakdown Time</p>
              <p className="text-3xl font-bold text-orange-600">{data.total_breakdown_hours}h</p>
              <p className="text-xs text-slate-500">{data.total_breakdown_minutes} minutes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Avg Breakdown per WO</p>
              <p className="text-3xl font-bold text-blue-600">
                {data.total_affected_wos > 0 
                  ? Math.round(data.total_breakdown_minutes / data.total_affected_wos)
                  : 0}
              </p>
              <p className="text-xs text-slate-500">minutes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Affected Work Orders Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Top 20 Most Affected Work Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Rank</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">WO Number</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Product</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Machine</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Progress</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Breakdown Time</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Required Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.affected_work_orders.map((wo, index) => (
                <tr key={wo.wo_number} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-red-500 text-white' :
                      index === 1 ? 'bg-orange-500 text-white' :
                      index === 2 ? 'bg-yellow-500 text-white' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-blue-600">{wo.wo_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-700">{wo.product_name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CogIcon className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-700">{wo.machine_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      wo.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {wo.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            wo.progress_percentage >= 75 ? 'bg-green-500' :
                            wo.progress_percentage >= 50 ? 'bg-blue-500' :
                            wo.progress_percentage >= 25 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${wo.progress_percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-slate-700 w-12 text-right">
                        {wo.progress_percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold text-red-600">{wo.breakdown_minutes}</span>
                      <span className="text-xs text-slate-500">minutes</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-slate-700">
                      {wo.required_date ? new Date(wo.required_date).toLocaleDateString('id-ID') : '-'}
                    </span>
                  </td>
                </tr>
              ))}
              {data.affected_work_orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ExclamationTriangleIcon className="h-12 w-12 text-green-500" />
                      <p className="text-green-600 font-medium">No breakdowns detected!</p>
                      <p className="text-sm text-slate-500">All work orders are running smoothly</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Period Info */}
      <div className="mt-4 text-center text-sm text-slate-500">
        Data period: {new Date(data.date_from).toLocaleDateString('id-ID')} - {new Date(data.date_to).toLocaleDateString('id-ID')}
      </div>
    </div>
  );
};

export default BreakdownSummary;
