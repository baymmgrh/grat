import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatRupiah } from '../../utils/currencyUtils';
import axiosInstance from '../../utils/axiosConfig';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import {
  ArrowDownTrayIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface Budget {
  category: string
  budgeted: number
  actual: number
  variance: number
  percentage: number
}

const BudgetForecasting = () => {
    const { t } = useLanguage();

const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [showNewBudgetModal, setShowNewBudgetModal] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table')

  useEffect(() => {
    loadBudgets()
  }, [selectedYear])

  const loadBudgets = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get(`/api/finance/budgets?year=${selectedYear}`)
      setBudgets(response.data.budgets || [])
    } catch (error) {
      console.error('Error loading budgets:', error)
      setBudgets([])
    } finally {
      setLoading(false)
    }
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-green-600'
    if (variance < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <ArrowTrendingUpIcon className="h-4 w-4" />
    if (variance < 0) return <ArrowTrendingDownIcon className="h-4 w-4" />
    return null
  }

  const getTotalBudgeted = () => budgets.reduce((sum, b) => sum + b.budgeted, 0)
  const getTotalActual = () => budgets.reduce((sum, b) => sum + b.actual, 0)
  const getTotalVariance = () => budgets.reduce((sum, b) => sum + b.variance, 0)

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Budget & Forecasting</h1>
          <p className="text-gray-600 mt-1">Track budget performance and financial forecasts</p>
        </div>
        <div className="flex gap-3">
          <select
            className="input"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button 
            onClick={() => {
              const data = budgets.map(budget => ({
                [t('products.bom.category')]: budget.category,
                'Budgeted Amount': budget.budgeted,
                'Actual Amount': budget.actual,
                'Variance': budget.variance,
                'Performance %': budget.percentage.toFixed(1) + '%'
              }))
              console.log('Exporting budget data:', data)
              alert('Budget analysis export will be implemented soon!')
            }}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />{t('common.export')}</button>
          <button 
            onClick={() => setShowNewBudgetModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            New Budget
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Budgeted</p>
              <p className="text-2xl font-bold text-gray-900">{formatRupiah(getTotalBudgeted())}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-lg">
              <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Actual</p>
              <p className="text-2xl font-bold text-gray-900">{formatRupiah(getTotalActual())}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${getTotalVariance() >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
              {getTotalVariance() >= 0 ? 
                <ArrowTrendingUpIcon className="h-6 w-6 text-white" /> :
                <ArrowTrendingDownIcon className="h-6 w-6 text-white" />
              }
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Variance</p>
              <p className={`text-2xl font-bold ${getVarianceColor(getTotalVariance())}`}>
                {formatRupiah(getTotalVariance())}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 p-3 rounded-lg">
              <span className="text-2xl text-white">%</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Performance</p>
              <p className="text-2xl font-bold text-gray-900">
                {((getTotalActual() / getTotalBudgeted()) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="card p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Budget Analysis - {selectedYear}</h3>
          <div className="flex rounded-lg border border-gray-300">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                viewMode === 'table'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                viewMode === 'chart'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Chart View
            </button>
          </div>
        </div>
      </div>

      {/* Budget Table */}
      {viewMode === 'table' && (
        <div className="card overflow-hidden">
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance %
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {budgets.map((budget, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{budget.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">{formatRupiah(budget.budgeted)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">{formatRupiah(budget.actual)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-medium inline-flex items-center ${getVarianceColor(budget.variance)}`}>
                        {getVarianceIcon(budget.variance)}
                        <span className="ml-1">{formatRupiah(budget.variance)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-medium ${getVarianceColor(budget.variance)}`}>
                        {budget.percentage.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        budget.percentage >= 100 ? 'bg-green-100 text-green-800' :
                        budget.percentage >= 90 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {budget.percentage >= 100 ? 'On Target' :
                         budget.percentage >= 90 ? 'Warning' : 'Below Target'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">TOTALS</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    {formatRupiah(getTotalBudgeted())}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    {formatRupiah(getTotalActual())}
                  </td>
                  <td className={`px-6 py-4 text-right text-sm font-bold ${getVarianceColor(getTotalVariance())}`}>
                    {formatRupiah(getTotalVariance())}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    {((getTotalActual() / getTotalBudgeted()) * 100).toFixed(1)}%
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Chart View */}
      {viewMode === 'chart' && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Budget vs Actual Performance</h3>
          <div className="space-y-4">
            {budgets.map((budget, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{budget.category}</span>
                  <span className="text-gray-500">
                    {formatRupiah(budget.actual)} / {formatRupiah(budget.budgeted)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6 relative">
                  <div
                    className={`h-6 rounded-full ${
                      budget.percentage >= 100 ? 'bg-green-500' :
                      budget.percentage >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                    {budget.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forecasting Section */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">📈 Forecast Analysis</h3>
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No forecast data available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Budget forecasts will be generated based on your actual budget performance
          </p>
        </div>
      </div>

      {budgets.length === 0 && !loading && (
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No budget data found</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first budget to start tracking performance</p>
        </div>
      )}

      {/* New Budget Modal */}
      {showNewBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">📊 Create New Budget</h3>
              <button 
                onClick={() => setShowNewBudgetModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const newBudget = {
                  category: formData.get('category'),
                  budgeted_amount: Number(formData.get('budgeted_amount')),
                  year: selectedYear,
                  description: formData.get('description')
                }
                
                // Add to budgets list (in real app, would call API)
                const updatedBudgets = [...budgets, {
                  category: newBudget.category as string,
                  budgeted: newBudget.budgeted_amount,
                  actual: 0,
                  variance: -newBudget.budgeted_amount,
                  percentage: 0
                }]
                setBudgets(updatedBudgets)
                
                console.log('Creating budget:', newBudget)
                alert('Budget created successfully!')
                setShowNewBudgetModal(false)
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Category *
                  </label>
                  <select name="category" className="input w-full" required>
                    <option value="">Select category</option>
                    <option value="Sales Revenue">Sales Revenue</option>
                    <option value="Cost of Sales">Cost of Sales</option>
                    <option value="Operating Expenses">Operating Expenses</option>
                    <option value="Marketing Expenses">Marketing Expenses</option>
                    <option value="Administrative Expenses">Administrative Expenses</option>
                    <option value="R&D Expenses">R&D Expenses</option>
                    <option value="Capital Expenditure">Capital Expenditure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budgeted Amount (IDR) *
                  </label>
                  <input 
                    name="budgeted_amount"
                    type="number" 
                    className="input w-full" 
                    placeholder="1000000"
                    min="0"
                    step="1000"
                    required 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Year
                  </label>
                  <input 
                    type="number" 
                    className="input w-full" 
                    value={selectedYear}
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                  </label>
                  <select name="period" className="input w-full">
                    <option value="annual">Annual</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.description')}</label>
                <textarea 
                  name="description"
                  className="input w-full" 
                  rows={3}
                  placeholder="Budget description and goals..."
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">💡 Budget Guidelines</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Set realistic and achievable targets</li>
                  <li>• Consider historical data and market trends</li>
                  <li>• Review and update budgets regularly</li>
                  <li>• Align with company strategic objectives</li>
                </ul>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowNewBudgetModal(false)}
                  className="btn-secondary"
                >{t('common.cancel')}</button>
                <button type="submit" className="btn-primary">
                  Create Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BudgetForecasting
