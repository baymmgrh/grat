import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowTrendingDownIcon as TrendingDown,
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  CheckIcon as Save,
  DocumentTextIcon,
  ExclamationCircleIcon,
  HashtagIcon as Hash,
  ScaleIcon as BalanceIcon,
  XMarkIcon as X

} from '@heroicons/react/24/outline';
interface Account {
  id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  level: number;
  is_header: boolean;
}

interface AccountFormData {
  account_code: string;
  account_name: string;
  account_type: string;
  parent_id: number | null;
  level: number;
  is_active: boolean;
  is_header: boolean;
  normal_balance: string;
  description: string;
}

const AccountForm: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<AccountFormData>({
    account_code: '',
    account_name: '',
    account_type: 'asset',
    parent_id: null,
    level: 1,
    is_active: true,
    is_header: false,
    normal_balance: 'debit',
    description: ''
  });

  const [parentAccounts, setParentAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const accountTypes = [
    { value: 'asset', label: 'Asset', balance: 'debit', color: 'text-green-600' },
    { value: 'liability', label: 'Liability', balance: 'credit', color: 'text-red-600' },
    { value: 'equity', label: 'Equity', balance: 'credit', color: 'text-blue-600' },
    { value: 'revenue', label: 'Revenue', balance: 'credit', color: 'text-purple-600' },
    { value: 'expense', label: 'Expense', balance: 'debit', color: 'text-orange-600' }
  ];

  const normalBalances = [
    { value: 'debit', label: 'Debit', icon: ArrowTrendingUpIcon, color: 'text-green-600' },
    { value: 'credit', label: 'Credit', icon: TrendingDown, color: 'text-red-600' }
  ];

  useEffect(() => {
    fetchParentAccounts();
    if (isEdit) {
      fetchAccount();
    }
  }, [id]);

  useEffect(() => {
    // Auto-set normal balance based on account type
    const selectedType = accountTypes.find(type => type.value === formData.account_type);
    if (selectedType) {
      setFormData(prev => ({
        ...prev,
        normal_balance: selectedType.balance
      }));
    }
  }, [formData.account_type]);

  const fetchParentAccounts = async () => {
    try {
      const response = await fetch('/api/finance/accounts?is_header=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setParentAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Failed to fetch parent accounts:', error);
    }
  };

  const fetchAccount = async () => {
    try {
      const response = await fetch(`/api/finance/accounts/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          account_code: data.account_code,
          account_name: data.account_name,
          account_type: data.account_type,
          parent_id: data.parent_id,
          level: data.level,
          is_active: data.is_active,
          is_header: data.is_header,
          normal_balance: data.normal_balance,
          description: data.description || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch account:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.account_code.trim()) {
      setError('Account code is required');
      setLoading(false);
      return;
    }

    if (!formData.account_name.trim()) {
      setError('Account name is required');
      setLoading(false);
      return;
    }

    try {
      const url = isEdit 
        ? `/api/finance/accounts/${id}` 
        : '/api/finance/accounts';
      
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        navigate('/app/finance/accounting');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save account');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: ['parent_id', 'level'].includes(name) 
          ? (value === '' ? null : Number(value))
          : value
      }));
    }
  };

  const selectedAccountType = accountTypes.find(type => type.value === formData.account_type);
  const selectedParent = parentAccounts.find(acc => acc.id === formData.parent_id);
  const selectedBalance = normalBalances.find(balance => balance.value === formData.normal_balance);
  const BalanceIcon = selectedBalance?.icon || ArrowTrendingUpIcon;

  const generateAccountCode = () => {
    // Auto-generate account code based on account type and parent
    let prefix = '';
    switch (formData.account_type) {
      case 'asset': prefix = '1'; break;
      case 'liability': prefix = '2'; break;
      case 'equity': prefix = '3'; break;
      case 'revenue': prefix = '4'; break;
      case 'expense': prefix = '5'; break;
    }
    
    if (selectedParent) {
      prefix = selectedParent.account_code;
    }
    
    const timestamp = Date.now().toString().slice(-4);
    const suggestedCode = `${prefix}${timestamp}`;
    
    setFormData(prev => ({
      ...prev,
      account_code: suggestedCode,
      level: selectedParent ? selectedParent.level + 1 : 1
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Account' : 'New Account'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update chart of accounts entry' : 'Create new chart of accounts entry'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <ExclamationCircleIcon className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Account Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Account Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="inline h-4 w-4 mr-1" />
                  Account Code *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="account_code"
                    value={formData.account_code}
                    onChange={handleInputChange}
                    required
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter account code"
                  />
                  <button
                    type="button"
                    onClick={generateAccountCode}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Unique identifier for the account (e.g., 1001, 2001, 4001)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DocumentTextIcon className="inline h-4 w-4 mr-1" />
                  Account Name *
                </label>
                <input
                  type="text"
                  name="account_name"
                  value={formData.account_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter account name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <BuildingOfficeIcon className="inline h-4 w-4 mr-1" />
                  Account Type *
                </label>
                <select
                  name="account_type"
                  value={formData.account_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {accountTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {selectedAccountType && (
                  <p className={`mt-1 text-sm ${selectedAccountType.color}`}>
                    Normal Balance: {selectedAccountType.balance}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Account
                </label>
                <select
                  name="parent_id"
                  value={formData.parent_id || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No Parent (Top Level)</option>
                  {parentAccounts
                    .filter(acc => acc.account_type === formData.account_type)
                    .map(account => (
                      <option key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </option>
                    ))}
                </select>
                {selectedParent && (
                  <p className="mt-1 text-sm text-gray-500">
                    Level: {selectedParent.level + 1}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Normal Balance *
                </label>
                <select
                  name="normal_balance"
                  value={formData.normal_balance}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {normalBalances.map(balance => (
                    <option key={balance.value} value={balance.value}>
                      {balance.label}
                    </option>
                  ))}
                </select>
                {selectedBalance && (
                  <div className={`mt-1 flex items-center gap-1 text-sm ${selectedBalance.color}`}>
                    <BalanceIcon className="h-4 w-4" />
                    <span>{selectedBalance.label} increases this account</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Level
                </label>
                <input
                  type="number"
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  min="1"
                  max="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Hierarchy level (1 = top level, 5 = deepest)
                </p>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Account Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Active Account
                  </label>
                  <p className="text-xs text-gray-500">
                    Enable this account for transactions
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    formData.is_active ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Header Account
                  </label>
                  <p className="text-xs text-gray-500">
                    This account has sub-accounts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_header: !prev.is_header }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    formData.is_header ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.is_header ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.description')}</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter account description or notes..."
            />
          </div>

          {/* Account Preview */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Account Preview</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Code:</span>
                <div className="font-medium">{formData.account_code || 'Not set'}</div>
              </div>
              <div>
                <span className="text-blue-600">Name:</span>
                <div className="font-medium">{formData.account_name || 'Not set'}</div>
              </div>
              <div>
                <span className="text-blue-600">Type:</span>
                <div className={`font-medium ${selectedAccountType?.color}`}>
                  {selectedAccountType?.label}
                </div>
              </div>
              <div>
                <span className="text-blue-600">Balance:</span>
                <div className={`font-medium ${selectedBalance?.color}`}>
                  {selectedBalance?.label}
                </div>
              </div>
            </div>
            <div className="mt-2 text-sm">
              <span className="text-blue-600">Status:</span>
              <span className="ml-1">
                {formData.is_active ? '✅ Active' : '❌ Inactive'}
                {formData.is_header ? ' • 📁 Header Account' : ' • 📄 Detail Account'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/finance/accounting')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <X className="inline h-4 w-4 mr-2" />{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="inline h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update Account' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountForm;
