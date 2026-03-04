import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import { formatRupiah } from '../../utils/currencyUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowLeftIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon
,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

interface ProductLifecycleData {
  product_id: number;
  product_name: string;
  product_code: string;
  category: string;
  launch_date: string;
  current_stage: 'introduction' | 'growth' | 'maturity' | 'decline' | 'discontinued';
  stage_duration: number; // days in current stage
  total_sales: number;
  total_revenue: number;
  profit_margin: number;
  market_share: number;
  growth_rate: number;
  roi: number;
  last_updated: string;
}

interface StageMetrics {
  stage: string;
  product_count: number;
  total_revenue: number;
  avg_duration: number;
  success_rate: number;
}

interface LifecycleTimeline {
  date: string;
  introduction: number;
  growth: number;
  maturity: number;
  decline: number;
  discontinued: number;
}

interface ProductTransition {
  product_id: number;
  product_name: string;
  from_stage: string;
  to_stage: string;
  transition_date: string;
  reason: string;
  impact_score: number;
}

const ProductLifecycle: React.FC = () => {
  const { t } = useLanguage();

  const [products, setProducts] = useState<ProductLifecycleData[]>([]);
  const [stageMetrics, setStageMetrics] = useState<StageMetrics[]>([]);
  const [timeline, setTimeline] = useState<LifecycleTimeline[]>([]);
  const [transitions, setTransitions] = useState<ProductTransition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

  useEffect(() => {
    loadLifecycleData();
  }, [selectedPeriod]);

  const loadLifecycleData = async () => {
    try {
      setLoading(true);
      
      const [productsRes, metricsRes, timelineRes, transitionsRes] = await Promise.all([
        axiosInstance.get(`/api/products/lifecycle/products?period=${selectedPeriod}`),
        axiosInstance.get(`/api/products/lifecycle/stage-metrics?period=${selectedPeriod}`),
        axiosInstance.get(`/api/products/lifecycle/timeline?period=${selectedPeriod}`),
        axiosInstance.get(`/api/products/lifecycle/transitions?period=${selectedPeriod}`)
      ]);

      setProducts(productsRes.data?.products || []);
      setStageMetrics(metricsRes.data?.metrics || []);
      setTimeline(timelineRes.data?.timeline || []);
      setTransitions(transitionsRes.data?.transitions || []);
    } catch (error) {
      console.error('Failed to load lifecycle data:', error);
      // Show empty state instead of mock data
      setProducts([]);
      setStageMetrics([]);
      setTimeline([]);
      setTransitions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.product_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'all' || product.current_stage === stageFilter;
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    return matchesSearch && matchesStage && matchesCategory;
  });

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'introduction': return 'bg-blue-100 text-blue-800';
      case 'growth': return 'bg-green-100 text-green-800';
      case 'maturity': return 'bg-yellow-100 text-yellow-800';
      case 'decline': return 'bg-orange-100 text-orange-800';
      case 'discontinued': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'introduction': return <SparklesIcon className="h-4 w-4" />;
      case 'growth': return <ArrowTrendingUpIcon className="h-4 w-4" />;
      case 'maturity': return <CheckCircleIcon className="h-4 w-4" />;
      case 'decline': return <ArrowTrendingDownIcon className="h-4 w-4" />;
      case 'discontinued': return <XCircleIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number | string | null | undefined) => {
    const n = Number(num) || 0;
    return new Intl.NumberFormat('id-ID').format(n);
  };

  const formatPercent = (num: number | string | null | undefined) => {
    const n = Number(num) || 0;
    return `${n.toFixed(1)}%`;
  };

  const formatDuration = (days: number | string | null | undefined) => {
    const d = Number(days) || 0;
    if (d < 30) return `${d} days`;
    if (d < 365) return `${Math.round(d / 30)} months`;
    return `${Math.round(d / 365)} years`;
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading lifecycle data...</span>
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
            <h1 className="text-3xl font-bold text-gray-900">Product Lifecycle</h1>
            <p className="text-gray-600 mt-1">Track product performance across lifecycle stages</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
            <option value="2years">Last 2 Years</option>
          </select>
        </div>
      </div>

      {/* Stage Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {stageMetrics.map((metric, index) => (
          <div key={metric.stage} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${getStageColor(metric.stage.toLowerCase())}`}>
                {getStageIcon(metric.stage.toLowerCase())}
              </div>
              <span className="text-2xl font-bold text-gray-900">{metric.product_count}</span>
            </div>
            <h3 className="font-medium text-gray-900">{metric.stage}</h3>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <div>Revenue: {formatRupiah(metric.total_revenue)}</div>
              <div>Avg Duration: {formatDuration(metric.avg_duration)}</div>
              <div>Success Rate: {formatPercent(metric.success_rate)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lifecycle Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lifecycle Timeline</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="introduction" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
              <Area type="monotone" dataKey="growth" stackId="1" stroke="#10B981" fill="#10B981" />
              <Area type="monotone" dataKey="maturity" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
              <Area type="monotone" dataKey="decline" stackId="1" stroke="#EF4444" fill="#EF4444" />
              <Area type="monotone" dataKey="discontinued" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stage Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stage Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stageMetrics}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ stage, product_count }) => `${stage} (${product_count})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="product_count"
              >
                {stageMetrics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Stages</option>
              <option value="introduction">Introduction</option>
              <option value="growth">Growth</option>
              <option value="maturity">Maturity</option>
              <option value="decline">Decline</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">All Categories</option>
            <option value="Nonwoven Fabrics">Nonwoven Fabrics</option>
            <option value="Medical Products">Medical Products</option>
            <option value="FunnelIcon Media">FunnelIcon Media</option>
            <option value="Geotextiles">Geotextiles</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Product Lifecycle Status</h3>
          <div className="text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('production.product')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Market Share
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.product_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{product.product_name}</div>
                      <div className="text-sm text-gray-500">{product.product_code}</div>
                      <div className="text-xs text-gray-400">{product.category}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(product.current_stage)}`}>
                      {getStageIcon(product.current_stage)}
                      <span className="ml-1 capitalize">{product.current_stage}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(product.stage_duration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatRupiah(product.total_revenue)}
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
                    {formatPercent(product.market_share)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      product.roi >= 100 ? 'text-green-600' :
                      product.roi >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {formatPercent(product.roi)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/app/products-v2?view=detail&code=${product.product_code}`}
                      className="text-blue-600 hover:text-blue-900"
                      title="Lihat detail produk"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Transitions */}
      {transitions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Stage Transitions</h3>
          <div className="space-y-4">
            {transitions.map((transition, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{transition.product_name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Moved from <span className="font-medium capitalize">{transition.from_stage}</span> to{' '}
                    <span className="font-medium capitalize">{transition.to_stage}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{transition.reason}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    {new Date(transition.transition_date).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    Impact: {transition.impact_score}/10
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductLifecycle;
