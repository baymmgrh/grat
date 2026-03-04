import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatRupiah } from '../../utils/currencyUtils';
import axiosInstance from '../../utils/axiosConfig';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import {
  ArrowDownTrayIcon,
  FunnelIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  PencilIcon
,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface Account {
  code: string
  name: string
  type: string
  balance: number
}

const ChartOfAccounts = () => {
    const { t } = useLanguage();

const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/api/finance/chart-of-accounts')
      setAccounts(response.data.accounts || [])
    } catch (error) {
      console.error('Error loading chart of accounts:', error)
      setAccounts([])
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

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.code.includes(searchTerm)
    const matchesType = !typeFilter || account.type === typeFilter
    return matchesSearch && matchesType
  })

  const groupedAccounts = filteredAccounts.reduce((groups, account) => {
    const type = account.type
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(account)
    return groups
  }, {} as Record<string, Account[]>)

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Asset':
        return 'bg-green-100 text-green-800'
      case 'Liability':
        return 'bg-red-100 text-red-800'
      case 'Equity':
        return 'bg-blue-100 text-blue-800'
      case 'Revenue':
        return 'bg-purple-100 text-purple-800'
      case 'Expense':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Asset':
        return '🏢'
      case 'Liability':
        return '💳'
      case 'Equity':
        return '📈'
      case 'Revenue':
        return '💰'
      case 'Expense':
        return '💸'
      default:
        return '📊'
    }
  }

  const getTotalByType = (type: string) => {
    return accounts
      .filter(account => account.type === type)
      .reduce((sum, account) => sum + account.balance, 0)
  }

  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: '',
    balance: 0,
    description: ''
  })

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account)
    setFormData({
      code: account.code,
      name: account.name,
      type: account.type,
      balance: account.balance,
      description: account.description || ''
    })
    setShowAddModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingAccount(null)
    setFormData({
      code: '',
      name: '',
      type: '',
      balance: 0,
      description: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingAccount) {
        // Update existing account
        await axiosInstance.put(`/api/finance/chart-of-accounts/${editingAccount.code}`, formData)
        alert('Account updated successfully!')
      } else {
        // Create new account
        await axiosInstance.post('/api/finance/chart-of-accounts', formData)
        alert('Account created successfully!')
      }
      handleCloseModal()
      loadAccounts()
    } catch (error: any) {
      console.error('Error saving account:', error)
      alert(error.response?.data?.error || 'Failed to save account. Please try again.')
    }
  }

  const handleDeleteAccount = async (account: Account) => {
    if (window.confirm(`Are you sure you want to delete this account?\n\nCode: ${account.code}\nName: ${account.name}\nType: ${account.type}\n\nThis action cannot be undone.`)) {
      try {
        await axiosInstance.delete(`/api/finance/chart-of-accounts/${account.code}`)
        alert(`Account "${account.name}" has been deleted successfully.`)
        loadAccounts() // Reload the accounts
      } catch (error) {
        console.error('Error deleting account:', error)
        alert('Failed to delete account. Please try again.')
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
          <h1 className="text-3xl font-bold text-gray-900">📊 Chart of Accounts</h1>
          <p className="text-gray-600 mt-1">Manage your accounting structure and account balances</p>
        </div>
        <div className="flex gap-3">
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-lg">
              <span className="text-2xl">🏢</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assets</p>
              <p className="text-xl font-bold text-gray-900">{formatRupiah(getTotalByType('Asset'))}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-red-500 p-3 rounded-lg">
              <span className="text-2xl">💳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Liabilities</p>
              <p className="text-xl font-bold text-gray-900">{formatRupiah(getTotalByType('Liability'))}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg">
              <span className="text-2xl">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Equity</p>
              <p className="text-xl font-bold text-gray-900">{formatRupiah(getTotalByType('Equity'))}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 p-3 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-xl font-bold text-gray-900">{formatRupiah(getTotalByType('Revenue'))}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-orange-500 p-3 rounded-lg">
              <span className="text-2xl">💸</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expenses</p>
              <p className="text-xl font-bold text-gray-900">{formatRupiah(getTotalByType('Expense'))}</p>
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
              placeholder="Search accounts..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="input"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="Asset">Assets</option>
              <option value="Liability">Liabilities</option>
              <option value="Equity">Equity</option>
              <option value="Revenue">Revenue</option>
              <option value="Expense">Expenses</option>
            </select>
            <button className="btn-secondary inline-flex items-center gap-2">
              <FunnelIcon className="h-4 w-4" />
            </button>
            <button className="btn-secondary inline-flex items-center gap-2">
              <ArrowDownTrayIcon className="h-4 w-4" />{t('common.export')}</button>
          </div>
        </div>
      </div>

      {/* Accounts by Type */}
      <div className="space-y-6">
        {Object.entries(groupedAccounts).map(([type, typeAccounts]) => (
          <div key={type} className="card overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getTypeIcon(type)}</span>
                  <h3 className="text-lg font-medium text-gray-900">{type}</h3>
                  <span className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(type)}`}>
                    {typeAccounts.length} accounts
                  </span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {formatRupiah(getTotalByType(type))}
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Name
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {typeAccounts.map((account) => (
                    <tr key={account.code} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{account.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{account.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`text-sm font-medium ${
                          account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatRupiah(account.balance)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditAccount(account)}
                            className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                            title="Edit Account"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />{t('common.edit')}</button>
                          <button 
                            onClick={() => handleDeleteAccount(account)}
                            className="text-red-600 hover:text-red-900 inline-flex items-center"
                            title="Delete Account"
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
        ))}
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editingAccount ? 'Edit Account' : 'Add New Account'}</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Code *
                </label>
                <input 
                  type="text" 
                  className="input w-full" 
                  placeholder="e.g., 1000" 
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  disabled={!!editingAccount}
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name *
                </label>
                <input 
                  type="text" 
                  className="input w-full" 
                  placeholder="e.g., Cash in Bank"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type *
                </label>
                <select 
                  className="input w-full"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  required
                >
                  <option value="">Select type</option>
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Equity">Equity</option>
                  <option value="Revenue">Revenue</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingAccount ? 'Current Balance' : 'Opening Balance'}
                </label>
                <input 
                  type="number" 
                  className="input w-full" 
                  placeholder="0"
                  value={formData.balance}
                  onChange={(e) => setFormData({...formData, balance: parseFloat(e.target.value) || 0})}
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea 
                  className="input w-full" 
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                >{t('common.cancel')}</button>
                <button type="submit" className="btn-primary">
                  {editingAccount ? 'Update Account' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filteredAccounts.length === 0 && !loading && (
        <div className="text-center py-12">
          <ListBulletIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No accounts found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria or add a new account</p>
        </div>
      )}
    </div>
  )
}

export default ChartOfAccounts
