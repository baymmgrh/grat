import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  DocumentTextIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import axiosInstance from '../../utils/axiosConfig'

interface MaterialIssue {
  id: number
  issue_number: string
  work_order_id: number
  wo_number: string
  product_name: string
  issue_date: string
  status: string
  priority: string
  issue_type: string
  total_items: number
  requested_by: string
  created_at: string
}

const MaterialIssueList: React.FC = () => {
  const [issues, setIssues] = useState<MaterialIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    fetchIssues()
  }, [pagination.page, statusFilter])

  const fetchIssues = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: pagination.page,
        per_page: pagination.per_page
      }
      if (statusFilter) params.status = statusFilter

      const response = await axiosInstance.get('/api/production/material-issues', { params })
      setIssues(response.data.material_issues || [])
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
        pages: response.data.pages
      }))
    } catch (error) {
      console.error('Error fetching material issues:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="h-3 w-3" />
            Menunggu
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircleIcon className="h-3 w-3" />
            Disetujui
          </span>
        )
      case 'issued':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3" />
            Dikeluarkan
          </span>
        )
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <ArrowPathIcon className="h-3 w-3" />
            Sebagian
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3" />
            Dibatalkan
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">Urgent</span>
      case 'high':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">Tinggi</span>
      case 'normal':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">Normal</span>
      case 'low':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">Rendah</span>
      default:
        return <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">{priority}</span>
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengeluaran Material</h1>
          <p className="text-gray-600 mt-1">Kelola pengeluaran material untuk produksi</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <FunnelIcon className="h-5 w-5" />
            Filter
          </button>
          <button
            onClick={fetchIssues}
            className="btn btn-secondary flex items-center gap-2"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-full"
              >
                <option value="">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="approved">Disetujui</option>
                <option value="issued">Dikeluarkan</option>
                <option value="partial">Sebagian</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Issue</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
            <DocumentTextIcon className="h-10 w-10 text-blue-500" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Menunggu</p>
              <p className="text-2xl font-bold text-yellow-600">
                {issues.filter(i => i.status === 'pending').length}
              </p>
            </div>
            <ClockIcon className="h-10 w-10 text-yellow-500" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Disetujui</p>
              <p className="text-2xl font-bold text-blue-600">
                {issues.filter(i => i.status === 'approved').length}
              </p>
            </div>
            <CheckCircleIcon className="h-10 w-10 text-blue-500" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Dikeluarkan</p>
              <p className="text-2xl font-bold text-green-600">
                {issues.filter(i => i.status === 'issued').length}
              </p>
            </div>
            <CheckCircleIcon className="h-10 w-10 text-green-500" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Memuat data...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="p-8 text-center">
            <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300" />
            <p className="mt-2 text-gray-500">Tidak ada data pengeluaran material</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Issue</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioritas</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-medium text-blue-600">{issue.issue_number}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link to={`/app/production/work-orders/${issue.work_order_id}`} className="text-blue-600 hover:underline">
                      {issue.wo_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {issue.product_name || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {issue.issue_date ? new Date(issue.issue_date).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {issue.total_items} item
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getPriorityBadge(issue.priority)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusBadge(issue.status)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link
                      to={`/app/production/material-issues/${issue.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Halaman {pagination.page} dari {pagination.pages} ({pagination.total} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
                className="btn btn-secondary btn-sm"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className="btn btn-secondary btn-sm"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MaterialIssueList
