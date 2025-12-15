import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import { useForm, Controller } from 'react-hook-form'
import axiosInstance from '../../utils/axiosConfig'
import LoadingSpinner from '../../components/Common/LoadingSpinner'
import SearchableSelect from '../../components/SearchableSelect'
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClipboardDocumentListIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
interface WorkOrderFormData {
  product_id: number
  quantity: number
  priority: string
  machine_id?: number
  scheduled_start_date?: string
  scheduled_end_date?: string
  notes?: string
  supervisor_id?: number
}

interface Product {
  id: number
  code: string
  name: string
  primary_uom: string
  category?: string
  cost?: number
  is_producible: boolean
  is_active: boolean
}

interface BOMProduct {
  id: number
  product_id: number
  product_code: string
  product_name: string
  bom_number: string
  version: number
  batch_size: number
  batch_uom: string
  total_cost: number
  total_materials: number
}

interface Machine {
  id: number
  code: string
  name: string
  status: string
  machine_type?: string
}

interface Employee {
  id: number
  name: string
  employee_number: string
  department?: string
}

interface BOM {
  id: number
  bom_number: string
  version: number
  is_active: boolean
  total_cost: number
  batch_size: number
  batch_uom: string
  pack_per_carton: number
  items: BOMItem[]
}

interface BOMItem {
  id: number
  material_id: number
  item_name: string
  item_code: string
  quantity: number
  uom: string
  unit_cost: number
  total_cost: number
  scrap_percent: number
}

