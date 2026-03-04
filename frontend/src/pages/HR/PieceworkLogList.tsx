import React, { useState, useEffect } from 'react'
import {
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  FunnelIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import axiosInstance from '../../utils/axiosConfig'
import toast from 'react-hot-toast'

interface PieceworkLogItem {
  id: number
  employee_id: number
  employee_name: string | null
  work_date: string
  description: string | null
  quantity: number
  unit: string
  rate_per_unit: number
  total_amount: number
  work_order_id: number | null
  verified_by: number | null
  verifier_name: string | null
  verified_at: string | null
  status: string
  notes: string | null
}

interface Employee {
  id: number
  employee_number: string
  full_name: string
  pay_type: string
}

export default function PieceworkLogList() {
  const [logs, setLogs] = useState<PieceworkLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [total, setTotal] = useState(0)

  const [formData, setFormData] = useState({
    employee_id: '',
    work_date: new Date().toISOString().split('T')[0],
    description: '',
    quantity: '',
    unit: 'pcs',
    rate_per_unit: '',
    notes: ''
  })

  useEffect(() => {
    fetchLogs()
    fetchEmployees()
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [filterEmployee, filterStatus, filterStartDate, filterEndDate])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('per_page', '100')
      if (filterEmployee) params.append('employee_id', filterEmployee)
      if (filterStatus) params.append('status', filterStatus)
      if (filterStartDate) params.append('start_date', filterStartDate)
      if (filterEndDate) params.append('end_date', filterEndDate)

      const res = await axiosInstance.get(`/api/hr/payroll/piecework-logs?${params.toString()}`)
      setLogs(res.data.logs || [])
      setTotal(res.data.total || 0)
    } catch {
      toast.error('Gagal memuat data borongan')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const res = await axiosInstance.get('/api/hr/employees?per_page=500&status=active')
      const emps = (res.data.employees || []).filter((e: any) => e.pay_type === 'piecework' || !e.pay_type)
      setEmployees(emps)
    } catch {}
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axiosInstance.post('/api/hr/payroll/piecework-logs', {
        employee_id: parseInt(formData.employee_id),
        work_date: formData.work_date,
        description: formData.description || null,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        rate_per_unit: parseFloat(formData.rate_per_unit),
        notes: formData.notes || null
      })
      toast.success('Log borongan berhasil ditambahkan')
      setShowForm(false)
      setFormData({ employee_id: '', work_date: new Date().toISOString().split('T')[0], description: '', quantity: '', unit: 'pcs', rate_per_unit: '', notes: '' })
      fetchLogs()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan')
    }
  }

  const handleVerify = async (logId: number, action: 'verify' | 'reject') => {
    const reason = action === 'reject' ? prompt('Alasan penolakan:') : null
    if (action === 'reject' && !reason) return
    try {
      await axiosInstance.post(`/api/hr/payroll/piecework-logs/${logId}/verify`, { action, reason })
      toast.success(action === 'verify' ? 'Log diverifikasi' : 'Log ditolak')
      fetchLogs()
    } catch {
      toast.error('Gagal memproses')
    }
  }

  const formatCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  const totalAmount = logs.reduce((sum, l) => sum + l.total_amount, 0)
  const verifiedCount = logs.filter(l => l.status === 'verified').length
  const pendingCount = logs.filter(l => l.status === 'pending').length

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    const labels: Record<string, string> = { pending: 'Pending', verified: 'Verified', rejected: 'Ditolak' }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Log Kerja Borongan</h1>
          <p className="text-sm text-gray-500">Catat dan verifikasi output kerja borongan karyawan</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
        >
          <PlusIcon className="h-4 w-4" />
          Tambah Log
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Log</p>
          <p className="text-xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Nilai</p>
          <p className="text-lg font-bold text-orange-700">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Verified</p>
          <p className="text-xl font-bold text-green-700">{verifiedCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-xl font-bold text-yellow-700">{pendingCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <FunnelIcon className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} className={inputClass}>
            <option value="">Semua Karyawan</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.full_name}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={inputClass}>
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Ditolak</option>
          </select>
          <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className={inputClass} placeholder="Dari tanggal" />
          <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className={inputClass} placeholder="Sampai tanggal" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Memuat data...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <ClipboardDocumentListIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada log borongan.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Karyawan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Satuan</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tarif/Unit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{new Date(log.work_date).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3 text-sm font-medium">{log.employee_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{log.description || '-'}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono">{log.quantity.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-sm text-center">{log.unit}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(log.rate_per_unit)}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono font-medium text-orange-700">{formatCurrency(log.total_amount)}</td>
                    <td className="px-4 py-3 text-center">{statusBadge(log.status)}</td>
                    <td className="px-4 py-3">
                      {log.status === 'pending' && (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleVerify(log.id, 'verify')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Verifikasi"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleVerify(log.id, 'reject')}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Tolak"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {log.status === 'verified' && log.verifier_name && (
                        <span className="text-xs text-gray-400">oleh {log.verifier_name}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Tambah Log Borongan</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelClass}>Karyawan <span className="text-red-500">*</span></label>
                  <select className={inputClass} value={formData.employee_id} required
                    onChange={e => setFormData({...formData, employee_id: e.target.value})}>
                    <option value="">Pilih karyawan</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_number})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Tanggal Kerja <span className="text-red-500">*</span></label>
                  <input type="date" className={inputClass} value={formData.work_date} required
                    onChange={e => setFormData({...formData, work_date: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>Satuan</label>
                  <select className={inputClass} value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}>
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="meter">meter</option>
                    <option value="roll">roll</option>
                    <option value="lembar">lembar</option>
                    <option value="unit">unit</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Jumlah Output <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" className={inputClass} value={formData.quantity} required
                    onChange={e => setFormData({...formData, quantity: e.target.value})} placeholder="0" />
                </div>
                <div>
                  <label className={labelClass}>Tarif per Unit (Rp) <span className="text-red-500">*</span></label>
                  <input type="number" step="1" className={inputClass} value={formData.rate_per_unit} required
                    onChange={e => setFormData({...formData, rate_per_unit: e.target.value})} placeholder="0" />
                </div>
              </div>

              {formData.quantity && formData.rate_per_unit && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                  <span className="text-sm text-gray-600">Total: </span>
                  <span className="text-lg font-bold text-orange-700">
                    {formatCurrency(parseFloat(formData.quantity || '0') * parseFloat(formData.rate_per_unit || '0'))}
                  </span>
                </div>
              )}

              <div>
                <label className={labelClass}>Deskripsi Pekerjaan</label>
                <input type="text" className={inputClass} value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Contoh: Jahit 50 pcs baju" />
              </div>

              <div>
                <label className={labelClass}>Catatan</label>
                <textarea className={inputClass} rows={2} value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
                  <CheckIcon className="h-4 w-4" />
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
