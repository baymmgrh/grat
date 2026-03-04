import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosInstance from '../../utils/axiosConfig';
import {
  ArrowLeftIcon,
  BookmarkIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
interface MaterialFormData {
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
}

const MaterialCreate: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<MaterialFormData>({
    code: '',
    name: '',
    description: '',
    material_type: 'raw_materials',
    category: '',
    primary_uom: 'KG',
    secondary_uom: '',
    cost_per_unit: 0,
    min_stock_level: 0,
    max_stock_level: 0,
    reorder_point: 0,
    lead_time_days: 0,
    is_active: true,
    is_hazardous: false,
    storage_conditions: '',
    expiry_days: 0,
    supplier_id: 0
  });

  const materialTypes = [
    { value: 'raw_materials', label: 'Raw Materials' },
    { value: 'chemical_materials', label: 'Chemical Materials' },
    { value: 'packaging_materials', label: 'Packaging Materials' }
  ];

  // Material categories grouped by type
  const materialCategories: { [key: string]: { value: string; label: string; group: string }[] } = {
    raw_materials: [
      { value: 'main_roll', label: 'Main Roll (MR)', group: 'Kain' },
      { value: 'jumbo_roll', label: 'Jumbo Roll (JR)', group: 'Kain' },
      { value: 'spunbond', label: 'Spunbond', group: 'Kain' },
      { value: 'meltblown', label: 'Melt Blown', group: 'Kain' },
      { value: 'kain', label: 'Kain Lainnya', group: 'Kain' },
      { value: 'nonwoven', label: 'Nonwoven', group: 'Kain' },
      { value: 'tissue', label: 'Tissue', group: 'Raw Material' },
      { value: 'other_raw', label: 'Lainnya', group: 'Raw Material' }
    ],
    packaging_materials: [
      { value: 'packaging', label: 'Packaging', group: 'Packaging' },
      { value: 'carton_box', label: 'Carton Box', group: 'Packaging' },
      { value: 'inner_box', label: 'Inner Box', group: 'Packaging' },
      { value: 'jerigen', label: 'Jerigen', group: 'Packaging' },
      { value: 'botol', label: 'Botol', group: 'Packaging' },
      { value: 'stc', label: 'STC', group: 'Aksesoris' },
      { value: 'fliptop', label: 'Fliptop', group: 'Aksesoris' },
      { value: 'plastik', label: 'Plastik', group: 'Aksesoris' }
    ],
    chemical_materials: [
      { value: 'parfum', label: 'Parfum', group: 'Chemical' },
      { value: 'chemical', label: 'Chemical', group: 'Chemical' }
    ]
  };

  const uomOptions = [
    'KG', 'GRAM', 'TON', 'LITER', 'ML', 'METER', 'CM', 'MM', 'PIECE', 'ROLL', 'SHEET'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked 
             : type === 'number' ? parseFloat(value) || 0 
             : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.code || !formData.name || !formData.material_type || !formData.category || !formData.primary_uom) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await axiosInstance.post('/api/materials/', formData);
      alert('Material created successfully');
      navigate(`/app/warehouse/materials/${response.data.material_id}`);
    } catch (err) {
      console.error('Error creating material:', err);
      alert(err instanceof Error ? err.message : 'Failed to create material');
    } finally {
      setSaving(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Create New Material</h1>
            <p className="text-gray-600">Add a new material to your inventory</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => navigate('/app/warehouse/materials/list')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <XMarkIcon className="h-4 w-4" />
            <span>{t('common.cancel')}</span>
          </button>
        </div>
      </div>

      {/* Create Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="e.g., MAT001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="e.g., Polyester Fiber"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material Type *
                  </label>
                  <select
                    name="material_type"
                    value={formData.material_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {materialTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Pilih Kategori...</option>
                    {materialCategories[formData.material_type]?.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        [{cat.group}] {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.description')}</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Material description..."
                  />
                </div>
              </div>
            </div>

            {/* Units and Pricing */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Units & Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary UOM *
                  </label>
                  <select
                    name="primary_uom"
                    value={formData.primary_uom}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {uomOptions.map(uom => (
                      <option key={uom} value={uom}>
                        {uom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secondary UOM
                  </label>
                  <select
                    name="secondary_uom"
                    value={formData.secondary_uom}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select UOM</option>
                    {uomOptions.map(uom => (
                      <option key={uom} value={uom}>
                        {uom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost per Unit (Rp) *
                  </label>
                  <input
                    type="number"
                    name="cost_per_unit"
                    value={formData.cost_per_unit}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter cost per unit"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This cost will be used in BOM calculations
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lead Time (days)
                  </label>
                  <input
                    type="number"
                    name="lead_time_days"
                    value={formData.lead_time_days}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Stock Levels */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Stock Level
                  </label>
                  <input
                    type="number"
                    name="min_stock_level"
                    value={formData.min_stock_level}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Stock Level
                  </label>
                  <input
                    type="number"
                    name="max_stock_level"
                    value={formData.max_stock_level}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reorder Point
                  </label>
                  <input
                    type="number"
                    name="reorder_point"
                    value={formData.reorder_point}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('common.status')}</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Active Material
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_hazardous"
                    checked={formData.is_hazardous}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Hazardous Material
                  </label>
                </div>
              </div>
            </div>

            {/* Storage Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Storage Conditions
                  </label>
                  <textarea
                    name="storage_conditions"
                    value={formData.storage_conditions}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Store in cool, dry place"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shelf Life (days)
                  </label>
                  <input
                    type="number"
                    name="expiry_days"
                    value={formData.expiry_days || ''}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 365"
                  />
                </div>
              </div>
            </div>

            {/* Create Button */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
              >
                <BookmarkIcon className="h-4 w-4" />
                <span>{saving ? 'Creating...' : 'Create Material'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MaterialCreate;
