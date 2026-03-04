import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { notificationService } from '../../services/notificationService';
import {
  ArrowLeftIcon,
  CheckIcon,
  InformationCircleIcon,
  PhotoIcon,
  TagIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
interface CategoryFormData {
  name: string;
  description: string;
  parent_id: number | null;
  is_active: boolean;
  sort_order: number;
  image_url: string;
  attributes: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  parent_id: number | null;
  is_active: boolean;
  sort_order: number;
  image_url: string;
  attributes: string;
  created_at: string;
  updated_at: string;
}

export default function CategoryForm() {
    const { t } = useLanguage();

const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    parent_id: null,
    is_active: true,
    sort_order: 0,
    image_url: '',
    attributes: ''
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCategories();
    if (isEdit && id) {
      loadCategory(parseInt(id));
    }
  }, [id, isEdit]);

  const loadCategories = async () => {
    try {
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
          attributes: '',
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
          attributes: '',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];
      setCategories(mockCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      notificationService.error('Failed to load categories');
    }
  };

  const loadCategory = async (categoryId: number) => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockCategory: Category = {
        id: categoryId,
        name: 'Sample Category',
        description: 'Sample category description',
        parent_id: null,
        is_active: true,
        sort_order: 1,
        image_url: '',
        attributes: '',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };
      
      setFormData({
        name: mockCategory.name,
        description: mockCategory.description,
        parent_id: mockCategory.parent_id,
        is_active: mockCategory.is_active,
        sort_order: mockCategory.sort_order,
        image_url: mockCategory.image_url,
        attributes: mockCategory.attributes
      });
    } catch (error) {
      console.error('Error loading category:', error);
      notificationService.error('Failed to load category');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    if (formData.name.length > 100) {
      newErrors.name = 'Category name must be less than 100 characters';
    }

    if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (formData.sort_order < 0) {
      newErrors.sort_order = 'Sort order must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Mock API call - replace with actual implementation
      console.log('Submitting category:', formData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (isEdit) {
        notificationService.success('Category updated successfully');
      } else {
        notificationService.success('Category created successfully');
      }

      navigate('/app/products/categories');
    } catch (error) {
      console.error('Error saving category:', error);
      notificationService.error('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CategoryFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/app/products/categories')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEdit ? 'Edit Category' : 'Create New Category'}
              </h1>
              <p className="text-gray-600">
                {isEdit ? 'Update category information' : 'Add a new product category'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl">
          <div className="px-6 py-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Category Name */}
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  <TagIcon className="h-4 w-4 inline mr-1" />
                  Category Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`block w-full rounded-lg border ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  } px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                  placeholder="Enter category name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Parent Category */}
              <div>
                <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Category
                </label>
                <select
                  id="parent_id"
                  value={formData.parent_id || ''}
                  onChange={(e) => handleInputChange('parent_id', e.target.value ? parseInt(e.target.value) : null)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">No Parent (Top Level)</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label htmlFor="sort_order" className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  id="sort_order"
                  value={formData.sort_order}
                  onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
                  className={`block w-full rounded-lg border ${
                    errors.sort_order ? 'border-red-300' : 'border-gray-300'
                  } px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                  placeholder="0"
                  min="0"
                />
                {errors.sort_order && (
                  <p className="mt-1 text-sm text-red-600">{errors.sort_order}</p>
                )}
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  <InformationCircleIcon className="h-4 w-4 inline mr-1" />{t('common.description')}</label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`block w-full rounded-lg border ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  } px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                  placeholder="Enter category description"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Image URL */}
              <div className="sm:col-span-2">
                <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-2">
                  <PhotoIcon className="h-4 w-4 inline mr-1" />
                  Category Image URL
                </label>
                <input
                  type="url"
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => handleInputChange('image_url', e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Attributes */}
              <div className="sm:col-span-2">
                <label htmlFor="attributes" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Attributes (JSON)
                </label>
                <textarea
                  id="attributes"
                  rows={3}
                  value={formData.attributes}
                  onChange={(e) => handleInputChange('attributes', e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                  placeholder='{"color": "blue", "material": "cotton"}'
                />
                <p className="mt-1 text-sm text-gray-500">
                  Optional JSON object for additional category attributes
                </p>
              </div>

              {/* Active Status */}
              <div className="sm:col-span-2">
                <div className="flex items-center">
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    Active Category
                  </label>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Inactive categories will not be available for product assignment
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/app/products/categories')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <XMarkIcon className="h-4 w-4 inline mr-1" />{t('common.cancel')}</button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 inline mr-1 border-2 border-white border-t-transparent rounded-full"></div>
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 inline mr-1" />
                {isEdit ? 'Update Category' : 'Create Category'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
