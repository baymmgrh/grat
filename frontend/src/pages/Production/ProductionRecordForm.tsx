import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import { useForm } from 'react-hook-form'
import {
  ArrowLeftIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig'
import LoadingSpinner from '../../components/Common/LoadingSpinner'
interface ProductionRecordFormData {
  work_order_id: number
  product_id?: number
  machine_id?: number
  operator_id?: number
  production_date: string
  shift: string
  quantity_produced: number
  quantity_good: number
  quantity_scrap: number
  uom: string
  downtime_minutes: number
  notes?: string
}

interface WorkOrder {
  id: number
  wo_number: string
  product_id: number
  product_name: string
}

interface Machine {
  id: number
  name: string
  code: string
}

interface User {
  id: number
  name: string
}

interface Product {
  id: number
  code: string
  name: string
}

const ProductionRecordForm = () => {
    const { t } = useLanguage();

const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  
  const [isLoading, setIsLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [operators, setOperators] = useState<User[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProductionRecordFormData>({
    defaultValues: {
      production_date: new Date().toISOString().split('T')[0],
      shift: 'day',
      quantity_produced: 0,
      quantity_good: 0,
      quantity_scrap: 0,
      uom: 'pieces',
      downtime_minutes: 0
    }
  })

  const quantityProduced = watch('quantity_produced')
  const quantityGood = watch('quantity_good')
  const selectedWorkOrderId = watch('work_order_id')

  useEffect(() => {
    loadFormData()
    if (isEdit && id) {
      loadRecord()
    }
  }, [isEdit, id])

  // Close product dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.product-dropdown-container')) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set default product when work order changes
  useEffect(() => {
    if (selectedWorkOrderId) {
      const wo = workOrders.find(w => w.id === Number(selectedWorkOrderId));
      if (wo) {
        setSelectedProduct({ id: wo.product_id, code: '', name: wo.product_name });
        setValue('product_id', wo.product_id);
      }
    }
  }, [selectedWorkOrderId, workOrders]);

  const loadFormData = async () => {
    try {
      setLoadingData(true)
      const [workOrdersRes, machinesRes, operatorsRes, productsRes] = await Promise.all([
        axiosInstance.get('/api/production/work-orders?status=in_progress'),
        axiosInstance.get('/api/production/machines?is_active=true'),
        axiosInstance.get('/api/auth/users'),
        axiosInstance.get('/api/products?status=active&per_page=500')
      ])
      
      setWorkOrders(workOrdersRes.data.work_orders || [])
      setMachines(machinesRes.data.machines || [])
      setOperators(operatorsRes.data.users || [])
      setProducts(productsRes.data.products || [])
    } catch (error) {
      console.error('Error loading form data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const loadRecord = async () => {
    try {
      const response = await axiosInstance.get(`/api/production/production-records/${id}`)
      const record = response.data.record
      
      // Populate form fields
      Object.keys(record).forEach((key) => {
        if (record[key] !== null && record[key] !== undefined) {
          if (key === 'production_date') {
            setValue(key, record[key].split('T')[0])
          } else {
            setValue(key as keyof ProductionRecordFormData, record[key])
          }
        }
      })
    } catch (error) {
      console.error('Error loading record:', error)
      alert('Failed to load production record')
    }
  }

  // Product selection handler
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setValue('product_id', product.id);
    setProductSearch('');
    setShowProductDropdown(false);
  };

  // Filter products based on search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.code.toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 10);

  // Get selected work order
  const selectedWO = workOrders.find(w => w.id === Number(selectedWorkOrderId));

  const shifts = [
    { value: 'day', label: 'Day Shift (07:00-15:00)' },
    { value: 'afternoon', label: 'Afternoon Shift (15:00-23:00)' },
    { value: 'night', label: 'Night Shift (23:00-07:00)' }
  ]

  const onSubmit = async (data: ProductionRecordFormData) => {
    setIsLoading(true)
    try {
      const payload = {
        ...data,
        work_order_id: parseInt(data.work_order_id.toString()),
        product_id: data.product_id ? parseInt(data.product_id.toString()) : null,
        machine_id: data.machine_id ? parseInt(data.machine_id.toString()) : null,
        operator_id: data.operator_id ? parseInt(data.operator_id.toString()) : null,
        quantity_produced: parseFloat(data.quantity_produced.toString()),
        quantity_good: parseFloat(data.quantity_good.toString()),
        quantity_scrap: parseFloat(data.quantity_scrap.toString()),
        downtime_minutes: parseInt(data.downtime_minutes.toString())
      }

      if (isEdit) {
        await axiosInstance.put(`/api/production/production-records/${id}`, payload)
        alert('Production record updated successfully!')
      } else {
        await axiosInstance.post('/api/production/production-records', payload)
        alert('Production record created successfully!')
      }
      
      navigate('/app/production/records')
    } catch (error: any) {
      console.error('Error saving record:', error)
      alert(error.response?.data?.error || 'Failed to save production record')
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingData) {
    return <LoadingSpinner />
  }

  const efficiency = quantityProduced > 0 ? (quantityGood / quantityProduced * 100) : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/production/records')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? '📝 Edit Production Record' : '📊 New Production Record'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit ? 'Update production record' : 'Record production data'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Order *
              </label>
              <select
                {...register('work_order_id', { required: 'Work order is required' })}
                className="input"
              >
                <option value="">Select work order</option>
                {workOrders.map((wo) => (
                  <option key={wo.id} value={wo.id}>
                    {wo.wo_number} - {wo.product_name}
                  </option>
                ))}
              </select>
              {errors.work_order_id && (
                <p className="mt-1 text-sm text-red-600">{errors.work_order_id.message}</p>
              )}
            </div>

            {/* Product Selection - shows after WO is selected */}
            {selectedWorkOrderId && (
              <div className="product-dropdown-container">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produk
                  <span className="text-xs text-gray-500 font-normal ml-2">(Default: produk WO)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={showProductDropdown ? productSearch : (selectedProduct ? `${selectedProduct.code ? selectedProduct.code + ' - ' : ''}${selectedProduct.name}` : '')}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    placeholder="Cari produk..."
                    className="input"
                  />
                  {showProductDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {/* Default WO Product */}
                      {selectedWO && (
                        <button
                          type="button"
                          onClick={() => handleProductSelect({ id: selectedWO.product_id, code: '', name: selectedWO.product_name })}
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-200 bg-blue-50"
                        >
                          <span className="text-xs text-blue-600 font-medium">Default WO:</span>
                          <span className="block text-sm font-medium">{selectedWO.product_name}</span>
                        </button>
                      )}
                      {/* Search Results */}
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleProductSelect(product)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-0"
                          >
                            <span className="text-xs text-gray-500">{product.code}</span>
                            <span className="block text-sm">{product.name}</span>
                          </button>
                        ))
                      ) : productSearch && (
                        <div className="px-3 py-2 text-sm text-gray-500">Tidak ada produk ditemukan</div>
                      )}
                    </div>
                  )}
                </div>
                {selectedProduct && selectedWO && selectedProduct.id !== selectedWO.product_id && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ Produk berbeda dari WO default ({selectedWO.product_name})
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('production.machine')}</label>
              <select
                {...register('machine_id')}
                className="input"
              >
                <option value="">Select machine</option>
                {machines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.name} ({machine.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('production.operator')}</label>
              <select
                {...register('operator_id')}
                className="input"
              >
                <option value="">Select operator</option>
                {operators.map((operator) => (
                  <option key={operator.id} value={operator.id}>
                    {operator.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Production Date *
              </label>
              <input
                type="date"
                {...register('production_date', { required: 'Production date is required' })}
                className="input"
              />
              {errors.production_date && (
                <p className="mt-1 text-sm text-red-600">{errors.production_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shift *
              </label>
              <select
                {...register('shift', { required: 'Shift is required' })}
                className="input"
              >
                {shifts.map((shift) => (
                  <option key={shift.value} value={shift.value}>
                    {shift.label}
                  </option>
                ))}
              </select>
              {errors.shift && (
                <p className="mt-1 text-sm text-red-600">{errors.shift.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Production Data */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <ChartBarIcon className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Production Data</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity Produced *
              </label>
              <input
                type="number"
                {...register('quantity_produced', { 
                  required: 'Quantity produced is required',
                  min: { value: 0, message: 'Must be positive' }
                })}
                className="input"
                placeholder="0"
              />
              {errors.quantity_produced && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity_produced.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Good Quantity *
              </label>
              <input
                type="number"
                {...register('quantity_good', { 
                  required: 'Good quantity is required',
                  min: { value: 0, message: 'Must be positive' }
                })}
                className="input"
                placeholder="0"
              />
              {errors.quantity_good && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity_good.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scrap Quantity
              </label>
              <input
                type="number"
                {...register('quantity_scrap', { min: { value: 0, message: 'Must be positive' } })}
                className="input"
                placeholder="0"
              />
              {errors.quantity_scrap && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity_scrap.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit of Measure *
              </label>
              <select
                {...register('uom', { required: 'Unit of measure is required' })}
                className="input"
              >
                <option value="pieces">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="meters">Meters</option>
                <option value="rolls">Rolls</option>
                <option value="boxes">Boxes</option>
              </select>
              {errors.uom && (
                <p className="mt-1 text-sm text-red-600">{errors.uom.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Downtime (minutes)
              </label>
              <input
                type="number"
                {...register('downtime_minutes', { min: { value: 0, message: 'Must be positive' } })}
                className="input"
                placeholder="0"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <div className="text-2xl font-bold text-green-600">
                {efficiency.toFixed(1)}%
              </div>
            </div>

            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="input"
                placeholder="Additional notes about production"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/app/production/records')}
            className="btn-secondary"
          >{t('common.cancel')}</button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? 'Saving...' : isEdit ? 'Update Record' : 'Create Record'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProductionRecordForm
