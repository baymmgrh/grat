import React, { useState } from 'react'
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import {
  useGetContractsQuery, 
  useActivateContractMutation 
} from '../../services/api'
import {
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilIcon
,
  PlusIcon
} from '@heroicons/react/24/outline'; 
export default function ContractList() {
    const { t } = useLanguage();

const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [contractType, setContractType] = useState('')
  const [page, setPage] = useState(1)
  
  const { data, isLoading, refetch } = useGetContractsQuery({
    search,
    status,
    contract_type: contractType,
    page
  })
  
  const [activateContract] = useActivateContractMutation()

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; label: string }> = {
      draft: { class: 'bg-gray-100 text-gray-800', label: 'Draft' },
      active: { class: 'bg-green-100 text-green-800', label: 'Active' },
      expired: { class: 'bg-red-100 text-red-800', label: 'Expired' },
      terminated: { class: 'bg-orange-100 text-orange-800', label: 'Terminated' },
      cancelled: { class: 'bg-red-100 text-red-800', label: 'Cancelled' }
    }
    return badges[status] || { class: 'bg-gray-100 text-gray-800', label: status }
  }

  const getContractTypeBadge = (type: string) => {
    const badges: Record<string, { class: string; label: string }> = {
      framework: { class: 'bg-blue-100 text-blue-800', label: 'Framework' },
      blanket: { class: 'bg-indigo-100 text-indigo-800', label: 'Blanket' },
      spot: { class: 'bg-green-100 text-green-800', label: 'Spot' },
      service: { class: 'bg-purple-100 text-purple-800', label: 'Service' }
    }
    return badges[type] || { class: 'bg-gray-100 text-gray-800', label: type }
  }

  const handleActivate = async (contractId: number, contractNumber: string) => {
    if (window.confirm(`Are you sure you want to activate contract "${contractNumber}"?`)) {
      try {
        await activateContract(contractId).unwrap()
        toast.success('Contract activated successfully')
        refetch()
      } catch (error: any) {
        toast.error(error?.data?.error || 'Failed to activate contract')
      }
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    refetch()
  }

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  const isExpired = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    return end < now
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contract Management</h1>
          <p className="text-gray-600">Manage supplier contracts and agreements</p>
        </div>
        <Link
          to="/app/purchasing/contracts/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Create Contract
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
                placeholder="Search contract number, title..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.status')}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contract Type
            </label>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="framework">Framework</option>
              <option value="blanket">Blanket</option>
              <option value="spot">Spot</option>
              <option value="service">Service</option>
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

      {/* Contracts Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading contracts...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Contracts ({data?.total || 0})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contract Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contract Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.contracts?.map((contract: any) => {
                  const statusBadge = getStatusBadge(contract.status)
                  const typeBadge = getContractTypeBadge(contract.contract_type)
                  const expiringSoon = isExpiringSoon(contract.end_date)
                  const expired = isExpired(contract.end_date)
                  
                  return (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {contract.contract_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contract.title}
                          </div>
                          {(expiringSoon || expired) && (
                            <div className={`text-xs mt-1 ${expired ? 'text-red-600' : 'text-orange-600'}`}>
                              {expired ? '⚠️ Expired' : '⚠️ Expiring Soon'}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{contract.supplier_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {format(new Date(contract.start_date), 'dd MMM yyyy')}
                          </div>
                          <div className="text-sm text-gray-500">
                            to {format(new Date(contract.end_date), 'dd MMM yyyy')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadge.class}`}>
                            {typeBadge.label}
                          </span>
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.class}`}>
                              {statusBadge.label}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {contract.total_value ? 
                              `${contract.currency} ${contract.total_value.toLocaleString()}` : 
                              'TBD'
                            }
                          </div>
                          <div className="text-sm text-gray-500">
                            {contract.auto_renewal ? 'Auto-renewal' : 'Fixed term'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/app/purchasing/contracts/${contract.id}`}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                          
                          {contract.status === 'draft' && (
                            <>
                              <Link
                                to={`/app/purchasing/contracts/${contract.id}/edit`}
                                className="text-indigo-600 hover:text-indigo-900 p-1"
                                title={t('common.edit')}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleActivate(contract.id, contract.contract_number)}
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Activate Contract"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          
                          {expiringSoon && contract.status === 'active' && (
                            <button
                              className="text-orange-600 hover:text-orange-900 p-1"
                              title="Renewal Required"
                            >
                              <ClockIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
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

      {/* Empty State */}
      {!isLoading && (!data?.contracts || data.contracts.length === 0) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No contracts</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first supplier contract.</p>
          <div className="mt-6">
            <Link
              to="/app/purchasing/contracts/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Create Contract
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
