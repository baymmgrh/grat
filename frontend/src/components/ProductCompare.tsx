import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  CheckIcon,
  CodeBracketIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
interface ProductDetail {
  id: number;
  kode_produk: string;
  nama_produk: string;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CompareData {
  product: ProductDetail;
  version1: {
    version: number;
    values: Record<string, any>;
    created_at: string;
  };
  version2: {
    version: number;
    values: Record<string, any>;
    created_at: string;
  };
  differences: Record<string, {
    version1: any;
    version2: any;
  }>;
  total_differences: number;
}

const ProductCompare: React.FC = () => {
  const { t } = useLanguage();

  const { kode_produk } = useParams<{ kode_produk: string }>();
  const navigate = useNavigate();
  const [compareData, setCompareData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (kode_produk) {
      const urlParams = new URLSearchParams(window.location.search);
      const version1 = urlParams.get('version1');
      const version2 = urlParams.get('version2');
      
      if (version1 && version2) {
        fetchCompareData(version1, version2);
      }
    }
  }, [kode_produk]);

  const fetchCompareData = async (version1: string, version2: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products-excel/${kode_produk}/compare?version1=${version1}&version2=${version2}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch comparison data');
      }
      
      const data = await response.json();
      setCompareData(data);
      
      // Auto-expand sections with differences
      const sections = Object.keys(data.differences);
      setExpandedSections(
        sections.reduce((acc, section) => ({ ...acc, [section]: true }), {})
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString('id-ID');
    return String(value);
  };

  const getDiffIcon = (value1: any, value2: any) => {
    if (value1 === value2) return <CheckIcon className="h-4 w-4 text-green-500" />;
    return <XMarkIcon className="h-4 w-4 text-red-500" />;
  };

  const groupFieldsByCategory = (fields: Record<string, any>) => {
    const categories = {
      'Basic Information': ['kode_produk', 'nama_produk', 'is_active', 'version'],
      'Specifications': ['gramasi', 'cd', 'md', 'ratio', 'ingredient', 'berat_kering'],
      'Packaging': ['sheet_per_pack', 'pack_per_karton', 'ukuran_batch_vol', 'ukuran_batch_ctn'],
      'Materials': ['spunlace', 'rayon', 'polyester', 'es'],
      'Dimensions': ['slitting_cm', 'lebar_mr_net_cm', 'lebar_mr_gross_cm', 'keterangan_slitting'],
      'Machine Data': ['no_mesin_epd', 'speed_epd_pack_menit'],
      [t('navigation.production')]: ['meter_kain', 'kg_kain', 'kebutuhan_rayon_kg', 'kebutuhan_polyester_kg', 'kebutuhan_es_kg'],
      'Process': ['process_produksi'],
      'Rolls': ['kode_jumbo_roll', 'nama_jumbo_roll', 'kode_main_roll', 'nama_main_roll'],
      'Mixing': ['kapasitas_mixing_kg', 'actual_mixing_kg', 'dosing_kg']
    };

    const grouped: Record<string, Record<string, any>> = {};
    
    Object.entries(categories).forEach(([category, fieldList]) => {
      const categoryFields: Record<string, any> = {};
      fieldList.forEach(field => {
        if (fields[field] !== undefined) {
          categoryFields[field] = fields[field];
        }
      });
      if (Object.keys(categoryFields).length > 0) {
        grouped[category] = categoryFields;
      }
    });

    return grouped;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading comparison...</p>
        </div>
      </div>
    );
  }

  if (error || !compareData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || 'Comparison data not found'}</p>
          <button
            onClick={() => navigate(`/app/products/${kode_produk}/versions`)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Version History
          </button>
        </div>
      </div>
    );
  }

  const version1Grouped = groupFieldsByCategory(compareData.version1.values);
  const version2Grouped = groupFieldsByCategory(compareData.version2.values);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(`/app/products/${kode_produk}/versions`)}
                className="mr-4 p-2 rounded hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Compare Versions - {compareData.product.kode_produk}
                </h1>
                <p className="text-sm text-gray-500">{compareData.product.nama_produk}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {compareData.total_differences} differences found
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Version {compareData.version1.version}</h3>
            <p className="text-sm text-gray-600 mb-2">{formatDate(compareData.version1.created_at)}</p>
            <div className="text-sm text-gray-500">
              Status: {compareData.version1.values.is_active ? 'Active' : 'Inactive'}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Version {compareData.version2.version}</h3>
            <p className="text-sm text-gray-600 mb-2">{formatDate(compareData.version2.created_at)}</p>
            <div className="text-sm text-gray-500">
              Status: {compareData.version2.values.is_active ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <CodeBracketIcon className="h-5 w-5 mr-2" />
              Field Comparison
            </h3>
          </div>
          
          <div className="divide-y">
            {Object.entries(version1Grouped).map(([category, fields1]) => {
              const fields2 = version2Grouped[category] || {};
              const isExpanded = expandedSections[category];
              
              return (
                <div key={category} className="border-b last:border-b-0">
                  <button
                    onClick={() => toggleSection(category)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 text-left"
                  >
                    <h4 className="font-medium text-gray-900">{category}</h4>
                    {isExpanded ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="px-6 pb-4">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Version {compareData.version1.version}
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Version {compareData.version2.version}
                              </th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(fields1).map(([fieldName, value1]) => {
                              const value2 = fields2[fieldName];
                              const isDifferent = String(value1) !== String(value2);
                              
                              return (
                                <tr key={fieldName} className={isDifferent ? 'bg-red-50' : ''}>
                                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                    {fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900">
                                    {formatValue(value1)}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900">
                                    {formatValue(value2)}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-center">
                                    {getDiffIcon(value1, value2)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCompare;
