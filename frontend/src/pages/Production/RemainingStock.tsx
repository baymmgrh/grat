import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import SearchableSelect from '../../components/SearchableSelect';
import { toast } from 'react-hot-toast';

interface RemainingStockItem {
  id: number;
  product_id: number | null;
  product_name: string;
  product_code: string | null;
  qty_karton: number;
  qty_pcs: number | null;
  pack_per_carton: number | null;
  notes: string | null;
  location: string | null;
  created_by_name: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface Product {
  id: number;
  kode_produk: string;
  nama_produk: string;
}

export default function RemainingStock() {
  const [stocks, setStocks] = useState<RemainingStockItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStock, setEditingStock] = useState<RemainingStockItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    product_code: '',
    qty_karton: '',
    notes: '',
    location: ''
  });

  useEffect(() => {
    fetchStocks();
    fetchProducts();
  }, []);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/production/remaining-stocks');
      setStocks(response.data.remaining_stocks || []);
    } catch (error) {
      console.error('Error fetching stocks:', error);
      toast.error('Gagal memuat data sisa order');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get('/api/products-excel?per_page=1000');
      console.log('Products response:', response.data);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleProductSelect = (productId: string) => {
    if (productId) {
      const product = products.find(p => p.id === parseInt(productId));
      if (product) {
        setFormData({
          ...formData,
          product_id: productId,
          product_name: product.nama_produk,
          product_code: product.kode_produk
        });
      }
    } else {
      setFormData({
        ...formData,
        product_id: '',
        product_name: '',
        product_code: ''
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_name.trim()) {
      toast.error('Nama produk harus diisi');
      return;
    }
    
    if (!formData.qty_karton || parseFloat(formData.qty_karton) <= 0) {
      toast.error('Qty karton harus lebih dari 0');
      return;
    }

    try {
      const payload = {
        product_id: formData.product_id ? parseInt(formData.product_id) : null,
        product_name: formData.product_name,
        product_code: formData.product_code || null,
        qty_karton: parseFloat(formData.qty_karton),
        notes: formData.notes || null,
        location: formData.location || null
      };

      if (editingStock) {
        await axiosInstance.put(`/api/production/remaining-stocks/${editingStock.id}`, payload);
        toast.success('Sisa order berhasil diupdate');
      } else {
        await axiosInstance.post('/api/production/remaining-stocks', payload);
        toast.success('Sisa order berhasil ditambahkan');
      }
      
      setShowModal(false);
      resetForm();
      fetchStocks();
    } catch (error: any) {
      console.error('Error saving stock:', error);
      toast.error(error.response?.data?.error || 'Gagal menyimpan data');
    }
  };

  const handleEdit = (stock: RemainingStockItem) => {
    setEditingStock(stock);
    setFormData({
      product_id: stock.product_id?.toString() || '',
      product_name: stock.product_name,
      product_code: stock.product_code || '',
      qty_karton: stock.qty_karton.toString(),
      notes: stock.notes || '',
      location: stock.location || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/api/production/remaining-stocks/${id}`);
      toast.success('Sisa order berhasil dihapus');
      fetchStocks();
    } catch (error) {
      console.error('Error deleting stock:', error);
      toast.error('Gagal menghapus data');
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const response = await axiosInstance.get('/api/production/remaining-stocks/export-excel', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Sisa_Order_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Export berhasil');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Gagal export data');
    } finally {
      setExporting(false);
    }
  };

  const resetForm = () => {
    setEditingStock(null);
    setFormData({
      product_id: '',
      product_name: '',
      product_code: '',
      qty_karton: '',
      notes: '',
      location: ''
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const filteredStocks = stocks.filter(stock => 
    stock.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (stock.product_code && stock.product_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalKarton = filteredStocks.reduce((sum, s) => sum + (s.qty_karton || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ArchiveBoxIcon className="h-7 w-7 text-orange-600" />
            Sisa Order
          </h1>
          <p className="text-gray-500 mt-1">Stok produk sisa produksi lama</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            disabled={exporting || stocks.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Tambah Sisa Order
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-orange-600">Total Item</p>
            <p className="text-2xl font-bold text-orange-800">{filteredStocks.length}</p>
          </div>
          <div>
            <p className="text-sm text-orange-600">Total Karton</p>
            <p className="text-2xl font-bold text-orange-800">{totalKarton.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cari nama produk atau kode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : filteredStocks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'Tidak ada data yang cocok' : 'Belum ada data sisa order'}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Produk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kode Produk
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty Karton
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lokasi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catatan
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStocks.map((stock, index) => (
                <tr key={stock.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{stock.product_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stock.product_code || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                    {stock.qty_karton.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stock.location || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {stock.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(stock)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(stock.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Hapus"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right text-sm font-bold text-gray-700">
                  TOTAL
                </td>
                <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                  {totalKarton.toLocaleString('id-ID')}
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">
              {editingStock ? 'Edit Sisa Order' : 'Tambah Sisa Order'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pilih dari Database (Opsional)
                </label>
                <SearchableSelect
                  options={products.map(product => ({
                    id: product.id,
                    code: product.kode_produk,
                    name: product.nama_produk
                  }))}
                  value={formData.product_id ? parseInt(formData.product_id) : null}
                  onChange={(val) => handleProductSelect(val ? String(val) : '')}
                  placeholder="Ketik untuk mencari produk atau input manual..."
                />
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan nama produk"
                  required
                />
              </div>

              {/* Product Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode Produk
                </label>
                <input
                  type="text"
                  value={formData.product_code}
                  onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan kode produk (opsional)"
                />
              </div>

              {/* Qty Karton */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qty Karton <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.qty_karton}
                  onChange={(e) => setFormData({ ...formData, qty_karton: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan jumlah karton"
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lokasi Penyimpanan
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Gudang A, Rak 1"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Catatan tambahan (opsional)"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingStock ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
