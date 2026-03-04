import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  BanknotesIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  EnvelopeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PhoneIcon,
  PlusIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react'
import axiosInstance from '../../utils/axiosConfig'
import LoadingSpinner from '../../components/Common/LoadingSpinner'
interface Customer {
  id: number
  code: string
  company_name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  customer_type: string
  credit_limit?: number
  payment_terms?: string
  tax_number?: string
  industry?: string
  is_active: boolean
  created_at: string
}

const CustomerList = () => {
    const { t } = useLanguage();

const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    search: '',
    customer_type: '',
    is_active: 'true'
  })

  useEffect(() => {
    loadCustomers()
  }, [currentPage, filters])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20',
        ...(filters.search && { search: filters.search }),
        ...(filters.customer_type && { customer_type: filters.customer_type }),
        ...(filters.is_active && { is_active: filters.is_active })
      })

      const response = await axiosInstance.get(`/api/sales/customers?${params}`)
      setCustomers(response.data.customers || [])
      setTotalPages(response.data.pages || 1)
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({ search: '', customer_type: '', is_active: 'true' })
    setCurrentPage(1)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'retail': return 'bg-blue-100 text-blue-800'
      case 'wholesale': return 'bg-green-100 text-green-800'
      case 'distributor': return 'bg-purple-100 text-purple-800'
      case 'corporate': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && customers.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🏢 Customers</h1>
          <p className="text-gray-600 mt-1">Manage customer database and relationships</p>
        </div>
        <div className="flex gap-3">
          <Link to="/app/sales/customers/new" className="btn-primary inline-flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            Add Customer
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers.filter(c => c.is_active).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 p-3 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Corporate</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers.filter(c => c.customer_type === 'corporate').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-orange-500 p-3 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Credit Limit</p>
              <p className="text-2xl font-bold text-gray-900">
                Rp {customers.reduce((sum, c) => sum + (c.credit_limit || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('common.search')}</label>
            <div className="relative mt-1">
              <input
                type="text"
                placeholder="Company name, code..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input pl-10"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer Type</label>
            <select
              value={filters.customer_type}
              onChange={(e) => handleFilterChange('customer_type', e.target.value)}
              className="input mt-1"
            >
              <option value="">All Types</option>
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
              <option value="distributor">Distributor</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('common.status')}</label>
            <select
              value={filters.is_active}
              onChange={(e) => handleFilterChange('is_active', e.target.value)}
              className="input mt-1"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Customer Database</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Industry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit Limit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-lg mr-3">
                        <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{customer.company_name}</div>
                        <div className="text-xs text-gray-500">{customer.code}</div>
                        {customer.contact_person && (
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <UserIcon className="h-3 w-3 mr-1" />
                            {customer.contact_person}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {customer.email && (
                        <div className="text-sm text-gray-900 flex items-center">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="text-sm text-gray-900 flex items-center">
                          <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                          {customer.phone}
                        </div>
                      )}
                      {!customer.email && !customer.phone && (
                        <span className="text-gray-400">No contact info</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.city || customer.state || customer.country ? (
                      <div className="flex items-start">
                        <MapPinIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                        <div className="text-sm text-gray-900">
                          {[customer.city, customer.state, customer.country].filter(Boolean).join(', ')}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">No location</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(customer.customer_type)}`}>
                        {customer.customer_type?.replace('_', ' ') || 'N/A'}
                      </div>
                      {customer.industry && (
                        <div className="text-xs text-gray-500">{customer.industry}</div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">
                      {customer.credit_limit ? `Rp ${customer.credit_limit.toLocaleString()}` : 'No limit'}
                    </div>
                    {customer.payment_terms && (
                      <div className="text-xs text-gray-500">{customer.payment_terms}</div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      customer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {customer.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <Link
                        to={`/app/sales/customers/${customer.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                      </Link>
                      <Link
                        to={`/app/sales/customers/${customer.id}/edit`}
                        className="text-green-600 hover:text-green-900"
                      >{t('common.edit')}</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50"
              >
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn-secondary disabled:opacity-50"
              >
              </button>
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {customers.length === 0 && !loading && (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first customer
            </p>
            <div className="mt-6">
              <Link to="/app/sales/customers/new" className="btn-primary">
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Customer
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomerList
