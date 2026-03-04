import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  CalendarIcon as Calendar,
  CheckBadgeIcon as QualityIcon,
  CheckCircleIcon,
  CheckIcon as Save,
  CubeIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon as AlertTriangle,
  HashtagIcon as Hash
,
  UserIcon as User,
  XCircleIcon as XCircle
} from '@heroicons/react/24/outline';
interface Product {
  id: number;
  name: string;
  code: string;
}

interface QualityCheckFormData {
  inspection_date: string;
  inspection_type: string;
  product_id: number | null;
  batch_number: string;
  sample_size: number;
  defect_count: number;
  status: string;
  result: string;
  findings: string;
  corrective_actions: string;
}

const QualityCheckForm: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<QualityCheckFormData>({
    inspection_date: new Date().toISOString().slice(0, 16),
    inspection_type: 'in_process',
    product_id: null,
    batch_number: '',
    sample_size: 0,
    defect_count: 0,
    status: 'pending',
    result: '',
    findings: '',
    corrective_actions: ''
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inspectionTypes = [
    { value: 'receiving', label: 'Receiving Inspection' },
    { value: 'in_process', label: 'In-Process Inspection' },
    { value: 'final', label: 'Final Inspection' },
    { value: 'audit', label: 'Quality Audit' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'text-yellow-600' },
    { value: 'in_progress', label: 'In Progress', color: 'text-blue-600' },
    { value: 'completed', label: 'Completed', color: 'text-green-600' }
  ];

  const resultOptions = [
    { value: '', label: 'Not Determined', color: 'text-gray-600' },
    { value: 'accepted', label: 'Accepted', color: 'text-green-600' },
    { value: 'rejected', label: 'Rejected', color: 'text-red-600' },
    { value: 'rework', label: 'Rework Required', color: 'text-orange-600' }
  ];

  useEffect(() => {
    fetchProducts();
    if (isEdit) {
      fetchQualityCheck();
    }
  }, [id]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products-new/?per_page=1000', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Map products-new fields to expected format
        const mappedProducts = (data.products || []).map((p: any) => ({
          id: p.id,
          code: p.kode_produk || p.code,
          name: p.nama_produk || p.name,
          primary_uom: p.satuan || p.primary_uom || 'pcs',
        }));
        setProducts(mappedProducts);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchQualityCheck = async () => {
    try {
      const response = await fetch(`/api/quality/inspections/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          inspection_date: data.inspection_date.slice(0, 16),
          inspection_type: data.inspection_type,
          product_id: data.product_id,
          batch_number: data.batch_number || '',
          sample_size: data.sample_size || 0,
          defect_count: data.defect_count || 0,
          status: data.status,
          result: data.result || '',
          findings: data.findings || '',
          corrective_actions: data.corrective_actions || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch quality check:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.defect_count > formData.sample_size) {
      setError('Defect count cannot exceed sample size');
      setLoading(false);
      return;
    }

    try {
      const url = isEdit 
        ? `/api/quality/inspections/${id}` 
        : '/api/quality/inspections';
      
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        navigate('/app/quality/inspections');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save quality check');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'product_id' 
        ? (value === '' ? null : Number(value))
        : ['sample_size', 'defect_count'].includes(name)
        ? Number(value)
        : value
    }));
  };

  const selectedProduct = products.find(p => p.id === formData.product_id);
  const defectRate = formData.sample_size > 0 ? (formData.defect_count / formData.sample_size) * 100 : 0;
  const passRate = 100 - defectRate;

  const getQualityStatus = () => {
    if (defectRate === 0) return { label: 'Excellent', color: 'text-green-600', icon: CheckCircle };
    if (defectRate <= 2) return { label: 'Good', color: 'text-blue-600', icon: CheckCircle };
    if (defectRate <= 5) return { label: 'Acceptable', color: 'text-yellow-600', icon: AlertTriangle };
    return { label: 'Poor', color: 'text-red-600', icon: XCircle };
  };

  const qualityStatus = getQualityStatus();
  const QualityIcon = qualityStatus.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Quality Inspection' : 'New Quality Inspection'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update quality inspection details' : 'Record new quality inspection and results'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <ExclamationCircleIcon className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Inspection Details */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Inspection Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Inspection Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="inspection_date"
                  value={formData.inspection_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inspection Type *
                </label>
                <select
                  name="inspection_type"
                  value={formData.inspection_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {inspectionTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CubeIcon className="inline h-4 w-4 mr-1" />{t('production.product')}</label>
                <select
                  name="product_id"
                  value={formData.product_id || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.code} - {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="inline h-4 w-4 mr-1" />
                  Batch Number
                </label>
                <input
                  type="text"
                  name="batch_number"
                  value={formData.batch_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter batch number"
                />
              </div>
            </div>
          </div>

          {/* Sample and Defect Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Sample & Quality Data
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sample Size *
                </label>
                <input
                  type="number"
                  name="sample_size"
                  value={formData.sample_size}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter sample size"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Defect Count
                </label>
                <input
                  type="number"
                  name="defect_count"
                  value={formData.defect_count}
                  onChange={handleInputChange}
                  min="0"
                  max={formData.sample_size}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter defect count"
                />
              </div>
            </div>

            {/* Quality Metrics */}
            {formData.sample_size > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Quality Metrics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{passRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Pass Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{defectRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Defect Rate</div>
                  </div>
                  <div className="text-center">
                    <div className={`flex items-center justify-center gap-2 ${qualityStatus.color}`}>
                      <QualityIcon className="h-5 w-5" />
                      <span className="font-medium">{qualityStatus.label}</span>
                    </div>
                    <div className="text-sm text-gray-600">Quality Status</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status and Results */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Status & Results
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Inspection Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inspection Result
                </label>
                <select
                  name="result"
                  value={formData.result}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {resultOptions.map(result => (
                    <option key={result.value} value={result.value}>
                      {result.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Result Status Display */}
            {formData.result && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {formData.result === 'accepted' && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {formData.result === 'rejected' && <XCircle className="h-5 w-5 text-red-600" />}
                  {formData.result === 'rework' && <AlertTriangle className="h-5 w-5 text-orange-600" />}
                  <span className={`font-medium ${resultOptions.find(r => r.value === formData.result)?.color}`}>
                    {resultOptions.find(r => r.value === formData.result)?.label}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Findings and Actions */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="inline h-4 w-4 mr-1" />
              </label>
              <textarea
                name="findings"
                value={formData.findings}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe inspection findings, defects, or observations..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Corrective Actions
              </label>
              <textarea
                name="corrective_actions"
                value={formData.corrective_actions}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe corrective actions taken or required..."
              />
            </div>
          </div>

          {/* Summary */}
          {selectedProduct && formData.sample_size > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Inspection Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Product:</span>
                  <div className="font-medium">{selectedProduct.name}</div>
                </div>
                <div>
                  <span className="text-blue-600">Sample Size:</span>
                  <div className="font-medium">{formData.sample_size} units</div>
                </div>
                <div>
                  <span className="text-blue-600">Defects:</span>
                  <div className="font-medium">{formData.defect_count} units</div>
                </div>
                <div>
                  <span className="text-blue-600">Pass Rate:</span>
                  <div className="font-medium">{passRate.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/quality/inspections')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <X className="inline h-4 w-4 mr-2" />{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="inline h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update Inspection' : 'Create Inspection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QualityCheckForm;
