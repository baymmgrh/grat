import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import {
  CubeIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';

interface Project {
  id: number;
  project_number: string;
  project_name: string;
}

interface FormData {
  project_id: number | '';
  name: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  supplier: string;
  supplier_contact: string;
  requested_date: string;
  required_date: string;
  priority: string;
  purpose: string;
  specifications: string;
  notes: string;
}

const MaterialForm: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    project_id: '',
    name: '',
    category: 'chemicals',
    description: '',
    quantity: 1,
    unit: 'pcs',
    unit_cost: 0,
    supplier: '',
    supplier_contact: '',
    requested_date: new Date().toISOString().split('T')[0],
    required_date: '',
    priority: 'medium',
    purpose: '',
    specifications: '',
    notes: ''
  });

  const categories = [
    { value: 'chemicals', label: 'Chemicals' },
    { value: 'reagents', label: 'Reagents' },
    { value: 'raw_materials', label: 'Raw Materials' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'consumables', label: 'Consumables' },
    { value: 'packaging', label: 'Packaging' },
    { value: 'samples', label: 'Samples' },
    { value: 'other', label: 'Other' }
  ];

  const units = [
    { value: 'pcs', label: 'Pieces' },
    { value: 'kg', label: 'Kilogram' },
    { value: 'g', label: 'Gram' },
    { value: 'mg', label: 'Milligram' },
    { value: 'l', label: 'Liter' },
    { value: 'ml', label: 'Milliliter' },
    { value: 'box', label: 'Box' },
    { value: 'pack', label: 'Pack' },
    { value: 'roll', label: 'Roll' },
    { value: 'set', label: 'Set' }
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  useEffect(() => {
    fetchProjects();
    if (isEdit) {
      fetchMaterial();
    }
  }, [id]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/api/rd/projects');
      setProjects(response.data.projects || response.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchMaterial = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/rd/materials/${id}`);
      const mat = response.data.material || response.data;
      setFormData({
        project_id: mat.project_id || '',
        name: mat.name || '',
        category: mat.category || 'chemicals',
        description: mat.description || '',
        quantity: mat.quantity || 1,
        unit: mat.unit || 'pcs',
        unit_cost: mat.unit_cost || 0,
        supplier: mat.supplier || '',
        supplier_contact: mat.supplier_contact || '',
        requested_date: mat.requested_date?.split('T')[0] || '',
        required_date: mat.required_date?.split('T')[0] || '',
        priority: mat.priority || 'medium',
        purpose: mat.purpose || '',
        specifications: mat.specifications || '',
        notes: mat.notes || ''
      });
    } catch (error) {
      console.error('Error fetching material:', error);
      toast.error('Failed to load material');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Please enter material name');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        project_id: formData.project_id ? Number(formData.project_id) : null,
        quantity: Number(formData.quantity),
        unit_cost: Number(formData.unit_cost),
        total_cost: Number(formData.quantity) * Number(formData.unit_cost)
      };

      if (isEdit) {
        await api.put(`/api/rd/materials/${id}`, payload);
        toast.success('Material updated successfully');
      } else {
        await api.post('/api/rd/materials', payload);
        toast.success('Material request created successfully');
      }
      navigate('/app/rd/materials');
    } catch (error: any) {
      console.error('Error saving material:', error);
      toast.error(error.response?.data?.error || 'Failed to save material');
    } finally {
      setSaving(false);
    }
  };

  const totalCost = formData.quantity * formData.unit_cost;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/app/rd/materials"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Material Request' : 'New Material Request'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isEdit ? 'Update material request details' : 'Request materials for R&D projects'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CubeIcon className="w-5 h-5 text-orange-600" />
            Material Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Research Project
              </label>
              <select
                name="project_id"
                value={formData.project_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Project (Optional)</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.project_number} - {project.project_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Material Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Material Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter material name"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                placeholder="Brief description of the material"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleNumberChange}
                min="0.01"
                step="0.01"
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Unit
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {units.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>

            {/* Unit Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Unit Cost (Rp)
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="unit_cost"
                  value={formData.unit_cost}
                  onChange={handleNumberChange}
                  min="0"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Total Cost (Calculated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Cost
              </label>
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-lg font-semibold text-gray-900 dark:text-white">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalCost)}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {priorities.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Required Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Required By Date
              </label>
              <div className="relative">
                <CalendarDaysIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  name="required_date"
                  value={formData.required_date}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Supplier Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BuildingStorefrontIcon className="w-5 h-5 text-blue-600" />
            Supplier Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Supplier Name
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="Enter supplier name"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Supplier Contact
              </label>
              <input
                type="text"
                name="supplier_contact"
                value={formData.supplier_contact}
                onChange={handleChange}
                placeholder="Phone or email"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Additional Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Purpose / Intended Use
              </label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                rows={2}
                placeholder="What will this material be used for?"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Specifications / Requirements
              </label>
              <textarea
                name="specifications"
                value={formData.specifications}
                onChange={handleChange}
                rows={3}
                placeholder="Technical specifications, purity requirements, etc."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                placeholder="Any additional notes..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            to="/app/rd/materials"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <CubeIcon className="w-5 h-5" />
                {isEdit ? 'Update Request' : 'Submit Request'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MaterialForm;
