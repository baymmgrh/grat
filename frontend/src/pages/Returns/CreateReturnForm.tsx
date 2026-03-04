import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateReturnMutation } from '../../services/returnsApi'
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowLeftIcon,
  LinkIcon
,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
interface ReturnItem {
  id: string
  product_id: number
  product_name: string
  quantity_returned: number
  unit_price: number
  condition_received: string
  defect_description?: string
  batch_number?: string
}

export default function CreateReturnForm() {
    const { t } = useLanguage();

const navigate = useNavigate()
  const [createReturn, { isLoading }] = useCreateReturnMutation()

  const [formData, setFormData] = useState({
    customer_id: '',
    sales_order_id: '',
    return_date: new Date().toISOString().split('T')[0],
    reason: '',
    description: '',
    qc_required: true
  })

  const [items, setItems] = useState<ReturnItem[]>([
    {
      id: '1',
      product_id: 0,
      product_name: '',
      quantity_returned: 1,
      unit_price: 0,
      condition_received: 'damaged',
      defect_description: '',
      batch_number: ''
    }
  ])

  const addItem = () => {
    const newItem: ReturnItem = {
      id: Date.now().toString(),
      product_id: 0,
      product_name: '',
      quantity_returned: 1,
      unit_price: 0,
      condition_received: 'damaged',
      defect_description: '',
      batch_number: ''
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: keyof ReturnItem, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const returnData = {
        customer_id: parseInt(formData.customer_id),
        sales_order_id: formData.sales_order_id ? parseInt(formData.sales_order_id) : undefined,
        return_date: formData.return_date,
        reason: formData.reason,
        description: formData.description,
        qc_required: formData.qc_required,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity_returned: item.quantity_returned,
          unit_price: item.unit_price,
          condition_received: item.condition_received,
          defect_description: item.defect_description,
          batch_number: item.batch_number
        }))
      }

      const result = await createReturn(returnData).unwrap()
      navigate(`/app/returns/${result.return_id}`)
    } catch (error) {
      console.error('Failed to create return:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/app/returns"
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Return</h1>
          <p className="text-gray-600">Process customer product returns</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Return Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Return Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer ID *
              </label>
              <input
                type="number"
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sales Order ID (Optional)
              </label>
              <input
                type="number"
                value={formData.sales_order_id}
                onChange={(e) => setFormData({ ...formData, sales_order_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Return Date *
              </label>
              <input
                type="date"
                value={formData.return_date}
                onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Return Reason *
              </label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select reason</option>
                <option value="defective">Defective Product</option>
                <option value="damaged">Damaged in Transit</option>
                <option value="wrong_item">Wrong Item Shipped</option>
                <option value="quality_issue">Quality Issue</option>
                <option value="customer_request">Customer Request</option>
                <option value="warranty_claim">Warranty Claim</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.description')}</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Additional details about the return..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.qc_required}
                  onChange={(e) => setFormData({ ...formData, qc_required: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">QC Inspection Required</span>
              </label>
            </div>
          </div>
        </div>

        {/* Return Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Return Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-md font-medium text-gray-900">Item {index + 1}</h3>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product ID *
                    </label>
                    <input
                      type="number"
                      value={item.product_id || ''}
                      onChange={(e) => updateItem(item.id, 'product_id', parseInt(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity Returned *
                    </label>
                    <input
                      type="number"
                      value={item.quantity_returned}
                      onChange={(e) => updateItem(item.id, 'quantity_returned', parseInt(e.target.value) || 1)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condition Received *
                    </label>
                    <select
                      value={item.condition_received}
                      onChange={(e) => updateItem(item.id, 'condition_received', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="good">Good</option>
                      <option value="damaged">Damaged</option>
                      <option value="defective">Defective</option>
                      <option value="unusable">Unusable</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Batch Number
                    </label>
                    <input
                      type="text"
                      value={item.batch_number || ''}
                      onChange={(e) => updateItem(item.id, 'batch_number', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Value
                    </label>
                    <input
                      type="text"
                      value={`Rp ${(item.quantity_returned * item.unit_price).toLocaleString()}`}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                      disabled
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Defect Description
                    </label>
                    <textarea
                      value={item.defect_description || ''}
                      onChange={(e) => updateItem(item.id, 'defect_description', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="Describe any defects or issues..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">Total Items:</span>
              <span className="text-lg font-bold text-gray-900">
                {items.reduce((sum, item) => sum + item.quantity_returned, 0)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-lg font-medium text-gray-900">Total Value:</span>
              <span className="text-lg font-bold text-gray-900">
                Rp {items.reduce((sum, item) => sum + (item.quantity_returned * item.unit_price), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Link
            to="/app/returns"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >{t('common.cancel')}</Link>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Return'}
          </button>
        </div>
      </form>
    </div>
  )
}
