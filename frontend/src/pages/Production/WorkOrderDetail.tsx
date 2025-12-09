import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CalendarIcon, ClockIcon, CubeIcon, PlayIcon, PlusIcon, ChartBarIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import DocumentGenerateButton from '../../components/DocumentGenerateButton';
import { useGetWorkOrderByIdQuery } from '../../services/api';
import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';

interface ProductionRecord {
  id: number;
  production_date: string;
  shift: string;
  quantity_produced: number;
  quantity_good: number;
  quantity_reject: number;
  downtime_minutes: number;
  operator_name: string;
  notes: string;
}

export default function WorkOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: workOrder, isLoading, error, refetch } = useGetWorkOrderByIdQuery(id || '');
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [forceDelete, setForceDelete] = useState(false);
  const [wipBatch, setWipBatch] = useState<any>(null);
  const [approvalStatus, setApprovalStatus] = useState<any>(null);
  const [submittingApproval, setSubmittingApproval] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchProductionRecords();
      fetchWIPBatch();
    }
  }, [id]);
  
  const fetchWIPBatch = async () => {
    try {
      const response = await axiosInstance.get(`/api/wip/wip-batches?work_order_id=${id}`);
      if (response.data.wip_batches?.length > 0) {
        setWipBatch(response.data.wip_batches[0]);
      }
    } catch (error) {
      console.error('Error fetching WIP batch:', error);
    }
  };
  
  const fetchApprovalStatus = async () => {
    try {
      const response = await axiosInstance.get('/api/production/production-approvals', {
        params: { work_order_id: id }
      });
      const approvals = response.data.approvals || [];
      const existing = approvals.find((a: any) => a.work_order_id === parseInt(id || '0'));
      setApprovalStatus(existing || null);
    } catch (error) {
      console.error('Error fetching approval status:', error);
    }
  };
  
  useEffect(() => {
    if (id && workOrder?.status === 'completed') {
      fetchApprovalStatus();
    }
  }, [id, workOrder?.status]);
  
  const handleSubmitForApproval = async () => {
    try {
      setSubmittingApproval(true);
      const response = await axiosInstance.post(`/api/production/work-orders/${id}/submit-for-approval`);
      toast.success('Work Order berhasil disubmit untuk approval');
      setApprovalStatus(response.data.approval);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal submit approval');
    } finally {
      setSubmittingApproval(false);
    }
  };
  
  const fetchProductionRecords = async () => {
    try {
      setLoadingRecords(true);
      const response = await axiosInstance.get(`/api/production/work-orders/${id}/production-records`);
      setProductionRecords(response.data.records || []);
    } catch (error) {
      console.error('Error fetching production records:', error);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const url = forceDelete 
        ? `/api/production/work-orders/${id}?force=true`
        : `/api/production/work-orders/${id}`;
      
      await axiosInstance.delete(url);
      toast.success('Work Order berhasil dihapus');
      navigate('/app/production/work-orders');
    } catch (error: any) {
      console.error('Error deleting work order:', error);
      if (error.response?.data?.has_production) {
        toast.error('Work Order memiliki data produksi. Centang "Hapus beserta data produksi" untuk menghapus.');
      } else {
        toast.error(error.response?.data?.error || 'Gagal menghapus Work Order');
      }
    } finally {
      setDeleting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !workOrder) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load work order details.</p>
      </div>
    );
  }
  
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'planned': 'bg-blue-100 text-blue-800',
      'released': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-green-100 text-green-800',
      'completed': 'bg-green-100 text-green-800',
      'quality_inspection': 'bg-purple-100 text-purple-800',
      'quality_approved': 'bg-emerald-100 text-emerald-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  
  // Use production records if available, otherwise fall back to work order totals
  const recordsProduced = productionRecords.reduce((sum, r) => sum + r.quantity_produced, 0);
  const recordsGood = productionRecords.reduce((sum, r) => sum + r.quantity_good, 0);
  const recordsReject = productionRecords.reduce((sum, r) => sum + r.quantity_reject, 0);
  const recordsDowntime = productionRecords.reduce((sum, r) => sum + r.downtime_minutes, 0);
  
  // Use work order totals as primary source (updated by backend), fall back to records sum
  const totalProduced = workOrder.quantity_produced || recordsProduced;
  const totalGood = workOrder.quantity_good || recordsGood;
  const totalReject = workOrder.quantity_scrap || recordsReject;
  const totalDowntime = recordsDowntime; // Downtime only from records
  const progress = workOrder.quantity ? (totalProduced / workOrder.quantity * 100) : 0;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/app/production/work-orders"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Work Order Detail</h1>
            <p className="text-gray-600">{workOrder.wo_number}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(workOrder.status)}`}>
          {workOrder.status?.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Documents Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Documents</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500 block mb-2">
              SPK (Surat Perintah Kerja)
            </label>
            <DocumentGenerateButton
              transactionType="work_order"
              transactionId={parseInt(id || '0')}
              transactionNumber={workOrder.wo_number || `WO-${id}`}
              label="Generate SPK"
            />
          </div>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> SPK akan otomatis terisi dengan data dari Work Order ini termasuk:
            </p>
            <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
              <li>Informasi produk dan quantity</li>
              <li>Tanggal mulai dan target selesai</li>
              <li>Priority level</li>
              <li>Notes dan instruksi khusus</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
          Production Progress
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Target</p>
            <p className="text-2xl font-bold text-blue-800">{workOrder.quantity || 0}</p>
            <p className="text-xs text-blue-500">{workOrder.uom || 'pcs'}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Produced</p>
            <p className="text-2xl font-bold text-green-800">{totalProduced}</p>
            <p className="text-xs text-green-500">{workOrder.uom || 'pcs'}</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-lg">
            <p className="text-sm text-emerald-600 font-medium">Good</p>
            <p className="text-2xl font-bold text-emerald-800">{totalGood}</p>
            <p className="text-xs text-emerald-500">{workOrder.uom || 'pcs'}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-600 font-medium">Reject</p>
            <p className="text-2xl font-bold text-red-800">{totalReject}</p>
            <p className="text-xs text-red-500">{workOrder.uom || 'pcs'}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-600 font-medium">Downtime</p>
            <p className="text-2xl font-bold text-orange-800">{totalDowntime}</p>
            <p className="text-xs text-orange-500">minutes</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full ${progress >= 100 ? 'bg-green-600' : 'bg-blue-600'}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Job Costing Card */}
      {wipBatch && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Job Costing</h2>
            <span className="text-sm text-gray-500">{wipBatch.wip_batch_no}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Material</p>
              <p className="text-xl font-bold text-blue-800">
                Rp {(wipBatch.material_cost || 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Labor</p>
              <p className="text-xl font-bold text-green-800">
                Rp {(wipBatch.labor_cost || 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Overhead</p>
              <p className="text-xl font-bold text-purple-800">
                Rp {(wipBatch.overhead_cost || 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">Total WIP</p>
              <p className="text-xl font-bold text-orange-800">
                Rp {(wipBatch.total_wip_value || 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          {wipBatch.qty_completed > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Biaya per Unit</span>
                <span className="font-medium text-gray-900">
                  Rp {((wipBatch.total_wip_value || 0) / wipBatch.qty_completed).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Work Order Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Work Order Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Product</label>
            <p className="mt-1 text-gray-900">{workOrder.product_name || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Quantity</label>
            <p className="mt-1 text-gray-900 flex items-center">
              <CubeIcon className="h-5 w-5 mr-2 text-gray-400" />
              {workOrder.quantity || 0} {workOrder.uom || 'pcs'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Start Date</label>
            <p className="mt-1 text-gray-900 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
              {workOrder.scheduled_start_date ? new Date(workOrder.scheduled_start_date).toLocaleDateString() : 'Not set'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Due Date</label>
            <p className="mt-1 text-gray-900 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
              {workOrder.scheduled_end_date ? new Date(workOrder.scheduled_end_date).toLocaleDateString() : 'Not set'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Priority</label>
            <p className="mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                workOrder.priority === 'high' ? 'bg-red-100 text-red-800' :
                workOrder.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {workOrder.priority?.toUpperCase() || 'NORMAL'}
              </span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Machine</label>
            <p className="mt-1 text-gray-900">{workOrder.machine_name || 'Not assigned'}</p>
          </div>
          {workOrder.notes && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">Notes</label>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{workOrder.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* BOM Materials Required */}
      {workOrder.bom_materials && workOrder.bom_materials.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <CubeIcon className="h-5 w-5 mr-2 text-purple-600" />
              Material yang Dibutuhkan
              {workOrder.bom_number && (
                <span className="ml-2 text-sm text-gray-500">
                  (BOM: {workOrder.bom_number})
                </span>
              )}
            </h2>
            {workOrder.batch_size && (
              <span className="text-sm text-gray-500">
                Batch Size: {workOrder.batch_size} {workOrder.uom}
              </span>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-purple-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase">No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase">Kode</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase">Material</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase">Tipe</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-purple-700 uppercase">Qty/Batch</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-purple-700 uppercase">Qty Dibutuhkan</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-purple-700 uppercase">UOM</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-purple-700 uppercase">Scrap %</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-purple-700 uppercase">Qty Efektif</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-purple-700 uppercase">Critical</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workOrder.bom_materials.map((material: any) => (
                  <tr key={material.id} className={`hover:bg-gray-50 ${material.is_critical ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 text-sm text-gray-500">{material.line_number}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{material.item_code}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{material.item_name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        material.item_type === 'raw_materials' ? 'bg-blue-100 text-blue-700' :
                        material.item_type === 'packaging_materials' ? 'bg-green-100 text-green-700' :
                        material.item_type === 'chemical_materials' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {material.item_type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">{material.quantity_per_batch}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-purple-600">{material.required_quantity}</td>
                    <td className="px-4 py-3 text-sm text-center">{material.uom}</td>
                    <td className="px-4 py-3 text-sm text-right text-orange-600">{material.scrap_percent}%</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{material.effective_quantity}</td>
                    <td className="px-4 py-3 text-center">
                      {material.is_critical && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                          Critical
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Production Records */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <PlayIcon className="h-5 w-5 mr-2 text-green-600" />
            Production Records (Shift Input)
          </h2>
          {(workOrder.status === 'in_progress' || workOrder.status === 'released') && (
            <Link
              to={`/app/production/work-orders/${id}/input`}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Input Produksi
            </Link>
          )}
        </div>
        
        {loadingRecords ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : productionRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Produced</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Good</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reject</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Downtime</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operator</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productionRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{new Date(record.production_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm">{record.shift}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{record.quantity_produced}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-600">{record.quantity_good}</td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">{record.quantity_reject}</td>
                    <td className="px-4 py-3 text-sm text-right text-orange-600">{record.downtime_minutes} min</td>
                    <td className="px-4 py-3 text-sm">{record.operator_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{record.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <PlayIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p>Belum ada data produksi</p>
            {(workOrder.status === 'in_progress' || workOrder.status === 'released') && (
              <Link
                to={`/app/production/work-orders/${id}/input`}
                className="inline-flex items-center mt-3 text-blue-600 hover:text-blue-800"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Mulai input produksi
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-wrap gap-3">
          {/* Edit Button - available for planned, released, in_progress */}
          {['planned', 'released', 'in_progress'].includes(workOrder.status) && (
            <Link
              to={`/app/production/work-orders/${id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Work Order
            </Link>
          )}
          {(workOrder.status === 'in_progress' || workOrder.status === 'released') && (
            <>
              <Link
                to={`/app/production/work-orders/${id}/input`}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Input Produksi
              </Link>
              <Link
                to={`/app/production/work-orders/${id}/changeover`}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 inline-flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                Ganti Produk
              </Link>
            </>
          )}
          {/* Submit for Approval - Only for completed WO without approval */}
          {workOrder.status === 'completed' && !approvalStatus && (
            <button
              onClick={handleSubmitForApproval}
              disabled={submittingApproval}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-flex items-center disabled:opacity-50"
            >
              <DocumentCheckIcon className="h-4 w-4 mr-2" />
              {submittingApproval ? 'Submitting...' : 'Submit for Approval'}
            </button>
          )}
          
          {/* View Approval Status */}
          {approvalStatus && (
            <Link
              to={`/app/production/approvals/${approvalStatus.id}`}
              className={`px-4 py-2 rounded-lg inline-flex items-center ${
                approvalStatus.status === 'approved' 
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : approvalStatus.status === 'rejected'
                  ? 'bg-red-100 text-red-800 hover:bg-red-200'
                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
              }`}
            >
              <DocumentCheckIcon className="h-4 w-4 mr-2" />
              {approvalStatus.status === 'approved' ? 'Approved' : 
               approvalStatus.status === 'rejected' ? 'Rejected' : 'Pending Approval'}
            </Link>
          )}
          
          {/* Delete Button */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 inline-flex items-center"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Hapus Work Order
          </button>
          <Link
            to="/app/production/work-orders"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Back to List
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Hapus Work Order</h3>
              </div>
              
              <p className="text-gray-600 mb-4">
                Apakah Anda yakin ingin menghapus Work Order <strong>{workOrder.wo_number}</strong>?
              </p>
              
              {productionRecords.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Perhatian:</strong> Work Order ini memiliki {productionRecords.length} record produksi.
                  </p>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={forceDelete}
                      onChange={(e) => setForceDelete(e.target.checked)}
                      className="rounded border-yellow-400 text-yellow-600 focus:ring-yellow-500"
                    />
                    <span className="text-sm text-yellow-700">Hapus beserta semua data produksi</span>
                  </label>
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setForceDelete(false);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting || (productionRecords.length > 0 && !forceDelete)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                >
                  {deleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Hapus
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
