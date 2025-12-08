import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  useCreateInvoiceMutation,
  useGetSalesOrdersQuery,
  useGetCustomersQuery,
  useGetPurchaseOrdersQuery,
  useGetSuppliersQuery
} from '../../services/api'
import {
  DocumentTextIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
interface InvoiceFormData {
  invoice_type: 'sales' | 'purchase'
  customer_id?: number
  supplier_id?: number
  sales_order_id?: number
  purchase_order_id?: number
  invoice_date: string
  due_date: string
  payment_terms?: string
  tax_rate?: number
  discount_amount?: number
  notes?: string
  items: {
    description: string
    quantity: number
    unit_price: number
    discount_percent?: number
    tax_amount?: number
  }[]
}

export default function InvoiceForm() {
    const { t } = useLanguage();

const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  
  const { data: salesOrders } = useGetSalesOrdersQuery({})
  const { data: purchaseOrders } = useGetPurchaseOrdersQuery({})
  const { data: customers } = useGetCustomersQuery({})
  const { data: suppliers } = useGetSuppliersQuery({})
  const [createInvoice] = useCreateInvoiceMutation()
  
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<InvoiceFormData>({
    defaultValues: {
      invoice_type: 'sales',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      tax_rate: 11, // PPN 11%
      discount_amount: 0,
      items: [{ description: '', quantity: 1, unit_price: 0, discount_percent: 0, tax_amount: 0 }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const watchedInvoiceType = watch('invoice_type')
  const watchedItems = watch('items')
  const watchedTaxRate = watch('tax_rate') || 0
  const watchedDiscountAmount = watch('discount_amount') || 0

  const paymentTermsOptions = [
    { value: 'due_on_receipt', label: 'Due on Receipt' },
    { value: 'net_7', label: 'NET 7' },
    { value: 'net_15', label: 'NET 15' },
    { value: 'net_30', label: 'NET 30' },
    { value: 'net_60', label: 'NET 60' },
    { value: 'net_90', label: 'NET 90' }
  ]

  const calculateItemTotal = (index: number) => {
    const item = watchedItems[index]
    if (!item) return 0
    const quantity = item.quantity || 0
    const unitPrice = item.unit_price || 0
    const discountPercent = item.discount_percent || 0
    
    const subtotal = quantity * unitPrice
    const discount = subtotal * (discountPercent / 100)
    return subtotal - discount
  }

  const calculateSubtotal = () => {
    return watchedItems.reduce((total, _, index) => {
      return total + calculateItemTotal(index)
    }, 0)
  }

  const calculateTax = () => {
    const subtotal = calculateSubtotal() - watchedDiscountAmount
    return subtotal * (watchedTaxRate / 100)
  }

  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal()
    const tax = calculateTax()
    return subtotal - watchedDiscountAmount + tax
  }

  const onSubmit = async (data: InvoiceFormData) => {
    setIsLoading(true)
    try {
      // Validate items
      const validItems = data.items.filter(item => 
        item.description && item.quantity > 0 && item.unit_price >= 0
      )

      if (validItems.length === 0) {
        toast.error('Please add at least one valid item')
        return
      }

      // Validate customer/supplier based on invoice type
      if (data.invoice_type === 'sales' && !data.customer_id) {
        toast.error('Please select a customer for sales invoice')
        return
      }

      if (data.invoice_type === 'purchase' && !data.supplier_id) {
        toast.error('Please select a supplier for purchase invoice')
        return
      }

      await createInvoice({
        ...data,
        customer_id: data.customer_id ? parseInt(data.customer_id.toString()) : undefined,
        supplier_id: data.supplier_id ? parseInt(data.supplier_id.toString()) : undefined,
        sales_order_id: data.sales_order_id ? parseInt(data.sales_order_id.toString()) : undefined,
        purchase_order_id: data.purchase_order_id ? parseInt(data.purchase_order_id.toString()) : undefined,
        tax_rate: parseFloat((data.tax_rate || 0).toString()),
        discount_amount: parseFloat((data.discount_amount || 0).toString()),
        items: validItems.map(item => ({
          ...item,
          quantity: parseFloat(item.quantity.toString()),
          unit_price: parseFloat(item.unit_price.toString()),
          discount_percent: parseFloat((item.discount_percent || 0).toString()),
          tax_amount: calculateItemTotal(watchedItems.indexOf(item)) * (watchedTaxRate / 100)
        }))
      }).unwrap()
      
      toast.success('Invoice created successfully!')
      navigate('/app/finance/invoices')
    } catch (error: any) {
      toast.error(error.data?.error || 'Failed to create invoice')
    } finally {
      setIsLoading(false)
    }
  }

  const addItem = () => {
    append({ description: '', quantity: 1, unit_price: 0, discount_percent: 0, tax_amount: 0 })
  }

  const selectedCustomer = customers?.customers?.find((c: any) => c.id == watch('customer_id'))
  const selectedSupplier = suppliers?.suppliers?.find((s: any) => s.id == watch('supplier_id'))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
          <p className="text-gray-600">Generate invoice for sales or purchases</p>
        </div>
        <button
          onClick={() => navigate('/app/finance/invoices')}
          className="btn-secondary"
        >
          Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Invoice Header */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5" />
            Invoice Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Type *
              </label>
              <select
                {...register('invoice_type', { required: 'Invoice type is required' })}
                className="input-field"
              >
                <option value="sales">Sales Invoice</option>
                <option value="purchase">Purchase Invoice</option>
              </select>
              {errors.invoice_type && (
                <p className="mt-1 text-sm text-red-600">{errors.invoice_type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {watchedInvoiceType === 'sales' ? 'Customer *' : 'Supplier *'}
              </label>
              {watchedInvoiceType === 'sales' ? (
                <select
                  {...register('customer_id', { required: 'Customer is required' })}
                  className="input-field"
                >
                  <option value="">Select customer</option>
                  {customers?.customers?.map((customer: any) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.code} - {customer.company_name}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  {...register('supplier_id', { required: 'Supplier is required' })}
                  className="input-field"
                >
                  <option value="">Select supplier</option>
                  {suppliers?.suppliers?.map((supplier: any) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.code} - {supplier.company_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Related {watchedInvoiceType === 'sales' ? [t('navigation.sales')] : 'Purchase'} Order
              </label>
              {watchedInvoiceType === 'sales' ? (
                <select
                  {...register('sales_order_id')}
                  className="input-field"
                >
                  <option value="">Select sales order (optional)</option>
                  {salesOrders?.orders?.map((order: any) => (
                    <option key={order.id} value={order.id}>
                      {order.order_number} - {order.customer_name}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  {...register('purchase_order_id')}
                  className="input-field"
                >
                  <option value="">Select purchase order (optional)</option>
                  {purchaseOrders?.purchase_orders?.map((order: any) => (
                    <option key={order.id} value={order.id}>
                      {order.po_number} - {order.supplier_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Terms
              </label>
              <select {...register('payment_terms')} className="input-field">
                <option value="">Select payment terms</option>
                {paymentTermsOptions.map((term) => (
                  <option key={term.value} value={term.value}>
                    {term.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Date *
              </label>
              <input
                type="date"
                {...register('invoice_date', { required: 'Invoice date is required' })}
                className="input-field"
              />
              {errors.invoice_date && (
                <p className="mt-1 text-sm text-red-600">{errors.invoice_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                {...register('due_date', { required: 'Due date is required' })}
                className="input-field"
                min={watch('invoice_date')}
              />
              {errors.due_date && (
                <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="input-field"
                placeholder="Invoice notes or terms..."
              />
            </div>
          </div>

          {/* Customer/Supplier Info Display */}
          {(selectedCustomer || selectedSupplier) && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                {watchedInvoiceType === 'sales' ? 'Customer' : 'Supplier'} Information
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Company:</span>
                  <p className="font-medium">{selectedCustomer?.company_name || selectedSupplier?.company_name}</p>
                </div>
                <div>
                  <span className="text-blue-600">Contact:</span>
                  <p className="font-medium">{selectedCustomer?.contact_person || selectedSupplier?.contact_person || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-blue-600">Email:</span>
                  <p className="font-medium">{selectedCustomer?.email || selectedSupplier?.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-blue-600">Payment Terms:</span>
                  <p className="font-medium">
                    {selectedCustomer?.payment_terms_days || selectedSupplier?.payment_terms_days || 30} days
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Invoice Items */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Invoice Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <input
                      type="text"
                      {...register(`items.${index}.description` as const, {
                        required: 'Description is required'
                      })}
                      className="input-field"
                      placeholder="Item description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`items.${index}.quantity` as const, {
                        required: 'Quantity is required',
                        min: { value: 0.01, message: 'Quantity must be greater than 0' }
                      })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`items.${index}.unit_price` as const, {
                        required: 'Unit price is required',
                        min: { value: 0, message: 'Price must be non-negative' }
                      })}
                      className="input-field"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount %
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...register(`items.${index}.discount_percent` as const)}
                      className="input-field"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="btn-danger p-2"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-2 text-right">
                  <span className="text-sm text-gray-600">
                    Line Total: Rp {calculateItemTotal(index).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice Totals */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Totals</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register('tax_rate')}
                  className="input-field"
                  placeholder="11.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Amount (Rp)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('discount_amount')}
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>Rp {calculateSubtotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Discount:</span>
                <span>-Rp {watchedDiscountAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax ({watchedTaxRate}%):</span>
                <span>Rp {calculateTax().toLocaleString()}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Grand Total:</span>
                  <span>Rp {calculateGrandTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/app/finance/invoices')}
            className="btn-secondary"
            disabled={isLoading}
          >{t('common.cancel')}</button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>

      {/* Finance Tips */}
      <div className="card p-4 bg-green-50 border border-green-200">
        <h4 className="font-medium text-green-900 mb-2">💰 Invoice Tips</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Include clear payment terms and due dates to avoid confusion</li>
          <li>• Verify tax calculations comply with local tax regulations</li>
          <li>• Keep detailed records for accounting and audit purposes</li>
          <li>• Send invoices promptly to maintain healthy cash flow</li>
          <li>• Follow up on overdue payments systematically</li>
        </ul>
      </div>
    </div>
  )
}
