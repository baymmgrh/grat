import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ClockIcon,
  EnvelopeIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon
,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
interface ScheduledReport {
  id: string
  name: string
  reportType: string
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
    time: string
    dayOfWeek?: number
    dayOfMonth?: number
  }
  recipients: string[]
  format: 'pdf' | 'excel' | 'csv'
  isActive: boolean
  lastRun?: string
  nextRun: string
  createdAt: string
}

const mockScheduledReports: ScheduledReport[] = [
  {
    id: '1',
    name: 'Daily Sales Summary',
    reportType: 'sales-summary',
    schedule: {
      frequency: 'daily',
      time: '08:00'
    },
    recipients: ['manager@falmaco.com', 'sales@falmaco.com'],
    format: 'pdf',
    isActive: true,
    lastRun: '2025-10-07T08:00:00Z',
    nextRun: '2025-10-08T08:00:00Z',
    createdAt: '2025-09-01T10:00:00Z'
  },
  {
    id: '2',
    name: 'Weekly Production Report',
    reportType: 'production-efficiency',
    schedule: {
      frequency: 'weekly',
      time: '09:00',
      dayOfWeek: 1 // Monday
    },
    recipients: ['production@falmaco.com', 'manager@falmaco.com'],
    format: 'excel',
    isActive: true,
    lastRun: '2025-10-07T09:00:00Z',
    nextRun: '2025-10-14T09:00:00Z',
    createdAt: '2025-09-01T10:00:00Z'
  },
  {
    id: '3',
    name: 'Monthly Financial Summary',
    reportType: 'financial-summary',
    schedule: {
      frequency: 'monthly',
      time: '10:00',
      dayOfMonth: 1
    },
    recipients: ['finance@falmaco.com', 'ceo@falmaco.com'],
    format: 'pdf',
    isActive: false,
    nextRun: '2025-11-01T10:00:00Z',
    createdAt: '2025-09-01T10:00:00Z'
  }
]

const reportTypes = [
  { value: 'sales-summary', label: 'Sales Summary Report' },
  { value: 'production-efficiency', label: 'Production Efficiency Report' },
  { value: 'inventory-status', label: 'Inventory Status Report' },
  { value: 'financial-summary', label: 'Financial Summary Report' },
  { value: 'quality-metrics', label: 'Quality Metrics Report' },
  { value: 'waste-management', label: 'Waste Management Report' },
  { value: 'maintenance-schedule', label: 'Maintenance Schedule Report' }
]

const frequencies = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' }
]

const formats = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
  { value: 'csv', label: 'CSV' }
]

const daysOfWeek = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' }
]

