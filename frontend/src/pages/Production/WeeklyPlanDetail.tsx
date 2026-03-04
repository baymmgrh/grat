import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import SearchableSelect from '../../components/SearchableSelect';
import {
  CalendarDaysIcon,
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  CubeIcon,
  TrashIcon,
  DocumentCheckIcon,
  PlayIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

interface PlanItem {
  id: number;
  product_id: number;
  product_code: string;
  product_name: string;
  planned_quantity: number;
  uom: string;
  priority: number;
  planned_date: string | null;
  machine_id: number | null;
  machine_name: string | null;
  material_status: string;
  shortage_items: string | null;
  work_order_id: number | null;
  wo_number: string | null;
  notes: string | null;
}

interface WeeklyPlan {
  id: number;
  plan_number: string;
  week_number: number;
  year: number;
  week_start: string;
  week_end: string;
  status: string;
  creator_name: string;
  approver_name: string | null;
  approved_at: string | null;
  notes: string | null;
  items: PlanItem[];
}

interface Product {
  id: number;
  code: string;
  name: string;
  uom: string;
}

interface Machine {
  id: number;
  code: string;
  name: string;
}

const MATERIAL_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  available: 'bg-green-100 text-green-800',
  shortage: 'bg-red-100 text-red-800',
  no_bom: 'bg-yellow-100 text-yellow-800',
};

const MATERIAL_STATUS_LABELS: Record<string, string> = {
  pending: 'Belum Dicek',
  available: 'Material Tersedia',
  shortage: 'Material Kurang',
  no_bom: 'Tidak Ada BOM',
};

const WeeklyPlanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShortageModal, setShowShortageModal] = useState<PlanItem | null>(null);
  const [checkingMaterials, setCheckingMaterials] = useState(false);
  const [generatingWO, setGeneratingWO] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    product_id: '',
    planned_quantity: '',
    priority: 1,
    planned_date: '',
    machine_id: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [planRes, productsRes, machinesRes] = await Promise.all([
        axiosInstance.get(`/api/production/weekly-plans/${id}`),
        axiosInstance.get('/api/products-new/?per_page=1000'),
        axiosInstance.get('/api/production/machines'),
      ]);
      
      setPlan(planRes.data.weekly_plan);
      // Map products-new fields to expected format
      const mappedProducts = (productsRes.data.products || []).map((p: any) => ({
        id: p.id,
        code: p.kode_produk || p.code,
        name: p.nama_produk || p.name,
        primary_uom: p.satuan || p.primary_uom || 'pcs',
      }));
      setProducts(mappedProducts);
      setMachines(machinesRes.data.machines || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    try {
      if (!formData.product_id || !formData.planned_quantity) {
        alert('Pilih produk dan masukkan quantity');
        return;
      }
      
      await axiosInstance.post(`/api/production/weekly-plans/${id}/items`, {
        product_id: parseInt(formData.product_id),
        planned_quantity: parseFloat(formData.planned_quantity),
        priority: formData.priority,
        planned_date: formData.planned_date || null,
        machine_id: formData.machine_id ? parseInt(formData.machine_id) : null,
        notes: formData.notes,
      });
      
      setShowAddModal(false);
      setFormData({
        product_id: '',
        planned_quantity: '',
        priority: 1,
        planned_date: '',
        machine_id: '',
        notes: '',
      });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal menambah item');
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Hapus item ini?')) return;
    
    try {
      await axiosInstance.delete(`/api/production/weekly-plans/${id}/items/${itemId}`);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal menghapus item');
    }
  };

  const handleCheckMaterials = async () => {
    try {
      setCheckingMaterials(true);
      const response = await axiosInstance.post(`/api/production/weekly-plans/${id}/check-materials`);
      alert(`Material check selesai!\n\nTersedia: ${response.data.summary.available}\nKurang: ${response.data.summary.shortage}\nTanpa BOM: ${response.data.summary.no_bom}`);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal cek material');
    } finally {
      setCheckingMaterials(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await axiosInstance.post(`/api/production/weekly-plans/${id}/submit`);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal submit');
    }
  };

  const handleApprove = async () => {
    try {
      await axiosInstance.post(`/api/production/weekly-plans/${id}/approve`);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal approve');
    }
  };

  const handleGenerateWO = async () => {
    if (!confirm('Generate Work Order untuk semua item yang belum memiliki WO?')) return;
    
    try {
      setGeneratingWO(true);
      const response = await axiosInstance.post(`/api/production/weekly-plans/${id}/generate-work-orders`);
      alert(`${response.data.work_orders.length} Work Order berhasil dibuat!`);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal generate WO');
    } finally {
      setGeneratingWO(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Hapus rencana produksi ini?')) return;
    
    try {
      await axiosInstance.delete(`/api/production/weekly-plans/${id}`);
      navigate('/app/production/scheduling');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal menghapus');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!plan) {
    return <div className="p-6 text-center text-gray-500">Plan tidak ditemukan</div>;
  }

  const canEdit = plan.status === 'draft';
  const canSubmit = plan.status === 'draft' && plan.items.length > 0;
  const canApprove = plan.status === 'submitted';
  const canGenerateWO = plan.status === 'approved';

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/app/production/scheduling')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDaysIcon className="h-7 w-7 text-blue-600" />
            {plan.plan_number}
          </h1>
          <p className="text-gray-600">
            Minggu {plan.week_number}, {plan.year} ({formatDate(plan.week_start)} - {formatDate(plan.week_end)})
          </p>
        </div>
        
        {/* Status Badge */}
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          plan.status === 'draft' ? 'bg-gray-100 text-gray-800' :
          plan.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
          plan.status === 'approved' ? 'bg-blue-100 text-blue-800' :
          plan.status === 'in_progress' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {plan.status.toUpperCase()}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        {canEdit && (
          <>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Tambah Produk
            </button>
            <button
              onClick={handleCheckMaterials}
              disabled={checkingMaterials}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 disabled:opacity-50"
            >
              <ExclamationTriangleIcon className="h-5 w-5" />
              {checkingMaterials ? 'Mengecek...' : 'Cek Material'}
            </button>
          </>
        )}
        
        {canSubmit && (
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <DocumentCheckIcon className="h-5 w-5" />
            Submit untuk Approval
          </button>
        )}
        
        {canApprove && (
          <button
            onClick={handleApprove}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <CheckCircleIcon className="h-5 w-5" />
            Approve
          </button>
        )}
        
        {canGenerateWO && (
          <button
            onClick={handleGenerateWO}
            disabled={generatingWO}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
          >
            <ClipboardDocumentListIcon className="h-5 w-5" />
            {generatingWO ? 'Generating...' : 'Generate Work Orders'}
          </button>
        )}
        
        {canEdit && (
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <TrashIcon className="h-5 w-5" />
            Hapus Plan
          </button>
        )}
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Daftar Produk ({plan.items.length})</h2>
          <span className="text-gray-500">Total: {plan.items.reduce((sum, i) => sum + i.planned_quantity, 0).toLocaleString()} unit</span>
        </div>
        
        {plan.items.length === 0 ? (
          <div className="text-center p-12 text-gray-500">
            <CubeIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Belum ada produk dalam rencana</p>
            {canEdit && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tambah Produk
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioritas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mesin</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status Material</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Order</th>
                  {canEdit && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plan.items.sort((a, b) => a.priority - b.priority).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.priority === 1 ? 'bg-red-100 text-red-800' :
                        item.priority === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        #{item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-gray-500">{item.product_code}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {item.planned_quantity.toLocaleString()} {item.uom}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {item.planned_date ? formatDate(item.planned_date) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {item.machine_name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => item.material_status === 'shortage' && setShowShortageModal(item)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${MATERIAL_STATUS_COLORS[item.material_status]} ${
                          item.material_status === 'shortage' ? 'cursor-pointer hover:opacity-80' : ''
                        }`}
                      >
                        {MATERIAL_STATUS_LABELS[item.material_status]}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {item.wo_number ? (
                        <Link
                          to={`/app/production/work-orders/${item.work_order_id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {item.wo_number}
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold mb-4">Tambah Produk ke Rencana</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Produk *</label>
                <SearchableSelect
                  options={products.map((p) => ({
                    id: p.id,
                    code: p.code,
                    name: p.name
                  }))}
                  value={formData.product_id ? parseInt(formData.product_id) : null}
                  onChange={(val) => setFormData({ ...formData, product_id: val ? String(val) : '' })}
                  placeholder="Ketik untuk mencari produk..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                  <input
                    type="number"
                    value={formData.planned_quantity}
                    onChange={(e) => setFormData({ ...formData, planned_quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prioritas</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value={1}>1 - Tertinggi</option>
                    <option value={2}>2 - Tinggi</option>
                    <option value={3}>3 - Normal</option>
                    <option value={4}>4 - Rendah</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Produksi</label>
                  <input
                    type="date"
                    value={formData.planned_date}
                    onChange={(e) => setFormData({ ...formData, planned_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mesin</label>
                  <SearchableSelect
                    options={machines.map((m) => ({
                      id: m.id,
                      code: m.code || m.name,
                      name: m.name
                    }))}
                    value={formData.machine_id ? parseInt(formData.machine_id) : null}
                    onChange={(val) => setFormData({ ...formData, machine_id: val ? String(val) : '' })}
                    placeholder="Ketik untuk mencari mesin..."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catatan</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shortage Modal */}
      {showShortageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600">
              <ExclamationTriangleIcon className="h-5 w-5" />
              Material Shortage - {showShortageModal.product_name}
            </h3>
            
            {showShortageModal.shortage_items && (
              <div className="space-y-3">
                {JSON.parse(showShortageModal.shortage_items).map((item: any, idx: number) => (
                  <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-medium">{item.material_name}</p>
                    <p className="text-sm text-gray-600">{item.material_code}</p>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                      <div>
                        <span className="text-gray-500">Dibutuhkan:</span>
                        <span className="font-medium ml-1">{item.required.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Tersedia:</span>
                        <span className="font-medium ml-1">{item.available.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Kurang:</span>
                        <span className="font-medium ml-1 text-red-600">{item.shortage.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowShortageModal(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyPlanDetail;
