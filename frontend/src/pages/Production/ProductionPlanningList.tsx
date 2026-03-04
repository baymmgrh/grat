import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import { Calendar, Package, TrendingUp, AlertCircle, CheckCircle, Clock, Play, FileText } from 'lucide-react';

interface ProductionPlan {
  id: number;
  plan_number: string;
  plan_name: string;
  plan_type: string;
  period_start: string;
  period_end: string;
  product_name: string;
  product_code: string;
  planned_quantity: number;
  actual_quantity: number;
  completion_percentage: number;
  uom: string;
  status: string;
  priority: string;
  based_on: string;
  machine_name: string | null;
  created_at: string;
  created_by: string | null;
}

interface GenerateWOModal {
  show: boolean;
  planId: number | null;
  planNumber: string;
}

const ProductionPlanningList: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    plan_type: '',
    search: ''
  });

  const [generateModal, setGenerateModal] = useState<GenerateWOModal>({
    show: false,
    planId: null,
    planNumber: ''
  });

  const [woGenerateOptions, setWoGenerateOptions] = useState({
    split_by: 'single',
    batch_size: 0
  });

  useEffect(() => {
    fetchPlans();
  }, [filters]);

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.plan_type) params.append('plan_type', filters.plan_type);
      if (filters.search) params.append('search', filters.search);

      const response = await axiosInstance.get(
        `/api/production-planning/production-plans?${params.toString()}`
      );

      setPlans(response.data.plans || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePlan = async (planId: number) => {
    if (!confirm('Are you sure you want to approve this plan?')) return;

    try {
      const token = localStorage.getItem('token');
      await axiosInstance.post(
        `/api/production-planning/production-plans/${planId}/approve`,
        {}
      );

      alert('Plan approved successfully!');
      fetchPlans();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to approve plan');
    }
  };

  const handleGenerateWO = async () => {
    if (!generateModal.planId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstance.post(
        `/api/production-planning/production-plans/${generateModal.planId}/generate-work-orders`,
        woGenerateOptions
      );

      alert(`${response.data.data.work_orders.length} work orders generated successfully!`);
      setGenerateModal({ show: false, planId: null, planNumber: '' });
      fetchPlans();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to generate work orders');
    }
  };

  const handleDeletePlan = async (planId: number) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      const token = localStorage.getItem('token');
      await axiosInstance.delete(
        `/api/production-planning/production-plans/${planId}`
      );

      alert('Plan deleted successfully!');
      fetchPlans();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete plan');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      approved: 'bg-green-100 text-green-800',
      released: 'bg-blue-100 text-blue-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return badges[status] || badges.draft;
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return badges[priority] || badges.normal;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Production Planning</h1>
            <p className="text-gray-600">Master Production Schedule (MPS)</p>
          </div>
          <button
            onClick={() => navigate('/app/production/planning/create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FileText size={20} />
            Create Plan
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search plan number or product..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="released">Released</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filters.plan_type}
            onChange={(e) => setFilters({ ...filters, plan_type: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          <button
            onClick={() => navigate('/app/production/planning/dashboard')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 justify-center"
          >
            <TrendingUp size={20} />
            Dashboard
          </button>
        </div>
      </div>

      {/* Plans List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {plans.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                  No production plans found
                </td>
              </tr>
            ) : (
              plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{plan.plan_number}</div>
                    <div className="text-xs text-gray-500">{plan.plan_type}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{plan.plan_name}</div>
                    <div className="text-xs text-gray-500">Based on: {plan.based_on}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{plan.product_name}</div>
                    <div className="text-xs text-gray-500">{plan.product_code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(plan.period_start).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      to {new Date(plan.period_end).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {plan.planned_quantity.toLocaleString()} {plan.uom}
                    </div>
                    <div className="text-xs text-gray-500">
                      Actual: {plan.actual_quantity.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${plan.completion_percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{plan.completion_percentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(plan.status)}`}>
                      {plan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadge(plan.priority)}`}>
                      {plan.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {plan.status === 'draft' && (
                        <button
                          onClick={() => handleApprovePlan(plan.id)}
                          className="text-green-600 hover:text-green-800"
                          title="Approve"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {plan.status === 'approved' && (
                        <button
                          onClick={() => setGenerateModal({ show: true, planId: plan.id, planNumber: plan.plan_number })}
                          className="text-blue-600 hover:text-blue-800"
                          title="Generate Work Orders"
                        >
                          <Play size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/app/production/planning/edit/${plan.id}`)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Generate WO Modal */}
      {generateModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Generate Work Orders
            </h2>
            <p className="text-gray-600 mb-4">
              Plan: {generateModal.planNumber}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Split Strategy
              </label>
              <select
                value={woGenerateOptions.split_by}
                onChange={(e) => setWoGenerateOptions({ ...woGenerateOptions, split_by: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="single">Single Work Order</option>
                <option value="week">Split by Week</option>
                <option value="batch">Split by Batch Size</option>
              </select>
            </div>

            {woGenerateOptions.split_by === 'batch' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Size
                </label>
                <input
                  type="number"
                  value={woGenerateOptions.batch_size}
                  onChange={(e) => setWoGenerateOptions({ ...woGenerateOptions, batch_size: Number(e.target.value) })}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setGenerateModal({ show: false, planId: null, planNumber: '' })}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateWO}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionPlanningList;
