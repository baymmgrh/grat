import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ScaleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PrinterIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';

interface PackingListItem {
  id: number;
  carton_number: number;
  weight_kg: number | null;
  weigh_date: string | null;
  weigh_time: string | null;
  batch_mixing: string | null;
  is_batch_start: boolean;
  qc_status: string | null;
  weighed_by: string | null;
}

interface PackingList {
  id: number;
  packing_number: string;
  product_id: number;
  product_name: string;
  product_code: string;
  customer_name: string | null;
  so_number: string | null;
  pack_per_carton: number;
  total_carton: number;
  total_pcs: number;
  start_carton_number: number;
  end_carton_number: number;
  current_batch_mixing: string | null;
  status: string;
  packing_date: string | null;
  items_count: number;
  weighed_count: number;
  qc_status: string | null;
  qc_date: string | null;
  qc_by: string | null;
  qc_notes: string | null;
  released_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export default function PackingListDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [packingList, setPackingList] = useState<PackingList | null>(null);
  const [items, setItems] = useState<PackingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 50;

  const [editedItems, setEditedItems] = useState<Record<number, { weight_kg?: number; weigh_date?: string }>>({});
  const [bulkWeighDate, setBulkWeighDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [newBatchMixing, setNewBatchMixing] = useState('');
  const [batchStartCarton, setBatchStartCarton] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      fetchPackingList();
    }
  }, [id, page]);

  const fetchPackingList = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/packing-list/${id}/items?page=${page}&per_page=${perPage}`);
      setPackingList(response.data.packing_list);
      setItems(response.data.items);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching packing list:', error);
      toast.error('Gagal memuat packing list');
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (itemId: number, weight: string) => {
    const weightNum = parseFloat(weight) || 0;
    setEditedItems(prev => ({
      ...prev,
      [itemId]: { 
        ...prev[itemId],
        weight_kg: weightNum,
        weigh_date: prev[itemId]?.weigh_date || bulkWeighDate
      }
    }));
  };

  const handleWeighDateChange = (itemId: number, date: string) => {
    setEditedItems(prev => ({
      ...prev,
      [itemId]: { 
        ...prev[itemId],
        weigh_date: date
      }
    }));
  };

  const saveWeights = async () => {
    try {
      setSaving(true);
      const itemsToUpdate = Object.entries(editedItems)
        .filter(([_, data]) => data.weight_kg !== undefined)
        .map(([id, data]) => ({
          id: parseInt(id),
          weight_kg: data.weight_kg,
          weigh_date: data.weigh_date || bulkWeighDate
        }));

      if (itemsToUpdate.length === 0) {
        toast('Tidak ada perubahan untuk disimpan');
        return;
      }

      await axiosInstance.put(`/api/packing-list/${id}/items/weigh`, { items: itemsToUpdate });
      toast.success(`${itemsToUpdate.length} karton berhasil ditimbang`);
      setEditedItems({});
      fetchPackingList();
    } catch (error) {
      console.error('Error saving weights:', error);
      toast.error('Gagal menyimpan berat karton');
    } finally {
      setSaving(false);
    }
  };

  const handleSetBatchMixing = async () => {
    if (!newBatchMixing.trim()) {
      toast.error('Batch mixing tidak boleh kosong');
      return;
    }

    try {
      setSaving(true);
      await axiosInstance.put(`/api/packing-list/${id}/items/batch`, {
        batch_mixing: newBatchMixing,
        start_from_carton: batchStartCarton
      });
      toast.success('Batch mixing berhasil diupdate');
      setShowBatchModal(false);
      setNewBatchMixing('');
      setBatchStartCarton(null);
      fetchPackingList();
    } catch (error) {
      console.error('Error setting batch mixing:', error);
      toast.error('Gagal mengatur batch mixing');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Yakin ingin membatalkan packing list ini? Stok akan dikembalikan ke WIP.')) {
      return;
    }

    try {
      await axiosInstance.post(`/api/packing-list/${id}/cancel`);
      toast.success('Packing list dibatalkan');
      navigate('/app/production/packing-list');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal membatalkan packing list');
    }
  };

  const handleComplete = async () => {
    if (!window.confirm('Tandai packing list ini sebagai selesai?')) {
      return;
    }

    try {
      await axiosInstance.put(`/api/packing-list/${id}`, { status: 'completed' });
      toast.success('Packing list selesai');
      fetchPackingList();
    } catch (error) {
      toast.error('Gagal menyelesaikan packing list');
    }
  };

  const openBatchModal = (cartonNumber?: number) => {
    setBatchStartCarton(cartonNumber || null);
    setNewBatchMixing(packingList?.current_batch_mixing || '');
    setShowBatchModal(true);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-yellow-100 text-yellow-800',
      quarantine: 'bg-orange-100 text-orange-800',
      released: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-500'
    };
    return styles[status] || styles.draft;
  };

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    in_progress: 'Dalam Proses',
    completed: 'Selesai Timbang',
    quarantine: 'Quarantine',
    released: 'Released',
    rejected: 'Rejected',
    cancelled: 'Dibatalkan'
  };

  if (loading && !packingList) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!packingList) {
    return (
      <div className="p-6 text-center text-red-600">
        Packing list tidak ditemukan
      </div>
    );
  }

  const progress = packingList.total_carton > 0 
    ? Math.round((packingList.weighed_count / packingList.total_carton) * 100) 
    : 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/app/production/packing-list"
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{packingList.packing_number}</h1>
          <p className="text-sm text-gray-500">
            {packingList.product_name} ({packingList.product_code})
          </p>
        </div>
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(packingList.status)}`}>
          {statusLabels[packingList.status] || packingList.status}
        </span>
      </div>

      {/* QC Status Info Banner */}
      {(packingList.status === 'completed' || packingList.status === 'quarantine') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-yellow-800">Menunggu QC Review</p>
              <p className="text-sm text-yellow-600">Semua karton sudah ditimbang. QC review dilakukan di modul Quality Control.</p>
            </div>
            <Link
              to="/app/quality/packing-list"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
            >
              Buka QC Packing List
            </Link>
          </div>
        </div>
      )}

      {/* QC Info - show when QC has been done */}
      {packingList.qc_status && (packingList.status === 'released' || packingList.status === 'rejected') && (
        <div className={`rounded-lg p-4 mb-6 border ${
          packingList.status === 'released' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <p className={`font-medium ${packingList.status === 'released' ? 'text-green-800' : 'text-red-800'}`}>
            {packingList.status === 'released' ? 'QC Released - Stok sudah masuk gudang FG' : 'QC Rejected - Stok WIP dikembalikan'}
          </p>
          <div className="text-sm mt-1 space-y-0.5">
            {packingList.qc_by && <p className="text-gray-600">QC oleh: {packingList.qc_by}</p>}
            {packingList.qc_date && <p className="text-gray-600">Tanggal: {new Date(packingList.qc_date).toLocaleString('id-ID')}</p>}
            {packingList.qc_notes && <p className="text-gray-600">Catatan: {packingList.qc_notes}</p>}
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Karton</p>
          <p className="text-2xl font-bold text-gray-900">{packingList.total_carton}</p>
          <p className="text-xs text-gray-500">{packingList.total_pcs.toLocaleString()} pcs</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Nomor Karton</p>
          <p className="text-2xl font-bold text-blue-600">
            {packingList.start_carton_number} - {packingList.end_carton_number}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Progress Timbang</p>
          <p className="text-2xl font-bold text-green-600">{progress}%</p>
          <p className="text-xs text-gray-500">{packingList.weighed_count} / {packingList.total_carton} karton</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Customer</p>
          <p className="text-lg font-medium text-gray-900">{packingList.customer_name || '-'}</p>
          {packingList.so_number && (
            <p className="text-xs text-blue-500">SO: {packingList.so_number}</p>
          )}
        </div>
      </div>

      {/* Action Bar */}
      {!['completed', 'quarantine', 'released', 'rejected', 'cancelled'].includes(packingList.status) && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
              <label className="text-sm text-gray-600">Tanggal Timbang Default:</label>
              <input
                type="date"
                value={bulkWeighDate}
                onChange={(e) => setBulkWeighDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="flex-1" />
            <button
              onClick={() => openBatchModal()}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
            >
              Ganti Batch Mixing
            </button>
            {packingList.weighed_count === packingList.total_carton && (
              <button
                onClick={handleComplete}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Selesaikan
              </button>
            )}
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2"
            >
              <XCircleIcon className="h-5 w-5" />
              Batalkan
            </button>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-green-50 border-b border-green-200 px-4 py-3 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-green-800">📦 Daftar Karton</h3>
            <p className="text-sm text-green-600">
              Batch Mixing: {packingList.current_batch_mixing || '-'}
            </p>
          </div>
          {Object.keys(editedItems).length > 0 && (
            <button
              onClick={saveWeights}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <ScaleIcon className="h-5 w-5" />
              {saving ? 'Menyimpan...' : `Simpan ${Object.keys(editedItems).length} Karton`}
            </button>
          )}
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Karton</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch Mixing</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Berat (kg)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tgl Timbang</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ditimbang Oleh</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr 
                key={item.id} 
                className={`${item.is_batch_start ? 'bg-yellow-50' : ''} ${item.weight_kg ? 'bg-green-50' : ''}`}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-medium text-gray-900">{item.carton_number}</span>
                  {item.is_batch_start && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded">
                      Batch Baru
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {item.batch_mixing || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {['completed', 'quarantine', 'released', 'rejected', 'cancelled'].includes(packingList.status) ? (
                    <span className="text-sm">{item.weight_kg ? `${item.weight_kg} kg` : '-'}</span>
                  ) : (
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={editedItems[item.id]?.weight_kg ?? item.weight_kg ?? ''}
                      onChange={(e) => handleWeightChange(item.id, e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="0.000"
                    />
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {['completed', 'quarantine', 'released', 'rejected', 'cancelled'].includes(packingList.status) ? (
                    <span className="text-sm text-gray-600">
                      {item.weigh_date ? new Date(item.weigh_date).toLocaleDateString('id-ID') : '-'}
                    </span>
                  ) : (
                    <input
                      type="date"
                      value={editedItems[item.id]?.weigh_date || item.weigh_date || bulkWeighDate}
                      onChange={(e) => handleWeighDateChange(item.id, e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {item.weighed_by || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  {!['completed', 'quarantine', 'released', 'rejected', 'cancelled'].includes(packingList.status) && (
                    <button
                      onClick={() => openBatchModal(item.carton_number)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Set Batch
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <span className="text-sm text-gray-600">
              Halaman {page} dari {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>

      {/* Batch Mixing Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {batchStartCarton 
                ? `Set Batch Mixing dari Karton #${batchStartCarton}` 
                : 'Ganti Batch Mixing'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Mixing
                </label>
                <input
                  type="text"
                  value={newBatchMixing}
                  onChange={(e) => setNewBatchMixing(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: BATCH-001"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                onClick={handleSetBatchMixing}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
