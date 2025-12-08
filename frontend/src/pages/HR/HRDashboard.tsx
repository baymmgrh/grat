import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import {
  useGetEmployeesQuery, 
  useGetAttendanceRecordsQuery,
  useGetLeavesQuery,
  useGetTrainingSessionsQuery,
  useGetPayrollPeriodsQuery
} from '../../services/api'
import {
  AcademicCapIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export default function HRDashboard() {
  const navigate = useNavigate()
  const { t } = useLanguage();
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  
  // Fetch data for dashboard
  const { data: employeesData } = useGetEmployeesQuery({})
  const { data: attendanceData } = useGetAttendanceRecordsQuery({
    start_date: dateFilter,
    end_date: dateFilter
  })
  const { data: leavesData } = useGetLeavesQuery({ status: 'pending' })
  const { data: trainingsData } = useGetTrainingSessionsQuery({ status: 'ongoing' })
  const { data: payrollData } = useGetPayrollPeriodsQuery({ status: 'processing' })

  // Calculate statistics
  const totalEmployees = employeesData?.employees?.length || 0
  const activeEmployees = employeesData?.employees?.filter((emp: any) => emp.status === 'active').length || 0
  const presentToday = attendanceData?.attendances?.filter((att: any) => att.status === 'present').length || 0
  const absentToday = attendanceData?.attendances?.filter((att: any) => att.status === 'absent').length || 0
  const pendingLeaves = leavesData?.leaves?.length || 0
  const ongoingTrainings = trainingsData?.sessions?.length || 0

  const attendanceRate = activeEmployees > 0 ? ((presentToday / activeEmployees) * 100).toFixed(1) : 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('hr.dashboard')}</h1>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* KeyIcon Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Employees */}
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <UserGroupIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-blue-700 truncate">{t('hr.total_employees')}</dt>
                <dd className="text-lg font-medium text-blue-900">{activeEmployees}</dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-green-900">{attendanceRate}%</p>
              <p className="text-sm text-green-700">{presentToday} present today</p>
            </div>
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <CalendarDaysIcon className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Pending Leaves</p>
              <p className="text-2xl font-bold text-yellow-900">{pendingLeaves}</p>
              <p className="text-sm text-yellow-700">Require approval</p>
            </div>
          </div>
        </div>

        {/* Ongoing Trainings */}
        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <AcademicCapIcon className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Ongoing Trainings</p>
              <p className="text-2xl font-bold text-purple-900">{ongoingTrainings}</p>
              <p className="text-sm text-purple-700">Active sessions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/app/hr/employees/new')}
            className="btn-outline flex flex-col items-center gap-2 p-4"
          >
            <UserGroupIcon className="w-6 h-6" />
            <span className="text-sm">Add Employee</span>
          </button>
          <button 
            onClick={() => navigate('/app/hr/attendance')}
            className="btn-outline flex flex-col items-center gap-2 p-4"
          >
            <ClockIcon className="w-6 h-6" />
            <span className="text-sm">Mark Attendance</span>
          </button>
          <button 
            onClick={() => navigate('/app/hr/leaves')}
            className="btn-outline flex flex-col items-center gap-2 p-4"
          >
            <CalendarDaysIcon className="w-6 h-6" />
            <span className="text-sm">Approve Leaves</span>
          </button>
          <button 
            onClick={() => navigate('/app/hr/payroll')}
            className="btn-outline flex flex-col items-center gap-2 p-4"
          >
            <BanknotesIcon className="w-6 h-6" />
            <span className="text-sm">Process Payroll</span>
          </button>
        </div>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Attendance</h2>
          <div className="space-y-3">
            {attendanceData?.attendances?.slice(0, 5).map((attendance: any) => (
              <div key={attendance.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <UserGroupIcon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{attendance.employee.full_name}</p>
                    <p className="text-xs text-gray-500">{attendance.employee.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${
                    attendance.status === 'present' ? 'badge-success' : 
                    attendance.status === 'late' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {attendance.status}
                  </span>
                  {attendance.clock_in && (
                    <span className="text-xs text-gray-500">
                      {new Date(attendance.clock_in).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {(!attendanceData?.attendances || attendanceData.attendances.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No attendance records for today</p>
            )}
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alerts & Notifications</h2>
          <div className="space-y-3">
            {/* Pending Leave Approvals */}
            {pendingLeaves > 0 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    {pendingLeaves} leave request{pendingLeaves > 1 ? 's' : ''} pending approval
                  </p>
                  <p className="text-xs text-yellow-700">Review and approve employee leave requests</p>
                </div>
              </div>
            )}

            {/* Payroll Processing */}
            {payrollData && payrollData.periods && payrollData.periods.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <BanknotesIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Payroll processing in progress
                  </p>
                  <p className="text-xs text-blue-700">
                    {payrollData.periods.length} payroll period{payrollData.periods.length > 1 ? 's' : ''} being processed
                  </p>
                </div>
              </div>
            )}

            {/* Training Sessions */}
            {ongoingTrainings > 0 && (
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <AcademicCapIcon className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-800">
                    {ongoingTrainings} training session{ongoingTrainings > 1 ? 's' : ''} in progress
                  </p>
                  <p className="text-xs text-purple-700">Monitor attendance and progress</p>
                </div>
              </div>
            )}

            {/* High Attendance Rate */}
            {parseFloat(attendanceRate) >= 95 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Excellent attendance rate today!
                  </p>
                  <p className="text-xs text-green-700">{attendanceRate}% attendance rate achieved</p>
                </div>
              </div>
            )}

            {/* No alerts */}
            {pendingLeaves === 0 && ongoingTrainings === 0 && parseFloat(attendanceRate) < 95 && (
              <p className="text-sm text-gray-500 text-center py-4">No alerts at this time</p>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Attendance Overview</h2>
            <ChartBarIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Present</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(presentToday / activeEmployees) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{presentToday}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Absent</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(absentToday / activeEmployees) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{absentToday}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Employee Distribution</h2>
            <ChartBarIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {/* This would be populated with actual department data */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('navigation.production')}</span>
              <span className="text-sm font-medium">45%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Quality Control</span>
              <span className="text-sm font-medium">20%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('navigation.maintenance')}</span>
              <span className="text-sm font-medium">15%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Others</span>
              <span className="text-sm font-medium">20%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
