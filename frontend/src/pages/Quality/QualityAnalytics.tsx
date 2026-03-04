import React, { useState } from 'react';
import { useGetQualityAnalyticsQuery } from '../../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  ChartBarIcon,
  FunnelIcon

} from '@heroicons/react/24/outline';
export default function QualityAnalytics() {
  const [period, setPeriod] = useState('monthly');
  const [productId, setProductId] = useState<number | undefined>();

  const { data: analyticsData, isLoading } = useGetQualityAnalyticsQuery({ 
    period, 
    product_id: productId 
  });

  const analytics = analyticsData?.analytics || [];
  const summary = analyticsData?.summary || {};

  // Use real data from API or empty array if no data

  // Default data for charts when no real data available
  const defaultDefectData = analytics.length > 0 ? [] : [
    { name: 'No Data', value: 100, color: '#E5E7EB' }
  ];

  const defaultCostData = analytics.length > 0 ? analytics : [];

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') {
      return <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />;
    } else if (trend === 'declining') {
      return <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />;
    }
    return <div className="h-5 w-5 bg-gray-300 rounded-full"></div>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quality Analytics</h1>
          <p className="text-gray-600">Comprehensive quality metrics and trend analysis</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
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

          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={productId || ''}
              onChange={(e) => setProductId(e.target.value ? parseInt(e.target.value) : undefined)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Products</option>
              <option value="1">Product A</option>
              <option value="2">Product B</option>
              <option value="3">Product C</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Pass Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {summary.overall_pass_rate ? `${summary.overall_pass_rate}%` : 'No Data'}
              </p>
            </div>
            {summary.overall_pass_rate ? getTrendIcon('improving') : <div className="h-5 w-5 bg-gray-300 rounded-full"></div>}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {summary.overall_pass_rate ? '+2.3% from last period' : 'No data available'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Inspections</p>
              <p className="text-2xl font-bold text-blue-600">
                {summary.total_inspected || 0}
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-blue-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">This period</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Defect Rate</p>
              <p className="text-2xl font-bold text-red-600">
                {summary.defect_rate ? `${summary.defect_rate}%` : 'No Data'}
              </p>
            </div>
            {summary.defect_rate ? getTrendIcon('declining') : <div className="h-5 w-5 bg-gray-300 rounded-full"></div>}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {summary.defect_rate ? '-0.5% from last period' : 'No data available'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cost of Quality</p>
              <p className="text-2xl font-bold text-purple-600">
                {summary.cost_of_quality ? `$${summary.cost_of_quality}` : 'No Data'}
              </p>
            </div>
            {summary.cost_of_quality ? getTrendIcon('improving') : <div className="h-5 w-5 bg-gray-300 rounded-full"></div>}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {summary.cost_of_quality ? '-8.2% from last period' : 'No data available'}
          </p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pass Rate Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pass Rate Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[90, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value: number) => [`${value}%`, 'Pass Rate']} />
                <Area 
                  type="monotone" 
                  dataKey="pass_rate" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defect Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Defect Type Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={defaultDefectData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => analytics.length > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : 'No Data Available'}
                >
                  {defaultDefectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost of Quality */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost of Quality Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defaultCostData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value/1000}K`} />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                <Bar dataKey="prevention" stackId="a" fill="#10B981" name="Prevention" />
                <Bar dataKey="appraisal" stackId="a" fill="#3B82F6" name="Appraisal" />
                <Bar dataKey="internal_failure" stackId="a" fill="#F59E0B" name="Internal Failure" />
                <Bar dataKey="external_failure" stackId="a" fill="#EF4444" name="External Failure" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inspection Volume */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inspection Volume</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="inspections" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quality Metrics Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Quality Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pass Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  First Pass Yield
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Defect Density
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost of Quality
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>No quality metrics data available</p>
                    <p className="text-sm">Data will appear here once quality inspections are recorded</p>
                  </td>
                </tr>
              ) : (
                analytics.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.inspections || item.total_inspected || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`font-medium ${item.pass_rate >= 95 ? 'text-green-600' : item.pass_rate >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {item.pass_rate || item.overall_pass_rate || 0}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.first_pass_yield ? `${item.first_pass_yield}%` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.defect_density ? `${item.defect_density} DPM` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.cost_of_poor_quality ? `$${item.cost_of_poor_quality}` : '-'}
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
