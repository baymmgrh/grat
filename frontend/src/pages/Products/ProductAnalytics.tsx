import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import { formatRupiah } from '../../utils/currencyUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  EyeIcon,
  FunnelIcon

} from '@heroicons/react/24/outline';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter
} from 'recharts';

interface ProductPerformance {
  product_id: number;
  product_name: string;
  category: string;
  sales_qty: number;
  sales_value: number;
  profit_margin: number;
  growth_rate: number;
  stock_turnover: number;
  last_sale_date: string;
}

interface SalesTimeline {
  date: string;
  sales_qty: number;
  sales_value: number;
  profit: number;
}

interface CategoryAnalysis {
  category: string;
  total_products: number;
  total_sales: number;
  avg_margin: number;
  growth_rate: number;
}

interface ProfitabilityData {
  product_name: string;
  revenue: number;
  cost: number;
  profit: number;
  margin_percent: number;
}

interface SeasonalityData {
  month: string;
  sales_2023: number;
  sales_2024: number;
  growth: number;
}

const ProductAnalytics: React.FC = () => {
  const { t } = useLanguage();

  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
  const [salesTimeline, setSalesTimeline] = useState<SalesTimeline[]>([]);
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalysis[]>([]);
  const [profitabilityData, setProfitabilityData] = useState<ProfitabilityData[]>([]);
  const [seasonalityData, setSeasonalityData] = useState<SeasonalityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('3months');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeChart, setActiveChart] = useState('sales');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod, selectedCategory]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [performanceRes, timelineRes, categoryRes, profitRes, seasonalRes] = await Promise.all([
        axiosInstance.get(`/api/products/analytics/performance?period=${selectedPeriod}&category=${selectedCategory}`),
        axiosInstance.get(`/api/products/analytics/timeline?period=${selectedPeriod}`),
        axiosInstance.get(`/api/products/analytics/categories?period=${selectedPeriod}`),
        axiosInstance.get(`/api/products/analytics/profitability?period=${selectedPeriod}`),
        axiosInstance.get(`/api/products/analytics/seasonality`)
      ]);

      setProductPerformance(performanceRes.data?.products || []);
      setSalesTimeline(timelineRes.data?.timeline || []);
      setCategoryAnalysis(categoryRes.data?.categories || []);
      setProfitabilityData(profitRes.data?.profitability || []);
      setSeasonalityData(seasonalRes.data?.seasonality || []);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      // Show empty state instead of mock data
      setProductPerformance([]);
      setSalesTimeline([]);
      setCategoryAnalysis([]);
      setProfitabilityData([]);
      setSeasonalityData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const formatPercent = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const exportData = () => {
    // Mock export functionality
    alert('Export functionality will be implemented with backend integration');
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading product analytics...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            to="/app/products/dashboard"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Analytics</h1>
            <p className="text-gray-600 mt-1">Deep insights into product performance and trends</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportData}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />{t('common.export')}</button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Categories</option>
              <option value="nonwoven">Nonwoven Fabrics</option>
              <option value="medical">Medical Products</option>
              <option value="filter">FunnelIcon Media</option>
              <option value="geotextile">Geotextiles</option>
              <option value="raw">Raw Materials</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 ml-auto">
            <span className="text-sm text-gray-600">View:</span>
            <div className="flex rounded-lg border border-gray-300">
              <button
                onClick={() => setActiveChart('sales')}
                className={`px-3 py-1 text-sm rounded-l-lg ${
                  activeChart === 'sales' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
                }`}
              >{t('navigation.sales')}</button>
              <button
                onClick={() => setActiveChart('profit')}
                className={`px-3 py-1 text-sm ${
                  activeChart === 'profit' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
                }`}
              >
              </button>
              <button
                onClick={() => setActiveChart('performance')}
                className={`px-3 py-1 text-sm rounded-r-lg ${
                  activeChart === 'performance' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
                }`}
              >
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Timeline</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesTimeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                name === 'sales_value' || name === 'profit' ? formatRupiah(value as number) : formatNumber(value as number),
                name === 'sales_value' ? 'Sales Value' : name === 'profit' ? 'Profit' : t('common.quantity')
              ]} />
              <Area type="monotone" dataKey="sales_value" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="profit" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                name === 'total_sales' ? formatRupiah(value as number) : 
                name === 'avg_margin' || name === 'growth_rate' ? formatPercent(value as number) :
                formatNumber(value as number),
                name === 'total_sales' ? 'Total Sales' : 
                name === 'avg_margin' ? 'Avg Margin' :
                name === 'growth_rate' ? 'Growth Rate' : t('navigation.products')
              ]} />
              <Bar dataKey="total_sales" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product Performance Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Product Performance</h3>
          <div className="text-sm text-gray-600">
            Showing {productPerformance.length} products
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('production.product')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('products.bom.category')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit Margin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Turnover
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productPerformance.map((product) => (
                <tr key={product.product_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{product.product_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(product.sales_qty)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatRupiah(product.sales_value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      product.profit_margin >= 25 ? 'text-green-600' :
                      product.profit_margin >= 15 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {formatPercent(product.profit_margin)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.growth_rate >= 0 ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${
                        product.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercent(Math.abs(product.growth_rate))}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.stock_turnover.toFixed(1)}x
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/app/products/${product.product_id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profitability Analysis */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profitability Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={profitabilityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="revenue" name="Revenue" />
              <YAxis dataKey="profit" name="Profit" />
              <Tooltip formatter={(value, name) => [formatRupiah(value as number), name]} />
              <Scatter dataKey="profit" fill="#10B981" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Seasonality Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonality Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={seasonalityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sales_2023" stroke="#94A3B8" strokeWidth={2} name="2023" />
              <Line type="monotone" dataKey="sales_2024" stroke="#3B82F6" strokeWidth={2} name="2024" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProductAnalytics;
