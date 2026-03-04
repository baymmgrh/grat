import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGetQuotesQuery } from '../../services/api';
import { format } from 'date-fns';
import {
  BanknotesIcon,
  EyeIcon,
  FunnelIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export default function QuoteList() {
    const { t } = useLanguage();

    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [supplierId, setSupplierId] = useState('')
    const [page, setPage] = useState(1)
  
  const { data, isLoading, refetch } = useGetQuotesQuery({
    search,
    status,
    supplier_id: supplierId,
    page
  })

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; label: string }> = {
      draft: { class: 'bg-gray-100 text-gray-800', label: 'Draft' },
      submitted: { class: 'bg-blue-100 text-blue-800', label: 'Submitted' },
      accepted: { class: 'bg-green-100 text-green-800', label: 'Accepted' },
      rejected: { class: 'bg-red-100 text-red-800', label: 'Rejected' },
      expired: { class: 'bg-orange-100 text-orange-800', label: 'Expired' }
    }
    return badges[status] || { class: 'bg-gray-100 text-gray-800', label: status }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    refetch()
  }

  const isExpired = (validUntil: string) => {
    if (!validUntil) return false
    return new Date(validUntil) < new Date()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Quotes</h1>
          <p className="text-gray-600">Manage supplier quotations and pricing</p>
        </div>
        <Link
          to="/app/purchasing/quotes/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Create Quote
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.search')}</label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search quote number, supplier..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.status')}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            </label>
            <input
              type="text"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              placeholder="Supplier ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FunnelIcon className="h-5 w-5" />{t('common.filter')}</button>
          </div>
        </form>
      </div>

      {/* Quotes Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading quotes...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Quotes ({data?.total || 0})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quote Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.quotes?.map((quote: any) => {
                  const statusBadge = getStatusBadge(quote.status)
                  const expired = isExpired(quote.valid_until)
                  
                  return (
                    <tr key={quote.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {quote.quote_number}
                          </div>
                          {quote.rfq_number && (
                            <div className="text-sm text-gray-500">
                              RFQ: {quote.rfq_number}
                            </div>
                          )}
                          {expired && (
                            <div className="text-xs text-red-600 mt-1">
                              ⚠️ Expired
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{quote.supplier_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            Quote: {format(new Date(quote.quote_date), 'dd MMM yyyy')}
                          </div>
                          {quote.valid_until && (
                            <div className={`text-sm ${expired ? 'text-red-500' : 'text-gray-500'}`}>
                              Valid until: {format(new Date(quote.valid_until), 'dd MMM yyyy')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {quote.currency} {quote.total_amount?.toLocaleString() || '0'}
                          </div>
                          {quote.lead_time_days && (
                            <div className="text-sm text-gray-500">
                              Lead time: {quote.lead_time_days} days
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.class}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/app/purchasing/quotes/${quote.id}`}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                          
                          {quote.status === 'draft' && (
                            <Link
                              to={`/app/purchasing/quotes/${quote.id}/edit`}
                              className="text-indigo-600 hover:text-indigo-900 p-1"
                              title={t('common.edit')}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {data?.pages && data.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {data.current_page} of {data.pages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= data.pages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!data?.quotes || data.quotes.length === 0) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No quotes</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first quote.</p>
          <div className="mt-6">
            <Link
              to="/app/purchasing/quotes/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Create Quote
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
