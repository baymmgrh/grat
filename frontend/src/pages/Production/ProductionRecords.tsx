import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CogIcon,
  FunnelIcon
,
  PlusIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react'
import axiosInstance from '../../utils/axiosConfig'
import LoadingSpinner from '../../components/Common/LoadingSpinner'
interface ProductionRecord {
  id: number
  work_order: {
    id: number
    wo_number: string
    product_name: string
    batch_number?: string
  }
  machine: {
    id: number
    code: string
    name: string
  } | null
  operator: {
    id: number
    name: string
    employee_number: string
  } | null
  production_date: string
  shift: string
  quantity_produced: number
  quantity_good: number
  quantity_scrap: number
  uom: string
  downtime_minutes: number
  notes?: string
  created_at: string
}

const ProductionRecords = () => {
    const { t } = useLanguage();

const [records, setRecords] = useState<ProductionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    work_order_id: '',
    machine_id: '',
    start_date: '',
    end_date: '',
    shift: ''
  })

  useEffect(() => {
    loadRecords()
  }, [currentPage, filters])

  const loadRecords = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20',
        ...(filters.work_order_id && { work_order_id: filters.work_order_id }),
        ...(filters.machine_id && { machine_id: filters.machine_id }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date })
      })

      const response = await axiosInstance.get(`/api/production/production-records?${params}`)
      setRecords(response.data.records || [])
      setTotalPages(response.data.pages || 1)
    } catch (error) {
      console.error('Error loading production records:', error)
      setRecords([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const clearFilters = () => {
    setFilters({
      work_order_id: '',
      machine_id: '',
      start_date: '',
      end_date: '',
      shift: ''
    })
    setCurrentPage(1)
  }

  const calculateQualityRate = (good: number, total: number) => {
    return total > 0 ? ((good / total) * 100).toFixed(1) : '0.0'
  }

  const calculateScrapRate = (scrap: number, total: number) => {
    return total > 0 ? ((scrap / total) * 100).toFixed(1) : '0.0'
  }

  const getTotalProduced = () => {
    return records && Array.isArray(records) ? records.reduce((sum, record) => sum + record.quantity_produced, 0) : 0
  }

  const getTotalGood = () => {
    return records && Array.isArray(records) ? records.reduce((sum, record) => sum + record.quantity_good, 0) : 0
  }

  const getTotalScrap = () => {
    return records && Array.isArray(records) ? records.reduce((sum, record) => sum + record.quantity_scrap, 0) : 0
  }

  const getTotalDowntime = () => {
    return records && Array.isArray(records) ? records.reduce((sum, record) => sum + record.downtime_minutes, 0) : 0
  }

  if (loading && (!records || records.length === 0)) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Production Records</h1>
          <p className="text-gray-600 mt-1">Track daily production output and quality metrics</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary inline-flex items-center gap-2">
            <ArrowDownTrayIcon className="h-5 w-5" />{t('common.export')}</button>
          <Link to="/app/production/records/new" className="btn-primary inline-flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            New Record
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Produced</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalProduced().toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Quality Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {calculateQualityRate(getTotalGood(), getTotalProduced())}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-red-500 p-3 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Scrap Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {calculateScrapRate(getTotalScrap(), getTotalProduced())}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 p-3 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Downtime</p>
              <p className="text-2xl font-bold text-gray-900">{(getTotalDowntime() / 60).toFixed(1)}h</p>
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
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Work Order</label>
            <input
              type="text"
              placeholder="Enter WO number..."
              value={filters.work_order_id}
              onChange={(e) => handleFilterChange('work_order_id', e.target.value)}
              className="input mt-1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('production.machine')}</label>
            <input
              type="text"
              placeholder="Machine ID..."
              value={filters.machine_id}
              onChange={(e) => handleFilterChange('machine_id', e.target.value)}
              className="input mt-1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="input mt-1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="input mt-1"
            />
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

      {/* Records Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Production Records</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Shift
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Work Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('production.machine')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('production.operator')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('navigation.production')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('navigation.quality')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(record.production_date).toLocaleDateString()}
                    </div>
                    {record.shift && (
                      <div className="text-xs text-gray-500">{record.shift}</div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <ClipboardDocumentListIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.work_order.wo_number}
                        </div>
                        <div className="text-xs text-gray-500">
                          {record.work_order.product_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.machine ? (
                      <div className="flex items-center">
                        <CogIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.machine.name}</div>
                          <div className="text-xs text-gray-500">{record.machine.code}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.operator ? (
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.operator.name}</div>
                          <div className="text-xs text-gray-500">{record.operator.employee_number}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">{record.quantity_produced.toLocaleString()} {record.uom}</div>
                      <div className="text-xs text-gray-500">Produced</div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="text-green-600 font-medium">
                          {record.quantity_good.toLocaleString()}
                        </span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className="text-red-600 font-medium">
                          {record.quantity_scrap.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Good / Scrap ({calculateQualityRate(record.quantity_good, record.quantity_produced)}% quality)
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {record.downtime_minutes > 0 ? (
                        <span className="text-red-600 font-medium">{record.downtime_minutes}m</span>
                      ) : (
                        <span className="text-green-600 font-medium">0m</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/app/production/records/${record.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                    </Link>
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
        
        {records.length === 0 && !loading && (
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No production records found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first production record
            </p>
            <div className="mt-6">
              <Link to="/app/production/records/new" className="btn-primary">
                <PlusIcon className="h-5 w-5 mr-2" />
                New Record
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductionRecords
