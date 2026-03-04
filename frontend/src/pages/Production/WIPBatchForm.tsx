import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CubeIcon } from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

interface WorkOrder {
  id: number;
  wo_number: string;
  product_name: string;
  quantity: number;
  status: string;
  machine_name?: string;
}

const WIPBatchForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [formData, setFormData] = useState({
    work_order_id: '',
    current_stage: 'production',
    shift: 'shift_1',
    notes: ''
  });

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      // Fetch work orders yang belum punya WIP batch
      const response = await axiosInstance.get('/api/production/work-orders', {
        params: { status: 'in_progress,pending' }
      });
      
      // Filter WO yang belum punya WIP
      const wipResponse = await axiosInstance.get('/api/wip/wip-batches');
      const existingWOIds = (wipResponse.data.wip_batches || []).map((w: any) => w.work_order_id);
      
      const availableWOs = (response.data.work_orders || []).filter(
        (wo: WorkOrder) => !existingWOIds.includes(wo.id)
      );
      
      setWorkOrders(availableWOs);
    } catch (error) {
      console.error('Error fetching work orders:', error);
    }
  };

  const handleWOChange = (woId: string) => {
    setFormData({ ...formData, work_order_id: woId });
    const wo = workOrders.find(w => w.id === parseInt(woId));
    setSelectedWO(wo || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.work_order_id) {
      toast.error('Pilih Work Order terlebih dahulu');
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.post('/api/wip/wip-batches', {
        work_order_id: parseInt(formData.work_order_id),
        current_stage: formData.current_stage,
        shift: formData.shift,
        notes: formData.notes
      });
      
      toast.success('WIP Batch berhasil dibuat');
      navigate('/app/production/wip-batches');
    } catch (error: any) {
      console.error('Error creating WIP batch:', error);
      toast.error(error.response?.data?.message || 'Gagal membuat WIP Batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buat WIP Batch</h1>
          <p className="text-gray-600">Buat batch Work in Progress dari Work Order</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Info:</strong> WIP Batch akan otomatis dibuat saat Work Order dimulai. 
          Form ini untuk membuat WIP Batch secara manual jika diperlukan.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Pilih Work Order</h2>
          
          {workOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CubeIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p>Tidak ada Work Order yang tersedia</p>
              <p className="text-sm">Semua Work Order sudah memiliki WIP Batch atau belum ada Work Order aktif</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Order <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.work_order_id}
                  onChange={(e) => handleWOChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">-- Pilih Work Order --</option>
                  {workOrders.map((wo) => (
                    <option key={wo.id} value={wo.id}>
                      {wo.wo_number} - {wo.product_name} ({wo.quantity} pcs) - {wo.status}
                    </option>
                  ))}
                </select>
              </div>

              {selectedWO && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">Detail Work Order</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">No. WO:</span>
                      <span className="ml-2 font-medium">{selectedWO.wo_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Produk:</span>
                      <span className="ml-2 font-medium">{selectedWO.product_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Quantity:</span>
                      <span className="ml-2 font-medium">{selectedWO.quantity} pcs</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Mesin:</span>
                      <span className="ml-2 font-medium">{selectedWO.machine_name || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stage Awal
                  </label>
                  <select
                    value={formData.current_stage}
                    onChange={(e) => setFormData({ ...formData, current_stage: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ready_to_start">Ready to Start</option>
                    <option value="production">Production</option>
                    <option value="cutting">Cutting</option>
                    <option value="filling">Filling</option>
                    <option value="sealing">Sealing</option>
                    <option value="packing">Packing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shift
                  </label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="shift_1">Shift 1 (06:30 - 15:00)</option>
                    <option value="shift_2">Shift 2 (15:00 - 23:00)</option>
                    <option value="shift_3">Shift 3 (23:00 - 06:30)</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Catatan tambahan (opsional)"
                />
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading || !formData.work_order_id}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Menyimpan...' : 'Buat WIP Batch'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WIPBatchForm;
