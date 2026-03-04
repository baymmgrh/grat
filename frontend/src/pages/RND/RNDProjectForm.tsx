import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig';

interface User {
  id: number;
  full_name: string;
}

interface Product {
  id: number;
  code: string;
  name: string;
}

interface FormData {
  name: string;
  description: string;
  project_type: string;
  priority: string;
  target_product_id: number | null;
  target_product_code: string;
  target_product_name: string;
  start_date: string;
  target_completion_date: string;
  estimated_budget: string;
  project_leader_id: number | null;
}

const RNDProjectForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    project_type: 'new_product',
    priority: 'medium',
    target_product_id: null,
    target_product_code: '',
    target_product_name: '',
    start_date: new Date().toISOString().split('T')[0],
    target_completion_date: '',
    estimated_budget: '',
    project_leader_id: null
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  useEffect(() => {
    fetchUsers();
    if (isEdit) {
      fetchProject();
    }
  }, [id]);

  useEffect(() => {
    if (productSearch.length >= 2) {
      searchProducts();
    }
  }, [productSearch]);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/api/hr/employees');
      setUsers(response.data.employees || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/rnd/projects/${id}`);
      const project = response.data.project;
      
      setFormData({
        name: project.name || '',
        description: project.description || '',
        project_type: project.project_type || 'new_product',
        priority: project.priority || 'medium',
        target_product_id: project.target_product_id,
        target_product_code: project.target_product_code || '',
        target_product_name: project.target_product_name || '',
        start_date: project.start_date || '',
        target_completion_date: project.target_completion_date || '',
        estimated_budget: project.estimated_budget?.toString() || '',
        project_leader_id: project.project_leader_id
      });

      if (project.target_product_name) {
        setProductSearch(project.target_product_name);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async () => {
    try {
      const response = await axiosInstance.get(`/api/rnd/products?search=${productSearch}`);
      setProducts(response.data.products || []);
      setShowProductDropdown(true);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const handleProductSelect = (product: Product) => {
    setFormData({
      ...formData,
      target_product_id: product.id,
      target_product_code: product.code,
      target_product_name: product.name
    });
    setProductSearch(product.name);
    setShowProductDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Nama proyek harus diisi');
      return;
    }

    try {
      setSaving(true);
      
      const payload = {
        ...formData,
        estimated_budget: formData.estimated_budget ? parseFloat(formData.estimated_budget) : null
      };

      if (isEdit) {
        await axiosInstance.put(`/api/rnd/projects/${id}`, payload);
      } else {
        await axiosInstance.post('/api/rnd/projects', payload);
      }

      navigate('/app/rnd/projects');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal menyimpan proyek');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/app/rnd/projects')}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Proyek R&D' : 'Proyek R&D Baru'}
          </h1>
          <p className="text-gray-500">
            {isEdit ? 'Ubah informasi proyek' : 'Buat proyek penelitian baru'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Informasi Dasar</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Proyek <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan nama proyek"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Deskripsi proyek"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipe Proyek
              </label>
              <select
                value={formData.project_type}
                onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="new_product">Produk Baru</option>
                <option value="improvement">Perbaikan</option>
                <option value="cost_reduction">Reduksi Biaya</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioritas
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
                <option value="critical">Kritis</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Target Produk</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pilih Produk Existing
              </label>
              <input
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setFormData({ ...formData, target_product_id: null });
                }}
                onFocus={() => productSearch.length >= 2 && setShowProductDropdown(true)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Cari produk..."
              />
              {showProductDropdown && products.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-auto">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleProductSelect(product)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50"
                    >
                      <span className="font-medium">{product.code}</span>
                      <span className="text-gray-500 ml-2">{product.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Atau Kode Produk Baru
              </label>
              <input
                type="text"
                value={formData.target_product_code}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  target_product_code: e.target.value,
                  target_product_id: null 
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Kode produk baru"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Target Produk
              </label>
              <input
                type="text"
                value={formData.target_product_name}
                onChange={(e) => setFormData({ ...formData, target_product_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Nama produk target"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Timeline & Budget</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Selesai
              </label>
              <input
                type="date"
                value={formData.target_completion_date}
                onChange={(e) => setFormData({ ...formData, target_completion_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimasi Budget (Rp)
              </label>
              <input
                type="number"
                value={formData.estimated_budget}
                onChange={(e) => setFormData({ ...formData, estimated_budget: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Leader
              </label>
              <select
                value={formData.project_leader_id || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  project_leader_id: e.target.value ? parseInt(e.target.value) : null 
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Project Leader</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/app/rnd/projects')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEdit ? 'Simpan Perubahan' : 'Buat Proyek'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RNDProjectForm;
