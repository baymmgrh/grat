import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatRupiah } from '../../utils/currencyUtils';
import {
  ArrowDownTrayIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react'
import axiosInstance from '../../utils/axiosConfig'
import LoadingSpinner from '../../components/Common/LoadingSpinner'
interface AccountReceivable {
  id: number
  invoice_number: string
  customer_name: string
  invoice_date: string
  due_date: string | null
  total_amount: number
  paid_amount: number
  balance_due: number
  days_overdue: number
  status: string
}

const AccountsReceivable = () => {
    const { t } = useLanguage();

const [receivables, setReceivables] = useState<AccountReceivable[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOutstanding, setTotalOutstanding] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    loadReceivables()
  }, [currentPage, searchTerm, statusFilter])

  const loadReceivables = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      })

      const response = await axiosInstance.get(`/api/finance/accounts-receivable?${params}`)
      setReceivables(response.data.receivables || [])
      setTotalPages(response.data.pages || 1)
      setTotalOutstanding(response.data.total_outstanding || 0)
    } catch (error) {
      console.error('Error loading accounts receivable:', error)
      setReceivables([])
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleExportCSV = () => {
    try {
      const csvData = receivables.map(r => ({
        'Invoice Number': r.invoice_number,
        'Customer': r.customer_name,
        'Invoice Date': formatDate(r.invoice_date),
        'Due Date': r.due_date ? formatDate(r.due_date) : '',
        'Total Amount': r.total_amount,
        'Balance Due': r.balance_due,
        'Status': r.status,
        'Days Overdue': r.days_overdue || 0
      }))

      const headers = Object.keys(csvData[0])
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `accounts_receivable_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      alert('Accounts Receivable data exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  const handleRecordPayment = (receivable: AccountReceivable) => {
    const amount = prompt(`Record payment for invoice ${receivable.invoice_number}\n\nBalance Due: ${formatRupiah(receivable.balance_due)}\n\nEnter payment amount:`, receivable.balance_due.toString())
    
    if (amount && parseFloat(amount) > 0) {
      axiosInstance.post('/api/finance/payments', {
        invoice_id: receivable.id,
        amount: parseFloat(amount),
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'bank_transfer',
        notes: `Payment for invoice ${receivable.invoice_number}`
      })
      .then(() => {
        alert('Payment recorded successfully!')
        loadReceivables()
      })
      .catch(error => {
        console.error('Payment error:', error)
        alert('Failed to record payment. Please try again.')
      })
    }
  }

  const handleDeleteInvoice = async (receivable: AccountReceivable) => {
    if (window.confirm(`Are you sure you want to delete invoice ${receivable.invoice_number}?\n\nCustomer: ${receivable.customer_name}\nAmount: ${formatRupiah(receivable.total_amount)}\n\nThis action cannot be undone.`)) {
      try {
        await axiosInstance.delete(`/api/finance/invoices/${receivable.id}`)
        alert(`Invoice ${receivable.invoice_number} deleted successfully!`)
        loadReceivables()
      } catch (error) {
        console.error('Delete error:', error)
        alert('Failed to delete invoice. Please try again.')
      }
    }
  }

  if (loading && receivables.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💰 Accounts Receivable</h1>
          <p className="text-gray-600 mt-1">Monitor customer outstanding balances and overdue payments</p>
        </div>
        <div className="flex gap-3">
          <Link to="/app/finance/invoices/new" className="btn-primary inline-flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5" />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
              <p className="text-2xl font-bold text-gray-900">{formatRupiah(totalOutstanding)}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-red-500 p-3 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">
                {receivables.filter(r => r.days_overdue > 0).length}
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
                {receivables.filter(r => {
                  if (!r.due_date) return false
                  const dueDate = new Date(r.due_date)
                  const weekFromNow = new Date()
                  weekFromNow.setDate(weekFromNow.getDate() + 7)
                  return dueDate <= weekFromNow && r.days_overdue <= 0
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
              <p className="text-sm font-medium text-gray-600">Collection Rate</p>
              <p className="text-2xl font-bold text-gray-900">85%</p>
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
              onClick={handleExportCSV}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-4 w-5" />{t('common.export')}</button>
          </div>
        </div>
      </div>

      {/* Receivables Table */}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {receivables.map((receivable) => (
                <tr key={receivable.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{receivable.invoice_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{receivable.customer_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(receivable.invoice_date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {receivable.due_date ? formatDate(receivable.due_date) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatRupiah(receivable.total_amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-red-600">
                      {formatRupiah(receivable.balance_due)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(receivable.status, receivable.days_overdue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link
                        to={`/app/finance/invoices/${receivable.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                      </Link>
                      <Link
                        to={`/app/finance/invoices/${receivable.id}/edit`}
                        className="text-yellow-600 hover:text-yellow-900"
                      >{t('common.edit')}</Link>
                      <button 
                        onClick={() => handleRecordPayment(receivable)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Record Payment
                      </button>
                      <button 
                        onClick={() => handleDeleteInvoice(receivable)}
                        className="text-red-600 hover:text-red-900"
                      >{t('common.delete')}</button>
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

export default AccountsReceivable
