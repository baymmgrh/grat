import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import axiosInstance from '../../utils/axiosConfig'
import LoadingSpinner from '../../components/Common/LoadingSpinner'
import {
  CalendarDaysIcon,
  CheckCircleIcon
,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CogIcon,
  InformationCircleIcon as StatusIcon,
  PlayIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
interface Schedule {
  id: number
  schedule_number: string
  wo_number: string
  machine_name: string
  scheduled_start: string
  scheduled_end: string
  status: string
}

interface WorkOrder {
  id: number
  wo_number: string
  product_name: string
  quantity: number
  status: string
}

interface Machine {
  id: number
  code: string
  name: string
  status: string
}

const ProductionScheduling = () => {
  const { t } = useLanguage();
  const location = useLocation()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [showNewScheduleModal, setShowNewScheduleModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Check if user navigated from /schedules/new URL
    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('new') === 'true') {
      setShowNewScheduleModal(true)
    }
  }, [location])

  const loadData = async () => {
    try {
      setLoading(true)
      const [schedulesRes, workOrdersRes, machinesRes] = await Promise.all([
        axiosInstance.get('/api/production/schedules'),
        axiosInstance.get('/api/production/work-orders?status=planned'),
        axiosInstance.get('/api/production/machines')
      ])
      
      setSchedules(schedulesRes.data.schedules)
      setWorkOrders(workOrdersRes.data.work_orders)
      setMachines(machinesRes.data.machines)
    } catch (error) {
      console.error('Error loading scheduling data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return ClockIcon
      case 'in_progress': return PlayIcon
      case 'completed': return CheckCircleIcon
      default: return ClockIcon
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    startOfWeek.setDate(diff)
    
    const dates = []
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startOfWeek)
      weekDate.setDate(startOfWeek.getDate() + i)
      dates.push(weekDate)
    }
    return dates
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getSchedulesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.scheduled_start).toISOString().split('T')[0]
      return scheduleDate === dateStr
    })
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const weekDates = getWeekDates(currentDate)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📅 {t('production.scheduling')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Schedule and optimize machine production slots</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowNewScheduleModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            New Schedule
          </button>
        </div>
      </div>

      {/* View Controls */}
      <div className="card p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateDate('prev')}
              className="btn-secondary p-2"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {viewMode === 'week' 
                ? `Week of ${currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              }
            </h2>
            <button
              onClick={() => navigateDate('next')}
              className="btn-secondary p-2"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded ${viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded ${viewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Calendar */}
      {viewMode === 'week' && (
        <div className="card p-6">
          <div className="grid grid-cols-7 gap-4">
            {weekDates.map((date, index) => {
              const daySchedules = getSchedulesForDate(date)
              const isToday = date.toDateString() === new Date().toDateString()
              
              return (
                <div key={index} className="space-y-3">
                  <div className={`text-center p-2 rounded-lg ${isToday ? 'bg-blue-100 text-blue-800' : 'bg-gray-50'}`}>
                    <div className="font-semibold">{formatDate(date)}</div>
                  </div>
                  
                  <div className="space-y-2">
                    {daySchedules.map((schedule) => {
                      const StatusIcon = getStatusIcon(schedule.status)
                      return (
                        <div
                          key={schedule.id}
                          className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {schedule.wo_number}
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status)} flex items-center gap-1`}>
                              <StatusIcon className="h-3 w-3" />
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex items-center gap-1">
                              <CogIcon className="h-3 w-3" />
                              {schedule.machine_name}
                            </div>
                            <div className="flex items-center gap-1">
                              <ClockIcon className="h-3 w-3" />
                              {new Date(schedule.scheduled_start).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    
                    {daySchedules.length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        No schedules
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Schedule List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Schedules</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Work Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('production.machine')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scheduled Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.map((schedule) => {
                const StatusIcon = getStatusIcon(schedule.status)
                return (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{schedule.schedule_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{schedule.wo_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{schedule.machine_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(schedule.scheduled_start).toLocaleDateString()} - {new Date(schedule.scheduled_end).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(schedule.scheduled_start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - 
                        {new Date(schedule.scheduled_end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
                        <StatusIcon className="h-3 w-3" />
                        {schedule.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {schedule.status === 'scheduled' && (
                          <button className="text-green-600 hover:text-green-900">
                          </button>
                        )}
                        {schedule.status === 'in_progress' && (
                          <button className="text-blue-600 hover:text-blue-900">
                          </button>
                        )}
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => alert(`View schedule ${schedule.schedule_number}`)}
                        >
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {schedules.length === 0 && (
          <div className="text-center py-12">
            <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No schedules found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first schedule</p>
            <div className="mt-6">
              <button 
                onClick={() => setShowNewScheduleModal(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                New Schedule
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Schedules</p>
              <p className="text-2xl font-bold text-gray-900">{schedules.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 p-3 rounded-lg">
              <PlayIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {schedules.filter(s => s.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {schedules.filter(s => s.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 p-3 rounded-lg">
              <CogIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Machines</p>
              <p className="text-2xl font-bold text-gray-900">
                {machines.filter(m => m.status === 'running').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* New Schedule Modal */}
      {showNewScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">📅 New Schedule</h3>
              <button 
                onClick={() => setShowNewScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Order
                </label>
                <select className="input w-full">
                  <option value="">Select work order</option>
                  {workOrders.map((wo) => (
                    <option key={wo.id} value={wo.id}>
                      {wo.wo_number} - {wo.product_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('production.machine')}</label>
                <select className="input w-full">
                  <option value="">Select machine</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name} ({machine.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input type="datetime-local" className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input type="datetime-local" className="input w-full" />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button 
                  type="button"
                  onClick={() => setShowNewScheduleModal(false)}
                  className="btn-secondary"
                >{t('common.cancel')}</button>
                <button type="submit" className="btn-primary">
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductionScheduling
