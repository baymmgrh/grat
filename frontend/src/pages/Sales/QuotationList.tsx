import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  BanknotesIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CheckCircleIcon
,
  ClockIcon,
  DocumentTextIcon,
  EyeIcon,
  FunnelIcon,
  InformationCircleIcon as StatusIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react'
import axiosInstance from '../../utils/axiosConfig'
import LoadingSpinner from '../../components/Common/LoadingSpinner'
interface Quotation {
  id: number
  quotation_number: string
  customer_id: number
  customer_name: string
  customer_company: string
  issue_date: string
  expiry_date: string
  status: string
  total_amount: number
  items_count: number
  notes?: string
  created_by_name?: string
  created_at: string
}

const QuotationList = () => {
    const { t } = useLanguage();

const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    date_from: '',
    date_to: ''
  })

  useEffect(() => {
    loadQuotations()
  }, [currentPage, filters])

  const loadQuotations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20',
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to })
      })

      const response = await axiosInstance.get(`/api/sales/quotations?${params}`)
      setQuotations(response.data.quotations || [])
      setTotalPages(response.data.pages || 1)
    } catch (error) {
      console.error('Error loading quotations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({ search: '', status: '', date_from: '', date_to: '' })
    setCurrentPage(1)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-orange-100 text-orange-800'
      case 'converted': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return ClockIcon
      case 'sent': return ArrowTopRightOnSquareIcon
      case 'accepted': return CheckCircleIcon
      case 'rejected': return XCircleIcon
      case 'expired': return CalendarIcon
      case 'converted': return DocumentDuplicateIcon
      default: return ClockIcon
    }
  }

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7 && diffDays > 0
  }

  const handleConvertToOrder = async (quotationId: number) => {
    try {
      const response = await axiosInstance.post(`/api/sales/quotations/${quotationId}/convert`)
      alert('Quotation converted to sales order successfully!')
      loadQuotations()
    } catch (error) {
      console.error('Error converting quotation:', error)
      alert('Failed to convert quotation')
    }
  }

  if (loading && quotations.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💼 Quotations</h1>
          <p className="text-gray-600 mt-1">Manage sales quotations and proposals</p>
        </div>
        <div className="flex gap-3">
          <Link to="/app/sales/quotations/new" className="btn-primary inline-flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            New Quotation
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Quotations</p>
              <p className="text-2xl font-bold text-gray-900">{quotations.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 p-3 rounded-lg">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {quotations.filter(q => q.status === 'sent').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Accepted</p>
              <p className="text-2xl font-bold text-gray-900">
                {quotations.filter(q => q.status === 'accepted').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 p-3 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                Rp {quotations.reduce((sum, q) => sum + q.total_amount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('common.search')}</label>
            <div className="relative mt-1">
              <input
                type="text"
                placeholder="Quotation number, customer..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input pl-10"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('common.status')}</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input mt-1"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
              <option value="converted">Converted</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Date From</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="input mt-1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Date To</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="input mt-1"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Quotation Database</h3>
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
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items & Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quotations.map((quotation) => {
                const StatusIcon = getStatusIcon(quotation.status)
                const expiringSoon = isExpiringSoon(quotation.expiry_date)
                
                return (
                  <tr key={quotation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                          <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{quotation.quotation_number}</div>
                          {quotation.created_by_name && (
                            <div className="text-xs text-gray-500">by {quotation.created_by_name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{quotation.customer_company}</div>
                          {quotation.customer_name && (
                            <div className="text-xs text-gray-500 flex items-center">
                              <UserIcon className="h-3 w-3 mr-1" />
                              {quotation.customer_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span>Issued: {new Date(quotation.issue_date).toLocaleDateString()}</span>
                        </div>
                        <div className={`flex items-center mt-1 ${expiringSoon ? 'text-orange-600' : ''}`}>
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span>Expires: {new Date(quotation.expiry_date).toLocaleDateString()}</span>
                          {expiringSoon && <span className="ml-1 text-xs">⚠️</span>}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">Rp {quotation.total_amount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{quotation.items_count} items</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quotation.status)}`}>
                        <StatusIcon className="h-3 w-3" />
                        {quotation.status}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Link
                          to={`/app/sales/quotations/${quotation.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/app/sales/quotations/${quotation.id}/edit`}
                          className="text-green-600 hover:text-green-900"
                        >{t('common.edit')}</Link>
                        {quotation.status === 'accepted' && (
                          <button
                            onClick={() => handleConvertToOrder(quotation.id)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                          </button>
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
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50"
              >
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn-secondary disabled:opacity-50"
              >
              </button>
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {quotations.length === 0 && !loading && (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No quotations found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first quotation
            </p>
            <div className="mt-6">
              <Link to="/app/sales/quotations/new" className="btn-primary">
                <PlusIcon className="h-5 w-5 mr-2" />
                New Quotation
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card p-4 bg-blue-50 border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">💡 Quick Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Quotations expiring within 7 days are highlighted with ⚠️</li>
          <li>• Convert accepted quotations to sales orders directly</li>
          <li>• Use filters to quickly find specific quotations</li>
          <li>• Track quotation performance in the dashboard</li>
        </ul>
      </div>
    </div>
  )
}

export default QuotationList
