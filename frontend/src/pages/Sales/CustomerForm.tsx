import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import { useForm } from 'react-hook-form'
import axiosInstance from '../../utils/axiosConfig'
import LoadingSpinner from '../../components/Common/LoadingSpinner'
import {
  ArrowLeftIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface CustomerFormData {
  code: string
  company_name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  customer_type: string
  credit_limit?: number
  payment_terms?: string
  tax_number?: string
  website?: string
  industry?: string
  notes?: string
  is_active: boolean
}

const CustomerForm = () => {
    const { t } = useLanguage();
    const navigate = useNavigate()
    const { id } = useParams()
    const isEdit = !!id
  
  const [isLoading, setIsLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CustomerFormData>({
    defaultValues: {
      customer_type: 'retail',
      credit_limit: 0,
      payment_terms: 'Net 30',
      country: 'Indonesia',
      is_active: true
    }
  })

  useEffect(() => {
    if (isEdit && id) {
      loadCustomer()
    }
  }, [isEdit, id])

  const loadCustomer = async () => {
    try {
      setLoadingData(true)
      const response = await axiosInstance.get(`/api/sales/customers/${id}`)
      const customer = response.data.customer
      
      // Populate form fields
      Object.keys(customer).forEach((key) => {
        if (customer[key] !== null && customer[key] !== undefined) {
          setValue(key as keyof CustomerFormData, customer[key])
        }
      })
    } catch (error) {
      console.error('Error loading customer:', error)
      alert('Failed to load customer data')
    } finally {
      setLoadingData(false)
    }
  }

  const customerTypes = [
    { value: 'retail', label: 'Retail' },
    { value: 'wholesale', label: 'Wholesale' },
    { value: 'distributor', label: 'Distributor' },
    { value: 'corporate', label: 'Corporate' }
  ]

  const paymentTerms = [
    { value: 'COD', label: 'Cash on Delivery' },
    { value: 'Net 7', label: 'Net 7 days' },
    { value: 'Net 15', label: 'Net 15 days' },
    { value: 'Net 30', label: 'Net 30 days' },
    { value: 'Net 45', label: 'Net 45 days' },
    { value: 'Net 60', label: 'Net 60 days' }
  ]

  const industries = [
    'Manufacturing', 'Retail', 'Technology', 'Healthcare', t('navigation.finance'), 
    'Education', 'Construction', 'Food & Beverage', 'Automotive', 
    'Textile', 'Chemical', 'Electronics', 'Other'
  ]

  const onSubmit = async (data: CustomerFormData) => {
    setIsLoading(true)
    try {
      const payload = {
        ...data,
        credit_limit: parseFloat(data.credit_limit?.toString() || '0'),
        is_active: data.is_active ?? true
      }

      if (isEdit) {
        await axiosInstance.put(`/api/sales/customers/${id}`, payload)
        alert('Customer updated successfully!')
      } else {
        await axiosInstance.post('/api/sales/customers', payload)
        alert('Customer created successfully!')
      }
      
      navigate('/app/sales/customers')
    } catch (error: any) {
      console.error('Error saving customer:', error)
      alert(error.response?.data?.error || 'Failed to save customer')
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
            onClick={() => navigate('/app/sales/customers')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? '✏️ Edit Customer' : '🏢 Create Customer'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit ? 'Update customer information' : 'Add a new customer to your database'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Code *
              </label>
              <input
                type="text"
                {...register('code', { required: 'Customer code is required' })}
                className="input"
                placeholder="e.g., CUST-001"
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                {...register('company_name', { required: 'Company name is required' })}
                className="input"
                placeholder="Company or business name"
              />
              {errors.company_name && (
                <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Person
              </label>
              <input
                type="text"
                {...register('contact_person')}
                className="input"
                placeholder="Primary contact name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Type
              </label>
              <select
                {...register('customer_type')}
                className="input"
              >
                {customerTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <select
                {...register('industry')}
                className="input"
              >
                <option value="">Select industry</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <input
                type="url"
                {...register('website')}
                className="input"
                placeholder="https://www.example.com"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <UserIcon className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                {...register('email', {
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Please enter a valid email address'
                  }
                })}
                className="input"
                placeholder="customer@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="input"
                placeholder="+62 21 1234567"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <textarea
                {...register('address')}
                rows={3}
                className="input"
                placeholder="Complete business address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <input
                type="text"
                {...register('city')}
                className="input"
                placeholder="City name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State/Province
              </label>
              <input
                type="text"
                {...register('state')}
                className="input"
                placeholder="State or province"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postal Code
              </label>
              <input
                type="text"
                {...register('postal_code')}
                className="input"
                placeholder="Postal/ZIP code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <input
                type="text"
                {...register('country')}
                className="input"
                placeholder="Country name"
              />
            </div>
          </div>
        </div>

        {/* Business Information */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <BanknotesIcon className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credit Limit (Rp)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('credit_limit')}
                className="input"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Terms
              </label>
              <select
                {...register('payment_terms')}
                className="input"
              >
                {paymentTerms.map((term) => (
                  <option key={term.value} value={term.value}>
                    {term.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Number
              </label>
              <input
                type="text"
                {...register('tax_number')}
                className="input"
                placeholder="Tax identification number"
              />
            </div>

            <div className="flex items-center">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  {...register('is_active')}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label className="font-medium text-gray-700">Active Customer</label>
                <p className="text-gray-500">Customer can place orders and receive services</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <InformationCircleIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Additional Notes</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Internal Notes
            </label>
            <textarea
              {...register('notes')}
              rows={4}
              className="input"
              placeholder="Any additional information about this customer..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/app/sales/customers')}
            className="btn-secondary"
            disabled={isLoading}
          >{t('common.cancel')}</button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Customer' : 'Create Customer')}
          </button>
        </div>
      </form>

      {/* Guidelines */}
      <div className="card p-4 bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">📋 Customer Guidelines</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Customer code should be unique and easy to remember</li>
              <li>• Complete contact information helps with communication</li>
              <li>• Set appropriate credit limits to manage financial risk</li>
              <li>• Choose payment terms that align with your business policy</li>
              <li>• Regular customers can be marked as active for easier tracking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerForm
