import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowUpTrayIcon as Upload,
  BuildingOfficeIcon as Building,
  CalendarIcon as Calendar,
  CheckIcon as Save,
  CreditCardIcon,
  CreditCardIcon as CreditCard,
  CurrencyDollarIcon,
  DocumentTextIcon,
  DocumentTextIcon as Receipt,
  ExclamationCircleIcon,
  TagIcon as Tag,
  XMarkIcon as X
} from '@heroicons/react/24/outline';
interface Account {
  id: number;
  account_code: string;
  account_name: string;
  account_type: string;
}

interface Supplier {
  id: number;
  company_name: string;
  code: string;
}

interface ExpenseFormData {
  expense_date: string;
  expense_number: string;
  supplier_id: number | null;
  account_id: number;
  category: string;
  description: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  payment_method: string;
  reference_number: string;
  status: string;
  notes: string;
  receipt_file: File | null;
}

const ExpenseForm: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<ExpenseFormData>({
    expense_date: new Date().toISOString().split('T')[0],
    expense_number: '',
    supplier_id: null,
    account_id: 0,
    category: '',
    description: '',
    amount: 0,
    tax_amount: 0,
    total_amount: 0,
    payment_method: 'cash',
    reference_number: '',
    status: 'draft',
    notes: '',
    receipt_file: null
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const expenseCategories = [
    'Office Supplies',
    'Travel & Transportation',
    'Meals & Entertainment',
    'Utilities',
    'Rent & Facilities',
    'Professional Services',
    'Marketing & Advertising',
    'Training & Development',
    'Equipment & Maintenance',
    'Insurance',
    'Telecommunications',
    'Software & Subscriptions',
    'Other'
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: CurrencyDollarIcon },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: Building },
    { value: 'credit_card', label: 'Credit Card', icon: CreditCard },
    { value: 'debit_card', label: 'Debit Card', icon: CreditCard },
    { value: 'check', label: 'Check', icon: DocumentTextIcon }
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'text-gray-600' },
    { value: 'submitted', label: 'Submitted', color: 'text-blue-600' },
    { value: 'approved', label: 'Approved', color: 'text-green-600' },
    { value: 'paid', label: 'Paid', color: 'text-purple-600' },
    { value: 'rejected', label: 'Rejected', color: 'text-red-600' }
  ];

  useEffect(() => {
    fetchAccounts();
    fetchSuppliers();
    if (isEdit) {
      fetchExpense();
    } else {
      generateExpenseNumber();
    }
  }, [id]);

  useEffect(() => {
    // Auto-calculate total amount
    const taxAmount = formData.amount * 0.11; // 11% VAT
    const totalAmount = formData.amount + taxAmount;
    
    setFormData(prev => ({
      ...prev,
      tax_amount: taxAmount,
      total_amount: totalAmount
    }));
  }, [formData.amount]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/finance/accounts?account_type=expense&is_active=true', {
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

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/purchasing/suppliers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.suppliers || []);
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  };

  const generateExpenseNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    const expenseNumber = `EXP-${year}${month}-${timestamp}`;
    
    setFormData(prev => ({
      ...prev,
      expense_number: expenseNumber
    }));
  };

  const fetchExpense = async () => {
    try {
      const response = await fetch(`/api/finance/expenses/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          expense_date: data.expense_date,
          expense_number: data.expense_number,
          supplier_id: data.supplier_id,
          account_id: data.account_id,
          category: data.category,
          description: data.description,
          amount: data.amount,
          tax_amount: data.tax_amount,
          total_amount: data.total_amount,
          payment_method: data.payment_method,
          reference_number: data.reference_number || '',
          status: data.status,
          notes: data.notes || '',
          receipt_file: null
        });
      }
    } catch (error) {
      console.error('Failed to fetch expense:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.amount <= 0) {
      setError('Amount must be greater than 0');
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      setLoading(false);
      return;
    }

    try {
      const url = isEdit 
        ? `/api/finance/expenses/${id}` 
        : '/api/finance/expenses';
      
      const method = isEdit ? 'PUT' : 'POST';

      // Create FormData for file upload
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'receipt_file' && value) {
          submitData.append(key, value);
        } else if (key !== 'receipt_file') {
          submitData.append(key, String(value));
        }
      });

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: submitData
      });

      if (response.ok) {
        navigate('/app/finance/expenses');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save expense');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['supplier_id', 'account_id', 'amount', 'tax_amount', 'total_amount'].includes(name) 
        ? (value === '' ? (name.includes('_id') ? null : 0) : Number(value))
        : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      receipt_file: file
    }));
  };

  const selectedAccount = accounts.find(acc => acc.id === formData.account_id);
  const selectedSupplier = suppliers.find(sup => sup.id === formData.supplier_id);
  const selectedPaymentMethod = paymentMethods.find(pm => pm.value === formData.payment_method);
  const selectedStatus = statusOptions.find(s => s.value === formData.status);
  const PaymentIcon = selectedPaymentMethod?.icon || CurrencyDollarIcon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Expense' : 'New Expense'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update expense record details' : 'Record new business expense'}
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

          {/* Expense Header Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Expense Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Receipt className="inline h-4 w-4 mr-1" />
                  Expense Number *
                </label>
                <input
                  type="text"
                  name="expense_number"
                  value={formData.expense_number}
                  onChange={handleInputChange}
                  required
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Expense Date *
                </label>
                <input
                  type="date"
                  name="expense_date"
                  value={formData.expense_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="inline h-4 w-4 mr-1" />
                  Supplier/Vendor
                </label>
                <select
                  name="supplier_id"
                  value={formData.supplier_id || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Supplier (Optional)</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.code} - {supplier.company_name}
                    </option>
                  ))}
                </select>
                {selectedSupplier && (
                  <p className="mt-1 text-sm text-gray-500">
                    Vendor: {selectedSupplier.company_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expense Account *
                </label>
                <select
                  name="account_id"
                  value={formData.account_id}
                  onChange={handleInputChange}
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
                {selectedAccount && (
                  <p className="mt-1 text-sm text-gray-500">
                    Type: {selectedAccount.account_type}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="inline h-4 w-4 mr-1" />
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Category</option>
                {expenseCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="inline h-4 w-4 mr-1" />
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the expense purpose and details..."
              />
            </div>
          </div>

          {/* Amount Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Amount Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CurrencyDollarIcon className="inline h-4 w-4 mr-1" />
                  Base Amount *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Amount (11%)
                </label>
                <input
                  type="number"
                  name="tax_amount"
                  value={formData.tax_amount}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Amount
                </label>
                <input
                  type="number"
                  name="total_amount"
                  value={formData.total_amount}
                  readOnly
                  className="w-full px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg text-blue-700 font-medium"
                />
              </div>
            </div>

            {/* Amount Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-medium text-gray-900">
                    IDR {formData.amount.toLocaleString('id-ID')}
                  </div>
                  <div className="text-sm text-gray-600">Base Amount</div>
                </div>
                <div>
                  <div className="text-lg font-medium text-orange-600">
                    IDR {formData.tax_amount.toLocaleString('id-ID')}
                  </div>
                  <div className="text-sm text-gray-600">Tax (11%)</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-600">
                    IDR {formData.total_amount.toLocaleString('id-ID')}
                  </div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Payment Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
                {selectedPaymentMethod && (
                  <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                    <PaymentIcon className="h-4 w-4" />
                    <span>Payment via {selectedPaymentMethod.label}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  name="reference_number"
                  value={formData.reference_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Transaction/Check number"
                />
              </div>
            </div>

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
          </div>

          {/* Receipt Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Receipt & Documentation
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Upload className="inline h-4 w-4 mr-1" />
                Receipt File
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Upload receipt image or PDF (Max 5MB)
              </p>
              {formData.receipt_file && (
                <p className="mt-1 text-sm text-green-600">
                  Selected: {formData.receipt_file.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter any additional notes or comments..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/finance/expenses')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <X className="inline h-4 w-4 mr-2" />{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="inline h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update Expense' : 'Create Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;
