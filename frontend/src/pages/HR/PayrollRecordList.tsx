import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import {
  ArrowLeftIcon,
  PrinterIcon,
  CheckIcon,
  BanknotesIcon,
  EyeIcon,
  XMarkIcon,
  UserIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

interface PayrollRecord {
  id: number
  employee: {
    id: number
    employee_number: string
    full_name: string
    department: string | null
    pay_type: string
    position: string | null
    has_allowance: boolean
    position_allowance_amount: number
    transport_allowance_amount: number
    outsourcing_vendor: string | null
  }
  basic_salary: number
  allowances: number
  overtime_amount: number
  bonus: number
  commission: number
  gross_salary: number
  tax_deduction: number
  insurance_deduction: number
  pension_deduction: number
  loan_deduction: number
  other_deductions: number
  absence_deduction: number
  total_deductions: number
  net_salary: number
  total_working_days: number
  days_worked: number
  days_absent: number
  overtime_hours: number
  late_hours: number
  status: string
  payment_date: string | null
  payment_method: string | null
  notes: string | null
  position_allowance: number
  transport_allowance: number
}

interface PeriodInfo {
  id: number
  period_name: string
  start_date: string
  end_date: string
  status: string
  total_employees: number
  total_gross_salary: number
  total_deductions: number
  total_net_salary: number
}

export default function PayrollRecordList() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { periodId } = useParams()
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [period, setPeriod] = useState<PeriodInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null)
  const [showPayslip, setShowPayslip] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const token = localStorage.getItem('token')

  React.useEffect(() => {
    if (periodId) {
      fetchPeriod()
      fetchRecords()
    }
  }, [periodId])

  const fetchPeriod = async () => {
    try {
      const response = await fetch(`/api/hr/payroll/periods`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        const found = data.periods?.find((p: PeriodInfo) => p.id === Number(periodId))
        if (found) setPeriod(found)
      }
    } catch (error) {
      console.error('Failed to fetch period:', error)
    }
  }

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/hr/payroll/periods/${periodId}/records?per_page=200`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setRecords(data.records || [])
      }
    } catch (error) {
      console.error('Failed to fetch records:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveRecord = async (recordId: number) => {
    if (!confirm('Approve payroll record ini?')) return
    try {
      const response = await fetch(`/api/hr/payroll/records/${recordId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        fetchRecords()
      } else {
        alert('Gagal approve record')
      }
    } catch (error) {
      alert('Error approving record')
    }
  }

  const handleMarkPaid = async (recordId: number) => {
    if (!confirm('Tandai sebagai sudah dibayar?')) return
    try {
      const response = await fetch(`/api/hr/payroll/records/${recordId}/pay`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_method: 'bank_transfer' })
      })
      if (response.ok) {
        fetchRecords()
      } else {
        alert('Gagal menandai pembayaran')
      }
    } catch (error) {
      alert('Error marking payment')
    }
  }

  const handleViewPayslip = async (record: PayrollRecord) => {
    try {
      const response = await fetch(`/api/hr/payroll/records/${record.id}/payslip`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSelectedRecord({ ...record, ...data })
      } else {
        setSelectedRecord(record)
      }
    } catch {
      setSelectedRecord(record)
    }
    setShowPayslip(true)
  }

  const handlePrintPayslip = () => {
    if (!selectedRecord) return
    const r = selectedRecord
    const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
    const statusLabel: Record<string, string> = { calculated: 'Dihitung', approved: 'Disetujui', paid: 'Dibayar' }
    const ptLabels: Record<string, string> = { fixed: 'Fixed', monthly: 'Bulanan', weekly: 'Mingguan', daily: 'Harian', piecework: 'Borongan', outsourcing: 'Outsourcing' }
    const empPayType = r.employee.pay_type || 'monthly'

    // Build earnings rows
    const posAllowance = r.position_allowance || 0
    const transAllowance = r.transport_allowance || 0
    const otherAllowances = r.allowances - posAllowance - transAllowance
    let earningsRows = `<tr><td>Gaji Pokok</td><td class="amt">${fmt(r.basic_salary)}</td></tr>`
    if (posAllowance > 0) earningsRows += `<tr><td>Tunjangan Jabatan</td><td class="amt">${fmt(posAllowance)}</td></tr>`
    if (transAllowance > 0) earningsRows += `<tr><td>Tunj. Transportasi (${r.days_worked} hari)</td><td class="amt">${fmt(transAllowance)}</td></tr>`
    if (otherAllowances > 0) earningsRows += `<tr><td>Tunjangan Lainnya</td><td class="amt">${fmt(otherAllowances)}</td></tr>`
    if (r.overtime_amount > 0) earningsRows += `<tr><td>Lembur (${r.overtime_hours} jam)</td><td class="amt">${fmt(r.overtime_amount)}</td></tr>`
    if ((r.bonus || 0) > 0) earningsRows += `<tr><td>Bonus</td><td class="amt">${fmt(r.bonus || 0)}</td></tr>`
    if ((r.commission || 0) > 0) earningsRows += `<tr><td>Komisi</td><td class="amt">${fmt(r.commission || 0)}</td></tr>`
    earningsRows += `<tr class="total"><td><b>Total Pendapatan</b></td><td class="amt"><b>${fmt(r.gross_salary)}</b></td></tr>`

    // Build deductions rows (PPh 21 TIDAK masuk potongan — ditanggung perusahaan)
    let deductionsRows = ''
    if (r.insurance_deduction > 0) deductionsRows += `<tr><td>BPJS Kesehatan (1%)</td><td class="amt red">-${fmt(r.insurance_deduction)}</td></tr>`
    if (r.pension_deduction > 0) deductionsRows += `<tr><td>BPJS Ketenagakerjaan (2%)</td><td class="amt red">-${fmt(r.pension_deduction)}</td></tr>`
    if ((r.absence_deduction || 0) > 0) deductionsRows += `<tr><td>Potongan Absensi (${r.days_absent} hari)</td><td class="amt red">-${fmt(r.absence_deduction || 0)}</td></tr>`
    if ((r.loan_deduction || 0) > 0) deductionsRows += `<tr><td>Potongan Pinjaman</td><td class="amt red">-${fmt(r.loan_deduction || 0)}</td></tr>`
    if ((r.other_deductions || 0) > 0) deductionsRows += `<tr><td>Potongan Lain-lain</td><td class="amt red">-${fmt(r.other_deductions || 0)}</td></tr>`
    deductionsRows += `<tr class="total"><td><b>Total Potongan</b></td><td class="amt red"><b>-${fmt(r.total_deductions)}</b></td></tr>`

    // PPh 21 info (ditanggung perusahaan)
    const pph21Info = r.tax_deduction > 0
      ? `<div style="margin-top:16px;padding:10px 16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;display:flex;justify-content:space-between;align-items:center">
          <div><span style="font-size:12px;color:#1e40af;font-weight:600">PPh 21 (Ditanggung Perusahaan)</span><br><span style="font-size:11px;color:#64748b">Metode TER PP 58/2023 — tidak dipotong dari gaji</span></div>
          <span style="font-size:15px;font-weight:700;color:#1e40af">${fmt(r.tax_deduction)}</span>
        </div>`
      : ''

    const paymentInfo = r.payment_date
      ? `<p class="payment">Dibayar: ${new Date(r.payment_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}${r.payment_method === 'bank_transfer' ? ' via Transfer Bank' : r.payment_method === 'cash' ? ' via Tunai' : ''}</p>`
      : ''

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Slip Gaji - ${r.employee.full_name}</title>
<script>try { document.title = 'ERP System - Slip Gaji'; history.replaceState(null, '', '/slip-gaji/${r.employee.employee_number}'); } catch(e) {}</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #333; font-size: 13px; }
  .slip { max-width: 700px; margin: 0 auto; border: 2px solid #1e40af; padding: 30px; }
  .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 12px; margin-bottom: 20px; }
  .header h1 { color: #1e40af; font-size: 22px; margin-bottom: 4px; }
  .header p { color: #666; font-size: 12px; }
  .info { display: flex; justify-content: space-between; margin-bottom: 20px; padding: 12px 16px; background: #f8fafc; border-radius: 6px; }
  .info div { line-height: 1.8; }
  .info .label { color: #64748b; }
  .info .value { font-weight: 600; }
  .attendance { display: flex; gap: 12px; margin-bottom: 20px; }
  .att-box { flex: 1; text-align: center; padding: 10px; border-radius: 6px; background: #f1f5f9; }
  .att-box .num { font-size: 20px; font-weight: 700; }
  .att-box .lbl { font-size: 11px; color: #64748b; }
  .att-box.green { background: #f0fdf4; } .att-box.green .num { color: #15803d; }
  .att-box.red { background: #fef2f2; } .att-box.red .num { color: #dc2626; }
  .att-box.blue { background: #eff6ff; } .att-box.blue .num { color: #1d4ed8; }
  .section-title { font-weight: 700; font-size: 13px; margin: 16px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
  .section-title.green { color: #15803d; }
  .section-title.red { color: #dc2626; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  td { padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
  .amt { text-align: right; font-family: 'Courier New', monospace; }
  .red { color: #dc2626; }
  .total td { background: #f8fafc; font-weight: 600; border-top: 1px solid #e2e8f0; }
  .net-box { text-align: center; background: #1e40af; color: white; padding: 16px; border-radius: 8px; margin-top: 20px; }
  .net-box .label { font-size: 12px; opacity: 0.85; }
  .net-box .amount { font-size: 26px; font-weight: 700; margin-top: 4px; }
  .payment { text-align: center; margin-top: 12px; font-size: 12px; color: #64748b; }
  .footer { text-align: center; margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
  @page { margin: 15mm; size: A4; }
  @media print { body { padding: 0; } .slip { border: none; padding: 0; } }
</style>
</head><body>
<div class="slip">
  <div class="header">
    <h1>SLIP GAJI KARYAWAN</h1>
    <p>Periode: ${period?.period_name || '-'}</p>
    <p>${period ? new Date(period.start_date).toLocaleDateString('id-ID') + ' - ' + new Date(period.end_date).toLocaleDateString('id-ID') : ''}</p>
  </div>
  <div class="info">
    <div>
      <span class="label">Nama: </span><span class="value">${r.employee.full_name}</span><br>
      <span class="label">NIK: </span><span class="value">${r.employee.employee_number}</span>
    </div>
    <div style="text-align:right">
      <span class="label">Departemen: </span><span class="value">${r.employee.department || '-'}</span><br>
      <span class="label">Jabatan: </span><span class="value">${r.employee.position || '-'}${r.employee.has_allowance ? ' <span style="color:#059669;font-weight:600">(Tunjangan ✓)</span>' : ''}</span><br>
      <span class="label">Kategori: </span><span class="value">${ptLabels[empPayType] || empPayType}</span><br>
      <span class="label">Status: </span><span class="value">${statusLabel[r.status] || r.status}</span>
    </div>
  </div>
  <div class="attendance">
    <div class="att-box"><div class="num">${r.total_working_days}</div><div class="lbl">Hari Kerja</div></div>
    <div class="att-box green"><div class="num">${r.days_worked}</div><div class="lbl">Hadir</div></div>
    <div class="att-box red"><div class="num">${r.days_absent}</div><div class="lbl">Absen</div></div>
    <div class="att-box blue"><div class="num">${r.overtime_hours}</div><div class="lbl">Jam Lembur</div></div>
  </div>
  <div class="section-title green">Pendapatan</div>
  <table>${earningsRows}</table>
  <div class="section-title red">Potongan</div>
  <table>${deductionsRows}</table>
  <div class="net-box">
    <div class="label">Gaji Bersih (Take Home Pay)</div>
    <div class="amount">${fmt(r.net_salary)}</div>
  </div>
  ${pph21Info}
  ${paymentInfo}
  <div class="footer">
    Dokumen ini digenerate secara otomatis oleh sistem ERP.<br>
    Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
  </div>
</div>
</body></html>`)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      calculated: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      paid: 'bg-purple-100 text-purple-800'
    }
    const labels: Record<string, string> = {
      calculated: 'Dihitung',
      approved: 'Disetujui',
      paid: 'Dibayar'
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    )
  }

  const payTypeLabels: Record<string, string> = {
    fixed: 'Fixed',
    monthly: 'Bulanan',
    weekly: 'Mingguan',
    daily: 'Harian',
    piecework: 'Borongan',
    outsourcing: 'Outsourcing'
  }

  const payTypeStyles: Record<string, string> = {
    fixed: 'bg-indigo-100 text-indigo-800',
    monthly: 'bg-sky-100 text-sky-800',
    weekly: 'bg-teal-100 text-teal-800',
    daily: 'bg-amber-100 text-amber-800',
    piecework: 'bg-orange-100 text-orange-800',
    outsourcing: 'bg-pink-100 text-pink-800'
  }

  const getPayTypeBadge = (payType: string) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${payTypeStyles[payType] || 'bg-gray-100 text-gray-800'}`}>
      {payTypeLabels[payType] || payType}
    </span>
  )

  const filteredRecords = records.filter(r =>
    r.employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.employee.employee_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.employee.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const summaryStats = {
    totalEmployees: records.length,
    totalGross: records.reduce((sum, r) => sum + r.gross_salary, 0),
    totalDeductions: records.reduce((sum, r) => sum + r.total_deductions, 0),
    totalNet: records.reduce((sum, r) => sum + r.net_salary, 0),
    calculated: records.filter(r => r.status === 'calculated').length,
    approved: records.filter(r => r.status === 'approved').length,
    paid: records.filter(r => r.status === 'paid').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/hr/payroll')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {period?.period_name || 'Payroll Records'}
            </h1>
            {period && (
              <p className="text-sm text-gray-500">
                {new Date(period.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} — {new Date(period.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                <span className="ml-2">{getStatusBadge(period.status)}</span>
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate(`/app/hr/payroll/new?period_id=${periodId}`)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <BanknotesIcon className="h-5 w-5" />
          Tambah Record
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Karyawan</p>
              <p className="text-xl font-bold text-gray-900">{summaryStats.totalEmployees}</p>
            </div>
          </div>
          <div className="mt-2 flex gap-2 text-xs">
            <span className="text-blue-600">{summaryStats.calculated} dihitung</span>
            <span className="text-green-600">{summaryStats.approved} disetujui</span>
            <span className="text-purple-600">{summaryStats.paid} dibayar</span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Gaji Kotor</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(summaryStats.totalGross)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <DocumentTextIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Potongan</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(summaryStats.totalDeductions)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BanknotesIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Gaji Bersih</p>
              <p className="text-lg font-bold text-purple-600">{formatCurrency(summaryStats.totalNet)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <input
          type="text"
          placeholder="Cari nama karyawan, NIK, atau departemen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Records Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Memuat data payroll...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <BanknotesIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada record payroll untuk periode ini.</p>
          <p className="text-sm text-gray-400 mt-1">Klik "Calculate Payroll" di halaman sebelumnya untuk generate otomatis.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Karyawan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departemen</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Kategori</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gaji Pokok</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tunjangan</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lembur</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gaji Kotor</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Potongan</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gaji Bersih</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hadir</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{record.employee.full_name}</div>
                      <div className="text-xs text-gray-500">{record.employee.employee_number}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{record.employee.department || '-'}</td>
                    <td className="px-4 py-3 text-center">{getPayTypeBadge(record.employee.pay_type || 'monthly')}</td>
                    <td className="px-4 py-3 text-right text-sm font-mono">{formatCurrency(record.basic_salary)}</td>
                    <td className="px-4 py-3 text-right text-sm font-mono">{formatCurrency(record.allowances)}</td>
                    <td className="px-4 py-3 text-right text-sm font-mono">{formatCurrency(record.overtime_amount)}</td>
                    <td className="px-4 py-3 text-right text-sm font-mono font-medium text-green-700">{formatCurrency(record.gross_salary)}</td>
                    <td className="px-4 py-3 text-right text-sm font-mono text-red-600">{formatCurrency(record.total_deductions)}</td>
                    <td className="px-4 py-3 text-right text-sm font-mono font-bold text-blue-700">{formatCurrency(record.net_salary)}</td>
                    <td className="px-4 py-3 text-center text-sm">
                      <span className={`${record.days_absent > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        {record.days_worked}/{record.total_working_days}
                      </span>
                      {record.days_absent > 0 && (
                        <div className="text-xs text-red-500">{record.days_absent} absen</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(record.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewPayslip(record)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat Slip Gaji"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {record.status === 'calculated' && (
                          <button
                            onClick={() => handleApproveRecord(record.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                        )}
                        {record.status === 'approved' && (
                          <button
                            onClick={() => handleMarkPaid(record.id)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Tandai Dibayar"
                          >
                            <BanknotesIcon className="h-4 w-4" />
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

      {/* Payslip Modal */}
      {showPayslip && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Slip Gaji</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPayslip}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <PrinterIcon className="h-4 w-4" />
                  Cetak
                </button>
                <button
                  onClick={() => setShowPayslip(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Payslip Content */}
            <div className="p-6">
              <div className="payslip">
                {/* Company Header */}
                <div className="header text-center border-b-2 border-blue-800 pb-4 mb-6">
                  <h1 className="text-2xl font-bold text-blue-800">SLIP GAJI KARYAWAN</h1>
                  <p className="text-gray-500 text-sm mt-1">
                    Periode: {period?.period_name || '-'}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {period ? `${new Date(period.start_date).toLocaleDateString('id-ID')} - ${new Date(period.end_date).toLocaleDateString('id-ID')}` : ''}
                  </p>
                </div>

                {/* Employee Info */}
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Nama</span>
                      <span className="text-sm font-medium">{selectedRecord.employee.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">NIK</span>
                      <span className="text-sm font-medium">{selectedRecord.employee.employee_number}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Departemen</span>
                      <span className="text-sm font-medium">{selectedRecord.employee.department || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Jabatan</span>
                      <span className="text-sm font-medium">
                        {selectedRecord.employee.position || '-'}
                        {selectedRecord.employee.has_allowance && (
                          <span className="ml-1 text-xs text-emerald-600 font-semibold">(Tunjangan)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Kategori</span>
                      <span className="text-sm font-medium">{getPayTypeBadge(selectedRecord.employee.pay_type || 'monthly')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Status</span>
                      <span className="text-sm font-medium">{getStatusBadge(selectedRecord.status)}</span>
                    </div>
                  </div>
                </div>

                {/* Attendance */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-blue-800 border-b border-gray-200 pb-1 mb-3 flex items-center gap-1">
                    🕐 Kehadiran
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-lg font-bold">{selectedRecord.total_working_days}</div>
                      <div className="text-xs text-gray-500">Hari Kerja</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="text-lg font-bold text-green-700">{selectedRecord.days_worked}</div>
                      <div className="text-xs text-gray-500">Hadir</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="text-lg font-bold text-red-700">{selectedRecord.days_absent}</div>
                      <div className="text-xs text-gray-500">Absen</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="text-lg font-bold text-blue-700">{selectedRecord.overtime_hours}</div>
                      <div className="text-xs text-gray-500">Jam Lembur</div>
                    </div>
                  </div>
                </div>

                {/* Earnings */}
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-green-700 border-b border-gray-200 pb-1 mb-3 flex items-center gap-1">
                    <CurrencyDollarIcon className="h-4 w-4" /> Pendapatan
                  </h3>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-600">Gaji Pokok</td>
                        <td className="py-2 text-right font-mono">{formatCurrency(selectedRecord.basic_salary)}</td>
                      </tr>
                      {(selectedRecord.position_allowance || 0) > 0 && (
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-gray-600">Tunjangan Jabatan</td>
                          <td className="py-2 text-right font-mono">{formatCurrency(selectedRecord.position_allowance)}</td>
                        </tr>
                      )}
                      {(selectedRecord.transport_allowance || 0) > 0 && (
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-gray-600">Tunj. Transportasi ({selectedRecord.days_worked} hari)</td>
                          <td className="py-2 text-right font-mono">{formatCurrency(selectedRecord.transport_allowance)}</td>
                        </tr>
                      )}
                      {(selectedRecord.allowances - (selectedRecord.position_allowance || 0) - (selectedRecord.transport_allowance || 0)) > 0 && (
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-gray-600">Tunjangan Lainnya</td>
                          <td className="py-2 text-right font-mono">{formatCurrency(selectedRecord.allowances - (selectedRecord.position_allowance || 0) - (selectedRecord.transport_allowance || 0))}</td>
                        </tr>
                      )}
                      {selectedRecord.overtime_amount > 0 && (
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-gray-600">Lembur ({selectedRecord.overtime_hours} jam)</td>
                          <td className="py-2 text-right font-mono">{formatCurrency(selectedRecord.overtime_amount)}</td>
                        </tr>
                      )}
                      {(selectedRecord.bonus || 0) > 0 && (
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-gray-600">Bonus</td>
                          <td className="py-2 text-right font-mono">{formatCurrency(selectedRecord.bonus || 0)}</td>
                        </tr>
                      )}
                      {(selectedRecord.commission || 0) > 0 && (
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-gray-600">Komisi</td>
                          <td className="py-2 text-right font-mono">{formatCurrency(selectedRecord.commission || 0)}</td>
                        </tr>
                      )}
                      <tr className="bg-green-50 font-bold">
                        <td className="py-2 text-green-800">Total Pendapatan</td>
                        <td className="py-2 text-right font-mono text-green-800">{formatCurrency(selectedRecord.gross_salary)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Deductions */}
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-red-700 border-b border-gray-200 pb-1 mb-3 flex items-center gap-1">
                    <DocumentTextIcon className="h-4 w-4" /> Potongan
                  </h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {selectedRecord.insurance_deduction > 0 && (
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-gray-600">BPJS Kesehatan (1%)</td>
                          <td className="py-2 text-right font-mono text-red-600">-{formatCurrency(selectedRecord.insurance_deduction)}</td>
                        </tr>
                      )}
                      {selectedRecord.pension_deduction > 0 && (
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-gray-600">BPJS Ketenagakerjaan JHT (2%)</td>
                          <td className="py-2 text-right font-mono text-red-600">-{formatCurrency(selectedRecord.pension_deduction)}</td>
                        </tr>
                      )}
                      {(selectedRecord.absence_deduction || 0) > 0 && (
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-gray-600">Potongan Absensi ({selectedRecord.days_absent} hari)</td>
                          <td className="py-2 text-right font-mono text-red-600">-{formatCurrency(selectedRecord.absence_deduction || 0)}</td>
                        </tr>
                      )}
                      {(selectedRecord.loan_deduction || 0) > 0 && (
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-gray-600">Potongan Pinjaman</td>
                          <td className="py-2 text-right font-mono text-red-600">-{formatCurrency(selectedRecord.loan_deduction || 0)}</td>
                        </tr>
                      )}
                      {(selectedRecord.other_deductions || 0) > 0 && (
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-gray-600">Potongan Lain-lain</td>
                          <td className="py-2 text-right font-mono text-red-600">-{formatCurrency(selectedRecord.other_deductions || 0)}</td>
                        </tr>
                      )}
                      <tr className="bg-red-50 font-bold">
                        <td className="py-2 text-red-800">Total Potongan</td>
                        <td className="py-2 text-right font-mono text-red-800">-{formatCurrency(selectedRecord.total_deductions)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Net Salary */}
                <div className="bg-blue-800 text-white rounded-lg p-4 text-center mt-6">
                  <div className="text-sm opacity-80">Gaji Bersih (Take Home Pay)</div>
                  <div className="text-3xl font-bold mt-1">{formatCurrency(selectedRecord.net_salary)}</div>
                </div>

                {/* PPh 21 Ditanggung Perusahaan */}
                {selectedRecord.tax_deduction > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-blue-800">PPh 21 (Ditanggung Perusahaan)</span>
                      <br />
                      <span className="text-xs text-gray-500">Metode TER PP 58/2023 — tidak dipotong dari gaji</span>
                    </div>
                    <span className="text-sm font-bold text-blue-800">{formatCurrency(selectedRecord.tax_deduction)}</span>
                  </div>
                )}

                {/* Payment Info */}
                {selectedRecord.payment_date && (
                  <div className="mt-4 text-center text-sm text-gray-500">
                    📅
                    Dibayar: {new Date(selectedRecord.payment_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {selectedRecord.payment_method && ` via ${selectedRecord.payment_method === 'bank_transfer' ? 'Transfer Bank' : selectedRecord.payment_method === 'cash' ? 'Tunai' : 'Cek'}`}
                  </div>
                )}

                {/* Footer */}
                <div className="text-center mt-6 pt-4 border-t border-gray-200 text-xs text-gray-400">
                  Dokumen ini digenerate secara otomatis oleh sistem ERP.
                  <br />Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
