import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CalendarIcon as Calendar,
  CheckCircleIcon as CheckCircle,
  CheckIcon as Save,
  CogIcon as Settings,
  CubeIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  HashtagIcon as Hash,
  PlusIcon as Plus,
  SquaresPlusIcon as Layers,
  TrashIcon as Trash2,
  XMarkIcon as X
} from '@heroicons/react/24/outline';
import SearchableSelect from '../../components/SearchableSelect';
interface Product {
  id: number;
  code: string;
  name: string;
  material_type: string;
  primary_uom: string;
  cost: number;
  price: number;
  category_name?: string;
  pack_per_carton?: number;
}

interface Material {
  id: number;
  code: string;
  name: string;
  material_type: string;
  category: string;
  primary_uom: string;
  cost_per_unit: number;
  supplier_name?: string;
  lead_time_days: number;
  is_hazardous: boolean;
}

interface BOMItem {
  id?: number;
  line_number: number;
  product_id: number | null;
  material_id: number | null;
  quantity: number;
  uom: string;
  percentage: number;
  unit_cost: number;
  total_cost: number;
  scrap_percent: number;
  is_critical: boolean;
  notes: string;
  item_type: 'product' | 'material';
  item_name?: string;
  item_code?: string;
  material_category?: string;
}

interface BOMFormData {
  bom_number: string;
  product_id: number;
  version: string;
  is_active: boolean;
  effective_date: string;
  expiry_date: string;
  batch_size: number;
  batch_uom: string;
  pack_per_carton: number;
  notes: string;
  items: BOMItem[];
}

const BOMForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<BOMFormData>({
    bom_number: '',
    product_id: 0,
    version: '1.0',
    is_active: true,
    effective_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    batch_size: 1,
    batch_uom: 'carton',
    pack_per_carton: 1,
    notes: '',
    items: []
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const uomOptions = [
    'carton', 'pcs', 'kg', 'g', 'liter', 'ml', 'meter', 'cm', 'box', 'pack', 'unit', 'KG'
  ];

  useEffect(() => {
    fetchProducts();
    fetchMaterials();
    if (isEdit) {
      fetchBOM();
    } else {
      generateBOMNumber();
    }
  }, [id]);

  const fetchProducts = async () => {
    try {
      // Fetch from products-new API (updated product data)
      const response = await fetch('/api/products-new/?per_page=1000', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched products:', data.products?.length || 0);
        // Map products-new fields to expected format
        const mappedProducts = (data.products || []).map((p: any) => ({
          id: p.id,
          code: p.kode_produk || p.code,
          name: p.nama_produk || p.name,
          material_type: p.material_type || 'finished_goods',
          primary_uom: p.satuan || p.primary_uom || 'pcs',
          cost: p.hpp || p.cost || 0,
          price: p.harga_jual || p.price || 0,
          category_name: p.kategori || p.category_name,
          pack_per_carton: p.isi_per_karton || p.pack_per_carton || 1
        }));
        setProducts(mappedProducts);
      } else {
        // Fallback to old API if products-new fails
        console.log('Falling back to old products API');
        const fallbackResponse = await fetch('/api/products?per_page=1000', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          setProducts(data.products || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/materials?per_page=1000', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched materials:', data.materials?.length || 0);
        setMaterials(data.materials || []);
      } else {
        console.error('Failed to fetch materials:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    }
  };

  const generateBOMNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    const bomNumber = `BOM-${year}${month}-${timestamp}`;
    
    setFormData(prev => ({
      ...prev,
      bom_number: bomNumber
    }));
  };

  const fetchBOM = async () => {
    try {
      const response = await fetch(`/api/boms/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const responseData = await response.json();
        const data = responseData.bom; // API returns { bom: {...} }
        
        console.log('Fetched BOM data:', data);
        console.log('BOM items:', data.items);
        
        setFormData({
          bom_number: data.bom_number,
          product_id: data.product_id,
          version: data.version,
          is_active: data.is_active,
          effective_date: data.effective_date || new Date().toISOString().split('T')[0],
          expiry_date: data.expiry_date || '',
          batch_size: data.batch_size || 1,
          batch_uom: data.batch_uom || 'carton',
          pack_per_carton: data.pack_per_carton || 1,
          notes: data.notes || '',
          items: (data.items || []).map((item: any, index: number) => ({
            id: item.id,
            line_number: item.line_number || index + 1,
            product_id: item.product_id || null,
            material_id: item.material_id || null,
            quantity: parseFloat(item.quantity) || 0,
            uom: item.uom || 'KG',
            percentage: parseFloat(item.percentage) || 0,
            unit_cost: parseFloat(item.unit_cost) || 0,
            total_cost: parseFloat(item.total_cost) || 0,
            scrap_percent: parseFloat(item.scrap_percent) || 0,
            is_critical: item.is_critical || false,
            notes: item.notes || '',
            item_type: item.product_id ? 'product' : 'material',
            item_name: item.material_name || item.product_name || '',
            item_code: item.material_code || item.product_code || '',
            material_category: item.material_category || ''
          }))
        });
        
        console.log('Form data set with items:', (data.items || []).length);
      } else {
        console.error('Failed to fetch BOM:', response.status);
        setError('Failed to load BOM data');
      }
    } catch (error) {
      console.error('Failed to fetch BOM:', error);
      setError('Network error while loading BOM');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('=== HANDLE SUBMIT CALLED ===');
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Form Data:', formData);

    // Validation
    console.log('Validating product_id:', formData.product_id);
    if (formData.product_id === 0) {
      console.error('Validation failed: No product selected');
      setError('Please select a product');
      setLoading(false);
      return;
    }

    console.log('Validating items count:', formData.items.length);
    if (formData.items.length === 0) {
      console.error('Validation failed: No items');
      setError('Please add at least one BOM item');
      setLoading(false);
      return;
    }

    // Validate items and filter out empty ones
    console.log('Validating items...');
    const validItems = [];
    for (const item of formData.items) {
      console.log(`Validating item ${item.line_number}:`, item);
      
      // Skip empty items (no product and no material selected)
      if (!item.product_id && !item.material_id) {
        console.warn(`Skipping empty item at line ${item.line_number}`);
        continue;
      }
      
      // Validate quantity for non-empty items
      if (item.quantity <= 0) {
        console.error(`Validation failed: Line ${item.line_number} - Invalid quantity`);
        setError(`Line ${item.line_number}: Quantity must be greater than 0`);
        setLoading(false);
        return;
      }
      
      validItems.push(item);
    }
    
    console.log(`✅ Validation passed! Valid items: ${validItems.length}/${formData.items.length}`);
    
    // Check if we have at least one valid item
    if (validItems.length === 0) {
      console.error('Validation failed: No valid items');
      setError('Please add at least one BOM item with material/product selected');
      setLoading(false);
      return;
    }

    try {
      const url = isEdit 
        ? `/api/boms/${id}` 
        : '/api/boms';
      
      const method = isEdit ? 'PUT' : 'POST';

      // Prepare data with only valid items
      const dataToSend = {
        ...formData,
        items: validItems
      };

      console.log('Saving BOM:', dataToSend);

      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'null');

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response:', responseData);

      if (response.ok) {
        alert('BOM saved successfully!');
        navigate('/app/products/boms');
      } else {
        console.error('Error saving BOM:', responseData);
        
        // Handle JWT errors
        if (response.status === 401 || response.status === 422) {
          if (responseData.msg === 'Not enough segments' || responseData.msg?.includes('Token')) {
            setError('Session expired. Please login again.');
            // Redirect to login after 2 seconds
            setTimeout(() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }, 2000);
            return;
          }
        }
        
        setError(responseData.error || responseData.message || responseData.msg || 'Failed to save BOM');
      }
    } catch (error: any) {
      console.error('Network error:', error);
      setError(`Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : ['product_id', 'batch_size'].includes(name) 
          ? (value === '' ? 0 : Number(value))
          : value
    }));
  };

  const addBOMItem = () => {
    const newItem: BOMItem = {
      line_number: formData.items.length + 1,
      product_id: null,
      material_id: null,
      quantity: 1,
      uom: 'kg',
      percentage: 0,
      unit_cost: 0,
      total_cost: 0,
      scrap_percent: 0,
      is_critical: false,
      notes: '',
      item_type: 'material'
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeBOMItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index).map((item, i) => ({
        ...item,
        line_number: i + 1
      }))
    }));
  };

  const updateBOMItem = (index: number, field: keyof BOMItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          
          // Handle item type change
          if (field === 'item_type') {
            updatedItem.product_id = null;
            updatedItem.material_id = null;
            updatedItem.item_name = '';
            updatedItem.item_code = '';
          }
          
          // Handle product/material selection
          if (field === 'product_id' && value) {
            const product = products.find(p => p.id === Number(value));
            if (product) {
              updatedItem.uom = product.primary_uom;
              updatedItem.item_name = product.name;
              updatedItem.item_code = product.code;
              updatedItem.material_id = null;
            }
          }
          
          if (field === 'material_id' && value) {
            const material = materials.find(m => m.id === Number(value));
            if (material) {
              updatedItem.uom = material.primary_uom;
              updatedItem.item_name = material.name;
              updatedItem.item_code = material.code;
              updatedItem.unit_cost = material.cost_per_unit;
              updatedItem.material_category = material.category;
              updatedItem.product_id = null;
              
              // Auto-calculate total cost with existing quantity
              const qty = updatedItem.quantity;
              const cost = material.cost_per_unit;
              const scrap = updatedItem.scrap_percent;
              const adjustedQty = qty * (1 + scrap / 100);
              updatedItem.total_cost = adjustedQty * cost;
            }
          }
          
          // Auto-calculate total cost when quantity, unit_cost, or scrap_percent changes
          if (field === 'quantity' || field === 'unit_cost' || field === 'scrap_percent') {
            const qty = field === 'quantity' ? Number(value) : updatedItem.quantity;
            const cost = field === 'unit_cost' ? Number(value) : updatedItem.unit_cost;
            const scrap = field === 'scrap_percent' ? Number(value) : updatedItem.scrap_percent;
            
            // Calculate with scrap: quantity * (1 + scrap/100) * unit_cost
            const adjustedQty = qty * (1 + scrap / 100);
            updatedItem.total_cost = adjustedQty * cost;
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const selectedProduct = products.find(p => p.id === formData.product_id);
  const getTotalItems = () => formData.items.length;
  const getCriticalItems = () => formData.items.filter(item => item.is_critical).length;
  
  // Calculate total cost and percentages
  const getTotalCost = () => {
    return formData.items.reduce((sum, item) => sum + (item.total_cost || 0), 0);
  };
  
  const getHPP = () => {
    const totalCost = getTotalCost();
    // HPP per carton
    return formData.batch_size > 0 ? totalCost / formData.batch_size : 0;
  };
  
  // Auto-calculate percentages when items change
  useEffect(() => {
    const totalCost = getTotalCost();
    if (totalCost > 0) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(item => ({
          ...item,
          percentage: totalCost > 0 ? (item.total_cost / totalCost) * 100 : 0
        }))
      }));
    }
  }, [formData.items.map(item => item.total_cost).join(',')]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Bill of Materials' : 'New Bill of Materials'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update BOM structure and components' : 'Create new BOM for product manufacturing'}
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

          {/* BOM Header Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              <Layers className="inline h-4 w-4 mr-1" />
              BOM Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="inline h-4 w-4 mr-1" />
                  BOM Number *
                </label>
                <input
                  type="text"
                  name="bom_number"
                  value={formData.bom_number}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CubeIcon className="inline h-4 w-4 mr-1" />
                  Product *
                </label>
                <SearchableSelect
                  options={products}
                  value={formData.product_id || null}
                  onChange={(value) => {
                    const product = products.find(p => p.id === value);
                    setFormData(prev => ({
                      ...prev,
                      product_id: value || 0,
                      pack_per_carton: product?.pack_per_carton || prev.pack_per_carton,
                      batch_size: product?.pack_per_carton || prev.batch_size
                    }));
                  }}
                  placeholder="Select Product"
                  className="w-full"
                />
                {selectedProduct && (
                  <p className="mt-1 text-sm text-gray-500">
                    UOM: {selectedProduct.primary_uom}
                    {selectedProduct.pack_per_carton && ` | Pack/Carton: ${selectedProduct.pack_per_carton}`}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                </label>
                <input
                  type="text"
                  name="version"
                  value={formData.version}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Effective Date
                </label>
                <input
                  type="date"
                  name="effective_date"
                  value={formData.effective_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pack per Carton *
                </label>
                <input
                  type="number"
                  name="pack_per_carton"
                  value={formData.pack_per_carton}
                  onChange={handleInputChange}
                  required
                  min="1"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Number of packs in one carton
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Size (Cartons) *
                </label>
                <input
                  type="number"
                  name="batch_size"
                  value={formData.batch_size}
                  onChange={handleInputChange}
                  required
                  min="0.01"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Total packs: {(formData.batch_size * formData.pack_per_carton).toFixed(0)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch UOM *
                </label>
                <select
                  name="batch_uom"
                  value={formData.batch_uom}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {uomOptions.map(uom => (
                    <option key={uom} value={uom}>
                      {uom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                <CheckCircle className="inline h-4 w-4 mr-1" />
                Active BOM
              </label>
            </div>
          </div>

          {/* BOM Items */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                <Settings className="inline h-4 w-4 mr-1" />
                BOM Components
              </h3>
              <button
                type="button"
                onClick={addBOMItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus className="inline h-4 w-4 mr-2" />
                Add Component
              </button>
            </div>

            {formData.items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CubeIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No components added yet</p>
                <p className="text-sm">Click "Add Component" to start building your BOM</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        %
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Cost
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Cost
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scrap %
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-2 py-3 text-sm text-gray-900">
                          {item.line_number}
                        </td>
                        <td className="px-2 py-3">
                          <select
                            value={item.item_type}
                            onChange={(e) => updateBOMItem(index, 'item_type', e.target.value)}
                            className="w-20 px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="material">Material</option>
                            <option value="product">Product</option>
                          </select>
                        </td>
                        <td className="px-2 py-3">
                          {item.item_type === 'product' ? (
                            <SearchableSelect
                              options={products}
                              value={item.product_id}
                              onChange={(value) => updateBOMItem(index, 'product_id', value)}
                              placeholder="Select Product"
                              className="w-64"
                            />
                          ) : (
                            <SearchableSelect
                              options={materials}
                              value={item.material_id}
                              onChange={(value) => updateBOMItem(index, 'material_id', value)}
                              placeholder="Select Material"
                              className="w-64"
                            />
                          )}
                        </td>
                        <td className="px-2 py-3 text-xs text-gray-600">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {item.material_category || 'N/A'}
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateBOMItem(index, 'quantity', Number(e.target.value))}
                            min="0"
                            step="0.00000001"
                            className="w-24 px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-3">
                          <select
                            value={item.uom}
                            onChange={(e) => updateBOMItem(index, 'uom', e.target.value)}
                            className="w-16 px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          >
                            {uomOptions.map(uom => (
                              <option key={uom} value={uom}>
                                {uom}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-3 text-xs text-gray-900 font-medium">
                          {item.percentage.toFixed(1)}%
                        </td>
                        <td className="px-2 py-3 text-xs text-gray-900 font-medium">
                          <div 
                            className="px-2 py-1 bg-gray-50 rounded border border-gray-200"
                            title="Unit cost from material master data (read-only)"
                          >
                            Rp {item.unit_cost.toLocaleString('id-ID')}
                          </div>
                        </td>
                        <td className="px-2 py-3 text-xs text-gray-900 font-medium">
                          Rp {item.total_cost.toLocaleString('id-ID')}
                        </td>
                        <td className="px-2 py-3">
                          <input
                            type="number"
                            value={item.scrap_percent}
                            onChange={(e) => updateBOMItem(index, 'scrap_percent', Number(e.target.value))}
                            min="0"
                            max="100"
                            step="0.1"
                            className="w-12 px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-3">
                          <input
                            type="checkbox"
                            checked={item.is_critical}
                            onChange={(e) => updateBOMItem(index, 'is_critical', e.target.checked)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            onClick={() => removeBOMItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* BOM Summary */}
            {formData.items.length > 0 && (
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
                  <CubeIcon className="h-5 w-5 mr-2" />
                  BOM Cost Analysis
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="text-gray-600 text-sm">Total Components</span>
                    <div className="font-bold text-lg text-gray-900">{getTotalItems()}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="text-gray-600 text-sm">Critical Items</span>
                    <div className="font-bold text-lg text-red-600">{getCriticalItems()}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="text-gray-600 text-sm">Batch Size</span>
                    <div className="font-bold text-lg text-gray-900">{formData.batch_size} {formData.batch_uom}</div>
                    <div className="text-xs text-gray-500 mt-1">= {(formData.batch_size * formData.pack_per_carton).toFixed(0)} packs</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="text-gray-600 text-sm">Total Material Cost</span>
                    <div className="font-bold text-lg text-green-600">Rp {getTotalCost().toLocaleString('id-ID')}</div>
                    <div className="text-xs text-gray-500 mt-1">For {formData.batch_size} carton(s)</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm border-2 border-yellow-300">
                    <span className="text-gray-600 text-sm">HPP per Carton</span>
                    <div className="font-bold text-xl text-yellow-600">Rp {getHPP().toLocaleString('id-ID')}</div>
                    <div className="text-xs text-gray-500 mt-1">Cost per carton ({formData.pack_per_carton} packs)</div>
                  </div>
                </div>
                
                {/* Material Cost Breakdown */}
                <div className="mt-4 bg-white p-4 rounded-lg shadow-sm">
                  <h5 className="font-medium text-gray-900 mb-3">Material Cost Breakdown</h5>
                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{item.line_number}.</span>
                          <span className="text-sm font-medium text-gray-900">
                            {item.item_name || 'Unnamed Item'}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                            {item.material_category || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-600">
                            {item.quantity} {item.uom} × Rp {item.unit_cost.toLocaleString('id-ID')}
                          </span>
                          <span className="font-medium text-blue-600">
                            {item.percentage.toFixed(1)}%
                          </span>
                          <span className="font-bold text-green-600 min-w-[100px] text-right">
                            Rp {item.total_cost.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
              placeholder="Enter any additional notes about this BOM..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t-2 border-gray-300 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
            <button
              type="button"
              onClick={() => navigate('/app/products/boms')}
              className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium"
            >
              <X className="inline h-5 w-5 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={() => {
                console.log('Save button clicked!');
                console.log('Form data:', formData);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
            >
              <Save className="inline h-5 w-5 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update BOM' : 'Create BOM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BOMForm;
