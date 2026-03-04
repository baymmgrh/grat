import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowRightIcon,
  CalendarIcon as Calendar,
  ClockIcon,
  CubeIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  HashtagIcon as Hash,
  MapPinIcon,
  ExclamationTriangleIcon as AlertTriangle,
  TruckIcon as Truck,
  CheckIcon as Save
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

interface TransferFormData {
  product_id: number;
  from_location_id: number;
  to_location_id: number;
  quantity: number;
  uom: string;
  batch_number: string;
  lot_number: string;
  serial_number: string;
  reason: string;
  notes: string;
  priority: string;
  expected_date: string;
}

const TransferForm: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<TransferFormData>({
    product_id: 0,
    from_location_id: 0,
    to_location_id: 0,
    quantity: 0,
    uom: '',
    batch_number: '',
    lot_number: '',
    serial_number: '',
    reason: '',
    notes: '',
    priority: 'normal',
    expected_date: ''
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [availableQuantity, setAvailableQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const priorities = [
    { value: 'low', label: 'Low Priority', color: 'text-gray-600' },
    { value: 'normal', label: 'Normal Priority', color: 'text-blue-600' },
    { value: 'high', label: 'High Priority', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
  ];

  const commonReasons = [
    'Replenishment',
    'Stock Balancing',
    'Production Requirement',
    'Quality Issue',
    'Expired Stock Removal',
    'Zone Optimization',
    'Customer Request',
    'Maintenance Activity'
  ];

  useEffect(() => {
    fetchProducts();
    fetchLocations();
    if (isEdit) {
      fetchTransfer();
    }
  }, [id]);

  useEffect(() => {
    // Set UOM based on selected product
    const selectedProduct = products.find(p => p.id === formData.product_id);
    if (selectedProduct && !formData.uom) {
      setFormData(prev => ({ ...prev, uom: selectedProduct.primary_uom }));
    }
  }, [formData.product_id, products]);

  useEffect(() => {
    // Fetch available quantity when product and from_location are selected
    if (formData.product_id && formData.from_location_id && !isEdit) {
      fetchAvailableQuantity();
    }
  }, [formData.product_id, formData.from_location_id, isEdit]);

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

  const fetchAvailableQuantity = async () => {
    try {
      const response = await fetch(`/api/warehouse/inventory/available?product_id=${formData.product_id}&location_id=${formData.from_location_id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableQuantity(data.available_quantity || 0);
      } else {
        setAvailableQuantity(0);
      }
    } catch (error) {
      console.error('Failed to fetch available quantity:', error);
      setAvailableQuantity(0);
    }
  };

  const fetchTransfer = async () => {
    try {
      const response = await fetch(`/api/warehouse/transfers/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          product_id: data.product_id,
          from_location_id: data.from_location_id,
          to_location_id: data.to_location_id,
          quantity: data.quantity,
          uom: data.uom,
          batch_number: data.batch_number || '',
          lot_number: data.lot_number || '',
          serial_number: data.serial_number || '',
          reason: data.reason || '',
          notes: data.notes || '',
          priority: data.priority,
          expected_date: data.expected_date ? data.expected_date.split('T')[0] : ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch transfer:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.from_location_id === formData.to_location_id) {
      setError('From and To locations cannot be the same');
      setLoading(false);
      return;
    }

    if (formData.quantity > availableQuantity && !isEdit) {
      setError(`Insufficient stock. Available quantity: ${availableQuantity}`);
      setLoading(false);
      return;
    }

    try {
      const url = isEdit 
        ? `/api/warehouse/transfers/${id}` 
        : '/api/warehouse/transfers';
      
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
        navigate('/app/warehouse/transfers');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save transfer');
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
      [name]: name.includes('_id') || name === 'quantity' 
        ? Number(value) 
        : value
    }));
  };

  const selectedProduct = products.find(p => p.id === formData.product_id);
  const fromLocation = locations.find(l => l.id === formData.from_location_id);
  const toLocation = locations.find(l => l.id === formData.to_location_id);
  const selectedPriority = priorities.find(p => p.value === formData.priority);

  const isInsufficientStock = formData.quantity > availableQuantity && !isEdit;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Inventory Transfer' : 'New Inventory Transfer'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update inventory transfer details' : 'Create new inventory transfer between locations'}
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

          {/* Product Selection */}
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

          {/* Location Transfer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPinIcon className="inline h-4 w-4 mr-1" />
                From Location *
              </label>
              <select
                name="from_location_id"
                value={formData.from_location_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select From Location</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.location_code} - {location.zone?.name}
                  </option>
                ))}
              </select>
              {fromLocation && availableQuantity > 0 && (
                <p className="mt-1 text-sm text-green-600">
                  Available: {availableQuantity} {selectedProduct?.primary_uom}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ArrowRightIcon className="inline h-4 w-4 mr-1" />
                To Location *
              </label>
              <select
                name="to_location_id"
                value={formData.to_location_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select To Location</option>
                {locations
                  .filter(location => location.id !== formData.from_location_id)
                  .map(location => (
                    <option key={location.id} value={location.id}>
                      {location.location_code} - {location.zone?.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Transfer Summary */}
          {fromLocation && toLocation && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-blue-900">{fromLocation.location_code}</div>
                  <div className="text-blue-600">{fromLocation.zone?.name}</div>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-blue-500" />
                <div className="text-center">
                  <div className="font-medium text-blue-900">{toLocation.location_code}</div>
                  <div className="text-blue-600">{toLocation.zone?.name}</div>
                </div>
              </div>
            </div>
          )}

          {/* Quantity and UOM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  max={!isEdit ? availableQuantity : undefined}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isInsufficientStock ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {selectedProduct && (
                  <span className="absolute right-3 top-2 text-sm text-gray-500">
                    {selectedProduct.primary_uom}
                  </span>
                )}
              </div>
              {isInsufficientStock && (
                <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Exceeds available stock ({availableQuantity})</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit of Measure
              </label>
              <input
                type="text"
                name="uom"
                value={formData.uom}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={selectedProduct?.primary_uom || 'Enter UOM'}
              />
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

          {/* Priority and Expected Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
              {selectedPriority && (
                <p className={`mt-1 text-sm ${selectedPriority.color}`}>
                  {selectedPriority.label}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Expected Completion Date
              </label>
              <input
                type="date"
                name="expected_date"
                value={formData.expected_date}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Truck className="inline h-4 w-4 mr-1" />
              Reason for Transfer
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
              {commonReasons.map(reason => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, reason }))}
                  className={`px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 ${
                    formData.reason === reason 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 text-gray-700'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <input
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter or select reason for transfer"
            />
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
              placeholder="Enter any additional notes or special instructions..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/warehouse/transfers')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <X className="inline h-4 w-4 mr-2" />{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading || isInsufficientStock}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="inline h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update Transfer' : 'Create Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferForm;
