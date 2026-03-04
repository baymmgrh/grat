import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  PlusIcon,
  MinusIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';

interface WIPStock {
  id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  quantity_pcs: number;
  quantity_carton: number;
  pack_per_carton: number;
  last_wo_number: string | null;
  last_updated_at: string | null;
}

interface WIPMovement {
  id: number;
  product_name: string;
  movement_type: string;
  quantity_pcs: number;
  quantity_carton: number;
  reference_type: string;
  reference_number: string;
  balance_pcs: number;
  balance_carton: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export default function WIPStock() {
  const [wipStocks, setWipStocks] = useState<WIPStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<WIPStock | null>(null);
  const [adjustmentCarton, setAdjustmentCarton] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const [showMovementsModal, setShowMovementsModal] = useState(false);
  const [movements, setMovements] = useState<WIPMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  useEffect(() => {
    fetchWIPStocks();
  }, [page, search]);

  const fetchWIPStocks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
        ...(search && { search })
      });
      
      const response = await axiosInstance.get(`/api/packing-list/wip-stock?${params}`);
      setWipStocks(response.data.wip_stocks);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching WIP stocks:', error);
      toast.error('Gagal memuat data WIP');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async (productId: number) => {
    try {
      setLoadingMovements(true);
      const response = await axiosInstance.get(`/api/packing-list/wip-stock/${productId}/movements`);
      setMovements(response.data.movements);
    } catch (error) {
      console.error('Error fetching movements:', error);
      toast.error('Gagal memuat histori movement');
    } finally {
      setLoadingMovements(false);
    }
  };

  const openAdjustModal = (wip: WIPStock) => {
    setSelectedProduct(wip);
    setAdjustmentCarton('');
    setAdjustmentNotes('');
    setShowAdjustModal(true);
  };

  const openMovementsModal = (wip: WIPStock) => {
    setSelectedProduct(wip);
    fetchMovements(wip.product_id);
    setShowMovementsModal(true);
  };

  const handleAdjustment = async () => {
    if (!selectedProduct || !adjustmentCarton) {
      toast.error('Masukkan jumlah adjustment');
      return;
    }

    try {
      setAdjusting(true);
      await axiosInstance.post('/api/packing-list/wip-stock/adjustment', {
        product_id: selectedProduct.product_id,
        adjustment_carton: parseInt(adjustmentCarton),
        adjustment_pcs: parseInt(adjustmentCarton) * selectedProduct.pack_per_carton,
        notes: adjustmentNotes
      });
      
      toast.success('Adjustment berhasil disimpan');
      setShowAdjustModal(false);
      fetchWIPStocks();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal melakukan adjustment');
    } finally {
      setAdjusting(false);
    }
  };

  const getMovementIcon = (type: string) => {
    if (type === 'in') return <PlusIcon className="h-4 w-4 text-green-600" />;
    if (type === 'out') return <MinusIcon className="h-4 w-4 text-red-600" />;
    return <ArrowPathIcon className="h-4 w-4 text-blue-600" />;
  };

  const getMovementColor = (type: string) => {
    if (type === 'in') return 'text-green-600';
    if (type === 'out') return 'text-red-600';
    return 'text-blue-600';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📦 WIP Stock</h1>
          <p className="text-sm text-gray-500">Work In Progress - Stok hasil produksi sebelum packing</p>
        </div>
        <Link
          to="/app/production/packing-list"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <ArchiveBoxIcon className="h-5 w-5" />
          Kelola Packing List
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-purple-600">Total Produk dengan WIP</p>
          <p className="text-2xl font-bold text-purple-800">{wipStocks.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600">Total WIP Karton</p>
          <p className="text-2xl font-bold text-green-800">
            {wipStocks.reduce((sum, w) => sum + w.quantity_carton, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600">Total WIP Pcs</p>
          <p className="text-2xl font-bold text-blue-800">
            {wipStocks.reduce((sum, w) => sum + w.quantity_pcs, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : wipStocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <ArchiveBoxIcon className="h-16 w-16 mb-4 text-gray-300" />
            <p>Tidak ada stok WIP</p>
            <p className="text-sm">Selesaikan Work Order untuk menambah stok WIP</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stok Karton</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stok Pcs</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pack/Karton</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">WO Terakhir</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {wipStocks.map((wip) => (
                <tr key={wip.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{wip.product_name}</p>
                    <p className="text-xs text-gray-500">{wip.product_code}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xl font-bold text-purple-600">{wip.quantity_carton.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-lg font-medium text-gray-700">{wip.quantity_pcs.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {wip.pack_per_carton}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-blue-600">{wip.last_wo_number || '-'}</p>
                    {wip.last_updated_at && (
                      <p className="text-xs text-gray-500">
                        {new Date(wip.last_updated_at).toLocaleDateString('id-ID')}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openMovementsModal(wip)}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1"
                      >
                        <ClockIcon className="h-3 w-3" />
                        Histori
                      </button>
                      <button
                        onClick={() => openAdjustModal(wip)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1"
                      >
                        <ArrowPathIcon className="h-3 w-3" />
                        Adjust
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

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

      {/* Adjustment Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Adjustment WIP Stock</h3>
            
            <div className="bg-purple-50 rounded-lg p-3 mb-4">
              <p className="font-medium text-purple-800">{selectedProduct.product_name}</p>
              <p className="text-sm text-purple-600">
                Stok saat ini: {selectedProduct.quantity_carton} karton ({selectedProduct.quantity_pcs.toLocaleString()} pcs)
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adjustment Karton (+ untuk tambah, - untuk kurang)
                </label>
                <input
                  type="number"
                  value={adjustmentCarton}
                  onChange={(e) => setAdjustmentCarton(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 10 atau -5"
                />
                {adjustmentCarton && (
                  <p className="text-sm text-gray-500 mt-1">
                    Stok setelah adjustment: {selectedProduct.quantity_carton + parseInt(adjustmentCarton || '0')} karton
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Alasan adjustment..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                onClick={handleAdjustment}
                disabled={adjusting || !adjustmentCarton}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {adjusting ? 'Menyimpan...' : 'Simpan Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Movements Modal */}
      {showMovementsModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Histori Movement</h3>
                <p className="text-sm text-gray-500">{selectedProduct.product_name}</p>
              </div>
              <button
                onClick={() => setShowMovementsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {loadingMovements ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : movements.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Belum ada histori movement</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Tanggal</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Tipe</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Saldo</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Referensi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {movements.map((m) => (
                      <tr key={m.id}>
                        <td className="px-3 py-2 text-xs text-gray-600">
                          {new Date(m.created_at).toLocaleString('id-ID')}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`flex items-center gap-1 text-xs font-medium ${getMovementColor(m.movement_type)}`}>
                            {getMovementIcon(m.movement_type)}
                            {m.movement_type === 'in' && 'Masuk'}
                            {m.movement_type === 'out' && 'Keluar'}
                            {m.movement_type === 'adjustment' && 'Adjustment'}
                          </span>
                        </td>
                        <td className={`px-3 py-2 text-right text-xs font-medium ${getMovementColor(m.movement_type)}`}>
                          {m.movement_type === 'out' ? '-' : '+'}{m.quantity_carton} ktn
                        </td>
                        <td className="px-3 py-2 text-right text-xs text-gray-600">
                          {m.balance_carton} ktn
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600">
                          <p>{m.reference_number}</p>
                          {m.notes && <p className="text-gray-400">{m.notes}</p>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
