import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosInstance from '../../utils/axiosConfig';
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CubeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
interface Material {
  id: number;
  code: string;
  name: string;
  description: string;
  material_type: string;
  category: string;
  primary_uom: string;
  secondary_uom: string;
  cost_per_unit: number;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point: number;
  lead_time_days: number;
  is_active: boolean;
  is_hazardous: boolean;
  storage_conditions: string;
  expiry_days: number;
  supplier_id: number;
  supplier: string;
  created_at: string;
  updated_at: string;
}

const MaterialView: React.FC = () => {
  const { t } = useLanguage();

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterial = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/materials/${id}`);
      setMaterial(response.data.material);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching material:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchMaterial();
    }
  }, [id]);

  const handleEdit = () => {
    navigate(`/app/warehouse/materials/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!material) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete material "${material.name}"?\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      await axiosInstance.delete(`/api/materials/${id}/force-delete`);
      alert('Material deleted successfully');
      navigate('/app/warehouse/materials/list');
    } catch (err) {
      console.error('Error deleting material:', err);
      alert('Failed to delete material');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'raw_materials':
        return 'bg-blue-100 text-blue-800';
      case 'chemical_materials':
        return 'bg-yellow-100 text-yellow-800';
      case 'packaging_materials':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'raw_materials':
        return 'Raw Materials';
      case 'chemical_materials':
        return 'Chemical Materials';
      case 'packaging_materials':
        return 'Packaging Materials';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error || 'Material not found'}</p>
        <button
          onClick={() => navigate('/app/warehouse/materials/list')}
          className="mt-2 text-blue-600 hover:text-blue-800"
        >
          ← Back to Materials List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/app/warehouse/materials/list')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back to Materials
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{material.name}</h1>
            <p className="text-gray-600">Material Code: {material.code}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <PencilIcon className="h-4 w-4" />
            <span>{t('common.edit')}</span>
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <TrashIcon className="h-4 w-4" />
            <span>{t('common.delete')}</span>
          </button>
        </div>
      </div>

      {/* Material Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Material Code</label>
                <p className="mt-1 text-sm text-gray-900">{material.code}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Material Name</label>
                <p className="mt-1 text-sm text-gray-900">{material.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Type</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(material.material_type)}`}>
                  {getTypeLabel(material.material_type)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">{t('products.bom.category')}</label>
                <p className="mt-1 text-sm text-gray-900">{material.category}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500">{t('common.description')}</label>
                <p className="mt-1 text-sm text-gray-900">{material.description || 'No description'}</p>
              </div>
            </div>
          </div>

          {/* Units and Pricing */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Units & Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Primary UOM</label>
                <p className="mt-1 text-sm text-gray-900">{material.primary_uom}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Secondary UOM</label>
                <p className="mt-1 text-sm text-gray-900">{material.secondary_uom || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Cost per Unit</label>
                <p className="mt-1 text-sm text-gray-900">Rp {material.cost_per_unit.toLocaleString('id-ID')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Lead Time</label>
                <p className="mt-1 text-sm text-gray-900">{material.lead_time_days} days</p>
              </div>
            </div>
          </div>

          {/* Stock Levels */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Minimum Stock</label>
                <p className="mt-1 text-sm text-gray-900">{material.min_stock_level} {material.primary_uom}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Maximum Stock</label>
                <p className="mt-1 text-sm text-gray-900">{material.max_stock_level} {material.primary_uom}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Reorder Point</label>
                <p className="mt-1 text-sm text-gray-900">{material.reorder_point} {material.primary_uom}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('common.status')}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Active Status</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  material.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {material.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Hazardous</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  material.is_hazardous ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {material.is_hazardous ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Supplier */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 mr-2" />
            </h3>
            <p className="text-sm text-gray-900">{material.supplier || 'No supplier assigned'}</p>
          </div>

          {/* Storage Information */}
          {(material.storage_conditions || material.expiry_days) && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CubeIcon className="h-5 w-5 mr-2" />
              </h3>
              <div className="space-y-3">
                {material.storage_conditions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Storage Conditions</label>
                    <p className="mt-1 text-sm text-gray-900">{material.storage_conditions}</p>
                  </div>
                )}
                {material.expiry_days && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Shelf Life</label>
                    <p className="mt-1 text-sm text-gray-900">{material.expiry_days} days</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500">Created</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(material.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
              {material.updated_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(material.updated_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialView;