export default function ReportScheduler() {
    const { t } = useLanguage();

const navigate = useNavigate()
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>(mockScheduledReports)
  const [showNewScheduleModal, setShowNewScheduleModal] = useState(false)
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null)
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    reportType: '',
    frequency: 'daily' as const,
    time: '08:00',
    dayOfWeek: 1,
    dayOfMonth: 1,
    recipients: [''],
    format: 'pdf' as const
  })

  const toggleReportStatus = (id: string) => {
    setScheduledReports(prev => 
      prev.map(report => 
        report.id === id 
          ? { ...report, isActive: !report.isActive }
          : report
      )
    )
    toast.success('Report schedule updated')
  }

  const deleteScheduledReport = (id: string) => {
    if (window.confirm('Are you sure you want to delete this scheduled report?')) {
      setScheduledReports(prev => prev.filter(report => report.id !== id))
      toast.success('Scheduled report deleted')
    }
  }

  const addRecipient = () => {
    setNewSchedule(prev => ({
      ...prev,
      recipients: [...prev.recipients, '']
    }))
  }

  const updateRecipient = (index: number, email: string) => {
    setNewSchedule(prev => ({
      ...prev,
      recipients: prev.recipients.map((recipient, i) => 
        i === index ? email : recipient
      )
    }))
  }

  const removeRecipient = (index: number) => {
    setNewSchedule(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }))
  }

  const saveSchedule = () => {
    if (!newSchedule.name.trim()) {
      toast.error('Please enter a schedule name')
      return
    }
    
    if (!newSchedule.reportType) {
      toast.error('Please select a report type')
      return
    }
    
    const validRecipients = newSchedule.recipients.filter(email => 
      email.trim() && email.includes('@')
    )
    
    if (validRecipients.length === 0) {
      toast.error('Please add at least one valid email recipient')
      return
    }

    const nextRun = calculateNextRun(newSchedule)
    
    const scheduledReport: ScheduledReport = {
      id: Date.now().toString(),
      name: newSchedule.name,
      reportType: newSchedule.reportType,
      schedule: {
        frequency: newSchedule.frequency,
        time: newSchedule.time,
        dayOfWeek: newSchedule.frequency === 'weekly' ? newSchedule.dayOfWeek : undefined,
        dayOfMonth: newSchedule.frequency === 'monthly' ? newSchedule.dayOfMonth : undefined
      },
      recipients: validRecipients,
      format: newSchedule.format,
      isActive: true,
      nextRun,
      createdAt: new Date().toISOString()
    }

    setScheduledReports(prev => [...prev, scheduledReport])
    setShowNewScheduleModal(false)
    setNewSchedule({
      name: '',
      reportType: '',
      frequency: 'daily',
      time: '08:00',
      dayOfWeek: 1,
      dayOfMonth: 1,
      recipients: [''],
      format: 'pdf'
    })
    toast.success('Report schedule created successfully')
  }

  const calculateNextRun = (schedule: typeof newSchedule) => {
    const now = new Date()
    const [hours, minutes] = schedule.time.split(':').map(Number)
    
    let nextRun = new Date()
    nextRun.setHours(hours, minutes, 0, 0)
    
    switch (schedule.frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1)
        }
        break
      case 'weekly':
        const targetDay = schedule.dayOfWeek
        const currentDay = nextRun.getDay()
        let daysUntilTarget = (targetDay - currentDay + 7) % 7
        if (daysUntilTarget === 0 && nextRun <= now) {
          daysUntilTarget = 7
        }
        nextRun.setDate(nextRun.getDate() + daysUntilTarget)
        break
      case 'monthly':
        nextRun.setDate(schedule.dayOfMonth)
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1)
        }
        break
      case 'quarterly':
        const currentMonth = nextRun.getMonth()
        const nextQuarterMonth = Math.ceil((currentMonth + 1) / 3) * 3
        nextRun.setMonth(nextQuarterMonth, 1)
        if (nextRun <= now) {
          nextRun.setMonth(nextQuarterMonth + 3, 1)
        }
        break
    }
    
    return nextRun.toISOString()
  }

  const formatNextRun = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFrequencyBadge = (frequency: string) => {
    const badges: Record<string, string> = {
      daily: 'badge-success',
      weekly: 'badge-info',
      monthly: 'badge-warning',
      quarterly: 'badge-purple'
    }
    return badges[frequency] || 'badge-info'
  }

  const runReportNow = (report: ScheduledReport) => {
    toast.success(`Running ${report.name} now...`)
    // Simulate running report
    setTimeout(() => {
      toast.success(`${report.name} has been sent to recipients`)
    }, 2000)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Scheduler</h1>
          <p className="text-gray-600">Automate report generation and delivery</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/app/reports')}
            className="btn-secondary"
          >
            ← Back to Reports
          </button>
          <button
            onClick={() => setShowNewScheduleModal(true)}
            className="btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Schedule
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {scheduledReports.length}
              </div>
              <div className="text-sm text-gray-500">Total Schedules</div>
            </div>
            <ClockIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {scheduledReports.filter(r => r.isActive).length}
              </div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
            <PlayIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {scheduledReports.filter(r => !r.isActive).length}
              </div>
              <div className="text-sm text-gray-500">Paused</div>
            </div>
            <PauseIcon className="h-8 w-8 text-gray-500" />
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {scheduledReports.reduce((sum, r) => sum + r.recipients.length, 0)}
              </div>
              <div className="text-sm text-gray-500">Recipients</div>
            </div>
            <EnvelopeIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Scheduled Reports List */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Scheduled Reports</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scheduledReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {report.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {reportTypes.find(t => t.value === report.reportType)?.label}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${getFrequencyBadge(report.schedule.frequency)}`}>
                        {report.schedule.frequency}
                      </span>
                      <span className="text-sm text-gray-600">
                        at {report.schedule.time}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {report.recipients.length} recipient{report.recipients.length !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-gray-500">
                      {report.recipients.slice(0, 2).join(', ')}
                      {report.recipients.length > 2 && ` +${report.recipients.length - 2} more`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNextRun(report.nextRun)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${report.isActive ? 'badge-success' : 'badge-gray'}`}>
                      {report.isActive ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => runReportNow(report)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Run now"
                      >
                        <PlayIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleReportStatus(report.id)}
                        className={`${report.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                        title={report.isActive ? 'Pause' : 'Resume'}
                      >
                        {report.isActive ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setEditingReport(report)}
                        className="text-gray-600 hover:text-gray-900"
                        title={t('common.edit')}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteScheduledReport(report.id)}
                        className="text-red-600 hover:text-red-900"
                        title={t('common.delete')}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Schedule Modal */}
      {showNewScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Schedule</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule Name *
                  </label>
                  <input
                    type="text"
                    value={newSchedule.name}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter schedule name"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type *
                  </label>
                  <select
                    value={newSchedule.reportType}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, reportType: e.target.value }))}
                    className="input"
                  >
                    <option value="">Select report type</option>
                    {reportTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency *
                  </label>
                  <select
                    value={newSchedule.frequency}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, frequency: e.target.value as any }))}
                    className="input"
                  >
                    {frequencies.map((freq) => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={newSchedule.time}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, time: e.target.value }))}
                    className="input"
                  />
                </div>

                {newSchedule.frequency === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Day of Week
                    </label>
                    <select
                      value={newSchedule.dayOfWeek}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, dayOfWeek: Number(e.target.value) }))}
                      className="input"
                    >
                      {daysOfWeek.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {newSchedule.frequency === 'monthly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Day of Month
                    </label>
                    <select
                      value={newSchedule.dayOfMonth}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, dayOfMonth: Number(e.target.value) }))}
                      className="input"
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                  </label>
                  <select
                    value={newSchedule.format}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, format: e.target.value as any }))}
                    className="input"
                  >
                    {formats.map((format) => (
                      <option key={format.value} value={format.value}>
                        {format.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email Recipients *
                  </label>
                  <button
                    onClick={addRecipient}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <PlusIcon className="h-4 w-4 inline mr-1" />
                    Add Recipient
                  </button>
                </div>
                <div className="space-y-2">
                  {newSchedule.recipients.map((recipient, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="email"
                        value={recipient}
                        onChange={(e) => updateRecipient(index, e.target.value)}
                        placeholder="Enter email address"
                        className="input flex-1"
                      />
                      {newSchedule.recipients.length > 1 && (
                        <button
                          onClick={() => removeRecipient(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowNewScheduleModal(false)}
                className="btn-secondary"
              >{t('common.cancel')}</button>
              <button
                onClick={saveSchedule}
                className="btn-primary"
              >
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
