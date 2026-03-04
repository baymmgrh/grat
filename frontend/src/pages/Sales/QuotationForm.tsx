import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosInstance from '../../utils/axiosConfig';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface QuotationFormData {
  customer_id: number
  issue_date: string
  expiry_date: string
  terms_conditions?: string
  notes?: string
  items: {
    product_id: number
    product_name?: string
    description?: string
    quantity: number
    unit_price: number
    discount_percent: number
    tax_percent: number
    total_amount: number
  }[]
}

interface Customer {
  id: number
  code: string
  company_name: string
  contact_person?: string
  email?: string
}

interface Product {
  id: number
  code: string
  name: string
  price: number
  primary_uom: string
}

const QuotationForm = () => {
    const { t } = useLanguage();
    const navigate = useNavigate()
    const { id } = useParams()
    const isEdit = !!id
  
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<QuotationFormData>({
    defaultValues: {
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{
        product_id: 0,
        quantity: 1,
        unit_price: 0,
        discount_percent: 0,
        tax_percent: 11,
        total_amount: 0
      }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const watchedItems = watch('items')
  const selectedCustomerId = watch('customer_id')
  const selectedCustomer = customers.find(c => c.id == selectedCustomerId)

  useEffect(() => {
    loadFormData()
  }, [])

  useEffect(() => {
    if (isEdit && id) {
      loadQuotation()
    }
  }, [isEdit, id])

  const loadFormData = async () => {
    try {
      setLoadingData(true)
      
      const [customersRes, productsRes] = await Promise.all([
        axiosInstance.get('/api/sales/customers'),
        axiosInstance.get('/api/products-new/?per_page=1000')
      ])
      
      setCustomers(customersRes.data.customers || [])
      const mappedProducts = (productsRes.data.products || []).map((p: any) => ({
        id: p.id,
        code: p.kode_produk || p.code,
        name: p.nama_produk || p.name,
        primary_uom: p.satuan || p.primary_uom || 'pcs',
        price: p.harga_jual || p.price || 0,
      }))
      setProducts(mappedProducts)
    } catch (error) {
      console.error('Error loading form data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const loadQuotation = async () => {
    try {
      const response = await axiosInstance.get(`/api/sales/quotations/${id}`)
      const quotation = response.data.quotation
      
      setValue('customer_id', quotation.customer_id)
      setValue('issue_date', quotation.issue_date)
      setValue('expiry_date', quotation.expiry_date)
      setValue('terms_conditions', quotation.terms_conditions)
      setValue('notes', quotation.notes)
      setValue('items', quotation.items)
    } catch (error) {
      console.error('Error loading quotation:', error)
      alert('Failed to load quotation')
    }
  }

  const onSubmit = async (data: QuotationFormData) => {
    setIsLoading(true)
    try {
      const payload = {
        ...data,
        customer_id: parseInt(data.customer_id.toString()),
        items: data.items.map(item => ({
          ...item,
          product_id: parseInt(item.product_id.toString()),
          quantity: parseFloat(item.quantity.toString()),
          unit_price: parseFloat(item.unit_price.toString()),
          discount_percent: parseFloat(item.discount_percent.toString()),
          tax_percent: parseFloat(item.tax_percent.toString()),
          total_amount: parseFloat(item.total_amount.toString())
        }))
      }

      if (isEdit) {
        await axiosInstance.put(`/api/sales/quotations/${id}`, payload)
        alert('Quotation updated successfully!')
      } else {
        await axiosInstance.post('/api/sales/quotations', payload)
        alert('Quotation created successfully!')
      }
      
      navigate('/app/sales/quotations')
    } catch (error: any) {
      console.error('Error saving quotation:', error)
      alert(error.response?.data?.error || 'Failed to save quotation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProductChange = (itemIndex: number, productId: number) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      setValue(`items.${itemIndex}.product_name`, product.name)
      setValue(`items.${itemIndex}.unit_price`, product.price)
      calculateItemTotal(itemIndex)
    }
  }

  const calculateItemTotal = (itemIndex: number) => {
    const item = watchedItems[itemIndex]
    if (item) {
      const subtotal = item.quantity * item.unit_price
      const discountAmount = subtotal * (item.discount_percent / 100)
      const afterDiscount = subtotal - discountAmount
      const taxAmount = afterDiscount * (item.tax_percent / 100)
      const total = afterDiscount + taxAmount
      
      setValue(`items.${itemIndex}.total_amount`, total)
    }
  }

  const addItem = () => {
    append({
      product_id: 0,
      quantity: 1,
      unit_price: 0,
      discount_percent: 0,
      tax_percent: 11,
      total_amount: 0
    })
  }

  const calculateGrandTotal = () => {
    return watchedItems.reduce((sum, item) => sum + (item.total_amount || 0), 0)
  }

  if (loadingData) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/sales/quotations')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? '✏️ Edit Quotation' : '💼 Create Quotation'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit ? 'Update quotation details' : 'Create a new sales quotation'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer & Basic Info */}
        <div className="card p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer *
              </label>
              <select
                {...register('customer_id', { required: 'Customer is required' })}
                className="input"
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.company_name} ({customer.code})
                  </option>
                ))}
              </select>
              {errors.customer_id && (
                <p className="mt-1 text-sm text-red-600">{errors.customer_id.message}</p>
              )}
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Date *
              </label>
              <input
                type="date"
                {...register('issue_date', { required: 'Issue date is required' })}
                className="input"
              />
              {errors.issue_date && (
                <p className="mt-1 text-sm text-red-600">{errors.issue_date.message}</p>
              )}
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date *
              </label>
              <input
                type="date"
                {...register('expiry_date', { required: 'Expiry date is required' })}
                className="input"
              />
              {errors.expiry_date && (
                <p className="mt-1 text-sm text-red-600">{errors.expiry_date.message}</p>
              )}
            </div>
          </div>

          {/* Customer Info Display */}
          {selectedCustomer && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Customer Information</h4>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Company:</span>
                  <p className="font-medium">{selectedCustomer.company_name}</p>
                </div>
                <div>
                  <span className="text-blue-600">Code:</span>
                  <p className="font-medium">{selectedCustomer.code}</p>
                </div>
                {selectedCustomer.contact_person && (
                  <div>
                    <span className="text-blue-600">Contact:</span>
                    <p className="font-medium">{selectedCustomer.contact_person}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quotation Items</h3>
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
              <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('production.product')}</label>
                    <select
                      {...register(`items.${index}.product_id` as const)}
                      onChange={(e) => handleProductChange(index, parseInt(e.target.value))}
                      className="input"
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.code} - {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.quantity')}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`items.${index}.quantity` as const)}
                      onChange={() => calculateItemTotal(index)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`items.${index}.unit_price` as const)}
                      onChange={() => calculateItemTotal(index)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...register(`items.${index}.discount_percent` as const)}
                      onChange={() => calculateItemTotal(index)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`items.${index}.tax_percent` as const)}
                      onChange={() => calculateItemTotal(index)}
                      className="input"
                    />
                  </div>
                </div>

                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Item Total:</span>
                    <span className="font-medium text-gray-900">
                      Rp {(watchedItems[index]?.total_amount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.description')}</label>
                  <textarea
                    {...register(`items.${index}.description` as const)}
                    rows={2}
                    className="input"
                    placeholder="Additional item description..."
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Grand Total */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-blue-900">Grand Total:</span>
              <span className="text-2xl font-bold text-blue-900">
                Rp {calculateGrandTotal().toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Terms & Notes */}
        <div className="card p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Terms & Conditions
            </label>
            <textarea
              {...register('terms_conditions')}
              rows={4}
              className="input"
              placeholder="Enter terms and conditions for this quotation..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="input"
              placeholder="Additional notes or comments..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/app/sales/quotations')}
            className="btn-secondary"
            disabled={isLoading}
          >{t('common.cancel')}</button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading || !selectedCustomer}
          >
            {isLoading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Quotation' : 'Create Quotation')}
          </button>
        </div>
      </form>

      {/* Guidelines */}
      <div className="card p-4 bg-amber-50 border border-amber-200">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-900 mb-2">💡 Quotation Guidelines</h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Select customer and set appropriate expiry date</li>
              <li>• Add products with accurate pricing and quantities</li>
              <li>• Apply discounts and taxes as needed</li>
              <li>• Include clear terms and conditions</li>
              <li>• Review all details before submitting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuotationForm
