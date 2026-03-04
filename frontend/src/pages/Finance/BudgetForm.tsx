import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  BuildingOfficeIcon as Building,
  CalendarIcon as Calendar,
  ChartBarIcon as Calculator,
  CheckIcon as Save,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  HashtagIcon as Hash,
  PlusIcon as Plus,
  TrashIcon as Trash2
} from '@heroicons/react/24/outline';
interface Account {
  id: number;
  account_code: string;
  account_name: string;
  account_type: string;
}

interface BudgetLine {
  id?: number;
  account_id: number;
  category: string;
  budget_amount: number;
  notes: string;
}

interface BudgetFormData {
  budget_name: string;
  budget_year: number;
  budget_period: string;
  start_date: string;
  end_date: string;
  status: string;
  is_active: boolean;
  lines: BudgetLine[];
}

const BudgetForm: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<BudgetFormData>({
    budget_name: '',
    budget_year: new Date().getFullYear(),
    budget_period: 'annual',
    start_date: '',
    end_date: '',
    status: 'draft',
    is_active: true,
    lines: [{
      account_id: 0,
      category: '',
      budget_amount: 0,
      notes: ''
    }]
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const budgetPeriods = [
    { value: 'annual', label: 'Annual', months: 12 },
    { value: 'quarterly', label: 'Quarterly', months: 3 },
    { value: 'monthly', label: 'Monthly', months: 1 }
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'text-gray-600' },
    { value: 'approved', label: 'Approved', color: 'text-green-600' },
    { value: 'active', label: 'Active', color: 'text-blue-600' },
    { value: 'closed', label: 'Closed', color: 'text-red-600' }
  ];

  const budgetCategories = [
    'Revenue',
    'Cost of Goods Sold',
    'Operating Expenses',
    'Marketing & Sales',
    'Administrative',
    'Research & Development',
    'Capital Expenditure',
    'Other Income',
    'Other Expenses'
  ];

  useEffect(() => {
    fetchAccounts();
    if (isEdit) {
      fetchBudget();
    } else {
      // Set default dates for new budget
      const currentYear = new Date().getFullYear();
      setFormData(prev => ({
        ...prev,
        budget_name: `Budget ${currentYear}`,
        start_date: `${currentYear}-01-01`,
        end_date: `${currentYear}-12-31`
      }));
    }
  }, [id]);

  useEffect(() => {
    // Auto-adjust end date based on period and start date
    if (formData.start_date && formData.budget_period) {
      const startDate = new Date(formData.start_date);
      const period = budgetPeriods.find(p => p.value === formData.budget_period);
      
      if (period) {
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + period.months);
        endDate.setDate(endDate.getDate() - 1); // Last day of period
        
        setFormData(prev => ({
          ...prev,
          end_date: endDate.toISOString().split('T')[0]
        }));
      }
    }
  }, [formData.start_date, formData.budget_period]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/finance/accounts?is_active=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  const fetchBudget = async () => {
    try {
      const response = await fetch(`/api/finance/budgets/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          budget_name: data.budget_name,
          budget_year: data.budget_year,
          budget_period: data.budget_period,
          start_date: data.start_date,
          end_date: data.end_date,
          status: data.status,
          is_active: data.is_active,
          lines: data.lines || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch budget:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.lines.length === 0) {
      setError('At least one budget line is required');
      setLoading(false);
      return;
    }

    const hasEmptyLines = formData.lines.some(line => 
      line.account_id === 0 || !line.category.trim() || line.budget_amount <= 0
    );

    if (hasEmptyLines) {
      setError('All budget lines must have account, category and budget amount');
      setLoading(false);
      return;
    }

    try {
      const url = isEdit 
        ? `/api/finance/budgets/${id}` 
        : '/api/finance/budgets';
      
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
        navigate('/app/finance/budget');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save budget');
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
        [name]: name === 'budget_year' ? Number(value) : value
      }));
    }
  };

  const handleLineChange = (index: number, field: keyof BudgetLine, value: any) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => {
        if (i === index) {
          const updatedLine = {
            ...line,
            [field]: ['account_id', 'budget_amount'].includes(field)
              ? (value === '' ? 0 : Number(value))
              : value
          };

          // Auto-fill category when account is selected
          if (field === 'account_id' && value) {
            const selectedAccount = accounts.find(acc => acc.id === Number(value));
            if (selectedAccount && !line.category) {
              updatedLine.category = selectedAccount.account_type.charAt(0).toUpperCase() + 
                                   selectedAccount.account_type.slice(1);
            }
          }

          return updatedLine;
        }
        return line;
      })
    }));
  };

  const addLine = () => {
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, {
        account_id: 0,
        category: '',
        budget_amount: 0,
        notes: ''
      }]
    }));
  };

  const removeLine = (index: number) => {
    if (formData.lines.length > 1) {
      setFormData(prev => ({
        ...prev,
        lines: prev.lines.filter((_, i) => i !== index)
      }));
    }
  };

  const getTotalBudget = () => {
    return formData.lines.reduce((sum, line) => sum + (line.budget_amount || 0), 0);
  };

  const getLinesByCategory = () => {
    const categories: { [key: string]: number } = {};
    formData.lines.forEach(line => {
      if (line.category) {
        categories[line.category] = (categories[line.category] || 0) + (line.budget_amount || 0);
      }
    });
    return categories;
  };

  const selectedPeriod = budgetPeriods.find(p => p.value === formData.budget_period);
  const selectedStatus = statusOptions.find(s => s.value === formData.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Budget' : 'New Budget'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update budget details and allocations' : 'Create new budget plan with account allocations'}
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

          {/* Budget Header Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Budget Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DocumentTextIcon className="inline h-4 w-4 mr-1" />
                  Budget Name *
                </label>
                <input
                  type="text"
                  name="budget_name"
                  value={formData.budget_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter budget name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="inline h-4 w-4 mr-1" />
                  Budget Year *
                </label>
                <input
                  type="number"
                  name="budget_year"
                  value={formData.budget_year}
                  onChange={handleInputChange}
                  required
                  min="2020"
                  max="2030"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Period *
                </label>
                <select
                  name="budget_period"
                  value={formData.budget_period}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {budgetPeriods.map(period => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
                {selectedPeriod && (
                  <p className="mt-1 text-sm text-gray-500">
                    Duration: {selectedPeriod.months} month(s)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Start Date *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  required
                  min={formData.start_date}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.status')}</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                {selectedStatus && (
                  <p className={`mt-1 text-sm ${selectedStatus.color}`}>
                    Current status: {selectedStatus.label}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Active Budget
                  </label>
                  <p className="text-xs text-gray-500">
                    Enable this budget for tracking
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
            </div>
          </div>

          {/* Budget Lines */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Budget Allocations</h3>
              <button
                type="button"
                onClick={addLine}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus className="inline h-4 w-4 mr-1" />
                Add Line
              </button>
            </div>

            <div className="space-y-4">
              {formData.lines.map((line, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      Budget Line {index + 1}
                    </h4>
                    {formData.lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Building className="inline h-4 w-4 mr-1" />
                        Account *
                      </label>
                      <select
                        value={line.account_id}
                        onChange={(e) => handleLineChange(index, 'account_id', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Account</option>
                        {accounts.map(account => (
                          <option key={account.id} value={account.id}>
                            {account.account_code} - {account.account_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={line.category}
                        onChange={(e) => handleLineChange(index, 'category', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Category</option>
                        {budgetCategories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <CurrencyDollarIcon className="inline h-4 w-4 mr-1" />
                        Budget Amount *
                      </label>
                      <input
                        type="number"
                        value={line.budget_amount}
                        onChange={(e) => handleLineChange(index, 'budget_amount', e.target.value)}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter budget amount"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                      </label>
                      <input
                        type="text"
                        value={line.notes}
                        onChange={(e) => handleLineChange(index, 'notes', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter notes"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Budget Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">
                <Calculator className="inline h-4 w-4 mr-1" />
                Budget Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    IDR {getTotalBudget().toLocaleString('id-ID')}
                  </div>
                  <div className="text-sm text-gray-600">Total Budget Amount</div>
                </div>
                <div>
                  <div className="text-lg font-medium text-gray-900">
                    {formData.lines.length} Budget Lines
                  </div>
                  <div className="text-sm text-gray-600">
                    Period: {formData.start_date} to {formData.end_date}
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              {Object.keys(getLinesByCategory()).length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium text-gray-900 mb-2">Category Breakdown</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    {Object.entries(getLinesByCategory()).map(([category, amount]) => (
                      <div key={category} className="flex justify-between">
                        <span className="text-gray-600">{category}:</span>
                        <span className="font-medium">IDR {amount.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/finance/budget')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <X className="inline h-4 w-4 mr-2" />{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="inline h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update Budget' : 'Create Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetForm;
