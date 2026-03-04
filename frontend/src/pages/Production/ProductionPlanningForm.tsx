import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import { 
  ClipboardDocumentListIcon, 
  CubeIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

interface Product {
  id: number;
  code: string;
  name: string;
  primary_uom: string;
  is_producible: boolean;
}

interface Machine {
  id: number;
  code: string;
  name: string;
  status: string;
}

interface SalesForecast {
  id: number;
  forecast_number: string;
  name: string;
  product_name: string;
  period_start: string;
  period_end: string;
  most_likely: number;
}

interface ProductionPlanFormData {
  plan_number: string;
  plan_name: string;
  plan_type: string;
  period_start: string;
  period_end: string;
  sales_forecast_id: number | null;
  based_on: string;
  product_id: number | null;
  planned_quantity: number;
  uom: string;
  machine_id: number | null;
  estimated_duration_hours: number;
  required_operators: number;
  status: string;
  priority: string;
  notes: string;
}

const ProductionPlanningForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState<ProductionPlanFormData>({
    plan_number: '',
    plan_name: '',
    plan_type: 'weekly',
    period_start: '',
    period_end: '',
    sales_forecast_id: null,
    based_on: 'manual',
    product_id: null,
    planned_quantity: 0,
    uom: '',
    machine_id: null,
    estimated_duration_hours: 0,
    required_operators: 1,
    status: 'draft',
    priority: 'normal',
    notes: ''
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [forecasts, setForecasts] = useState<SalesForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bomData, setBomData] = useState<any>(null);
  const [loadingBOM, setLoadingBOM] = useState(false);
  const [showMaterialDetails, setShowMaterialDetails] = useState(false);

  useEffect(() => {
    fetchDropdownData();
    if (isEditMode) {
      fetchPlanData();
    }
  }, [id]);

  const fetchDropdownData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [productsRes, machinesRes, forecastsRes] = await Promise.all([
        axiosInstance.get('/api/production-planning/products'),
        axiosInstance.get('/api/production/machines'),
        axiosInstance.get('/api/production-planning/forecasts')
      ]);

      setProducts(productsRes.data.products || []);
      setMachines(machinesRes.data.machines || []);
      setForecasts(forecastsRes.data.forecasts || []);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  const fetchPlanData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstance.get(`/api/production-planning/production-plans/${id}`);

      const plan = response.data.plan;
      setFormData({
        plan_number: plan.plan_number,
        plan_name: plan.plan_name,
        plan_type: plan.plan_type,
        period_start: plan.period_start,
        period_end: plan.period_end,
        sales_forecast_id: plan.sales_forecast_id,
        based_on: plan.based_on,
        product_id: plan.product_id,
        planned_quantity: plan.planned_quantity,
        uom: plan.uom,
        machine_id: plan.machine_id,
        estimated_duration_hours: plan.estimated_duration_hours || 0,
        required_operators: plan.required_operators || 1,
        status: plan.status,
        priority: plan.priority,
        notes: plan.notes || ''
      });
    } catch (err) {
      setError('Failed to load plan data');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['planned_quantity', 'estimated_duration_hours', 'required_operators'].includes(name)
        ? Number(value)
        : value
    }));
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = Number(e.target.value);
    const product = products.find(p => p.id === productId);
    
    setFormData(prev => ({
      ...prev,
      product_id: productId,
      uom: product?.primary_uom || prev.uom
    }));

    // Fetch BOM for selected product
    if (productId) {
      fetchBOMForProduct(productId);
    } else {
      setBomData(null);
    }
  };

  const fetchBOMForProduct = async (productId: number) => {
    try {
      setLoadingBOM(true);
      const response = await axiosInstance.get(`/api/boms?product_id=${productId}`);
      const data = response.data;
      const activeBOM = data.boms?.find((b: any) => b.product_id === productId && b.is_active);
      
      if (activeBOM) {
        const bomDetailResponse = await axiosInstance.get(`/api/boms/${activeBOM.id}`);
        setBomData(bomDetailResponse.data.bom);
        setShowMaterialDetails(true);
      } else {
        setBomData(null);
      }
    } catch (error) {
      console.error('Error fetching BOM:', error);
    } finally {
      setLoadingBOM(false);
    }
  };

  const calculateMaterialRequirement = (bomItemQty: number) => {
    if (!bomData || !formData.planned_quantity) return 0;
    const batches = formData.planned_quantity / bomData.batch_size;
    return bomItemQty * batches;
  };

  const formatNumber = (num: number, decimals: number = 4) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    }).format(num);
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleForecastChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const forecastId = Number(e.target.value);
    const forecast = forecasts.find(f => f.id === forecastId);
    
    if (forecast) {
      setFormData(prev => ({
        ...prev,
        sales_forecast_id: forecastId,
        based_on: 'forecast',
        period_start: forecast.period_start,
        period_end: forecast.period_end,
        planned_quantity: forecast.most_likely
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (isEditMode) {
        await axiosInstance.put(`/api/production-planning/production-plans/${id}`, formData);
        alert('Production plan updated successfully!');
      } else {
        await axiosInstance.post('/api/production-planning/production-plans', formData);
        alert('Production plan created successfully!');
      }

      navigate('/app/production/planning');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save production plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Production Plan' : 'Create Production Plan'}
        </h1>
        <p className="text-gray-600">Master Production Schedule (MPS)</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        {/* Basic Information */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Number
              </label>
              <input
                type="text"
                name="plan_number"
                value={formData.plan_number}
                onChange={handleInputChange}
                placeholder="Auto-generated if empty"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="plan_name"
                value={formData.plan_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Type
              </label>
              <select
                name="plan_type"
                value={formData.plan_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Based On
              </label>
              <select
                name="based_on"
                value={formData.based_on}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="manual">Manual</option>
                <option value="forecast">Sales Forecast</option>
                <option value="sales_order">Sales Order</option>
                <option value="both">Forecast + Sales Order</option>
              </select>
            </div>
          </div>
        </div>

        {/* Forecast Selection */}
        {formData.based_on.includes('forecast') && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Forecast</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Forecast
              </label>
              <select
                value={formData.sales_forecast_id || ''}
                onChange={handleForecastChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Forecast --</option>
                {forecasts.map(forecast => (
                  <option key={forecast.id} value={forecast.id}>
                    {forecast.forecast_number} - {forecast.name} ({forecast.product_name}) - {forecast.most_likely} units
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Planning Period */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Planning Period</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period Start <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="period_start"
                value={formData.period_start}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period End <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="period_end"
                value={formData.period_end}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Product & Quantity */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Product & Quantity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.product_id || ''}
                onChange={handleProductChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Product --</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.code} - {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Planned Quantity <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="planned_quantity"
                  value={formData.planned_quantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="uom"
                  value={formData.uom}
                  onChange={handleInputChange}
                  placeholder="UOM"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* BOM Material Requirements */}
        {formData.product_id && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CubeIcon className="h-5 w-5" />
              Material Requirements (BOM)
            </h2>
            
            {loadingBOM ? (
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Loading BOM data...</p>
              </div>
            ) : bomData ? (
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                {/* BOM Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">
                        BOM Available: {bomData.bom_number} (v{bomData.version})
                      </p>
                      <p className="text-sm text-green-700">
                        Batch Size: {bomData.batch_size} {bomData.batch_uom} | 
                        Materials: {bomData.items?.length || 0} items | 
                        Cost: {formatRupiah(bomData.total_cost)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMaterialDetails(!showMaterialDetails)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    {showMaterialDetails ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>

                {/* Material Details Table */}
                {showMaterialDetails && bomData.items && bomData.items.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Per Batch</th>
                          {formData.planned_quantity > 0 && (
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Required</th>
                          )}
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Scrap %</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bomData.items.map((item: any) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">
                              <div className="font-medium text-gray-900">{item.material_name}</div>
                              <div className="text-gray-500 text-xs">{item.material_code}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {formatNumber(item.quantity)} {item.uom}
                            </td>
                            {formData.planned_quantity > 0 && (
                              <td className="px-4 py-3 text-sm text-right font-bold text-blue-700">
                                {formatNumber(calculateMaterialRequirement(item.quantity))} {item.uom}
                              </td>
                            )}
                            <td className="px-4 py-3 text-sm text-right">
                              {item.scrap_percent}%
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {formatRupiah(item.total_cost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Cost Summary */}
                    {formData.planned_quantity > 0 && (
                      <div className="bg-blue-50 px-4 py-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-blue-900">
                            Estimated Total Material Cost:
                          </span>
                          <span className="text-lg font-bold text-blue-900">
                            {formatRupiah((bomData.total_cost / bomData.batch_size) * formData.planned_quantity)}
                          </span>
                        </div>
                        <p className="text-xs text-blue-700 mt-1">
                          Based on {(formData.planned_quantity / bomData.batch_size).toFixed(2)} batches
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Planning Alert */}
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Capacity Planning:</strong> Ensure material availability and production capacity 
                    before releasing this plan. Check inventory levels and procurement lead times.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    <strong>No BOM Available</strong> - This product doesn't have an active BOM. 
                    Material requirements cannot be calculated automatically.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resources */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Machine
              </label>
              <select
                name="machine_id"
                value={formData.machine_id || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Machine --</option>
                {machines.map(machine => (
                  <option key={machine.id} value={machine.id}>
                    {machine.code} - {machine.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration (hours)
              </label>
              <input
                type="number"
                name="estimated_duration_hours"
                value={formData.estimated_duration_hours}
                onChange={handleInputChange}
                min="0"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Operators
              </label>
              <input
                type="number"
                name="required_operators"
                value={formData.required_operators}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Status & Priority */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status & Priority</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="released">Released</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/app/production/planning')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Saving...' : isEditMode ? 'Update Plan' : 'Create Plan'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductionPlanningForm;
