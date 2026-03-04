import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatRupiah } from '../../utils/currencyUtils';
import {
  ArrowDownTrayIcon,
  BuildingOfficeIcon,
  ChartPieIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface CostAnalysis {
  cost_center: string
  direct_materials: number
  direct_labor: number
  overhead: number
  total_cost: number
  units_produced: number
  cost_per_unit: number
}

const CostingControlling = () => {
    const { t } = useLanguage();

const [costAnalysis, setCostAnalysis] = useState<CostAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('current-month')
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table')

  useEffect(() => {
    loadCostAnalysis()
  }, [selectedPeriod])

  const loadCostAnalysis = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/api/finance/costing')
      setCostAnalysis(response.data.cost_analysis || [])
    } catch (error) {
      console.error('Error loading cost analysis:', error)
      setCostAnalysis([])
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

  const getTotalCosts = () => {
    return costAnalysis.reduce((sum, item) => sum + item.total_cost, 0)
  }

  const getTotalUnits = () => {
    return costAnalysis.reduce((sum, item) => sum + item.units_produced, 0)
  }

  const getAverageCostPerUnit = () => {
    const totalCost = getTotalCosts()
    const totalUnits = getTotalUnits()
    return totalUnits > 0 ? totalCost / totalUnits : 0
  }

  const getCostBreakdown = () => {
    const totals = costAnalysis.reduce((acc, item) => ({
      materials: acc.materials + item.direct_materials,
      labor: acc.labor + item.direct_labor,
      overhead: acc.overhead + item.overhead
    }), { materials: 0, labor: 0, overhead: 0 })

    const total = totals.materials + totals.labor + totals.overhead
    
    return {
      materials: { amount: totals.materials, percentage: (totals.materials / total) * 100 },
      labor: { amount: totals.labor, percentage: (totals.labor / total) * 100 },
      overhead: { amount: totals.overhead, percentage: (totals.overhead / total) * 100 }
    }
  }

  const getCostCenterIcon = (centerName: string) => {
    if (centerName.toLowerCase().includes('production')) return '🏭'
    if (centerName.toLowerCase().includes('quality')) return '🔍'
    if (centerName.toLowerCase().includes('packaging')) return '📦'
    if (centerName.toLowerCase().includes('warehouse')) return '🏪'
    return '🏢'
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const breakdown = getCostBreakdown()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Costing & Controlling</h1>
          <p className="text-gray-600 mt-1">Analyze cost structures and control manufacturing expenses</p>
        </div>
        <div className="flex gap-3">
          <select
            className="input"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="current-month">Current Month</option>
            <option value="last-month">Last Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button 
            onClick={() => {
              const data = costAnalysis.map(item => ({
                'Cost Center': item.cost_center,
                'Direct Materials': item.direct_materials,
                'Direct Labor': item.direct_labor,
                'Overhead': item.overhead,
                [t('products.bom.total_cost')]: item.total_cost,
                'Units Produced': item.units_produced,
                'Cost per Unit': item.cost_per_unit
              }))
              console.log('Exporting costing data:', data)
              alert('Cost analysis export will be implemented soon!')
            }}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />{t('common.export')}</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg">
              <ChartPieIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Costs</p>
              <p className="text-2xl font-bold text-gray-900">{formatRupiah(getTotalCosts())}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-lg">
              <CubeIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Units Produced</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalUnits().toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 p-3 rounded-lg">
              <span className="text-2xl text-white">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Cost/Unit</p>
              <p className="text-2xl font-bold text-gray-900">{formatRupiah(getAverageCostPerUnit())}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-orange-500 p-3 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cost Centers</p>
              <p className="text-2xl font-bold text-gray-900">{costAnalysis.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">📈 Cost Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                <span className="text-sm font-medium">Direct Materials</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{formatRupiah(breakdown.materials.amount)}</p>
                <p className="text-xs text-gray-500">{breakdown.materials.percentage.toFixed(1)}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                <span className="text-sm font-medium">Direct Labor</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{formatRupiah(breakdown.labor.amount)}</p>
                <p className="text-xs text-gray-500">{breakdown.labor.percentage.toFixed(1)}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-orange-500 rounded mr-3"></div>
                <span className="text-sm font-medium">Overhead</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{formatRupiah(breakdown.overhead.amount)}</p>
                <p className="text-xs text-gray-500">{breakdown.overhead.percentage.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Visual Cost Breakdown */}
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-6 flex overflow-hidden">
              <div 
                className="bg-blue-500 h-full" 
                style={{ width: `${breakdown.materials.percentage}%` }}
              ></div>
              <div 
                className="bg-green-500 h-full" 
                style={{ width: `${breakdown.labor.percentage}%` }}
              ></div>
              <div 
                className="bg-orange-500 h-full" 
                style={{ width: `${breakdown.overhead.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">🎯 Cost Efficiency Metrics</h3>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-1">Material Efficiency</h4>
              <p className="text-2xl font-bold text-green-600">92.5%</p>
              <p className="text-sm text-green-600">↑ 2.3% from last month</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-1">Labor Productivity</h4>
              <p className="text-2xl font-bold text-blue-600">87.8%</p>
              <p className="text-sm text-blue-600">↑ 1.5% from last month</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-1">Overhead Control</h4>
              <p className="text-2xl font-bold text-orange-600">95.2%</p>
              <p className="text-sm text-orange-600">↓ 0.8% from last month</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="card p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Cost Center Analysis</h3>
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

      {/* Cost Analysis Table */}
      {viewMode === 'table' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost Center
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Direct Materials
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Direct Labor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('products.bom.total_cost')}</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Units Produced
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost per Unit
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {costAnalysis.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getCostCenterIcon(item.cost_center)}</span>
                        <div className="text-sm font-medium text-gray-900">{item.cost_center}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatRupiah(item.direct_materials)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatRupiah(item.direct_labor)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatRupiah(item.overhead)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatRupiah(item.total_cost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {item.units_produced.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                      {formatRupiah(item.cost_per_unit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.cost_per_unit < 300 ? 'bg-green-100 text-green-800' :
                        item.cost_per_unit < 400 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.cost_per_unit < 300 ? 'Excellent' :
                         item.cost_per_unit < 400 ? 'Good' : 'Needs Improvement'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">TOTALS</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    {formatRupiah(breakdown.materials.amount)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    {formatRupiah(breakdown.labor.amount)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    {formatRupiah(breakdown.overhead.amount)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    {formatRupiah(getTotalCosts())}
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                    {getTotalUnits().toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-blue-600">
                    {formatRupiah(getAverageCostPerUnit())}
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
          <h3 className="text-lg font-semibold mb-4">Cost per Unit by Department</h3>
          <div className="space-y-4">
            {costAnalysis.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center">
                    <span className="text-xl mr-2">{getCostCenterIcon(item.cost_center)}</span>
                    {item.cost_center}
                  </span>
                  <span className="text-gray-500">
                    {formatRupiah(item.cost_per_unit)} per unit
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6 relative">
                  <div
                    className={`h-6 rounded-full ${
                      item.cost_per_unit < 300 ? 'bg-green-500' :
                      item.cost_per_unit < 400 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(item.cost_per_unit / 500) * 100}%` }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                    {item.units_produced} units
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {costAnalysis.length === 0 && !loading && (
        <div className="text-center py-12">
          <ChartPieIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No cost analysis data found</h3>
          <p className="mt-1 text-sm text-gray-500">Cost data will appear here once production starts</p>
        </div>
      )}
    </div>
  )
}

export default CostingControlling
