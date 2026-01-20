import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  XMarkIcon,
  ScaleIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';

interface PackingList {
  id: number;
  packing_number: string;
  product_id: number;
  product_name: string;
  product_code: string;
  customer_name: string | null;
  so_number: string | null;
  total_carton: number;
  total_pcs: number;
  start_carton_number: number;
  end_carton_number: number;
  status: string;
  packing_date: string | null;
  items_count: number;
  weighed_count: number;
  created_at: string;
}

interface WIPProduct {
  id: number;
  code: string;
  name: string;
  wip_carton: number;
  wip_pcs: number;
  pack_per_carton: number;
}

export default function PackingListNew() {
  const [packingLists, setPackingLists] = useState<PackingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [wipProducts, setWipProducts] = useState<WIPProduct[]>([]);
  const [creating, setCreating] = useState(false);

  // Form state for new packing list
  const [formData, setFormData] = useState({
    product_id: '',
    total_carton: '',
    customer_name: '',
    batch_mixing: '',
    notes: ''
  });

  useEffect(() => {
    fetchPackingLists();
  }, [page, search, statusFilter]);

  const fetchPackingLists = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter })
      });
      
      const response = await axiosInstance.get(`/api/packing-list?${params}`);
      setPackingLists(response.data.packing_lists);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching packing lists:', error);
      toast.error('Gagal memuat daftar packing list');
    } finally {
      setLoading(false);
    }
  };

  const fetchWIPProducts = async () => {
    try {
      const response = await axiosInstance.get('/api/packing-list/products-with-wip');
      setWipProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching WIP products:', error);
    }
  };

  const handleOpenCreate = () => {
    fetchWIPProducts();
    setFormData({
      product_id: '',
      total_carton: '',
      customer_name: '',
      batch_mixing: '',
      notes: ''
    });
    setShowCreateModal(true);
  };

  const handleCreatePackingList = async () => {
    if (!formData.product_id || !formData.total_carton) {
      toast.error('Pilih produk dan jumlah karton');
      return;
    }

    const selectedProduct = wipProducts.find(p => p.id === parseInt(formData.product_id));
    const totalCarton = parseInt(formData.total_carton);
    
    if (selectedProduct && totalCarton > selectedProduct.wip_carton) {
      toast.error(`Stok WIP tidak cukup. Tersedia: ${selectedProduct.wip_carton} karton`);
      return;
    }

    try {
      setCreating(true);
      await axiosInstance.post('/api/packing-list', {
        product_id: parseInt(formData.product_id),
        total_carton: totalCarton,
        customer_name: formData.customer_name || null,
        batch_mixing: formData.batch_mixing || null,
        notes: formData.notes || null
      });
      
      toast.success('Packing list berhasil dibuat');
      setShowCreateModal(false);
      fetchPackingLists();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal membuat packing list');
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    const labels: Record<string, string> = {
      draft: 'Draft',
      in_progress: 'Dalam Proses',
      completed: 'Selesai',
      cancelled: 'Dibatalkan'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  const selectedProduct = wipProducts.find(p => p.id === parseInt(formData.product_id));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📦 Packing List</h1>
          <p className="text-sm text-gray-500">Kelola packing dari stok WIP</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/app/production/wip-stock"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <ArchiveBoxIcon className="h-5 w-5" />
            Lihat WIP Stock
          </Link>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Buat Packing List
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nomor packing, produk, customer..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="in_progress">Dalam Proses</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : packingLists.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <ArchiveBoxIcon className="h-16 w-16 mb-4 text-gray-300" />
            <p>Belum ada packing list</p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Buat Packing List Pertama
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Packing</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Karton</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">No. Karton</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {packingLists.map((pl) => (
                <tr key={pl.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-medium text-blue-600">{pl.packing_number}</span>
                    {pl.packing_date && (
                      <p className="text-xs text-gray-500">{new Date(pl.packing_date).toLocaleDateString('id-ID')}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{pl.product_name}</p>
                    <p className="text-xs text-gray-500">{pl.product_code}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {pl.customer_name || '-'}
                    {pl.so_number && <span className="text-xs text-blue-500 ml-2">({pl.so_number})</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className="font-bold text-gray-900">{pl.total_carton}</span>
                    <p className="text-xs text-gray-500">{pl.total_pcs.toLocaleString()} pcs</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-600">
                    {pl.start_carton_number} - {pl.end_carton_number}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <ScaleIcon className="h-4 w-4 text-gray-400" />
                      <span className={pl.weighed_count === pl.total_carton ? 'text-green-600 font-medium' : 'text-gray-600'}>
                        {pl.weighed_count}/{pl.total_carton}
                      </span>
                    </div>
                    <div className="w-20 h-1.5 bg-gray-200 rounded-full mt-1 mx-auto">
                      <div 
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(pl.weighed_count / pl.total_carton) * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {getStatusBadge(pl.status)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <Link
                      to={`/app/production/packing-list/${pl.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                    >
                      <EyeIcon className="h-4 w-4" />
                      Detail
                    </Link>
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Buat Packing List Baru</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pilih Produk dari WIP *
                </label>
                <select
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Produk --</option>
                  {wipProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) - WIP: {p.wip_carton} karton
                    </option>
                  ))}
                </select>
                {wipProducts.length === 0 && (
                  <p className="text-sm text-orange-600 mt-1">
                    Tidak ada produk dengan stok WIP. Selesaikan Work Order terlebih dahulu.
                  </p>
                )}
              </div>

              {/* WIP Info */}
              {selectedProduct && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-purple-800">Stok WIP Tersedia:</p>
                  <p className="text-lg font-bold text-purple-900">
                    {selectedProduct.wip_carton} karton ({selectedProduct.wip_pcs.toLocaleString()} pcs)
                  </p>
                  <p className="text-xs text-purple-600">
                    Pack per karton: {selectedProduct.pack_per_carton}
                  </p>
                </div>
              )}

              {/* Total Carton */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Karton *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct?.wip_carton || 999999}
                  value={formData.total_carton}
                  onChange={(e) => setFormData({ ...formData, total_carton: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan jumlah karton"
                />
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Customer (opsional)
                </label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nama customer"
                />
              </div>

              {/* Batch Mixing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Mixing (opsional)
                </label>
                <input
                  type="text"
                  value={formData.batch_mixing}
                  onChange={(e) => setFormData({ ...formData, batch_mixing: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: BATCH-001"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan (opsional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Catatan tambahan"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                onClick={handleCreatePackingList}
                disabled={creating || !formData.product_id || !formData.total_carton}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Membuat...' : 'Buat Packing List'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
