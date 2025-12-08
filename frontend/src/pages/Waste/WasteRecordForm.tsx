import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  useGetWasteRecordQuery, 
  useCreateWasteRecordMutation, 
  useUpdateWasteRecordMutation 
} from '../../services/api' 
interface WasteRecordFormData {
  waste_date: string
  category: string
  source_department: string
  waste_type: string
  quantity: number
  uom: string
  hazard_level: string
  disposal_method: string
  disposal_location: string
  cost_estimation: number
  responsible_person: string
  notes: string
  regulatory_compliance: boolean
  disposal_certificate: string
}

export default function WasteRecordForm() {
    const { t } = useLanguage();

const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  
  const { data: wasteRecord, isLoading } = useGetWasteRecordQuery(id, { skip: !id })
  const [createWasteRecord, { isLoading: isCreating }] = useCreateWasteRecordMutation()
  const [updateWasteRecord, { isLoading: isUpdating }] = useUpdateWasteRecordMutation()

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<WasteRecordFormData>({
    defaultValues: {
      waste_date: new Date().toISOString().split('T')[0],
      category: 'production_waste',
      source_department: '',
      waste_type: '',
      quantity: 0,
      uom: 'kg',
      hazard_level: 'low',
      disposal_method: '',
      disposal_location: '',
      cost_estimation: 0,
      responsible_person: '',
      notes: '',
      regulatory_compliance: false,
      disposal_certificate: ''
    }
  })

  const hazardLevel = watch('hazard_level')

  useEffect(() => {
    if (wasteRecord) {
      reset({
        waste_date: wasteRecord.waste_date ? wasteRecord.waste_date.split('T')[0] : '',
        category: wasteRecord.category || 'production_waste',
        source_department: wasteRecord.source_department || '',
        waste_type: wasteRecord.waste_type || '',
        quantity: wasteRecord.quantity || 0,
        uom: wasteRecord.uom || 'kg',
        hazard_level: wasteRecord.hazard_level || 'low',
        disposal_method: wasteRecord.disposal_method || '',
        disposal_location: wasteRecord.disposal_location || '',
        cost_estimation: wasteRecord.cost_estimation || 0,
        responsible_person: wasteRecord.responsible_person || '',
        notes: wasteRecord.notes || '',
        regulatory_compliance: wasteRecord.regulatory_compliance || false,
        disposal_certificate: wasteRecord.disposal_certificate || ''
      })
    }
  }, [wasteRecord, reset])

  const onSubmit = async (data: WasteRecordFormData) => {
    try {
      if (isEdit && id) {
        await updateWasteRecord({ id, ...data }).unwrap()
        toast.success('Waste record updated successfully!')
      } else {
        await createWasteRecord(data).unwrap()
        toast.success('Waste record created successfully!')
      }
      navigate('/app/waste')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to save waste record')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Edit Waste Record' : 'Record Waste Disposal'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isEdit ? 'Update waste disposal record' : 'Create a new waste disposal record'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Waste Date *
              </label>
              <input
                type="date"
                {...register('waste_date', { required: 'Waste date is required' })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.waste_date && (
                <p className="text-red-500 text-sm mt-1">{errors.waste_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Waste Category *
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="production_waste">Production Waste</option>
                <option value="packaging_waste">Packaging Waste</option>
                <option value="chemical_waste">Chemical Waste</option>
                <option value="general_waste">General Waste</option>
                <option value="recyclable">Recyclable</option>
                <option value="hazardous">Hazardous Waste</option>
              </select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Source Department *
              </label>
              <select
                {...register('source_department', { required: 'Source department is required' })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Department</option>
                <option value="production">{t('navigation.production')}</option>
                <option value="quality_control">Quality Control</option>
                <option value="warehouse">{t('navigation.warehouse')}</option>
                <option value="maintenance">{t('navigation.maintenance')}</option>
                <option value="office">Office</option>
                <option value="cafeteria">Cafeteria</option>
              </select>
              {errors.source_department && (
                <p className="text-red-500 text-sm mt-1">{errors.source_department.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Waste Type *
              </label>
              <input
                type="text"
                {...register('waste_type', { required: 'Waste type is required' })}
                placeholder="e.g., Nonwoven scraps, Chemical containers"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.waste_type && (
                <p className="text-red-500 text-sm mt-1">{errors.waste_type.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Quantity and Weight */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quantity and Weight</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('quantity', { 
                  required: 'Quantity is required',
                  min: { value: 0.01, message: 'Quantity must be greater than 0' }
                })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Unit of Measure
              </label>
              <select
                {...register('uom')}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="ton">Ton</option>
                <option value="liter">Liter</option>
                <option value="m3">Cubic Meter (m³)</option>
                <option value="pcs">Pieces</option>
                <option value="bag">Bags</option>
                <option value="drum">Drums</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hazard Level *
              </label>
              <select
                {...register('hazard_level', { required: 'Hazard level is required' })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
                <option value="hazardous">Hazardous</option>
              </select>
              {errors.hazard_level && (
                <p className="text-red-500 text-sm mt-1">{errors.hazard_level.message}</p>
              )}
            </div>
          </div>

          {(hazardLevel === 'high' || hazardLevel === 'hazardous') && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Important: High Hazard Waste
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                    High hazard waste requires special disposal procedures and regulatory compliance. 
                    Ensure proper documentation and certified disposal methods.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Disposal Method and Location */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Disposal Method and Location</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Disposal Method *
              </label>
              <select
                {...register('disposal_method', { required: 'Disposal method is required' })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Method</option>
                <option value="landfill">Landfill</option>
                <option value="incineration">Incineration</option>
                <option value="recycling">Recycling</option>
                <option value="composting">Composting</option>
                <option value="chemical_treatment">Chemical Treatment</option>
                <option value="third_party">Third Party Disposal</option>
                <option value="reuse">Reuse</option>
              </select>
              {errors.disposal_method && (
                <p className="text-red-500 text-sm mt-1">{errors.disposal_method.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Disposal Location
              </label>
              <input
                type="text"
                {...register('disposal_location')}
                placeholder="Location or facility name"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cost Estimation (Rp)
              </label>
              <input
                type="number"
                step="0.01"
                {...register('cost_estimation', { valueAsNumber: true })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Responsible Person
              </label>
              <input
                type="text"
                {...register('responsible_person')}
                placeholder="Person responsible for disposal"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Regulatory Compliance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Regulatory Compliance</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('regulatory_compliance')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Disposal complies with environmental regulations
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Disposal Certificate Number
              </label>
              <input
                type="text"
                {...register('disposal_certificate')}
                placeholder="Certificate or permit number (if applicable)"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              </label>
              <textarea
                {...register('notes')}
                rows={4}
                placeholder="Additional notes, special handling requirements, or observations..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/app/waste')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >{t('common.cancel')}</button>
          <button
            type="submit"
            disabled={isCreating || isUpdating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating || isUpdating ? 'Saving...' : (isEdit ? 'Update Record' : 'Record Waste')}
          </button>
        </div>
      </form>
    </div>
  )
}
