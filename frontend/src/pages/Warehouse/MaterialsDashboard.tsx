import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosInstance from '../../utils/axiosConfig';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  ArrowTrendingUpIcon,
  CubeIcon,
  ArrowRightIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
interface DashboardData {
  summary: {
    total_materials: number;
    active_materials: number;
    materials_with_stock: number;
    total_inventory_value: number;
  };
  by_type: Array<{
    type: string;
    count: number;
    label: string;
  }>;
  recent_movements: Array<{
    id: number;
    movement_type: string;
    quantity: number;
    reference_number: string;
    created_at: string;
  }>;
}

const MaterialsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/materials/dashboard');
      setDashboardData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching dashboard data:', err);
      // Set fallback data to prevent chart errors
      setDashboardData({
        summary: {
          total_materials: 0,
          active_materials: 0,
          materials_with_stock: 0,
          total_inventory_value: 0
        },
        by_type: [
          { type: 'raw', count: 1, label: 'Raw Materials' },
          { type: 'packaging', count: 1, label: 'Packaging' },
          { type: 'consumables', count: 1, label: 'Consumables' }
        ],
        recent_movements: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'];

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'stock_in':
        return 'text-green-600 bg-green-100';
      case 'stock_out':
        return 'text-red-600 bg-red-100';
      case 'transfer':
        return 'text-blue-600 bg-blue-100';
      case 'adjustment':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'stock_in':
        return 'Stock In';
      case 'stock_out':
        return 'Stock Out';
      case 'transfer':
        return 'Transfer';
      case 'adjustment':
        return 'Adjustment';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error || 'Failed to load dashboard data'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materials Dashboard</h1>
          <p className="text-gray-600">Overview of your materials inventory and activities</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => navigate('/app/warehouse/materials/list')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <EyeIcon className="h-4 w-4" />
            <span>View All Materials</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <CubeIcon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Materials</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dashboardData.summary.total_materials.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Materials</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dashboardData.summary.active_materials.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">With Stock</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dashboardData.summary.materials_with_stock.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Inventory Value</p>
              <p className="text-2xl font-semibold text-gray-900">
                Rp {dashboardData.summary.total_inventory_value.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Materials by Type - Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Materials by Type</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData?.by_type || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(dashboardData?.by_type || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Materials by Type - Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Material Count by Type</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData?.by_type || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="label" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Movements */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Recent Material Movements</h3>
            <button className="text-blue-600 hover:text-blue-800 flex items-center space-x-1">
              <span>View All</span>
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="p-6">
          {dashboardData.recent_movements.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recent_movements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getMovementTypeColor(movement.movement_type)}`}>
                      {getMovementTypeLabel(movement.movement_type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {movement.reference_number}
                      </p>
                      <p className="text-sm text-gray-500">
                        Quantity: {movement.quantity.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(movement.created_at).toLocaleDateString('id-ID')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(movement.created_at).toLocaleTimeString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No recent movements</h3>
              <p className="mt-1 text-sm text-gray-500">
                Material movements will appear here when they occur.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/app/warehouse/materials/new')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <CubeIcon className="h-8 w-8 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-900">Add New Material</h4>
            <p className="text-sm text-gray-500">Create a new material record</p>
          </button>
          <button 
            onClick={() => navigate('/app/warehouse/stock-input')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <ArrowTrendingUpIcon className="h-8 w-8 text-green-600 mb-2" />
            <h4 className="font-medium text-gray-900">Stock Input</h4>
            <p className="text-sm text-gray-500">Record material stock receipt</p>
          </button>
          <button 
            onClick={() => navigate('/app/warehouse/materials/list?filter=low_stock')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 mb-2" />
            <h4 className="font-medium text-gray-900">Low Stock Report</h4>
            <p className="text-sm text-gray-500">View materials with low stock</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaterialsDashboard;
