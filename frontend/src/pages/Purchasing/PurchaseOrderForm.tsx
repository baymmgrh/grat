import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  useGetSuppliersQuery,
  useGetProductsQuery,
  useCreatePurchaseOrderMutation
} from '../../services/api'
import {
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
interface PurchaseOrderFormData {
  supplier_id: number
  order_date: string
  required_date?: string
  payment_terms?: string
  notes?: string
  items: {
    product_id: number
    quantity: number
    unit_price: number
    uom: string
  }[]
}

export default function PurchaseOrderForm() {
    const { t } = useLanguage();

const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  
  const { data: suppliers } = useGetSuppliersQuery({})
  const { data: products } = useGetProductsQuery({})
  const [createPO] = useCreatePurchaseOrderMutation()
  
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<PurchaseOrderFormData>({
    defaultValues: {
      order_date: new Date().toISOString().split('T')[0],
      items: [{ product_id: 0, quantity: 1, unit_price: 0, uom: 'PCS' }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const watchedItems = watch('items')

  const calculateTotal = () => {
    return watchedItems.reduce((total, item) => {
      return total + (item.quantity || 0) * (item.unit_price || 0)
    }, 0)
  }

  const onSubmit = async (data: PurchaseOrderFormData) => {
    setIsLoading(true)
    try {
      // Validate items
      const validItems = data.items.filter(item => 
        item.product_id && item.quantity > 0 && item.unit_price > 0
      )

      if (validItems.length === 0) {
        toast.error('Please add at least one valid item')
        return
      }

      await createPO({
        ...data,
        supplier_id: parseInt(data.supplier_id.toString()),
        items: validItems.map(item => ({
          ...item,
          product_id: parseInt(item.product_id.toString()),
          quantity: parseFloat(item.quantity.toString()),
          unit_price: parseFloat(item.unit_price.toString())
        }))
      }).unwrap()
      
      toast.success('Purchase Order created successfully!')
      navigate('/app/purchasing/purchase-orders')
    } catch (error: any) {
      toast.error(error.data?.error || 'Failed to create purchase order')
    } finally {
      setIsLoading(false)
    }
  }

  const addItem = () => {
    append({ product_id: 0, quantity: 1, unit_price: 0, uom: 'PCS' })
  }

  const getProductById = (productId: number) => {
    return products?.products?.find((p: any) => p.id == productId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Purchase Order</h1>
          <p className="text-gray-600">Request materials and products from suppliers</p>
        </div>
        <button
          onClick={() => navigate('/app/purchasing/purchase-orders')}
          className="btn-secondary"
        >
          Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Information */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier *
              </label>
              <select
                {...register('supplier_id', { required: 'Supplier is required' })}
                className="input-field"
              >
                <option value="">Select a supplier</option>
                {suppliers?.suppliers?.map((supplier: any) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.code} - {supplier.company_name}
                  </option>
                ))}
              </select>
              {errors.supplier_id && (
                <p className="mt-1 text-sm text-red-600">{errors.supplier_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Date *
              </label>
              <input
                type="date"
                {...register('order_date', { required: 'Order date is required' })}
                className="input-field"
              />
              {errors.order_date && (
                <p className="mt-1 text-sm text-red-600">{errors.order_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Date
              </label>
              <input
                type="date"
                {...register('required_date')}
                className="input-field"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Terms
              </label>
              <select {...register('payment_terms')} className="input-field">
                <option value="">Select payment terms</option>
                <option value="NET_30">NET 30</option>
                <option value="NET_60">NET 60</option>
                <option value="NET_90">NET 90</option>
                <option value="COD">Cash on Delivery</option>
                <option value="ADVANCE">Advance Payment</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="input-field"
                placeholder="Additional notes or special instructions..."
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
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
            {fields.map((field, index) => {
              const selectedProduct = getProductById(watchedItems[index]?.product_id)
              
              return (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product *
                      </label>
                      <select
                        {...register(`items.${index}.product_id` as const, {
                          required: 'Product is required'
                        })}
                        className="input-field"
                      >
                        <option value="">Select product</option>
                        {products?.products?.filter((p: any) => p.is_purchasable && p.is_active).map((product: any) => (
                          <option key={product.id} value={product.id}>
                            {product.code} - {product.name}
                          </option>
                        ))}
                      </select>
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
                      {selectedProduct && (
                        <p className="text-xs text-gray-500 mt-1">{selectedProduct.primary_uom}</p>
                      )}
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.total')}</label>
                      <div className="input-field bg-gray-50">
                        Rp {((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unit_price || 0)).toLocaleString()}
                      </div>
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

                  {/* Product Info */}
                  {selectedProduct && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-blue-600">Category:</span>
                          <p className="font-medium">{selectedProduct.category || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-blue-600">Material Type:</span>
                          <p className="font-medium">{selectedProduct.material_type?.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <span className="text-blue-600">Standard Cost:</span>
                          <p className="font-medium">Rp {selectedProduct.cost?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Order Summary */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span>Rp {calculateTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/app/purchasing/purchase-orders')}
            className="btn-secondary"
            disabled={isLoading}
          >{t('common.cancel')}</button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Purchase Order'}
          </button>
        </div>
      </form>

      {/* Quick Tips */}
      <div className="card p-4 bg-green-50 border border-green-200">
        <h4 className="font-medium text-green-900 mb-2">💡 Purchasing Tips</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Verify supplier information and payment terms before creating PO</li>
          <li>• Check current market prices for accurate cost estimation</li>
          <li>• Set realistic required dates considering supplier lead times</li>
          <li>• Only select products marked as "purchasable" in product master</li>
        </ul>
      </div>
    </div>
  )
}
