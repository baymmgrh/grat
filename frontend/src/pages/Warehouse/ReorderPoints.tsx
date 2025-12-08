import React, { useState } from 'react'
import { useGetReorderPointsQuery } from '../../services/api'
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
export default function ReorderPoints() {
    const { t } = useLanguage();

const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('days_until_stockout')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const { data: reorderData, isLoading } = useGetReorderPointsQuery({ 
    status: statusFilter 
  })

  const reorderPoints = reorderData?.reorder_points || []

  // Sort reorder points
  const sortedReorderPoints = [...reorderPoints].sort((a, b) => {
    const aValue = a[sortBy as keyof typeof a] as number
    const bValue = b[sortBy as keyof typeof b] as number
    
    // Handle null values for days_until_stockout
    if (sortBy === 'days_until_stockout') {
      if (aValue === null && bValue === null) return 0
      if (aValue === null) return sortOrder === 'desc' ? -1 : 1
      if (bValue === null) return sortOrder === 'desc' ? 1 : -1
    }
    
    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue
  })

  // FunnelIcon by status
  const filteredReorderPoints = sortedReorderPoints.filter(item => {
    if (statusFilter === 'below_reorder') return item.status === 'below_reorder'
    if (statusFilter === 'auto_enabled') return item.auto_reorder_enabled
    return true
  })

  // Statistics
  const stats = {
    total: reorderPoints.length,
    belowReorder: reorderPoints.filter(item => item.status === 'below_reorder').length,
    autoEnabled: reorderPoints.filter(item => item.auto_reorder_enabled).length,
    criticalStock: reorderPoints.filter(item => item.days_until_stockout !== null && item.days_until_stockout <= 7).length
  }

  // Chart data for stock levels
  const stockLevelData = filteredReorderPoints.slice(0, 10).map(item => ({
    product: item.product_name.substring(0, 15) + (item.product_name.length > 15 ? '...' : ''),
    current_stock: item.current_stock,
    reorder_point: item.reorder_point,
    safety_stock: item.safety_stock,
    maximum_stock: item.maximum_stock
  }))

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'below_reorder': return 'bg-red-100 text-red-800 border-red-200'
      case 'normal': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStockLevelColor = (currentStock: number, reorderPoint: number, safetyStock: number) => {
    if (currentStock <= safetyStock) return 'text-red-600'
    if (currentStock <= reorderPoint) return 'text-orange-600'
    return 'text-green-600'
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reorder Points Management</h1>
          <p className="text-gray-600">Smart inventory reorder points and stock level monitoring</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Products</option>
            <option value="below_reorder">Below Reorder Point</option>
            <option value="auto_enabled">Auto Reorder Enabled</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <CogIcon className="h-8 w-8 text-blue-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">With reorder points</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Below Reorder Point</p>
              <p className="text-2xl font-bold text-red-600">{stats.belowReorder}</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Need immediate attention</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Auto Reorder Enabled</p>
              <p className="text-2xl font-bold text-green-600">{stats.autoEnabled}</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Automated ordering</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Stock</p>
              <p className="text-2xl font-bold text-orange-600">{stats.criticalStock}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-orange-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">≤ 7 days until stockout</p>
        </div>
      </div>

      {/* Stock Level Visualization */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Levels vs Reorder Points</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stockLevelData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="product" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="maximum_stock" fill="#E5E7EB" name="Maximum Stock" />
              <Bar dataKey="current_stock" fill="#3B82F6" name="Current Stock" />
              <Bar dataKey="reorder_point" fill="#F59E0B" name="Reorder Point" />
              <Bar dataKey="safety_stock" fill="#EF4444" name="Safety Stock" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Reorder Points Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Reorder Points Details</h3>
          <div className="text-sm text-gray-500">
            {filteredReorderPoints.length} of {reorderPoints.length} products
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('production.product')}</th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('current_stock')}
                >
                  <div className="flex items-center">
                    Current Stock
                    {sortBy === 'current_stock' && (
                      sortOrder === 'desc' ? <ArrowDownIcon className="h-4 w-4 ml-1" /> : <ArrowUpIcon className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('reorder_point')}
                >
                  <div className="flex items-center">
                    Reorder Point
                    {sortBy === 'reorder_point' && (
                      sortOrder === 'desc' ? <ArrowDownIcon className="h-4 w-4 ml-1" /> : <ArrowUpIcon className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reorder Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Safety Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Time
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('average_daily_demand')}
                >
                  <div className="flex items-center">
                    Daily Demand
                    {sortBy === 'average_daily_demand' && (
                      sortOrder === 'desc' ? <ArrowDownIcon className="h-4 w-4 ml-1" /> : <ArrowUpIcon className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('days_until_stockout')}
                >
                  <div className="flex items-center">
                    Days to Stockout
                    {sortBy === 'days_until_stockout' && (
                      sortOrder === 'desc' ? <ArrowDownIcon className="h-4 w-4 ml-1" /> : <ArrowUpIcon className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Auto Reorder
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReorderPoints.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    <CogIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>No reorder points configured</p>
                    <p className="text-sm">Configure reorder points to enable smart inventory management</p>
                  </td>
                </tr>
              ) : (
                filteredReorderPoints.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`font-medium ${getStockLevelColor(item.current_stock, item.reorder_point, item.safety_stock)}`}>
                        {item.current_stock.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.reorder_point.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.reorder_quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.safety_stock.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.lead_time_days} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.average_daily_demand.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.days_until_stockout !== null ? (
                        <span className={`font-medium ${item.days_until_stockout <= 7 ? 'text-red-600' : item.days_until_stockout <= 14 ? 'text-orange-600' : 'text-green-600'}`}>
                          {item.days_until_stockout} days
                        </span>
                      ) : (
                        <span className="text-gray-400">∞</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                        {item.status === 'below_reorder' ? 'Below Reorder' : 'Normal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.auto_reorder_enabled ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reorder Point Guidelines */}
      <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
        <h4 className="text-lg font-semibold text-yellow-900 mb-3">Reorder Point Guidelines</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-yellow-800 mb-2">Calculation Formula</h5>
            <p className="text-yellow-700">
              <strong>Reorder Point = (Average Daily Demand × Lead Time) + Safety Stock</strong>
            </p>
            <ul className="text-yellow-700 mt-2 space-y-1">
              <li>• Safety Stock covers demand variability</li>
              <li>• Lead Time includes supplier delivery time</li>
              <li>• Service Level determines safety stock amount</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-yellow-800 mb-2">Best Practices</h5>
            <ul className="text-yellow-700 space-y-1">
              <li>• Review reorder points monthly</li>
              <li>• Adjust for seasonal demand patterns</li>
              <li>• Monitor supplier lead time changes</li>
              <li>• Use ABC analysis for prioritization</li>
              <li>• Enable auto-reorder for critical items</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
