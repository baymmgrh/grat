import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useGetReturnQuery, useCreateQCInspectionMutation, useCreateDispositionMutation } from '../../services/returnsApi'
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArchiveBoxIcon,
  ArrowLeftIcon,
  BeakerIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  WrenchScrewdriverIcon
,
  XCircleIcon
} from '@heroicons/react/24/outline';
export default function ReturnDetails() {
    const { t } = useLanguage();

const { id } = useParams<{ id: string }>()
  const [showQCModal, setShowQCModal] = useState(false)
  const [showDispositionModal, setShowDispositionModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const { data: returnData, isLoading, refetch } = useGetReturnQuery(Number(id))
  const [createQCInspection] = useCreateQCInspectionMutation()
  const [createDisposition] = useCreateDispositionMutation()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received': return <ClockIcon className="h-5 w-5 text-blue-500" />
      case 'qc_pending': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'qc_approved': return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'qc_rejected': return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'processed': return <CheckCircleIcon className="h-5 w-5 text-blue-500" />
      default: return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    switch (status) {
      case 'received':
        return `${baseClasses} bg-blue-100 text-blue-800`
      case 'qc_pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'qc_approved':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'qc_rejected':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'processed':
        return `${baseClasses} bg-blue-100 text-blue-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const getDispositionIcon = (disposition: string) => {
    switch (disposition) {
      case 'rework': return <WrenchScrewdriverIcon className="h-5 w-5 text-orange-500" />
      case 'warehouse': return <ArchiveBoxIcon className="h-5 w-5 text-blue-500" />
      case 'waste': return <TrashIcon className="h-5 w-5 text-red-500" />
      case 'scrap': return <XCircleIcon className="h-5 w-5 text-gray-500" />
      default: return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const handleQCInspection = async (formData: any) => {
    try {
      await createQCInspection({
        return_id: Number(id),
        inspection: {
          return_item_id: selectedItem?.id,
          visual_inspection: formData.visual_inspection,
          functional_test: formData.functional_test,
          dimensional_check: formData.dimensional_check,
          overall_result: formData.overall_result,
          quantity_inspected: formData.quantity_inspected,
          quantity_approved: formData.quantity_approved || 0,
          quantity_rejected: formData.quantity_rejected || 0,
          defects_found: formData.defects_found,
          qc_notes: formData.qc_notes,
          recommendation: formData.recommendation
        }
      }).unwrap()
      
      setShowQCModal(false)
      setSelectedItem(null)
      refetch()
    } catch (error) {
      console.error('Failed to create QC inspection:', error)
    }
  }

  const handleDisposition = async (formData: any) => {
    try {
      await createDisposition({
        return_id: Number(id),
        disposition: {
          dispositions: [{
            return_item_id: selectedItem?.id,
            disposition_type: formData.disposition_type,
            quantity: formData.quantity,
            warehouse_location: formData.warehouse_location,
            waste_category: formData.waste_category,
            notes: formData.notes
          }]
        }
      }).unwrap()
      
      setShowDispositionModal(false)
      setSelectedItem(null)
      refetch()
    } catch (error) {
      console.error('Failed to create disposition:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!returnData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Return not found</h2>
        <p className="text-gray-600 mt-2">The return you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/app/returns"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {getStatusIcon(returnData.status)}
              Return {returnData.return_number}
            </h1>
            <p className="text-gray-600">Customer: {returnData.customer.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={getStatusBadge(returnData.status)}>
            {returnData.status.replace('_', ' ').toUpperCase()}
          </span>
          {returnData.qc_required && (
            <span className={getStatusBadge(returnData.qc_status || 'pending')}>
              QC: {(returnData.qc_status || 'pending').replace('_', ' ').toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Return Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Return Details Card */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Return Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Return Date</label>
                <p className="text-gray-900">{new Date(returnData.return_date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Sales Order</label>
                <p className="text-gray-900">{returnData.sales_order_number || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Reason</label>
                <p className="text-gray-900">{returnData.reason}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Total Value</label>
                <p className="text-gray-900">Rp {returnData.total_value.toLocaleString()}</p>
              </div>
              {returnData.description && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">{t('common.description')}</label>
                  <p className="text-gray-900">{returnData.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Return Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Return Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('production.product')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.quantity')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      QC Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {returnData.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                          {item.batch_number && (
                            <div className="text-sm text-gray-500">Batch: {item.batch_number}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity_returned}
                        {item.qc_quantity_approved > 0 && (
                          <div className="text-xs text-green-600">
                            Approved: {item.qc_quantity_approved}
                          </div>
                        )}
                        {item.qc_quantity_rejected > 0 && (
                          <div className="text-xs text-red-600">
                            Rejected: {item.qc_quantity_rejected}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.condition_received === 'good' ? 'bg-green-100 text-green-800' :
                          item.condition_received === 'damaged' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.condition_received}
                        </span>
                        {item.defect_description && (
                          <div className="text-xs text-gray-500 mt-1">{item.defect_description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.qc_status ? (
                          <span className={getStatusBadge(item.qc_status)}>
                            {item.qc_status.replace('_', ' ').toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.disposition ? (
                          <div className="flex items-center gap-1">
                            {getDispositionIcon(item.disposition)}
                            <span className="text-sm text-gray-900 capitalize">{item.disposition}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {returnData.qc_required && !item.qc_status && (
                            <button
                              onClick={() => {
                                setSelectedItem(item)
                                setShowQCModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            >
                              <BeakerIcon className="h-4 w-4" />
                            </button>
                          )}
                          {item.qc_status === 'approved' && !item.disposition && (
                            <button
                              onClick={() => {
                                setSelectedItem(item)
                                setShowDispositionModal(true)
                              }}
                              className="text-green-600 hover:text-green-900 flex items-center gap-1"
                            >
                              <ArchiveBoxIcon className="h-4 w-4" />
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-gray-500">Company</label>
                <p className="text-gray-900">{returnData.customer.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Contact</label>
                <p className="text-gray-900">{returnData.customer.contact}</p>
              </div>
            </div>
          </div>

          {/* QC Records */}
          {returnData.qc_records.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">QC Records</h3>
              <div className="space-y-4">
                {returnData.qc_records.map((qc) => (
                  <div key={qc.id} className="border-l-4 border-blue-200 pl-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{qc.qc_by}</span>
                      <span className={getStatusBadge(qc.overall_result)}>
                        {qc.overall_result.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{new Date(qc.qc_date).toLocaleDateString()}</p>
                    <div className="mt-2 text-sm">
                      <p>Inspected: {qc.quantity_inspected}</p>
                      <p>Approved: {qc.quantity_approved}</p>
                      <p>Rejected: {qc.quantity_rejected}</p>
                    </div>
                    {qc.qc_notes && (
                      <p className="text-sm text-gray-600 mt-2">{qc.qc_notes}</p>
                    )}
                    {qc.recommendation && (
                      <p className="text-sm text-blue-600 mt-1">Rec: {qc.recommendation}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QC Modal */}
      {showQCModal && selectedItem && (
        <QCInspectionModal
          item={selectedItem}
          onSubmit={handleQCInspection}
          onClose={() => {
            setShowQCModal(false)
            setSelectedItem(null)
          }}
        />
      )}

      {/* Disposition Modal */}
      {showDispositionModal && selectedItem && (
        <DispositionModal
          item={selectedItem}
          onSubmit={handleDisposition}
          onClose={() => {
            setShowDispositionModal(false)
            setSelectedItem(null)
          }}
        />
      )}
    </div>
  )
}

// QC Inspection Modal Component
function QCInspectionModal({ item, onSubmit, onClose }: any) {
  const [formData, setFormData] = useState({
    visual_inspection: '',
    functional_test: '',
    dimensional_check: '',
    overall_result: '',
    quantity_inspected: item.quantity_returned,
    quantity_approved: 0,
    quantity_rejected: 0,
    defects_found: '',
    qc_notes: '',
    recommendation: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">QC Inspection - {item.product_name}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Visual Inspection</label>
              <select
                value={formData.visual_inspection}
                onChange={(e) => setFormData({ ...formData, visual_inspection: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">Select result</option>
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Overall Result</label>
              <select
                value={formData.overall_result}
                onChange={(e) => setFormData({ ...formData, overall_result: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">Select result</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="conditional">Conditional</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity Approved</label>
                <input
                  type="number"
                  value={formData.quantity_approved}
                  onChange={(e) => setFormData({ ...formData, quantity_approved: parseInt(e.target.value) || 0 })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  min="0"
                  max={formData.quantity_inspected}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity Rejected</label>
                <input
                  type="number"
                  value={formData.quantity_rejected}
                  onChange={(e) => setFormData({ ...formData, quantity_rejected: parseInt(e.target.value) || 0 })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  min="0"
                  max={formData.quantity_inspected}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">QC Notes</label>
              <textarea
                value={formData.qc_notes}
                onChange={(e) => setFormData({ ...formData, qc_notes: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Recommendation</label>
              <select
                value={formData.recommendation}
                onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select recommendation</option>
                <option value="rework">Rework</option>
                <option value="warehouse">Return to Warehouse</option>
                <option value="scrap">Scrap</option>
                <option value="waste">Send to Waste</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >{t('common.cancel')}</button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Submit QC
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Disposition Modal Component
function DispositionModal({ item, onSubmit, onClose }: any) {
  const [formData, setFormData] = useState({
    disposition_type: '',
    quantity: item.qc_quantity_approved || item.quantity_returned,
    warehouse_location: '',
    waste_category: '',
    notes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Disposition - {item.product_name}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Disposition Type</label>
              <select
                value={formData.disposition_type}
                onChange={(e) => setFormData({ ...formData, disposition_type: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">Select disposition</option>
                <option value="rework">Rework</option>
                <option value="warehouse">Return to Warehouse</option>
                <option value="waste">Send to Waste</option>
                <option value="scrap">Scrap</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">{t('common.quantity')}</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                min="1"
                max={item.qc_quantity_approved || item.quantity_returned}
                required
              />
            </div>

            {formData.disposition_type === 'warehouse' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Warehouse Location</label>
                <input
                  type="text"
                  value={formData.warehouse_location}
                  onChange={(e) => setFormData({ ...formData, warehouse_location: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., A-01-01"
                />
              </div>
            )}

            {formData.disposition_type === 'waste' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Waste Category</label>
                <select
                  value={formData.waste_category}
                  onChange={(e) => setFormData({ ...formData, waste_category: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select category</option>
                  <option value="defective">Defective</option>
                  <option value="damaged">Damaged</option>
                  <option value="expired">Expired</option>
                  <option value="contaminated">Contaminated</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >{t('common.cancel')}</button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Submit Disposition
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
