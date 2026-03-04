import React, { useState } from 'react'
import { Link } from 'react-router-dom';
import { useGetProjectsQuery, useDeleteProjectMutation, useGetProjectsAnalyticsQuery } from '../../services/api'
import toast from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext';
import {
  CalendarIcon,
  BanknotesIcon,
  ChartBarIcon,
  UsersIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

export default function ProjectList() {
    const { t } = useLanguage();

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  
  const { data, isLoading, refetch } = useGetProjectsQuery({
    page,
    per_page: 20,
    search: search || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    project_type: typeFilter || undefined
  })
  
  const { data: analyticsData } = useGetProjectsAnalyticsQuery()
  const [deleteProject] = useDeleteProjectMutation()

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete project "${name}"?`)) {
      try {
        await deleteProject(id).unwrap()
        toast.success('Project deleted successfully')
        refetch()
      } catch (error: any) {
        toast.error(error.data?.error || 'Failed to delete project')
      }
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      planning: 'badge-warning',
      in_progress: 'badge-info',
      testing: 'badge-info',
      completed: 'badge-success',
      on_hold: 'badge-warning',
      cancelled: 'badge-danger'
    }
    return badges[status] || 'badge-info'
  }

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, string> = {
      low: 'badge-info',
      normal: 'badge-info',
      high: 'badge-warning',
      urgent: 'badge-danger'
    }
    return badges[priority] || 'badge-info'
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      research: 'text-blue-600 bg-blue-100',
      development: 'text-green-600 bg-green-100',
      innovation: 'text-purple-600 bg-purple-100',
      improvement: 'text-orange-600 bg-orange-100'
    }
    return colors[type] || 'text-gray-600 bg-gray-100'
  }


  const projects = data?.projects || []
  const summary = analyticsData?.summary || {}
  
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">R&D Projects</h1>
          <p className="text-gray-600">Research and development project management</p>
        </div>
        <Link
          to="/app/rd/projects/new"
          className="btn-primary inline-flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          New Project
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                className="input pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="testing">Testing</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className="input"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <select
              className="input"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="research">Research</option>
              <option value="development">Development</option>
              <option value="innovation">Innovation</option>
              <option value="improvement">Improvement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Project Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">{summary.total_projects || 0}</div>
              <div className="text-sm text-gray-500">Total Projects</div>
            </div>
            <ChartBarIcon className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{summary.active_projects || 0}</div>
              <div className="text-sm text-gray-500">Active Projects</div>
            </div>
            <UsersIcon className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">{summary.completed_projects || 0}</div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
            <CalendarIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-600">
                Rp {((summary.total_budget || 0) / 1000000).toFixed(0)}M
              </div>
              <div className="text-sm text-gray-500">Total Budget</div>
            </div>
            <BanknotesIcon className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map((project: any) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{project.project_name}</div>
                      <div className="text-sm text-gray-500">{project.project_number}</div>
                      {project.description && (
                        <div className="text-xs text-gray-400 mt-1 line-clamp-1">{project.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(project.project_type || 'research')}`}>
                      {project.project_type || 'research'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getStatusBadge(project.status)}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getPriorityBadge(project.priority)}`}>
                      {project.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{project.progress_percentage || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${project.progress_percentage || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div>
                      <div className="text-gray-900">Rp {((project.budget || 0) / 1000000).toFixed(1)}M</div>
                      <div className="text-gray-500">Used: Rp {((project.actual_cost || 0) / 1000000).toFixed(1)}M</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      {project.start_date && (
                        <div>Start: {new Date(project.start_date).toLocaleDateString()}</div>
                      )}
                      {project.target_completion_date && (
                        <div>Target: {new Date(project.target_completion_date).toLocaleDateString()}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/app/rd/projects/${project.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/app/rd/projects/${project.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit Project"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(project.id, project.project_name)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Project"
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
        
        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.total)} of {data.total} projects
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                </button>
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {page} of {data.pages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= data.pages}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="card">
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No research projects found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search || statusFilter || priorityFilter || typeFilter
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first research project.'}
            </p>
            <div className="mt-6">
              <Link to="/app/rd/projects/new" className="btn-primary inline-flex items-center gap-2">
                <PlusIcon className="h-5 w-5" />
                New Project
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
