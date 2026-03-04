import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import { useGetAppraisalCyclesQuery, useGetEmployeeAppraisalsQuery } from '../../services/api'
import {
  ChartBarIcon,
  ClipboardDocumentListIcon,
  EyeIcon
,
  PlusIcon
} from '@heroicons/react/24/outline';
export default function AppraisalList() {
    const { t } = useLanguage();

const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('cycles')
  const [selectedCycle, setSelectedCycle] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  
  const { data: cyclesData, isLoading: cyclesLoading } = useGetAppraisalCyclesQuery({})
  const { data: appraisalsData, isLoading: appraisalsLoading } = useGetEmployeeAppraisalsQuery({
    cycle_id: selectedCycle || undefined,
    status: selectedStatus || undefined
  })

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      draft: 'badge-secondary',
      self_review: 'badge-warning',
      manager_review: 'badge-info',
      completed: 'badge-success'
    }
    return statusClasses[status as keyof typeof statusClasses] || 'badge-secondary'
  }

  const getCycleStatusBadge = (status: string) => {
    const statusClasses = {
      draft: 'badge-secondary',
      active: 'badge-success',
      completed: 'badge-info',
      closed: 'badge-danger'
    }
    return statusClasses[status as keyof typeof statusClasses] || 'badge-secondary'
  }

  const getRatingBadge = (rating: string) => {
    const ratingClasses = {
      excellent: 'badge-success',
      good: 'badge-info',
      satisfactory: 'badge-warning',
      needs_improvement: 'badge-danger'
    }
    return ratingClasses[rating as keyof typeof ratingClasses] || 'badge-secondary'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Performance Appraisal</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/app/reports?module=appraisal')}
            className="btn-outline inline-flex items-center gap-2"
          >
            <ChartBarIcon className="h-5 w-5" />
          </button>
          <button 
            onClick={() => navigate('/app/hr/appraisal/cycles/new')}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            New Appraisal Cycle
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('cycles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cycles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Appraisal Cycles
          </button>
          <button
            onClick={() => setActiveTab('appraisals')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'appraisals'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Employee Appraisals
          </button>
        </nav>
      </div>

      {/* Appraisal Cycles Tab */}
      {activeTab === 'cycles' && (
        <div className="space-y-6">
          {cyclesLoading ? (
            <div className="text-center py-12">{t('common.loading')}</div>
          ) : (
            <div className="card">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Cycle Name</th>
                      <th>Type</th>
                      <th>Period</th>
                      <th>Deadlines</th>
                      <th>{t('common.status')}</th>
                      <th>Appraisals</th>
                      <th>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cyclesData?.cycles?.map((cycle: any) => (
                      <tr key={cycle.id}>
                        <td className="font-medium">{cycle.cycle_name}</td>
                        <td>
                          <span className="badge badge-info">
                            {cycle.cycle_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <div>
                            <div>{new Date(cycle.start_date).toLocaleDateString()}</div>
                            <div className="text-sm text-gray-500">
                              to {new Date(cycle.end_date).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm">
                            {cycle.self_review_deadline && (
                              <div>Self: {new Date(cycle.self_review_deadline).toLocaleDateString()}</div>
                            )}
                            {cycle.manager_review_deadline && (
                              <div>Manager: {new Date(cycle.manager_review_deadline).toLocaleDateString()}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getCycleStatusBadge(cycle.status)}`}>
                            {cycle.status}
                          </span>
                        </td>
                        <td>{cycle.total_appraisals}</td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              className="btn-sm btn-outline inline-flex items-center gap-1"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            {cycle.status === 'draft' && (
                              <button
                                className="btn-sm btn-primary"
                                title="Activate Cycle"
                              >
                              </button>
                            )}
                            <button
                              className="btn-sm btn-info inline-flex items-center gap-1"
                              title="View Report"
                            >
                              <ChartBarIcon className="h-4 w-4" />
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

      {/* Employee Appraisals Tab */}
      {activeTab === 'appraisals' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Appraisal Cycle
                </label>
                <select
                  value={selectedCycle}
                  onChange={(e) => setSelectedCycle(e.target.value)}
                  className="input"
                >
                  <option value="">All Cycles</option>
                  {cyclesData?.cycles?.map((cycle: any) => (
                    <option key={cycle.id} value={cycle.id}>
                      {cycle.cycle_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.status')}</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="input"
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="self_review">Self Review</option>
                  <option value="manager_review">Manager Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex items-end">
                <button className="btn-outline w-full">{t('common.filter')}</button>
              </div>
            </div>
          </div>

          {/* Appraisals Table */}
          {appraisalsLoading ? (
            <div className="text-center py-12">{t('common.loading')}</div>
          ) : (
            <div className="card">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Appraisal Number</th>
                      <th>Employee</th>
                      <th>Cycle</th>
                      <th>Reviewer</th>
                      <th>Self Review</th>
                      <th>Manager Review</th>
                      <th>Final Score</th>
                      <th>Rating</th>
                      <th>{t('common.status')}</th>
                      <th>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appraisalsData?.appraisals?.map((appraisal: any) => (
                      <tr key={appraisal.id}>
                        <td className="font-medium">{appraisal.appraisal_number}</td>
                        <td>
                          <div>
                            <div className="font-medium">{appraisal.employee.full_name}</div>
                            <div className="text-sm text-gray-500">{appraisal.employee.employee_number}</div>
                            <div className="text-sm text-gray-500">{appraisal.employee.department}</div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="font-medium">{appraisal.cycle.cycle_name}</div>
                            <div className="text-sm text-gray-500">{appraisal.cycle.cycle_type}</div>
                          </div>
                        </td>
                        <td>
                          {appraisal.reviewer ? appraisal.reviewer.full_name : '-'}
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(appraisal.self_review_status)}`}>
                            {appraisal.self_review_status}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(appraisal.manager_review_status)}`}>
                            {appraisal.manager_review_status}
                          </span>
                        </td>
                        <td>
                          {appraisal.final_score ? (
                            <span className="font-medium">{appraisal.final_score.toFixed(1)}</span>
                          ) : '-'}
                        </td>
                        <td>
                          {appraisal.final_rating ? (
                            <span className={`badge ${getRatingBadge(appraisal.final_rating)}`}>
                              {appraisal.final_rating.replace('_', ' ')}
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(appraisal.overall_status)}`}>
                            {appraisal.overall_status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              className="btn-sm btn-outline inline-flex items-center gap-1"
                              title="View Appraisal"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            {appraisal.overall_status === 'self_review' && (
                              <button
                                className="btn-sm btn-primary inline-flex items-center gap-1"
                                title="Complete Self Review"
                              >
                                <ClipboardDocumentListIcon className="h-4 w-4" />
                                Self Review
                              </button>
                            )}
                            {appraisal.overall_status === 'manager_review' && (
                              <button
                                className="btn-sm btn-warning inline-flex items-center gap-1"
                                title="Complete Manager Review"
                              >
                                <ClipboardDocumentListIcon className="h-4 w-4" />
                                Manager Review
                              </button>
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
