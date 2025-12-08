import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  ArrowLeftIcon as ArrowLeft,
  CalendarIcon as Calendar,
  CodeBracketIcon as GitCompare,
  DocumentTextIcon,
  ExclamationCircleIcon,
  ClockIcon as History,
  UserIcon as User
} from '@heroicons/react/24/outline';
interface ProductVersion {
  id: number;
  version: number;
  change_type: string;
  change_reason: string;
  created_at: string;
  created_by?: number;
  changed_fields: string[];
  old_values: Record<string, any>;
  new_values: Record<string, any>;
}

interface ProductDetail {
  id: number;
  kode_produk: string;
  nama_produk: string;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ProductVersionHistory: React.FC = () => {
  const { t } = useLanguage();

  const { kode_produk } = useParams<{ kode_produk: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [versions, setVersions] = useState<ProductVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);

  useEffect(() => {
    if (kode_produk) {
      fetchProductVersions();
    }
  }, [kode_produk]);

  const fetchProductVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products-excel/${kode_produk}/versions`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch product versions');
      }
      
      const data = await response.json();
      setProduct(data.product);
      setVersions(data.versions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCompareVersions = () => {
    if (selectedVersions.length === 2) {
      navigate(`/app/products/${kode_produk}/compare?version1=${selectedVersions[0]}&version2=${selectedVersions[1]}`);
    }
  };

  const toggleVersionSelection = (versionId: number) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      } else if (prev.length < 2) {
        return [...prev, versionId];
      } else {
        return [prev[1], versionId]; // Replace first selection with new one
      }
    });
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

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'CREATE':
        return '➕';
      case 'UPDATE':
        return '✏️';
      case 'DELETE':
        return '🗑️';
      default:
        return '📝';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading version history...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || 'Product not found'}</p>
          <button
            onClick={() => navigate('/app/products/list')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/app/products/list')}
                className="mr-4 p-2 rounded hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Version History - {product.kode_produk}
                </h1>
                <p className="text-sm text-gray-500">{product.nama_produk}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Current Version: <span className="font-medium text-gray-900">v{product.version}</span>
              </div>
              
              {compareMode && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    Selected: {selectedVersions.length}/2
                  </span>
                  {selectedVersions.length === 2 && (
                    <button
                      onClick={handleCompareVersions}
                      className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 flex items-center"
                    >
                      <GitCompare className="h-4 w-4 mr-1" />
                    </button>
                  )}
                </div>
              )}
              
              <button
                onClick={() => setCompareMode(!compareMode)}
                className={`px-3 py-1 text-sm rounded flex items-center ${
                  compareMode
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <GitCompare className="h-4 w-4 mr-1" />
                {compareMode ? 'Comparing' : 'Compare'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Info Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">{product.kode_produk}</h2>
              <p className="text-gray-600">{product.nama_produk}</p>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <span>Version: v{product.version}</span>
                <span>Status: {product.is_active ? 'Active' : 'Inactive'}</span>
                <span>Total Versions: {versions.length}</span>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div>Created: {formatDate(product.created_at)}</div>
              <div>Updated: {formatDate(product.updated_at)}</div>
            </div>
          </div>
        </div>

        {/* Versions List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <History className="h-5 w-5 mr-2" />
              Version History ({versions.length})
            </h3>
          </div>
          
          <div className="divide-y">
            {versions.map((version) => (
              <div key={version.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {compareMode && (
                      <input
                        type="checkbox"
                        checked={selectedVersions.includes(version.version)}
                        onChange={() => toggleVersionSelection(version.version)}
                        className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                    )}
                    
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getChangeTypeColor(version.change_type)}`}>
                        {getChangeTypeIcon(version.change_type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-medium text-gray-900">
                          Version {version.version}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getChangeTypeColor(version.change_type)}`}>
                          {version.change_type}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {version.change_reason || 'No reason provided'}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(version.created_at)}
                        </div>
                        {version.created_by && (
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            User {version.created_by}
                          </div>
                        )}
                        {version.changed_fields.length > 0 && (
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-3 w-3 mr-1" />
                            {version.changed_fields.length} fields changed
                          </div>
                        )}
                      </div>
                      
                      {version.changed_fields.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Changed Fields:</p>
                          <div className="flex flex-wrap gap-1">
                            {version.changed_fields.map((field, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                              >
                                {field}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductVersionHistory;
