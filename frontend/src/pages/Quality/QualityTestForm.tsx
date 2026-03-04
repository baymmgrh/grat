import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  useCreateQualityTestMutation,
  useGetProductsQuery,
  useGetEmployeesQuery
} from '../../services/api'
import {
  BeakerIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
interface QualityTestFormData {
  test_type: string
  product_id: number
  batch_number?: string
  lot_number?: string
  test_date: string
  tested_by?: number
  sample_size?: number
  test_method?: string
  test_environment?: string
  temperature?: number
  humidity?: number
  notes?: string
  test_parameters: {
    parameter_name: string
    expected_value: string
    actual_value: string
    unit?: string
    result_status: 'passed' | 'failed' | 'conditional'
    notes?: string
  }[]
}

export default function QualityTestForm() {
    const { t } = useLanguage();

const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  
  const { data: products } = useGetProductsQuery({})
  const { data: employees } = useGetEmployeesQuery({})
  const [createQualityTest] = useCreateQualityTestMutation()
  
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<QualityTestFormData>({
    defaultValues: {
      test_date: new Date().toISOString().slice(0, 16), // datetime-local format
      sample_size: 1,
      temperature: 25,
      humidity: 60,
      test_parameters: [
        { parameter_name: '', expected_value: '', actual_value: '', unit: '', result_status: 'passed', notes: '' }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'test_parameters'
  })

  const testTypes = [
    { value: 'incoming_inspection', label: 'Incoming Inspection' },
    { value: 'in_process_testing', label: 'In-Process Testing' },
    { value: 'final_inspection', label: 'Final Inspection' },
    { value: 'batch_testing', label: 'Batch Testing' },
    { value: 'stability_testing', label: 'Stability Testing' },
    { value: 'microbiological', label: 'Microbiological Testing' },
    { value: 'physical_properties', label: 'Physical Properties' },
    { value: 'chemical_analysis', label: 'Chemical Analysis' },
    { value: 'performance_test', label: 'Performance Test' },
    { value: 'packaging_test', label: 'Packaging Test' }
  ]

  const commonParameters = {
    nonwoven: [
      { name: 'GSM (g/m²)', unit: 'g/m²' },
      { name: 'Tensile Strength', unit: 'N/cm' },
      { name: 'Absorbency', unit: 'ml/g' },
      { name: 'pH Level', unit: 'pH' },
      { name: 'Thickness', unit: 'mm' },
      { name: 'Width', unit: 'cm' },
      { name: 'Length', unit: 'm' }
    ],
    antiseptic: [
      { name: 'Alcohol Content', unit: '%' },
      { name: 'pH Level', unit: 'pH' },
      { name: 'Viscosity', unit: 'cP' },
      { name: 'Microbial Content', unit: 'CFU/ml' },
      { name: 'Fragrance Intensity', unit: 'score' }
    ],
    packaging: [
      { name: 'Seal Integrity', unit: 'pass/fail' },
      { name: 'Drop Test', unit: 'pass/fail' },
      { name: 'Compression Test', unit: 'kg' },
      { name: 'Moisture Resistance', unit: '%' }
    ]
  }

  const testEnvironments = [
    { value: 'lab_standard', label: 'Laboratory Standard Conditions' },
    { value: 'controlled_temp', label: 'Controlled Temperature' },
    { value: 'controlled_humidity', label: 'Controlled Humidity' },
    { value: 'ambient', label: 'Ambient Conditions' },
    { value: 'accelerated', label: 'Accelerated Conditions' }
  ]

  const calculateOverallResult = () => {
    const parameters = watch('test_parameters')
    if (!parameters || parameters.length === 0) return 'pending'
    
    const hasFailed = parameters.some(p => p.result_status === 'failed')
    const hasConditional = parameters.some(p => p.result_status === 'conditional')
    
    if (hasFailed) return 'failed'
    if (hasConditional) return 'conditional'
    return 'passed'
  }

  const onSubmit = async (data: QualityTestFormData) => {
    setIsLoading(true)
    try {
      // Validate test parameters
      const validParameters = data.test_parameters.filter(param => 
        param.parameter_name && param.expected_value && param.actual_value
      )

      if (validParameters.length === 0) {
        toast.error('Please add at least one valid test parameter')
        return
      }

      const overallResult = calculateOverallResult()

      await createQualityTest({
        ...data,
        product_id: parseInt(data.product_id.toString()),
        tested_by: data.tested_by ? parseInt(data.tested_by.toString()) : undefined,
        sample_size: data.sample_size ? parseInt(data.sample_size.toString()) : undefined,
        temperature: data.temperature ? parseFloat(data.temperature.toString()) : undefined,
        humidity: data.humidity ? parseFloat(data.humidity.toString()) : undefined,
        overall_result: overallResult,
        test_parameters: validParameters
      }).unwrap()
      
      toast.success('Quality test created successfully!')
      navigate('/app/quality/tests')
    } catch (error: any) {
      toast.error(error.data?.error || 'Failed to create quality test')
    } finally {
      setIsLoading(false)
    }
  }

  const addParameter = () => {
    append({ parameter_name: '', expected_value: '', actual_value: '', unit: '', result_status: 'passed', notes: '' })
  }

  const addCommonParameters = (type: 'nonwoven' | 'antiseptic' | 'packaging') => {
    const params = commonParameters[type]
    params.forEach(param => {
      append({
        parameter_name: param.name,
        expected_value: '',
        actual_value: '',
        unit: param.unit,
        result_status: 'passed',
        notes: ''
      })
    })
  }

  const selectedProduct = products?.products?.find((p: any) => p.id == watch('product_id'))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Quality Test</h1>
          <p className="text-gray-600">Perform quality control testing and record results</p>
        </div>
        <button
          onClick={() => navigate('/app/quality/tests')}
          className="btn-secondary"
        >
          Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Test Information */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <BeakerIcon className="h-5 w-5" />
            Test Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Type *
              </label>
              <select
                {...register('test_type', { required: 'Test type is required' })}
                className="input-field"
              >
                <option value="">Select test type</option>
                {testTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.test_type && (
                <p className="mt-1 text-sm text-red-600">{errors.test_type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product *
              </label>
              <select
                {...register('product_id', { required: 'Product is required' })}
                className="input-field"
              >
                <option value="">Select product</option>
                {products?.products?.map((product: any) => (
                  <option key={product.id} value={product.id}>
                    {product.code} - {product.name}
                  </option>
                ))}
              </select>
              {errors.product_id && (
                <p className="mt-1 text-sm text-red-600">{errors.product_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Number
              </label>
              <input
                type="text"
                {...register('batch_number')}
                className="input-field"
                placeholder="Batch number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lot Number
              </label>
              <input
                type="text"
                {...register('lot_number')}
                className="input-field"
                placeholder="Lot number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Date & Time *
              </label>
              <input
                type="datetime-local"
                {...register('test_date', { required: 'Test date is required' })}
                className="input-field"
              />
              {errors.test_date && (
                <p className="mt-1 text-sm text-red-600">{errors.test_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tested By
              </label>
              <select {...register('tested_by')} className="input-field">
                <option value="">Select tester</option>
                {employees?.employees?.map((employee: any) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.employee_number} - {employee.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sample Size
              </label>
              <input
                type="number"
                min="1"
                {...register('sample_size')}
                className="input-field"
                placeholder="Number of samples"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Method
              </label>
              <input
                type="text"
                {...register('test_method')}
                className="input-field"
                placeholder="e.g., ASTM D123, ISO 9001"
              />
            </div>
          </div>

          {/* Product Info Display */}
          {selectedProduct && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Product Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Category:</span>
                  <p className="font-medium">{selectedProduct.category || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-blue-600">Material Type:</span>
                  <p className="font-medium">{selectedProduct.material_type?.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="text-blue-600">Nonwoven Category:</span>
                  <p className="font-medium">{selectedProduct.nonwoven_category || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-blue-600">UOM:</span>
                  <p className="font-medium">{selectedProduct.primary_uom}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Test Environment */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Test Environment</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Environment Type
              </label>
              <select {...register('test_environment')} className="input-field">
                <option value="">Select environment</option>
                {testEnvironments.map((env) => (
                  <option key={env.value} value={env.value}>
                    {env.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                {...register('temperature')}
                className="input-field"
                placeholder="25.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Humidity (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                {...register('humidity')}
                className="input-field"
                placeholder="60.0"
              />
            </div>
          </div>
        </div>

        {/* Test Parameters */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Test Parameters</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addCommonParameters('nonwoven')}
                className="btn-secondary text-xs"
              >
                Add Nonwoven Tests
              </button>
              <button
                type="button"
                onClick={() => addCommonParameters('antiseptic')}
                className="btn-secondary text-xs"
              >
                Add Antiseptic Tests
              </button>
              <button
                type="button"
                onClick={() => addCommonParameters('packaging')}
                className="btn-secondary text-xs"
              >
                Add Packaging Tests
              </button>
              <button
                type="button"
                onClick={addParameter}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Add Parameter
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parameter Name *
                    </label>
                    <input
                      type="text"
                      {...register(`test_parameters.${index}.parameter_name` as const, {
                        required: 'Parameter name is required'
                      })}
                      className="input-field"
                      placeholder="e.g., GSM, pH Level"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Value *
                    </label>
                    <input
                      type="text"
                      {...register(`test_parameters.${index}.expected_value` as const, {
                        required: 'Expected value is required'
                      })}
                      className="input-field"
                      placeholder="Target value"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Actual Value *
                    </label>
                    <input
                      type="text"
                      {...register(`test_parameters.${index}.actual_value` as const, {
                        required: 'Actual value is required'
                      })}
                      className="input-field"
                      placeholder="Measured value"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                    </label>
                    <input
                      type="text"
                      {...register(`test_parameters.${index}.unit` as const)}
                      className="input-field"
                      placeholder="g/m², pH, %"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Result *
                    </label>
                    <select
                      {...register(`test_parameters.${index}.result_status` as const)}
                      className="input-field"
                    >
                      <option value="passed">Passed</option>
                      <option value="failed">Failed</option>
                      <option value="conditional">Conditional</option>
                    </select>
                  </div>

                  <div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="btn-danger p-2 mt-6"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parameter Notes
                  </label>
                  <textarea
                    {...register(`test_parameters.${index}.notes` as const)}
                    rows={2}
                    className="input-field"
                    placeholder="Additional notes about this parameter..."
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Overall Result */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Overall Test Result:</span>
              <span className={`px-4 py-2 rounded-lg font-medium ${
                calculateOverallResult() === 'passed' ? 'bg-green-100 text-green-800' :
                calculateOverallResult() === 'failed' ? 'bg-red-100 text-red-800' :
                calculateOverallResult() === 'conditional' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {calculateOverallResult().toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Notes</h3>
          <textarea
            {...register('notes')}
            rows={4}
            className="input-field"
            placeholder="Overall test observations, recommendations, or additional comments..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/app/quality/tests')}
            className="btn-secondary"
            disabled={isLoading}
          >{t('common.cancel')}</button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Quality Test'}
          </button>
        </div>
      </form>

      {/* Quality Tips */}
      <div className="card p-4 bg-purple-50 border border-purple-200">
        <h4 className="font-medium text-purple-900 mb-2">🧪 Quality Control Tips</h4>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• Ensure proper calibration of testing equipment before use</li>
          <li>• Document environmental conditions during testing</li>
          <li>• Use appropriate sample sizes for statistical significance</li>
          <li>• Follow standard test methods and procedures consistently</li>
          <li>• Record deviations and non-conformances immediately</li>
        </ul>
      </div>
    </div>
  )
}
