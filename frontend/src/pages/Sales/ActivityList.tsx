import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowDownTrayIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon
,
  PhoneIcon,
  PlusIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react'
import axiosInstance from '../../utils/axiosConfig'
import LoadingSpinner from '../../components/Common/LoadingSpinner'

interface SalesActivity {
  id: number
  activity_number: string
  subject: string
  activity_type: string
  status: string
  priority: string
  start_date: string | null
  end_date: string | null
  description: string
  customer_name: string | null
  lead_name: string | null
  opportunity_name: string | null
  assigned_to: number | null
  assigned_user_name: string | null
  created_at: string
  created_by_name: string
}

const ActivityList = () => {
  const { t } = useLanguage();
  const [activities, setActivities] = useState<SalesActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    activity_type: '',
    status: '',
    assigned_to: '',
    priority: ''
  })

  useEffect(() => {
    loadActivities()
  }, [currentPage, searchTerm, filters])

  const loadActivities = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20'
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (filters.activity_type) params.append('activity_type', filters.activity_type)
      if (filters.status) params.append('status', filters.status)
      if (filters.assigned_to) params.append('assigned_to', filters.assigned_to)
      if (filters.priority) params.append('priority', filters.priority)

      const response = await axiosInstance.get(`/api/sales/activities?${params}`)
      setActivities(response.data.activities || [])
      setTotalPages(response.data.pages || 1)
    } catch (error) {
      console.error('Error loading activities:', error)
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'call': return <PhoneIcon className="h-5 w-5" />
      case 'email': return <EnvelopeIcon className="h-5 w-5" />
      case 'meeting': return <CalendarDaysIcon className="h-5 w-5" />
      case 'task': return <CheckCircleIcon className="h-5 w-5" />
      default: return <UserIcon className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleExport = () => {
    const csvContent = [
      ['Activity #', 'Subject', 'Type', t('common.status'), 'Priority', 'Customer/Lead', 'Assigned To', 'Start Date', 'Created'].join(','),
      ...activities.map(activity => [
        activity.activity_number,
        `"${activity.subject}"`,
        activity.activity_type,
        activity.status,
        activity.priority,
        `"${activity.customer_name || activity.lead_name || '-'}"`,
        `"${activity.assigned_user_name || '-'}"`,
        activity.start_date ? new Date(activity.start_date).toLocaleDateString() : '-',
        new Date(activity.created_at).toLocaleDateString()
      ].join(','))
    ].join('\\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales_activities_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading && activities.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📋 {t('sales.activity_list')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Track all sales activities and follow-ups</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            {t('common.export')}
          </button>
          <Link to="/app/sales/activities/new" className="btn-primary inline-flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            {t('sales.new_activity')}
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities..."
              className="pl-10 input w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="input"
            value={filters.activity_type}
            onChange={(e) => handleFilterChange('activity_type', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
            <option value="task">Task</option>
            <option value="note">Note</option>
          </select>

          <select
            className="input"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            className="input"
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            onClick={() => {
              setFilters({ activity_type: '', status: '', assigned_to: '', priority: '' })
              setSearchTerm('')
              setCurrentPage(1)
            }}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <FunnelIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Activities List */}
      <div className="card overflow-hidden">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No activities found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'Try adjusting your search or filters'
                : 'Create your first sales activity to get started'
              }
            </p>
            {!searchTerm && !Object.values(filters).some(f => f) && (
              <div className="mt-6">
                <Link to="/app/sales/activities/new" className="btn-primary inline-flex items-center gap-2">
                  <PlusIcon className="h-5 w-5" />
                  New Activity
                </Link>
              </div>
            )}
          </div>
        ) : (
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
                    Related To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.date')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            activity.activity_type === 'call' ? 'bg-blue-100 text-blue-600' :
                            activity.activity_type === 'email' ? 'bg-green-100 text-green-600' :
                            activity.activity_type === 'meeting' ? 'bg-purple-100 text-purple-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {getActivityIcon(activity.activity_type)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {activity.subject}
                          </div>
                          <div className="text-sm text-gray-500">
                            {activity.activity_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {activity.activity_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)} capitalize`}>
                        {activity.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium capitalize ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.customer_name && (
                        <div className="flex items-center">
                          <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-1" />
                          {activity.customer_name}
                        </div>
                      )}
                      {activity.lead_name && (
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 text-gray-400 mr-1" />
                          {activity.lead_name}
                        </div>
                      )}
                      {activity.opportunity_name && (
                        <div className="flex items-center">
                          <ExclamationCircleIcon className="h-4 w-4 text-gray-400 mr-1" />
                          {activity.opportunity_name}
                        </div>
                      )}
                      {!activity.customer_name && !activity.lead_name && !activity.opportunity_name && (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.assigned_user_name || <span className="text-gray-400">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.start_date ? (
                        <div>
                          <div>{new Date(activity.start_date).toLocaleDateString()}</div>
                          <div className="text-xs">{new Date(activity.start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No date</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                    const page = i + Math.max(1, currentPage - 2)
                    if (page > totalPages) return null
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityList
