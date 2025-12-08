import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ClockIcon as History,
  EyeIcon as Eye,
  FunnelIcon,
  ListBulletIcon as List,
  MagnifyingGlassIcon as Search,
  PencilIcon as Edit,
  PlusIcon as Plus,
  Square3Stack3DIcon as Grid,
  TrashIcon as Trash2
} from '@heroicons/react/24/outline';
interface ProductNew {
  id: number;
  kode_produk: string;
  nama_produk: string;
  gramasi?: string;  // Changed to string for MANUAL values
  cd?: string;
  md?: string;
  sheet_per_pack?: string;
  pack_per_karton?: string;
  berat_kering?: string;
  ratio?: string;
  ingredient?: string;
  ukuran_batch_vol?: string;
  ukuran_batch_ctn?: string;
  spunlace?: string;
  rayon?: string;
  polyester?: string;
  es?: string;
  slitting_cm?: string;
  lebar_mr_net_cm?: string;
  lebar_mr_gross_cm?: string;
  keterangan_slitting?: string;
  no_mesin_epd?: string;
  speed_epd_pack_menit?: string;
  meter_kain?: string;
  kg_kain?: string;
  kebutuhan_rayon_kg?: string;
  kebutuhan_polyester_kg?: string;
  kebutuhan_es_kg?: string;
  process_produksi?: string;
  kode_jumbo_roll?: string;
  nama_jumbo_roll?: string;
  kode_main_roll?: string;
  nama_main_roll?: string;
  kapasitas_mixing_kg?: string;
  actual_mixing_kg?: string;
  dosing_kg?: string;
  is_active: boolean;
  version: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ProductListNewProps {
  onEdit: (product: ProductNew) => void;
  onView: (product: ProductNew) => void;
  onAdd: () => void;
  onViewVersions?: (product: ProductNew) => void;
}

const ProductListNew: React.FC<ProductListNewProps> = ({ onEdit, onView, onAdd, onViewVersions }) => {
  const { t } = useLanguage();

  const [products, setProducts] = useState<ProductNew[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');
  const [filters, setFilters] = useState({
    spunlace: '',
    process: '',
    gsm_min: '',
    gsm_max: '',
    is_active: 'all'
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20',
        search: searchTerm,
        ...filters
      });

      const response = await fetch(`/api/products-excel?${params}`);
      const data = await response.json();

      if (response.ok) {
        setProducts(data.products);
        setTotalPages(data.pagination.pages);
        setTotalProducts(data.pagination.total);
      } else {
        console.error('Error fetching products:', data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleDelete = async (product: ProductNew) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk ${product.nama_produk}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/products-excel/${product.kode_produk}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchProducts();
      } else {
        const error = await response.json();
        alert('Gagal menghapus produk: ' + error.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan saat menghapus produk');
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/products-new/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/products-new/import/excel', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert('Import berhasil!');
        fetchProducts();
      } else {
        const error = await response.json();
        alert('Import gagal: ' + error.error);
      }
    } catch (error) {
      console.error('Error importing:', error);
      alert('Terjadi kesalahan saat import');
    }

    // Reset file input
    event.target.value = '';
  };

  const formatNumber = (num: string | number | undefined) => {
    if (num === undefined || num === null || num === '') return '-';
    if (num === 'MANUAL') return 'MANUAL';
    // Try to parse as number
    const parsed = typeof num === 'string' ? parseFloat(num) : num;
    return isNaN(parsed) ? num : parsed.toLocaleString('id-ID');
  };

  const formatFloat = (num: string | number | undefined, decimals: number = 2) => {
    if (num === undefined || num === null || num === '') return '-';
    if (num === 'MANUAL') return 'MANUAL';
    // Try to parse as number
    const parsed = typeof num === 'string' ? parseFloat(num) : num;
    return isNaN(parsed) ? num : parsed.toLocaleString('id-ID', { minimumFractionDigits: decimals });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master Produk</h1>
          <p className="text-gray-600">Manajemen data produk - {totalProducts} produk</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>{t('common.export')}</span>
          </button>
          <label className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2 cursor-pointer">
            <ArrowUpTrayIcon className="w-4 h-4" />
            <span>{t('common.import')}</span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
          <div className="flex bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode('compact')}
              className={`px-3 py-1 rounded text-sm flex items-center space-x-1 ${
                viewMode === 'compact' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="View Ringkas"
            >
              <List className="w-4 h-4" />
              <span>Ringkas</span>
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1 rounded text-sm flex items-center space-x-1 ${
                viewMode === 'detailed' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="View Lengkap (Excel)"
            >
              <Grid className="w-4 h-4" />
              <span>Lengkap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cari kode produk, nama produk, spunlace, atau process..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2"
            >
              <FunnelIcon className="w-4 h-4" />
              <span>{t('common.filter')}</span>
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spunlace</label>
                <select
                  value={filters.spunlace}
                  onChange={(e) => handleFilterChange('spunlace', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua</option>
                  <option value="FN 40-25 D">FN 40-25 D</option>
                  <option value="FN 45-76 H">FN 45-76 H</option>
                  <option value="SFBR 50-60">SFBR 50-60</option>
                  <option value="FN 70-6H">FN 70-6H</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Process</label>
                <select
                  value={filters.process}
                  onChange={(e) => handleFilterChange('process', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua</option>
                  <option value="SPUNLACE-SLITTING-EPD-PACKING">SPUNLACE-SLITTING-EPD-PACKING</option>
                  <option value="SPUNLACE-SLITTING-CUTTING-PACKING">SPUNLACE-SLITTING-CUTTING-PACKING</option>
                  <option value="SPUNLACE-CUTTING-PACKING">SPUNLACE-CUTTING-PACKING</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSM Min</label>
                <input
                  type="number"
                  value={filters.gsm_min}
                  onChange={(e) => handleFilterChange('gsm_min', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Min GSM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSM Max</label>
                <input
                  type="number"
                  value={filters.gsm_max}
                  onChange={(e) => handleFilterChange('gsm_max', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Max GSM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.status')}</label>
                <select
                  value={filters.is_active}
                  onChange={(e) => handleFilterChange('is_active', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua</option>
                  <option value="true">Aktif</option>
                  <option value="false">Tidak Aktif</option>
                </select>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data produk...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">Tidak ada data produk yang ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {viewMode === 'compact' ? (
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kode
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Produk
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Spesifikasi
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Packaging
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Material
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Process
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Produk
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GSM
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CD (cm)
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MD (cm)
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sheet/Pack
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pack/Karton
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Berat Kering (kg)
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch Vol
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch Ctn
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lebar Net
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lebar Gross
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ket Slitting
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No Mesin
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meter Kain
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      KG Kain
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rayon KG
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Polyester KG
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ES KG
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kode Jumbo
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Jumbo
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kode Main
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Main
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                  </tr>
                )}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    {viewMode === 'compact' ? (
                      <>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.kode_produk}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="font-medium">{product.nama_produk}</div>
                          <div className="text-xs text-gray-500 mt-1">{product.spunlace || '-'}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="text-xs space-y-0.5">
                            <div><span className="font-medium">GSM:</span> {formatNumber(product.gramasi)}</div>
                            <div><span className="font-medium">CD:</span> {formatFloat(product.cd, 1)} cm · <span className="font-medium">MD:</span> {formatFloat(product.md, 1)} cm</div>
                            <div><span className="font-medium">Berat:</span> {formatFloat(product.berat_kering)} kg</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="text-xs space-y-0.5">
                            <div>{formatNumber(product.sheet_per_pack)} sheet/pack</div>
                            <div>{formatNumber(product.pack_per_karton)} pack/karton</div>
                            <div className="text-gray-500">Total: {formatNumber((product.sheet_per_pack || 0) * (product.pack_per_karton || 0))}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="text-xs space-y-0.5">
                            <div><span className="font-medium">Rayon:</span> {formatNumber(product.rayon)}</div>
                            <div><span className="font-medium">Poly:</span> {formatNumber(product.polyester)}</div>
                            {product.es && product.es !== '0' && <div><span className="font-medium">ES:</span> {product.es}</div>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="text-xs space-y-0.5">
                            <div className="truncate max-w-[150px]" title={product.process_produksi}>
                              {product.process_produksi || '-'}
                            </div>
                            <div className="text-gray-500">Mesin: {product.no_mesin_epd || '-'}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                            product.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">v{product.version}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => onView(product)}
                              className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onEdit(product)}
                              className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                              title={t('common.edit')}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {onViewVersions && (
                              <button
                                onClick={() => onViewVersions(product)}
                                className="p-1 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded"
                                title="Lihat Versi"
                              >
                                <History className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(product)}
                              className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.kode_produk}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          <div className="max-w-xs truncate" title={product.nama_produk}>
                            {product.nama_produk}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatNumber(product.gramasi)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatFloat(product.cd, 1)} cm</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatFloat(product.md, 1)} cm</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatNumber(product.sheet_per_pack)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatNumber(product.pack_per_karton)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatFloat(product.berat_kering)} kg</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatFloat(product.ratio)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatFloat(product.ingredient)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatFloat(product.ukuran_batch_vol)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatFloat(product.ukuran_batch_ctn)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{product.spunlace || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatNumber(product.rayon)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatNumber(product.polyester)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{product.es || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatNumber(product.slitting_cm)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatNumber(product.lebar_mr_net_cm)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatNumber(product.lebar_mr_gross_cm)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{product.keterangan_slitting || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{product.no_mesin_epd || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatNumber(product.speed_epd_pack_menit)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatFloat(product.meter_kain)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatFloat(product.kg_kain)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatFloat(product.kebutuhan_rayon_kg)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatFloat(product.kebutuhan_polyester_kg)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatFloat(product.kebutuhan_es_kg)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{product.process_produksi || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{product.kode_jumbo_roll || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{product.nama_jumbo_roll || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{product.kode_main_roll || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{product.nama_main_roll || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatFloat(product.kapasitas_mixing_kg)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatFloat(product.actual_mixing_kg)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatFloat(product.dosing_kg)}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.is_active ? 'Aktif' : 'Tidak Aktif'}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          v{product.version}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => onView(product)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Lihat Detail"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onEdit(product)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title={t('common.edit')}
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            {onViewVersions && (
                              <button
                                onClick={() => onViewVersions(product)}
                                className="text-purple-600 hover:text-purple-900"
                                title="Lihat Versi"
                              >
                                <History className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(product)}
                              className="text-red-600 hover:text-red-900"
                              title="Hapus"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && products.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Menampilkan <span className="font-medium">{(currentPage - 1) * 20 + 1}</span> hingga{' '}
                  <span className="font-medium">{Math.min(currentPage * 20, totalProducts)}</span> dari{' '}
                  <span className="font-medium">{totalProducts}</span> hasil
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                  </button>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductListNew;