const WorkOrderForm = () => {
    const { t } = useLanguage();

const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  
  const [isLoading, setIsLoading] = useState(false)
  const [bomProducts, setBomProducts] = useState<BOMProduct[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [bom, setBom] = useState<BOM | null>(null)
  const [loadingBOM, setLoadingBOM] = useState(false)
  const [showBOMDetails, setShowBOMDetails] = useState(false)
  
  // MRP Shortage Analysis State
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
  
  // Target Calculator State
  const [targetCalc, setTargetCalc] = useState({
    machine_speed: '', // pack per menit
    minutes_per_hour: '60', // default 60 menit
    work_hours: '8.5', // default 8.5 jam
    efficiency: '60', // default 60%
    pack_per_karton: '', // pack per karton
  })
  const [showCalculator, setShowCalculator] = useState(false)
  
  // Pack per Karton override (can be edited by user)
  const [packPerKarton, setPackPerKarton] = useState<number>(1)
  
  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<WorkOrderFormData>({
    defaultValues: {
      priority: 'medium'
    }
  })

  const selectedProductId = watch('product_id')
  const selectedProduct = bomProducts.find(p => p.product_id == selectedProductId)
  const selectedQuantity = watch('quantity') || 0

  // Fetch BOM when product changes
  useEffect(() => {
    if (selectedProductId && bomProducts.length > 0) {
      fetchBOMForProduct(selectedProductId)
    } else {
      setBom(null)
    }
  }, [selectedProductId, bomProducts])

  const fetchBOMForProduct = async (productId: number) => {
    try {
      setLoadingBOM(true)
      
      // Find BOM from already loaded bomProducts
      const bomProduct = bomProducts.find(p => p.product_id == productId)
      
      if (bomProduct) {
        // Fetch full BOM details with items using BOM id
        const bomDetailResponse = await fetch(`/api/production/boms/${bomProduct.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (bomDetailResponse.ok) {
          const bomData = await bomDetailResponse.json()
          setBom(bomData.bom)
          setShowBOMDetails(true)
          // Auto-fill pack_per_karton from BOM
          const ppc = bomData.bom?.pack_per_carton || 1
          setPackPerKarton(ppc)
          setTargetCalc(prev => ({ ...prev, pack_per_karton: String(ppc) }))
        } else {
          setBom(null)
        }
      } else {
        setBom(null)
      }
    } catch (error) {
      console.error('Error fetching BOM:', error)
      setBom(null)
    } finally {
      setLoadingBOM(false)
    }
  }

  // Calculate total cartons needed based on quantity and pack per karton
  const totalCartonsNeeded = selectedQuantity > 0 && packPerKarton > 0 
    ? selectedQuantity / packPerKarton 
    : 0

  // Fetch MRP Shortage Analysis when quantity changes
  const fetchShortageAnalysis = async () => {
    if (!bom || totalCartonsNeeded <= 0) {
      setShortageAnalysis(null)
      return
    }
    
    try {
      setLoadingShortage(true)
      const response = await axiosInstance.get(
        `/api/production/boms/${bom.id}/shortage-analysis`,
        { params: { production_qty: totalCartonsNeeded } }
      )
      setShortageAnalysis(response.data)
    } catch (error) {
      console.error('Error fetching shortage analysis:', error)
      setShortageAnalysis(null)
    } finally {
      setLoadingShortage(false)
    }
  }

  // Debounce shortage analysis fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (bom && totalCartonsNeeded > 0) {
        fetchShortageAnalysis()
      }
    }, 500) // Wait 500ms after user stops typing
    
    return () => clearTimeout(timer)
  }, [bom, totalCartonsNeeded])

  const calculateMaterialRequirement = (bomItemQty: number) => {
    if (!bom || !selectedQuantity || !packPerKarton) return 0
    // BOM is per carton (batch_size = 1 carton)
    // Quantity input is in PCS (pack)
    // packPerKarton tells us how many packs in 1 carton (can be overridden by user)
    // 
    // Formula:
    // Total Karton = Quantity (PCS) / Pack per Karton
    // Material Required = BOM Qty per Batch × (Total Karton / Batch Size)
    //
    // Example: 
    // - Quantity = 2400 PCS, Pack/Karton = 24 → Total Karton = 100
    // - BOM Qty = 24 PCK per batch, Batch Size = 1 karton
    // - Material = 24 × (100 / 1) = 2400 PCK
    const batches = totalCartonsNeeded / bom.batch_size
    return bomItemQty * batches
  }

  const formatNumber = (num: number, decimals: number = 8) => {
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

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-green-600', bg: 'bg-green-50' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { value: 'high', label: 'High', color: 'text-orange-600', bg: 'bg-orange-50' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600', bg: 'bg-red-50' }
  ]

  useEffect(() => {
    loadFormData()
  }, [])

  useEffect(() => {
    if (isEdit && id) {
      loadWorkOrder()
    }
  }, [isEdit, id])

  const loadFormData = async () => {
    try {
      setLoadingData(true)
      
      // Load BOM products, machines, and employees in parallel
      const [bomsRes, machinesRes, employeesRes] = await Promise.all([
        axiosInstance.get('/api/production/boms', { params: { all: true } }),
        axiosInstance.get('/api/production/machines'),
        axiosInstance.get('/api/hr/employees')
      ])
      
      // Extract products from active BOMs
      const bomProductsList: BOMProduct[] = []
      bomsRes.data.boms?.forEach((bom: any) => {
        if (bom.is_active) {
          bomProductsList.push({
            id: bom.id,
            product_id: bom.product_id,
            product_code: bom.product_code,
            product_name: bom.product_name,
            bom_number: bom.bom_number,
            version: bom.version,
            batch_size: bom.batch_size,
            batch_uom: bom.batch_uom,
            total_cost: bom.total_cost,
            total_materials: bom.total_materials
          })
        }
      })
      
      setBomProducts(bomProductsList)
      setMachines(machinesRes.data.machines?.filter((m: Machine) => m.status !== 'broken') || [])
      setEmployees(employeesRes.data.employees || [])
    } catch (error) {
      console.error('Error loading form data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const loadWorkOrder = async () => {
    try {
      const response = await axiosInstance.get(`/api/production/work-orders/${id}`)
      const wo = response.data.work_order
      
      // Populate form with existing data
      setValue('product_id', wo.product_id)
      setValue('quantity', wo.quantity)
      setValue('priority', wo.priority)
      setValue('machine_id', wo.machine_id)
      setValue('supervisor_id', wo.supervisor_id)
      setValue('notes', wo.notes)
      
      if (wo.scheduled_start_date) {
        setValue('scheduled_start_date', new Date(wo.scheduled_start_date).toISOString().slice(0, 16))
      }
      if (wo.scheduled_end_date) {
        setValue('scheduled_end_date', new Date(wo.scheduled_end_date).toISOString().slice(0, 16))
      }
    } catch (error) {
      console.error('Error loading work order:', error)
      alert('Failed to load work order')
    }
  }

  const onSubmit = async (data: WorkOrderFormData) => {
    // Validate product selection
    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }
    
    setIsLoading(true)
    try {
      // Get UOM from selected BOM product
      const uom = selectedProduct.batch_uom || 'pcs';
      
      const payload = {
        ...data,
        product_id: parseInt(data.product_id.toString()),
        machine_id: data.machine_id ? parseInt(data.machine_id.toString()) : undefined,
        supervisor_id: data.supervisor_id ? parseInt(data.supervisor_id.toString()) : undefined,
        quantity: parseFloat(data.quantity.toString()),
        uom: uom
      }
      
      console.log('Work Order Payload:', payload);

      if (isEdit) {
        await axiosInstance.put(`/api/production/work-orders/${id}`, payload)
        alert('Work Order updated successfully!')
      } else {
        await axiosInstance.post('/api/production/work-orders', payload)
        alert('Work Order created successfully!')
      }
      
      navigate('/app/production/work-orders')
    } catch (error: any) {
      console.error('Error saving work order:', error)
      alert(error.response?.data?.error || 'Failed to save work order')
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingData) {
    return <LoadingSpinner />
  }

  const selectedPriority = priorities.find(p => p.value === watch('priority'))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/production/work-orders')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? '✏️ Edit Work Order' : '📋 Create Work Order'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit ? 'Update work order details' : 'Schedule production for a specific product'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Main Form */}
        <div className="card p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Selection */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product *
              </label>
              <Controller
                name="product_id"
                control={control}
                rules={{ required: 'Product is required' }}
                render={({ field }) => (
                  <SearchableSelect
                    options={bomProducts.map(p => ({
                      id: p.product_id,
                      code: p.product_code,
                      name: p.product_name
                    }))}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    placeholder="Ketik untuk mencari produk..."
                    disabled={isEdit}
                  />
                )}
              />
              {errors.product_id && (
                <p className="mt-1 text-sm text-red-600">{errors.product_id.message}</p>
              )}
            </div>

            {/* Product Info Display */}
            {selectedProduct && (
              <div className="lg:col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Product Information</h4>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">Code:</span>
                    <p className="font-medium">{selectedProduct.product_code}</p>
                  </div>
                  <div>
                    <span className="text-blue-600">BOM Number:</span>
                    <p className="font-medium">{selectedProduct.bom_number}</p>
                  </div>
                  <div>
                    <span className="text-blue-600">Batch Size:</span>
                    <p className="font-medium">{selectedProduct.batch_size} {selectedProduct.batch_uom}</p>
                  </div>
                  <div>
                    <span className="text-blue-600">BOM Cost:</span>
                    <p className="font-medium">
                      {selectedProduct.total_cost ? `Rp ${selectedProduct.total_cost.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* BOM Information */}
            {selectedProduct && (
              <div className="lg:col-span-2">
                {loadingBOM ? (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">Loading BOM information...</p>
                  </div>
                ) : bom ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ClipboardDocumentListIcon className="h-5 w-5 text-green-600" />
                        <h4 className="font-medium text-green-900">
                          BOM Available: {bom.bom_number} (v{bom.version})
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowBOMDetails(!showBOMDetails)}
                        className="flex items-center gap-1 text-sm text-green-700 hover:text-green-900"
                      >
                        {showBOMDetails ? (
                          <>
                            <ChevronUpIcon className="h-4 w-4" />
                            Hide Materials
                          </>
                        ) : (
                          <>
                            <ChevronDownIcon className="h-4 w-4" />
                            Show Materials
                          </>
                        )}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-green-600">Batch Size:</span>
                        <p className="font-medium">{bom.batch_size} {bom.batch_uom}</p>
                      </div>
                      <div>
                        <span className="text-green-600">Pack/Karton (BOM):</span>
                        <p className="font-medium">{bom.pack_per_carton || 1} PCS</p>
                      </div>
                      <div>
                        <span className="text-green-600">Total Materials:</span>
                        <p className="font-medium">{bom.items?.length || 0} items</p>
                      </div>
                      <div>
                        <span className="text-green-600">BOM Cost/Karton:</span>
                        <p className="font-medium">{formatRupiah(bom.total_cost)}</p>
                      </div>
                    </div>

                    {/* Material Requirements */}
                    {showBOMDetails && bom.items && bom.items.length > 0 && (
                      <div className="mt-4 border-t border-green-300 pt-3">
                        <h5 className="text-sm font-medium text-green-900 mb-2">
                          Material Requirements {selectedQuantity > 0 && `(for ${selectedQuantity} ${selectedProduct.batch_uom})`}
                        </h5>
                        <div className="bg-white rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Per Batch</th>
                                {selectedQuantity > 0 && (
                                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Required</th>
                                )}
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Scrap %</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {bom.items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 text-sm">
                                    <div className="font-medium text-gray-900">{item.item_name}</div>
                                    <div className="text-gray-500 text-xs">{item.item_code}</div>
                                  </td>
                                  <td className="px-3 py-2 text-sm text-right">
                                    {formatNumber(item.quantity)} {item.uom}
                                  </td>
                                  {selectedQuantity > 0 && (
                                    <td className="px-3 py-2 text-sm text-right font-medium text-green-700">
                                      {formatNumber(calculateMaterialRequirement(item.quantity))} {item.uom}
                                    </td>
                                  )}
                                  <td className="px-3 py-2 text-sm text-right">
                                    {item.scrap_percent}%
                                  </td>
                                  <td className="px-3 py-2 text-sm text-right">
                                    {formatRupiah(item.total_cost)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {selectedQuantity > 0 && totalCartonsNeeded > 0 && (
                          <div className="mt-3 p-3 bg-green-100 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-green-900">
                                Estimated Material Cost:
                              </span>
                              <span className="text-lg font-bold text-green-900">
                                {formatRupiah((bom.total_cost / bom.batch_size) * totalCartonsNeeded)}
                              </span>
                            </div>
                            <p className="text-xs text-green-700 mt-1">
                              {selectedQuantity.toLocaleString()} PCS ÷ {packPerKarton} pack/karton = {totalCartonsNeeded.toLocaleString('id-ID', { maximumFractionDigits: 2 })} karton
                            </p>
                          </div>
                        )}
                        
                        {/* Batch Size Flexibility Warning */}
                        {selectedQuantity > 0 && bom && totalCartonsNeeded % bom.batch_size !== 0 && (
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <InformationCircleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-amber-800">
                                  Kuantitas Tidak Kelipatan Batch Size
                                </p>
                                <p className="text-xs text-amber-700 mt-1">
                                  BOM batch size: {bom.batch_size} {bom.batch_uom}. 
                                  Kuantitas {totalCartonsNeeded.toLocaleString('id-ID', { maximumFractionDigits: 2 })} karton 
                                  bukan kelipatan dari batch size.
                                </p>
                                <p className="text-xs text-amber-600 mt-1">
                                  <strong>Saran:</strong> Gunakan kelipatan {bom.batch_size} untuk efisiensi produksi 
                                  (contoh: {Math.ceil(totalCartonsNeeded / bom.batch_size) * bom.batch_size * packPerKarton} PCS = {Math.ceil(totalCartonsNeeded / bom.batch_size) * bom.batch_size} karton)
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* MRP Shortage Analysis */}
                        {selectedQuantity > 0 && totalCartonsNeeded > 0 && (
                          <div className="mt-4 border-t border-green-300 pt-4">
                            <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              MRP - Material Availability Check
                            </h5>
                            
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
                                            <p className="text-xs text-gray-600">{item.item_code}</p>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-xs text-gray-600">
                                              Need: {formatNumber(item.required_quantity, 2)} | Have: {formatNumber(item.available_quantity, 2)}
                                            </p>
                                            <p className={`font-bold ${item.is_critical ? 'text-red-700' : 'text-orange-700'}`}>
                                              Shortage: {formatNumber(item.shortage_quantity, 2)}
                                            </p>
                                          </div>
                                        </div>
                                        {item.supplier_name && (
                                          <p className="text-xs text-gray-500 mt-1">
                                            Supplier: {item.supplier_name} | Lead Time: {item.lead_time_days} days
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-red-200 flex justify-between items-center">
                                    <span className="text-sm text-red-700">Est. Shortage Cost:</span>
                                    <span className="font-bold text-red-800">{formatRupiah(shortageAnalysis.total_shortage_cost)}</span>
                                  </div>
                                  <p className="text-xs text-red-600 mt-2">
                                    ⚠️ Please ensure materials are available before starting production or create Purchase Requisition.
                                  </p>
                                </div>
                              ) : (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                  <div className="flex items-center gap-2">
                                    <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                                    <span className="font-medium text-emerald-800">
                                      All materials available! ✓
                                    </span>
                                  </div>
                                  <p className="text-xs text-emerald-600 mt-1">
                                    Stock is sufficient for {totalCartonsNeeded.toLocaleString('id-ID', { maximumFractionDigits: 2 })} karton production.
                                  </p>
                                </div>
                              )
                            ) : null}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        <strong>No BOM found</strong> - This product doesn't have an active BOM. 
                        Material requirements cannot be calculated automatically.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity with Calculator */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Quantity to Produce *
                </label>
                <button
                  type="button"
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {showCalculator ? 'Sembunyikan Kalkulator' : 'Kalkulator Target'}
                </button>
              </div>
              
              {/* Target Calculator */}
              {showCalculator && (
                <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Kalkulator Target Produksi
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-green-700 mb-1">
                        Speed Mesin (pack/menit)
                      </label>
                      <input
                        type="number"
                        value={targetCalc.machine_speed}
                        onChange={(e) => setTargetCalc(prev => ({ ...prev, machine_speed: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white"
                        placeholder="0"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-green-700 mb-1">
                        Menit/Jam
                      </label>
                      <input
                        type="number"
                        value={targetCalc.minutes_per_hour}
                        onChange={(e) => setTargetCalc(prev => ({ ...prev, minutes_per_hour: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white"
                        placeholder="60"
                        min="1"
                        max="60"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-green-700 mb-1">
                        Jam Kerja
                      </label>
                      <input
                        type="number"
                        value={targetCalc.work_hours}
                        onChange={(e) => setTargetCalc(prev => ({ ...prev, work_hours: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white"
                        placeholder="8.5"
                        min="0"
                        step="0.5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-green-700 mb-1">
                        Efisiensi (%)
                      </label>
                      <input
                        type="number"
                        value={targetCalc.efficiency}
                        onChange={(e) => setTargetCalc(prev => ({ ...prev, efficiency: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white"
                        placeholder="60"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-green-700 mb-1">
                        Pack/Karton
                      </label>
                      <input
                        type="number"
                        value={targetCalc.pack_per_karton}
                        onChange={(e) => setTargetCalc(prev => ({ ...prev, pack_per_karton: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-green-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white"
                        placeholder="1"
                        min="1"
                      />
                    </div>
                  </div>
                  
                  {/* Calculated Result */}
                  {(() => {
                    const speed = parseFloat(targetCalc.machine_speed) || 0;
                    const minutesPerHour = parseFloat(targetCalc.minutes_per_hour) || 60;
                    const workHours = parseFloat(targetCalc.work_hours) || 8.5;
                    const efficiency = parseFloat(targetCalc.efficiency) || 60;
                    const packPerKarton = parseFloat(targetCalc.pack_per_karton) || 1;
                    
                    // Formula: Speed × 60 × Jam Kerja × (Efisiensi/100)
                    const targetPack = Math.round(speed * minutesPerHour * workHours * (efficiency / 100));
                    const targetKarton = packPerKarton > 0 ? Math.round((targetPack / packPerKarton) * 100) / 100 : 0;
                    
                    return (
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="text-xs text-green-600 mb-2">
                          Formula: Speed × {minutesPerHour} menit × {workHours} jam × {efficiency}%
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-2 bg-green-100 rounded">
                            <p className="text-xs text-green-600">Target Pack</p>
                            <p className="text-xl font-bold text-green-800">{targetPack.toLocaleString()}</p>
                          </div>
                          <div className="text-center p-2 bg-emerald-100 rounded">
                            <p className="text-xs text-emerald-600">Target Karton</p>
                            <p className="text-xl font-bold text-emerald-800">{targetKarton.toLocaleString()}</p>
                          </div>
                        </div>
                        {targetPack > 0 && (
                          <button
                            type="button"
                            onClick={() => setValue('quantity', targetPack)}
                            className="mt-2 w-full py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Gunakan {targetPack.toLocaleString()} sebagai Quantity
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
              
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('quantity', { 
                      required: 'Quantity is required',
                      min: { value: 0.01, message: 'Quantity must be greater than 0' }
                    })}
                    className="input"
                    placeholder="0.00"
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
                  )}
                  {selectedProduct && (
                    <p className="mt-1 text-xs text-gray-500">Unit: PCS (Pack)</p>
                  )}
                </div>
                
                {/* Pack per Karton */}
                <div className="w-32">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Pack/Karton
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={packPerKarton}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1
                      setPackPerKarton(val)
                      setTargetCalc(prev => ({ ...prev, pack_per_karton: String(val) }))
                    }}
                    className="input text-center"
                    placeholder="1"
                  />
                  <p className="mt-1 text-xs text-gray-500">dari BOM</p>
                </div>
              </div>
              
              {/* Karton Calculation Info */}
              {selectedQuantity > 0 && totalCartonsNeeded > 0 && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-700">
                      {selectedQuantity.toLocaleString()} PCS ÷ {packPerKarton} pack/karton
                    </span>
                    <span className="font-bold text-blue-900">
                      = {totalCartonsNeeded.toLocaleString('id-ID', { maximumFractionDigits: 2 })} Karton
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <select {...register('priority')} className="input">
                {priorities.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
              {selectedPriority && (
                <div className={`mt-2 p-2 rounded-lg ${selectedPriority.bg}`}>
                  <p className={`text-sm font-medium ${selectedPriority.color}`}>
                    {selectedPriority.label} Priority Work Order
                  </p>
                </div>
              )}
            </div>

            {/* Machine */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Machine
              </label>
              <select {...register('machine_id')} className="input">
                <option value="">Auto-assign or select machine</option>
                {machines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.code} - {machine.name} ({machine.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Supervisor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Production Supervisor
              </label>
              <select {...register('supervisor_id')} className="input">
                <option value="">Select supervisor</option>
                {employees.filter(emp => emp.department === t('navigation.production')).map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.employee_number})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Scheduling */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDaysIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Production Schedule</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Start Date
              </label>
              <input
                type="datetime-local"
                {...register('scheduled_start_date')}
                className="input"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled End Date
              </label>
              <input
                type="datetime-local"
                {...register('scheduled_end_date')}
                className="input"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes & Special Instructions
          </label>
          <textarea
            {...register('notes')}
            rows={4}
            className="input"
            placeholder="Additional notes, special requirements, quality specifications..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/app/production/work-orders')}
            className="btn-secondary"
            disabled={isLoading}
          >{t('common.cancel')}</button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading || !selectedProduct}
          >
            {isLoading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Work Order' : 'Create Work Order')}
          </button>
        </div>
      </form>

      {/* Quick Tips */}
      <div className="card p-4 bg-amber-50 border border-amber-200">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-900 mb-2">💡 Production Guidelines</h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Only producible and active products can be selected</li>
              <li>• Machine assignment is optional - system will auto-assign if available</li>
              <li>• Higher priority work orders will be scheduled first</li>
              <li>• Consider material availability and machine capacity when planning</li>
              <li>• Supervisor assignment helps with production accountability</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkOrderForm
