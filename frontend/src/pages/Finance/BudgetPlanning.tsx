import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import { formatRupiah } from '../../utils/currencyUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface Budget {
  id: number;
  budget_name: string;
  budget_period: string;
  total_budget: number;
  total_actual: number;
  variance: number;
  variance_percent: number;
  status: string;
}

interface VarianceAnalysis {
  category: string;
  budget: number;
  actual: number;
  variance: number;
  variance_percent: number;
}

const BudgetPlanning: React.FC = () => {
  const { t } = useLanguage();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [varianceAnalysis, setVarianceAnalysis] = useState<VarianceAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBudget, setSelectedBudget] = useState<string>('annual');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    budget_name: '',
    budget_period: '',
    fiscal_year: new Date().getFullYear(),
    start_date: '',
    end_date: '',
    total_budget: 0,
    department: '',
    category: '',
    description: '',
    status: 'draft'
  });

  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      
      const [budgetsRes, varianceRes] = await Promise.all([
        axiosInstance.get('/api/finance/budget/budgets'),
        axiosInstance.get('/api/finance/budget/variance-analysis')
      ]);

      setBudgets(budgetsRes.data?.budgets || []);
      setVarianceAnalysis(varianceRes.data?.analysis || []);
    } catch (error) {
      console.error('Failed to load budget data:', error);
      // Mock data fallback
      setBudgets([
        {
          id: 1,
          budget_name: 'Annual Budget 2024',
          budget_period: '2024',
          total_budget: 150000000000,
          total_actual: 125000000000,
          variance: -25000000000,
          variance_percent: -16.7,
          status: 'active'
        },
        {
          id: 2,
          budget_name: 'Q4 2024 Budget',
          budget_period: 'Q4 2024',
          total_budget: 40000000000,
          total_actual: 38500000000,
          variance: -1500000000,
          variance_percent: -3.8,
          status: 'active'
        },
        {
          id: 3,
          budget_name: 'Marketing Budget 2024',
          budget_period: '2024',
          total_budget: 12000000000,
          total_actual: 8500000000,
          variance: -3500000000,
          variance_percent: -29.2,
          status: 'active'
        }
      ]);

      setVarianceAnalysis([
        { category: 'Revenue', budget: 150000000000, actual: 125000000000, variance: -25000000000, variance_percent: -16.7 },
        { category: 'Raw Materials', budget: 45000000000, actual: 35000000000, variance: -10000000000, variance_percent: -22.2 },
        { category: 'Labor Costs', budget: 30000000000, actual: 28000000000, variance: -2000000000, variance_percent: -6.7 },
        { category: 'Manufacturing', budget: 18000000000, actual: 15000000000, variance: -3000000000, variance_percent: -16.7 },
        { category: 'Marketing', budget: 10000000000, actual: 8500000000, variance: -1500000000, variance_percent: -15.0 },
        { category: 'Administration', budget: 7000000000, actual: 5200000000, variance: -1800000000, variance_percent: -25.7 }
      ]);
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

  const formatPercent = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-green-600';
    if (variance < -10) return 'text-red-600';
    return 'text-yellow-600';
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({
      budget_name: '',
      budget_period: '',
      fiscal_year: new Date().getFullYear(),
      start_date: '',
      end_date: '',
      total_budget: 0,
      department: '',
      category: '',
      description: '',
      status: 'draft'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/finance/budget/budgets', formData);
      alert('Budget created successfully!');
      handleCloseModal();
      loadBudgetData();
    } catch (error: any) {
      console.error('Error creating budget:', error);
      alert(error.response?.data?.error || 'Failed to create budget. Please try again.');
    }
  };

  const getVarianceBgColor = (variance: number) => {
    if (variance > 0) return 'bg-green-100 text-green-800';
    if (variance < -10) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading budget data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budget Planning</h1>
          <p className="text-gray-600 mt-1">Budget planning and variance analysis</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => alert('Generate budget report functionality')}
            className="btn-secondary"
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Generate Report
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Budget
          </button>
        </div>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {budgets.map((budget) => (
          <div key={budget.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{budget.budget_name}</h3>
              <span className="text-sm text-gray-500">{budget.budget_period}</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Budget:</span>
                <span className="text-sm font-medium">{formatRupiah(budget.total_budget)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Actual:</span>
                <span className="text-sm font-medium">{formatRupiah(budget.total_actual)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Variance:</span>
                <div className="flex items-center">
                  {budget.variance_percent > 0 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${getVarianceColor(budget.variance_percent)}`}>
                    {formatPercent(budget.variance_percent)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.min((budget.total_actual / budget.total_budget) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {((budget.total_actual / budget.total_budget) * 100).toFixed(1)}% of budget used
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Variance Analysis Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget vs Actual</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={varianceAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
              <YAxis tickFormatter={(value) => `${(value / 1000000000).toFixed(0)}B`} />
              <Tooltip formatter={(value, name) => [
                formatRupiah(value as number),
                name === 'budget' ? 'Budget' : 'Actual'
              ]} />
              <Bar dataKey="budget" fill="#3B82F6" name="Budget" />
              <Bar dataKey="actual" fill="#10B981" name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Variance Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={varianceAnalysis.map(item => ({ ...item, absVariance: Math.abs(item.variance) }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, variance_percent }) => `${category}: ${variance_percent.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="absVariance"
              >
                {varianceAnalysis.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [formatRupiah(value as number), 'Variance']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Variance Analysis */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Variance Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('products.bom.category')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variance %
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {varianceAnalysis.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatRupiah(item.budget)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatRupiah(item.actual)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${getVarianceColor(item.variance_percent)}`}>
                    {formatRupiah(item.variance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getVarianceBgColor(item.variance_percent)}`}>
                      {formatPercent(item.variance_percent)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {item.variance_percent > 0 ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mx-auto" />
                    ) : item.variance_percent < -10 ? (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mx-auto" />
                    ) : (
                      <ChartBarIcon className="h-5 w-5 text-yellow-500 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Budget Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Budget</p>
              <p className="text-xl font-bold text-gray-900">
                {formatRupiah(budgets.reduce((sum, b) => sum + b.total_budget, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Actual</p>
              <p className="text-xl font-bold text-gray-900">
                {formatRupiah(budgets.reduce((sum, b) => sum + b.total_actual, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-lg">
              <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Variance</p>
              <p className="text-xl font-bold text-red-900">
                {formatRupiah(budgets.reduce((sum, b) => sum + b.variance, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Budget Utilization</p>
              <p className="text-xl font-bold text-gray-900">
                {((budgets.reduce((sum, b) => sum + b.total_actual, 0) / budgets.reduce((sum, b) => sum + b.total_budget, 0)) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Budget Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Create New Budget</h3>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Name *
                  </label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    value={formData.budget_name}
                    onChange={(e) => setFormData({...formData, budget_name: e.target.value})}
                    required 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fiscal Year *
                  </label>
                  <input 
                    type="number" 
                    className="input w-full"
                    value={formData.fiscal_year}
                    onChange={(e) => setFormData({...formData, fiscal_year: parseInt(e.target.value)})}
                    min="2020"
                    max="2030"
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Period *
                  </label>
                  <select 
                    className="input w-full"
                    value={formData.budget_period}
                    onChange={(e) => setFormData({...formData, budget_period: e.target.value})}
                    required
                  >
                    <option value="">Select period</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="semi-annual">Semi-Annual</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select 
                    className="input w-full"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    required
                  >
                    <option value="">Select department</option>
                    <option value="production">Production</option>
                    <option value="sales">Sales & Marketing</option>
                    <option value="finance">Finance</option>
                    <option value="hr">Human Resources</option>
                    <option value="it">IT</option>
                    <option value="operations">Operations</option>
                    <option value="rd">Research & Development</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input 
                    type="date" 
                    className="input w-full"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input 
                    type="date" 
                    className="input w-full"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Category *
                  </label>
                  <select 
                    className="input w-full"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    <option value="">Select category</option>
                    <option value="revenue">Revenue</option>
                    <option value="cogs">Cost of Goods Sold</option>
                    <option value="operating_expenses">Operating Expenses</option>
                    <option value="capital_expenditure">Capital Expenditure</option>
                    <option value="marketing">Marketing</option>
                    <option value="research">Research & Development</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select 
                    className="input w-full"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    required
                  >
                    <option value="draft">Draft</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="active">Active</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Budget Amount (IDR) *
                </label>
                <input 
                  type="number" 
                  className="input w-full text-lg font-semibold"
                  value={formData.total_budget}
                  onChange={(e) => setFormData({...formData, total_budget: parseFloat(e.target.value) || 0})}
                  step="1000000"
                  min="0"
                  required 
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.total_budget > 0 && formatRupiah(formData.total_budget)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea 
                  className="input w-full" 
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter budget objectives, scope, and key assumptions..."
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetPlanning;
