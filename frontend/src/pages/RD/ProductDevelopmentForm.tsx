import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import {
  RocketLaunchIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface Project {
  id: number;
  project_number: string;
  project_name: string;
}

const ProductDevelopmentForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [formData, setFormData] = useState({
    project_id: '',
    name: '',
    category: 'consumer',
    description: '',
    target_market: '',
    development_stage: 'concept',
    estimated_launch_date: '',
    development_cost: 0,
    target_price: 0,
    key_features: '',
    competitive_advantage: '',
    technical_specifications: '',
    notes: ''
  });

  const categories = [
    { value: 'consumer', label: 'Consumer Products' },
    { value: 'industrial', label: 'Industrial Products' },
    { value: 'food_beverage', label: 'Food & Beverage' },
    { value: 'pharmaceutical', label: 'Pharmaceutical' },
    { value: 'cosmetics', label: 'Cosmetics' },
    { value: 'packaging', label: 'Packaging' },
    { value: 'other', label: 'Other' }
  ];

  const stages = [
    { value: 'concept', label: 'Concept' },
    { value: 'design', label: 'Design' },
    { value: 'prototype', label: 'Prototype' },
    { value: 'testing', label: 'Testing' },
    { value: 'production_ready', label: 'Production Ready' },
    { value: 'launched', label: 'Launched' }
  ];

  useEffect(() => {
    fetchProjects();
    if (isEdit && id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/api/rd/projects');
      const data = response.data;
      if (Array.isArray(data)) {
        setProjects(data);
      } else if (data?.projects) {
        setProjects(data.projects);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/rd/products/${id}`);
      const prod = response.data.product || response.data;
      setFormData({
        project_id: prod.project_id || '',
        name: prod.name || '',
        category: prod.category || 'consumer',
        description: prod.description || '',
        target_market: prod.target_market || '',
        development_stage: prod.development_stage || 'concept',
        estimated_launch_date: prod.estimated_launch_date?.split('T')[0] || '',
        development_cost: prod.development_cost || 0,
        target_price: prod.target_price || 0,
        key_features: prod.key_features || '',
        competitive_advantage: prod.competitive_advantage || '',
        technical_specifications: prod.technical_specifications || '',
        notes: prod.notes || ''
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Please enter product name');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        project_id: formData.project_id ? Number(formData.project_id) : null,
        development_cost: Number(formData.development_cost),
        target_price: Number(formData.target_price)
      };

      if (isEdit) {
        await api.put(`/api/rd/products/${id}`, payload);
        toast.success('Product updated successfully');
      } else {
        await api.post('/api/rd/products', payload);
        toast.success('Product created successfully');
      }
      navigate('/app/rd/products');
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.error || 'Failed to save product');
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/app/rd/products" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Product Development' : 'New Product Development'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isEdit ? 'Update product details' : 'Create a new product development'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <RocketLaunchIcon className="w-5 h-5 text-blue-600" />
            Product Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Research Project</label>
              <select name="project_id" value={formData.project_id} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                <option value="">Select Project (Optional)</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.project_number || p.id} - {p.project_name || 'Untitled'}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
              <select name="category" value={formData.category} onChange={handleChange} required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Enter product name"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Brief description"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Development Stage</label>
              <select name="development_stage" value={formData.development_stage} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                {stages.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Launch Date</label>
              <div className="relative">
                <CalendarDaysIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="date" name="estimated_launch_date" value={formData.estimated_launch_date} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Development Cost (Rp)</label>
              <div className="relative">
                <CurrencyDollarIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="number" name="development_cost" value={formData.development_cost} onChange={handleChange} min="0"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Price (Rp)</label>
              <div className="relative">
                <CurrencyDollarIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="number" name="target_price" value={formData.target_price} onChange={handleChange} min="0"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Market</label>
              <textarea name="target_market" value={formData.target_market} onChange={handleChange} rows={2} placeholder="Target market segments"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Key Features</label>
              <textarea name="key_features" value={formData.key_features} onChange={handleChange} rows={3} placeholder="Key features and benefits"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Competitive Advantage</label>
              <textarea name="competitive_advantage" value={formData.competitive_advantage} onChange={handleChange} rows={2} placeholder="What makes this product unique?"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Technical Specifications</label>
              <textarea name="technical_specifications" value={formData.technical_specifications} onChange={handleChange} rows={3} placeholder="Technical specs"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} placeholder="Additional notes"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link to="/app/rd/products"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </Link>
          <button type="submit" disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {saving ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Saving...</>
            ) : (
              <><RocketLaunchIcon className="w-5 h-5" /> {isEdit ? 'Update' : 'Create'} Product</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductDevelopmentForm;
