import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext';
import { formatRupiah } from '../../utils/currencyUtils';
import axiosInstance from '../../utils/axiosConfig'
import LoadingSpinner from '../../components/Common/LoadingSpinner'
import {
  ArrowDownIcon,
  ArrowPathIcon,
  ArrowUpIcon,
  BanknotesIcon,
  EyeIcon
,
  PlusIcon
} from '@heroicons/react/24/outline';

interface CashAccount {
  id: number
  account_name: string
  account_number: string
  balance: number
  currency: string
}

const CashBankManagement = () => {
    const { t } = useLanguage();

const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [totalCash, setTotalCash] = useState(0)

  useEffect(() => {
    loadCashAccounts()
  }, [])

  const loadCashAccounts = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/api/finance/cash-bank')
      setCashAccounts(response.data.cash_accounts || [])
      setTotalCash(response.data.total_cash || 0)
    } catch (error) {
      console.error('Error loading cash accounts:', error)
      setCashAccounts([])
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

  const getAccountTypeIcon = (accountName: string) => {
    if (accountName.toLowerCase().includes('cash')) return '💵'
    if (accountName.toLowerCase().includes('bank')) return '🏦'
    if (accountName.toLowerCase().includes('petty')) return '🏮'
    return '💰'
  }

  const getHealthStatus = (balance: number) => {
    if (balance > 100000) return { status: 'healthy', color: 'text-green-600', bg: 'bg-green-100' }
    if (balance > 50000) return { status: 'moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { status: 'low', color: 'text-red-600', bg: 'bg-red-100' }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🏦 Cash & Bank Management</h1>
          <p className="text-gray-600 mt-1">Monitor cash flow and bank account balances</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowTransferModal(true)}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Account
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cash & Bank</p>
              <p className="text-2xl font-bold text-gray-900">{formatRupiah(totalCash)}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg">
              <span className="text-2xl">🏦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bank Accounts</p>
              <p className="text-2xl font-bold text-gray-900">
                {cashAccounts.filter(acc => acc.account_name.toLowerCase().includes('bank')).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 p-3 rounded-lg">
              <span className="text-2xl">💵</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cash Accounts</p>
              <p className="text-2xl font-bold text-gray-900">
                {cashAccounts.filter(acc => acc.account_name.toLowerCase().includes('cash')).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 p-3 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatRupiah(totalCash / Math.max(cashAccounts.length, 1))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cashAccounts.map((account) => {
          const health = getHealthStatus(account.balance)
          return (
            <div key={account.id} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="text-4xl mr-4">
                    {getAccountTypeIcon(account.account_name)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{account.account_name}</h3>
                    <p className="text-sm text-gray-500">Account: {account.account_number}</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${health.bg} ${health.color}`}>
                        {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${health.color}`}>
                    {formatRupiah(account.balance)}
                  </p>
                  <p className="text-sm text-gray-500">{account.currency}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <div className="flex space-x-2">
                  <button className="btn-secondary text-sm inline-flex items-center gap-1">
                    <ArrowUpIcon className="h-4 w-4" />
                  </button>
                  <button className="btn-secondary text-sm inline-flex items-center gap-1">
                    <ArrowDownIcon className="h-4 w-4" />
                  </button>
                </div>
                <button className="text-indigo-600 hover:text-indigo-900 inline-flex items-center text-sm">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View Details
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
        </div>
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
                  Running Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="text-center">
                    <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Cash and bank transactions will appear here once recorded
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">💸 Transfer Funds</h3>
              <button 
                onClick={() => setShowTransferModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Account
                </label>
                <select className="input w-full">
                  <option value="">Select account</option>
                  {cashAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_name} - {formatRupiah(account.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Account
                </label>
                <select className="input w-full">
                  <option value="">Select account</option>
                  {cashAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_name} - {formatRupiah(account.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                </label>
                <input type="number" className="input w-full" placeholder="Enter amount" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.description')}</label>
                <textarea 
                  className="input w-full" 
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button 
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="btn-secondary"
                >{t('common.cancel')}</button>
                <button type="submit" className="btn-primary">
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cashAccounts.length === 0 && !loading && (
        <div className="text-center py-12">
          <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No cash accounts found</h3>
          <p className="mt-1 text-sm text-gray-500">Start by adding your first cash or bank account</p>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">🏦 Add Bank Account</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const accountData = {
                  account_name: formData.get('account_name'),
                  account_number: formData.get('account_number'),
                  initial_balance: formData.get('initial_balance'),
                  currency: formData.get('currency')
                }
                console.log('Adding account:', accountData)
                alert('Account will be added to the system!')
                setShowAddModal(false)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name
                </label>
                <input 
                  name="account_name"
                  type="text" 
                  className="input w-full" 
                  placeholder="e.g., BCA Main Account"
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <input 
                  name="account_number"
                  type="text" 
                  className="input w-full" 
                  placeholder="e.g., 1234567890"
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                </label>
                <select name="currency" className="input w-full" required>
                  <option value="">Select currency</option>
                  <option value="IDR">IDR - Indonesian Rupiah</option>
                  <option value="IDR">IDR - US Rupiah</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Balance
                </label>
                <input 
                  name="initial_balance"
                  type="number" 
                  className="input w-full" 
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >{t('common.cancel')}</button>
                <button type="submit" className="btn-primary">
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CashBankManagement
