import React, { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext';
import axiosInstance from '../../utils/axiosConfig'
import LoadingSpinner from '../../components/Common/LoadingSpinner'
import {
  BeakerIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CogIcon,
  DocumentMagnifyingGlassIcon,
  MagnifyingGlassIcon,
  TagIcon
,
  UserIcon
} from '@heroicons/react/24/outline';
interface TraceabilityData {
  batch_number: string
  work_order: {
    id: number
    wo_number: string
    product_name: string
    quantity: number
    quantity_produced: number
    status: string
    machine_name?: string
    scheduled_start_date?: string
    scheduled_end_date?: string
    actual_start_date?: string
    actual_end_date?: string
  }
  production_records: Array<{
    id: number
    production_date: string
    shift: string
    machine_name?: string
    operator_name?: string
    quantity_produced: number
    quantity_good: number
    quantity_scrap: number
    downtime_minutes: number
    notes?: string
  }>
}

const Traceability = () => {
    const { t } = useLanguage();

const [batchNumber, setBatchNumber] = useState('')
  const [traceData, setTraceData] = useState<TraceabilityData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const searchBatch = async () => {
    if (!batchNumber.trim()) {
      setError('Please enter a batch number')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const response = await axiosInstance.get(`/api/production/traceability/${batchNumber}`)
      setTraceData(response.data)
    } catch (error: any) {
      console.error('Error searching batch:', error)
      if (error.response?.status === 404) {
        setError('Batch not found. Please check the batch number.')
      } else {
        setError('Error searching batch. Please try again.')
      }
      setTraceData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchBatch()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'planned': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateQualityRate = (good: number, total: number) => {
    return total > 0 ? ((good / total) * 100).toFixed(1) : '0.0'
  }

  const getTotalProduced = () => {
    return traceData?.production_records.reduce((sum, record) => sum + record.quantity_produced, 0) || 0
  }

  const getTotalGood = () => {
    return traceData?.production_records.reduce((sum, record) => sum + record.quantity_good, 0) || 0
  }

  const getTotalScrap = () => {
    return traceData?.production_records.reduce((sum, record) => sum + record.quantity_scrap, 0) || 0
  }

  const getTotalDowntime = () => {
    return traceData?.production_records.reduce((sum, record) => sum + record.downtime_minutes, 0) || 0
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🔍 Traceability</h1>
          <p className="text-gray-600 mt-1">Track work orders and production history</p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Order / Batch Number
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Masukkan nomor WO atau batch (contoh: WO-001)..."
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                className="input pl-10"
              />
              <DocumentMagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={searchBatch}
              disabled={loading}
              className="btn-primary inline-flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <MagnifyingGlassIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Results */}
      {traceData && (
        <div className="space-y-6">
          {/* Batch Overview */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <TagIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Batch: {traceData.batch_number}</h2>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(traceData.work_order.status)}`}>
                {traceData.work_order.status}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Work Order</h3>
                <div className="space-y-1">
                  <div className="font-medium text-gray-900">{traceData.work_order.wo_number}</div>
                  <div className="text-sm text-gray-600">{traceData.work_order.product_name}</div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">{t('common.quantity')}</h3>
                <div className="space-y-1">
                  <div className="font-medium text-gray-900">
                    {traceData.work_order.quantity_produced.toLocaleString()} / {traceData.work_order.quantity.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Produced / Planned</div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">{t('production.machine')}</h3>
                <div className="space-y-1">
                  <div className="font-medium text-gray-900">
                    {traceData.work_order.machine_name || 'Not assigned'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Timeline */}
            {(traceData.work_order.scheduled_start_date || traceData.work_order.actual_start_date) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Timeline</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Scheduled</div>
                    <div className="font-medium">
                      {traceData.work_order.scheduled_start_date && traceData.work_order.scheduled_end_date ? (
                        <>
                          {new Date(traceData.work_order.scheduled_start_date).toLocaleDateString()} - 
                          {new Date(traceData.work_order.scheduled_end_date).toLocaleDateString()}
                        </>
                      ) : (
                        'Not scheduled'
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Actual</div>
                    <div className="font-medium">
                      {traceData.work_order.actual_start_date && traceData.work_order.actual_end_date ? (
                        <>
                          {new Date(traceData.work_order.actual_start_date).toLocaleDateString()} - 
                          {new Date(traceData.work_order.actual_end_date).toLocaleDateString()}
                        </>
                      ) : traceData.work_order.actual_start_date ? (
                        <>Started: {new Date(traceData.work_order.actual_start_date).toLocaleDateString()}</>
                      ) : (
                        'Not started'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Production Summary */}
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
                  <BeakerIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Good Quality</p>
                  <p className="text-2xl font-bold text-gray-900">{getTotalGood().toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center">
                <div className="bg-red-500 p-3 rounded-lg">
                  <BeakerIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Scrap</p>
                  <p className="text-2xl font-bold text-gray-900">{getTotalScrap().toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center">
                <div className="bg-yellow-500 p-3 rounded-lg">
                  <CalendarDaysIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Downtime</p>
                  <p className="text-2xl font-bold text-gray-900">{(getTotalDowntime() / 60).toFixed(1)}h</p>
                </div>
              </div>
            </div>
          </div>

          {/* Production Records */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Production History</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Shift
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('production.machine')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('production.operator')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('navigation.quality')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {traceData.production_records.map((record) => (
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
                        {record.machine_name ? (
                          <div className="flex items-center">
                            <CogIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{record.machine_name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.operator_name ? (
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{record.operator_name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.quantity_produced.toLocaleString()}
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
                            {calculateQualityRate(record.quantity_good, record.quantity_produced)}% quality
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
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {record.notes || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {traceData.production_records.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No production records found for this batch</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!traceData && !loading && !error && (
        <div className="card p-12 text-center">
          <DocumentMagnifyingGlassIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Masukkan nomor Work Order untuk mulai tracking</h3>
          <p className="text-gray-500 mb-6">
            Cari dengan nomor WO (contoh: WO-001) atau batch number untuk melihat histori produksi lengkap.
          </p>
          <div className="max-w-md mx-auto">
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h4 className="font-medium text-gray-900 mb-2">Yang akan ditampilkan:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Detail work order dan timeline</li>
                <li>• Informasi mesin dan operator</li>
                <li>• Jumlah produksi dan metrik kualitas</li>
                <li>• Data downtime dan efisiensi</li>
                <li>• Histori produksi lengkap</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Traceability
