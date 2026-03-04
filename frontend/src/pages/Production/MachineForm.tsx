import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import { useForm } from 'react-hook-form'
import {
  ArrowLeftIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig'
import LoadingSpinner from '../../components/Common/LoadingSpinner'
interface MachineFormData {
  name: string
  code: string
  machine_type: string
  model?: string
  manufacturer?: string
  installation_date?: string
  specifications?: string
  capacity?: number
  uom?: string
  default_speed?: number
  target_efficiency?: number
  location?: string
  department?: string
  status: string
  maintenance_schedule?: string
  notes?: string
  is_active: boolean
}

const MachineForm = () => {
    const { t } = useLanguage();

const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  
  const [isLoading, setIsLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<MachineFormData>({
    defaultValues: {
      machine_type: 'manufacturing',
      status: 'idle',
      capacity: 0,
      uom: 'units/hour',
      default_speed: 0,
      target_efficiency: 60,
      is_active: true
    }
  })

  useEffect(() => {
    if (isEdit && id) {
      loadMachine()
    }
  }, [isEdit, id])

  const loadMachine = async () => {
    try {
      setLoadingData(true)
      const response = await axiosInstance.get(`/api/production/machines/${id}`)
      console.log('=== LOAD MACHINE RESPONSE ===', response.data)
      const machine = response.data.machine
      
      // Populate form fields
      Object.keys(machine).forEach((key) => {
        if (machine[key] !== null && machine[key] !== undefined) {
          setValue(key as keyof MachineFormData, machine[key])
        }
      })
    } catch (error) {
      console.error('Error loading machine:', error)
      alert('Failed to load machine data')
    } finally {
      setLoadingData(false)
    }
  }

  const machineTypes = [
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'packaging', label: 'Packaging' },
    { value: 'cutting', label: 'Cutting' },
    { value: 'printing', label: 'Printing' },
    { value: 'testing', label: 'Testing' },
    { value: 'auxiliary', label: 'Auxiliary' }
  ]

  const statusOptions = [
    { value: 'idle', label: 'Idle' },
    { value: 'running', label: 'Running' },
    { value: 'maintenance', label: 'Under Maintenance' },
    { value: 'breakdown', label: 'Breakdown' },
    { value: 'stopped', label: 'Stopped' }
  ]

  const onSubmit = async (data: MachineFormData) => {
    setIsLoading(true)
    try {
      const payload = {
        ...data,
        capacity: parseFloat(data.capacity?.toString() || '0'),
        default_speed: parseInt(data.default_speed?.toString() || '0'),
        target_efficiency: parseInt(data.target_efficiency?.toString() || '60'),
        installation_date: data.installation_date || null,
        is_active: data.is_active ?? true
      }
      console.log('=== SUBMIT PAYLOAD ===', payload)

      if (isEdit) {
        const res = await axiosInstance.put(`/api/production/machines/${id}`, payload)
        console.log('=== UPDATE RESPONSE ===', res.data)
        alert('Machine updated successfully!')
      } else {
        await axiosInstance.post('/api/production/machines', payload)
        alert('Machine created successfully!')
      }
      
      navigate('/app/production/machines')
    } catch (error: any) {
      console.error('Error saving machine:', error)
      alert(error.response?.data?.error || 'Failed to save machine')
    } finally {
      setIsLoading(false)
    }
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
            onClick={() => navigate('/app/production/machines')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? '🔧 Edit Machine' : '🏭 Add Machine'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit ? 'Update machine information' : 'Add a new machine to production'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <CogIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Machine Name *
              </label>
              <input
                type="text"
                {...register('name', { required: 'Machine name is required' })}
                className="input"
                placeholder="e.g., Wet Wipes Machine #1"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Machine Code *
              </label>
              <input
                type="text"
                {...register('code', { required: 'Machine code is required' })}
                className="input"
                placeholder="e.g., MCH-001"
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Machine Type
              </label>
              <select
                {...register('machine_type')}
                className="input"
              >
                {machineTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.status')}</label>
              <select
                {...register('status')}
                className="input"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <input
                type="text"
                {...register('model')}
                className="input"
                placeholder="Machine model"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <input
                type="text"
                {...register('manufacturer')}
                className="input"
                placeholder="Manufacturer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Installation Date
              </label>
              <input
                type="date"
                {...register('installation_date')}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <input
                type="text"
                {...register('department')}
                className="input"
                placeholder="e.g., Production"
              />
            </div>
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <ChartBarIcon className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Technical Specifications</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <input
                type="number"
                {...register('capacity', { min: 0 })}
                className="input"
                placeholder="Production capacity"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit of Measure
              </label>
              <select
                {...register('uom')}
                className="input"
              >
                <option value="units/hour">Units per Hour</option>
                <option value="kg/hour">KG per Hour</option>
                <option value="meters/hour">Meters per Hour</option>
                <option value="pieces/hour">Pieces per Hour</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Speed (pcs/menit)
              </label>
              <input
                type="number"
                {...register('default_speed', { min: 0 })}
                className="input"
                placeholder="Speed mesin untuk perhitungan efisiensi"
              />
              <p className="mt-1 text-xs text-gray-500">Speed default untuk input produksi (pcs per menit)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Efisiensi (%)
              </label>
              <input
                type="number"
                {...register('target_efficiency', { min: 0, max: 100 })}
                className="input"
                placeholder="60"
              />
              <p className="mt-1 text-xs text-gray-500">Target efisiensi mesin (default 60%)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                {...register('location')}
                className="input"
                placeholder="Machine location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maintenance Schedule
              </label>
              <select
                {...register('maintenance_schedule')}
                className="input"
              >
                <option value="">Select schedule</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <textarea
                {...register('specifications')}
                rows={3}
                className="input"
                placeholder="Technical specifications and details"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <textarea
                {...register('notes')}
                rows={2}
                className="input"
                placeholder="Additional notes"
              />
            </div>

            <div className="lg:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('is_active')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Machine is active
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/app/production/machines')}
            className="btn-secondary"
          >{t('common.cancel')}</button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? 'Saving...' : isEdit ? 'Update Machine' : 'Create Machine'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default MachineForm
