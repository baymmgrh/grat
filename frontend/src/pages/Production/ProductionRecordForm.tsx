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

  useEffect(() => {
    loadFormData()
    if (isEdit && id) {
      loadRecord()
    }
  }, [isEdit, id])

  const loadFormData = async () => {
    try {
      setLoadingData(true)
      const [workOrdersRes, machinesRes, operatorsRes] = await Promise.all([
        axiosInstance.get('/api/production/work-orders?status=in_progress'),
        axiosInstance.get('/api/production/machines?is_active=true'),
        axiosInstance.get('/api/auth/users')
      ])
      
      setWorkOrders(workOrdersRes.data.work_orders || [])
      setMachines(machinesRes.data.machines || [])
      setOperators(operatorsRes.data.users || [])
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
