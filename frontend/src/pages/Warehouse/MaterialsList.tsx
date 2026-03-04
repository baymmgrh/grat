import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosInstance from '../../utils/axiosConfig';
import {
  ArrowDownTrayIcon,
  CubeIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
interface Material {
  id: number;
  code: string;
  name: string;
  material_type: string;
  category: string;
  description: string;
  unit_of_measure: string;
  cost_per_unit: number;
  supplier: string;
  is_active: boolean;
  created_at: string;
}

interface MaterialsResponse {
  materials: Material[];
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    total: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

const MaterialsList: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const materialTypes = [
    { value: '', label: 'All Types' },
    { value: 'raw_materials', label: 'Raw Materials' },
    { value: 'chemical_materials', label: 'Chemical Materials' },
    { value: 'packaging_materials', label: 'Packaging Materials' }
  ];

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20',
        search: searchTerm,
        ...(selectedType && { type: selectedType })
      });

      const response = await axiosInstance.get(`/api/materials?${params}`);
      setMaterials(response.data.materials);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [currentPage, selectedType]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMaterials();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleDelete = async (materialId: number, materialName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete material "${materialName}"?\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      const response = await axiosInstance.delete(`/api/materials/${materialId}/force-delete`);
      alert('Material deleted successfully');
      fetchMaterials();
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

  // Category group mapping
  const getCategoryGroup = (category: string): string => {
    const kainCategories = ['main_roll', 'jumbo_roll', 'spunbond', 'meltblown', 'kain', 'nonwoven'];
    const packagingCategories = ['packaging', 'carton_box', 'inner_box', 'jerigen', 'botol'];
    const aksesorisCategories = ['stc', 'fliptop', 'plastik'];
    const chemicalCategories = ['parfum', 'chemical'];
    
    const catLower = (category || '').toLowerCase();
    if (kainCategories.includes(catLower)) return 'Kain';
    if (packagingCategories.includes(catLower)) return 'Packaging';
    if (aksesorisCategories.includes(catLower)) return 'Aksesoris';
    if (chemicalCategories.includes(catLower)) return 'Chemical';
    return 'Lainnya';
  };

  const getCategoryColor = (category: string) => {
    const group = getCategoryGroup(category);
    switch (group) {
      case 'Kain':
        return 'bg-blue-100 text-blue-800';
      case 'Packaging':
        return 'bg-green-100 text-green-800';
      case 'Aksesoris':
        return 'bg-purple-100 text-purple-800';
      case 'Chemical':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      main_roll: 'Main Roll',
      jumbo_roll: 'Jumbo Roll',
      spunbond: 'Spunbond',
      meltblown: 'Melt Blown',
      kain: 'Kain',
      nonwoven: 'Nonwoven',
      packaging: 'Packaging',
      carton_box: 'Carton Box',
      inner_box: 'Inner Box',
      jerigen: 'Jerigen',
      botol: 'Botol',
      stc: 'STC',
      fliptop: 'Fliptop',
      plastik: 'Plastik',
      parfum: 'Parfum',
      chemical: 'Chemical',
      tissue: 'Tissue'
    };
    return labels[category?.toLowerCase()] || category || '-';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materials Management</h1>
          <p className="text-gray-600">Manage your materials inventory and information</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span>{t('common.export')}</span>
          </button>
          <button 
            onClick={() => navigate('/app/warehouse/materials/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Material</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search materials by name, code, or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {materialTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2"
            >
              <FunnelIcon className="h-4 w-4" />
              <span>{t('common.search')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('products.bom.material')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UOM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost/Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {materials.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <CubeIcon className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{material.name}</div>
                        <div className="text-sm text-gray-500">{material.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(material.material_type)}`}>
                      {getTypeLabel(material.material_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(material.category)}`}>
                        {getCategoryGroup(material.category)}
                      </span>
                      <span className="text-xs text-gray-500">{getCategoryLabel(material.category)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {material.unit_of_measure}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Rp {material.cost_per_unit?.toLocaleString('id-ID') || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      material.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {material.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => navigate(`/app/warehouse/materials/${material.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Material"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => navigate(`/app/warehouse/materials/${material.id}/edit`)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit Material"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(material.id, material.name)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Material"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.has_prev}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.has_next}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((currentPage - 1) * pagination.per_page) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pagination.per_page, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.has_prev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.has_next}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
};

export default MaterialsList;
