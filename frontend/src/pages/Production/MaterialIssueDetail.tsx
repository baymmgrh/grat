import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CubeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import axiosInstance from '../../utils/axiosConfig'

interface MaterialIssueItem {
  id: number
  line_number: number
  material_id: number
  material_code: string
  material_name: string
  description: string
  required_quantity: number
  issued_quantity: number
  returned_quantity: number
  pending_quantity: number
  uom: string
  warehouse_location_id: number
  location_code: string
  batch_number: string
  status: string
  unit_cost: number
  total_cost: number
}

interface MaterialIssue {
  id: number
  issue_number: string
  work_order_id: number
  wo_number: string
  product_name: string
  issue_date: string
  required_date: string
  status: string
  priority: string
  issue_type: string
  department: string
  notes: string
  special_instructions: string
  requested_by: string
  approved_by: string
  issued_by: string
  approved_date: string
  issued_date: string
  items: MaterialIssueItem[]
}

const MaterialIssueDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [issue, setIssue] = useState<MaterialIssue | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchIssue()
  }, [id])

  const fetchIssue = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get(`/api/production/material-issues/${id}`)
      setIssue(response.data.material_issue)
    } catch (error) {
      console.error('Error fetching material issue:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!window.confirm('Setujui pengeluaran material ini? Material akan di-reserve dari inventory.')) return
    
    try {
      setActionLoading(true)
      await axiosInstance.put(`/api/production/material-issues/${id}/approve`)
      fetchIssue()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menyetujui')
    } finally {
      setActionLoading(false)
    }
  }

  const handleIssue = async () => {
    if (!window.confirm('Keluarkan material? Stok akan berkurang dari inventory.')) return
    
    try {
      setActionLoading(true)
      await axiosInstance.put(`/api/production/material-issues/${id}/issue`)
      fetchIssue()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal mengeluarkan material')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Batalkan pengeluaran material ini?')) return
    
    try {
      setActionLoading(true)
      await axiosInstance.put(`/api/production/material-issues/${id}/cancel`)
      fetchIssue()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal membatalkan')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="h-4 w-4" />
            Menunggu Persetujuan
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <CheckCircleIcon className="h-4 w-4" />
            Disetujui - Siap Dikeluarkan
          </span>
        )
      case 'issued':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-4 w-4" />
            Sudah Dikeluarkan
          </span>
        )
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
            <ArrowPathIcon className="h-4 w-4" />
            Sebagian Dikeluarkan
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-4 w-4" />
            Dibatalkan
          </span>
        )
      default:
        return <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">{status}</span>
    }
  }

  const getItemStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>
      case 'issued':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Issued</span>
      case 'partial':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">Partial</span>
      case 'returned':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">Returned</span>
      default:
        return <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">{status}</span>
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!issue) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300" />
          <p className="mt-2 text-gray-500">Data tidak ditemukan</p>
          <button onClick={() => navigate(-1)} className="mt-4 btn btn-primary">
            Kembali
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{issue.issue_number}</h1>
            <p className="text-gray-600">Detail Pengeluaran Material</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(issue.status)}
        </div>
      </div>

      {/* Action Buttons */}
      {issue.status !== 'issued' && issue.status !== 'cancelled' && (
        <div className="card p-4 mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Aksi</h3>
              <p className="text-sm text-blue-700">
                {issue.status === 'pending' && 'Setujui untuk me-reserve material dari inventory'}
                {issue.status === 'approved' && 'Keluarkan material untuk mengurangi stok inventory'}
                {issue.status === 'partial' && 'Lanjutkan mengeluarkan sisa material'}
              </p>
            </div>
            <div className="flex gap-2">
              {issue.status === 'pending' && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    Setujui
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="btn btn-danger flex items-center gap-2"
                  >
                    <XCircleIcon className="h-5 w-5" />
                    Batalkan
                  </button>
                </>
              )}
              {(issue.status === 'approved' || issue.status === 'partial') && (
                <>
                  <button
                    onClick={handleIssue}
                    disabled={actionLoading}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <CubeIcon className="h-5 w-5" />
                    Keluarkan Material
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="btn btn-danger flex items-center gap-2"
                  >
                    <XCircleIcon className="h-5 w-5" />
                    Batalkan
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Issue Info */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Informasi Issue</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">No. Issue</span>
              <span className="font-medium">{issue.issue_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Work Order</span>
              <Link to={`/app/production/work-orders/${issue.work_order_id}`} className="font-medium text-blue-600 hover:underline">
                {issue.wo_number}
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Produk</span>
              <span className="font-medium">{issue.product_name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tipe</span>
              <span className="font-medium capitalize">{issue.issue_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Prioritas</span>
              <span className="font-medium capitalize">{issue.priority}</span>
            </div>
          </div>
        </div>

        {/* Dates & Users */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Tanggal & Pengguna</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Tanggal Issue</span>
              <span className="font-medium">
                {issue.issue_date ? new Date(issue.issue_date).toLocaleDateString('id-ID') : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Diminta oleh</span>
              <span className="font-medium">{issue.requested_by || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Disetujui oleh</span>
              <span className="font-medium">{issue.approved_by || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tanggal Disetujui</span>
              <span className="font-medium">
                {issue.approved_date ? new Date(issue.approved_date).toLocaleDateString('id-ID') : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dikeluarkan oleh</span>
              <span className="font-medium">{issue.issued_by || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tanggal Dikeluarkan</span>
              <span className="font-medium">
                {issue.issued_date ? new Date(issue.issued_date).toLocaleDateString('id-ID') : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {(issue.notes || issue.special_instructions) && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Catatan</h3>
          {issue.notes && (
            <div className="mb-3">
              <p className="text-sm text-gray-600">Catatan:</p>
              <p className="text-gray-900">{issue.notes}</p>
            </div>
          )}
          {issue.special_instructions && (
            <div>
              <p className="text-sm text-gray-600">Instruksi Khusus:</p>
              <p className="text-gray-900">{issue.special_instructions}</p>
            </div>
          )}
        </div>
      )}

      {/* Items Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Daftar Material ({issue.items.length} item)</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lokasi</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Dibutuhkan</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Dikeluarkan</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sisa</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {issue.items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {item.line_number}
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{item.material_name}</p>
                    <p className="text-sm text-gray-500">{item.material_code}</p>
                    {item.batch_number && (
                      <p className="text-xs text-gray-400">Batch: {item.batch_number}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {item.location_code ? (
                    <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4" />
                      {item.location_code}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right font-medium">
                  {item.required_quantity.toLocaleString()} {item.uom}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-green-600 font-medium">
                  {item.issued_quantity.toLocaleString()} {item.uom}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-orange-600 font-medium">
                  {item.pending_quantity.toLocaleString()} {item.uom}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {getItemStatusBadge(item.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default MaterialIssueDetail
