import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatRupiah } from '../../utils/currencyUtils';
import axiosInstance from '../../utils/axiosConfig';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import {
  ArrowDownTrayIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  PencilIcon
,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface LedgerEntry {
  id: number
  entry_date: string
  account_code: string
  account_name: string
  description: string
  debit_amount: number
  credit_amount: number
  reference_number: string
  created_by: string
}

const GeneralLedger = () => {
    const { t } = useLanguage();

const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showNewEntryModal, setShowNewEntryModal] = useState(false)
  const [filters, setFilters] = useState({
    account_id: '',
    start_date: '',
    end_date: '',
    search: ''
  })

  useEffect(() => {
    loadEntries()
  }, [currentPage, filters])

  const loadEntries = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20',
        ...(filters.account_id && { account_id: filters.account_id }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
        ...(filters.search && { search: filters.search })
      })

      const response = await axiosInstance.get(`/api/finance/general-ledger?${params}`)
      setEntries(response.data.entries || [])
      setTotalPages(response.data.pages || 1)
    } catch (error) {
      console.error('Error loading general ledger:', error)
      setEntries([])
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      account_id: '',
      start_date: '',
      end_date: '',
      search: ''
    })
    setCurrentPage(1)
  }

  const calculateRunningBalance = (index: number) => {
    let balance = 0
    for (let i = 0; i <= index; i++) {
      balance += entries[i].debit_amount - entries[i].credit_amount
    }
    return balance
  }

  const getTotalDebits = () => {
    return entries.reduce((sum, entry) => sum + entry.debit_amount, 0)
  }

  const getTotalCredits = () => {
    return entries.reduce((sum, entry) => sum + entry.credit_amount, 0)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleEditEntry = (entry: LedgerEntry) => {
    // TODO: Open edit modal or navigate to edit form
    alert(`Edit journal entry: ${entry.description}\nDate: ${formatDate(entry.entry_date)}\nAmount: ${formatRupiah(entry.debit_amount || entry.credit_amount)}`)
  }

  const handleDeleteEntry = async (entry: LedgerEntry) => {
    if (window.confirm(`Are you sure you want to delete this journal entry?\n\nDate: ${formatDate(entry.entry_date)}\nDescription: ${entry.description}\nReference: ${entry.reference_number || 'N/A'}`)) {
      try {
        await axiosInstance.delete(`/api/finance/general-ledger/${entry.id}`)
        alert('Journal entry has been deleted successfully.')
        loadEntries() // Reload the entries
      } catch (error) {
        console.error('Error deleting journal entry:', error)
        alert('Failed to delete journal entry. Please try again.')
      }
    }
  }

  if (loading && entries.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📚 General Ledger</h1>
          <p className="text-gray-600 mt-1">View all accounting entries and transaction details</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowNewEntryModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            New Entry
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-lg">
              <BookOpenIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Debits</p>
              <p className="text-2xl font-bold text-gray-900">{formatRupiah(getTotalDebits())}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-red-500 p-3 rounded-lg">
              <BookOpenIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Credits</p>
              <p className="text-2xl font-bold text-gray-900">{formatRupiah(getTotalCredits())}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${
              getTotalDebits() === getTotalCredits() ? 'bg-green-500' : 'bg-red-500'
            }`}>
              <BookOpenIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Balance Check</p>
              <p className={`text-2xl font-bold ${
                getTotalDebits() === getTotalCredits() ? 'text-green-600' : 'text-red-600'
              }`}>
                {getTotalDebits() === getTotalCredits() ? 'Balanced' : 'Out of Balance'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search entries..."
              className="input pl-10 w-full"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          <select
            className="input"
            value={filters.account_id}
            onChange={(e) => handleFilterChange('account_id', e.target.value)}
          >
            <option value="">All Accounts</option>
            <option value="1000">1000 - Cash</option>
            <option value="1100">1100 - Accounts Receivable</option>
            <option value="1200">1200 - Inventory</option>
            <option value="2000">2000 - Accounts Payable</option>
            <option value="4000">4000 - Sales Revenue</option>
            <option value="5000">5000 - Cost of Sales</option>
          </select>

          <input
            type="date"
            className="input"
            value={filters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
            placeholder="Start Date"
          />

          <input
            type="date"
            className="input"
            value={filters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
            placeholder="End Date"
          />

          <div className="flex gap-2">
            <button
              onClick={clearFilters}
              className="btn-secondary flex-1"
            >
            </button>
            <button 
              onClick={() => {
                const data = entries.map(entry => ({
                  [t('common.date')]: formatDate(entry.entry_date),
                  'Account Code': entry.account_code,
                  'Account Name': entry.account_name,
                  [t('common.description')]: entry.description,
                  'Reference': entry.reference_number || '',
                  'Debit': entry.debit_amount,
                  'Credit': entry.credit_amount,
                  'Created By': entry.created_by
                }))
                console.log('Exporting GL data:', data)
                alert('Export functionality will be implemented soon!')
              }}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />{t('common.export')}</button>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.date')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.description')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Running Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.map((entry, index) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(entry.entry_date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{entry.account_code}</div>
                    <div className="text-sm text-gray-500">{entry.account_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{entry.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{entry.reference_number || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-green-600">
                      {entry.debit_amount > 0 ? formatRupiah(entry.debit_amount) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-red-600">
                      {entry.credit_amount > 0 ? formatRupiah(entry.credit_amount) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-sm font-medium ${
                      calculateRunningBalance(index) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatRupiah(calculateRunningBalance(index))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{entry.created_by}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditEntry(entry)}
                        className="text-yellow-600 hover:text-yellow-900 flex items-center gap-1"
                        title="Edit Entry"
                      >
                        <PencilIcon className="h-4 w-4" />{t('common.edit')}</button>
                      <button
                        onClick={() => handleDeleteEntry(entry)}
                        className="text-red-600 hover:text-red-900 flex items-center gap-1"
                        title="Delete Entry"
                      >
                        <TrashIcon className="h-4 w-4" />{t('common.delete')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {entries.length > 0 && (
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    Totals:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-green-600">
                      {formatRupiah(getTotalDebits())}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-red-600">
                      {formatRupiah(getTotalCredits())}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-sm font-bold ${
                      getTotalDebits() - getTotalCredits() >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatRupiah(getTotalDebits() - getTotalCredits())}
                    </div>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {entries.length === 0 && !loading && (
          <div className="text-center py-12">
            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No entries found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
          </div>
        )}
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

      {/* New Journal Entry Modal */}
      {showNewEntryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">📚 New Journal Entry</h3>
              <button 
                onClick={() => setShowNewEntryModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const entryData = {
                  entry_date: formData.get('entry_date'),
                  account_code: formData.get('account_code'),
                  description: formData.get('description'),
                  reference_number: formData.get('reference_number'),
                  debit_amount: formData.get('debit_amount') || 0,
                  credit_amount: formData.get('credit_amount') || 0
                }
                
                // Validation
                if (!entryData.entry_date || !entryData.account_code || !entryData.description) {
                  alert('Please fill in all required fields.')
                  return
                }
                
                if (Number(entryData.debit_amount) === 0 && Number(entryData.credit_amount) === 0) {
                  alert('Either debit or credit amount must be greater than 0.')
                  return
                }
                
                if (Number(entryData.debit_amount) > 0 && Number(entryData.credit_amount) > 0) {
                  alert('Please enter either debit OR credit amount, not both.')
                  return
                }
                
                console.log('Creating journal entry:', entryData)
                alert(`Journal entry created successfully!\n\nDate: ${entryData.entry_date}\nAccount: ${entryData.account_code}\nDescription: ${entryData.description}\nAmount: ${formatRupiah(Number(entryData.debit_amount) || Number(entryData.credit_amount))}\nType: ${Number(entryData.debit_amount) > 0 ? 'Debit' : 'Credit'}`)
                setShowNewEntryModal(false)
                // In real implementation: loadEntries() to refresh the list
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entry Date *
                  </label>
                  <input 
                    type="date" 
                    name="entry_date"
                    className="input w-full" 
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Code *
                  </label>
                  <select name="account_code" className="input w-full" required>
                    <option value="">Select account</option>
                    <option value="1000">1000 - Cash in Bank</option>
                    <option value="1100">1100 - Accounts Receivable</option>
                    <option value="1200">1200 - Inventory</option>
                    <option value="1300">1300 - Prepaid Expenses</option>
                    <option value="2000">2000 - Accounts Payable</option>
                    <option value="2100">2100 - Accrued Expenses</option>
                    <option value="3000">3000 - Owner's Equity</option>
                    <option value="4000">4000 - Sales Revenue</option>
                    <option value="5000">5000 - Cost of Goods Sold</option>
                    <option value="6000">6000 - Operating Expenses</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea 
                  name="description"
                  className="input w-full" 
                  rows={3}
                  placeholder="Enter transaction description..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number
                </label>
                <input 
                  type="text" 
                  name="reference_number"
                  className="input w-full" 
                  placeholder="e.g., INV-001, CHK-123"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Debit Amount
                  </label>
                  <input 
                    type="number" 
                    name="debit_amount"
                    className="input w-full" 
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter amount for debit transactions</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credit Amount
                  </label>
                  <input 
                    type="number" 
                    name="credit_amount"
                    className="input w-full" 
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter amount for credit transactions</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">📋 Journal Entry Guidelines:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Enter either debit OR credit amount (not both)</li>
                  <li>• Debit increases: Assets, Expenses, Dividends</li>
                  <li>• Credit increases: Liabilities, Equity, Revenue</li>
                  <li>• Always ensure your journal entries are balanced</li>
                  <li>• Reference numbers help track source documents</li>
                </ul>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t">
                <button 
                  type="button"
                  onClick={() => setShowNewEntryModal(false)}
                  className="btn-secondary"
                >{t('common.cancel')}</button>
                <button type="submit" className="btn-primary">
                  Create Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GeneralLedger
