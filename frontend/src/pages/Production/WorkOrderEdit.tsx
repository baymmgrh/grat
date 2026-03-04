import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';

interface Product {
  id: number;
  name: string;
  code: string;
  primary_uom: string;
}

interface Machine {
  id: number;
  name: string;
  code: string;
}

interface WorkOrder {
  id: number;
  wo_number: string;
  product_id: number;
  product_name: string;
  quantity: number;
  uom: string;
  machine_id: number | null;
  machine_name: string | null;
  status: string;
  priority: string;
  scheduled_start_date: string | null;
  scheduled_end_date: string | null;
  notes: string | null;
}

export default function WorkOrderEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    uom: '',
    machine_id: '',
    priority: 'normal',
    status: '',
    scheduled_start_date: '',
    scheduled_end_date: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [woRes, productsRes, machinesRes] = await Promise.all([
        axiosInstance.get(`/api/production/work-orders/${id}`),
        axiosInstance.get('/api/products-new/?per_page=1000'),
        axiosInstance.get('/api/production/machines')
      ]);
      
      const wo = woRes.data.work_order;
      setWorkOrder(wo);
      // Map products-new fields to expected format
      const mappedProducts = (productsRes.data.products || []).map((p: any) => ({
        id: p.id,
        code: p.kode_produk || p.code,
        name: p.nama_produk || p.name,
        primary_uom: p.satuan || p.primary_uom || 'pcs',
      }));
      setProducts(mappedProducts);
      setMachines(machinesRes.data.machines || []);
      
      // Populate form
      setFormData({
        product_id: wo.product_id?.toString() || '',
        quantity: wo.quantity?.toString() || '',
        uom: wo.uom || '',
        machine_id: wo.machine_id?.toString() || '',
        priority: wo.priority || 'normal',
        status: wo.status || 'planned',
        scheduled_start_date: wo.scheduled_start_date ? wo.scheduled_start_date.split('T')[0] : '',
        scheduled_end_date: wo.scheduled_end_date ? wo.scheduled_end_date.split('T')[0] : '',
        notes: wo.notes || '',
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data Work Order');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-set UOM when product changes
      if (field === 'product_id') {
        const product = products.find(p => p.id === parseInt(value));
        if (product) {
          updated.uom = product.primary_uom || 'pcs';
        }
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_id || !formData.quantity) {
      toast.error('Produk dan Quantity wajib diisi');
      return;
    }
    
    try {
      setSaving(true);
      
      await axiosInstance.put(`/api/production/work-orders/${id}`, {
        product_id: parseInt(formData.product_id),
        quantity: parseFloat(formData.quantity),
        uom: formData.uom,
        machine_id: formData.machine_id ? parseInt(formData.machine_id) : null,
        priority: formData.priority,
        status: formData.status,
        scheduled_start_date: formData.scheduled_start_date || null,
        scheduled_end_date: formData.scheduled_end_date || null,
        notes: formData.notes || null,
        force: true // Allow editing even if in_progress
      });
      
      toast.success('Work Order berhasil diupdate');
      navigate(`/app/production/work-orders/${id}`);
    } catch (error: any) {
      console.error('Error updating work order:', error);
      toast.error(error.response?.data?.error || 'Gagal update Work Order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Work Order tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to={`/app/production/work-orders/${id}`}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Work Order</h1>
          <p className="text-gray-600">{workOrder.wo_number}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        {/* Product & Quantity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Produk *
            </label>
            <select
              value={formData.product_id}
              onChange={(e) => handleChange('product_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Pilih Produk</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.code} - {product.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UOM
              </label>
              <input
                type="text"
                value={formData.uom}
                onChange={(e) => handleChange('uom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="pcs"
              />
            </div>
          </div>
        </div>

        {/* Machine & Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mesin
            </label>
            <select
              value={formData.machine_id}
              onChange={(e) => handleChange('machine_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Pilih Mesin</option>
              {machines.map(machine => (
                <option key={machine.id} value={machine.id}>
                  {machine.code} - {machine.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="planned">Planned</option>
            <option value="released">Released</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={formData.scheduled_start_date}
              onChange={(e) => handleChange('scheduled_start_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Selesai
            </label>
            <input
              type="date"
              value={formData.scheduled_end_date}
              onChange={(e) => handleChange('scheduled_end_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Catatan tambahan..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Link
            to={`/app/production/work-orders/${id}`}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Menyimpan...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
