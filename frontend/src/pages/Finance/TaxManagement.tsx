import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatRupiah } from '../../utils/currencyUtils';
import axiosInstance from '../../utils/axiosConfig';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

import {
  ArrowDownTrayIcon,
  CalculatorIcon,
  ChartBarIcon as Calculator,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PencilIcon
,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface TaxSummary {
  vat_payable: number
  vat_receivable: number
  net_vat: number
  income_tax: number
  withholding_tax: number
  total_tax_liability: number
}

interface TaxTransaction {
  id: number
  transaction_date: string
  type: string
  description: string
  base_amount: number
  tax_rate: number
  tax_amount: number
  status: string
}

const TaxManagement = () => {
    const { t } = useLanguage();

const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null)
  const [taxTransactions, setTaxTransactions] = useState<TaxTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadTaxData()
  }, [])

  const loadTaxData = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/api/finance/tax-management')
      setTaxSummary(response.data.tax_summary || null)
      setTaxTransactions(response.data.tax_transactions || [])
      setPeriod(response.data.period || '')
    } catch (error) {
      console.error('Error loading tax data:', error)
      setTaxSummary(null)
      setTaxTransactions([])
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

  const getTaxTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'vat input':
        return 'bg-green-100 text-green-800'
      case 'vat output':
        return 'bg-blue-100 text-blue-800'
      case 'income tax':
        return 'bg-purple-100 text-purple-800'
      case 'withholding tax':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'recorded':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-3 h-3 mr-1" />
          </span>
        )
      case 'submitted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <DocumentTextIcon className="w-3 h-3 mr-1" />
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  const handleEditTransaction = (transaction: TaxTransaction) => {
    // TODO: Open edit modal or navigate to edit form
    alert(`Edit Tax Transaction: ${transaction.description}\nType: ${transaction.type}\nDate: ${formatDate(transaction.transaction_date)}\nTax Amount: ${formatRupiah(transaction.tax_amount)}`)
  }

  const handleSubmitTransaction = async (transaction: TaxTransaction) => {
    if (transaction.status.toLowerCase() === 'submitted') {
      alert('This transaction has already been submitted.')
      return
    }
    
    if (window.confirm(`Submit tax transaction for processing?\n\nDescription: ${transaction.description}\nTax Amount: ${formatRupiah(transaction.tax_amount)}\n\nOnce submitted, this transaction cannot be edited.`)) {
      try {
        await axiosInstance.patch(`/api/finance/tax-management/${transaction.id}/submit`)
        alert('Tax transaction has been submitted successfully.')
        loadTaxData() // Reload the data
      } catch (error) {
        console.error('Error submitting tax transaction:', error)
        alert('Failed to submit tax transaction. Please try again.')
      }
    }
  }

  const handleDeleteTransaction = async (transaction: TaxTransaction) => {
    if (transaction.status.toLowerCase() === 'submitted') {
      alert('Cannot delete a submitted transaction. Please contact your tax administrator.')
      return
    }
    
    if (window.confirm(`Are you sure you want to delete this tax transaction?\n\nDescription: ${transaction.description}\nType: ${transaction.type}\nTax Amount: ${formatRupiah(transaction.tax_amount)}\n\nThis action cannot be undone.`)) {
      try {
        await axiosInstance.delete(`/api/finance/tax-management/${transaction.id}`)
        alert('Tax transaction has been deleted successfully.')
        loadTaxData() // Reload the data
      } catch (error) {
        console.error('Error deleting tax transaction:', error)
        alert('Failed to delete tax transaction. Please try again.')
      }
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🧾 Tax Management</h1>
          <p className="text-gray-600 mt-1">Monitor VAT, income tax, and withholding tax obligations</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              const reportData = {
                vat_summary: taxSummary,
                transactions: taxTransactions,
                period: period,
                generated_at: new Date().toISOString()
              }
              console.log('Generating tax report:', reportData)
              alert('Tax report generation will be implemented soon!')
            }}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Tax Report
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Record Tax
          </button>
        </div>
      </div>

      {/* Tax Summary Cards */}
      {taxSummary && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Tax Summary - {period}</h2>
            <button className="btn-secondary text-sm">
              Change Period
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="bg-blue-500 p-3 rounded-lg">
                  <CalculatorIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">VAT Payable</p>
                  <p className="text-2xl font-bold text-red-600">{formatRupiah(taxSummary.vat_payable)}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="bg-green-500 p-3 rounded-lg">
                  <CalculatorIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">VAT Receivable</p>
                  <p className="text-2xl font-bold text-green-600">{formatRupiah(taxSummary.vat_receivable)}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${taxSummary.net_vat >= 0 ? 'bg-red-500' : 'bg-green-500'}`}>
                  <CalculatorIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Net VAT</p>
                  <p className={`text-2xl font-bold ${taxSummary.net_vat >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatRupiah(taxSummary.net_vat)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="bg-purple-500 p-3 rounded-lg">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Income Tax</p>
                  <p className="text-2xl font-bold text-purple-600">{formatRupiah(taxSummary.income_tax)}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="bg-orange-500 p-3 rounded-lg">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Withholding Tax</p>
                  <p className="text-2xl font-bold text-orange-600">{formatRupiah(taxSummary.withholding_tax)}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="bg-red-600 p-3 rounded-lg">
                  <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Tax Liability</p>
                  <p className="text-2xl font-bold text-red-700">{formatRupiah(taxSummary.total_tax_liability)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tax Obligations */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">📅 Upcoming Tax Obligations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center py-8">
            <CalculatorIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming tax obligations</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tax obligations will appear here based on your transactions
            </p>
          </div>
        </div>
      </div>

      {/* Tax Transactions */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Tax Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.date')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.description')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Amount
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tax Rate
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tax Amount
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {taxTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(transaction.transaction_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTaxTypeColor(transaction.type)}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                    {formatRupiah(transaction.base_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {transaction.tax_rate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                    {formatRupiah(transaction.tax_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStatusBadge(transaction.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditTransaction(transaction)}
                        className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                        title="Edit Transaction"
                        disabled={transaction.status.toLowerCase() === 'submitted'}
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />{t('common.edit')}</button>
                      <button 
                        onClick={() => handleSubmitTransaction(transaction)}
                        className={`hover:text-green-900 inline-flex items-center ${
                          transaction.status.toLowerCase() === 'submitted' ? 'text-gray-400 cursor-not-allowed' : 'text-green-600'
                        }`}
                        title="Submit Transaction"
                        disabled={transaction.status.toLowerCase() === 'submitted'}
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        {transaction.status.toLowerCase() === 'submitted' ? 'Submitted' : 'Submit'}
                      </button>
                      <button 
                        onClick={() => handleDeleteTransaction(transaction)}
                        className={`hover:text-red-900 inline-flex items-center ${
                          transaction.status.toLowerCase() === 'submitted' ? 'text-gray-400 cursor-not-allowed' : 'text-red-600'
                        }`}
                        title="Delete Transaction"
                        disabled={transaction.status.toLowerCase() === 'submitted'}
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />{t('common.delete')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Tax Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">🧾 Record Tax Transaction</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Type
                </label>
                <select className="input w-full">
                  <option value="">Select type</option>
                  <option value="VAT Input">VAT Input</option>
                  <option value="VAT Output">VAT Output</option>
                  <option value="Income Tax">Income Tax</option>
                  <option value="Withholding Tax">Withholding Tax</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Date
                </label>
                <input type="date" className="input w-full" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.description')}</label>
                <input type="text" className="input w-full" placeholder="e.g., Purchase from Supplier A" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Amount
                  </label>
                  <input type="number" className="input w-full" placeholder="100000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Rate (%)
                  </label>
                  <input type="number" className="input w-full" placeholder="11" step="0.1" />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >{t('common.cancel')}</button>
                <button type="submit" className="btn-primary">
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {taxTransactions.length === 0 && !loading && (
        <div className="text-center py-12">
          <CalculatorIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tax transactions found</h3>
          <p className="mt-1 text-sm text-gray-500">Start by recording your first tax transaction</p>
        </div>
      )}
    </div>
  )
}

export default TaxManagement
