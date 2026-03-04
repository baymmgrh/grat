import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowRightIcon,
  CalendarIcon as Calendar,
  CheckIcon as Save,
  CubeIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  HashtagIcon as Hash,
  MapPinIcon,
  XMarkIcon
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

interface MovementFormData {
  product_id: number;
  from_location_id: number | null;
  to_location_id: number | null;
  movement_type: string;
  reference_type: string;
  reference_id: number | null;
  quantity: number;
  uom: string;
  batch_number: string;
  lot_number: string;
  serial_number: string;
  unit_cost: number | null;
  notes: string;
  movement_date: string;
}

const MovementForm: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<MovementFormData>({
    product_id: 0,
    from_location_id: null,
    to_location_id: null,
    movement_type: 'receive',
    reference_type: '',
    reference_id: null,
    quantity: 0,
    uom: '',
    batch_number: '',
    lot_number: '',
    serial_number: '',
    unit_cost: null,
    notes: '',
    movement_date: new Date().toISOString().split('T')[0]
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const movementTypes = [
    { value: 'receive', label: 'Receive (Incoming)' },
    { value: 'issue', label: 'Issue (Outgoing)' },
    { value: 'transfer', label: 'Transfer (Between Locations)' },
    { value: 'adjust', label: 'Adjustment' }
  ];

  const referenceTypes = [
    { value: '', label: 'No Reference' },
    { value: 'sales_order', label: 'Sales Order' },
    { value: 'purchase_order', label: 'Purchase Order' },
    { value: 'work_order', label: 'Work Order' },
    { value: 'stock_take', label: 'Stock Take' }
  ];

  useEffect(() => {
    fetchProducts();
    fetchLocations();
    if (isEdit) {
      fetchMovement();
    }
  }, [id]);

  useEffect(() => {
    // Set UOM based on selected product
    const selectedProduct = products.find(p => p.id === formData.product_id);
    if (selectedProduct && !formData.uom) {
      setFormData(prev => ({ ...prev, uom: selectedProduct.primary_uom }));
    }
  }, [formData.product_id, products]);

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

  const fetchMovement = async () => {
    try {
      const response = await fetch(`/api/warehouse/movements/${id}`, {
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
          movement_type: data.movement_type,
          reference_type: data.reference_type || '',
          reference_id: data.reference_id,
          quantity: data.quantity,
          uom: data.uom,
          batch_number: data.batch_number || '',
          lot_number: data.lot_number || '',
          serial_number: data.serial_number || '',
          unit_cost: data.unit_cost,
          notes: data.notes || '',
          movement_date: data.movement_date ? data.movement_date.split('T')[0] : ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch movement:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.movement_type === 'transfer' && (!formData.from_location_id || !formData.to_location_id)) {
      setError('Transfer movements require both from and to locations');
      setLoading(false);
      return;
    }

    if (formData.movement_type === 'receive' && !formData.to_location_id) {
      setError('Receive movements require a destination location');
      setLoading(false);
      return;
    }

    if (formData.movement_type === 'issue' && !formData.from_location_id) {
      setError('Issue movements require a source location');
      setLoading(false);
      return;
    }

    try {
      const url = isEdit 
        ? `/api/warehouse/movements/${id}` 
        : '/api/warehouse/movements';
      
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
        navigate('/app/warehouse/movements');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save movement');
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
      [name]: name.includes('_id') || name === 'quantity' || name === 'unit_cost' 
        ? (value === '' ? null : Number(value))
        : value
    }));
  };

  const selectedProduct = products.find(p => p.id === formData.product_id);
  const totalCost = formData.quantity && formData.unit_cost ? formData.quantity * formData.unit_cost : 0;

  const requiresFromLocation = ['issue', 'transfer', 'adjust'].includes(formData.movement_type);
  const requiresToLocation = ['receive', 'transfer', 'adjust'].includes(formData.movement_type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Inventory Movement' : 'New Inventory Movement'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update inventory movement details' : 'Record new inventory movement transaction'}
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

          {/* Movement Type and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Movement Type *
              </label>
              <select
                name="movement_type"
                value={formData.movement_type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {movementTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Movement Date *
              </label>
              <input
                type="date"
                name="movement_date"
                value={formData.movement_date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

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

          {/* Location Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPinIcon className="inline h-4 w-4 mr-1" />
                From Location {requiresFromLocation && '*'}
              </label>
              <select
                name="from_location_id"
                value={formData.from_location_id || ''}
                onChange={handleInputChange}
                required={requiresFromLocation}
                disabled={formData.movement_type === 'receive'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select From Location</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.location_code} - {location.zone?.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ArrowRightIcon className="inline h-4 w-4 mr-1" />
                To Location {requiresToLocation && '*'}
              </label>
              <select
                name="to_location_id"
                value={formData.to_location_id || ''}
                onChange={handleInputChange}
                required={requiresToLocation}
                disabled={formData.movement_type === 'issue'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select To Location</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.location_code} - {location.zone?.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity and UOM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
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
                Total Cost (IDR)
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                {totalCost.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Type
              </label>
              <select
                name="reference_type"
                value={formData.reference_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {referenceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference ID
              </label>
              <input
                type="number"
                name="reference_id"
                value={formData.reference_id || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter reference ID"
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
              placeholder="Enter any additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/warehouse/movements')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <XMarkIcon className="inline h-4 w-4 mr-2" />{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="inline h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update Movement' : 'Record Movement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MovementForm;
