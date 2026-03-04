import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast'
import {
  useGetSalesForecastQuery,
  useCreateSalesForecastMutation,
  useUpdateSalesForecastMutation,
  useGetCustomersQuery,
  useGetProductsQuery
} from '../../services/api'
import {
  CalendarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
interface ForecastFormData {
  forecast_number: string
  name: string
  forecast_type: 'monthly' | 'quarterly' | 'yearly'
  period_start: string
  period_end: string
  customer_id: number | null
  product_id: number | null
  best_case: number
  most_likely: number
  worst_case: number
  committed: number
  confidence_level: 'high' | 'medium' | 'low'
  methodology: string
  required_manpower: number
  shifts_per_day: number
  notes: string
}

export default function SalesForecastForm() {
    const { t } = useLanguage();

const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState<ForecastFormData>({
    forecast_number: '',
    name: '',
    forecast_type: 'monthly',
    period_start: '',
    period_end: '',
    customer_id: null,
    product_id: null,
    best_case: 0,
    most_likely: 0,
    worst_case: 0,
    committed: 0,
    confidence_level: 'medium',
    methodology: 'pipeline',
    required_manpower: 0,
    shifts_per_day: 1,
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [bomData, setBomData] = useState<any>(null)
  const [loadingBOM, setLoadingBOM] = useState(false)
  const [showMaterialRequirements, setShowMaterialRequirements] = useState(false)
  
  // MRP Shortage Analysis
  const [shortageAnalysis, setShortageAnalysis] = useState<{
    total_shortage_items: number;
    total_shortage_cost: number;
    shortage_items: Array<{
      item_name: string;
      item_code: string;
      required_quantity: number;
      available_quantity: number;
      shortage_quantity: number;
      is_critical: boolean;
      supplier_name: string | null;
      lead_time_days: number;
    }>;
  } | null>(null)
  const [loadingShortage, setLoadingShortage] = useState(false)

  const { data: forecastData, isLoading: forecastLoading } = useGetSalesForecastQuery(
    Number(id), 
    { skip: !isEdit }
  )
  
  const { data: customersData } = useGetCustomersQuery({})
  const { data: productsData } = useGetProductsQuery({})

  // Fetch BOM when product is selected
  useEffect(() => {
    if (formData.product_id) {
      fetchBOMForProduct(formData.product_id)
    } else {
      setBomData(null)
    }
  }, [formData.product_id])

  const fetchBOMForProduct = async (productId: number) => {
    try {
      setLoadingBOM(true)
      const response = await fetch(`/api/boms?product_id=${productId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const activeBOM = data.boms?.find((b: any) => b.product_id === productId && b.is_active)
        
        if (activeBOM) {
          const bomDetailResponse = await fetch(`/api/boms/${activeBOM.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          
          if (bomDetailResponse.ok) {
            const bomDetail = await bomDetailResponse.json()
            setBomData(bomDetail.bom)
            setShowMaterialRequirements(true)
          }
        } else {
          setBomData(null)
        }
      }
    } catch (error) {
      console.error('Error fetching BOM:', error)
    } finally {
      setLoadingBOM(false)
    }
  }

  const calculateMaterialRequirement = (bomItemQty: number, forecastQty: number) => {
    if (!bomData) return 0
    // Calculate cartons needed (forecast is in PCS, BOM is per carton)
    const packPerCarton = bomData.pack_per_carton || 1
    const cartonsNeeded = forecastQty / packPerCarton
    const batches = cartonsNeeded / bomData.batch_size
    return bomItemQty * batches
  }

  // Fetch shortage analysis when BOM and quantity change
  const fetchShortageAnalysis = async () => {
    if (!bomData || !formData.most_likely || formData.most_likely <= 0) {
      setShortageAnalysis(null)
      return
    }
    
    try {
      setLoadingShortage(true)
      const packPerCarton = bomData.pack_per_carton || 1
      const cartonsNeeded = formData.most_likely / packPerCarton
      
      const response = await fetch(
        `/api/production/boms/${bomData.id}/shortage-analysis?production_qty=${cartonsNeeded}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setShortageAnalysis(data)
      }
    } catch (error) {
      console.error('Error fetching shortage analysis:', error)
      setShortageAnalysis(null)
    } finally {
      setLoadingShortage(false)
    }
  }

  // Debounced shortage analysis
  useEffect(() => {
    const timer = setTimeout(() => {
      if (bomData && formData.most_likely > 0) {
        fetchShortageAnalysis()
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [bomData, formData.most_likely])

  const formatNumber = (num: number, decimals: number = 4) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    }).format(num)
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }
  
  const [createForecast, { isLoading: creating }] = useCreateSalesForecastMutation()
  const [updateForecast, { isLoading: updating }] = useUpdateSalesForecastMutation()

  useEffect(() => {
    if (forecastData && isEdit) {
      setFormData({
        forecast_number: forecastData.forecast_number || '',
        name: forecastData.name || '',
        forecast_type: forecastData.forecast_type || 'monthly',
        period_start: forecastData.period_start || '',
        period_end: forecastData.period_end || '',
        customer_id: forecastData.customer_id || null,
        product_id: forecastData.product_id || null,
        best_case: forecastData.best_case || 0,
        most_likely: forecastData.most_likely || 0,
        worst_case: forecastData.worst_case || 0,
        committed: forecastData.committed || 0,
        confidence_level: forecastData.confidence_level || 'medium',
        methodology: forecastData.methodology || 'pipeline',
        required_manpower: forecastData.required_manpower || 0,
        shifts_per_day: forecastData.shifts_per_day || 1,
        notes: forecastData.notes || ''
      })
    }
  }, [forecastData, isEdit])

  // Auto-generate forecast number
  useEffect(() => {
    if (!isEdit && !formData.forecast_number) {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      setFormData(prev => ({
        ...prev,
        forecast_number: `FC-${year}${month}-${random}`
      }))
    }
  }, [isEdit, formData.forecast_number])

  // Auto-calculate period end based on type and start date
  useEffect(() => {
    if (formData.period_start && formData.forecast_type) {
      const startDate = new Date(formData.period_start)
      let endDate = new Date(startDate)

      switch (formData.forecast_type) {
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1)
          endDate.setDate(endDate.getDate() - 1)
          break
        case 'quarterly':
          endDate.setMonth(endDate.getMonth() + 3)
          endDate.setDate(endDate.getDate() - 1)
          break
        case 'yearly':
          endDate.setFullYear(endDate.getFullYear() + 1)
          endDate.setDate(endDate.getDate() - 1)
          break
      }

      setFormData(prev => ({
        ...prev,
        period_end: endDate.toISOString().split('T')[0]
      }))
    }
  }, [formData.period_start, formData.forecast_type])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Forecast name is required'
    }

    if (!formData.period_start) {
      newErrors.period_start = 'Period start date is required'
    }

    if (!formData.period_end) {
      newErrors.period_end = 'Period end date is required'
    }

    if (formData.period_start && formData.period_end && 
        new Date(formData.period_start) >= new Date(formData.period_end)) {
      newErrors.period_end = 'End date must be after start date'
    }

    if (formData.most_likely <= 0) {
      newErrors.most_likely = 'Most likely value must be greater than 0'
    }

    if (formData.best_case < formData.most_likely) {
      newErrors.best_case = 'Best case must be greater than or equal to most likely'
    }

    if (formData.worst_case > formData.most_likely) {
      newErrors.worst_case = 'Worst case must be less than or equal to most likely'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting')
      return
    }

    try {
      if (isEdit) {
        await updateForecast({ id: Number(id), ...formData }).unwrap()
        toast.success('Forecast updated successfully')
      } else {
        await createForecast(formData).unwrap()
        toast.success('Forecast created successfully')
      }
      navigate('/app/sales/forecasts')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to save forecast')
    }
  }

  const handleInputChange = (field: keyof ForecastFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (forecastLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Sales Forecast' : 'Create Sales Forecast'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update forecast details' : 'Create a new sales forecast for planning'}
          </p>
        </div>
        <button
          onClick={() => navigate('/app/sales/forecasts')}
          className="btn-secondary"
        >
          ← Back to Forecasts
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forecast Number *
                  </label>
                  <input
                    type="text"
                    value={formData.forecast_number}
                    onChange={(e) => handleInputChange('forecast_number', e.target.value)}
                    className={`input ${errors.forecast_number ? 'border-red-500' : ''}`}
                    placeholder="FC-202410-001"
                  />
                  {errors.forecast_number && (
                    <p className="text-red-500 text-sm mt-1">{errors.forecast_number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forecast Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`input ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Q4 2024 Sales Forecast"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forecast Type *
                  </label>
                  <select
                    value={formData.forecast_type}
                    onChange={(e) => handleInputChange('forecast_type', e.target.value)}
                    className="input"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                  </label>
                  <select
                    value={formData.methodology}
                    onChange={(e) => handleInputChange('methodology', e.target.value)}
                    className="input"
                  >
                    <option value="pipeline">Pipeline Analysis</option>
                    <option value="historical">Historical Data</option>
                    <option value="quota">Quota Based</option>
                    <option value="market">Market Analysis</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Period & Scope */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Period & Scope
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period Start *
                  </label>
                  <input
                    type="date"
                    value={formData.period_start}
                    onChange={(e) => handleInputChange('period_start', e.target.value)}
                    className={`input ${errors.period_start ? 'border-red-500' : ''}`}
                  />
                  {errors.period_start && (
                    <p className="text-red-500 text-sm mt-1">{errors.period_start}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period End *
                  </label>
                  <input
                    type="date"
                    value={formData.period_end}
                    onChange={(e) => handleInputChange('period_end', e.target.value)}
                    className={`input ${errors.period_end ? 'border-red-500' : ''}`}
                  />
                  {errors.period_end && (
                    <p className="text-red-500 text-sm mt-1">{errors.period_end}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer (Optional)
                  </label>
                  <select
                    value={formData.customer_id || ''}
                    onChange={(e) => handleInputChange('customer_id', e.target.value ? Number(e.target.value) : null)}
                    className="input"
                  >
                    <option value="">All Customers</option>
                    {customersData?.customers?.map((customer: any) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.company_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product (Optional)
                  </label>
                  <select
                    value={formData.product_id || ''}
                    onChange={(e) => handleInputChange('product_id', e.target.value ? Number(e.target.value) : null)}
                    className="input"
                  >
                    <option value="">All Products</option>
                    {productsData?.products?.map((product: any) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Forecast Values */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5" />
                Forecast Values
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Most Likely * (Base Forecast)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.most_likely}
                    onChange={(e) => handleInputChange('most_likely', Number(e.target.value))}
                    className={`input ${errors.most_likely ? 'border-red-500' : ''}`}
                    placeholder="100000"
                  />
                  {errors.most_likely && (
                    <p className="text-red-500 text-sm mt-1">{errors.most_likely}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Committed (Confirmed)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.committed}
                    onChange={(e) => handleInputChange('committed', Number(e.target.value))}
                    className="input"
                    placeholder="80000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Best Case (Optimistic)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.best_case}
                    onChange={(e) => handleInputChange('best_case', Number(e.target.value))}
                    className={`input ${errors.best_case ? 'border-red-500' : ''}`}
                    placeholder="120000"
                  />
                  {errors.best_case && (
                    <p className="text-red-500 text-sm mt-1">{errors.best_case}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Worst Case (Pessimistic)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.worst_case}
                    onChange={(e) => handleInputChange('worst_case', Number(e.target.value))}
                    className={`input ${errors.worst_case ? 'border-red-500' : ''}`}
                    placeholder="80000"
                  />
                  {errors.worst_case && (
                    <p className="text-red-500 text-sm mt-1">{errors.worst_case}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Material Requirements (BOM Integration) */}
            {formData.product_id && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CubeIcon className="h-5 w-5" />
                  Material Requirements Planning
                </h3>
                
                {loadingBOM ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Loading BOM data...</p>
                  </div>
                ) : bomData ? (
                  <div className="space-y-4">
                    {/* BOM Info */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-blue-900">
                            BOM: {bomData.bom_number} (v{bomData.version})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowMaterialRequirements(!showMaterialRequirements)}
                          className="text-sm text-blue-700 hover:text-blue-900"
                        >
                          {showMaterialRequirements ? 'Hide Details' : 'Show Details'}
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-blue-600">Batch Size:</span>
                          <p className="font-medium">{bomData.batch_size} {bomData.batch_uom}</p>
                        </div>
                        <div>
                          <span className="text-blue-600">Materials:</span>
                          <p className="font-medium">{bomData.items?.length || 0} items</p>
                        </div>
                        <div>
                          <span className="text-blue-600">BOM Cost:</span>
                          <p className="font-medium">{formatRupiah(bomData.total_cost)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Material Requirements Table */}
                    {showMaterialRequirements && bomData.items && bomData.items.length > 0 && (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Per Batch</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Most Likely</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Best Case</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Worst Case</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {bomData.items.map((item: any) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm">
                                    <div className="font-medium text-gray-900">{item.material_name}</div>
                                    <div className="text-gray-500 text-xs">{item.material_code}</div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right">
                                    {formatNumber(item.quantity)} {item.uom}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right font-medium text-blue-700">
                                    {formatNumber(calculateMaterialRequirement(item.quantity, formData.most_likely))} {item.uom}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right font-medium text-green-700">
                                    {formatNumber(calculateMaterialRequirement(item.quantity, formData.best_case))} {item.uom}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right font-medium text-yellow-700">
                                    {formatNumber(calculateMaterialRequirement(item.quantity, formData.worst_case))} {item.uom}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Cost Summary */}
                        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Most Likely Cost:</span>
                              <p className="font-bold text-blue-900">
                                {formatRupiah((bomData.total_cost / bomData.batch_size) * formData.most_likely)}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Best Case Cost:</span>
                              <p className="font-bold text-green-900">
                                {formatRupiah((bomData.total_cost / bomData.batch_size) * formData.best_case)}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Worst Case Cost:</span>
                              <p className="font-bold text-yellow-900">
                                {formatRupiah((bomData.total_cost / bomData.batch_size) * formData.worst_case)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MRP Shortage Analysis */}
                    {formData.most_likely > 0 && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          MRP - Material Availability Check
                        </h4>
                        
                        {loadingShortage ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            Checking material availability...
                          </div>
                        ) : shortageAnalysis ? (
                          shortageAnalysis.total_shortage_items > 0 ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                                <span className="font-medium text-red-800">
                                  {shortageAnalysis.total_shortage_items} Material Shortage Detected!
                                </span>
                              </div>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {shortageAnalysis.shortage_items.map((item, idx) => (
                                  <div key={idx} className={`p-2 rounded text-sm ${item.is_critical ? 'bg-red-100' : 'bg-orange-50'}`}>
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <span className={`font-medium ${item.is_critical ? 'text-red-800' : 'text-orange-800'}`}>
                                          {item.item_name}
                                        </span>
                                        {item.is_critical && (
                                          <span className="ml-2 px-1.5 py-0.5 bg-red-600 text-white text-xs rounded">CRITICAL</span>
                                        )}
                                      </div>
                                      <span className={`font-bold ${item.is_critical ? 'text-red-700' : 'text-orange-700'}`}>
                                        Shortage: {formatNumber(item.shortage_quantity, 2)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 pt-2 border-t border-red-200 flex justify-between items-center">
                                <span className="text-sm text-red-700">Est. Shortage Cost:</span>
                                <span className="font-bold text-red-800">{formatRupiah(shortageAnalysis.total_shortage_cost)}</span>
                              </div>
                              <p className="text-xs text-red-600 mt-2">
                                ⚠️ Purchase Orders will be auto-generated when this forecast is approved.
                              </p>
                            </div>
                          ) : (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="font-medium text-emerald-800">
                                  All materials available! ✓
                                </span>
                              </div>
                              <p className="text-xs text-emerald-600 mt-1">
                                Stock is sufficient for forecast quantity of {formatNumber(formData.most_likely)} pcs.
                              </p>
                            </div>
                          )
                        ) : null}
                      </div>
                    )}

                    {/* Planning Tips */}
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>💡 Planning Tip:</strong> Material requirements are calculated based on BOM batch size. 
                        Ensure sufficient inventory or plan procurement accordingly.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        <strong>No BOM Available</strong> - This product doesn't have an active BOM. 
                        Material requirements cannot be calculated automatically.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Additional Notes
              </h3>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className="input"
                placeholder="Add any additional notes, assumptions, or context for this forecast..."
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resource Planning */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Resource Planning
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kebutuhan Man Power
                  </label>
                  <input
                    type="number"
                    value={formData.required_manpower}
                    onChange={(e) => handleInputChange('required_manpower', parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Jumlah operator yang dibutuhkan"
                  />
                  <p className="text-xs text-gray-500 mt-1">Total operator yang dibutuhkan untuk produksi</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah Shift per Hari
                  </label>
                  <select
                    value={formData.shifts_per_day}
                    onChange={(e) => handleInputChange('shifts_per_day', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">1 Shift (8 jam)</option>
                    <option value="2">2 Shift (16 jam)</option>
                    <option value="3">3 Shift (24 jam)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Jumlah shift operasional per hari</p>
                </div>
              </div>
            </div>

            {/* Confidence Level */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confidence Level
              </h3>
              <div className="space-y-3">
                {[
                  { value: 'high', label: 'High', color: 'green', desc: 'Very confident in forecast' },
                  { value: 'medium', label: 'Medium', color: 'yellow', desc: 'Moderately confident' },
                  { value: 'low', label: 'Low', color: 'red', desc: 'Low confidence, high uncertainty' }
                ].map((option) => (
                  <label key={option.value} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="confidence"
                      value={option.value}
                      checked={formData.confidence_level === option.value}
                      onChange={(e) => handleInputChange('confidence_level', e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className={`text-sm font-medium text-${option.color}-700`}>
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {option.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Forecast Summary */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Forecast Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Period:</span>
                  <span className="font-medium">
                    {formData.period_start && formData.period_end ? 
                      `${new Date(formData.period_start).toLocaleDateString()} - ${new Date(formData.period_end).toLocaleDateString()}` : 
                      'Not set'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">{formData.forecast_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Most Likely:</span>
                  <span className="font-medium">{formData.most_likely.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Range:</span>
                  <span className="font-medium">
                    {formData.worst_case.toLocaleString()} - {formData.best_case.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confidence:</span>
                  <span className={`font-medium capitalize ${
                    formData.confidence_level === 'high' ? 'text-green-600' :
                    formData.confidence_level === 'medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {formData.confidence_level}
                  </span>
                </div>
              </div>
            </div>

            {/* Validation Warnings */}
            {Object.keys(errors).length > 0 && (
              <div className="card p-6 border-red-200 bg-red-50">
                <h3 className="text-lg font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  Validation Errors
                </h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {Object.values(errors).map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/app/sales/forecasts')}
            className="btn-secondary"
          >{t('common.cancel')}</button>
          <button
            type="submit"
            disabled={creating || updating}
            className="btn-primary"
          >
            {creating || updating ? 'Saving...' : (isEdit ? 'Update Forecast' : 'Create Forecast')}
          </button>
        </div>
      </form>
    </div>
  )
}
