import React, { useState, useEffect } from 'react';
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  EnvelopeIcon
,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axiosInstance from '../../utils/axiosConfig';
import { formatRupiah } from '../../utils/currencyUtils';
import { useLanguage } from '../../contexts/LanguageContext';

interface SupplierPerformance {
  supplier_id: number;
  supplier_name: string;
  contact_person: string;
  phone: string;
  email: string;
  total_orders: number;
  on_time_deliveries: number;
  on_time_percentage: number;
  avg_lead_time: number;
  quality_rating: number;
  total_value: number;
  active_contracts: number;
  last_delivery: string;
  status: 'active' | 'inactive' | 'pending';
}

interface SupplierCapacity {
  supplier_name: string;
  material_category: string;
  available_capacity: number;
  committed_capacity: number;
  utilization_percent: number;
  lead_time_days: number;
}

const SupplierIntegration: React.FC = () => {
  const { t } = useLanguage();

  const [suppliers, setSuppliers] = useState<SupplierPerformance[]>([]);
  const [capacityData, setCapacityData] = useState<SupplierCapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadSupplierData();
  }, [selectedCategory]);

  const loadSupplierData = async () => {
    try {
      setLoading(true);
      
      const params = { category: selectedCategory };

      const [suppliersRes, capacityRes] = await Promise.all([
        axiosInstance.get('/api/mrp/suppliers/performance', { params }),
        axiosInstance.get('/api/mrp/suppliers/capacity', { params })
      ]);

      setSuppliers(suppliersRes.data?.suppliers || []);
      setCapacityData(capacityRes.data?.capacity || []);
    } catch (error) {
      console.error('Failed to load supplier data:', error);
      // Mock data
      setSuppliers([
        {
          supplier_id: 1,
          supplier_name: 'PT Polymer Indonesia',
          contact_person: 'John Doe',
          phone: '+62-21-1234567',
          email: 'john@polymer.co.id',
          total_orders: 45,
          on_time_deliveries: 42,
          on_time_percentage: 93.3,
          avg_lead_time: 7,
          quality_rating: 4.5,
          total_value: 2500000000,
          active_contracts: 3,
          last_delivery: '2024-01-15',
          status: 'active'
        },
        {
          supplier_id: 2,
          supplier_name: 'Chemical Solutions Ltd',
          contact_person: 'Jane Smith',
          phone: '+62-21-2345678',
          email: 'jane@chemsol.com',
          total_orders: 28,
          on_time_deliveries: 25,
          on_time_percentage: 89.3,
          avg_lead_time: 5,
          quality_rating: 4.2,
          total_value: 1800000000,
          active_contracts: 2,
          last_delivery: '2024-01-14',
          status: 'active'
        },
        {
          supplier_id: 3,
          supplier_name: 'Packaging Pro',
          contact_person: 'Mike Johnson',
          phone: '+62-21-3456789',
          email: 'mike@packpro.co.id',
          total_orders: 32,
          on_time_deliveries: 28,
          on_time_percentage: 87.5,
          avg_lead_time: 10,
          quality_rating: 4.0,
          total_value: 1200000000,
          active_contracts: 1,
          last_delivery: '2024-01-12',
          status: 'active'
        }
      ]);

      setCapacityData([
        { supplier_name: 'PT Polymer Indonesia', material_category: 'Raw Materials', available_capacity: 1000, committed_capacity: 750, utilization_percent: 75.0, lead_time_days: 7 },
        { supplier_name: 'Chemical Solutions Ltd', material_category: 'Additives', available_capacity: 500, committed_capacity: 380, utilization_percent: 76.0, lead_time_days: 5 },
        { supplier_name: 'Packaging Pro', material_category: 'Packaging', available_capacity: 800, committed_capacity: 600, utilization_percent: 75.0, lead_time_days: 10 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 95) return 'text-green-600 bg-green-100';
    if (percentage >= 85) return 'text-blue-600 bg-blue-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return stars;
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading supplier integration data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            to="/app/mrp"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to MRP Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Supplier Integration</h1>
            <p className="text-gray-600 mt-1">Manage supplier relationships and capacity planning</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Material Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Categories</option>
              <option value="raw_materials">Raw Materials</option>
              <option value="additives">Additives</option>
              <option value="packaging">Packaging</option>
              <option value="chemicals">Chemicals</option>
            </select>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Capacity Utilization */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Capacity Utilization</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={capacityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="supplier_name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                formatNumber(value as number),
                name === 'available_capacity' ? 'Available' : 'Committed'
              ]} />
              <Bar dataKey="available_capacity" fill="#94A3B8" name="Available" />
              <Bar dataKey="committed_capacity" fill="#3B82F6" name="Committed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* On-Time Delivery Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">On-Time Delivery Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={suppliers.map(s => ({ name: s.supplier_name, value: s.on_time_percentage }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {suppliers.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${(value as number).toFixed(1)}%`, 'On-Time %']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Supplier Performance Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Performance Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">On-Time %</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Lead Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quality Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contracts</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {suppliers.map((supplier) => (
                <tr key={supplier.supplier_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <div className="font-medium text-gray-900">{supplier.supplier_name}</div>
                        <div className="text-sm text-gray-500">Last delivery: {new Date(supplier.last_delivery).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{supplier.contact_person}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <PhoneIcon className="h-3 w-3 mr-1" />
                        {supplier.phone}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <EnvelopeIcon className="h-3 w-3 mr-1" />
                        {supplier.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-900">{formatNumber(supplier.total_orders)}</div>
                    <div className="text-sm text-gray-500">{formatNumber(supplier.on_time_deliveries)} on-time</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceColor(supplier.on_time_percentage)}`}>
                      {formatPercent(supplier.on_time_percentage)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {supplier.avg_lead_time} days
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="flex">{getRatingStars(supplier.quality_rating)}</div>
                      <span className="ml-2 text-sm text-gray-600">({supplier.quality_rating})</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {formatRupiah(supplier.total_value)}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {formatNumber(supplier.active_contracts)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(supplier.status)}`}>
                      {supplier.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Capacity Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Capacity Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capacityData.map((capacity, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{capacity.supplier_name}</h4>
                <span className="text-sm text-gray-500">{capacity.material_category}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-medium">{formatNumber(capacity.available_capacity)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Committed:</span>
                  <span className="font-medium">{formatNumber(capacity.committed_capacity)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Utilization:</span>
                  <span className="font-medium">{formatPercent(capacity.utilization_percent)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Lead Time:</span>
                  <span className="font-medium">{capacity.lead_time_days} days</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${capacity.utilization_percent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupplierIntegration;
