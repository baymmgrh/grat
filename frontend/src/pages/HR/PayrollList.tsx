import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import { useGetPayrollPeriodsQuery, useCalculatePayrollMutation } from '../../services/api'
import {
  CalculatorIcon,
  ChartBarIcon as Calculator,
  CheckIcon,
  EyeIcon,
  PlusIcon,
  BuildingOffice2Icon,
  ClipboardDocumentListIcon

} from '@heroicons/react/24/outline';
export default function PayrollList() {
    const { t } = useLanguage();

const navigate = useNavigate()
  const [selectedStatus, setSelectedStatus] = useState('')
  const { data, isLoading, refetch } = useGetPayrollPeriodsQuery({
    status: selectedStatus || undefined
  })
  const [calculatePayroll] = useCalculatePayrollMutation()

  const handleCalculatePayroll = async (periodId: number) => {
    try {
      const result = await calculatePayroll(periodId).unwrap()
      refetch()
      let msg = result?.message || 'Payroll berhasil dihitung!'
      if (result?.summary?.skipped?.length > 0) {
        msg += '\n\nKaryawan dilewati (gaji pokok belum diisi):\n'
        msg += result.summary.skipped.map((s: any) => `- ${s.name}`).join('\n')
      }
      alert(msg)
    } catch (error: any) {
      alert(error?.data?.error || 'Error menghitung payroll')
    }
  }

  const handleApprovePayroll = async (periodId: number) => {
    if (!confirm('Approve payroll for this period?')) return
    try {
      const response = await fetch(`/api/hr/payroll/periods/${periodId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        refetch()
        alert('Payroll approved successfully!')
      } else {
        alert('Error approving payroll')
      }
    } catch (error) {
      alert('Error approving payroll')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      draft: 'badge-secondary',
      processing: 'badge-warning',
      completed: 'badge-success',
      locked: 'badge-info'
    }
    return statusClasses[status as keyof typeof statusClasses] || 'badge-secondary'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/app/hr/payroll/outsourcing-vendors')}
            className="btn-outline inline-flex items-center gap-2 text-sm"
          >
            <BuildingOffice2Icon className="h-4 w-4" />
            Vendor Outsourcing
          </button>
          <button 
            onClick={() => navigate('/app/hr/payroll/piecework-logs')}
            className="btn-outline inline-flex items-center gap-2 text-sm"
          >
            <ClipboardDocumentListIcon className="h-4 w-4" />
            Log Borongan
          </button>
          <button 
            onClick={() => navigate('/app/hr/payroll/periods/new')}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Create Payroll Period
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.status')}</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="locked">Locked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payroll Periods Table */}
      {isLoading ? (
        <div className="text-center py-12">{t('common.loading')}</div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Period Name</th>
                  <th>Period</th>
                  <th>{t('common.status')}</th>
                  <th>Employees</th>
                  <th>Gross Salary</th>
                  <th>Net Salary</th>
                  <th>Processed Date</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data?.periods?.map((period: any) => (
                  <tr key={period.id}>
                    <td className="font-medium">{period.period_name}</td>
                    <td>
                      {new Date(period.start_date).toLocaleDateString()} - {' '}
                      {new Date(period.end_date).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(period.status)}`}>
                        {period.status}
                      </span>
                    </td>
                    <td>{period.total_employees}</td>
                    <td>Rp {period.total_gross_salary?.toLocaleString()}</td>
                    <td>Rp {period.total_net_salary?.toLocaleString()}</td>
                    <td>
                      {period.processed_at 
                        ? new Date(period.processed_at).toLocaleDateString()
                        : '-'
                      }
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/app/hr/payroll/periods/${period.id}/records`)}
                          className="btn-sm btn-outline inline-flex items-center gap-1"
                          title="View Records"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {(period.status === 'draft' || period.status === 'processing') && (
                          <button
                            onClick={() => handleCalculatePayroll(period.id)}
                            className="btn-sm btn-primary inline-flex items-center gap-1"
                            title={period.status === 'processing' ? 'Hitung Ulang' : 'Hitung Payroll'}
                          >
                            <CalculatorIcon className="h-4 w-4" />
                          </button>
                        )}
                        {period.status === 'processing' && (
                          <button
                            onClick={() => handleApprovePayroll(period.id)}
                            className="btn-sm btn-success inline-flex items-center gap-1"
                            title="Approve Payroll"
                          >
                            <CheckIcon className="h-4 w-4" />
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
  )
}
