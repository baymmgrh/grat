import React, { useState } from 'react'
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  BuildingStorefrontIcon,
  ChartBarIcon,
  ClockIcon,
  Cog6ToothIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import {
  useGetWarehouseDashboardQuery,
  useGetWarehouseAlertsQuery,
  useAcknowledgeWarehouseAlertMutation,
  useResolveWarehouseAlertMutation,
  useGetWarehouseZonesQuery,
  useGetWarehouseLocationsQuery,
  useGetInventoryQuery
} from '../../services/api';
export default function WarehouseDashboardEnhanced() {
    const { t } = useLanguage();

const [alertFilter, setAlertFilter] = useState('active')
  
  const { data: dashboardData, isLoading: dashboardLoading } = useGetWarehouseDashboardQuery()
  const { data: alertsData, isLoading: alertsLoading } = useGetWarehouseAlertsQuery({ status: alertFilter })
  
  // Traditional warehouse data
  const { data: zonesData } = useGetWarehouseZonesQuery({})
  const { data: locationsData } = useGetWarehouseLocationsQuery({})
  const { data: inventoryData } = useGetInventoryQuery({})
  
  const [acknowledgeAlert] = useAcknowledgeWarehouseAlertMutation()
  const [resolveAlert] = useResolveWarehouseAlertMutation()

  const summary = dashboardData?.summary || {}
  const movements = dashboardData?.movements || {}
  const abcAnalysis = dashboardData?.abc_analysis || {}
  const recentMovements = dashboardData?.recent_movements || []
  const topProducts = dashboardData?.top_products || []
  const alerts = alertsData?.alerts || []

  // Traditional warehouse data
  const zones = zonesData?.zones || []
  const locations = locationsData?.locations || []
  const inventory = inventoryData?.inventory || []

  const handleAcknowledgeAlert = async (alertId: number) => {
    try {
      await acknowledgeAlert(alertId).unwrap()
    } catch (error) {
      console.error('Failed to acknowledge alert:', error)
    }
  }

  const handleResolveAlert = async (alertId: number, notes: string) => {
    try {
      await resolveAlert({ alertId, resolution_notes: notes }).unwrap()
    } catch (error) {
      console.error('Failed to resolve alert:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'receive': return '#10B981'
      case 'issue': return '#EF4444'
      case 'transfer': return '#3B82F6'
      case 'adjust': return '#F59E0B'
      default: return '#6B7280'
    }
  }

  // Chart data preparation
  const movementChartData = [
    { name: 'Receipts', value: movements?.receipts || 0, color: '#10B981' },
    { name: 'Issues', value: movements?.issues || 0, color: '#EF4444' },
    { name: 'Transfers', value: movements?.transfers || 0, color: '#3B82F6' },
    { name: 'Adjustments', value: movements?.adjustments || 0, color: '#F59E0B' }
  ]

  const abcChartData = [
    { name: 'Category A', count: abcAnalysis.A?.count || 0, value: abcAnalysis.A?.value || 0, color: '#EF4444' },
    { name: 'Category B', count: abcAnalysis.B?.count || 0, value: abcAnalysis.B?.value || 0, color: '#F59E0B' },
    { name: 'Category C', count: abcAnalysis.C?.count || 0, value: abcAnalysis.C?.value || 0, color: '#10B981' }
  ]

  if (dashboardLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Warehouse Dashboard</h1>
          <p className="text-gray-600">Advanced inventory analytics and optimization</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/app/warehouse/inventory"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <CubeIcon className="h-5 w-5 mr-2" />
            Inventori
          </Link>
          <Link
            to="/app/warehouse/inventory/add-product"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
          >
            <CubeIcon className="h-5 w-5 mr-2" />
            Tambah Produk
          </Link>
          <Link
            to="/app/warehouse/stock-input"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
          >
            <BuildingStorefrontIcon className="h-5 w-5 mr-2" />
            Input Material
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-blue-600">{summary.total_products || 0}</p>
            </div>
            <CubeIcon className="h-8 w-8 text-blue-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Across all locations</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-green-600">
                ${(summary.total_value || 0).toLocaleString()}
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Inventory valuation</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Storage Utilization</p>
              <p className="text-2xl font-bold text-purple-600">
                {summary.location_utilization || 0}%
              </p>
            </div>
            <BuildingStorefrontIcon className="h-8 w-8 text-purple-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Location capacity used</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-red-600">{summary.active_alerts || 0}</p>
              {summary.critical_alerts > 0 && (
                <p className="text-sm text-red-500">{summary.critical_alerts} critical</p>
              )}
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Require attention</p>
        </div>
      </div>

      {/* KeyIcon Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Low Stock Items</h3>
            <ExclamationTriangleIcon className="h-6 w-6 text-orange-500" />
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-600">{summary.low_stock_items || 0}</p>
            <p className="text-sm text-gray-500">Below reorder point</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Expiring Soon</h3>
            <ClockIcon className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{summary.expiring_soon || 0}</p>
            <p className="text-sm text-gray-500">Next 30 days</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Locations</h3>
            <BuildingStorefrontIcon className="h-6 w-6 text-blue-500" />
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {summary.total_locations || locations.length || 0}
            </p>
            <p className="text-sm text-gray-500">
              {locations.filter(l => l.is_available !== false).length} available
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movement Analysis */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Movements (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={movementChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {movementChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value.toLocaleString(), t('common.quantity')]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ABC Analysis */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ABC Analysis</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={abcChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => [value.toLocaleString(), '']} />
                <Bar dataKey="count" fill="#3B82F6" name="Product Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Warehouse Management Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Warehouse Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Zones Management */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Zones</h4>
              <Link to="/app/warehouse/zones" className="text-blue-600 hover:text-blue-800 text-sm">
              </Link>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Zones:</span>
                <span className="font-medium">{zones.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active:</span>
                <span className="font-medium text-green-600">
                  {zones.filter(z => z.is_active !== false).length}
                </span>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {zones.slice(0, 3).map((zone, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-gray-500 truncate">{zone.name}</span>
                  <span className="text-gray-400">{zone.material_type}</span>
                </div>
              ))}
              {zones.length > 3 && (
                <div className="text-xs text-gray-400">+{zones.length - 3} more</div>
              )}
            </div>
          </div>

          {/* Locations Management */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Locations</h4>
              <Link to="/app/warehouse/locations" className="text-blue-600 hover:text-blue-800 text-sm">
              </Link>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Locations:</span>
                <span className="font-medium">{locations.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available:</span>
                <span className="font-medium text-green-600">
                  {locations.filter(l => l.is_available !== false).length}
                </span>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {locations.slice(0, 3).map((location, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-gray-500 truncate">{location.location_code}</span>
                  <span className="text-gray-400">
                    {location.occupied || 0}/{location.capacity || 0}
                  </span>
                </div>
              ))}
              {locations.length > 3 && (
                <div className="text-xs text-gray-400">+{locations.length - 3} more</div>
              )}
            </div>
          </div>

          {/* Inventory Management */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Inventory</h4>
              <Link to="/app/warehouse/inventory" className="text-blue-600 hover:text-blue-800 text-sm">
              </Link>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">SKUs:</span>
                <span className="font-medium">{inventory.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Low Stock:</span>
                <span className="font-medium text-orange-600">
                  {inventory.filter(i => (i.available_quantity || 0) < 10).length}
                </span>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {inventory.slice(0, 3).map((item, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-gray-500 truncate">
                    {item.product?.name || `Product ${item.product_id}`}
                  </span>
                  <span className="text-gray-400">{item.quantity || 0}</span>
                </div>
              ))}
              {inventory.length > 3 && (
                <div className="text-xs text-gray-400">+{inventory.length - 3} more</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Movements */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Movements</h3>
            <Link to="/app/warehouse/movements" className="text-blue-600 hover:text-blue-800 text-sm">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentMovements.slice(0, 5).map((movement, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: getMovementTypeColor(movement.type) }}
                  ></div>
                  <div>
                    <p className="font-medium text-gray-900">{movement.product}</p>
                    <p className="text-sm text-gray-500">
                      {movement.type} • {movement.quantity} units • {movement.location}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(movement.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
            <Link to="/app/warehouse/alerts" className="text-blue-600 hover:text-blue-800 text-sm">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm mt-1">{alert.message}</p>
                    {alert.product_name && (
                      <p className="text-xs mt-1">Product: {alert.product_name}</p>
                    )}
                  </div>
                  <div className="flex space-x-1 ml-2">
                    {alert.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                          title="Acknowledge"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleResolveAlert(alert.id, 'Resolved from dashboard')}
                          className="text-green-600 hover:text-green-800 text-xs"
                          title="Resolve"
                        >
                          ✓
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products by Value */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products by Value</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('production.product')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.quantity')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topProducts.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.quantity.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${product.value.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {summary.total_value > 0 ? ((product.value / summary.total_value) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Enhanced Features */}
          <Link
            to="/app/warehouse/analytics"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <ChartBarIcon className="h-8 w-8 text-blue-500 mb-2" />
            <span className="text-sm font-medium">Analytics</span>
          </Link>
          <Link
            to="/app/warehouse/abc-analysis"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <CubeIcon className="h-8 w-8 text-green-500 mb-2" />
            <span className="text-sm font-medium">ABC Analysis</span>
          </Link>
          <Link
            to="/app/warehouse/reorder-points"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <ExclamationTriangleIcon className="h-8 w-8 text-orange-500 mb-2" />
            <span className="text-sm font-medium">Reorder Points</span>
          </Link>
          
          {/* Traditional Features */}
          <Link
            to="/app/warehouse/zones"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <BuildingStorefrontIcon className="h-8 w-8 text-purple-500 mb-2" />
            <span className="text-sm font-medium">Zones</span>
          </Link>
          <Link
            to="/app/warehouse/locations"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Cog6ToothIcon className="h-8 w-8 text-indigo-500 mb-2" />
            <span className="text-sm font-medium">Locations</span>
          </Link>
          <Link
            to="/app/warehouse/inventory"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <CubeIcon className="h-8 w-8 text-teal-500 mb-2" />
            <span className="text-sm font-medium">Inventory</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
