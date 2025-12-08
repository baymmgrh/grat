import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO } from 'date-fns'
import {
  ArrowLeftIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ClockIcon,
  CogIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { useGetMachineAnalyticsQuery } from '../../services/api'
export default function MachineAnalytics() {
    const { t } = useLanguage();

const { machineId } = useParams<{ machineId: string }>()
  const navigate = useNavigate()
  
  const [period, setPeriod] = useState('monthly')
  const [months, setMonths] = useState(6)
  
  const { data, isLoading, error } = useGetMachineAnalyticsQuery({
    machineId: Number(machineId),
    period,
    months
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Machine not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The machine analytics you're looking for doesn't exist or has been deleted.
          </p>
          <div className="mt-6">
            <Link to="/app/oee" className="btn-primary">
              Back to OEE Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const machine = data.machine
  const trends = data.trends
  const analytics = data.analytics || []
  const maintenanceImpacts = data.maintenance_impacts || []
  const recentRecords = data.recent_records || []

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
    if (value < 0) return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
    return <div className="h-4 w-4" />
  }

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/oee')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{machine.name} Analytics</h1>
            <p className="text-gray-600">{machine.code} - {machine.type}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <select
            className="input"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <select
            className="input"
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        </div>
      </div>

      {/* Machine Status Card */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <CogIcon className="h-8 w-8 text-blue-500" />
            <div>
              <div className="text-sm text-gray-500">{t('common.status')}</div>
              <div className={`text-lg font-semibold ${
                machine.status === 'running' ? 'text-green-600' :
                machine.status === 'maintenance' ? 'text-yellow-600' :
                machine.status === 'breakdown' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {machine.status}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ChartBarIcon className="h-8 w-8 text-purple-500" />
            <div>
              <div className="text-sm text-gray-500">Capacity/Hour</div>
              <div className="text-lg font-semibold text-gray-900">
                {machine.capacity_per_hour ? `${machine.capacity_per_hour} units` : 'N/A'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <WrenchScrewdriverIcon className="h-8 w-8 text-orange-500" />
            <div>
              <div className="text-sm text-gray-500">Last Maintenance</div>
              <div className="text-lg font-semibold text-gray-900">
                {machine.last_maintenance ? format(parseISO(machine.last_maintenance), 'MMM dd, yyyy') : 'Never'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ClockIcon className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-sm text-gray-500">Next Maintenance</div>
              <div className="text-lg font-semibold text-gray-900">
                {machine.next_maintenance ? format(parseISO(machine.next_maintenance), 'MMM dd, yyyy') : 'Not scheduled'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">OEE Trend</h3>
              <div className="flex items-center gap-2 mt-1">
                {getTrendIcon(trends.oee_trend)}
                <span className={`text-2xl font-bold ${getTrendColor(trends.oee_trend)}`}>
                  {trends.oee_trend > 0 ? '+' : ''}{trends.oee_trend.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Availability Trend</h3>
              <div className="flex items-center gap-2 mt-1">
                {getTrendIcon(trends.availability_trend)}
                <span className={`text-2xl font-bold ${getTrendColor(trends.availability_trend)}`}>
                  {trends.availability_trend > 0 ? '+' : ''}{trends.availability_trend.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Performance Trend</h3>
              <div className="flex items-center gap-2 mt-1">
                {getTrendIcon(trends.performance_trend)}
                <span className={`text-2xl font-bold ${getTrendColor(trends.performance_trend)}`}>
                  {trends.performance_trend > 0 ? '+' : ''}{trends.performance_trend.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Quality Trend</h3>
              <div className="flex items-center gap-2 mt-1">
                {getTrendIcon(trends.quality_trend)}
                <span className={`text-2xl font-bold ${getTrendColor(trends.quality_trend)}`}>
                  {trends.quality_trend > 0 ? '+' : ''}{trends.quality_trend.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OEE Metrics Over Time */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">OEE Metrics Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                labelFormatter={(value) => format(parseISO(value as string), 'MMM dd, yyyy')}
                formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
              />
              <Line type="monotone" dataKey="avg_oee" stroke="#3B82F6" strokeWidth={2} name="OEE" />
              <Line type="monotone" dataKey="avg_availability" stroke="#10B981" strokeWidth={2} name="Availability" />
              <Line type="monotone" dataKey="avg_performance" stroke="#F59E0B" strokeWidth={2} name="Performance" />
              <Line type="monotone" dataKey="avg_quality" stroke="#8B5CF6" strokeWidth={2} name={t('navigation.quality')} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Production vs Downtime */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Production vs Downtime Hours</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => format(parseISO(value as string), 'MMM dd, yyyy')}
                formatter={(value: number, name: string) => [`${value.toFixed(1)}h`, name]}
              />
              <Bar dataKey="total_production_hours" fill="#10B981" name="Production Hours" />
              <Bar dataKey="total_downtime_hours" fill="#EF4444" name="Downtime Hours" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Maintenance Impact Analysis */}
      {maintenanceImpacts.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Impact Analysis</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.date')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Planned Downtime
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual Downtime
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Production Loss
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    OEE Before
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    OEE After
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {maintenanceImpacts.map((impact: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(parseISO(impact.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {impact.planned_downtime.toFixed(1)}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {impact.actual_downtime.toFixed(1)}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {impact.production_loss.toLocaleString()} units
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {impact.oee_before ? `${impact.oee_before.toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {impact.oee_after ? `${impact.oee_after.toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {impact.improvement ? (
                        <span className={`font-medium ${
                          impact.improvement > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {impact.improvement > 0 ? '+' : ''}{impact.improvement.toFixed(1)}%
                        </span>
                      ) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent OEE Records */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent OEE Records</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.date')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('production.shift')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('navigation.quality')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('navigation.production')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentRecords.map((record: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(parseISO(record.date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.shift || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      record.oee >= 85 ? 'text-green-600' :
                      record.oee >= 70 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {record.oee.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.availability.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.performance.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.quality.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.total_pieces.toLocaleString()} / {record.good_pieces.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
