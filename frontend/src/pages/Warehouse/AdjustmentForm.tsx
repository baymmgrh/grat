import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowTrendingDownIcon as TrendingDown,
  ArrowTrendingUpIcon,
  CalendarIcon as Calendar,
  ChartBarIcon as Calculator
,
  CheckIcon as Save,
  CubeIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  HashtagIcon as Hash,
  MapPinIcon
} from '@heroicons/react/24/outline';
interface Product {
  id: number;
  name: string;
  code: string;
  primary_uom: string;
}

interface Location {
  id: number;
  location_code: string;
  zone: {
    name: string;
  };
}

interface InventoryItem {
  quantity: number;
  unit_cost: number;
}

interface AdjustmentFormData {
  product_id: number;
  location_id: number;
  adjustment_type: string;
  reason: string;
  system_quantity: number;
  physical_quantity: number;
  batch_number: string;
  lot_number: string;
  serial_number: string;
  unit_cost: number | null;
  notes: string;
  reference_document: string;
  adjustment_date: string;
}

const AdjustmentForm: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<AdjustmentFormData>({
    product_id: 0,
    location_id: 0,
    adjustment_type: 'recount',
    reason: 'counting_error',
    system_quantity: 0,
    physical_quantity: 0,
    batch_number: '',
    lot_number: '',
    serial_number: '',
    unit_cost: null,
    notes: '',
    reference_document: '',
    adjustment_date: new Date().toISOString().split('T')[0]
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentInventory, setCurrentInventory] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const adjustmentTypes = [
    { value: 'positive', label: 'Positive Adjustment (Increase Stock)' },
    { value: 'negative', label: 'Negative Adjustment (Decrease Stock)' },
    { value: 'recount', label: 'Physical Recount' }
  ];

  const reasons = [
    { value: 'counting_error', label: 'Counting Error' },
    { value: 'damaged', label: 'Damaged Goods' },
    { value: 'expired', label: 'Expired Products' },
    { value: 'theft', label: 'Theft/Loss' },
    { value: 'system_error', label: 'System Error' },
    { value: 'stock_take', label: 'Stock Take Adjustment' },
    { value: 'quality_issue', label: 'Quality Issue' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchProducts();
    fetchLocations();
    if (isEdit) {
      fetchAdjustment();
    }
  }, [id]);

  useEffect(() => {
    // Fetch current inventory when product and location are selected
    if (formData.product_id && formData.location_id && !isEdit) {
      fetchCurrentInventory();
    }
  }, [formData.product_id, formData.location_id, isEdit]);

  useEffect(() => {
    // Auto-set system quantity from current inventory
    if (currentInventory && !isEdit) {
      setFormData(prev => ({
        ...prev,
        system_quantity: currentInventory.quantity,
        unit_cost: currentInventory.unit_cost
      }));
    }
  }, [currentInventory, isEdit]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products-new/?per_page=1000', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
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

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/warehouse/locations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLocations(data.locations || []);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const fetchCurrentInventory = async () => {
    try {
      const response = await fetch(`/api/warehouse/inventory/current?product_id=${formData.product_id}&location_id=${formData.location_id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentInventory(data);
      } else {
        setCurrentInventory({ quantity: 0, unit_cost: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch current inventory:', error);
      setCurrentInventory({ quantity: 0, unit_cost: 0 });
    }
  };

  const fetchAdjustment = async () => {
    try {
      const response = await fetch(`/api/warehouse/adjustments/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          product_id: data.product_id,
          location_id: data.location_id,
          adjustment_type: data.adjustment_type,
          reason: data.reason,
          system_quantity: data.system_quantity,
          physical_quantity: data.physical_quantity,
          batch_number: data.batch_number || '',
          lot_number: data.lot_number || '',
          serial_number: data.serial_number || '',
          unit_cost: data.unit_cost,
          notes: data.notes || '',
          reference_document: data.reference_document || '',
          adjustment_date: data.adjustment_date ? data.adjustment_date.split('T')[0] : ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch adjustment:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = isEdit 
        ? `/api/warehouse/adjustments/${id}` 
        : '/api/warehouse/adjustments';
      
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
        navigate('/app/warehouse/adjustments');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save adjustment');
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
      [name]: name.includes('_id') || name.includes('quantity') || name === 'unit_cost' 
        ? (value === '' ? (name === 'unit_cost' ? null : 0) : Number(value))
        : value
    }));
  };

  const selectedProduct = products.find(p => p.id === formData.product_id);
  const adjustmentQuantity = formData.physical_quantity - formData.system_quantity;
  const totalCostImpact = adjustmentQuantity && formData.unit_cost ? adjustmentQuantity * formData.unit_cost : 0;
  const variancePercentage = formData.system_quantity > 0 ? (adjustmentQuantity / formData.system_quantity) * 100 : 0;

  const isPositiveAdjustment = adjustmentQuantity > 0;
  const isNegativeAdjustment = adjustmentQuantity < 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Inventory Adjustment' : 'New Inventory Adjustment'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update inventory adjustment details' : 'Create new inventory adjustment for stock correction'}
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

          {/* Product and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CubeIcon className="inline h-4 w-4 mr-1" />
                Product *
              </label>
              <select
                name="product_id"
                value={formData.product_id}
                onChange={handleInputChange}
                required
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
                <MapPinIcon className="inline h-4 w-4 mr-1" />
                Location *
              </label>
              <select
                name="location_id"
                value={formData.location_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Location</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.location_code} - {location.zone?.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Adjustment Type and Reason */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adjustment Type *
              </label>
              <select
                name="adjustment_type"
                value={formData.adjustment_type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {adjustmentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason *
              </label>
              <select
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {reasons.map(reason => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Quantity *
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="system_quantity"
                  value={formData.system_quantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  readOnly={!isEdit && currentInventory !== null}
                />
                {selectedProduct && (
                  <span className="absolute right-3 top-2 text-sm text-gray-500">
                    {selectedProduct.primary_uom}
                  </span>
                )}
              </div>
              {currentInventory && !isEdit && (
                <p className="mt-1 text-sm text-gray-500">
                  Current system stock
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Physical Quantity *
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="physical_quantity"
                  value={formData.physical_quantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {selectedProduct && (
                  <span className="absolute right-3 top-2 text-sm text-gray-500">
                    {selectedProduct.primary_uom}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Actual counted quantity
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adjustment Quantity
              </label>
              <div className={`px-3 py-2 border rounded-lg ${
                isPositiveAdjustment ? 'bg-green-50 border-green-200 text-green-700' :
                isNegativeAdjustment ? 'bg-red-50 border-red-200 text-red-700' :
                'bg-gray-50 border-gray-300 text-gray-700'
              }`}>
                <div className="flex items-center gap-2">
                  {isPositiveAdjustment && <ArrowTrendingUpIcon className="h-4 w-4" />}
                  {isNegativeAdjustment && <TrendingDown className="h-4 w-4" />}
                  {adjustmentQuantity.toFixed(2)} {selectedProduct?.primary_uom || ''}
                </div>
              </div>
              {variancePercentage !== 0 && (
                <p className={`mt-1 text-sm ${
                  isPositiveAdjustment ? 'text-green-600' : 'text-red-600'
                }`}>
                  {variancePercentage > 0 ? '+' : ''}{variancePercentage.toFixed(1)}% variance
                </p>
              )}
            </div>
          </div>

          {/* Batch Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lot Number
              </label>
              <input
                type="text"
                name="lot_number"
                value={formData.lot_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter lot number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serial Number
              </label>
              <input
                type="text"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter serial number"
              />
            </div>
          </div>

          {/* Cost Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CurrencyDollarIcon className="inline h-4 w-4 mr-1" />
                Unit Cost (IDR)
              </label>
              <input
                type="number"
                name="unit_cost"
                value={formData.unit_cost || ''}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter unit cost"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calculator className="inline h-4 w-4 mr-1" />
                Total Cost Impact (IDR)
              </label>
              <div className={`px-3 py-2 border rounded-lg ${
                totalCostImpact > 0 ? 'bg-green-50 border-green-200 text-green-700' :
                totalCostImpact < 0 ? 'bg-red-50 border-red-200 text-red-700' :
                'bg-gray-50 border-gray-300 text-gray-700'
              }`}>
                {totalCostImpact > 0 ? '+' : ''}{totalCostImpact.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Reference and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Document
              </label>
              <input
                type="text"
                name="reference_document"
                value={formData.reference_document}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Stock Take ST-2025-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Adjustment Date *
              </label>
              <input
                type="date"
                name="adjustment_date"
                value={formData.adjustment_date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DocumentTextIcon className="inline h-4 w-4 mr-1" />
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter detailed explanation for the adjustment..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/warehouse/adjustments')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <X className="inline h-4 w-4 mr-2" />{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="inline h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update Adjustment' : 'Create Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdjustmentForm;
