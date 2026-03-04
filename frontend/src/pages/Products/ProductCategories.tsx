import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon
,
  PencilIcon,
  PlusIcon,
  TagIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import { formatRupiah } from '../../utils/currencyUtils';
import { useLanguage } from '../../contexts/LanguageContext';

interface ProductCategory {
  id: number;
  name: string;
  description: string;
  parent_id: number | null;
  parent_name?: string;
  product_count: number;
  total_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CategoryForm {
  name: string;
  description: string;
  parent_id: number | null;
  is_active: boolean;
}

const ProductCategories: React.FC = () => {
  const { t } = useLanguage();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({
    name: '',
    description: '',
    parent_id: null,
    is_active: true
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [categories, searchTerm, statusFilter]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/products/categories');
      setCategories(response.data?.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Set mock data for development
      setCategories([
        {
          id: 1,
          name: 'Nonwoven Fabrics',
          description: 'Various types of nonwoven fabric products',
          parent_id: null,
          product_count: 45,
          total_value: 850000000,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          name: 'Medical Grade',
          description: 'Medical grade nonwoven fabrics',
          parent_id: 1,
          parent_name: 'Nonwoven Fabrics',
          product_count: 18,
          total_value: 320000000,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 3,
          name: 'Industrial Grade',
          description: 'Industrial grade nonwoven fabrics',
          parent_id: 1,
          parent_name: 'Nonwoven Fabrics',
          product_count: 27,
          total_value: 530000000,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 4,
          name: 'Medical Products',
          description: 'Medical and healthcare products',
          parent_id: null,
          product_count: 32,
          total_value: 620000000,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 5,
          name: 'Face Masks',
          description: 'Various types of face masks',
          parent_id: 4,
          parent_name: 'Medical Products',
          product_count: 15,
          total_value: 280000000,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 6,
          name: 'FunnelIcon Media',
          description: 'Air and liquid filtration media',
          parent_id: null,
          product_count: 25,
          total_value: 380000000,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 7,
          name: 'Geotextiles',
          description: 'Geotextile and civil engineering fabrics',
          parent_id: null,
          product_count: 18,
          total_value: 290000000,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 8,
          name: 'Raw Materials',
          description: 'Raw materials and components',
          parent_id: null,
          product_count: 28,
          total_value: 450000000,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 9,
          name: 'Discontinued',
          description: 'Discontinued product category',
          parent_id: null,
          product_count: 5,
          total_value: 25000000,
          is_active: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T10:30:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = () => {
    let filtered = categories;

    // FunnelIcon by search term
    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // FunnelIcon by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(category =>
        statusFilter === 'active' ? category.is_active : !category.is_active
      );
    }

    setFilteredCategories(filtered);
  };

  const openModal = (category?: ProductCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description,
        parent_id: category.parent_id,
        is_active: category.is_active
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        description: '',
        parent_id: null,
        is_active: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      description: '',
      parent_id: null,
      is_active: true
    });
  };

  const saveCategory = async () => {
    try {
      const categoryData = {
        ...categoryForm,
        id: editingCategory?.id
      };

      if (editingCategory) {
        await axiosInstance.put(`/api/products/categories/${editingCategory.id}`, categoryData);
      } else {
        await axiosInstance.post('/api/products/categories', categoryData);
      }

      closeModal();
      await loadCategories();
      alert(`Category ${editingCategory ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('Failed to save category');
    }
  };

  const deleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      await axiosInstance.delete(`/api/products/categories/${categoryId}`);
      await loadCategories();
      alert('Category deleted successfully!');
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category. It may have associated products.');
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const getParentCategories = () => {
    return categories.filter(cat => cat.parent_id === null && cat.id !== editingCategory?.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            to="/app/products/dashboard"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Categories</h1>
            <p className="text-gray-600 mt-1">Organize and manage your product categories</p>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Category
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TagIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  {category.parent_name && (
                    <p className="text-sm text-gray-500">Under: {category.parent_name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  category.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{category.description}</p>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Products:</span>
                <span className="font-medium text-gray-900">{formatNumber(category.product_count)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Value:</span>
                <span className="font-medium text-gray-900">{formatRupiah(category.total_value)}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => openModal(category)}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                <PencilIcon className="h-4 w-4 mr-1" />{t('common.edit')}</button>
              <Link
                to={`/app/products?category=${category.id}`}
                className="flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                <EyeIcon className="h-4 w-4" />
              </Link>
              <button
                onClick={() => deleteCategory(category.id)}
                className="flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                disabled={category.product_count > 0}
                title={category.product_count > 0 ? 'Cannot delete category with products' : 'Delete category'}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Get started by creating your first product category'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={() => openModal()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Category
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category Name</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter category name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('common.description')}</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter category description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Parent Category</label>
                  <select
                    value={categoryForm.parent_id || ''}
                    onChange={(e) => setCategoryForm({...categoryForm, parent_id: e.target.value ? parseInt(e.target.value) : null})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No Parent (Top Level)</option>
                    {getParentCategories().map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={categoryForm.is_active}
                      onChange={(e) => setCategoryForm({...categoryForm, is_active: e.target.checked})}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Active Category</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >{t('common.cancel')}</button>
                <button
                  onClick={saveCategory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={!categoryForm.name.trim()}
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCategories;
