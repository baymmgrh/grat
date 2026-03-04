import React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useGetProjectQuery } from '../../services/api'
import toast from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowLeftIcon,
  BanknotesIcon,
  BeakerIcon,
  CalendarIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CogIcon,
  DocumentTextIcon,
  PencilIcon
,
  UserIcon
} from '@heroicons/react/24/outline';
export default function ProjectDetails() {
    const { t } = useLanguage();

const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const { data: project, isLoading, error } = useGetProjectQuery(Number(id))

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Project not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The project you're looking for doesn't exist or has been deleted.
          </p>
          <div className="mt-6">
            <Link to="/app/rd/projects" className="btn-primary">
              Back to Projects
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      planning: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      testing: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      on_hold: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-yellow-100 text-yellow-800',
      urgent: 'bg-red-100 text-red-800'
    }
    return badges[priority] || 'bg-blue-100 text-blue-800'
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      research: 'bg-blue-100 text-blue-800',
      development: 'bg-green-100 text-green-800',
      innovation: 'bg-purple-100 text-purple-800',
      improvement: 'bg-orange-100 text-orange-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/rd/projects')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.project_name}</h1>
            <p className="text-gray-600">{project.project_number}</p>
          </div>
        </div>
        <Link
          to={`/app/rd/projects/${project.id}/edit`}
          className="btn-primary inline-flex items-center gap-2"
        >
          <PencilIcon className="h-4 w-4" />
          Edit Project
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Overview */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Overview</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">{t('common.description')}</h3>
                <p className="text-gray-600">{project.description || 'No description provided'}</p>
              </div>
              
              {project.objective && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Objective</h3>
                  <p className="text-gray-600">{project.objective}</p>
                </div>
              )}

              {project.expected_outcomes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Expected Outcomes</h3>
                  <p className="text-gray-600">{project.expected_outcomes}</p>
                </div>
              )}

              {project.success_criteria && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Success Criteria</h3>
                  <p className="text-gray-600">{project.success_criteria}</p>
                </div>
              )}

              {project.risk_assessment && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Risk Assessment</h3>
                  <p className="text-gray-600">{project.risk_assessment}</p>
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Overall Progress</span>
                  <span>{project.progress_percentage || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress_percentage || 0}%` }}
                  />
                </div>
              </div>

              {project.milestones && project.milestones.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Milestones</h3>
                  <div className="space-y-2">
                    {project.milestones.map((milestone: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-3 h-3 rounded-full ${milestone.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{milestone.title}</div>
                          {milestone.description && (
                            <div className="text-xs text-gray-500">{milestone.description}</div>
                          )}
                        </div>
                        {milestone.due_date && (
                          <div className="text-xs text-gray-500">
                            {new Date(milestone.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {project.notes && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{project.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(project.project_type || 'research')}`}>
                  {project.project_type || 'research'}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(project.priority)}`}>
                  {project.priority} priority
                </span>
              </div>

              {project.project_leader && (
                <div className="flex items-center gap-3">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Project Leader</div>
                    <div className="text-sm text-gray-500">{project.project_leader}</div>
                  </div>
                </div>
              )}

              {project.team_members && project.team_members.length > 0 && (
                <div className="flex items-start gap-3">
                  <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Team Members</div>
                    <div className="text-sm text-gray-500">{project.team_members.length} members</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-4">
              {project.start_date && (
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Start Date</div>
                    <div className="text-sm text-gray-500">
                      {new Date(project.start_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}

              {project.target_completion_date && (
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Target Completion</div>
                    <div className="text-sm text-gray-500">
                      {new Date(project.target_completion_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}

              {project.actual_completion_date && (
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-green-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Actual Completion</div>
                    <div className="text-sm text-gray-500">
                      {new Date(project.actual_completion_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Budget */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <BanknotesIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Total Budget</div>
                  <div className="text-sm text-gray-500">
                    Rp {((project.budget || 0) / 1000000).toFixed(1)}M
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Actual Cost</div>
                  <div className="text-sm text-gray-500">
                    Rp {((project.actual_cost || 0) / 1000000).toFixed(1)}M
                  </div>
                </div>
              </div>

              {project.budget > 0 && (
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Budget Utilization</span>
                    <span>{((project.actual_cost || 0) / project.budget * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(((project.actual_cost || 0) / project.budget * 100), 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Items */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Items</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BeakerIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Experiments</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{project.experiments_count || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CogIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Product Developments</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{project.product_developments_count || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardDocumentListIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Materials</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{project.materials_count || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Reports</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{project.reports_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
