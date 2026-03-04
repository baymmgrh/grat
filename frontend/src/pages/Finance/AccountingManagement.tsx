import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowPathIcon,
  BanknotesIcon,
  DocumentTextIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface Account {
  id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  balance: number;
  parent_id?: number;
}

interface JournalEntry {
  id: number;
  entry_number: string;
  entry_date: string;
  description: string;
  total_debit: number;
  total_credit: number;
  status: string;
  created_by: string;
}

const AccountingManagement: React.FC = () => {
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'accounts' | 'journal'>('accounts');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showAddJournalModal, setShowAddJournalModal] = useState(false);
  const [accountFormData, setAccountFormData] = useState({
    account_code: '',
    account_name: '',
    account_type: '',
    parent_id: null as number | null,
    description: '',
    is_active: true
  });
  const [journalFormData, setJournalFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    description: '',
    reference_number: '',
    lines: [
      { account_id: '', debit: 0, credit: 0, description: '' },
      { account_id: '', debit: 0, credit: 0, description: '' }
    ]
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'accounts') {
        const response = await axiosInstance.get('/api/finance/accounting/chart-of-accounts');
        setAccounts(response.data?.accounts || []);
      } else {
        const response = await axiosInstance.get('/api/finance/accounting/journal-entries');
        setJournalEntries(response.data?.entries || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      // Mock data fallback
      if (activeTab === 'accounts') {
        setAccounts([
          { id: 1, account_code: '1000', account_name: 'Cash and Cash Equivalents', account_type: 'Asset', balance: 45000000000 },
          { id: 2, account_code: '1100', account_name: 'Accounts Receivable', account_type: 'Asset', balance: 18500000000 },
          { id: 3, account_code: '1200', account_name: 'Inventory', account_type: 'Asset', balance: 25000000000 },
          { id: 4, account_code: '1300', account_name: 'Prepaid Expenses', account_type: 'Asset', balance: 2500000000 },
          { id: 5, account_code: '1500', account_name: 'Property, Plant & Equipment', account_type: 'Asset', balance: 85000000000 },
          { id: 6, account_code: '2000', account_name: 'Accounts Payable', account_type: 'Liability', balance: 12300000000 },
          { id: 7, account_code: '2100', account_name: 'Short-term Debt', account_type: 'Liability', balance: 8500000000 },
          { id: 8, account_code: '2500', account_name: 'Long-term Debt', account_type: 'Liability', balance: 35000000000 },
          { id: 9, account_code: '3000', account_name: 'Share Capital', account_type: 'Equity', balance: 50000000000 },
          { id: 10, account_code: '3100', account_name: 'Retained Earnings', account_type: 'Equity', balance: 75000000000 },
          { id: 11, account_code: '4000', account_name: 'Sales Revenue', account_type: 'Revenue', balance: 125000000000 },
          { id: 12, account_code: '4100', account_name: 'Other Income', account_type: 'Revenue', balance: 2500000000 },
          { id: 13, account_code: '5000', account_name: 'Cost of Goods Sold', account_type: 'Expense', balance: 75000000000 },
          { id: 14, account_code: '6000', account_name: 'Operating Expenses', account_type: 'Expense', balance: 20000000000 },
          { id: 15, account_code: '6100', account_name: 'Depreciation Expense', account_type: 'Expense', balance: 3500000000 }
        ]);
      } else {
        setJournalEntries([
          {
            id: 1,
            entry_number: 'JE-001',
            entry_date: '2024-01-15',
            description: 'Sales revenue recognition',
            total_debit: 15000000000,
            total_credit: 15000000000,
            status: 'posted',
            created_by: 'Finance Manager'
          },
          {
            id: 2,
            entry_number: 'JE-002',
            entry_date: '2024-01-16',
            description: 'Raw material purchase',
            total_debit: 8500000000,
            total_credit: 8500000000,
            status: 'posted',
            created_by: 'Accounting Staff'
          },
          {
            id: 3,
            entry_number: 'JE-003',
            entry_date: '2024-01-17',
            description: 'Salary payment',
            total_debit: 5200000000,
            total_credit: 5200000000,
            status: 'posted',
            created_by: 'HR Manager'
          },
          {
            id: 4,
            entry_number: 'JE-004',
            entry_date: '2024-01-18',
            description: 'Equipment depreciation',
            total_debit: 850000000,
            total_credit: 850000000,
            status: 'draft',
            created_by: 'Accounting Staff'
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleCloseAccountModal = () => {
    setShowAddAccountModal(false);
    setAccountFormData({
      account_code: '',
      account_name: '',
      account_type: '',
      parent_id: null,
      description: '',
      is_active: true
    });
  };

  const handleCloseJournalModal = () => {
    setShowAddJournalModal(false);
    setJournalFormData({
      entry_date: new Date().toISOString().split('T')[0],
      description: '',
      reference_number: '',
      lines: [
        { account_id: '', debit: 0, credit: 0, description: '' },
        { account_id: '', debit: 0, credit: 0, description: '' }
      ]
    });
  };

  const handleSubmitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/finance/accounting/chart-of-accounts', accountFormData);
      alert('Account created successfully!');
      handleCloseAccountModal();
      loadData();
    } catch (error: any) {
      console.error('Error creating account:', error);
      alert(error.response?.data?.error || 'Failed to create account. Please try again.');
    }
  };

  const handleSubmitJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate balanced entry
    const totalDebit = journalFormData.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = journalFormData.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    
    if (totalDebit !== totalCredit) {
      alert(`Entry is not balanced!\nTotal Debit: ${formatRupiah(totalDebit)}\nTotal Credit: ${formatRupiah(totalCredit)}\nDifference: ${formatRupiah(Math.abs(totalDebit - totalCredit))}`);
      return;
    }

    try {
      await axiosInstance.post('/api/finance/accounting/journal-entries', journalFormData);
      alert('Journal entry created successfully!');
      handleCloseJournalModal();
      loadData();
    } catch (error: any) {
      console.error('Error creating journal entry:', error);
      alert(error.response?.data?.error || 'Failed to create journal entry. Please try again.');
    }
  };

  const addJournalLine = () => {
    setJournalFormData({
      ...journalFormData,
      lines: [...journalFormData.lines, { account_id: '', debit: 0, credit: 0, description: '' }]
    });
  };

  const removeJournalLine = (index: number) => {
    if (journalFormData.lines.length > 2) {
      const newLines = journalFormData.lines.filter((_, i) => i !== index);
      setJournalFormData({ ...journalFormData, lines: newLines });
    }
  };

  const updateJournalLine = (index: number, field: string, value: any) => {
    const newLines = [...journalFormData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setJournalFormData({ ...journalFormData, lines: newLines });
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'Asset': return 'bg-blue-100 text-blue-800';
      case 'Liability': return 'bg-red-100 text-red-800';
      case 'Equity': return 'bg-green-100 text-green-800';
      case 'Revenue': return 'bg-purple-100 text-purple-800';
      case 'Expense': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.account_code.includes(searchTerm);
    const matchesFilter = filterType === 'all' || account.account_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const filteredJournalEntries = journalEntries.filter(entry => {
    const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.entry_number.includes(searchTerm);
    const matchesFilter = filterType === 'all' || entry.status === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading accounting data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounting Management</h1>
          <p className="text-gray-600 mt-1">Manage chart of accounts and journal entries</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary">
            <ArrowPathIcon className="h-4 w-4 mr-2" />
          </button>
          <button 
            onClick={() => {
              if (activeTab === 'accounts') {
                setShowAddAccountModal(true)
              } else {
                setShowAddJournalModal(true)
              }
            }}
            className="btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {activeTab === 'accounts' ? 'Add Account' : 'New Entry'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'accounts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BanknotesIcon className="h-5 w-5 inline mr-2" />
            Chart of Accounts
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'journal'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DocumentTextIcon className="h-5 w-5 inline mr-2" />
            Journal Entries
          </button>
        </nav>
      </div>

      {/* Search and FunnelIcon */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'accounts' ? 'accounts' : 'journal entries'}...`}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All {activeTab === 'accounts' ? 'Types' : t('common.status')}</option>
            {activeTab === 'accounts' ? (
              <>
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Equity">Equity</option>
                <option value="Revenue">Revenue</option>
                <option value="Expense">Expense</option>
              </>
            ) : (
              <>
                <option value="posted">Posted</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'accounts' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {account.account_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {account.account_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccountTypeColor(account.account_type)}`}>
                      {account.account_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                    {formatRupiah(account.balance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredAccounts.length === 0 && (
            <div className="text-center py-8">
              <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No accounts found</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entry Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.date')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.description')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJournalEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entry.entry_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(entry.entry_date).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {entry.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                    {formatRupiah(entry.total_debit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.created_by}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredJournalEntries.length === 0 && (
            <div className="text-center py-8">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No journal entries found</p>
            </div>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Assets</p>
              <p className="text-xl font-bold text-gray-900">
                {formatRupiah(accounts.filter(a => a.account_type === 'Asset').reduce((sum, a) => sum + a.balance, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Liabilities</p>
              <p className="text-xl font-bold text-gray-900">
                {formatRupiah(accounts.filter(a => a.account_type === 'Liability').reduce((sum, a) => sum + a.balance, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Equity</p>
              <p className="text-xl font-bold text-gray-900">
                {formatRupiah(accounts.filter(a => a.account_type === 'Equity').reduce((sum, a) => sum + a.balance, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Journal Entries</p>
              <p className="text-xl font-bold text-gray-900">{journalEntries.length}</p>
              <p className="text-xs text-gray-500">{journalEntries.filter(e => e.status === 'posted').length} posted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Add New Account</h3>
              <button 
                onClick={handleCloseAccountModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmitAccount} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Code *
                  </label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    value={accountFormData.account_code}
                    onChange={(e) => setAccountFormData({...accountFormData, account_code: e.target.value})}
                    placeholder="e.g., 1010"
                    required 
                  />
                  <p className="text-xs text-gray-500 mt-1">Unique account identifier</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Type *
                  </label>
                  <select 
                    className="input w-full"
                    value={accountFormData.account_type}
                    onChange={(e) => setAccountFormData({...accountFormData, account_type: e.target.value})}
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name *
                </label>
                <input 
                  type="text" 
                  className="input w-full" 
                  value={accountFormData.account_name}
                  onChange={(e) => setAccountFormData({...accountFormData, account_name: e.target.value})}
                  placeholder="e.g., Cash in Bank"
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Account
                </label>
                <select 
                  className="input w-full"
                  value={accountFormData.parent_id || ''}
                  onChange={(e) => setAccountFormData({...accountFormData, parent_id: e.target.value ? parseInt(e.target.value) : null})}
                >
                  <option value="">None (Top Level Account)</option>
                  {accounts.filter(a => !a.parent_id).map(account => (
                    <option key={account.id} value={account.id}>
                      {account.account_code} - {account.account_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Optional: Select parent for sub-account</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea 
                  className="input w-full" 
                  rows={3}
                  value={accountFormData.description}
                  onChange={(e) => setAccountFormData({...accountFormData, description: e.target.value})}
                  placeholder="Account purpose and usage notes..."
                />
              </div>

              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="is_active"
                  checked={accountFormData.is_active}
                  onChange={(e) => setAccountFormData({...accountFormData, is_active: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active Account
                </label>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button 
                  type="button"
                  onClick={handleCloseAccountModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Journal Entry Modal */}
      {showAddJournalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">New Journal Entry</h3>
              <button 
                onClick={handleCloseJournalModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmitJournal} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Entry Date *
                    </label>
                    <input 
                      type="date" 
                      className="input w-full"
                      value={journalFormData.entry_date}
                      onChange={(e) => setJournalFormData({...journalFormData, entry_date: e.target.value})}
                      required 
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference Number
                    </label>
                    <input 
                      type="text" 
                      className="input w-full"
                      value={journalFormData.reference_number}
                      onChange={(e) => setJournalFormData({...journalFormData, reference_number: e.target.value})}
                      placeholder="e.g., INV-2024-001, PO-123"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea 
                    className="input w-full" 
                    rows={2}
                    value={journalFormData.description}
                    onChange={(e) => setJournalFormData({...journalFormData, description: e.target.value})}
                    placeholder="Brief description of the transaction..."
                    required
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Journal Lines</h4>
                    <button 
                      type="button"
                      onClick={addJournalLine}
                      className="btn-secondary text-sm"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Line
                    </button>
                  </div>

                  <div className="space-y-3">
                    {journalFormData.lines.map((line, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-lg">
                        <div className="col-span-4">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Account *
                          </label>
                          <select 
                            className="input w-full text-sm"
                            value={line.account_id}
                            onChange={(e) => updateJournalLine(index, 'account_id', e.target.value)}
                            required
                          >
                            <option value="">Select account</option>
                            {accounts.map(account => (
                              <option key={account.id} value={account.id}>
                                {account.account_code} - {account.account_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Debit (IDR)
                          </label>
                          <input 
                            type="number" 
                            className="input w-full text-sm"
                            value={line.debit || ''}
                            onChange={(e) => updateJournalLine(index, 'debit', parseFloat(e.target.value) || 0)}
                            step="1000"
                            min="0"
                          />
                        </div>

                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Credit (IDR)
                          </label>
                          <input 
                            type="number" 
                            className="input w-full text-sm"
                            value={line.credit || ''}
                            onChange={(e) => updateJournalLine(index, 'credit', parseFloat(e.target.value) || 0)}
                            step="1000"
                            min="0"
                          />
                        </div>

                        <div className="col-span-2 flex items-end">
                          {journalFormData.lines.length > 2 && (
                            <button 
                              type="button"
                              onClick={() => removeJournalLine(index)}
                              className="w-full px-2 py-2 text-red-600 hover:bg-red-50 rounded text-sm"
                            >
                              <TrashIcon className="h-4 w-4 mx-auto" />
                            </button>
                          )}
                        </div>

                        <div className="col-span-12">
                          <input 
                            type="text" 
                            className="input w-full text-sm"
                            value={line.description}
                            onChange={(e) => updateJournalLine(index, 'description', e.target.value)}
                            placeholder="Line description (optional)"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Total Debit:</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatRupiah(journalFormData.lines.reduce((sum, line) => sum + (line.debit || 0), 0))}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Credit:</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatRupiah(journalFormData.lines.reduce((sum, line) => sum + (line.credit || 0), 0))}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Difference:</p>
                        <p className={`text-lg font-bold ${
                          Math.abs(journalFormData.lines.reduce((sum, line) => sum + (line.debit || 0), 0) - 
                          journalFormData.lines.reduce((sum, line) => sum + (line.credit || 0), 0)) < 0.01 
                          ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatRupiah(Math.abs(
                            journalFormData.lines.reduce((sum, line) => sum + (line.debit || 0), 0) - 
                            journalFormData.lines.reduce((sum, line) => sum + (line.credit || 0), 0)
                          ))}
                        </p>
                      </div>
                    </div>
                    {Math.abs(journalFormData.lines.reduce((sum, line) => sum + (line.debit || 0), 0) - 
                      journalFormData.lines.reduce((sum, line) => sum + (line.credit || 0), 0)) >= 0.01 && (
                      <p className="text-red-600 text-sm mt-2">⚠️ Entry must be balanced before posting</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 p-6 border-t bg-gray-50">
                <button 
                  type="button"
                  onClick={handleCloseJournalModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Journal Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountingManagement;
