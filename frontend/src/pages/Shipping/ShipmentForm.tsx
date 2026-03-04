import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  PlusIcon,
  TrashIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import {
  useGetSalesOrdersQuery,
  useGetCustomersQuery
} from '../../services/api';
interface ShipmentFormData {
  sales_order_ids?: number[]
  customer_id?: number
  shipping_date: string
  expected_delivery_date?: string
  shipping_method: string
  carrier?: string
  tracking_number?: string
  driver_name?: string
  driver_phone?: string
  vehicle_number?: string
  vehicle_type?: string
  notes?: string
  items: {
    product_name: string
    quantity: number
    unit: string
    weight_kg?: number
    dimensions?: string
  }[]
}

export default function ShipmentForm() {
    const { t } = useLanguage();

const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  
  const { data: salesOrders } = useGetSalesOrdersQuery({})
  const { data: customers } = useGetCustomersQuery({})
  
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<ShipmentFormData>({
    defaultValues: {
      shipping_date: new Date().toISOString().split('T')[0],
      shipping_method: 'company_vehicle',
      items: [{ product_name: '', quantity: 1, unit: 'PCS', weight_kg: 0, dimensions: '' }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const shippingMethods = [
    { value: 'company_vehicle', label: 'Company Vehicle' },
    { value: 'third_party', label: 'Third Party Courier' },
    { value: 'customer_pickup', label: 'Customer Pickup' },
    { value: 'express', label: 'Express Delivery' },
    { value: 'standard', label: 'Standard Delivery' }
  ]

  const vehicleTypes = [
    { value: 'pickup', label: 'Pickup Truck' },
    { value: 'van', label: 'Van' },
    { value: 'truck', label: 'Truck' },
    { value: 'container', label: 'Container Truck' },
    { value: 'motorcycle', label: 'Motorcycle' }
  ]

  const carriers = [
    { value: 'jne', label: 'JNE' },
    { value: 'tiki', label: 'TIKI' },
    { value: 'pos', label: 'Pos Indonesia' },
    { value: 'j_t', label: 'J&T Express' },
    { value: 'sicepat', label: 'SiCepat' },
    { value: 'anteraja', label: 'AnterAja' },
    { value: 'ninja', label: 'Ninja Express' }
  ]

  const watchedShippingMethod = watch('shipping_method')

  const onSubmit = async (data: ShipmentFormData) => {
    setIsLoading(true)
    try {
      // Validate items
      const validItems = data.items.filter(item => 
        item.product_name && item.quantity > 0
      )

      if (validItems.length === 0) {
        toast.error('Please add at least one valid item')
        return
      }

      await createShipment({
        ...data,
        customer_id: data.customer_id ? parseInt(data.customer_id.toString()) : undefined,
        sales_order_ids: data.sales_order_ids?.map(id => parseInt(id.toString())),
        items: validItems.map(item => ({
          ...item,
          quantity: parseFloat(item.quantity.toString()),
          weight_kg: item.weight_kg ? parseFloat(item.weight_kg.toString()) : undefined
        }))
      }).unwrap()
      
      toast.success('Shipment created successfully!')
      navigate('/app/shipping/orders')
    } catch (error: any) {
      toast.error(error.data?.error || 'Failed to create shipment')
    } finally {
      setIsLoading(false)
    }
  }

  const addItem = () => {
    append({ product_name: '', quantity: 1, unit: 'PCS', weight_kg: 0, dimensions: '' })
  }

  const selectedCustomer = customers?.customers?.find((c: any) => c.id == watch('customer_id'))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Shipment</h1>
          <p className="text-gray-600">Create a new shipment for delivery</p>
        </div>
        <button
          onClick={() => navigate('/app/shipping/orders')}
          className="btn-secondary"
        >
          Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Shipment Information */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Shipment Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <select
                {...register('customer_id')}
                className="input-field"
              >
                <option value="">Select customer (optional)</option>
                {customers?.customers?.map((customer: any) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.code} - {customer.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Related Sales Orders
              </label>
              <select
                {...register('sales_order_ids')}
                multiple
                className="input-field"
              >
                {salesOrders?.orders?.filter((so: any) => so.status === 'ready').map((order: any) => (
                  <option key={order.id} value={order.id}>
                    {order.order_number} - {order.customer_name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple orders</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Date *
              </label>
              <input
                type="date"
                {...register('shipping_date', { required: 'Shipping date is required' })}
                className="input-field"
              />
              {errors.shipping_date && (
                <p className="mt-1 text-sm text-red-600">{errors.shipping_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Delivery Date
              </label>
              <input
                type="date"
                {...register('expected_delivery_date')}
                className="input-field"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Method *
              </label>
              <select
                {...register('shipping_method', { required: 'Shipping method is required' })}
                className="input-field"
              >
                {shippingMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            {watchedShippingMethod === 'third_party' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Courier/Carrier
                </label>
                <select {...register('carrier')} className="input-field">
                  <option value="">Select carrier</option>
                  {carriers.map((carrier) => (
                    <option key={carrier.value} value={carrier.value}>
                      {carrier.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tracking Number
              </label>
              <input
                type="text"
                {...register('tracking_number')}
                className="input-field"
                placeholder="Enter tracking number"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Notes
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="input-field"
                placeholder="Special instructions, handling requirements, etc..."
              />
            </div>
          </div>

          {/* Customer Info Display */}
          {selectedCustomer && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Delivery Address</h4>
              <div className="text-sm text-blue-800">
                <p className="font-medium">{selectedCustomer.company_name}</p>
                <p>{selectedCustomer.address || 'No address on file'}</p>
                <p>{selectedCustomer.city} {selectedCustomer.postal_code}</p>
                <p>Contact: {selectedCustomer.contact_person} - {selectedCustomer.phone}</p>
              </div>
            </div>
          )}
        </div>

        {/* Vehicle & Driver Information */}
        {(watchedShippingMethod === 'company_vehicle' || watchedShippingMethod === 'express') && (
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              Vehicle & Driver Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver Name
                </label>
                <input
                  type="text"
                  {...register('driver_name')}
                  className="input-field"
                  placeholder="Driver full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver Phone
                </label>
                <input
                  type="tel"
                  {...register('driver_phone')}
                  className="input-field"
                  placeholder="+62-xxx-xxxx-xxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  {...register('vehicle_number')}
                  className="input-field"
                  placeholder="License plate number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Type
                </label>
                <select {...register('vehicle_type')} className="input-field">
                  <option value="">Select vehicle type</option>
                  {vehicleTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Items to Ship */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Items to Ship</h3>
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
                      Product Name *
                    </label>
                    <input
                      type="text"
                      {...register(`items.${index}.product_name` as const, {
                        required: 'Product name is required'
                      })}
                      className="input-field"
                      placeholder="Product or item description"
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
                    </label>
                    <select {...register(`items.${index}.unit` as const)} className="input-field">
                      <option value="PCS">PCS</option>
                      <option value="BOX">BOX</option>
                      <option value="PACK">PACK</option>
                      <option value="CARTON">CARTON</option>
                      <option value="KG">KG</option>
                      <option value="TON">TON</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`items.${index}.weight_kg` as const)}
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

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dimensions (L x W x H)
                  </label>
                  <input
                    type="text"
                    {...register(`items.${index}.dimensions` as const)}
                    className="input-field"
                    placeholder="e.g., 50cm x 30cm x 20cm"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Shipping Summary */}
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
              <div>
                <span className="text-gray-600">Total Items:</span>
                <p className="font-medium">{fields.length}</p>
              </div>
              <div>
                <span className="text-gray-600">Total Weight:</span>
                <p className="font-medium">
                  {watch('items')?.reduce((total, item) => total + (parseFloat(item.weight_kg?.toString() || '0')), 0).toFixed(2)} kg
                </p>
              </div>
              <div>
                <span className="text-gray-600">Shipping Method:</span>
                <p className="font-medium">
                  {shippingMethods.find(m => m.value === watchedShippingMethod)?.label}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/app/shipping/orders')}
            className="btn-secondary"
            disabled={isLoading}
          >{t('common.cancel')}</button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Shipment'}
          </button>
        </div>
      </form>

      {/* Shipping Tips */}
      <div className="card p-4 bg-orange-50 border border-orange-200">
        <h4 className="font-medium text-orange-900 mb-2">🚚 Shipping Tips</h4>
        <ul className="text-sm text-orange-800 space-y-1">
          <li>• Verify delivery address and contact information before shipping</li>
          <li>• Ensure proper packaging for fragile or sensitive items</li>
          <li>• Provide tracking numbers to customers for transparency</li>
          <li>• Consider insurance for high-value shipments</li>
          <li>• Schedule deliveries during business hours when possible</li>
        </ul>
      </div>
    </div>
  )
}
