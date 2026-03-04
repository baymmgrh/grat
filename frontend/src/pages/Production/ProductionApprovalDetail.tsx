import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  BanknotesIcon,
  DocumentTextIcon,
  CubeIcon,
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
  BeakerIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

interface MaterialUsage {
  material_name: string;
  material_code: string;
  category: string;
  material_type: string;
  qty_per_karton: number;
  qty_per_pack: number;
  qty_needed: number;
  scrap_percent: number;
  qty_effective: number;
  uom: string;
  unit_cost: number;
  total_cost: number;
  is_critical: boolean;
  packs_per_karton: number;
  qty_produced_packs: number;
  qty_produced_kartons: number;
}

interface ShiftProduction {
  id: number;
  production_date: string;
  shift: string;
  target_quantity: number;
  actual_quantity: number;
  good_quantity: number;
  reject_quantity: number;
  efficiency_rate: number;
  quality_rate: number;
  oee_score: number;
  downtime_minutes: number;
  operator_name: string | null;
  notes: string | null;
  issues: string | null;
}

interface ConsumptionPerGrade {
  grade: string;
  qty_pack: number;
  kain_kg: number;
  ingredient_kg: number;
  packaging_pcs: number;
  stiker_pcs: number;
  color: string;
}

interface ConsumptionTotals {
  total_kain_kg: number;
  total_ingredient_kg: number;
  total_packaging_pcs: number;
  total_stiker_pcs: number;
}

interface ProductionSummary {
  total_shifts: number;
  total_runtime_minutes: number;
  total_downtime_minutes: number;
  downtime_breakdown: {
    mesin: number;
    operator: number;
    material: number;
    design: number;
    others: number;
  };
  grade_summary: {
    grade_a: number;
    grade_b: number;
    grade_c: number;
  };
  consumption_per_grade?: ConsumptionPerGrade[];
  consumption_totals?: ConsumptionTotals;
  grade_breakdown?: {
    grade_a: number;
    grade_b: number;
    grade_c: number;
    setting: number;
    waste: number;
  };
}

interface ApprovalDetail {
  id: number;
  approval_number: string;
  work_order_id: number;
  wo_number: string;
  product_name: string;
  wip_batch_id: number | null;
  quantity_produced: number;
  quantity_good: number;
  quantity_reject: number;
  material_cost: number;
  labor_cost: number;
  overhead_cost: number;
  total_cost: number;
  cost_per_unit: number;
  oee_score: number;
  efficiency_rate: number;
  quality_rate: number;
  total_downtime_minutes: number;
  downtime_cost: number;
  status: string;
  manager_notes: string | null;
  adjustment_reason: string | null;
  original_quantity_good: number | null;
  original_total_cost: number | null;
  submitter_name: string;
  submitted_at: string;
  reviewer_name: string | null;
  reviewed_at: string | null;
  forwarded_to_finance: boolean;
  forwarded_at: string | null;
  invoice_id: number | null;
  work_order: any;
  wip_batch: any;
  job_cost_entries: any[];
  material_usage: MaterialUsage[];
  production_summary: ProductionSummary;
  shift_productions: ShiftProduction[];
}

const ProductionApprovalDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [approval, setApproval] = useState<ApprovalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  const [editForm, setEditForm] = useState({
    quantity_good: 0,
    quantity_reject: 0,
    material_cost: 0,
    labor_cost: 0,
    overhead_cost: 0,
    manager_notes: '',
    adjustment_reason: ''
  });

  useEffect(() => {
    fetchApproval();
  }, [id]);

  const fetchApproval = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/production/production-approvals/${id}`);
      setApproval(response.data);
      setEditForm({
        quantity_good: response.data.quantity_good,
        quantity_reject: response.data.quantity_reject,
        material_cost: response.data.material_cost,
        labor_cost: response.data.labor_cost,
        overhead_cost: response.data.overhead_cost,
        manager_notes: response.data.manager_notes || '',
        adjustment_reason: response.data.adjustment_reason || ''
      });
    } catch (error) {
      console.error('Error fetching approval:', error);
      toast.error('Gagal memuat data approval');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setSubmitting(true);
      await axiosInstance.put(`/api/production/production-approvals/${id}`, editForm);
      toast.success('Data berhasil diupdate');
      setEditing(false);
      fetchApproval();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      await axiosInstance.put(`/api/production/production-approvals/${id}/approve`, {
        notes: editForm.manager_notes
      });
      toast.success('Produksi disetujui!');
      fetchApproval();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal approve');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Alasan penolakan harus diisi');
      return;
    }
    try {
      setSubmitting(true);
      await axiosInstance.put(`/api/production/production-approvals/${id}/reject`, {
        reason: rejectReason
      });
      toast.success('Produksi ditolak');
      setShowRejectModal(false);
      fetchApproval();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal reject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForwardToFinance = async () => {
    try {
      setSubmitting(true);
      const response = await axiosInstance.put(`/api/production/production-approvals/${id}/forward-to-finance`);
      toast.success('Berhasil diteruskan ke Finance!');
      fetchApproval();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal forward ke Finance');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!approval) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Approval tidak ditemukan</p>
        </div>
      </div>
    );
  }

  const hasChanges = approval.original_quantity_good !== approval.quantity_good || 
                     approval.original_total_cost !== approval.total_cost;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{approval.approval_number}</h1>
            <p className="text-gray-600">Approval Produksi - {approval.wo_number}</p>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {approval.forwarded_to_finance ? (
            <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full font-medium">
              ✓ Forwarded to Finance
            </span>
          ) : approval.status === 'approved' ? (
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium">
              ✓ Disetujui
            </span>
          ) : approval.status === 'rejected' ? (
            <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full font-medium">
              ✗ Ditolak
            </span>
          ) : (
            <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-medium">
              ⏳ Menunggu Approval
            </span>
          )}
        </div>
      </div>

      {/* Work Order Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
          <DocumentTextIcon className="h-5 w-5 text-gray-500" />
          Informasi Work Order
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">No. WO</p>
            <p className="font-medium">{approval.work_order?.wo_number}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Produk</p>
            <p className="font-medium">{approval.product_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Target Qty</p>
            <p className="font-medium">{approval.work_order?.quantity?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status WO</p>
            <p className="font-medium capitalize">{approval.work_order?.status}</p>
          </div>
        </div>
      </div>

      {/* Production Summary - Editable */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <CubeIcon className="h-5 w-5 text-gray-500" />
            Ringkasan Produksi
          </h2>
          {approval.status === 'pending' && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qty Good</label>
                <input
                  type="number"
                  value={editForm.quantity_good}
                  onChange={(e) => setEditForm({ ...editForm, quantity_good: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qty Reject</label>
                <input
                  type="number"
                  value={editForm.quantity_reject}
                  onChange={(e) => setEditForm({ ...editForm, quantity_reject: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material Cost</label>
                <input
                  type="number"
                  value={editForm.material_cost}
                  onChange={(e) => setEditForm({ ...editForm, material_cost: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Labor Cost</label>
                <input
                  type="number"
                  value={editForm.labor_cost}
                  onChange={(e) => setEditForm({ ...editForm, labor_cost: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Overhead Cost</label>
                <input
                  type="number"
                  value={editForm.overhead_cost}
                  onChange={(e) => setEditForm({ ...editForm, overhead_cost: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Perubahan</label>
              <textarea
                value={editForm.adjustment_reason}
                onChange={(e) => setEditForm({ ...editForm, adjustment_reason: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Jelaskan alasan perubahan data..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Qty Good</p>
              <p className="text-2xl font-bold text-green-800">{approval.quantity_good.toLocaleString()}</p>
              {hasChanges && approval.original_quantity_good && (
                <p className="text-xs text-gray-500">Original: {approval.original_quantity_good.toLocaleString()}</p>
              )}
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600">Qty Reject</p>
              <p className="text-2xl font-bold text-red-800">{approval.quantity_reject.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Total Produced</p>
              <p className="text-2xl font-bold text-blue-800">{approval.quantity_produced.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600">Quality Rate</p>
              <p className="text-2xl font-bold text-purple-800">{approval.quality_rate}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Material Usage */}
      {approval.material_usage && approval.material_usage.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <BeakerIcon className="h-5 w-5 text-gray-500" />
              Material yang Dibutuhkan
            </h2>
            <div className="text-sm text-gray-500">
              Batch Size: {approval.material_usage[0]?.packs_per_karton || 1} PCS
            </div>
          </div>
          
          {/* Production Summary */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-blue-600">Pack per Karton:</span>
                <span className="ml-2 font-bold">{approval.material_usage[0]?.packs_per_karton || 1}</span>
              </div>
              <div>
                <span className="text-blue-600">Total Produksi:</span>
                <span className="ml-2 font-bold">{approval.material_usage[0]?.qty_produced_packs?.toLocaleString()} pack</span>
              </div>
              <div>
                <span className="text-blue-600">Setara Karton:</span>
                <span className="ml-2 font-bold">{approval.material_usage[0]?.qty_produced_kartons?.toLocaleString()} karton</span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Tipe</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty/Karton</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty/Pack</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-blue-600 uppercase">Qty Dibutuhkan</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">UOM</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-orange-600 uppercase">Scrap %</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-green-600 uppercase">Qty Efektif</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Critical</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {approval.material_usage.map((mat, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-3 py-2 text-sm font-medium text-gray-900">{mat.material_code}</td>
                    <td className="px-3 py-2">
                      <div className="text-sm font-medium text-gray-900">{mat.material_name}</div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        mat.material_type === 'wip' ? 'bg-purple-100 text-purple-700' :
                        mat.material_type === 'packaging materials' ? 'bg-blue-100 text-blue-700' :
                        mat.material_type === 'chemical materials' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {mat.material_type || mat.category}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-right">{mat.qty_per_karton?.toLocaleString(undefined, {maximumFractionDigits: 4})}</td>
                    <td className="px-3 py-2 text-sm text-right">{mat.qty_per_pack?.toLocaleString(undefined, {maximumFractionDigits: 4})}</td>
                    <td className="px-3 py-2 text-sm text-right font-medium text-blue-600">{mat.qty_needed?.toLocaleString(undefined, {maximumFractionDigits: 4})}</td>
                    <td className="px-3 py-2 text-sm text-center">{mat.uom}</td>
                    <td className="px-3 py-2 text-sm text-center text-orange-600">{mat.scrap_percent}%</td>
                    <td className="px-3 py-2 text-sm text-right font-bold text-green-700">{mat.qty_effective?.toLocaleString(undefined, {maximumFractionDigits: 4})}</td>
                    <td className="px-3 py-2 text-center">
                      {mat.is_critical && <span className="text-red-500 font-bold">⚠</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Consumption per Grade */}
      {approval.production_summary?.consumption_per_grade && approval.production_summary.consumption_per_grade.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <BeakerIcon className="h-5 w-5 text-gray-500" />
            Consumption per Grade (Auto-calculated)
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty (pack)</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Kain (kg)</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ingredient (kg)</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Packaging (pcs)</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Stiker (pcs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {approval.production_summary.consumption_per_grade.map((row: any, idx: number) => (
                  <tr key={idx} className={`${
                    row.grade === 'TOTAL' ? 'bg-blue-50 font-bold' :
                    row.color === 'green' ? 'bg-green-50' :
                    row.color === 'yellow' ? 'bg-yellow-50' :
                    row.color === 'red' ? 'bg-red-50' :
                    row.color === 'gray' ? 'bg-gray-50' : ''
                  }`}>
                    <td className={`px-4 py-2 text-sm font-medium ${
                      row.color === 'green' ? 'text-green-700' :
                      row.color === 'yellow' ? 'text-yellow-700' :
                      row.color === 'red' ? 'text-red-700' :
                      row.color === 'gray' ? 'text-gray-700' :
                      row.color === 'blue' ? 'text-blue-700' : 'text-gray-900'
                    }`}>{row.grade}</td>
                    <td className="px-4 py-2 text-sm text-right">{row.qty_pack?.toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm text-right">{row.kain_kg?.toLocaleString(undefined, {maximumFractionDigits: 4})}</td>
                    <td className="px-4 py-2 text-sm text-right">{row.ingredient_kg?.toLocaleString(undefined, {maximumFractionDigits: 4})}</td>
                    <td className="px-4 py-2 text-sm text-right">{row.packaging_pcs?.toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm text-right">{row.stiker_pcs?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Consumption Totals Summary */}
          {approval.production_summary.consumption_totals && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-600">Total Kain</p>
                <p className="text-lg font-bold text-amber-800">{approval.production_summary.consumption_totals.total_kain_kg?.toLocaleString(undefined, {maximumFractionDigits: 4})} kg</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <p className="text-xs text-purple-600">Total Ingredient</p>
                <p className="text-lg font-bold text-purple-800">{approval.production_summary.consumption_totals.total_ingredient_kg?.toLocaleString(undefined, {maximumFractionDigits: 4})} kg</p>
              </div>
              <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-200">
                <p className="text-xs text-cyan-600">Total Packaging</p>
                <p className="text-lg font-bold text-cyan-800">{approval.production_summary.consumption_totals.total_packaging_pcs?.toLocaleString()} pcs</p>
              </div>
              <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                <p className="text-xs text-pink-600">Total Stiker</p>
                <p className="text-lg font-bold text-pink-800">{approval.production_summary.consumption_totals.total_stiker_pcs?.toLocaleString()} pcs</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Downtime Breakdown */}
      {approval.production_summary && approval.production_summary.downtime_breakdown && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <WrenchScrewdriverIcon className="h-5 w-5 text-gray-500" />
            Breakdown Downtime
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600">Mesin</p>
              <p className="text-xl font-bold text-red-800">{approval.production_summary.downtime_breakdown.mesin} menit</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600">Operator</p>
              <p className="text-xl font-bold text-orange-800">{approval.production_summary.downtime_breakdown.operator} menit</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600">Material</p>
              <p className="text-xl font-bold text-yellow-800">{approval.production_summary.downtime_breakdown.material} menit</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Design</p>
              <p className="text-xl font-bold text-blue-800">{approval.production_summary.downtime_breakdown.design} menit</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Others</p>
              <p className="text-xl font-bold text-gray-800">{approval.production_summary.downtime_breakdown.others} menit</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-gray-600">Total Downtime</span>
            <span className="text-xl font-bold text-gray-900">{approval.production_summary.total_downtime_minutes} menit</span>
          </div>
        </div>
      )}

      {/* Shift Productions */}
      {approval.shift_productions && approval.shift_productions.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
            Riwayat Produksi per Shift ({approval.shift_productions.length} shift)
          </h2>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Tanggal</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Shift</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Actual</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Good</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Reject</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Efficiency</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">OEE</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {approval.shift_productions.map((sp) => (
                  <tr key={sp.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm">{new Date(sp.production_date).toLocaleDateString('id-ID')}</td>
                    <td className="px-3 py-2 text-sm">{sp.shift.replace('shift_', 'Shift ')}</td>
                    <td className="px-3 py-2 text-sm text-right">{sp.actual_quantity.toLocaleString()}</td>
                    <td className="px-3 py-2 text-sm text-right text-green-600">{sp.good_quantity.toLocaleString()}</td>
                    <td className="px-3 py-2 text-sm text-right text-red-600">{sp.reject_quantity.toLocaleString()}</td>
                    <td className="px-3 py-2 text-sm text-right">{sp.efficiency_rate.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-sm text-right font-medium">{sp.oee_score.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-sm">{sp.operator_name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cost Breakdown */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
          <CurrencyDollarIcon className="h-5 w-5 text-gray-500" />
          Breakdown Biaya
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600">Material Cost</p>
            <p className="text-xl font-bold text-blue-800">{formatCurrency(approval.material_cost)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600">Labor Cost</p>
            <p className="text-xl font-bold text-green-800">{formatCurrency(approval.labor_cost)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600">Overhead Cost</p>
            <p className="text-xl font-bold text-purple-800">{formatCurrency(approval.overhead_cost)}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-600">Total Cost</p>
            <p className="text-xl font-bold text-orange-800">{formatCurrency(approval.total_cost)}</p>
            {hasChanges && approval.original_total_cost && (
              <p className="text-xs text-gray-500">Original: {formatCurrency(approval.original_total_cost)}</p>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Cost per Unit</span>
            <span className="text-xl font-bold text-gray-900">{formatCurrency(approval.cost_per_unit)}</span>
          </div>
        </div>
      </div>

      {/* Job Cost Entries */}
      {approval.job_cost_entries && approval.job_cost_entries.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Detail Job Cost Entries</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Unit Cost</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {approval.job_cost_entries.map((entry: any, idx: number) => (
                <tr key={idx}>
                  <td className="px-4 py-2 text-sm capitalize">{entry.cost_type}</td>
                  <td className="px-4 py-2 text-sm">{entry.cost_category}</td>
                  <td className="px-4 py-2 text-sm">{entry.description}</td>
                  <td className="px-4 py-2 text-sm text-right">{entry.quantity.toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm text-right">{formatCurrency(entry.unit_cost)}</td>
                  <td className="px-4 py-2 text-sm text-right font-medium">{formatCurrency(entry.total_cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Approval Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-gray-500" />
          Informasi Approval
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Disubmit oleh</p>
            <p className="font-medium">{approval.submitter_name}</p>
            <p className="text-sm text-gray-400">{formatDate(approval.submitted_at)}</p>
          </div>
          {approval.reviewer_name && (
            <div>
              <p className="text-sm text-gray-500">Direview oleh</p>
              <p className="font-medium">{approval.reviewer_name}</p>
              <p className="text-sm text-gray-400">{approval.reviewed_at && formatDate(approval.reviewed_at)}</p>
            </div>
          )}
        </div>
        
        {approval.manager_notes && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">Catatan Manager</p>
            <p className="mt-1 text-gray-900">{approval.manager_notes}</p>
          </div>
        )}
        
        {approval.adjustment_reason && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">Alasan Perubahan</p>
            <p className="mt-1 text-gray-900">{approval.adjustment_reason}</p>
          </div>
        )}
      </div>

      {/* Manager Notes */}
      {approval.status === 'pending' && !editing && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Catatan Manager</h2>
          <textarea
            value={editForm.manager_notes}
            onChange={(e) => setEditForm({ ...editForm, manager_notes: e.target.value })}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Tambahkan catatan (opsional)..."
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        {approval.status === 'pending' && (
          <>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <XCircleIcon className="h-5 w-5" />
              Tolak
            </button>
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircleIcon className="h-5 w-5" />
              {submitting ? 'Processing...' : 'Setujui'}
            </button>
          </>
        )}
        
        {approval.status === 'approved' && !approval.forwarded_to_finance && (
          <button
            onClick={handleForwardToFinance}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <BanknotesIcon className="h-5 w-5" />
            {submitting ? 'Processing...' : 'Forward ke Finance'}
          </button>
        )}
        
        {approval.forwarded_to_finance && approval.invoice_id && (
          <Link
            to={`/app/finance/invoices/${approval.invoice_id}`}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <DocumentTextIcon className="h-5 w-5" />
            Lihat di Finance
          </Link>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Tolak Approval</h3>
            <p className="text-gray-600 mb-4">Berikan alasan penolakan:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
              placeholder="Alasan penolakan..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Processing...' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionApprovalDetail;
