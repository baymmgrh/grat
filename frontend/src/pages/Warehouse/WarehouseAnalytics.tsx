import React, { useState } from 'react'
import { useGetWarehouseAnalyticsQuery } from '../../services/api'
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ClockIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
export default function WarehouseAnalytics() {
    const { t } = useLanguage();

const [period, setPeriod] = useState('monthly')
  const [warehouseId, setWarehouseId] = useState<number | undefined>()

  const { data: analyticsData, isLoading } = useGetWarehouseAnalyticsQuery({ 
    period, 
    warehouse_id: warehouseId 
  })

  const analytics = analyticsData?.analytics || []
  const summary = analyticsData?.summary || {}

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') {
      return <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
    } else if (trend === 'declining') {
      return <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />
    }
    return <div className="h-5 w-5 bg-gray-300 rounded-full"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Warehouse Analytics</h1>
          <p className="text-gray-600">Advanced inventory analytics and performance metrics</p>
        </div>
        <div className="flex space-x-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inventory Turnover</p>
              <p className="text-2xl font-bold text-blue-600">
                {summary.current_turnover ? `${summary.current_turnover}x` : 'No Data'}
              </p>
            </div>
            {getTrendIcon('improving')}
          </div>
          <p className="text-sm text-gray-500 mt-2">Current period</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Storage Utilization</p>
              <p className="text-2xl font-bold text-green-600">
                {summary.current_utilization ? `${summary.current_utilization}%` : 'No Data'}
              </p>
            </div>
            <CubeIcon className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Average: {summary.avg_utilization?.toFixed(1) || 0}%</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Days of Supply</p>
              <p className="text-2xl font-bold text-purple-600">
                {summary.current_days_supply ? `${summary.current_days_supply}` : 'No Data'}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-purple-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Current inventory level</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stockout Incidents</p>
              <p className="text-2xl font-bold text-red-600">
                {summary.total_stockouts || 0}
              </p>
            </div>
            {getTrendIcon('declining')}
          </div>
          <p className="text-sm text-gray-500 mt-2">This period</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Turnover Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Turnover Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value}x`, 'Turnover']} />
                <Area 
                  type="monotone" 
                  dataKey="inventory_turnover" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Storage Utilization */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Utilization</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value: number) => [`${value}%`, 'Utilization']} />
                <Line 
                  type="monotone" 
                  dataKey="storage_utilization" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Value Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Value Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`} />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']} />
                <Area 
                  type="monotone" 
                  dataKey="total_value" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6" 
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Count Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Count Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_products" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stockout Analysis */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stockout Incidents</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="stockout_incidents" fill="#EF4444" name="Stockouts" />
                <Bar dataKey="overstock_incidents" fill="#F59E0B" name="Overstocks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expired Products */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expired Products</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => [value, t('navigation.products')]} />
                <Area 
                  type="monotone" 
                  dataKey="expired_products" 
                  stroke="#DC2626" 
                  fill="#DC2626" 
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Metrics Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analytics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.date')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('navigation.products')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Supply
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>No analytics data available</p>
                    <p className="text-sm">Data will appear here once warehouse operations are recorded</p>
                  </td>
                </tr>
              ) : (
                analytics.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.total_products || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${(item.total_value || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`font-medium ${item.inventory_turnover >= 4 ? 'text-green-600' : item.inventory_turnover >= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {item.inventory_turnover || 0}x
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`font-medium ${item.storage_utilization >= 80 ? 'text-red-600' : item.storage_utilization >= 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {item.storage_utilization || 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.days_of_supply || 0} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-2">
                        {item.stockout_incidents > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {item.stockout_incidents} stockouts
                          </span>
                        )}
                        {item.overstock_incidents > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {item.overstock_incidents} overstocks
                          </span>
                        )}
                        {item.expired_products > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {item.expired_products} expired
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
