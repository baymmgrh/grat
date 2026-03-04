import React, { useState } from 'react'
import { useGetABCAnalysisQuery } from '../../services/api'
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChartBarIcon,
  CubeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
export default function ABCAnalysis() {
    const { t } = useLanguage();

const [warehouseId, setWarehouseId] = useState<number | undefined>()
  const [sortBy, setSortBy] = useState('total_value')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { data: abcData, isLoading } = useGetABCAnalysisQuery({ 
    warehouse_id: warehouseId 
  })

  const classifications = abcData?.classifications || []

  // Sort classifications
  const sortedClassifications = [...classifications].sort((a, b) => {
    const aValue = a[sortBy as keyof typeof a] as number
    const bValue = b[sortBy as keyof typeof b] as number
    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue
  })

  // Group by ABC category
  const categoryGroups = {
    A: sortedClassifications.filter(item => item.abc_category === 'A'),
    B: sortedClassifications.filter(item => item.abc_category === 'B'),
    C: sortedClassifications.filter(item => item.abc_category === 'C')
  }

  // Summary statistics
  const categorySummary = [
    {
      category: 'A',
      count: categoryGroups.A.length,
      totalValue: categoryGroups.A.reduce((sum, item) => sum + item.total_value, 0),
      avgConsumption: categoryGroups.A.reduce((sum, item) => sum + item.average_monthly_consumption, 0) / (categoryGroups.A.length || 1),
      color: '#EF4444'
    },
    {
      category: 'B',
      count: categoryGroups.B.length,
      totalValue: categoryGroups.B.reduce((sum, item) => sum + item.total_value, 0),
      avgConsumption: categoryGroups.B.reduce((sum, item) => sum + item.average_monthly_consumption, 0) / (categoryGroups.B.length || 1),
      color: '#F59E0B'
    },
    {
      category: 'C',
      count: categoryGroups.C.length,
      totalValue: categoryGroups.C.reduce((sum, item) => sum + item.total_value, 0),
      avgConsumption: categoryGroups.C.reduce((sum, item) => sum + item.average_monthly_consumption, 0) / (categoryGroups.C.length || 1),
      color: '#10B981'
    }
  ]

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'A': return 'bg-red-100 text-red-800 border-red-200'
      case 'B': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'C': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getXYZColor = (category: string) => {
    switch (category) {
      case 'X': return 'bg-blue-100 text-blue-800'
      case 'Y': return 'bg-purple-100 text-purple-800'
      case 'Z': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
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
          <h1 className="text-3xl font-bold text-gray-900">ABC Analysis</h1>
          <p className="text-gray-600">Product classification based on value and consumption patterns</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <InformationCircleIcon className="h-5 w-5" />
            <span>A: High Value | B: Medium Value | C: Low Value</span>
          </div>
        </div>
      </div>

      {/* ABC Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categorySummary.map((category) => (
          <div key={category.category} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(category.category)}`}>
                Category {category.category}
              </div>
              <CubeIcon className="h-6 w-6 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Products:</span>
                <span className="font-medium">{category.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Value:</span>
                <span className="font-medium">${category.totalValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Consumption:</span>
                <span className="font-medium">{category.avgConsumption.toFixed(1)}/month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution by Count */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Distribution by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySummary}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="count"
                  label={({ category, count, percent }) => `${category}: ${count} (${(percent * 100).toFixed(0)}%)`}
                >
                  {categorySummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, t('navigation.products')]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution by Value */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Value Distribution by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySummary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`} />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total Value']} />
                <Bar dataKey="totalValue" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Consumption vs Value Scatter Plot */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Consumption vs Value Analysis</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={classifications}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="total_value" 
                name="Total Value"
                tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`}
              />
              <YAxis 
                dataKey="average_monthly_consumption" 
                name="Monthly Consumption"
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'Total Value' ? `$${value.toLocaleString()}` : value.toFixed(1),
                  name
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return `Product: ${payload[0].payload.product_name}`
                  }
                  return label
                }}
              />
              <Scatter 
                dataKey="total_value" 
                fill="#3B82F6"
                name={t('navigation.products')}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Classification Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Product Classifications</h3>
          <div className="text-sm text-gray-500">
            {classifications.length} products classified
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('production.product')}</th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('abc_category')}
                >
                  <div className="flex items-center">
                    ABC Category
                    {sortBy === 'abc_category' && (
                      sortOrder === 'desc' ? <ArrowDownIcon className="h-4 w-4 ml-1" /> : <ArrowUpIcon className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  XYZ Category
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('total_value')}
                >
                  <div className="flex items-center">
                    Total Value
                    {sortBy === 'total_value' && (
                      sortOrder === 'desc' ? <ArrowDownIcon className="h-4 w-4 ml-1" /> : <ArrowUpIcon className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('average_monthly_consumption')}
                >
                  <div className="flex items-center">
                    Monthly Consumption
                    {sortBy === 'average_monthly_consumption' && (
                      sortOrder === 'desc' ? <ArrowDownIcon className="h-4 w-4 ml-1" /> : <ArrowUpIcon className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reorder Point
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Safety Stock
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classifications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>No ABC analysis data available</p>
                    <p className="text-sm">Run ABC analysis to classify products by value and consumption</p>
                  </td>
                </tr>
              ) : (
                sortedClassifications.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(item.abc_category)}`}>
                        {item.abc_category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.xyz_category ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getXYZColor(item.xyz_category)}`}>
                          {item.xyz_category}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${item.total_value.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.average_monthly_consumption.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.recommended_reorder_point.toFixed(0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.recommended_max_stock.toFixed(0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.recommended_safety_stock.toFixed(0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ABC Analysis Guidelines */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h4 className="text-lg font-semibold text-blue-900 mb-3">ABC Analysis Guidelines</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-red-800 mb-2">Category A (High Value)</h5>
            <ul className="text-red-700 space-y-1">
              <li>• Tight inventory control</li>
              <li>• Frequent monitoring</li>
              <li>• Accurate demand forecasting</li>
              <li>• Lower safety stock</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-yellow-800 mb-2">Category B (Medium Value)</h5>
            <ul className="text-yellow-700 space-y-1">
              <li>• Moderate control</li>
              <li>• Regular monitoring</li>
              <li>• Standard forecasting</li>
              <li>• Moderate safety stock</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-green-800 mb-2">Category C (Low Value)</h5>
            <ul className="text-green-700 space-y-1">
              <li>• Simple control systems</li>
              <li>• Periodic monitoring</li>
              <li>• Basic forecasting</li>
              <li>• Higher safety stock</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
