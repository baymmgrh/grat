import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import axiosInstance from '../../utils/axiosConfig'
import LoadingSpinner from '../../components/Common/LoadingSpinner'
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon
,
  PhoneIcon,
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

interface Opportunity {
  id: number
  opportunity_number: string
  name: string
}

interface User {
  id: number
  full_name: string
  email: string
}

const ActivityForm = () => {
  const navigate = useNavigate()
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [users, setUsers] = useState<User[]>([])

  const [formData, setFormData] = useState({
    subject: '',
    activity_type: '',
    description: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    priority: 'medium',
    status: 'pending',
    assigned_to: '',
    related_to_type: '', // customer, lead, opportunity
    customer_id: '',
    lead_id: '',
    opportunity_id: '',
    location: '',
    notes: ''
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [customersRes, leadsRes, opportunitiesRes, usersRes] = await Promise.all([
        axiosInstance.get('/api/sales/customers?per_page=100'),
        axiosInstance.get('/api/sales/leads?per_page=100'),
        axiosInstance.get('/api/sales/opportunities?per_page=100'),
        axiosInstance.get('/api/users?per_page=100')
      ])

      setCustomers(customersRes.data.customers || [])
      setLeads(leadsRes.data.leads || [])
      setOpportunities(opportunitiesRes.data.opportunities || [])
      setUsers(usersRes.data.users || [])

    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear related IDs when changing related_to_type
    if (field === 'related_to_type') {
      setFormData(prev => ({
        ...prev,
        customer_id: '',
        lead_id: '',
        opportunity_id: ''
      }))
    }

    // Auto-set end date/time based on activity type and duration
    if (field === 'start_date' || field === 'start_time') {
      const startDateTime = new Date(`${formData.start_date || value}T${formData.start_time || value}`)
      if (!isNaN(startDateTime.getTime())) {
        // Default durations by activity type
        const durations = {
          call: 30, // 30 minutes
          meeting: 60, // 1 hour
          email: 15, // 15 minutes
          task: 120, // 2 hours
          note: 5 // 5 minutes
        }
        
        const duration = durations[formData.activity_type as keyof typeof durations] || 60
        const endDateTime = new Date(startDateTime.getTime() + duration * 60000)
        
        setFormData(prev => ({
          ...prev,
          end_date: endDateTime.toISOString().split('T')[0],
          end_time: endDateTime.toTimeString().slice(0, 5)
        }))
      }
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <PhoneIcon className="h-5 w-5" />
      case 'email': return <EnvelopeIcon className="h-5 w-5" />
      case 'meeting': return <CalendarDaysIcon className="h-5 w-5" />
      case 'task': return <CheckCircleIcon className="h-5 w-5" />
      case 'note': return <DocumentTextIcon className="h-5 w-5" />
      default: return <CalendarDaysIcon className="h-5 w-5" />
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Combine date and time for start/end datetime
      const startDateTime = formData.start_date && formData.start_time 
        ? `${formData.start_date}T${formData.start_time}:00`
        : null
      
      const endDateTime = formData.end_date && formData.end_time 
        ? `${formData.end_date}T${formData.end_time}:00`
        : null

      const payload = {
        subject: formData.subject,
        activity_type: formData.activity_type,
        description: formData.description,
        start_date: startDateTime,
        end_date: endDateTime,
        priority: formData.priority,
        status: formData.status,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : undefined,
        customer_id: formData.customer_id ? parseInt(formData.customer_id) : undefined,
        lead_id: formData.lead_id ? parseInt(formData.lead_id) : undefined,
        opportunity_id: formData.opportunity_id ? parseInt(formData.opportunity_id) : undefined,
        location: formData.location || undefined,
        notes: formData.notes || undefined
      }

      const response = await axiosInstance.post('/api/sales/activities', payload)
      
      alert(`Activity created successfully!\nActivity #: ${response.data.activity_number}`)
      navigate('/app/sales/activities')
      
    } catch (error: any) {
      console.error('Error creating activity:', error)
      alert(`Error creating activity: ${error.response?.data?.error || error.message}`)
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
            onClick={() => navigate('/app/sales/activities')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📋 {t('sales.new_activity')}</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Create a new sales activity</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Activity Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Activity Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Type *
              </label>
              <select
                className="input w-full"
                value={formData.activity_type}
                onChange={(e) => handleInputChange('activity_type', e.target.value)}
                required
              >
                <option value="">Select type...</option>
                <option value="call">📞 Phone Call</option>
                <option value="email">📧 Email</option>
                <option value="meeting">🤝 Meeting</option>
                <option value="task">✅ Task</option>
                <option value="note">📝 Note</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                className="input w-full"
                placeholder="e.g., Follow-up call with prospect"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.description')}</label>
              <textarea
                className="input w-full"
                rows={3}
                placeholder="Detailed description of the activity..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>

            {/* Start Date & Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                Start Date & Time
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="input"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <input
                  type="time"
                  className="input"
                  value={formData.start_time}
                  onChange={(e) => handleInputChange('start_time', e.target.value)}
                />
              </div>
            </div>

            {/* End Date & Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ClockIcon className="h-4 w-4 inline mr-1" />
                End Date & Time
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="input"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  min={formData.start_date || new Date().toISOString().split('T')[0]}
                />
                <input
                  type="time"
                  className="input"
                  value={formData.end_time}
                  onChange={(e) => handleInputChange('end_time', e.target.value)}
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
              </label>
              <select
                className="input w-full"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.status')}</label>
              <select
                className="input w-full"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <option value="pending">⏳ Pending</option>
                <option value="in_progress">🔄 In Progress</option>
                <option value="completed">✅ Completed</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
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

            {/* Location (for meetings) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <input
                type="text"
                className="input w-full"
                placeholder="e.g., Conference Room A, Zoom, Customer Office"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Related To Section */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Related To</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Related To Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Related To Type
              </label>
              <select
                className="input w-full"
                value={formData.related_to_type}
                onChange={(e) => handleInputChange('related_to_type', e.target.value)}
              >
                <option value="">Select relation...</option>
                <option value="customer">Customer</option>
                <option value="lead">Lead</option>
                <option value="opportunity">Opportunity</option>
              </select>
            </div>

            {/* Related Record Selection */}
            <div>
              {formData.related_to_type === 'customer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BuildingOfficeIcon className="h-4 w-4 inline mr-1" />
                  </label>
                  <select
                    className="input w-full"
                    value={formData.customer_id}
                    onChange={(e) => handleInputChange('customer_id', e.target.value)}
                  >
                    <option value="">Select customer...</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.company_name} ({customer.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.related_to_type === 'lead' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <UserIcon className="h-4 w-4 inline mr-1" />
                  </label>
                  <select
                    className="input w-full"
                    value={formData.lead_id}
                    onChange={(e) => handleInputChange('lead_id', e.target.value)}
                  >
                    <option value="">Select lead...</option>
                    {leads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.company_name} ({lead.contact_person})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.related_to_type === 'opportunity' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎯 Opportunity
                  </label>
                  <select
                    className="input w-full"
                    value={formData.opportunity_id}
                    onChange={(e) => handleInputChange('opportunity_id', e.target.value)}
                  >
                    <option value="">Select opportunity...</option>
                    {opportunities.map((opportunity) => (
                      <option key={opportunity.id} value={opportunity.id}>
                        {opportunity.name} ({opportunity.opportunity_number})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!formData.related_to_type && (
                <div className="text-sm text-gray-500 italic">
                  Select a relation type first
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Notes</h2>
          <textarea
            className="input w-full"
            rows={4}
            placeholder="Any additional notes or follow-up actions..."
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/app/sales/activities')}
            className="btn-secondary"
            disabled={submitting}
          >{t('common.cancel')}</button>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || !formData.subject || !formData.activity_type}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                {getActivityIcon(formData.activity_type)}
                <span className="ml-2">Create Activity</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ActivityForm
