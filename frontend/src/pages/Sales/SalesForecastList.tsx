import React, { useState } from 'react'
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGetSalesForecastsQuery, useDeleteSalesForecastMutation } from '../../services/api'
import toast from 'react-hot-toast'
import {
  CalendarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon
,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
export default function SalesForecastList() {
    const { t } = useLanguage();

const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  const { data: forecastsData, isLoading, refetch } = useGetSalesForecastsQuery({
    page,
    search,
    status: statusFilter || undefined
  })
  
  const [deleteForecast] = useDeleteSalesForecastMutation()

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this forecast?')) {
      try {
        await deleteForecast(id).unwrap()
        toast.success('Forecast deleted successfully')
        refetch()
      } catch (error) {
        toast.error('Failed to delete forecast')
      }
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      'draft': 'badge-gray',
      'submitted': 'badge-yellow',
      'approved': 'badge-green',
      'closed': 'badge-blue'
    }
    return badges[status] || 'badge-gray'
  }

  const getConfidenceBadge = (confidence: string) => {
    const badges: Record<string, string> = {
      'high': 'badge-green',
      'medium': 'badge-yellow',
      'low': 'badge-red'
    }
    return badges[confidence] || 'badge-gray'
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Forecasts</h1>
          <p className="text-gray-600">Manage sales forecasts and predictions</p>
        </div>
        <Link
          to="/app/sales/forecasts/new"
          className="btn-primary inline-flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          New Forecast
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.search')}</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search forecasts..."
              className="input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.status')}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearch('')
                setStatusFilter('')
                setPage(1)
                refetch()
              }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Forecasts</p>
              <p className="text-2xl font-bold text-gray-900">
                {forecastsData?.total || 0}
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="card p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {forecastsData?.forecasts?.filter((f: any) => f.status === 'approved').length || 0}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="card p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {forecastsData?.forecasts?.filter((f: any) => f.status === 'submitted').length || 0}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="card p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {forecastsData?.forecasts?.reduce((sum: number, f: any) => sum + (f.most_likely || 0), 0).toLocaleString() || 0}
              </p>
            </div>
            <CalendarIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Forecasts Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product/Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {forecastsData?.forecasts?.map((forecast: any) => (
                <tr key={forecast.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {forecast.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {forecast.forecast_number}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">
                        {forecast.product_name || 'All Products'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {forecast.customer_name || 'All Customers'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className={`badge ${forecast.forecast_type === 'monthly' ? 'badge-blue' : 
                        forecast.forecast_type === 'quarterly' ? 'badge-purple' : 'badge-green'}`}>
                        {forecast.forecast_type}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(forecast.period_start).toLocaleDateString()} - {new Date(forecast.period_end).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-gray-900 font-medium">
                        Most Likely: {forecast.most_likely?.toLocaleString()}
                      </div>
                      <div className="text-gray-500 text-xs">
                        Best: {forecast.best_case?.toLocaleString()} | Worst: {forecast.worst_case?.toLocaleString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getConfidenceBadge(forecast.confidence_level)}`}>
                      {forecast.confidence_level || 'medium'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getStatusBadge(forecast.status)}`}>
                      {forecast.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/app/sales/forecasts/${forecast.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/app/sales/forecasts/${forecast.id}/edit`}
                        className="text-gray-600 hover:text-gray-900"
                        title={t('common.edit')}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(forecast.id)}
                        className="text-red-600 hover:text-red-900"
                        title={t('common.delete')}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {forecastsData?.pages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {page} of {forecastsData.pages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn-secondary disabled:opacity-50"
                >
                </button>
                <button
                  onClick={() => setPage(Math.min(forecastsData.pages, page + 1))}
                  disabled={page === forecastsData.pages}
                  className="btn-secondary disabled:opacity-50"
                >
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!isLoading && (!forecastsData?.forecasts || forecastsData.forecasts.length === 0) && (
        <div className="card p-12 text-center">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No forecasts found</h3>
          <p className="text-gray-600 mb-4">
            {search || statusFilter ? 'Try adjusting your filters' : 'Get started by creating your first sales forecast'}
          </p>
          <Link
            to="/app/sales/forecasts/new"
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Create Forecast
          </Link>
        </div>
      )}
    </div>
  )
}
