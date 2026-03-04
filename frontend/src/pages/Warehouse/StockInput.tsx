import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  CubeIcon,
  ExclamationCircleIcon,
  PlusIcon,
  QrCodeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
interface Product {
  id: number;
  code: string;
  name: string;
  primary_uom: string;
  material_type: string;
}

interface Material {
  id: number;
  code: string;
  name: string;
  primary_uom: string;
  material_type: string;
  category: string;
}

interface Location {
  id: number;
  code: string;
  name: string;
  zone_name: string;
  capacity: number;
  current_usage: number;
}

interface StockInputItem {
  id: string;
  item_type: 'product' | 'material';
  product_id: number | null;
  material_id: number | null;
  item_name: string;
  item_code: string;
  quantity: number;
  uom: string;
  location_id: number | null;
  location_name: string;
  batch_number: string;
  expiry_date: string;
  notes: string;
}

const StockInput: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [stockItems, setStockItems] = useState<StockInputItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemType, setSelectedItemType] = useState<'product' | 'material'>('material');

  // Form data
  const [formData, setFormData] = useState({
    movement_type: 'stock_in',
    reference_number: '',
    notes: '',
    received_by: '',
    supplier_id: null,
    movement_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchProducts();
    fetchMaterials();
    fetchLocations();
    generateReferenceNumber();
  }, []);

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

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/production/materials?is_active=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials || []);
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/warehouse/locations?is_active=true', {
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

  const generateReferenceNumber = () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = today.toTimeString().slice(0, 5).replace(':', '');
    setFormData(prev => ({
      ...prev,
      reference_number: `SI-${dateStr}-${timeStr}`
    }));
  };

  const addStockItem = () => {
    const newItem: StockInputItem = {
      id: Date.now().toString(),
      item_type: selectedItemType,
      product_id: null,
      material_id: null,
      item_name: '',
      item_code: '',
      quantity: 0,
      uom: '',
      location_id: null,
      location_name: '',
      batch_number: '',
      expiry_date: '',
      notes: ''
    };
    setStockItems([...stockItems, newItem]);
  };

  const removeStockItem = (id: string) => {
    setStockItems(stockItems.filter(item => item.id !== id));
  };

  const updateStockItem = (id: string, field: string, value: any) => {
    setStockItems(stockItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Handle item selection
        if (field === 'product_id' && value) {
          const product = products.find(p => p.id === Number(value));
          if (product) {
            updatedItem.item_name = product.name;
            updatedItem.item_code = product.code;
            updatedItem.uom = product.primary_uom;
            updatedItem.material_id = null;
          }
        }
        
        if (field === 'material_id' && value) {
          const material = materials.find(m => m.id === Number(value));
          if (material) {
            updatedItem.item_name = material.name;
            updatedItem.item_code = material.code;
            updatedItem.uom = material.primary_uom;
            updatedItem.product_id = null;
          }
        }

        if (field === 'location_id' && value) {
          const location = locations.find(l => l.id === Number(value));
          if (location) {
            updatedItem.location_name = `${location.zone_name} - ${location.name}`;
          }
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stockItems.length === 0) {
      alert('Please add at least one stock item');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        items: stockItems.map(item => ({
          item_type: item.item_type,
          product_id: item.product_id,
          material_id: item.material_id,
          quantity: item.quantity,
          location_id: item.location_id,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date || null,
          notes: item.notes
        }))
      };

      const response = await fetch('/api/warehouse/stock-input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Stock input berhasil disimpan!');
        navigate('/app/warehouse/inventory');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to save stock input:', error);
      alert('Failed to save stock input');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMaterials = materials.filter(material =>
    (material.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (material.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              to="/app/warehouse/inventory"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Inventory
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manual Stock Input</h1>
              <p className="text-gray-600 mt-1">Input stock bahan baku, bahan kimia, dan bahan kemasan</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <QrCodeIcon className="h-6 w-6 text-blue-600" />
            <span className="text-sm text-gray-500">Manual Entry Mode</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Stock Input Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Stock Input Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({...formData, reference_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Movement Date
                </label>
                <input
                  type="date"
                  value={formData.movement_date}
                  onChange={(e) => setFormData({...formData, movement_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Received By
                </label>
                <input
                  type="text"
                  value={formData.received_by}
                  onChange={(e) => setFormData({...formData, received_by: e.target.value})}
                  placeholder="Nama penerima"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                placeholder="Catatan tambahan..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Stock Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Stock Items</h2>
              <div className="flex items-center space-x-4">
                {/* Item Type Selector */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Add:</label>
                  <select
                    value={selectedItemType}
                    onChange={(e) => setSelectedItemType(e.target.value as 'product' | 'material')}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="material">{t('products.bom.material')}</option>
                    <option value="product">{t('production.product')}</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={addStockItem}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Item
                </button>
              </div>
            </div>

            {stockItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CubeIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No stock items added yet</p>
                <p className="text-sm">Click "Add Item" to start adding stock</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.quantity')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch/Expiry
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stockItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.item_type === 'material' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.item_type === 'material' ? [t('products.bom.material')] : t('production.product')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {item.item_type === 'material' ? (
                            <select
                              value={item.material_id || ''}
                              onChange={(e) => updateStockItem(item.id, 'material_id', e.target.value ? Number(e.target.value) : null)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              required
                            >
                              <option value="">Select Material</option>
                              {materials.map(material => (
                                <option key={material.id} value={material.id}>
                                  {material.code} - {material.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <select
                              value={item.product_id || ''}
                              onChange={(e) => updateStockItem(item.id, 'product_id', e.target.value ? Number(e.target.value) : null)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              required
                            >
                              <option value="">Select Product</option>
                              {products.map(product => (
                                <option key={product.id} value={product.id}>
                                  {product.code} - {product.name}
                                </option>
                              ))}
                            </select>
                          )}
                          {item.item_name && (
                            <div className="text-xs text-gray-500 mt-1">
                              {item.item_code} | UOM: {item.uom}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateStockItem(item.id, 'quantity', Number(e.target.value))}
                            min="0"
                            step="0.01"
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            required
                          />
                          <div className="text-xs text-gray-500 mt-1">{item.uom}</div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={item.location_id || ''}
                            onChange={(e) => updateStockItem(item.id, 'location_id', e.target.value ? Number(e.target.value) : null)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select Location</option>
                            {locations.map(location => (
                              <option key={location.id} value={location.id}>
                                {location.zone_name} - {location.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.batch_number}
                            onChange={(e) => updateStockItem(item.id, 'batch_number', e.target.value)}
                            placeholder="Batch number"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 mb-1"
                          />
                          <input
                            type="date"
                            value={item.expiry_date}
                            onChange={(e) => updateStockItem(item.id, 'expiry_date', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => removeStockItem(item.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Remove item"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Summary */}
          {stockItems.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stockItems.length}</div>
                  <div className="text-sm text-blue-800">Total Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stockItems.filter(item => item.item_type === 'material').length}
                  </div>
                  <div className="text-sm text-green-800">Materials</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {stockItems.filter(item => item.item_type === 'product').length}
                  </div>
                  <div className="text-sm text-purple-800">{t('navigation.products')}</div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Link
              to="/app/warehouse/inventory"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >{t('common.cancel')}</Link>
            <button
              type="submit"
              disabled={loading || stockItems.length === 0}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Save Stock Input
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockInput;
