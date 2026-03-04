import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  useCreateSalesOrderMutation,
  useGetCustomersQuery
} from '../../services/api'
import {
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
interface SalesOrderFormData {
  customer_id: number
  order_date: string
  required_date?: string
  priority?: string
  notes?: string
  items: {
    product_id: number
    quantity: number
    unit_price: number
    discount_percent?: number
  }[]
}

interface BOMInfo {
  [productId: number]: {
    hasBOM: boolean
    bom_number?: string
    version?: number
    total_cost?: number
    items_count?: number
  }
}

interface BOMProduct {
  id: number;
  product_id: number;
  product_code: string;
  product_name: string;
  bom_number: string;
  version: number;
  batch_size: number;
  batch_uom: string;
  total_cost: number;
  total_materials: number;
  pack_per_carton: number;
  // Optional product details
  primary_uom?: string;
  price?: number;
  category?: string;
}

interface MaterialShortage {
  item_name: string;
  item_code: string;
  required_quantity: number;
  available_quantity: number;
  shortage_quantity: number;
  is_critical: boolean;
  supplier_name: string | null;
  lead_time_days: number;
  unit_cost: number;
}

interface MaterialRequirements {
  product_id: number;
  product_name: string;
  quantity: number;
  total_shortage_items: number;
  total_shortage_cost: number;
  shortage_items: MaterialShortage[];
  has_sufficient_stock: boolean;
}

export default function SalesOrderForm() {
    const { t } = useLanguage();

const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [bomProducts, setBomProducts] = useState<BOMProduct[]>([])
  const [bomInfo, setBomInfo] = useState<BOMInfo>({})
  const [materialRequirements, setMaterialRequirements] = useState<MaterialRequirements[]>([])
  const [loadingMRP, setLoadingMRP] = useState(false)
  const [showMRPPanel, setShowMRPPanel] = useState(false)
  
  const { data: customers } = useGetCustomersQuery({})
  const [createOrder] = useCreateSalesOrderMutation()
  
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<SalesOrderFormData>({
    defaultValues: {
      order_date: new Date().toISOString().split('T')[0],
      priority: 'normal',
      items: [{ product_id: 0, quantity: 1, unit_price: 0, discount_percent: 0 }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const watchedItems = watch('items')

  // Fetch BOM products for dropdown
  useEffect(() => {
    fetchBOMProducts()
  }, [])

  const fetchBOMProducts = async () => {
    try {
      const response = await fetch('/api/production/boms?all=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const bomMap: BOMInfo = {}
        const products: BOMProduct[] = []
        
        // Map BOMs to products - only active BOMs
        data.boms?.forEach((bom: any) => {
          if (bom.is_active) {
            bomMap[bom.product_id] = {
              hasBOM: true,
              bom_number: bom.bom_number,
              version: bom.version,
              total_cost: bom.total_cost,
              items_count: bom.total_materials
            }
            products.push({
              id: bom.id,
              product_id: bom.product_id,
              product_code: bom.product_code,
              product_name: bom.product_name,
              bom_number: bom.bom_number,
              version: bom.version,
              batch_size: bom.batch_size,
              batch_uom: bom.batch_uom,
              total_cost: bom.total_cost,
              total_materials: bom.total_materials,
              pack_per_carton: bom.pack_per_carton || 1
            })
          }
        })
        
        setBomInfo(bomMap)
        setBomProducts(products)
      }
    } catch (error) {
      console.error('Error fetching BOM products:', error)
    }
  }

  // Check Material Requirements for all items
  const checkMaterialRequirements = async () => {
    const validItems = watchedItems.filter(item => item.product_id && item.quantity > 0)
    console.log('MRP Check - Valid items:', validItems)
    console.log('MRP Check - BOM Products:', bomProducts)
    
    if (validItems.length === 0) {
      setMaterialRequirements([])
      return
    }

    setLoadingMRP(true)
    setShowMRPPanel(true) // Show panel immediately when checking
    try {
      const requirements: MaterialRequirements[] = []
      
      for (const item of validItems) {
        // Convert to number for comparison since select value is string
        const itemProductId = parseInt(item.product_id.toString())
        const bomProduct = bomProducts.find(p => p.product_id === itemProductId)
        console.log('MRP Check - Looking for product_id:', itemProductId, '(original:', item.product_id, ') Found:', bomProduct)
        if (!bomProduct) continue
        
        // Calculate cartons needed (quantity is in PCS, BOM is per carton)
        const cartonsNeeded = item.quantity / (bomProduct.pack_per_carton || 1)
        console.log('MRP Check - Cartons needed:', cartonsNeeded, 'for BOM ID:', bomProduct.id)
        
        // Fetch shortage analysis
        const url = `/api/production/boms/${bomProduct.id}/shortage-analysis?production_qty=${cartonsNeeded}`
        console.log('MRP Check - Fetching:', url)
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        console.log('MRP Check - Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('MRP Check - Response data:', data)
          requirements.push({
            product_id: bomProduct.product_id,
            product_name: bomProduct.product_name,
            quantity: item.quantity,
            total_shortage_items: data.total_shortage_items || 0,
            total_shortage_cost: data.total_shortage_cost || 0,
            shortage_items: data.shortage_items || [],
            has_sufficient_stock: (data.total_shortage_items || 0) === 0
          })
        } else {
          console.error('MRP Check - Error response:', await response.text())
        }
      }
      
      console.log('MRP Check - Final requirements:', requirements)
      setMaterialRequirements(requirements)
    } catch (error) {
      console.error('Error checking material requirements:', error)
    } finally {
      setLoadingMRP(false)
    }
  }

  // Debounced MRP check when items change
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasValidItems = watchedItems.some(item => item.product_id && item.quantity > 0)
      if (hasValidItems && bomProducts.length > 0) {
        checkMaterialRequirements()
      }
    }, 800)
    
    return () => clearTimeout(timer)
  }, [watchedItems, bomProducts])

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const calculateItemTotal = (index: number) => {
    const item = watchedItems[index]
    if (!item) return 0
    const subtotal = (item.quantity || 0) * (item.unit_price || 0)
    const discount = subtotal * ((item.discount_percent || 0) / 100)
    return subtotal - discount
  }

  const calculateGrandTotal = () => {
    return watchedItems.reduce((total, _, index) => {
      return total + calculateItemTotal(index)
    }, 0)
  }

  const onSubmit = async (data: SalesOrderFormData) => {
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

      const result = await createOrder({
        ...data,
        customer_id: parseInt(data.customer_id.toString()),
        items: validItems.map(item => ({
          ...item,
          product_id: parseInt(item.product_id.toString()),
          quantity: parseFloat(item.quantity.toString()),
          unit_price: parseFloat(item.unit_price.toString()),
          discount_percent: parseFloat((item.discount_percent || 0).toString())
        }))
      }).unwrap()
      
      // Check for material shortage and auto-create PO
      const hasShortage = materialRequirements.some(r => !r.has_sufficient_stock)
      if (hasShortage && result.order_id) {
        try {
          // Collect all shortage items
          const allShortageItems = materialRequirements
            .filter(r => !r.has_sufficient_stock)
            .flatMap(r => r.shortage_items.map(item => ({
              ...item,
              material_id: item.item_code ? undefined : undefined, // Will be resolved by backend
              item_name: item.item_name,
              item_code: item.item_code,
              shortage_quantity: item.shortage_quantity,
              unit_cost: item.unit_cost || 0,
              supplier_name: item.supplier_name
            })))
          
          // Call MRP to create PO
          const poResponse = await fetch('/api/mrp/check-and-create-po', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              items: validItems.map(item => ({
                product_id: parseInt(item.product_id.toString()),
                quantity: parseFloat(item.quantity.toString())
              })),
              reference_type: 'sales_order',
              reference_id: result.order_id,
              reference_number: result.order_number,
              auto_create_po: true
            })
          })
          
          if (poResponse.ok) {
            const poResult = await poResponse.json()
            if (poResult.purchase_orders && poResult.purchase_orders.length > 0) {
              toast.success(
                `${poResult.purchase_orders.length} Purchase Order(s) auto-created for material shortage!`,
                { duration: 5000 }
              )
            }
          }
        } catch (poError) {
          console.error('Error creating PO from shortage:', poError)
          toast.error('Warning: Could not auto-create Purchase Order for shortage')
        }
      }
      
      // Check if workflow was created
      if (result.workflow_id) {
        toast.success(`Sales Order created and submitted for approval! (Workflow ID: ${result.workflow_id})`)
        // Optionally navigate to approval page
        if (window.confirm('Order submitted for approval. View approval workflow?')) {
          navigate(`/app/approval/${result.workflow_id}`)
        } else {
          navigate('/app/sales/orders')
        }
      } else {
        toast.success('Sales Order created successfully!')
        navigate('/app/sales/orders')
      }
    } catch (error: any) {
      toast.error(error.data?.error || 'Failed to create sales order')
    } finally {
      setIsLoading(false)
    }
  }

  const addItem = () => {
    append({ product_id: 0, quantity: 1, unit_price: 0, discount_percent: 0 })
  }

  const getProductById = (productId: number | string) => {
    const id = parseInt(productId?.toString() || '0')
    return bomProducts.find((p) => p.product_id === id)
  }

  const getProductBOMInfo = (productId: number | string) => {
    const id = parseInt(productId?.toString() || '0')
    return bomInfo[id] || { hasBOM: false }
  }

  const selectedCustomer = customers?.customers?.find((c: any) => c.id == watch('customer_id'))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Sales Order</h1>
          <p className="text-gray-600">Create a new sales order for customer</p>
        </div>
        <button
          onClick={() => navigate('/app/sales/orders')}
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
                Customer *
              </label>
              <select
                {...register('customer_id', { required: 'Customer is required' })}
                className="input-field"
              >
                <option value="">Select a customer</option>
                {customers?.customers?.map((customer: any) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.code} - {customer.company_name}
                  </option>
                ))}
              </select>
              {errors.customer_id && (
                <p className="mt-1 text-sm text-red-600">{errors.customer_id.message}</p>
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
              </label>
              <select {...register('priority')} className="input-field">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
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

          {/* Customer Info Display */}
          {selectedCustomer && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Customer Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Type:</span>
                  <p className="font-medium">{selectedCustomer.customer_type?.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="text-blue-600">Credit Limit:</span>
                  <p className="font-medium">Rp {selectedCustomer.credit_limit?.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <span className="text-blue-600">Payment Terms:</span>
                  <p className="font-medium">{selectedCustomer.payment_terms_days || 30} days</p>
                </div>
                <div>
                  <span className="text-blue-600">Contact:</span>
                  <p className="font-medium">{selectedCustomer.contact_person || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowMRPPanel(true);
                  checkMaterialRequirements();
                }}
                disabled={loadingMRP}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {loadingMRP ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <ClipboardDocumentListIcon className="h-4 w-4" />
                )}
                Cek Material
              </button>
              <button
                type="button"
                onClick={addItem}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Add Item
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => {
              const selectedProduct = getProductById(watchedItems[index]?.product_id)
              
              return (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
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
                        {bomProducts.map((product) => (
                          <option key={product.product_id} value={product.product_id}>
                            {product.product_code} - {product.product_name}
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
                        placeholder={selectedProduct?.price?.toString() || '0.00'}
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.total')}</label>
                      <div className="input-field bg-gray-50">
                        Rp {calculateItemTotal(index).toLocaleString()}
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
                    <div className="mt-3 space-y-2">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-green-600">Category:</span>
                            <p className="font-medium">{selectedProduct.category || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-green-600">Stock Available:</span>
                            <p className="font-medium">Check inventory</p>
                          </div>
                          <div>
                            <span className="text-green-600">List Price:</span>
                            <p className="font-medium">Rp {selectedProduct.price?.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* BOM Availability Indicator */}
                      {(() => {
                        const bomData = getProductBOMInfo(selectedProduct.id)
                        return bomData.hasBOM ? (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                              <span className="text-sm font-medium text-blue-900">
                                BOM Available - Production Ready
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-xs text-blue-700">
                              <div>
                                <span className="font-medium">BOM:</span> {bomData.bom_number} (v{bomData.version})
                              </div>
                              <div>
                                <span className="font-medium">Materials:</span> {bomData.items_count} items
                              </div>
                              <div>
                                <span className="font-medium">BOM Cost:</span> {formatRupiah(bomData.total_cost || 0)}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                              <span className="text-sm font-medium text-yellow-900">
                                No BOM - Manual production planning required
                              </span>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* MRP Material Requirements Panel - Inside Order Items Card */}
          {(materialRequirements.length > 0 || loadingMRP || showMRPPanel) && (
            <div className="mt-6 pt-4 border-t border-orange-200 bg-orange-50 -mx-6 px-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                MRP - Material Requirements Check
              </h3>
              <button
                type="button"
                onClick={() => setShowMRPPanel(!showMRPPanel)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showMRPPanel ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            {loadingMRP ? (
              <div className="flex items-center gap-2 text-gray-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                Checking material availability...
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className={`p-4 rounded-lg ${
                    materialRequirements.every(r => r.has_sufficient_stock) 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className="text-sm text-gray-600">Material Status</p>
                    <p className={`text-lg font-bold ${
                      materialRequirements.every(r => r.has_sufficient_stock) 
                        ? 'text-green-700' 
                        : 'text-red-700'
                    }`}>
                      {materialRequirements.every(r => r.has_sufficient_stock) 
                        ? '✓ All Available' 
                        : '⚠ Shortage Detected'}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-gray-600">Total Shortage Items</p>
                    <p className="text-lg font-bold text-orange-700">
                      {materialRequirements.reduce((sum, r) => sum + r.total_shortage_items, 0)} items
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-600">Est. Shortage Cost</p>
                    <p className="text-lg font-bold text-blue-700">
                      {formatRupiah(materialRequirements.reduce((sum, r) => sum + r.total_shortage_cost, 0))}
                    </p>
                  </div>
                </div>

                {/* Detailed Requirements */}
                {showMRPPanel && materialRequirements.map((req, idx) => (
                  <div key={idx} className="mb-4 border rounded-lg overflow-hidden">
                    <div className={`px-4 py-3 flex items-center justify-between ${
                      req.has_sufficient_stock ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <div className="flex items-center gap-2">
                        {req.has_sufficient_stock ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        ) : (
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                        )}
                        <span className="font-medium">{req.product_name}</span>
                        <span className="text-sm text-gray-600">({req.quantity.toLocaleString()} pcs)</span>
                      </div>
                      <span className={`text-sm font-medium ${
                        req.has_sufficient_stock ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {req.has_sufficient_stock ? 'Stock OK' : `${req.total_shortage_items} shortage`}
                      </span>
                    </div>
                    
                    {!req.has_sufficient_stock && req.shortage_items.length > 0 && (
                      <div className="p-4 bg-white">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-500 border-b">
                              <th className="pb-2">Material</th>
                              <th className="pb-2 text-right">Required</th>
                              <th className="pb-2 text-right">Available</th>
                              <th className="pb-2 text-right">Shortage</th>
                              <th className="pb-2">Supplier</th>
                            </tr>
                          </thead>
                          <tbody>
                            {req.shortage_items.map((item, i) => (
                              <tr key={i} className={`border-b last:border-0 ${item.is_critical ? 'bg-red-50' : ''}`}>
                                <td className="py-2">
                                  <span className="font-medium">{item.item_name}</span>
                                  {item.is_critical && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-red-600 text-white text-xs rounded">CRITICAL</span>
                                  )}
                                  <p className="text-xs text-gray-500">{item.item_code}</p>
                                </td>
                                <td className="py-2 text-right">{item.required_quantity.toLocaleString()}</td>
                                <td className="py-2 text-right">{item.available_quantity.toLocaleString()}</td>
                                <td className="py-2 text-right font-medium text-red-600">
                                  {item.shortage_quantity.toLocaleString()}
                                </td>
                                <td className="py-2">
                                  {item.supplier_name || '-'}
                                  {item.lead_time_days > 0 && (
                                    <p className="text-xs text-gray-500">{item.lead_time_days} days</p>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}

                {/* Action Info */}
                {!materialRequirements.every(r => r.has_sufficient_stock) && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800">Material Shortage Detected</p>
                        <p className="text-sm text-amber-700 mt-1">
                          When you submit this order, the system will automatically create a <strong>Purchase Requisition</strong> for 
                          the missing materials. The order will proceed to production once materials are received.
                        </p>
                        <p className="text-sm text-amber-600 mt-2">
                          Workflow: Sales Order → Purchase Requisition → PO → GRN → Work Order → QC → Shipping
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            </div>
          )}

          {/* Order Summary */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between items-center text-lg font-semibold">
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
            onClick={() => navigate('/app/sales/orders')}
            className="btn-secondary"
            disabled={isLoading}
          >{t('common.cancel')}</button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Sales Order'}
          </button>
        </div>
      </form>

      {/* Sales Tips */}
      <div className="card p-4 bg-blue-50 border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">💡 Sales Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Verify customer credit limit before processing large orders</li>
          <li>• Check product availability in inventory before confirming orders</li>
          <li>• Set realistic delivery dates considering production schedules</li>
          <li>• Apply appropriate discounts based on customer type and volume</li>
        </ul>
      </div>
    </div>
  )
}
