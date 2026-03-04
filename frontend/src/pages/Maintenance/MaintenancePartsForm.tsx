import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ExclamationTriangleIcon as AlertTriangle,
  CheckIcon as Save,
  CubeIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  PlusIcon as Plus,
  TrashIcon as Trash2
} from '@heroicons/react/24/outline';
interface PartsFormData {
  request_number: string;
  machine_id: number;
  requested_by: number;
  request_date: string;
  urgency: string;
  work_order_id: number;
  parts: PartItem[];
  justification: string;
  notes: string;
  status: string;
}

interface PartItem {
  id?: number;
  part_name: string;
  part_number: string;
  quantity_requested: number;
  quantity_approved: number;
  unit_cost: number;
  supplier: string;
  description: string;
  is_critical: boolean;
}

const MaintenancePartsForm: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<PartsFormData>({
    request_number: '',
    machine_id: 0,
    requested_by: 0,
    request_date: new Date().toISOString().split('T')[0],
    urgency: 'medium',
    work_order_id: 0,
    parts: [],
    justification: '',
    notes: '',
    status: 'pending'
  });

  const [machines, setMachines] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [availableParts, setAvailableParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const urgencyLevels = [
    { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    fetchMachines();
    fetchEmployees();
    fetchWorkOrders();
    fetchAvailableParts();
    if (isEdit && id) {
      fetchPartsRequest();
    }
  }, [id]);

  const fetchMachines = async () => {
    try {
      const response = await fetch('/api/production/machines', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMachines(data.machines || []);
      }
    } catch (error) {
      console.error('Failed to fetch machines:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/hr/employees', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchWorkOrders = async () => {
    try {
      const response = await fetch('/api/maintenance/work-orders?status=pending,in_progress', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWorkOrders(data.work_orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch work orders:', error);
    }
  };

  const fetchAvailableParts = async () => {
    try {
      const response = await fetch('/api/inventory/parts', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableParts(data.parts || []);
      }
    } catch (error) {
      console.error('Failed to fetch parts:', error);
    }
  };

  const fetchPartsRequest = async () => {
    try {
      const response = await fetch(`/api/maintenance/parts-requests/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData(data.parts_request);
      }
    } catch (error) {
      console.error('Failed to fetch parts request:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.parts.length === 0) {
      setError('Please add at least one part to the request');
      setLoading(false);
      return;
    }

    try {
      const url = isEdit ? `/api/maintenance/parts-requests/${id}` : '/api/maintenance/parts-requests';
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
        navigate('/app/maintenance/parts-requests');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save parts request');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addPart = () => {
    setFormData(prev => ({
      ...prev,
      parts: [...prev.parts, {
        part_name: '',
        part_number: '',
        quantity_requested: 1,
        quantity_approved: 0,
        unit_cost: 0,
        supplier: '',
        description: '',
        is_critical: false
      }]
    }));
  };

  const removePart = (index: number) => {
    setFormData(prev => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index)
    }));
  };

  const updatePart = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      parts: prev.parts.map((part, i) => 
        i === index ? { ...part, [field]: value } : part
      )
    }));
  };

  const selectFromInventory = (index: number, selectedPart: any) => {
    updatePart(index, 'part_name', selectedPart.name);
    updatePart(index, 'part_number', selectedPart.part_number);
    updatePart(index, 'unit_cost', selectedPart.unit_cost);
    updatePart(index, 'supplier', selectedPart.supplier);
    updatePart(index, 'description', selectedPart.description);
  };

  const calculateTotalCost = () => {
    return formData.parts.reduce((sum, part) => 
      sum + (part.quantity_requested * part.unit_cost), 0
    );
  };

  const getUrgencyColor = (urgency: string) => {
    const level = urgencyLevels.find(l => l.value === urgency);
    return level ? level.color : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Parts Request' : 'Create Parts Request'}
          </h1>
          <p className="text-gray-600">Request maintenance parts and supplies</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Request Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              <DocumentTextIcon className="inline h-4 w-4 mr-1" />
              Request Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Number
                </label>
                <input
                  type="text"
                  value={formData.request_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, request_number: e.target.value }))}
                  placeholder="Auto-generated if empty"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Date *
                </label>
                <input
                  type="date"
                  value={formData.request_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, request_date: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Machine *
                </label>
                <select
                  value={formData.machine_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, machine_id: parseInt(e.target.value) }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Machine</option>
                  {machines.map(machine => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name} - {machine.code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requested By *
                </label>
                <select
                  value={formData.requested_by}
                  onChange={(e) => setFormData(prev => ({ ...prev, requested_by: parseInt(e.target.value) }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} - {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency *
                </label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {urgencyLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Work Order
                </label>
                <select
                  value={formData.work_order_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, work_order_id: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Work Order (Optional)</option>
                  {workOrders.map(wo => (
                    <option key={wo.id} value={wo.id}>
                      {wo.work_order_number} - {wo.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Justification *
              </label>
              <textarea
                value={formData.justification}
                onChange={(e) => setFormData(prev => ({ ...prev, justification: e.target.value }))}
                required
                rows={3}
                placeholder="Explain why these parts are needed"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Parts List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                <CubeIcon className="inline h-4 w-4 mr-1" />
                Parts Required
              </h3>
              <button
                type="button"
                onClick={addPart}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus className="inline h-4 w-4 mr-1" />
                Add Part
              </button>
            </div>

            {formData.parts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CubeIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No parts added yet. Click "Add Part" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.parts.map((part, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Part #{index + 1}</h4>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={part.is_critical}
                            onChange={(e) => updatePart(index, 'is_critical', e.target.checked)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <span className="ml-2 text-sm text-red-600">Critical</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => removePart(index)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Part Name *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={part.part_name}
                            onChange={(e) => updatePart(index, 'part_name', e.target.value)}
                            required
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <select
                            onChange={(e) => {
                              const selectedPart = availableParts.find(p => p.id === parseInt(e.target.value));
                              if (selectedPart) selectFromInventory(index, selectedPart);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select from inventory</option>
                            {availableParts.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Part Number
                        </label>
                        <input
                          type="text"
                          value={part.part_number}
                          onChange={(e) => updatePart(index, 'part_number', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                        </label>
                        <input
                          type="text"
                          value={part.supplier}
                          onChange={(e) => updatePart(index, 'supplier', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity Requested *
                        </label>
                        <input
                          type="number"
                          value={part.quantity_requested}
                          onChange={(e) => updatePart(index, 'quantity_requested', parseInt(e.target.value) || 0)}
                          required
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('products.bom.unit_cost')}</label>
                        <input
                          type="number"
                          value={part.unit_cost}
                          onChange={(e) => updatePart(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('products.bom.total_cost')}</label>
                        <input
                          type="text"
                          value={`Rp ${(part.quantity_requested * part.unit_cost).toLocaleString()}`}
                          readOnly
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.description')}</label>
                      <textarea
                        value={part.description}
                        onChange={(e) => updatePart(index, 'description', e.target.value)}
                        rows={2}
                        placeholder="Additional details about this part"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cost Summary */}
          {formData.parts.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
                  <h4 className="text-sm font-medium text-blue-900">Cost Summary</h4>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-700">Total Estimated Cost</div>
                  <div className="text-lg font-bold text-blue-900">
                    Rp {calculateTotalCost().toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm text-blue-700">
                {formData.parts.filter(p => p.is_critical).length} critical parts, {formData.parts.length} total parts
              </div>
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Any additional information or special requirements"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/maintenance/parts-requests')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <X className="inline h-4 w-4 mr-2" />{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <Save className="inline h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update Request' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenancePartsForm;
