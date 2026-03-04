import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext';
import { formatRupiah } from '../../utils/currencyUtils';
import {
  ArrowDownTrayIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  DocumentChartBarIcon
,
  PlusIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig'
import LoadingSpinner from '../../components/Common/LoadingSpinner'
interface ConsolidatedData {
  entity_name: string
  revenue: number
  expenses: number
  net_income: number
  assets: number
  liabilities: number
  equity: number
  elimination_adjustments: number
}

interface ConsolidationSummary {
  total_entities: number
  consolidated_revenue: number
  consolidated_net_income: number
  consolidated_assets: number
  consolidation_date: string
}

const Consolidation = () => {
    const { t } = useLanguage();

const [consolidatedData, setConsolidatedData] = useState<ConsolidatedData[]>([])
  const [summary, setSummary] = useState<ConsolidationSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(`${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`)
  const [showAddEntityModal, setShowAddEntityModal] = useState(false)
  const [viewMode, setViewMode] = useState<'financial' | 'performance'>('financial')

  useEffect(() => {
    loadConsolidationData()
  }, [selectedPeriod])

  const loadConsolidationData = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get(`/api/finance/consolidation?period=${selectedPeriod}`)
      setConsolidatedData(response.data.consolidated_data || [])
      setSummary(response.data.summary || null)
    } catch (error) {
      console.error('Error loading consolidation data:', error)
      setConsolidatedData([])
      setSummary(null)
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

  const getEntityIcon = (entityName: string) => {
    if (entityName.toLowerCase().includes('parent')) return '🏢'
    if (entityName.toLowerCase().includes('subsidiary')) return '🏬'
    if (entityName.toLowerCase().includes('branch')) return '🏪'
    if (entityName.toLowerCase().includes('division')) return '🏭'
    return '🏢'
  }

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 15) return 'text-green-600'
    if (percentage >= 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getROE = (entity: ConsolidatedData) => {
    return entity.equity > 0 ? (entity.net_income / entity.equity) * 100 : 0
  }

  const getROA = (entity: ConsolidatedData) => {
    return entity.assets > 0 ? (entity.net_income / entity.assets) * 100 : 0
  }

  const getProfitMargin = (entity: ConsolidatedData) => {
    return entity.revenue > 0 ? (entity.net_income / entity.revenue) * 100 : 0
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🏢 Consolidation</h1>
          <p className="text-gray-600 mt-1">Consolidated financial statements and group performance</p>
        </div>
        <div className="flex gap-3">
          <select
            className="input"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value={`${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`}>Current Quarter</option>
            <option value={`${new Date().getFullYear()}-Q${Math.max(1, Math.ceil((new Date().getMonth() + 1) / 3) - 1)}`}>Previous Quarter</option>
          </select>
          <button 
            onClick={() => {
              const data = consolidatedData.map(entity => ({
                'Entity Name': entity.entity_name,
                'Revenue': entity.revenue,
                'Expenses': entity.expenses,
                'Net Income': entity.net_income,
                'Assets': entity.assets,
                'Liabilities': entity.liabilities,
                'Equity': entity.equity,
                'Eliminations': entity.elimination_adjustments
              }))
              console.log('Exporting consolidation data:', data)
              alert('Consolidation export will be implemented soon!')
            }}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />{t('common.export')}</button>
          <button 
            onClick={() => setShowAddEntityModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Entity
          </button>
        </div>
      </div>

      {/* Consolidation Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="bg-blue-500 p-3 rounded-lg">
                <BuildingOffice2Icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Entities</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total_entities}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="bg-green-500 p-3 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Consolidated Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatRupiah(summary.consolidated_revenue)}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="bg-purple-500 p-3 rounded-lg">
                <DocumentChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Consolidated Net Income</p>
                <p className="text-2xl font-bold text-purple-600">{formatRupiah(summary.consolidated_net_income)}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="bg-orange-500 p-3 rounded-lg">
                <span className="text-2xl text-white">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Consolidated Assets</p>
                <p className="text-2xl font-bold text-orange-600">{formatRupiah(summary.consolidated_assets)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="card p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Entity Analysis - {selectedPeriod}</h3>
          <div className="flex rounded-lg border border-gray-300">
            <button
              onClick={() => setViewMode('financial')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                viewMode === 'financial'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Financial Position
            </button>
            <button
              onClick={() => setViewMode('performance')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                viewMode === 'performance'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Performance Metrics
            </button>
          </div>
        </div>
      </div>

      {/* Financial Position View */}
      {viewMode === 'financial' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Income
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {consolidatedData.map((entity, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getEntityIcon(entity.entity_name)}</span>
                        <div className="text-sm font-medium text-gray-900">{entity.entity_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatRupiah(entity.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600">
                      {formatRupiah(entity.expenses)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <span className={entity.net_income >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatRupiah(entity.net_income)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatRupiah(entity.assets)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600">
                      {formatRupiah(entity.liabilities)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-blue-600">
                      {formatRupiah(entity.equity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-orange-600">
                      {formatRupiah(entity.elimination_adjustments)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">CONSOLIDATED TOTALS</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    {formatRupiah(consolidatedData.reduce((sum, e) => sum + e.revenue, 0))}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-red-600">
                    {formatRupiah(consolidatedData.reduce((sum, e) => sum + e.expenses, 0))}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                    {formatRupiah(consolidatedData.reduce((sum, e) => sum + e.net_income, 0))}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    {formatRupiah(consolidatedData.reduce((sum, e) => sum + e.assets, 0))}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-red-600">
                    {formatRupiah(consolidatedData.reduce((sum, e) => sum + e.liabilities, 0))}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-blue-600">
                    {formatRupiah(consolidatedData.reduce((sum, e) => sum + e.equity, 0))}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-orange-600">
                    {formatRupiah(consolidatedData.reduce((sum, e) => sum + e.elimination_adjustments, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Performance Metrics View */}
      {viewMode === 'performance' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit Margin %
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROA %
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROE %
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance Rating
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contribution %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {consolidatedData.map((entity, index) => {
                  const profitMargin = getProfitMargin(entity)
                  const roa = getROA(entity)
                  const roe = getROE(entity)
                  const totalRevenue = consolidatedData.reduce((sum, e) => sum + e.revenue, 0)
                  const contribution = totalRevenue > 0 ? (entity.revenue / totalRevenue) * 100 : 0

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{getEntityIcon(entity.entity_name)}</span>
                          <div className="text-sm font-medium text-gray-900">{entity.entity_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatRupiah(entity.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <span className={getPerformanceColor(profitMargin)}>
                          {profitMargin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <span className={getPerformanceColor(roa)}>
                          {roa.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <span className={getPerformanceColor(roe)}>
                          {roe.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          profitMargin >= 15 && roa >= 10 ? 'bg-green-100 text-green-800' :
                          profitMargin >= 10 && roa >= 5 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {profitMargin >= 15 && roa >= 10 ? 'Excellent' :
                           profitMargin >= 10 && roa >= 5 ? 'Good' : 'Needs Improvement'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-blue-600">
                        {contribution.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Consolidation Notes */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">📋 Consolidation Notes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Elimination Adjustments</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Intercompany sales and purchases eliminated</li>
              <li>• Investment in subsidiaries eliminated against equity</li>
              <li>• Intercompany receivables and payables eliminated</li>
              <li>• Unrealized profits on intercompany transactions eliminated</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Consolidation Policies</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Full consolidation for subsidiaries with &gt;50% ownership</li>
              <li>• Equity method for associates with 20-50% ownership</li>
              <li>• Consistent accounting policies across entities</li>
              <li>• Same reporting period for all entities</li>
            </ul>
          </div>
        </div>
      </div>

      {consolidatedData.length === 0 && !loading && (
        <div className="text-center py-12">
          <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No consolidation data found</h3>
          <p className="mt-1 text-sm text-gray-500">Add entities to begin consolidation process</p>
        </div>
      )}

      {/* Add Entity Modal */}
      {showAddEntityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">🏢 Add Subsidiary Entity</h3>
              <button 
                onClick={() => setShowAddEntityModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const newEntity = {
                  entity_name: formData.get('entity_name'),
                  entity_type: formData.get('entity_type'),
                  ownership_percentage: Number(formData.get('ownership_percentage')),
                  functional_currency: formData.get('functional_currency'),
                  revenue: Number(formData.get('revenue')) || 0,
                  expenses: Number(formData.get('expenses')) || 0,
                  assets: Number(formData.get('assets')) || 0,
                  liabilities: Number(formData.get('liabilities')) || 0
                }
                
                const calculatedEquity = newEntity.assets - newEntity.liabilities
                const calculatedNetIncome = newEntity.revenue - newEntity.expenses
                
                // Add to consolidated data (in real app, would call API)
                const updatedData = [...consolidatedData, {
                  entity_name: newEntity.entity_name as string,
                  revenue: newEntity.revenue,
                  expenses: newEntity.expenses,
                  net_income: calculatedNetIncome,
                  assets: newEntity.assets,
                  liabilities: newEntity.liabilities,
                  equity: calculatedEquity,
                  elimination_adjustments: 0
                }]
                setConsolidatedData(updatedData)
                
                console.log('Adding entity:', newEntity)
                alert('Entity added to consolidation successfully!')
                setShowAddEntityModal(false)
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entity Name *
                  </label>
                  <input 
                    name="entity_name"
                    type="text" 
                    className="input w-full" 
                    placeholder="e.g., PT ABC Manufacturing"
                    required 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entity Type *
                  </label>
                  <select name="entity_type" className="input w-full" required>
                    <option value="">Select type</option>
                    <option value="subsidiary">Subsidiary (&gt;50% ownership)</option>
                    <option value="associate">Associate (20-50% ownership)</option>
                    <option value="joint_venture">Joint Venture</option>
                    <option value="branch">Branch Office</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ownership Percentage *
                  </label>
                  <input 
                    name="ownership_percentage"
                    type="number" 
                    className="input w-full" 
                    placeholder="100"
                    min="0"
                    max="100"
                    step="0.01"
                    required 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Functional Currency
                  </label>
                  <select name="functional_currency" className="input w-full">
                    <option value="IDR">IDR - Indonesian Rupiah</option>
                    <option value="IDR">IDR - US Rupiah</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="SGD">SGD - Singapore Rupiah</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Financial Information (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Revenue (IDR)
                    </label>
                    <input 
                      name="revenue"
                      type="number" 
                      className="input w-full" 
                      placeholder="0"
                      min="0"
                      step="1000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expenses (IDR)
                    </label>
                    <input 
                      name="expenses"
                      type="number" 
                      className="input w-full" 
                      placeholder="0"
                      min="0"
                      step="1000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Assets (IDR)
                    </label>
                    <input 
                      name="assets"
                      type="number" 
                      className="input w-full" 
                      placeholder="0"
                      min="0"
                      step="1000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Liabilities (IDR)
                    </label>
                    <input 
                      name="liabilities"
                      type="number" 
                      className="input w-full" 
                      placeholder="0"
                      min="0"
                      step="1000"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">⚠️ Consolidation Guidelines</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Full consolidation for subsidiaries with &gt;50% ownership</li>
                  <li>• Equity method for associates with 20-50% ownership</li>
                  <li>• Ensure consistent accounting policies</li>
                  <li>• Eliminate intercompany transactions</li>
                </ul>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddEntityModal(false)}
                  className="btn-secondary"
                >{t('common.cancel')}</button>
                <button type="submit" className="btn-primary">
                  Add Entity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Consolidation
