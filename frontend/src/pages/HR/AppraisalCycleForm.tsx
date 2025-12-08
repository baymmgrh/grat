import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import { useCreateAppraisalCycleMutation, useGetAppraisalTemplatesQuery } from '../../services/api'
import {
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
export default function AppraisalCycleForm() {
    const { t } = useLanguage();

const navigate = useNavigate()
  const [createAppraisalCycle, { isLoading }] = useCreateAppraisalCycleMutation()
  const { data: templatesData } = useGetAppraisalTemplatesQuery()
  
  const [formData, setFormData] = useState({
    cycle_name: '',
    cycle_type: 'annual',
    start_date: '',
    end_date: '',
    self_review_deadline: '',
    manager_review_deadline: '',
    template_id: '',
    description: '',
    status: 'draft'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createAppraisalCycle(formData).unwrap()
      alert('Appraisal cycle created successfully!')
      navigate('/app/hr/appraisal')
    } catch (error) {
      alert('Error creating appraisal cycle')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Auto-generate cycle name based on type and year
  const generateCycleName = () => {
    const currentYear = new Date().getFullYear()
    const cycleType = formData.cycle_type.charAt(0).toUpperCase() + formData.cycle_type.slice(1)
    const cycleName = `${cycleType} Performance Review ${currentYear}`
    setFormData({
      ...formData,
      cycle_name: cycleName
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/app/hr/appraisal')}
          className="btn-outline inline-flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Appraisal
        </button>
        <h1 className="text-2xl font-bold text-gray-900">New Appraisal Cycle</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cycle Name *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="cycle_name"
                  value={formData.cycle_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Annual Performance Review 2024"
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={generateCycleName}
                  className="btn-outline"
                >
                  Auto Generate
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cycle Type *
              </label>
              <select
                name="cycle_type"
                value={formData.cycle_type}
                onChange={handleChange}
                required
                className="input"
              >
                <option value="annual">Annual</option>
                <option value="semi_annual">Semi Annual</option>
                <option value="quarterly">Quarterly</option>
                <option value="probation">Probation</option>
                <option value="project_based">Project Based</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appraisal Template
              </label>
              <select
                name="template_id"
                value={formData.template_id}
                onChange={handleChange}
                className="input"
              >
                <option value="">Select Template (Optional)</option>
                {templatesData?.templates?.map((template: any) => (
                  <option key={template.id} value={template.id}>
                    {template.template_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cycle Start Date *
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
                Cycle End Date *
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
                Self Review Deadline
              </label>
              <input
                type="date"
                name="self_review_deadline"
                value={formData.self_review_deadline}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manager Review Deadline
              </label>
              <input
                type="date"
                name="manager_review_deadline"
                value={formData.manager_review_deadline}
                onChange={handleChange}
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
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
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
              placeholder="Optional description for this appraisal cycle..."
              className="input"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Appraisal Cycle Information</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Cycle will be created in Draft status by default</li>
              <li>• You can activate the cycle after setting up all parameters</li>
              <li>• Self review deadline should be before manager review deadline</li>
              <li>• All eligible employees will be automatically included in the cycle</li>
              <li>• You can customize appraisal criteria after creating the cycle</li>
            </ul>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/app/hr/appraisal')}
              className="btn-outline"
            >{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? 'Creating...' : 'Create Appraisal Cycle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
