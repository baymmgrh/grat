import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import axiosInstance from '../../utils/axiosConfig'
import LoadingSpinner from '../../components/Common/LoadingSpinner'
import {
  ArrowLeftIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  DocumentTextIcon,
  TagIcon
,
  UserIcon
} from '@heroicons/react/24/outline';

interface Customer {
  id: number
  code: string
  company_name: string
}

interface Lead {
  id: number
  lead_number: string
  company_name: string
  contact_person: string
}

interface Pipeline {
  id: number
  name: string
  is_default: boolean
  stages: PipelineStage[]
}

interface PipelineStage {
  id: number
  name: string
  order: number
  probability: number
  color_code: string
}

interface User {
  id: number
  full_name: string
  email: string
}

const OpportunityForm = () => {
  const navigate = useNavigate()
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    lead_id: '',
    customer_id: '',
    pipeline_id: '',
    stage_id: '',
    value: '',
    probability: '',
    expected_close_date: '',
    assigned_to: '',
    source: ''
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (formData.pipeline_id) {
      const pipeline = pipelines.find(p => p.id.toString() === formData.pipeline_id)
      setSelectedPipeline(pipeline || null)
      
      // Set first stage as default if no stage selected
      if (pipeline && pipeline.stages.length > 0 && !formData.stage_id) {
        const firstStage = pipeline.stages.sort((a, b) => a.order - b.order)[0]
        setFormData(prev => ({ 
          ...prev, 
          stage_id: firstStage.id.toString(),
          probability: firstStage.probability.toString()
        }))
      }
    }
  }, [formData.pipeline_id, pipelines])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [customersRes, leadsRes, pipelinesRes, usersRes] = await Promise.all([
        axiosInstance.get('/api/sales/customers?per_page=100'),
        axiosInstance.get('/api/sales/leads?status=qualified&per_page=100'),
        axiosInstance.get('/api/sales/pipelines'),
        axiosInstance.get('/api/users?per_page=100')
      ])

      setCustomers(customersRes.data.customers || [])
      setLeads(leadsRes.data.leads || [])
      setPipelines(pipelinesRes.data.pipelines || [])
      setUsers(usersRes.data.users || [])

      // Set default pipeline
      const defaultPipeline = pipelinesRes.data.pipelines?.find((p: Pipeline) => p.is_default)
      if (defaultPipeline) {
        setFormData(prev => ({ ...prev, pipeline_id: defaultPipeline.id.toString() }))
      }

    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Update probability when stage changes
    if (field === 'stage_id' && selectedPipeline) {
      const stage = selectedPipeline.stages.find(s => s.id.toString() === value)
      if (stage) {
        setFormData(prev => ({ ...prev, probability: stage.probability.toString() }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        lead_id: formData.lead_id ? parseInt(formData.lead_id) : undefined,
        customer_id: formData.customer_id ? parseInt(formData.customer_id) : undefined,
        pipeline_id: parseInt(formData.pipeline_id),
        stage_id: parseInt(formData.stage_id),
        value: parseFloat(formData.value) || 0,
        probability: parseInt(formData.probability) || 0,
        expected_close_date: formData.expected_close_date || undefined,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : undefined,
        source: formData.source || undefined
      }

      const response = await axiosInstance.post('/api/sales/opportunities', payload)
      
      alert(`Opportunity created successfully!\nOpportunity #: ${response.data.opportunity_number}`)
      navigate('/app/sales/opportunities')
      
    } catch (error: any) {
      console.error('Error creating opportunity:', error)
      alert(`Error creating opportunity: ${error.response?.data?.error || error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/sales/opportunities')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🎯 {t('sales.new_opportunity')}</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Create a new sales opportunity</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Opportunity Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Opportunity Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                Opportunity Name *
              </label>
              <input
                type="text"
                className="input w-full"
                placeholder="e.g., Q4 Manufacturing Equipment Deal"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.description')}</label>
              <textarea
                className="input w-full"
                rows={3}
                placeholder="Brief description of the opportunity..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>

            {/* Lead Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="h-4 w-4 inline mr-1" />
                Related Lead
              </label>
              <select
                className="input w-full"
                value={formData.lead_id}
                onChange={(e) => {
                  handleInputChange('lead_id', e.target.value)
                  // Clear customer if lead is selected
                  if (e.target.value) {
                    handleInputChange('customer_id', '')
                  }
                }}
              >
                <option value="">Select a lead...</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.company_name} ({lead.contact_person})
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BuildingOfficeIcon className="h-4 w-4 inline mr-1" />
                Related Customer
              </label>
              <select
                className="input w-full"
                value={formData.customer_id}
                onChange={(e) => {
                  handleInputChange('customer_id', e.target.value)
                  // Clear lead if customer is selected
                  if (e.target.value) {
                    handleInputChange('lead_id', '')
                  }
                }}
                disabled={!!formData.lead_id}
              >
                <option value="">Select a customer...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.company_name} ({customer.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Pipeline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ChartBarIcon className="h-4 w-4 inline mr-1" />
                Sales Pipeline *
              </label>
              <select
                className="input w-full"
                value={formData.pipeline_id}
                onChange={(e) => handleInputChange('pipeline_id', e.target.value)}
                required
              >
                <option value="">Select pipeline...</option>
                {pipelines.map((pipeline) => (
                  <option key={pipeline.id} value={pipeline.id}>
                    {pipeline.name} {pipeline.is_default ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Stage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TagIcon className="h-4 w-4 inline mr-1" />
                Pipeline Stage *
              </label>
              <select
                className="input w-full"
                value={formData.stage_id}
                onChange={(e) => handleInputChange('stage_id', e.target.value)}
                required
                disabled={!selectedPipeline}
              >
                <option value="">Select stage...</option>
                {selectedPipeline?.stages
                  .sort((a, b) => a.order - b.order)
                  .map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name} ({stage.probability}%)
                    </option>
                  ))
                }
              </select>
            </div>

            {/* Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BanknotesIcon className="h-4 w-4 inline mr-1" />
                Opportunity Value (Rp)
              </label>
              <input
                type="number"
                className="input w-full"
                placeholder="0"
                min="0"
                step="1000"
                value={formData.value}
                onChange={(e) => handleInputChange('value', e.target.value)}
              />
            </div>

            {/* Probability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Probability (%)
              </label>
              <input
                type="number"
                className="input w-full"
                placeholder="0"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => handleInputChange('probability', e.target.value)}
              />
            </div>

            {/* Expected Close Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                Expected Close Date
              </label>
              <input
                type="date"
                className="input w-full"
                value={formData.expected_close_date}
                onChange={(e) => handleInputChange('expected_close_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="h-4 w-4 inline mr-1" />
                Assigned To
              </label>
              <select
                className="input w-full"
                value={formData.assigned_to}
                onChange={(e) => handleInputChange('assigned_to', e.target.value)}
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Source */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <select
                className="input w-full"
                value={formData.source}
                onChange={(e) => handleInputChange('source', e.target.value)}
              >
                <option value="">Select source...</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="cold_call">Cold Call</option>
                <option value="email_campaign">Email Campaign</option>
                <option value="social_media">Social Media</option>
                <option value="trade_show">Trade Show</option>
                <option value="partner">Partner</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/app/sales/opportunities')}
            className="btn-secondary"
            disabled={submitting}
          >{t('common.cancel')}</button>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || !formData.name || !formData.pipeline_id || !formData.stage_id}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              'Create Opportunity'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default OpportunityForm
