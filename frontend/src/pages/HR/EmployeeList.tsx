import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast'
import axiosInstance from '../../utils/axiosConfig'
import { useGetEmployeesQuery, useGetDepartmentsQuery, useGetPositionsQuery } from '../../services/api'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilSquareIcon,
  EyeIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  XMarkIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

export default function EmployeeList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [positionFilter, setPositionFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading, refetch } = useGetEmployeesQuery({})
  const { data: departments } = useGetDepartmentsQuery({})
  const { data: positions } = useGetPositionsQuery({})

  // Filter employees
  const filteredEmployees = useMemo(() => {
    if (!data?.employees) return []
    
    return data.employees.filter((emp: any) => {
      const matchesSearch = !searchQuery || 
        emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesDepartment = !departmentFilter || emp.department === departmentFilter
      const matchesPosition = !positionFilter || emp.position === positionFilter
      const matchesStatus = !statusFilter || emp.status === statusFilter
      const matchesEmploymentType = !employmentTypeFilter || emp.employment_type === employmentTypeFilter
      
      return matchesSearch && matchesDepartment && matchesPosition && matchesStatus && matchesEmploymentType
    })
  }, [data?.employees, searchQuery, departmentFilter, positionFilter, statusFilter, employmentTypeFilter])

  const clearFilters = () => {
    setSearchQuery('')
    setDepartmentFilter('')
    setPositionFilter('')
    setStatusFilter('')
    setEmploymentTypeFilter('')
  }

  const hasActiveFilters = searchQuery || departmentFilter || positionFilter || statusFilter || employmentTypeFilter

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Yakin hapus karyawan "${name}"?`)) return
    try {
      await axiosInstance.delete(`/api/hr/employees/${id}`)
      toast.success('Karyawan berhasil dihapus')
      refetch()
    } catch {
      toast.error('Gagal menghapus karyawan')
    }
  }

  const employmentTypes = [
    { value: 'full_time', label: 'Karyawan Tetap' },
    { value: 'contract', label: 'Kontrak' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'intern', label: 'Magang' },
    { value: 'outsource', label: 'Outsource' },
    { value: 'daily', label: 'Harian Lepas' }
  ]

  const getEmploymentTypeLabel = (value: string) => {
    return employmentTypes.find(t => t.value === value)?.label || value?.replace('_', ' ') || '-'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-800'
      case 'terminated':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif'
      case 'on_leave': return 'Cuti'
      case 'terminated': return 'Non-aktif'
      default: return status
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/app/hr" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Karyawan</h1>
            <p className="text-gray-500 text-sm">
              {filteredEmployees.length} dari {data?.employees?.length || 0} karyawan
            </p>
          </div>
        </div>
        <Link to="/app/hr/employees/new" className="btn-primary inline-flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Tambah Karyawan
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, NIK, atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-blue-50 border-blue-300' : ''}`}
          >
            <FunnelIcon className="h-5 w-5" />
            Filter
            {hasActiveFilters && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">!</span>
            )}
          </button>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-secondary flex items-center gap-2 text-red-600">
              <XMarkIcon className="h-5 w-5" />
              Reset
            </button>
          )}
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departemen</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Departemen</option>
                {departments?.departments?.map((dept: any) => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Jabatan</option>
                {positions?.positions?.map((pos: any) => (
                  <option key={pos.id} value={pos.name}>{pos.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="on_leave">Cuti</option>
                <option value="terminated">Non-aktif</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Karyawan</label>
              <select
                value={employmentTypeFilter}
                onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Tipe</option>
                {employmentTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      {filteredEmployees.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIK</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Lengkap</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departemen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jabatan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((employee: any) => (
                  <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium text-gray-900">{employee.employee_number}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {employee.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{employee.full_name}</div>
                          <div className="text-sm text-gray-500">{employee.email || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {employee.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {employee.position || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {getEmploymentTypeLabel(employee.employment_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(employee.status)}`}>
                        {getStatusLabel(employee.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/app/hr/employees/${employee.id}`}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/app/hr/employees/${employee.id}/edit`}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(employee.id, employee.full_name)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <UserGroupIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            {hasActiveFilters ? 'Tidak ada data yang cocok' : 'Belum ada data karyawan'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {hasActiveFilters 
              ? 'Coba ubah filter pencarian Anda'
              : 'Mulai dengan menambahkan karyawan pertama'}
          </p>
          {!hasActiveFilters && (
            <div className="mt-6">
              <Link to="/app/hr/employees/new" className="btn-primary inline-flex items-center gap-2">
                <PlusIcon className="h-5 w-5" />
                Tambah Karyawan
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
