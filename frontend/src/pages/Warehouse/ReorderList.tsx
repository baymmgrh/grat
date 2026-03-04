import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowPathIcon as RefreshCw,
  ArrowTrendingDownIcon as TrendingDown,
  CheckCircleIcon as CheckCircle,
  ClockIcon,
  CubeIcon,
  ExclamationCircleIcon as PriorityIcon,
  ExclamationTriangleIcon as AlertTriangle,
  EyeIcon as Eye,
  FunnelIcon,
  MagnifyingGlassIcon as Search,
  PencilIcon as Edit,
  PlusIcon as Plus,
  ShoppingCartIcon as ShoppingCart
} from '@heroicons/react/24/outline';
interface ReorderItem {
  id: number;
  product_id: number;
  product_code: string;
  product_name: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  reorder_point: number;
  reorder_quantity: number;
  lead_time_days: number;
  supplier_name: string;
  unit_cost: number;
  category: string;
  last_order_date: string;
  status: 'active' | 'inactive' | 'ordered' | 'received';
  priority: 'low' | 'medium' | 'high' | 'critical';
  stock_out_risk: number;
  days_until_stockout: number;
  suggested_order_quantity: number;
  created_at: string;
  updated_at: string;
}

const ReorderList: React.FC = () => {
  const { t } = useLanguage();

  const [reorderItems, setReorderItems] = useState<ReorderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  const statusOptions = [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
    { value: 'ordered', label: 'Ordered', color: 'bg-blue-100 text-blue-800' },
    { value: 'received', label: 'Received', color: 'bg-purple-100 text-purple-800' }
  ];

  const priorityOptions = [
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800', icon: TrendingDown },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
    { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800', icon: CheckCircle }
  ];

  useEffect(() => {
    fetchReorderItems();
    fetchCategories();
  }, []);

  const fetchReorderItems = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/warehouse/reorder-points', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setReorderItems(data.reorder_items || []);
      }
    } catch (error) {
      console.error('Failed to fetch reorder items:', error);
      setReorderItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/products/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const generatePurchaseOrder = async (itemIds: number[]) => {
    try {
      const response = await fetch('/api/warehouse/reorder-points/generate-po', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ item_ids: itemIds })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Purchase Order ${data.po_number} created successfully!`);
        fetchReorderItems(); // Refresh the list
      } else {
        alert('Failed to generate purchase order');
      }
    } catch (error) {
      alert('Error generating purchase order');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateReorderPoint = async (itemId: number, newReorderPoint: number) => {
    try {
      const response = await fetch(`/api/warehouse/reorder-points/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reorder_point: newReorderPoint })
      });

      if (response.ok) {
        fetchReorderItems();
      } else {
        alert('Failed to update reorder point');
      }
    } catch (error) {
      alert('Error updating reorder point');
    }
  };

  const filteredItems = reorderItems.filter(item => {
    const matchesSearch = item.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || item.status === filterStatus;
    const matchesPriority = !filterPriority || item.priority === filterPriority;
    const matchesCategory = !filterCategory || item.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const getStatusInfo = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const getPriorityInfo = (priority: string) => {
    return priorityOptions.find(p => p.value === priority) || priorityOptions[3];
  };

  const getStockLevel = (current: number, minimum: number) => {
    const percentage = (current / minimum) * 100;
    if (percentage <= 0) return { color: 'bg-red-500', text: 'Out of Stock' };
    if (percentage <= 50) return { color: 'bg-red-400', text: 'Critical' };
    if (percentage <= 100) return { color: 'bg-orange-400', text: 'Low' };
    if (percentage <= 150) return { color: 'bg-yellow-400', text: 'Normal' };
    return { color: 'bg-green-500', text: 'Good' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const criticalItems = filteredItems.filter(item => item.priority === 'critical');
  const highItems = filteredItems.filter(item => item.priority === 'high');
  const totalValue = filteredItems.reduce((sum, item) => sum + (item.suggested_order_quantity * item.unit_cost), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reorder Management</h1>
          <p className="text-gray-600">Monitor stock levels and manage reorder points</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchReorderItems()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <RefreshCw className="inline h-4 w-4 mr-2" />
          </button>
          {criticalItems.length > 0 && (
            <button
              onClick={() => generatePurchaseOrder(criticalItems.map(item => item.id))}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <ShoppingCart className="inline h-4 w-4 mr-2" />
              Order Critical Items
            </button>
          )}
          <Link
            to="/app/warehouse/reorder-points/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="inline h-4 w-4 mr-2" />
            Add Reorder Point
          </Link>
        </div>
      </div>

      {/* Alert Summary */}
      {(criticalItems.length > 0 || highItems.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Stock Alert</h3>
              <p className="text-sm text-red-700 mt-1">
                {criticalItems.length} critical items and {highItems.length} high priority items need immediate attention.
              </p>
            </div>
            <button
              onClick={() => generatePurchaseOrder([...criticalItems, ...highItems].map(item => item.id))}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Order All Priority Items
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Priorities</option>
            {priorityOptions.map(priority => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {filteredItems.length} items
            </span>
          </div>
        </div>
      </div>

      {/* Reorder Items Table */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <CubeIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reorder items found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus || filterPriority || filterCategory
                ? 'Try adjusting your filters to see more items.'
                : 'Get started by setting up reorder points for your products.'
              }
            </p>
            {!searchTerm && !filterStatus && !filterPriority && !filterCategory && (
              <Link
                to="/app/warehouse/reorder-points/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Setup First Reorder Point
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('production.product')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reorder Point
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Suggested Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => {
                  const statusInfo = getStatusInfo(item.status);
                  const priorityInfo = getPriorityInfo(item.priority);
                  const stockLevel = getStockLevel(item.current_stock, item.minimum_stock);
                  const PriorityIcon = priorityInfo.icon;
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CubeIcon className="h-4 w-4 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.product_code}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.product_name}
                            </div>
                            <div className="text-xs text-gray-400">
                              {item.category}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {item.current_stock} / {item.minimum_stock}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className={`h-2 rounded-full ${stockLevel.color}`}
                                style={{ 
                                  width: `${Math.min((item.current_stock / item.minimum_stock) * 100, 100)}%` 
                                }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {stockLevel.text}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.reorder_point}
                        </div>
                        <div className="text-xs text-gray-500">
                          Max: {item.maximum_stock}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.suggested_order_quantity}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(item.suggested_order_quantity * item.unit_cost)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityInfo.color}`}>
                          <PriorityIcon className="h-3 w-3 mr-1" />
                          {priorityInfo.label}
                        </span>
                        {item.days_until_stockout > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {item.days_until_stockout} days left
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.supplier_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Lead: {item.lead_time_days} days
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/app/warehouse/reorder-points/${item.id}`}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/app/warehouse/reorder-points/${item.id}/edit`}
                            className="text-gray-600 hover:text-gray-900"
                            title={t('common.edit')}
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => generatePurchaseOrder([item.id])}
                            className="text-green-600 hover:text-green-900"
                            title="Generate PO"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Reorder Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{filteredItems.length}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{criticalItems.length}</div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{highItems.length}</div>
            <div className="text-sm text-gray-600">High Priority</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {filteredItems.filter(item => item.status === 'ordered').length}
            </div>
            <div className="text-sm text-gray-600">Ordered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalValue)}
            </div>
            <div className="text-sm text-gray-600">Total Value</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReorderList;
