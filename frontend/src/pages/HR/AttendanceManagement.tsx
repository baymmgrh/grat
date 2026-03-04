import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import { useGetAttendanceRecordsQuery, useClockInMutation, useClockOutMutation, useBulkMarkAttendanceMutation } from '../../services/api'
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon

} from '@heroicons/react/24/outline';
export default function AttendanceManagement() {
    const { t } = useLanguage();

const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('')
  
  const { data, isLoading, refetch } = useGetAttendanceRecordsQuery({
    start_date: selectedDate,
    end_date: selectedDate,
    department_id: selectedDepartment || undefined,
    employee_id: selectedEmployee || undefined
  })
  
  const [clockIn] = useClockInMutation()
  const [clockOut] = useClockOutMutation()
  const [bulkMarkAttendance] = useBulkMarkAttendanceMutation()

  const handleClockIn = async (employeeId: number) => {
    try {
      await clockIn({ employee_id: employeeId }).unwrap()
      refetch()
      alert('Clocked in successfully!')
    } catch (error) {
      alert('Error clocking in')
    }
  }

  const handleClockOut = async (employeeId: number) => {
    try {
      await clockOut({ employee_id: employeeId }).unwrap()
      refetch()
      alert('Clocked out successfully!')
    } catch (error) {
      alert('Error clocking out')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      present: 'badge-success',
      absent: 'badge-danger',
      late: 'badge-warning',
      half_day: 'badge-info'
    }
    return statusClasses[status as keyof typeof statusClasses] || 'badge-secondary'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => alert('Bulk Mark Attendance feature - Coming Soon!')}
            className="btn-outline inline-flex items-center gap-2"
          >
            <UserGroupIcon className="h-5 w-5" />
            Bulk Mark
          </button>
          <button 
            onClick={() => navigate('/app/reports?module=attendance')}
            className="btn-primary inline-flex items-center gap-2"
          >
            <CalendarIcon className="h-5 w-5" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.date')}</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="input"
            >
              <option value="">All Departments</option>
              <option value="1">{t('navigation.production')}</option>
              <option value="2">Quality Control</option>
              <option value="3">{t('navigation.maintenance')}</option>
              <option value="4">{t('navigation.warehouse')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="input"
            >
              <option value="">All Employees</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => refetch()}
              className="btn-outline w-full"
            >{t('common.filter')}</button>
          </div>
        </div>
      </div>

      {/* Attendance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Present</p>
              <p className="text-2xl font-bold text-green-900">
                {data?.attendances?.filter((a: any) => a.status === 'present').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600">Absent</p>
              <p className="text-2xl font-bold text-red-900">
                {data?.attendances?.filter((a: any) => a.status === 'absent').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Late</p>
              <p className="text-2xl font-bold text-yellow-900">
                {data?.attendances?.filter((a: any) => a.status === 'late').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Half Day</p>
              <p className="text-2xl font-bold text-blue-900">
                {data?.attendances?.filter((a: any) => a.status === 'half_day').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      {isLoading ? (
        <div className="text-center py-12">{t('common.loading')}</div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>{t('production.shift')}</th>
                  <th>ClockIcon In</th>
                  <th>ClockIcon Out</th>
                  <th>Worked Hours</th>
                  <th>Overtime</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data?.attendances?.map((attendance: any) => (
                  <tr key={attendance.id}>
                    <td>
                      <div>
                        <div className="font-medium">{attendance.employee.full_name}</div>
                        <div className="text-sm text-gray-500">{attendance.employee.employee_number}</div>
                      </div>
                    </td>
                    <td>{attendance.employee.department || '-'}</td>
                    <td>
                      {attendance.shift ? (
                        <div>
                          <div className="font-medium">{attendance.shift.name}</div>
                          <div className="text-sm text-gray-500">
                            {attendance.shift.start_time} - {attendance.shift.end_time}
                          </div>
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      {attendance.clock_in 
                        ? new Date(attendance.clock_in).toLocaleTimeString()
                        : '-'
                      }
                    </td>
                    <td>
                      {attendance.clock_out 
                        ? new Date(attendance.clock_out).toLocaleTimeString()
                        : '-'
                      }
                    </td>
                    <td>{attendance.worked_hours} hrs</td>
                    <td>{attendance.overtime_hours} hrs</td>
                    <td>
                      <span className={`badge ${getStatusBadge(attendance.status)}`}>
                        {attendance.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {!attendance.clock_in && (
                          <button
                            onClick={() => handleClockIn(attendance.employee.id)}
                            className="btn-sm btn-success"
                          >
                            ClockIcon In
                          </button>
                        )}
                        {attendance.clock_in && !attendance.clock_out && (
                          <button
                            onClick={() => handleClockOut(attendance.employee.id)}
                            className="btn-sm btn-warning"
                          >
                            ClockIcon Out
                          </button>
                        )}
                        <button className="btn-sm btn-outline">{t('common.edit')}</button>
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
  )
}
