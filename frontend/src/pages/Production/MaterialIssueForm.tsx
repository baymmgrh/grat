import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  CubeIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  HashtagIcon,
  MapPinIcon,
  PlusIcon,
  BookmarkIcon,
  TrashIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
interface WorkOrder {
  id: number;
  wo_number: string;
  product: {
    name: string;
    code: string;
  };
  status: string;
}

interface Material {
  id: number;
  name: string;
  code: string;
  uom: string;
}

interface Location {
  id: number;
  location_code: string;
  zone: {
    name: string;
  };
}

interface IssueItem {
  line_number: number;
  material_id: number | null;
  description: string;
  required_quantity: number;
  uom: string;
  warehouse_location_id: number | null;
  batch_number: string;
  notes: string;
}

interface MaterialIssueFormData {
  work_order_id: number;
  issue_date: string;
  required_date: string;
  issue_type: string;
  priority: string;
  department: string;
  cost_center: string;
  notes: string;
  special_instructions: string;
  items: IssueItem[];
}

const MaterialIssueForm: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<MaterialIssueFormData>({
    work_order_id: 0,
    issue_date: new Date().toISOString().split('T')[0],
    required_date: '',
    issue_type: 'production',
    priority: 'normal',
    department: '',
    cost_center: '',
    notes: '',
    special_instructions: '',
    items: [{
      line_number: 1,
      material_id: null,
      description: '',
      required_quantity: 0,
      uom: '',
      warehouse_location_id: null,
      batch_number: '',
      notes: ''
    }]
  });

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const issueTypes = [
    { value: 'production', label: t('navigation.production') },
    { value: 'maintenance', label: t('navigation.maintenance') },
    { value: 'rework', label: 'Rework' },
    { value: 'sample', label: 'Sample/Testing' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-gray-600' },
    { value: 'normal', label: 'Normal', color: 'text-blue-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
  ];

  useEffect(() => {
    fetchWorkOrders();
    fetchMaterials();
    fetchLocations();
    if (isEdit) {
      fetchMaterialIssue();
    }
  }, [id]);

  const fetchWorkOrders = async () => {
    try {
      const response = await fetch('/api/production/work-orders?status=released,in_progress', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setWorkOrders(data.work_orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch work orders:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/materials', {
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

  const fetchMaterialIssue = async () => {
    try {
      const response = await fetch(`/api/production/material-issues/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          work_order_id: data.work_order_id,
          issue_date: data.issue_date.split('T')[0],
          required_date: data.required_date ? data.required_date.split('T')[0] : '',
          issue_type: data.issue_type,
          priority: data.priority,
          department: data.department || '',
          cost_center: data.cost_center || '',
          notes: data.notes || '',
          special_instructions: data.special_instructions || '',
          items: data.items || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch material issue:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.items.length === 0) {
      setError('At least one item is required');
      setLoading(false);
      return;
    }

    const hasEmptyItems = formData.items.some(item => 
      !item.description.trim() || item.required_quantity <= 0
    );

    if (hasEmptyItems) {
      setError('All items must have description and quantity greater than 0');
      setLoading(false);
      return;
    }

    try {
      const url = isEdit 
        ? `/api/production/material-issues/${id}` 
        : '/api/production/material-issues';
      
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
        navigate('/app/production/material-issues');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save material issue');
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
      [name]: name === 'work_order_id' ? Number(value) : value
    }));
  };

  const handleItemChange = (index: number, field: keyof IssueItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = {
            ...item,
            [field]: ['material_id', 'warehouse_location_id', 'required_quantity', 'line_number'].includes(field)
              ? (value === '' ? (field.includes('_id') ? null : 0) : Number(value))
              : value
          };

          // Auto-fill UOM when material is selected
          if (field === 'material_id' && value) {
            const selectedMaterial = materials.find(m => m.id === Number(value));
            if (selectedMaterial) {
              updatedItem.uom = selectedMaterial.uom;
              updatedItem.description = selectedMaterial.name;
            }
          }

          return updatedItem;
        }
        return item;
      })
    }));
  };

  const addItem = () => {
    const newLineNumber = Math.max(...formData.items.map(item => item.line_number)) + 1;
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        line_number: newLineNumber,
        material_id: null,
        description: '',
        required_quantity: 0,
        uom: '',
        warehouse_location_id: null,
        batch_number: '',
        notes: ''
      }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const selectedWorkOrder = workOrders.find(wo => wo.id === formData.work_order_id);
  const getTotalItems = () => formData.items.length;
  const getTotalQuantity = () => formData.items.reduce((sum, item) => sum + (item.required_quantity || 0), 0);

  const getMinRequiredDate = () => {
    const issueDate = new Date(formData.issue_date);
    return issueDate.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Material Issue' : 'New Material Issue'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update material issue request' : 'Create material issue request for production'}
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

          {/* Issue Header Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Issue Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DocumentTextIcon className="inline h-4 w-4 mr-1" />
                  Work Order *
                </label>
                <select
                  name="work_order_id"
                  value={formData.work_order_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Work Order</option>
                  {workOrders.map(wo => (
                    <option key={wo.id} value={wo.id}>
                      {wo.wo_number} - {wo.product.name}
                    </option>
                  ))}
                </select>
                {selectedWorkOrder && (
                  <p className="mt-1 text-sm text-gray-500">
                    Product: {selectedWorkOrder.product.code} - {selectedWorkOrder.product.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Type *
                </label>
                <select
                  name="issue_type"
                  value={formData.issue_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {issueTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="inline h-4 w-4 mr-1" />
                  Issue Date *
                </label>
                <input
                  type="date"
                  name="issue_date"
                  value={formData.issue_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Date
                </label>
                <input
                  type="date"
                  name="required_date"
                  value={formData.required_date}
                  onChange={handleInputChange}
                  min={getMinRequiredDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ExclamationTriangleIcon className="inline h-4 w-4 mr-1" />
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserIcon className="inline h-4 w-4 mr-1" />
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter department"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Center
                </label>
                <input
                  type="text"
                  name="cost_center"
                  value={formData.cost_center}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter cost center"
                />
              </div>
            </div>
          </div>

          {/* Material Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Material Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PlusIcon className="inline h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      <HashtagIcon className="inline h-4 w-4 mr-1" />
                      Line {item.line_number}
                    </h4>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <CubeIcon className="inline h-4 w-4 mr-1" />{t('products.bom.material')}</label>
                      <select
                        value={item.material_id || ''}
                        onChange={(e) => handleItemChange(index, 'material_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Material</option>
                        {materials.map(material => (
                          <option key={material.id} value={material.id}>
                            {material.code} - {material.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <MapPinIcon className="inline h-4 w-4 mr-1" />
                      </label>
                      <select
                        value={item.warehouse_location_id || ''}
                        onChange={(e) => handleItemChange(index, 'warehouse_location_id', e.target.value)}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      required
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter material description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Required Quantity *
                      </label>
                      <input
                        type="number"
                        value={item.required_quantity}
                        onChange={(e) => handleItemChange(index, 'required_quantity', e.target.value)}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit of Measure
                      </label>
                      <input
                        type="text"
                        value={item.uom}
                        onChange={(e) => handleItemChange(index, 'uom', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Kg, Liter, Pcs"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Batch Number
                      </label>
                      <input
                        type="text"
                        value={item.batch_number}
                        onChange={(e) => handleItemChange(index, 'batch_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter batch number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Notes
                    </label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter notes for this item"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-900">Total Items</div>
                  <div className="text-blue-600">{getTotalItems()}</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">Total Quantity</div>
                  <div className="text-blue-600">{getTotalQuantity().toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="inline h-4 w-4 mr-1" />
                General Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter general notes about the material issue..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions
              </label>
              <textarea
                name="special_instructions"
                value={formData.special_instructions}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter special handling or delivery instructions..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/production/material-issues')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <XMarkIcon className="inline h-4 w-4 mr-2" />{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BookmarkIcon className="inline h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update Issue' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaterialIssueForm;
