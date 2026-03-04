import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import {
  CheckCircleIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  TagIcon
,
  TrashIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
interface Category {
  id: number;
  name: string;
  description: string;
  parent_id: number | null;
  parent_name?: string;
  is_active: boolean;
  sort_order: number;
  image_url: string;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export default function CategoryList() {
    const { t } = useLanguage();

const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [parentFilter, setParentFilter] = useState<'all' | 'parent' | 'child'>('all');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - replace with actual API call
      const mockCategories: Category[] = [
        {
          id: 1,
          name: 'Raw Materials',
          description: 'Basic raw materials for production',
          parent_id: null,
          is_active: true,
          sort_order: 1,
          image_url: '',
          product_count: 25,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Finished Goods',
          description: 'Completed products ready for sale',
          parent_id: null,
          is_active: true,
          sort_order: 2,
          image_url: '',
          product_count: 18,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 3,
          name: 'Nonwoven Fabrics',
          description: 'Various types of nonwoven fabric materials',
          parent_id: 1,
          parent_name: 'Raw Materials',
          is_active: true,
          sort_order: 1,
          image_url: '',
          product_count: 12,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 4,
          name: 'Adhesives',
          description: 'Bonding materials and adhesives',
          parent_id: 1,
          parent_name: 'Raw Materials',
          is_active: true,
          sort_order: 2,
          image_url: '',
          product_count: 8,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 5,
          name: 'Packaging Materials',
          description: 'Materials for product packaging',
          parent_id: null,
          is_active: false,
          sort_order: 3,
          image_url: '',
          product_count: 5,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      setCategories(mockCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      notificationService.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      return;
    }

    try {
      // Mock API call - replace with actual implementation
      console.log('Deleting category:', id);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setCategories(prev => prev.filter(cat => cat.id !== id));
      notificationService.success(`Category "${name}" deleted successfully`);
    } catch (error) {
      console.error('Error deleting category:', error);
      notificationService.error('Failed to delete category');
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      // Mock API call - replace with actual implementation
      console.log('Toggling category status:', id, !currentStatus);
      
      setCategories(prev => prev.map(cat => 
        cat.id === id ? { ...cat, is_active: !currentStatus } : cat
      ));
      
      notificationService.success(`Category ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating category status:', error);
      notificationService.error('Failed to update category status');
    }
  };

  // FunnelIcon categories based on search and filters
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && category.is_active) ||
                         (statusFilter === 'inactive' && !category.is_active);
    
    const matchesParent = parentFilter === 'all' ||
                         (parentFilter === 'parent' && !category.parent_id) ||
                         (parentFilter === 'child' && category.parent_id);
    
    return matchesSearch && matchesStatus && matchesParent;
  });

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircleIcon className="h-3 w-3 mr-1" />
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircleIcon className="h-3 w-3 mr-1" />
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Categories</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your product categories and hierarchy
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => navigate('/app/products/categories/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Category
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {/* Search */}
            <div className="sm:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status FunnelIcon */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Parent FunnelIcon */}
            <div>
              <select
                value={parentFilter}
                onChange={(e) => setParentFilter(e.target.value as any)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="parent">Parent Categories</option>
                <option value="child">Child Categories</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('products.bom.category')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('navigation.products')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sort Order
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCategories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <TagIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {category.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {category.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {category.parent_name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {category.product_count} products
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(category.is_active)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {category.sort_order}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => navigate(`/app/products/categories/${category.id}`)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="View Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/app/products/categories/${category.id}/edit`)}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                      title="Edit Category"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleStatus(category.id, category.is_active)}
                      className={`p-1 ${category.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      title={category.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {category.is_active ? (
                        <XCircleIcon className="h-4 w-4" />
                      ) : (
                        <CheckCircleIcon className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(category.id, category.name)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete Category"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || parentFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating a new category'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && parentFilter === 'all' && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/app/products/categories/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Category
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredCategories.length > 0 && (
        <div className="mt-6 text-sm text-gray-500">
          Showing {filteredCategories.length} of {categories.length} categories
        </div>
      )}
    </div>
  );
}
