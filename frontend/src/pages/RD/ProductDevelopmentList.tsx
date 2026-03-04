import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import {
  RocketLaunchIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface ProductDevelopment {
  id: number;
  name: string;
  category: string;
  description: string;
  development_stage: string;
  target_market: string;
  estimated_launch_date: string;
  development_cost: number;
  target_price: number;
  project?: {
    id: number;
    project_code: string;
    title: string;
  };
  created_at: string;
}

const ProductDevelopmentList: React.FC = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<ProductDevelopment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;

  const stages = [
    { value: 'all', label: 'All Stages' },
    { value: 'concept', label: 'Concept' },
    { value: 'design', label: 'Design' },
    { value: 'prototype', label: 'Prototype' },
    { value: 'testing', label: 'Testing' },
    { value: 'production_ready', label: 'Production Ready' },
    { value: 'launched', label: 'Launched' }
  ];

  const stageColors: Record<string, string> = {
    concept: 'bg-gray-100 text-gray-800',
    design: 'bg-blue-100 text-blue-800',
    prototype: 'bg-purple-100 text-purple-800',
    testing: 'bg-yellow-100 text-yellow-800',
    production_ready: 'bg-green-100 text-green-800',
    launched: 'bg-emerald-100 text-emerald-800'
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, stageFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        per_page: itemsPerPage
      };
      if (stageFilter !== 'all') params.stage = stageFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await api.get('/api/rd/products', { params });
      const data = response.data;
      // Handle different response formats
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data && Array.isArray(data.products)) {
        setProducts(data.products);
      } else if (data && Array.isArray(data.data)) {
        setProducts(data.data);
      } else {
        setProducts([]);
      }
      setTotalPages(data?.pages || data?.total_pages || 1);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product development?')) return;
    
    try {
      await api.delete(`/api/rd/products/${id}`);
      toast.success('Product development deleted');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product development');
    }
  };

  const getStageProgress = (stage: string): number => {
    const progressMap: Record<string, number> = {
      concept: 10,
      design: 30,
      prototype: 50,
      testing: 70,
      production_ready: 90,
      launched: 100
    };
    return progressMap[stage] || 0;
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Product Development</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage R&D product development pipeline</p>
        </div>
        <Link
          to="/app/rd/products/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          New Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </form>
          
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={stageFilter}
              onChange={(e) => { setStageFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {stages.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchProducts()}
            className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <RocketLaunchIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No products found</h3>
          <p className="text-gray-500 mt-1">Start by creating a new product development</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{product.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{product.category?.replace('_', ' ')}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${stageColors[product.development_stage] || 'bg-gray-100 text-gray-800'}`}>
                    {product.development_stage?.replace('_', ' ')}
                  </span>
                </div>

                {product.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{getStageProgress(product.development_stage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${getStageProgress(product.development_stage)}%` }}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 text-sm">
                  {product.target_market && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Target Market:</span>
                      <span className="text-gray-900 dark:text-white truncate ml-2">{product.target_market}</span>
                    </div>
                  )}
                  {product.estimated_launch_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Launch Date:</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(product.estimated_launch_date).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  )}
                  {product.development_cost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dev Cost:</span>
                      <span className="text-gray-900 dark:text-white">
                        Rp {product.development_cost.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>

                {product.project && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-500">Project: </span>
                    <span className="text-xs text-blue-600">{product.project.project_code}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-2">
                <Link
                  to={`/app/rd/products/${product.id}`}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View"
                >
                  <EyeIcon className="w-4 h-4" />
                </Link>
                <Link
                  to={`/app/rd/products/${product.id}/edit`}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductDevelopmentList;
