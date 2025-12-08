import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import { useGetTrainingSessionsQuery, useGetTrainingProgramsQuery, useGetTrainingRequestsQuery } from '../../services/api'
import {
  AcademicCapIcon,
  DocumentTextIcon,
  EyeIcon,
  PlusIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
export default function TrainingManagement() {
    const { t } = useLanguage();

const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('sessions')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedType, setSelectedType] = useState('')
  
  const { data: sessionsData, isLoading: sessionsLoading } = useGetTrainingSessionsQuery({
    status: selectedStatus || undefined
  })
  const { data: programsData, isLoading: programsLoading } = useGetTrainingProgramsQuery({
    training_type: selectedType || undefined
  })
  const { data: requestsData, isLoading: requestsLoading } = useGetTrainingRequestsQuery({
    status: selectedStatus || undefined
  })

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      scheduled: 'badge-info',
      ongoing: 'badge-warning',
      completed: 'badge-success',
      cancelled: 'badge-danger',
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger'
    }
    return statusClasses[status as keyof typeof statusClasses] || 'badge-secondary'
  }

  const getTypeBadge = (type: string) => {
    const typeClasses = {
      internal: 'badge-info',
      external: 'badge-warning',
      online: 'badge-success',
      workshop: 'badge-secondary'
    }
    return typeClasses[type as keyof typeof typeClasses] || 'badge-secondary'
  }

  const getPriorityBadge = (priority: string) => {
    const priorityClasses = {
      low: 'badge-secondary',
      medium: 'badge-info',
      high: 'badge-warning',
      urgent: 'badge-danger'
    }
    return priorityClasses[priority as keyof typeof priorityClasses] || 'badge-secondary'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Training Management</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/app/reports?module=training')}
            className="btn-outline inline-flex items-center gap-2"
          >
            <DocumentTextIcon className="h-5 w-5" />
            Training Report
          </button>
          <button 
            onClick={() => alert('New Training Session form - Coming Soon!')}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            New Training Session
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sessions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Training Sessions
          </button>
          <button
            onClick={() => setActiveTab('programs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'programs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Training Programs
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Training Requests
          </button>
        </nav>
      </div>

      {/* Training Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.status')}</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="input"
                >
                  <option value="">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <input
                  type="date"
                  className="input"
                />
              </div>
              <div className="flex items-end">
                <button className="btn-outline w-full">{t('common.filter')}</button>
              </div>
            </div>
          </div>

          {/* Sessions Table */}
          {sessionsLoading ? (
            <div className="text-center py-12">{t('common.loading')}</div>
          ) : (
            <div className="card">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Session Code</th>
                      <th>Session Name</th>
                      <th>Program</th>
                      <th>Schedule</th>
                      <th>Location</th>
                      <th>Participants</th>
                      <th>Trainer</th>
                      <th>{t('common.status')}</th>
                      <th>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionsData?.sessions?.map((session: any) => (
                      <tr key={session.id}>
                        <td className="font-medium">{session.session_code}</td>
                        <td>{session.session_name}</td>
                        <td>
                          <div>
                            <div className="font-medium">{session.program.program_name}</div>
                            <div className="text-sm text-gray-500">
                              <span className={`badge ${getTypeBadge(session.program.training_type)}`}>
                                {session.program.training_type}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div>{new Date(session.start_date).toLocaleDateString()}</div>
                            <div className="text-sm text-gray-500">
                              to {new Date(session.end_date).toLocaleDateString()}
                            </div>
                            {session.start_time && (
                              <div className="text-sm text-gray-500">
                                {session.start_time} - {session.end_time}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>{session.location || '-'}</td>
                        <td>
                          <div className="text-center">
                            <div className="font-medium">
                              {session.current_participants}/{session.max_participants || '∞'}
                            </div>
                            <div className="text-sm text-gray-500">participants</div>
                          </div>
                        </td>
                        <td>{session.trainer_name || '-'}</td>
                        <td>
                          <span className={`badge ${getStatusBadge(session.status)}`}>
                            {session.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              className="btn-sm btn-outline inline-flex items-center gap-1"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              className="btn-sm btn-info inline-flex items-center gap-1"
                              title="Manage Participants"
                            >
                              <UserGroupIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Training Programs Tab */}
      {activeTab === 'programs' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Training Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="input"
                >
                  <option value="">All Types</option>
                  <option value="internal">Internal</option>
                  <option value="external">External</option>
                  <option value="online">Online</option>
                  <option value="workshop">Workshop</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('products.bom.category')}</label>
                <select className="input">
                  <option value="">All Categories</option>
                  <option value="safety">Safety Training</option>
                  <option value="technical">Technical Skills</option>
                  <option value="leadership">Leadership</option>
                  <option value="quality">Quality Management</option>
                </select>
              </div>
              <div className="flex items-end">
                <button className="btn-outline w-full">{t('common.filter')}</button>
              </div>
            </div>
          </div>

          {/* Programs Table */}
          {programsLoading ? (
            <div className="text-center py-12">{t('common.loading')}</div>
          ) : (
            <div className="card">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Program Code</th>
                      <th>Program Name</th>
                      <th>{t('products.bom.category')}</th>
                      <th>Type</th>
                      <th>Duration</th>
                      <th>Cost</th>
                      <th>Active Sessions</th>
                      <th>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programsData?.programs?.map((program: any) => (
                      <tr key={program.id}>
                        <td className="font-medium">{program.program_code}</td>
                        <td>{program.program_name}</td>
                        <td>{program.category.name}</td>
                        <td>
                          <span className={`badge ${getTypeBadge(program.training_type)}`}>
                            {program.training_type}
                          </span>
                        </td>
                        <td>{program.duration_hours} hours</td>
                        <td>Rp {program.cost_per_participant?.toLocaleString()}</td>
                        <td>
                          <span className="font-medium">{program.active_sessions}</span> sessions
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              className="btn-sm btn-outline inline-flex items-center gap-1"
                              title="View Program"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              className="btn-sm btn-primary inline-flex items-center gap-1"
                              title="Create Session"
                            >
                              <PlusIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Training Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.status')}</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="input"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                </label>
                <select className="input">
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex items-end">
                <button className="btn-outline w-full">{t('common.filter')}</button>
              </div>
            </div>
          </div>

          {/* Requests Table */}
          {requestsLoading ? (
            <div className="text-center py-12">{t('common.loading')}</div>
          ) : (
            <div className="card">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Request Number</th>
                      <th>Employee</th>
                      <th>Requested Training</th>
                      <th>Justification</th>
                      <th>Preferred Date</th>
                      <th>Estimated Cost</th>
                      <th>Priority</th>
                      <th>{t('common.status')}</th>
                      <th>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestsData?.requests?.map((request: any) => (
                      <tr key={request.id}>
                        <td className="font-medium">{request.request_number}</td>
                        <td>
                          <div>
                            <div className="font-medium">{request.employee.full_name}</div>
                            <div className="text-sm text-gray-500">{request.employee.employee_number}</div>
                            <div className="text-sm text-gray-500">{request.employee.department}</div>
                          </div>
                        </td>
                        <td>
                          <div className="max-w-xs">
                            <div className="font-medium">{request.requested_training}</div>
                            {request.program && (
                              <div className="text-sm text-gray-500">{request.program.program_name}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="max-w-xs truncate" title={request.justification}>
                            {request.justification}
                          </div>
                        </td>
                        <td>
                          {request.preferred_date 
                            ? new Date(request.preferred_date).toLocaleDateString()
                            : '-'
                          }
                        </td>
                        <td>
                          {request.estimated_cost 
                            ? `Rp ${request.estimated_cost.toLocaleString()}`
                            : '-'
                          }
                        </td>
                        <td>
                          <span className={`badge ${getPriorityBadge(request.priority)}`}>
                            {request.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              className="btn-sm btn-outline inline-flex items-center gap-1"
                              title="View Request"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            {request.status === 'pending' && (
                              <>
                                <button
                                  className="btn-sm btn-success"
                                  title="Approve Request"
                                >
                                </button>
                                <button
                                  className="btn-sm btn-danger"
                                  title="Reject Request"
                                >
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
