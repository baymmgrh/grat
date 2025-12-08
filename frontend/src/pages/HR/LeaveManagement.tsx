import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import { useGetLeavesQuery, useApproveLeaveMutation, useRejectLeaveMutation } from '../../services/api'
import {
  CheckIcon,
  EyeIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
export default function LeaveManagement() {
    const { t } = useLanguage();

const navigate = useNavigate()
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedType, setSelectedType] = useState('')
  
  const { data, isLoading, refetch } = useGetLeavesQuery({
    status: selectedStatus || undefined,
    leave_type: selectedType || undefined
  })
  
  const [approveLeave] = useApproveLeaveMutation()
  const [rejectLeave] = useRejectLeaveMutation()

  const handleApprove = async (leaveId: number) => {
    try {
      await approveLeave(leaveId).unwrap()
      refetch()
      alert('Leave approved successfully!')
    } catch (error) {
      alert('Error approving leave')
    }
  }

  const handleReject = async (leaveId: number) => {
    const reason = prompt('Please provide rejection reason:')
    if (!reason) return
    
    try {
      await rejectLeave({ leaveId, rejection_reason: reason }).unwrap()
      refetch()
      alert('Leave rejected successfully!')
    } catch (error) {
      alert('Error rejecting leave')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
      cancelled: 'badge-secondary'
    }
    return statusClasses[status as keyof typeof statusClasses] || 'badge-secondary'
  }

  const getTypeBadge = (type: string) => {
    const typeClasses = {
      annual: 'badge-info',
      sick: 'badge-warning',
      personal: 'badge-secondary',
      maternity: 'badge-success',
      unpaid: 'badge-danger'
    }
    return typeClasses[type as keyof typeof typeClasses] || 'badge-secondary'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
        <button 
          onClick={() => navigate('/app/hr/leaves/new')}
          className="btn-primary inline-flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          New Leave Request
        </button>
      </div>

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
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leave Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input"
            >
              <option value="">All Types</option>
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal Leave</option>
              <option value="maternity">Maternity Leave</option>
              <option value="unpaid">Unpaid Leave</option>
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

      {/* Leave Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <CheckIcon className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">
                {data?.leaves?.filter((l: any) => l.status === 'pending').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Approved</p>
              <p className="text-2xl font-bold text-green-900">
                {data?.leaves?.filter((l: any) => l.status === 'approved').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <XMarkIcon className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600">Rejected</p>
              <p className="text-2xl font-bold text-red-900">
                {data?.leaves?.filter((l: any) => l.status === 'rejected').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <EyeIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Days</p>
              <p className="text-2xl font-bold text-blue-900">
                {data?.leaves?.reduce((sum: number, l: any) => sum + l.total_days, 0) || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Requests Table */}
      {isLoading ? (
        <div className="text-center py-12">{t('common.loading')}</div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Leave Number</th>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Period</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>{t('common.status')}</th>
                  <th>Approved By</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data?.leaves?.map((leave: any) => (
                  <tr key={leave.id}>
                    <td className="font-medium">{leave.leave_number}</td>
                    <td>
                      <div>
                        <div className="font-medium">{leave.employee.full_name}</div>
                        <div className="text-sm text-gray-500">{leave.employee.employee_number}</div>
                        <div className="text-sm text-gray-500">{leave.employee.department}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getTypeBadge(leave.leave_type)}`}>
                        {leave.leave_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div>
                        <div>{new Date(leave.start_date).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-500">
                          to {new Date(leave.end_date).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-medium">{leave.total_days}</span> days
                    </td>
                    <td>
                      <div className="max-w-xs truncate" title={leave.reason}>
                        {leave.reason}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(leave.status)}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td>
                      {leave.approved_by ? (
                        <div>
                          <div className="font-medium">{leave.approved_by}</div>
                          <div className="text-sm text-gray-500">
                            {leave.approved_at ? new Date(leave.approved_at).toLocaleDateString() : ''}
                          </div>
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="btn-sm btn-outline inline-flex items-center gap-1"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {leave.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(leave.id)}
                              className="btn-sm btn-success inline-flex items-center gap-1"
                              title="Approve Leave"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleReject(leave.id)}
                              className="btn-sm btn-danger inline-flex items-center gap-1"
                              title="Reject Leave"
                            >
                              <XMarkIcon className="h-4 w-4" />
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
  )
}
