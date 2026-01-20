import React from 'react'
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { format } from 'date-fns'
import {
  DocumentTextIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useGetWasteRecordsQuery } from '../../services/api'
export default function WasteRecordList() {
    const { t } = useLanguage();

const { data, isLoading } = useGetWasteRecordsQuery({})

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      recorded: 'badge-warning',
      collected: 'badge-info',
      disposed: 'badge-success'
    }
    return badges[status] || 'badge-info'
  }

  const getHazardBadge = (hazard: string) => {
    const badges: Record<string, string> = {
      none: 'badge-success',
      low: 'badge-info',
      medium: 'badge-warning',
      high: 'badge-danger'
    }
    return badges[hazard] || 'badge-info'
  }


  const records = data?.records || []

  // Calculate statistics
  const totalWeight = records.reduce((sum: number, r: any) => sum + (r.weight_kg || 0), 0)
  const totalQuantity = records.reduce((sum: number, r: any) => sum + (r.quantity || 0), 0)
  const totalValue = records.reduce((sum: number, r: any) => sum + (r.estimated_value || 0), 0)
  const highHazardCount = records.filter((r: any) => r.hazard_level === 'high').length
  const productionRejectCount = records.filter((r: any) => r.source === 'production').length

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Waste Management</h1>
          <p className="text-gray-600">Track and manage production waste disposal</p>
        </div>
        <Link
          to="/app/waste/new"
          className="btn-primary inline-flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Record Waste
        </Link>
      </div>

      {/* Waste Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">{records.length}</div>
              <div className="text-sm text-gray-500">Total Records</div>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalQuantity.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Total Quantity</div>
            </div>
            <TrashIcon className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-orange-600">{productionRejectCount}</div>
              <div className="text-sm text-gray-500">Production Rejects</div>
            </div>
            <div className="text-orange-400">🏭</div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-600">{highHazardCount}</div>
              <div className="text-sm text-gray-500">High Hazard</div>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Category Overview */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Waste Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900">Production Waste</h4>
            <p className="text-sm text-green-600">Recyclable materials</p>
            <div className="mt-2">
              <span className="badge badge-success">Low Risk</span>
            </div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900">Packaging Waste</h4>
            <p className="text-sm text-blue-600">Cardboard, plastic</p>
            <div className="mt-2">
              <span className="badge badge-info">No Risk</span>
            </div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <h4 className="font-medium text-red-900">Chemical Waste</h4>
            <p className="text-sm text-red-600">Requires special disposal</p>
            <div className="mt-2">
              <span className="badge badge-danger">High Risk</span>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900">General Waste</h4>
            <p className="text-sm text-gray-600">Regular disposal</p>
            <div className="mt-2">
              <span className="badge badge-gray">No Risk</span>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">{t('common.loading')}</div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Record Number</th>
                  <th>{t('products.bom.category')}</th>
                  <th>Waste Date</th>
                  <th>Source</th>
                  <th>{t('common.quantity')}</th>
                  <th>Weight (kg)</th>
                  <th>Hazard Level</th>
                  <th>Estimated Value</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((record: any) => (
                  <tr key={record.id} className={record.source === 'production' ? 'bg-orange-50' : ''}>
                    <td className="font-medium">
                      {record.record_number}
                      {record.source === 'production' && (
                        <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                          Production
                        </span>
                      )}
                    </td>
                    <td>
                      {record.category_name}
                      {record.product_name && (
                        <div className="text-xs text-gray-500">{record.product_name}</div>
                      )}
                    </td>
                    <td>{format(new Date(record.waste_date), 'dd MMM yyyy')}</td>
                    <td>
                      {record.source_department || '-'}
                      {record.machine_name && (
                        <div className="text-xs text-gray-500">{record.machine_name}</div>
                      )}
                    </td>
                    <td>
                      {record.quantity?.toLocaleString()} {record.uom}
                      {record.reject_quantity !== undefined && (
                        <div className="text-xs text-red-500">
                          Reject: {record.reject_quantity} | Rework: {record.rework_quantity}
                        </div>
                      )}
                    </td>
                    <td>{record.weight_kg ? record.weight_kg.toLocaleString() : '-'}</td>
                    <td>
                      <span className={`badge ${getHazardBadge(record.hazard_level)}`}>
                        {record.hazard_level}
                      </span>
                    </td>
                    <td>Rp {(record.estimated_value || 0).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>
                      {record.source !== 'production' && (
                        <Link 
                          to={`/app/waste/${record.id}`}
                          className="text-primary-600 hover:text-primary-800 text-sm"
                        >
                          View
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && records.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            🗑️
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No waste records</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by recording your first waste disposal.</p>
          <div className="mt-6">
            <Link to="/app/waste/new" className="btn-primary inline-flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              Record Waste
            </Link>
          </div>
        </div>
      )}

      {/* Environmental Tips */}
      <div className="card p-4 bg-green-50 border border-green-200">
        <h4 className="font-medium text-green-900 mb-2">🌱 Environmental Tips</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Separate waste by category for proper recycling</li>
          <li>• Minimize chemical waste through process optimization</li>
          <li>• Track waste reduction goals and achievements</li>
          <li>• Ensure compliance with environmental regulations</li>
          <li>• Consider waste-to-energy or recycling partnerships</li>
        </ul>
      </div>
    </div>
  )
}
