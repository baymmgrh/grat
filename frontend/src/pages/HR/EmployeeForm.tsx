import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  useGetDepartmentsQuery,
  useCreateEmployeeMutation
} from '../../services/api'
interface EmployeeFormData {
  employee_number: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  date_of_birth?: string
  gender?: string
  department_id?: number
  position?: string
  employment_type?: string
  hire_date?: string
  address?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
}

export default function EmployeeForm() {
    const { t } = useLanguage();

const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  
  const { data: departments } = useGetDepartmentsQuery({})
  const [createEmployee] = useCreateEmployeeMutation()
  
  const { register, handleSubmit, formState: { errors } } = useForm<EmployeeFormData>({
    defaultValues: {
      hire_date: new Date().toISOString().split('T')[0]
    }
  })

  const employmentTypes = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'intern', label: 'Intern' },
    { value: 'consultant', label: 'Consultant' }
  ]

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ]

  const onSubmit = async (data: EmployeeFormData) => {
    setIsLoading(true)
    try {
      await createEmployee({
        ...data,
        department_id: data.department_id ? parseInt(data.department_id.toString()) : undefined
      }).unwrap()
      
      toast.success('Employee created successfully!')
      navigate('/app/hr/employees')
    } catch (error: any) {
      toast.error(error.data?.error || 'Failed to create employee')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Employee</h1>
          <p className="text-gray-600">Create a new employee record</p>
        </div>
        <button
          onClick={() => navigate('/app/hr/employees')}
          className="btn-secondary"
        >
          Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee Number *
              </label>
              <input
                type="text"
                {...register('employee_number', { required: 'Employee number is required' })}
                className="input-field"
                placeholder="e.g., EMP001"
              />
              {errors.employee_number && (
                <p className="mt-1 text-sm text-red-600">{errors.employee_number.message}</p>
              )}
            </div>

            <div></div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                {...register('first_name', { required: 'First name is required' })}
                className="input-field"
                placeholder="First name"
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                {...register('last_name', { required: 'Last name is required' })}
                className="input-field"
                placeholder="Last name"
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <input
                type="email"
                {...register('email')}
                className="input-field"
                placeholder="employee@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="input-field"
                placeholder="+62-xxx-xxxx-xxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                {...register('date_of_birth')}
                className="input-field"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <select {...register('gender')} className="input-field">
                <option value="">Select gender</option>
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <textarea
                {...register('address')}
                rows={3}
                className="input-field"
                placeholder="Full address..."
              />
            </div>
          </div>
        </div>

        {/* Employment Information */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Employment Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <select {...register('department_id')} className="input-field">
                <option value="">Select department</option>
                {departments?.departments?.map((dept: any) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <input
                type="text"
                {...register('position')}
                className="input-field"
                placeholder="e.g., Production Operator"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employment Type
              </label>
              <select {...register('employment_type')} className="input-field">
                <option value="">Select employment type</option>
                {employmentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hire Date
              </label>
              <input
                type="date"
                {...register('hire_date')}
                className="input-field"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name
              </label>
              <input
                type="text"
                {...register('emergency_contact_name')}
                className="input-field"
                placeholder="Emergency contact name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                {...register('emergency_contact_phone')}
                className="input-field"
                placeholder="+62-xxx-xxxx-xxxx"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/app/hr/employees')}
            className="btn-secondary"
            disabled={isLoading}
          >{t('common.cancel')}</button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Employee'}
          </button>
        </div>
      </form>

      {/* HR Information Notice */}
      <div className="card p-4 bg-blue-50 border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">📋 HR Information</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Employee number should be unique across the organization</li>
          <li>• Department assignment will determine access permissions and reporting structure</li>
          <li>• Employment type affects benefits calculation and working hour policies</li>
          <li>• Emergency contact information is required for safety compliance</li>
        </ul>
      </div>
    </div>
  )
}
