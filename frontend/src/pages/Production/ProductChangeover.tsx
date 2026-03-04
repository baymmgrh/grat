import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CubeIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

interface WorkOrder {
  id: number;
  wo_number: string;
  product_name: string;
  product_code: string;
  quantity: number;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
}

interface ChangeoverForm {
  reason: string;
  reason_detail: string;
  to_work_order_id: number | null;
  notes: string;
}

const CHANGEOVER_REASONS = [
  { value: 'material_shortage', label: 'Kehabisan Bahan Baku', icon: '📦' },
  { value: 'target_exceeded', label: 'Target Sudah Tercapai/Melebihi', icon: '✅' },
  { value: 'priority_change', label: 'Perubahan Prioritas', icon: '🔄' },
  { value: 'quality_issue', label: 'Masalah Kualitas', icon: '⚠️' },
  { value: 'customer_request', label: 'Permintaan Customer', icon: '👤' },
  { value: 'other', label: 'Lainnya', icon: '📝' },
];

const ProductChangeover: React.FC = () => {
  const { woId } = useParams<{ woId: string }>();
  const navigate = useNavigate();
  
  const [currentWO, setCurrentWO] = useState<any>(null);
  const [availableWOs, setAvailableWOs] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState<ChangeoverForm>({
    reason: '',
    reason_detail: '',
    to_work_order_id: null,
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [woId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch current work order
      const woResponse = await axiosInstance.get(`/api/production/work-orders/${woId}`);
      setCurrentWO(woResponse.data.work_order || woResponse.data);
      
      // Fetch available work orders for changeover
      if (woResponse.data.work_order?.machine_id || woResponse.data.machine_id) {
        const machineId = woResponse.data.work_order?.machine_id || woResponse.data.machine_id;
        const availableResponse = await axiosInstance.get(`/api/production/machines/${machineId}/available-work-orders`);
        setAvailableWOs(availableResponse.data.available_work_orders || []);
      }
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.reason) {
      setError('Pilih alasan changeover');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await axiosInstance.post(`/api/production/work-orders/${woId}/changeover`, {
        reason: form.reason,
        reason_detail: form.reason_detail,
        to_work_order_id: form.to_work_order_id,
        notes: form.notes,
      });
      
      alert('Changeover berhasil dimulai!');
      
      // Navigate to changeover detail or work order list
      if (form.to_work_order_id) {
        navigate(`/app/production/work-orders/${form.to_work_order_id}`);
      } else {
        navigate('/app/production/changeovers');
      }
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal memulai changeover');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const progressPercentage = currentWO ? 
    Math.round((currentWO.quantity_produced || 0) / (currentWO.quantity || 1) * 100) : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ArrowPathIcon className="h-7 w-7 text-orange-500" />
          Product Changeover
        </h1>
        <p className="text-gray-600 mt-1">
          Ganti produk di tengah produksi
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <ExclamationTriangleIcon className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Current Work Order Info */}
      {currentWO && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CubeIcon className="h-5 w-5 text-blue-500" />
            Work Order Saat Ini
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">No. WO</p>
              <p className="font-semibold">{currentWO.wo_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Produk</p>
              <p className="font-semibold">{currentWO.product?.name || currentWO.product_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                currentWO.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                currentWO.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {currentWO.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Mesin</p>
              <p className="font-semibold">{currentWO.machine?.name || currentWO.machine_name || '-'}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress Produksi</span>
              <span className="font-medium">{currentWO.quantity_produced || 0} / {currentWO.quantity} ({progressPercentage}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full ${progressPercentage >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Changeover Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <WrenchScrewdriverIcon className="h-5 w-5 text-orange-500" />
          Form Changeover
        </h2>

        {/* Reason Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alasan Changeover <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CHANGEOVER_REASONS.map((reason) => (
              <button
                key={reason.value}
                type="button"
                onClick={() => setForm({ ...form, reason: reason.value })}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  form.reason === reason.value
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-xl">{reason.icon}</span>
                <p className="text-sm font-medium mt-1">{reason.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Reason Detail */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Detail Alasan
          </label>
          <textarea
            value={form.reason_detail}
            onChange={(e) => setForm({ ...form, reason_detail: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Jelaskan detail alasan changeover..."
          />
        </div>

        {/* Select Next Work Order */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Work Order Selanjutnya (Opsional)
          </label>
          {availableWOs.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, to_work_order_id: null })}
                className={`w-full p-3 rounded-lg border text-left ${
                  form.to_work_order_id === null
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <p className="font-medium text-gray-600">Pilih nanti</p>
                <p className="text-sm text-gray-500">Tentukan WO selanjutnya setelah changeover</p>
              </button>
              
              {availableWOs.map((wo) => (
                <button
                  key={wo.id}
                  type="button"
                  onClick={() => setForm({ ...form, to_work_order_id: wo.id })}
                  className={`w-full p-3 rounded-lg border text-left ${
                    form.to_work_order_id === wo.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{wo.wo_number}</p>
                      <p className="text-sm text-gray-600">{wo.product_name}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        wo.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        wo.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {wo.priority}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">Qty: {wo.quantity}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm p-3 bg-gray-50 rounded-lg">
              Tidak ada Work Order yang tersedia untuk mesin ini
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catatan Tambahan
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Catatan tambahan..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting || !form.reason}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Memproses...
              </>
            ) : (
              <>
                <ArrowPathIcon className="h-5 w-5" />
                Mulai Changeover
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductChangeover;
