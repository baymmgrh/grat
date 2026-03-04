import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatRupiah } from '../../utils/currencyUtils';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilIcon
,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react'
import axiosInstance from '../../utils/axiosConfig'
import LoadingSpinner from '../../components/Common/LoadingSpinner'
interface AccountPayable {
  id: number
  invoice_number: string
  supplier_name: string
  invoice_date: string
  due_date: string | null
  total_amount: number
  paid_amount: number
  balance_due: number
  days_overdue: number
  status: string
}

const AccountsPayable = () => {
    const { t } = useLanguage();

const [payables, setPayables] = useState<AccountPayable[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPayable, setTotalPayable] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    loadPayables()
  }, [currentPage, searchTerm, statusFilter])

  const loadPayables = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      })

      const response = await axiosInstance.get(`/api/finance/accounts-payable?${params}`)
      setPayables(response.data.payables || [])
      setTotalPages(response.data.pages || 1)
      setTotalPayable(response.data.total_payable || 0)
    } catch (error) {
      console.error('Error loading accounts payable:', error)
      setPayables([])
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID')
  }

  const getStatusBadge = (status: string, daysOverdue: number) => {
    if (daysOverdue > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
          Overdue ({daysOverdue} days)
        </span>
      )
    }
    
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
          </span>
        )
      case 'partial':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-3 h-3 mr-1" />
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <ClockIcon className="w-3 h-3 mr-1" />
          </span>
        )
    }
  }

  const getPriorityLevel = (daysOverdue: number, balanceDue: number) => {
    if (daysOverdue > 30 && balanceDue > 50000) return 'high'
    if (daysOverdue > 15 || balanceDue > 100000) return 'medium'
    return 'low'
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleDeletePayable = async (payable: AccountPayable) => {
    if (window.confirm(`Are you sure you want to delete invoice ${payable.invoice_number} from ${payable.supplier_name}?`)) {
      try {
        await axiosInstance.delete(`/api/finance/accounts-payable/${payable.id}`)
        alert(`Invoice ${payable.invoice_number} has been deleted successfully.`)
        loadPayables() // Reload the list
      } catch (error) {
        console.error('Error deleting payable:', error)
        alert('Failed to delete invoice. Please try again.')
      }
    }
  }

  if (loading && payables.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💳 Accounts Payable</h1>
          <p className="text-gray-600 mt-1">Manage supplier outstanding balances and payment schedules</p>
        </div>
        <div className="flex gap-3">
          <Link to="/app/finance/payments/new" className="btn-primary inline-flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5" />
            Record Payment
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-red-500 p-3 rounded-lg">
              <CreditCardIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Payable</p>
              <p className="text-2xl font-bold text-gray-900">{formatRupiah(totalPayable)}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-orange-500 p-3 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">
                {payables.filter(p => p.days_overdue > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 p-3 rounded-lg">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Due This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {payables.filter(p => {
                  if (!p.due_date) return false
                  const dueDate = new Date(p.due_date)
                  const weekFromNow = new Date()
                  weekFromNow.setDate(weekFromNow.getDate() + 7)
                  return dueDate <= weekFromNow && p.days_overdue <= 0
                }).length}
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
              <p className="text-sm font-medium text-gray-600">Payment Rate</p>
              <p className="text-2xl font-bold text-gray-900">92%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search invoices..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="outstanding">Outstanding</option>
              <option value="partial">Partial Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <button className="btn-secondary inline-flex items-center gap-2">
              <FunnelIcon className="h-4 w-4" />{t('common.filter')}</button>
            <button 
              onClick={() => {
                const data = payables.map(p => ({
                  'Invoice Number': p.invoice_number,
                  'Supplier': p.supplier_name,
                  'Invoice Date': formatDate(p.invoice_date),
                  'Due Date': p.due_date ? formatDate(p.due_date) : '',
                  'Total Amount': p.total_amount,
                  'Balance Due': p.balance_due,
                  [t('common.status')]: p.status,
                  'Days Overdue': p.days_overdue
                }))
                console.log('Exporting AP data:', data)
                alert('Export functionality will be implemented soon!')
              }}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />{t('common.export')}</button>
          </div>
        </div>
      </div>

      {/* Payables Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance Due
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payables.map((payable) => (
                <tr key={payable.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{payable.invoice_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payable.supplier_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(payable.invoice_date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {payable.due_date ? formatDate(payable.due_date) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatRupiah(payable.total_amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-red-600">
                      {formatRupiah(payable.balance_due)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(payable.status, payable.days_overdue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const priority = getPriorityLevel(payable.days_overdue, payable.balance_due)
                      return (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          priority === 'high' ? 'bg-red-100 text-red-800' :
                          priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <Link
                        to={`/app/finance/invoices/${payable.id}`}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                        title="View Invoice"
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/app/finance/invoices/${payable.id}/edit`}
                        className="text-yellow-600 hover:text-yellow-900 flex items-center gap-1"
                        title="Edit Invoice"
                      >
                        <PencilIcon className="h-4 w-4" />{t('common.edit')}</Link>
                      <Link
                        to="/app/finance/payments/new"
                        className="text-green-600 hover:text-green-900 flex items-center gap-1"
                        title="Make Payment"
                      >
                        <CreditCardIcon className="h-4 w-4" />
                        Pay Now
                      </Link>
                      <button
                        onClick={() => handleDeletePayable(payable)}
                        className="text-red-600 hover:text-red-900 flex items-center gap-1"
                        title="Delete Invoice"
                      >
                        <TrashIcon className="h-4 w-4" />{t('common.delete')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
            </button>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        page === currentPage
                          ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountsPayable
