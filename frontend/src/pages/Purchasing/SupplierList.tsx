import React, { useState } from 'react'
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGetSuppliersQuery, useDeleteSupplierMutation } from '../../services/api'
import toast from 'react-hot-toast'
import {
  EyeIcon,
  FunnelIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  PencilIcon
,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
export default function SupplierList() {
    const { t } = useLanguage();

const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [supplierType, setSupplierType] = useState('')
  const [status, setStatus] = useState('')
  
  const { data, isLoading, refetch } = useGetSuppliersQuery({
    search,
    page,
    supplier_type: supplierType,
    is_active: status === 'active' ? true : status === 'inactive' ? false : undefined
  })
  
  const [deleteSupplier] = useDeleteSupplierMutation()

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete supplier "${name}"?`)) {
      try {
        await deleteSupplier(id).unwrap()
        toast.success('Supplier deleted successfully')
        refetch()
      } catch (error: any) {
        toast.error(error?.data?.error || 'Failed to delete supplier')
      }
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    refetch()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Management</h1>
          <p className="text-gray-600">Manage your supplier database and relationships</p>
        </div>
        <Link
          to="/app/purchasing/suppliers/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add New Supplier
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.search')}</label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, code, or contact..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier Type
            </label>
            <select
              value={supplierType}
              onChange={(e) => setSupplierType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="manufacturer">Manufacturer</option>
              <option value="distributor">Distributor</option>
              <option value="trader">Trader</option>
              <option value="service">Service Provider</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.status')}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FunnelIcon className="h-5 w-5" />{t('common.filter')}</button>
          </div>
        </form>
      </div>

      {/* Suppliers Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading suppliers...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Suppliers ({data?.total || 0})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating & Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.suppliers?.map((supplier: any) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {supplier.code}
                        </div>
                        <div className="text-sm text-gray-500">
                          {supplier.company_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {supplier.contact_person || '-'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {supplier.email || '-'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {supplier.phone || '-'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {supplier.supplier_type || 'General'}
                        </span>
                        <div className="text-sm text-gray-500 mt-1">
                          Payment: {supplier.payment_terms || '30'} days
                        </div>
                        <div className="text-sm text-gray-500">
                          Credit: ${supplier.credit_limit?.toLocaleString() || '0'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          supplier.rating === 'A' ? 'bg-green-100 text-green-800' : 
                          supplier.rating === 'B' ? 'bg-yellow-100 text-yellow-800' : 
                          supplier.rating === 'C' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          Rating: {supplier.rating || 'Unrated'}
                        </span>
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            supplier.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {supplier.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/app/purchasing/suppliers/${supplier.id}`}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/app/purchasing/suppliers/${supplier.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title={t('common.edit')}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(supplier.id, supplier.company_name)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title={t('common.delete')}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {data?.pages && data.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {data.current_page} of {data.pages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= data.pages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
