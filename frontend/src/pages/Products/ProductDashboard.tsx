import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import {
  ChartBarIcon,
  PlusIcon,
  CubeIcon,
  TagIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import { formatRupiah } from '../../utils/currencyUtils';
import { useLanguage } from '../../contexts/LanguageContext';
interface ProductKPIs {
  total_products?: number;
  active_products?: number;
  inactive_products?: number;
  total_categories?: number;
  low_stock_products?: number;
  out_of_stock_products?: number;
  total_value?: number;
  avg_price?: number;
}

interface ProductSalesData {
  product_name: string;
  sales_qty: number;
  sales_value: number;
  profit_margin: number;
}

interface CategoryData {
  category: string;
  product_count: number;
  total_value: number;
}

interface StockAlert {
  id: number;
  product_name: string;
  current_stock: number;
  min_stock: number;
  status: 'low_stock' | 'out_of_stock';
  last_updated: string;
}

interface TrendData {
  month: string;
  new_products: number;
  discontinued: number;
  sales_volume: number;
}

const ProductDashboard: React.FC = () => {
  const { t } = useLanguage();

  const [kpis, setKpis] = useState<ProductKPIs>({
    total_products: 0,
    active_products: 0,
    inactive_products: 0,
    total_categories: 0,
    low_stock_products: 0,
    out_of_stock_products: 0,
    total_value: 0,
    avg_price: 0
  });

  const [topProducts, setTopProducts] = useState<ProductSalesData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);


  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [kpisRes, topProductsRes, categoriesRes, alertsRes, trendsRes] = await Promise.all([
        axiosInstance.get('/api/products/dashboard/kpis'),
        axiosInstance.get('/api/products/dashboard/top-products'),
        axiosInstance.get('/api/products/dashboard/categories'),
        axiosInstance.get('/api/products/dashboard/stock-alerts'),
        axiosInstance.get('/api/products/dashboard/trends')
      ]);

      setKpis(kpisRes.data?.kpis || {});
      
      // Validate and clean top products data
      const cleanTopProducts = (topProductsRes.data?.products || []).map((product: any) => ({
        ...product,
        sales_qty: isNaN(product.sales_qty) ? 0 : (product.sales_qty || 0),
        sales_value: isNaN(product.sales_value) ? 0 : (product.sales_value || 0),
        profit_margin: isNaN(product.profit_margin) ? 0 : (product.profit_margin || 0)
      }));
      setTopProducts(cleanTopProducts);
      
      setCategoryData(categoriesRes.data?.categories || []);
      setStockAlerts(alertsRes.data?.alerts || []);
      setTrendData(trendsRes.data?.trends || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set minimal fallback data to prevent chart errors
      setKpis({
        total_products: 0,
        active_products: 0,
        inactive_products: 0,
        total_categories: 0,
        low_stock_products: 0,
        out_of_stock_products: 0,
        total_value: 0,
        avg_price: 0
      });
      setTopProducts([
        { id: 1, name: 'No Data', sales_qty: 0, sales_value: 0, profit_margin: 0 }
      ]);
      setCategoryData([
        { category: 'No Data', count: 0, percentage: 100 }
      ]);
      setStockAlerts([
        { id: 1, product_name: 'No Data', status: 'normal', stock_level: 0, min_stock: 0 }
      ]);
      setTrendData([
        { month: 'Jan', new_products: 0, discontinued: 0, sales_volume: 0 },
        { month: 'Feb', new_products: 0, discontinued: 0, sales_volume: 0 },
        { month: 'Mar', new_products: 0, discontinued: 0, sales_volume: 0 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (amount: number | undefined) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return 'Rp 0';
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null || isNaN(num)) {
      return '0';
    }
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'text-red-600 bg-red-100';
      case 'low_stock': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading product dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive overview of your product portfolio</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/app/products/analytics"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
          </Link>
          <Link
            to="/app/products/new"
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Product
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CubeIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(kpis.total_products ?? 0)}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">{formatNumber(kpis.active_products ?? 0)} Active</span>
            <span className="text-gray-400 mx-2">•</span>
            <span className="text-red-600 font-medium">{formatNumber(kpis.inactive_products ?? 0)} Inactive</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TagIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(kpis.total_categories ?? 0)}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/app/products/categories" className="text-sm text-blue-600 hover:text-blue-800">
              Manage Categories →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stock Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber((kpis.low_stock_products ?? 0) + (kpis.out_of_stock_products ?? 0))}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-yellow-600 font-medium">{formatNumber(kpis.low_stock_products ?? 0)} Low Stock</span>
            <span className="text-gray-400 mx-2">•</span>
            <span className="text-red-600 font-medium">{formatNumber(kpis.out_of_stock_products ?? 0)} Out of Stock</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatRupiah(kpis.total_value ?? 0)}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">Avg Price: {formatRupiah(kpis.avg_price ?? 0)}</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                name === 'sales_value' ? formatRupiah(value as number) : formatNumber(value as number),
                name === 'sales_value' ? 'Sales Value' : t('common.quantity')
              ]} />
              <Bar dataKey="sales_qty" fill="#3B82F6" name="sales_qty" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Products by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, product_count }) => `${category} (${product_count})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="product_count"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Stock Alerts</h3>
            <Link to="/app/warehouse/inventory" className="text-sm text-blue-600 hover:text-blue-800">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {stockAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{alert.product_name}</p>
                  <p className="text-sm text-gray-600">
                    Stock: {alert.current_stock} / Min: {alert.min_stock}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(alert.status)}`}>
                  {alert.status === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Product Trends */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="new_products" stroke="#10B981" strokeWidth={2} name="New Products" />
              <Line type="monotone" dataKey="discontinued" stroke="#EF4444" strokeWidth={2} name="Discontinued" />
              <Line type="monotone" dataKey="sales_volume" stroke="#3B82F6" strokeWidth={2} name="Sales Volume" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link
            to="/app/products/list"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
          >
            <div className="text-center">
              <ListBulletIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-600">Product List</span>
            </div>
          </Link>
          
          <Link
            to="/app/products/new"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-center">
              <PlusIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-600">Add Product</span>
            </div>
          </Link>
          
          <Link
            to="/app/products/categories"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <div className="text-center">
              <TagIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-600">Manage Categories</span>
            </div>
          </Link>
          
          <Link
            to="/app/products/bom"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <div className="text-center">
              <CubeIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-600">{t('products.bom.title')}</span>
            </div>
          </Link>
          
          <Link
            to="/app/products/analytics"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <div className="text-center">
              <ChartBarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-600">Analytics</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductDashboard;
