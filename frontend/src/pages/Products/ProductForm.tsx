import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  useGetProductQuery, 
  useCreateProductMutation, 
  useUpdateProductMutation,
  useGetProductCategoriesQuery 
} from '../../services/api';
import axiosInstance from '../../utils/axiosConfig';
import { CalculatorIcon, CheckCircleIcon } from '@heroicons/react/24/outline'; 
interface ProductFormData {
  code: string
  name: string
  description?: string
  category_id?: number
  nonwoven_category?: string
  primary_uom: string
  price: number
  cost: number
  material_type: string
  is_active: boolean
  
  // Specifications
  gsm?: number
  width_cm?: number
  length_m?: number
  thickness_mm?: number
  color?: string
  weight_per_sheet_g?: number
  absorbency?: string
  tensile_strength?: string
  ph_level?: string
  fragrance?: string
  alcohol_content?: string
  
  // Packaging
  sheets_per_pack?: number
  packs_per_karton?: number
  pack_weight_kg?: number
  karton_weight_kg?: number
  pack_dimensions?: string
  karton_dimensions?: string
  barcode_pack?: string
  barcode_karton?: string
}

export default function ProductForm() {
    const { t } = useLanguage();

const { id } = useParams()
  const navigate = useNavigate()
  const { data: product } = useGetProductQuery(id, { skip: !id })
  const { data: categoriesData } = useGetProductCategoriesQuery({})
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation()
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation()
  
  // Form section state
  const [activeTab, setActiveTab] = useState('basic')
  const [calculated, setCalculated] = useState<any>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ProductFormData>()

  useEffect(() => {
    if (product) {
      reset(product)
    }
  }, [product, reset])

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (id) {
        await updateProduct({ id, ...data }).unwrap()
        toast.success('Product updated successfully')
      } else {
        await createProduct(data).unwrap()
        toast.success('Product created successfully')
      }
      navigate('/app/products')
    } catch (error) {
      toast.error('Failed to save product')
    }
  }


  const materialTypes = [
    'finished_goods', 'raw_materials', 'packaging_materials', 'chemical_materials'
  ]

  const uomList = ['PCS', 'Meter', 'Kg', 'Gram', 'Liter', 'Roll', 'Pack', 'Sheet', 'Karton']

  // Watch form values for calculations
  const sheetsPerPack = watch('sheets_per_pack')
  const packsPerKarton = watch('packs_per_karton')
  const gsm = watch('gsm')
  const widthCm = watch('width_cm')
  const lengthM = watch('length_m')

  // Auto-calculate function
  const handleCalculate = async () => {
    try {
      setIsCalculating(true)
      
      // Convert length from meters to cm for calculation
      const lengthCm = lengthM ? lengthM * 100 : 0
      
      const response = await axiosInstance.post('/api/products/calculate', {
        gramasi: gsm || 0,
        cd: widthCm || 0,  // Width in CM
        md: lengthCm || 0,  // Length converted to CM
        sheet_per_pack: sheetsPerPack || 0,
        pack_per_karton: packsPerKarton || 0,
        lebar_mr_gross_cm: widthCm || 0,  // Use width as main roll width
        rayon: 0.5,
        polyester: 0.5,
        es: 0
      })
      
      setCalculated(response.data.calculations)
      toast.success('✓ Calculations completed!')
    } catch (error: any) {
      console.error('Calculation error:', error)
      toast.error('Calculation failed: ' + (error.response?.data?.error || error.message))
    } finally {
      setIsCalculating(false)
    }
  }

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: '📦' },
    { id: 'specifications', name: 'Specifications', icon: '📏' },
    { id: 'packaging', name: 'Packaging', icon: '📋' },
    { id: 'calculations', name: 'Calculations', icon: '🔢' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {id ? 'Edit Product' : 'Add New Product'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tab Navigation */}
        <div className="card">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <span>{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Basic Product Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Code *
                    </label>
                    <input
                      type="text"
                      {...register('code', { required: 'Product code is required' })}
                      className="input-field"
                      placeholder="e.g., PRD-001"
                    />
                    {errors.code && (
                      <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      {...register('name', { required: 'Product name is required' })}
                      className="input-field"
                      placeholder="e.g., Wet Tissue Premium"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('products.bom.category')}</label>
                    <select {...register('category_id')} className="input-field">
                      <option value="">Select category</option>
                      {categoriesData?.categories?.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary UOM *
                    </label>
                    <select {...register('primary_uom')} className="input-field">
                      {uomList.map((uom) => (
                        <option key={uom} value={uom}>{uom}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Material Type *
                    </label>
                    <select {...register('material_type')} className="input-field">
                      {materialTypes.map((type) => (
                        <option key={type} value={type}>{type.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (IDR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('price')}
                      className="input-field"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost (IDR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('cost')}
                      className="input-field"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.description')}</label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="input-field"
                      placeholder="Product description..."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('is_active')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      Active Product
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Specifications Tab */}
            {activeTab === 'specifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Technical Specifications</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GSM (Grams per Square Meter)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('gsm')}
                      className="input-field"
                      placeholder="e.g., 50.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Width (cm)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('width_cm')}
                      className="input-field"
                      placeholder="e.g., 15.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Length (m)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('length_m')}
                      className="input-field"
                      placeholder="e.g., 20.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thickness (mm)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      {...register('thickness_mm')}
                      className="input-field"
                      placeholder="e.g., 0.050"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                    </label>
                    <input
                      type="text"
                      {...register('color')}
                      className="input-field"
                      placeholder="e.g., White"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight per Sheet (g)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      {...register('weight_per_sheet_g')}
                      className="input-field"
                      placeholder="e.g., 1.250"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                    </label>
                    <input
                      type="text"
                      {...register('absorbency')}
                      className="input-field"
                      placeholder="e.g., High"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tensile Strength
                    </label>
                    <input
                      type="text"
                      {...register('tensile_strength')}
                      className="input-field"
                      placeholder="e.g., 300 N/m"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      pH Level
                    </label>
                    <input
                      type="text"
                      {...register('ph_level')}
                      className="input-field"
                      placeholder="e.g., 5.5-6.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                    </label>
                    <input
                      type="text"
                      {...register('fragrance')}
                      className="input-field"
                      placeholder="e.g., Fresh"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alcohol Content
                    </label>
                    <input
                      type="text"
                      {...register('alcohol_content')}
                      className="input-field"
                      placeholder="e.g., 70%"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Calculations Tab */}
            {activeTab === 'calculations' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Auto-Calculated Metrics</h3>
                  <button
                    type="button"
                    onClick={handleCalculate}
                    disabled={isCalculating || !gsm || !widthCm || !lengthM || !sheetsPerPack || !packsPerKarton}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isCalculating ? (
                      <>
                        <CalculatorIcon className="h-5 w-5 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <CalculatorIcon className="h-5 w-5" />
                        Calculate Metrics
                      </>
                    )}
                  </button>
                </div>

                {!calculated ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <CalculatorIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2 font-medium">
                      Click "Calculate Metrics" to generate product calculations
                    </p>
                    <p className="text-sm text-gray-500">
                      Make sure GSM, Width, Length, Sheets per Pack, and Packs per Karton are filled
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          BERAT KERING (Dry Weight)
                        </label>
                        <div className="text-2xl font-bold text-blue-600">
                          {calculated.berat_kering.toFixed(4)} kg
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Per karton</p>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          METER KAIN (Fabric Length)
                        </label>
                        <div className="text-2xl font-bold text-green-600">
                          {calculated.meter_kain.toFixed(4)} m
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Required length</p>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          KG KAIN (Fabric Weight)
                        </label>
                        <div className="text-2xl font-bold text-purple-600">
                          {calculated.kg_kain.toFixed(4)} kg
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Required weight</p>
                      </div>

                      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total Sheets
                        </label>
                        <div className="text-2xl font-bold text-orange-600">
                          {calculated.total_sheets}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Per karton</p>
                      </div>

                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          KEBUTUHAN RAYON
                        </label>
                        <div className="text-2xl font-bold text-red-600">
                          {calculated.kebutuhan_rayon_kg.toFixed(4)} kg
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Material requirement</p>
                      </div>

                      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          KEBUTUHAN POLYESTER
                        </label>
                        <div className="text-2xl font-bold text-indigo-600">
                          {calculated.kebutuhan_polyester_kg.toFixed(4)} kg
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Material requirement</p>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                      <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Calculations Complete
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          All metrics have been calculated successfully based on your product specifications.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Packaging Tab */}
            {activeTab === 'packaging' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Packaging Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sheets per Pack
                    </label>
                    <input
                      type="number"
                      {...register('sheets_per_pack')}
                      className="input-field"
                      placeholder="e.g., 80"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Packs per Karton
                    </label>
                    <input
                      type="number"
                      {...register('packs_per_karton')}
                      className="input-field"
                      placeholder="e.g., 12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sheets per Karton (Auto)
                    </label>
                    <input
                      type="number"
                      value={sheetsPerPack && packsPerKarton ? sheetsPerPack * packsPerKarton : ''}
                      disabled
                      className="input-field bg-gray-50"
                      placeholder="Auto calculated"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pack Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      {...register('pack_weight_kg')}
                      className="input-field"
                      placeholder="e.g., 0.150"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Karton Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      {...register('karton_weight_kg')}
                      className="input-field"
                      placeholder="e.g., 2.000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pack Dimensions (L×W×H cm)
                    </label>
                    <input
                      type="text"
                      {...register('pack_dimensions')}
                      className="input-field"
                      placeholder="e.g., 12×8×4"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Karton Dimensions (L×W×H cm)
                    </label>
                    <input
                      type="text"
                      {...register('karton_dimensions')}
                      className="input-field"
                      placeholder="e.g., 40×30×20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pack Barcode
                    </label>
                    <input
                      type="text"
                      {...register('barcode_pack')}
                      className="input-field"
                      placeholder="e.g., 8990123456789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Karton Barcode
                    </label>
                    <input
                      type="text"
                      {...register('barcode_karton')}
                      className="input-field"
                      placeholder="e.g., 8990123456796"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/app/products')}
            className="btn-secondary"
          >{t('common.cancel')}</button>
          <button
            type="submit"
            disabled={isCreating || isUpdating}
            className="btn-primary"
          >
            {isCreating || isUpdating ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  )
}
