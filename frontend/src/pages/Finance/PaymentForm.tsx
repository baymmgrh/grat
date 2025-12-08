import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import {
  BanknotesIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const PaymentForm = () => {
    const { t } = useLanguage();

const navigate = useNavigate()
  const [formData, setFormData] = useState({
    paymentType: '',
    supplier: '',
    invoice: '',
    amount: '',
    paymentDate: '',
    reference: '',
    description: '',
    bankAccount: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement payment creation logic
    console.log('Payment data:', formData)
    navigate('/app/finance/accounts-payable')
  }

  const handleCancel = () => {
    navigate('/app/finance/accounts-payable')
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💳 Record Payment</h1>
          <p className="text-gray-600 mt-1">Record supplier payment or cash transaction</p>
        </div>
        <button 
          onClick={handleCancel}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <XMarkIcon className="h-5 w-5" />{t('common.cancel')}</button>
      </div>

      {/* Payment Form */}
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Type
              </label>
              <select 
                className="input w-full"
                value={formData.paymentType}
                onChange={(e) => setFormData({...formData, paymentType: e.target.value})}
                required
              >
                <option value="">Select payment type</option>
                <option value="supplier">Supplier Payment</option>
                <option value="expense">Expense Payment</option>
                <option value="tax">Tax Payment</option>
                <option value="salary">Salary Payment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier/Payee
              </label>
              <select 
                className="input w-full"
                value={formData.supplier}
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                required
              >
                <option value="">Select supplier</option>
                <option value="supplier-a">Supplier A</option>
                <option value="supplier-b">Supplier B</option>
                <option value="supplier-c">Supplier C</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice/Reference
              </label>
              <input
                type="text"
                className="input w-full"
                placeholder="INV-001 or reference number"
                value={formData.invoice}
                onChange={(e) => setFormData({...formData, invoice: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (IDR)
              </label>
              <input
                type="number"
                className="input w-full"
                placeholder="0"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date
              </label>
              <input
                type="date"
                className="input w-full"
                value={formData.paymentDate}
                onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Account
              </label>
              <select 
                className="input w-full"
                value={formData.bankAccount}
                onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
                required
              >
                <option value="">Select bank account</option>
                <option value="bca-main">BCA - Main Account</option>
                <option value="mandiri-ops">Mandiri - Operations</option>
                <option value="petty-cash">Petty Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.description')}</label>
            <textarea
              className="input w-full"
              rows={3}
              placeholder="Payment description..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button 
              type="button"
              onClick={handleCancel}
              className="btn-secondary"
            >{t('common.cancel')}</button>
            <button 
              type="submit"
              className="btn-primary inline-flex items-center gap-2"
            >
              <CreditCardIcon className="h-5 w-5" />
              Record Payment
            </button>
          </div>
        </form>
      </div>

      {/* Payment Summary */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">💰 Payment Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <BanknotesIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-600">Amount to Pay</p>
                <p className="text-xl font-bold text-blue-800">
                  {formData.amount ? `Rp ${Number(formData.amount).toLocaleString()}` : 'Rp 0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CalendarDaysIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-600">Payment Date</p>
                <p className="text-xl font-bold text-green-800">
                  {formData.paymentDate || 'Not set'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CreditCardIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-purple-600">Payment Method</p>
                <p className="text-xl font-bold text-purple-800">
                  {formData.bankAccount || 'Not selected'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentForm
