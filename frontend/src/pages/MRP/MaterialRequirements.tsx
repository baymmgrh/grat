import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import axiosInstance from '../../utils/axiosConfig';
import { formatRupiah } from '../../utils/currencyUtils';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  TruckIcon

} from '@heroicons/react/24/outline';
interface MaterialRequirement {
  id: number;
  material_name: string;
  material_code: string;
  required_qty: number;
  available_qty: number;
  shortage_qty: number;
  unit: string;
  required_date: string;
  lead_time_days: number;
  supplier_name: string;
  unit_cost: number;
  total_cost: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planned' | 'ordered' | 'received' | 'shortage';
}

interface RequirementSummary {
  total_materials: number;
  total_shortage_items: number;
  total_shortage_value: number;
  critical_shortages: number;
  avg_lead_time: number;
}

const MaterialRequirements: React.FC = () => {
  const { t } = useLanguage();

  const [requirements, setRequirements] = useState<MaterialRequirement[]>([]);
  const [summary, setSummary] = useState<RequirementSummary>({
    total_materials: 0,
    total_shortage_items: 0,
    total_shortage_value: 0,
    critical_shortages: 0,
    avg_lead_time: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    loadMaterialRequirements();
  }, [selectedPriority, selectedStatus]);

  const loadMaterialRequirements = async () => {
    try {
      setLoading(true);
      
      const params = {
        priority: selectedPriority,
        status: selectedStatus
      };

      const [requirementsRes, summaryRes] = await Promise.all([
        axiosInstance.get('/api/mrp/materials/requirements', { params }),
        axiosInstance.get('/api/mrp/materials/summary', { params })
      ]);

      setRequirements(requirementsRes.data?.requirements || []);
      setSummary(summaryRes.data?.summary || {});
    } catch (error) {
      console.error('Failed to load material requirements:', error);
      // Mock data
      setRequirements([
        {
          id: 1,
          material_name: 'PP Granules Grade A',
          material_code: 'PP-001',
          required_qty: 500,
          available_qty: 150,
          shortage_qty: 350,
          unit: 'kg',
          required_date: '2024-01-20',
          lead_time_days: 7,
          supplier_name: 'PT Polymer Indonesia',
          unit_cost: 8500,
          total_cost: 2975000,
          priority: 'high',
          status: 'shortage'
        },
        {
          id: 2,
          material_name: 'Additives UV-401',
          material_code: 'ADD-001',
          required_qty: 25,
          available_qty: 8,
          shortage_qty: 17,
          unit: 'kg',
          required_date: '2024-01-18',
          lead_time_days: 5,
          supplier_name: 'Chemical Solutions Ltd',
          unit_cost: 25000,
          total_cost: 425000,
          priority: 'medium',
          status: 'shortage'
        },
        {
          id: 3,
          material_name: 'Packaging Film',
          material_code: 'PKG-001',
          required_qty: 1000,
          available_qty: 0,
          shortage_qty: 1000,
          unit: 'm',
          required_date: '2024-01-25',
          lead_time_days: 10,
          supplier_name: 'Packaging Pro',
          unit_cost: 1200,
          total_cost: 1200000,
          priority: 'critical',
          status: 'shortage'
        }
      ]);

      setSummary({
        total_materials: 45,
        total_shortage_items: 8,
        total_shortage_value: 15600000,
        critical_shortages: 3,
        avg_lead_time: 7.5
      });
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'text-blue-600 bg-blue-100';
      case 'ordered': return 'text-yellow-600 bg-yellow-100';
      case 'received': return 'text-green-600 bg-green-100';
      case 'shortage': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const chartData = requirements.map(req => ({
    name: req.material_code,
    required: req.required_qty,
    available: req.available_qty,
    shortage: req.shortage_qty
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading material requirements...</span>
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
            <h1 className="text-3xl font-bold text-gray-900">Material Requirements</h1>
            <p className="text-gray-600 mt-1">Track material needs and shortages</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CubeIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Materials</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(summary.total_materials)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Shortage Items</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(summary.total_shortage_items)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TruckIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Critical Shortages</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(summary.critical_shortages)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Lead Time</p>
              <p className="text-2xl font-bold text-gray-900">{summary.avg_lead_time} days</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Shortage Value</p>
              <p className="text-lg font-bold text-gray-900">{formatRupiah(summary.total_shortage_value)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.status')}</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="planned">Planned</option>
              <option value="ordered">Ordered</option>
              <option value="received">Received</option>
              <option value="shortage">Shortage</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requirements Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Material Requirements vs Availability</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value, name) => [
              formatNumber(value as number),
              name === 'required' ? 'Required' :
              name === 'available' ? 'Available' : 'Shortage'
            ]} />
            <Bar dataKey="required" fill="#3B82F6" name="Required" />
            <Bar dataKey="available" fill="#10B981" name="Available" />
            <Bar dataKey="shortage" fill="#EF4444" name="Shortage" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Requirements Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Material Requirements Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('products.bom.material')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shortage</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Required Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('products.bom.total_cost')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requirements.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{req.material_name}</div>
                      <div className="text-sm text-gray-500">{req.material_code}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {formatNumber(req.required_qty)} {req.unit}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {formatNumber(req.available_qty)} {req.unit}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-red-600">
                      {formatNumber(req.shortage_qty)} {req.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {new Date(req.required_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {req.lead_time_days} days
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {req.supplier_name}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {formatRupiah(req.total_cost)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(req.priority)}`}>
                      {req.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(req.status)}`}>
                      {req.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaterialRequirements;
