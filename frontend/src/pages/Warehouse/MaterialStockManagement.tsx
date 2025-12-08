import React, { useState, useEffect } from 'react';
import { PlusIcon, AdjustmentsHorizontalIcon, ClockIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import { useLanguage } from '../../contexts/LanguageContext';

interface Material {
  id: number;
  code: string;
  name: string;
  material_type: string;
  category: string;
  uom: string;
  cost_per_unit: number;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point: number;
  total_stock: number;
  available_stock: number;
  reserved_stock: number;
  status: string;
}

interface Location {
  id: number;
  location_code: string;
  name: string;
  location_type: string;
  warehouse_name: string;
}

const MaterialStockManagement: React.FC = () => {
  const { t } = useLanguage();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Add Stock Form
  const [addStockForm, setAddStockForm] = useState({
    material_id: 0,
    location_id: 0,
    quantity: '',
    batch_number: '',
    lot_number: '',
    production_date: '',
    expiry_date: '',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    loadMaterials();
    loadLocations();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/materials/inventory');
      setMaterials(response.data.materials || []);
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const response = await axiosInstance.get('/api/materials/locations');
      setLocations(response.data.locations || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handleAddStock = (material: Material) => {
    setSelectedMaterial(material);
    setAddStockForm({
      ...addStockForm,
      material_id: material.id
    });
    setShowAddStockModal(true);
  };

  const submitAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await axiosInstance.post('/api/materials/stock/add', addStockForm);
      
      alert('Stock added successfully!');
      setShowAddStockModal(false);
      setAddStockForm({
        material_id: 0,
        location_id: 0,
        quantity: '',
        batch_number: '',
        lot_number: '',
        production_date: '',
        expiry_date: '',
        reference: '',
        notes: ''
      });
      loadMaterials();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      in_stock: 'bg-green-100 text-green-800',
      low_stock: 'bg-yellow-100 text-yellow-800',
      reorder: 'bg-orange-100 text-orange-800',
      out_of_stock: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      in_stock: 'In Stock',
      low_stock: 'Low Stock',
      reorder: 'Reorder',
      out_of_stock: 'Out of Stock'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const filteredMaterials = materials.filter(m =>
    m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Material Stock Management</h1>
          <p className="text-gray-600 mt-1">Manage material inventory and stock levels</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search materials by code, name, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type / Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Stock
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reserved
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min Level
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="mt-2">Loading materials...</p>
                  </td>
                </tr>
              ) : filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No materials found
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{material.code}</div>
                        <div className="text-sm text-gray-500">{material.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{material.material_type}</div>
                      <div className="text-sm text-gray-500">{material.category}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {material.total_stock.toFixed(2)} {material.uom}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm text-gray-900">
                        {material.available_stock.toFixed(2)} {material.uom}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm text-gray-500">
                        {material.reserved_stock.toFixed(2)} {material.uom}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm text-gray-500">
                        {material.min_stock_level.toFixed(2)} {material.uom}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(material.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleAddStock(material)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Stock
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Stock Modal */}
      {showAddStockModal && selectedMaterial && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Add Stock - {selectedMaterial.code} ({selectedMaterial.name})
              </h3>
              <button
                onClick={() => setShowAddStockModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <form onSubmit={submitAddStock} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Location *
                  </label>
                  <select
                    required
                    value={addStockForm.location_id}
                    onChange={(e) => setAddStockForm({ ...addStockForm, location_id: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select Location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.location_code} - {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity * ({selectedMaterial.uom})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={addStockForm.quantity}
                    onChange={(e) => setAddStockForm({ ...addStockForm, quantity: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    value={addStockForm.batch_number}
                    onChange={(e) => setAddStockForm({ ...addStockForm, batch_number: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Lot Number
                  </label>
                  <input
                    type="text"
                    value={addStockForm.lot_number}
                    onChange={(e) => setAddStockForm({ ...addStockForm, lot_number: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Production Date
                  </label>
                  <input
                    type="date"
                    value={addStockForm.production_date}
                    onChange={(e) => setAddStockForm({ ...addStockForm, production_date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={addStockForm.expiry_date}
                    onChange={(e) => setAddStockForm({ ...addStockForm, expiry_date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reference
                  </label>
                  <input
                    type="text"
                    value={addStockForm.reference}
                    onChange={(e) => setAddStockForm({ ...addStockForm, reference: e.target.value })}
                    placeholder="PO Number, GRN, etc."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={addStockForm.notes}
                  onChange={(e) => setAddStockForm({ ...addStockForm, notes: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddStockModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialStockManagement;
