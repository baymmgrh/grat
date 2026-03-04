import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  ChartBarIcon,
  CubeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import ProductListNew from '../components/ProductListNew';
import ProductFormNew from '../components/ProductFormNew';
import ProductDetailNew from '../components/ProductDetailNew';
import ProductDashboardNew from '../components/ProductDashboardNew';
import axiosInstance from '../utils/axiosConfig';
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

type ViewMode = 'dashboard' | 'list' | 'add' | 'edit' | 'detail';

const ProductsNewPage: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedProduct, setSelectedProduct] = useState<ProductNew | null>(null);

  // Handle URL params for direct navigation to detail view
  useEffect(() => {
    const view = searchParams.get('view');
    const code = searchParams.get('code');
    
    if (view === 'detail' && code) {
      // Fetch product by code and show detail view
      axiosInstance.get(`/api/products-new/kode/${code}`)
        .then(res => {
          setSelectedProduct(res.data.product);
          setViewMode('detail');
        })
        .catch(err => {
          console.error('Error loading product:', err);
          setViewMode('list');
        });
    }
  }, [searchParams]);

  const handleSaveProduct = async (productData: ProductNew) => {
    try {
      const url = productData.id 
        ? `/api/products-excel/${productData.kode_produk}`
        : '/api/products-excel';
      
      const method = productData.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        const data = await response.json();
        alert(productData.id ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditambahkan!');
        setViewMode('list');
        setSelectedProduct(null);
      } else {
        const error = await response.json();
        alert('Gagal menyimpan produk: ' + error.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan saat menyimpan produk');
    }
  };

  const handleEditProduct = (product: ProductNew) => {
    setSelectedProduct(product);
    setViewMode('edit');
  };

  const handleViewProduct = (product: ProductNew) => {
    setSelectedProduct(product);
    setViewMode('detail');
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setViewMode('add');
  };

  const handleCancel = () => {
    setSelectedProduct(null);
    setViewMode('dashboard');
  };

  const handleBackToList = () => {
    setSelectedProduct(null);
    setViewMode('list');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                viewMode === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ChartBarIcon className="w-4 h-4" />
              <span>{t('navigation.dashboard')}</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                viewMode === 'list'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CubeIcon className="w-4 h-4" />
              <span>Daftar Produk</span>
            </button>
            <button
              onClick={handleAddProduct}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                viewMode === 'add'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PlusIcon className="w-4 h-4" />
              <span>Tambah Produk</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'dashboard' && (
          <ProductDashboardNew />
        )}

        {viewMode === 'list' && (
          <ProductListNew
            onEdit={handleEditProduct}
            onView={handleViewProduct}
            onAdd={handleAddProduct}
          />
        )}

        {viewMode === 'add' && (
          <ProductFormNew
            onSave={handleSaveProduct}
            onCancel={handleCancel}
          />
        )}

        {viewMode === 'edit' && selectedProduct && (
          <ProductFormNew
            product={selectedProduct}
            onSave={handleSaveProduct}
            onCancel={handleCancel}
          />
        )}

        {viewMode === 'detail' && selectedProduct && (
          <ProductDetailNew
            productId={selectedProduct.kode_produk}
            onEdit={handleEditProduct}
            onBack={handleBackToList}
          />
        )}
      </div>
    </div>
  );
};

export default ProductsNewPage;
