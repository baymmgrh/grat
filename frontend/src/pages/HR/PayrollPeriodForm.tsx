import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import { useCreatePayrollPeriodMutation } from '../../services/api'
import {
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
export default function PayrollPeriodForm() {
    const { t } = useLanguage();

const navigate = useNavigate()
  const [createPayrollPeriod, { isLoading }] = useCreatePayrollPeriodMutation()
  
  const [formData, setFormData] = useState({
    period_name: '',
    start_date: '',
    end_date: '',
    pay_date: '',
    description: '',
    status: 'draft'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createPayrollPeriod(formData).unwrap()
      alert('Payroll period created successfully!')
      navigate('/app/hr/payroll')
    } catch (error) {
      alert('Error creating payroll period')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Auto-generate period name based on dates
  const generatePeriodName = () => {
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      
      const periodName = `${monthNames[startDate.getMonth()]} ${startDate.getFullYear()} - ${monthNames[endDate.getMonth()]} ${endDate.getFullYear()}`
      setFormData({
        ...formData,
        period_name: periodName
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/app/hr/payroll')}
          className="btn-outline inline-flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Payroll
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create Payroll Period</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period Name *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="period_name"
                  value={formData.period_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., January 2024 Payroll"
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={generatePeriodName}
                  className="btn-outline"
                >
                  Auto Generate
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period Start Date *
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period End Date *
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pay Date *
              </label>
              <input
                type="date"
                name="pay_date"
                value={formData.pay_date}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.status')}</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input"
              >
                <option value="draft">Draft</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="locked">Locked</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.description')}</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Optional description for this payroll period..."
              className="input"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Information</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Payroll period will be created in Draft status by default</li>
              <li>• You can calculate payroll after creating the period</li>
              <li>• Make sure all employee data is up to date before processing</li>
              <li>• Period dates should not overlap with existing periods</li>
            </ul>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/app/hr/payroll')}
              className="btn-outline"
            >{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? 'Creating...' : 'Create Payroll Period'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
