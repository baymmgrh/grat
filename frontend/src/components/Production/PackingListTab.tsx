import { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';

interface PackingListItem {
  id: number;
  carton_number: number;
  weight_kg: number | null;
  batch_mixing: string | null;
  is_batch_start: boolean;
}

interface PackingList {
  id: number;
  work_order_id: number;
  product_name: string;
  total_karton: number;
  last_carton_number: number;
  current_batch_mixing: string | null;
  start_carton_number: number;
}

interface PackingListTabProps {
  workOrderId: number;
  productName: string;
  totalAktualKarton: number;
  packPerCarton: number;
}

export default function PackingListTab({ 
  workOrderId, 
  productName, 
  totalAktualKarton,
  packPerCarton 
}: PackingListTabProps) {
  const [packingList, setPackingList] = useState<PackingList | null>(null);
  const [items, setItems] = useState<PackingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const perPage = 20;

  const [newBatchMixing, setNewBatchMixing] = useState('');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchStartCarton, setBatchStartCarton] = useState<number | null>(null);

  const [editedItems, setEditedItems] = useState<Record<number, { weight_kg?: number }>>({});
  
  const [startCartonNumber, setStartCartonNumber] = useState<number>(1);
  const [showStartNumberModal, setShowStartNumberModal] = useState(false);

  useEffect(() => {
    fetchPackingList();
  }, [workOrderId, page]);

  const fetchPackingList = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/api/production/work-orders/${workOrderId}/packing-list?page=${page}&per_page=${perPage}`
      );
      setPackingList(response.data.packing_list);
      setItems(response.data.items);
      setTotalPages(response.data.pagination.pages);
      setTotalItems(response.data.pagination.total);
      if (response.data.packing_list?.start_carton_number) {
        setStartCartonNumber(response.data.packing_list.start_carton_number);
      }
    } catch (error) {
      console.error('Error fetching packing list:', error);
      toast.error('Gagal memuat packing list');
    } finally {
      setLoading(false);
    }
  };

  const syncPackingList = async () => {
    try {
      setSaving(true);
      await axiosInstance.post(
        `/api/production/work-orders/${workOrderId}/packing-list/sync`,
        { 
          total_karton: totalAktualKarton,
          start_carton_number: startCartonNumber
        }
      );
      toast.success('Packing list berhasil disinkronkan');
      setShowStartNumberModal(false);
      fetchPackingList();
    } catch (error) {
      console.error('Error syncing packing list:', error);
      toast.error('Gagal menyinkronkan packing list');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSyncModal = () => {
    setShowStartNumberModal(true);
  };

  const handleWeightChange = (itemId: number, weight: string) => {
    const weightNum = parseFloat(weight) || 0;
    setEditedItems(prev => ({
      ...prev,
      [itemId]: { weight_kg: weightNum }
    }));
  };

  const saveWeights = async () => {
    try {
      setSaving(true);
      const itemsToUpdate = Object.entries(editedItems).map(([id, data]) => ({
        id: parseInt(id),
        weight_kg: data.weight_kg
      }));

      if (itemsToUpdate.length === 0) {
        toast('Tidak ada perubahan untuk disimpan');
        return;
      }

      await axiosInstance.put(
        `/api/production/work-orders/${workOrderId}/packing-list/items`,
        { items: itemsToUpdate }
      );
      toast.success('Berat karton berhasil disimpan');
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
      await axiosInstance.post(
        `/api/production/work-orders/${workOrderId}/packing-list/batch-mixing`,
        { 
          batch_mixing: newBatchMixing,
          start_from_carton: batchStartCarton
        }
      );
      toast.success('Batch mixing berhasil diset');
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

  const openBatchModal = (cartonNumber?: number) => {
    setBatchStartCarton(cartonNumber || null);
    setNewBatchMixing(packingList?.current_batch_mixing || '');
    setShowBatchModal(true);
  };

  if (loading && !packingList) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-green-800">📦 Packing List</h3>
            <p className="text-sm text-green-600">{productName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-600">Total Karton</p>
            <p className="text-2xl font-bold text-green-800">{totalAktualKarton}</p>
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-green-600">Batch Mixing Aktif</p>
            <p className="font-medium text-green-800">
              {packingList?.current_batch_mixing || '-'}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-green-600">Nomor Karton</p>
            <p className="font-medium text-green-800">
              {packingList?.start_carton_number || startCartonNumber} - {(packingList?.start_carton_number || startCartonNumber) + totalAktualKarton - 1}
            </p>
          </div>
          <button
            onClick={() => openBatchModal()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Ganti Batch Mixing
          </button>
          <button
            onClick={handleOpenSyncModal}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Menyinkronkan...' : 'Sinkronkan'}
          </button>
        </div>
      </div>

      {/* Packing List Table */}
      {items.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  No. Karton
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Batch Mixing
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Berat (kg)
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr 
                  key={item.id} 
                  className={item.is_batch_start ? 'bg-yellow-50' : ''}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-medium text-gray-900">
                      {item.carton_number}
                    </span>
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
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={editedItems[item.id]?.weight_kg ?? item.weight_kg ?? ''}
                      onChange={(e) => handleWeightChange(item.id, e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="0.000"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <button
                      onClick={() => openBatchModal(item.carton_number)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Set Batch
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t">
            <div className="text-sm text-gray-600">
              Menampilkan {(page - 1) * perPage + 1} - {Math.min(page * perPage, totalItems)} dari {totalItems} karton
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <span className="text-sm">
                Halaman {page} dari {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">Belum ada data karton. Klik "Sinkronkan" untuk membuat daftar karton.</p>
        </div>
      )}

      {/* Save Button */}
      {Object.keys(editedItems).length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={saveWeights}
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Berat Karton'}
          </button>
        </div>
      )}

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
              {!batchStartCarton && (
                <p className="text-sm text-gray-500">
                  Batch mixing baru akan diterapkan untuk karton selanjutnya yang ditambahkan.
                </p>
              )}
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

      {/* Start Carton Number Modal */}
      {showStartNumberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Sinkronkan Packing List</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Karton Awal
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={startCartonNumber}
                  onChange={(e) => setStartCartonNumber(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="1"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Total Karton:</strong> {totalAktualKarton}
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Nomor Karton:</strong> {startCartonNumber} - {startCartonNumber + totalAktualKarton - 1}
                </p>
                {startCartonNumber + totalAktualKarton - 1 > 10000 && (
                  <p className="text-sm text-orange-600 mt-1">
                    ⚠️ Nomor karton akan reset ke 1 setelah 10000
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowStartNumberModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                onClick={syncPackingList}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Menyinkronkan...' : 'Sinkronkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
