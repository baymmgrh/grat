import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  ArrowLeftIcon as ArrowLeft,
  ChartBarIcon,
  ClockIcon as History,
  CubeIcon,
  DocumentTextIcon,
  PencilIcon as Edit,
  CogIcon as Settings
} from '@heroicons/react/24/outline';
interface ProductNew {
  id: number;
  kode_produk: string;
  nama_produk: string;
  gramasi?: number;
  cd?: number;
  md?: number;
  sheet_per_pack?: number;
  pack_per_karton?: number;
  berat_kering?: number;
  ratio?: number;
  ingredient?: number;
  ukuran_batch_vol?: number;
  ukuran_batch_ctn?: number;
  spunlace?: string;
  rayon?: number;
  polyester?: number;
  es?: number;
  slitting_cm?: number;
  lebar_mr_net_cm?: number;
  lebar_mr_gross_cm?: number;
  keterangan_slitting?: string;
  no_mesin_epd?: string;
  speed_epd_pack_menit?: number;
  meter_kain?: number;
  kg_kain?: number;
  kebutuhan_rayon_kg?: number;
  kebutuhan_polyester_kg?: number;
  kebutuhan_es_kg?: number;
  process_produksi?: string;
  kode_jumbo_roll?: string;
  nama_jumbo_roll?: string;
  kode_main_roll?: string;
  nama_main_roll?: string;
  kapasitas_mixing_kg?: number;
  actual_mixing_kg?: number;
  dosing_kg?: number;
  is_active: boolean;
  version: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ProductVersion {
  id: number;
  version: number;
  change_reason: string;
  created_at: string;
  previous_data: ProductNew;
}

interface ProductDetailNewProps {
  productId: string;
  onEdit: (product: ProductNew) => void;
  onBack: () => void;
}

const ProductDetailNew: React.FC<ProductDetailNewProps> = ({ productId, onEdit, onBack }) => {
  const { t } = useLanguage();

  const [product, setProduct] = useState<ProductNew | null>(null);
  const [versions, setVersions] = useState<ProductVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'detail' | 'versions'>('detail');

  useEffect(() => {
    fetchProductDetail();
    fetchProductVersions();
  }, [productId]);

  const fetchProductDetail = async () => {
    try {
      const response = await fetch(`/api/products-excel/${productId}`);
      const data = await response.json();

      if (response.ok) {
        setProduct(data);
      } else {
        console.error('Error fetching product:', data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductVersions = async () => {
    try {
      const response = await fetch(`/api/products-new/${productId}/versions`);
      const data = await response.json();

      if (response.ok) {
        setVersions(data.versions);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formatNumber = (num: number | undefined) => {
    return num !== undefined && num !== null ? num.toLocaleString('id-ID') : '-';
  };

  const formatFloat = (num: number | undefined, decimals: number = 2) => {
    return num !== undefined && num !== null ? num.toLocaleString('id-ID', { minimumFractionDigits: decimals }) : '-';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Produk tidak ditemukan</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.nama_produk}</h1>
            <p className="text-gray-600">{product.kode_produk}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            product.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {product.is_active ? 'Aktif' : 'Tidak Aktif'}
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            Versi {product.version}
          </span>
          <button
            onClick={() => onEdit(product)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>{t('common.edit')}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('detail')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'detail'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CubeIcon className="w-4 h-4" />
              <span>Detail Produk</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'versions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4" />
              <span>Riwayat Versi ({versions.length})</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'detail' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CubeIcon className="w-5 h-5 mr-2" />
              Informasi Dasar
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Kode Produk</p>
                  <p className="text-sm text-gray-900">{product.kode_produk}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('common.status')}</p>
                  <p className="text-sm text-gray-900">
                    {product.is_active ? 'Aktif' : 'Tidak Aktif'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Nama Produk</p>
                <p className="text-sm text-gray-900">{product.nama_produk}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Catatan</p>
                <p className="text-sm text-gray-900">{product.notes || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Dibuat</p>
                  <p className="text-sm text-gray-900">{formatDate(product.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Diperbarui</p>
                  <p className="text-sm text-gray-900">{formatDate(product.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Spesifikasi Teknis
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Gramasi (GSM)</p>
                  <p className="text-sm text-gray-900">{formatNumber(product.gramasi)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Berat Kering (g)</p>
                  <p className="text-sm text-gray-900">{formatFloat(product.berat_kering)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">CD (mm)</p>
                  <p className="text-sm text-gray-900">{formatNumber(product.cd)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">MD (mm)</p>
                  <p className="text-sm text-gray-900">{formatNumber(product.md)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Slitting (cm)</p>
                  <p className="text-sm text-gray-900">{formatFloat(product.slitting_cm)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Keterangan Slitting</p>
                  <p className="text-sm text-gray-900">{product.keterangan_slitting || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Lebar MR Nett (cm)</p>
                  <p className="text-sm text-gray-900">{formatFloat(product.lebar_mr_net_cm)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Lebar MR Gross (cm)</p>
                  <p className="text-sm text-gray-900">{formatFloat(product.lebar_mr_gross_cm)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Packaging */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CubeIcon className="w-5 h-5 mr-2" />
              Kemasan & Batch
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Sheet per Pack</p>
                  <p className="text-sm text-gray-900">{formatNumber(product.sheet_per_pack)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Pack per Karton</p>
                  <p className="text-sm text-gray-900">{formatNumber(product.pack_per_karton)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Sheets per Karton</p>
                  <p className="text-sm text-gray-900">
                    {product.sheet_per_pack && product.pack_per_karton 
                      ? formatNumber(product.sheet_per_pack * product.pack_per_karton)
                      : '-'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Ratio (mm)</p>
                  <p className="text-sm text-gray-900">{formatFloat(product.ratio)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Ingredient (mm)</p>
                  <p className="text-sm text-gray-900">{formatFloat(product.ingredient)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Volume per Batch (L)</p>
                  <p className="text-sm text-gray-900">{formatFloat(product.ukuran_batch_vol)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Karton per Batch</p>
                <p className="text-sm text-gray-900">{formatFloat(product.ukuran_batch_ctn)}</p>
              </div>
            </div>
          </div>

          {/* Material Composition */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <ChartBarIcon className="w-5 h-5 mr-2" />
              Komposisi Material
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Jenis Spunlace</p>
                <p className="text-sm text-gray-900">{product.spunlace || '-'}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Rayon (%)</p>
                  <p className="text-sm text-gray-900">{formatNumber(product.rayon)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Polyester (%)</p>
                  <p className="text-sm text-gray-900">{formatNumber(product.polyester)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">ES (%)</p>
                  <p className="text-sm text-gray-900">{formatNumber(product.es)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Komposisi</p>
                <p className="text-sm text-gray-900">
                  {formatNumber((product.rayon || 0) + (product.polyester || 0) + (product.es || 0))}%
                </p>
              </div>
            </div>
          </div>

          {/* Production Process */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Proses Produksi
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Process Produksi</p>
                <p className="text-sm text-gray-900">{product.process_produksi || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">No. Mesin EPD</p>
                  <p className="text-sm text-gray-900">{product.no_mesin_epd || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Speed EPD (pack/menit)</p>
                  <p className="text-sm text-gray-900">{formatFloat(product.speed_epd_pack_menit)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Material Requirements */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <DocumentTextIcon className="w-5 h-5 mr-2" />
              Kebutuhan Material
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Meter Kain</p>
                  <p className="text-sm text-gray-900">{formatFloat(product.meter_kain)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">KG Kain</p>
                  <p className="text-sm text-gray-900">{formatFloat(product.kg_kain, 3)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Kebutuhan Rayon (kg)</p>
                  <p className="text-sm text-gray-900">{formatFloat(product.kebutuhan_rayon_kg, 3)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Kebutuhan Polyester (kg)</p>
                  <p className="text-sm text-gray-900">{formatFloat(product.kebutuhan_polyester_kg, 3)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Kebutuhan ES (kg)</p>
                  <p className="text-sm text-gray-900">{formatFloat(product.kebutuhan_es_kg, 3)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Roll Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CubeIcon className="w-5 h-5 mr-2" />
              Informasi Roll
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Kode Jumbo Roll</p>
                  <p className="text-sm text-gray-900">{product.kode_jumbo_roll || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Nama Jumbo Roll</p>
                  <p className="text-sm text-gray-900">{product.nama_jumbo_roll || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Kode Main Roll</p>
                  <p className="text-sm text-gray-900">{product.kode_main_roll || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Nama Main Roll</p>
                  <p className="text-sm text-gray-900">{product.nama_main_roll || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mixing Process */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Proses Mixing
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Kapasitas Mixing (kg)</p>
                  <p className="text-sm text-gray-900">{formatFloat(product.kapasitas_mixing_kg)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Actual Mixing (kg)</p>
                  <p className="text-sm text-gray-900">{formatFloat(product.actual_mixing_kg)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Dosing (kg)</p>
                  <p className="text-sm text-gray-900">{formatFloat(product.dosing_kg)}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'versions' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Riwayat Perubahan Versi</h3>
            {versions.length === 0 ? (
              <p className="text-gray-600">Belum ada riwayat perubahan versi</p>
            ) : (
              <div className="space-y-4">
                {versions.map((version) => (
                  <div key={version.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                          Versi {version.version}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatDate(version.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 mb-2">
                      <p className="font-medium">Alasan Perubahan:</p>
                      <p>{version.change_reason}</p>
                    </div>
                    {version.previous_data && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                          Lihat Data Sebelumnya
                        </summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(version.previous_data, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailNew;
