import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import {
  DocumentDuplicateIcon,
  ArrowLeftIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const documentTypes = [
  { value: 'surat_jalan', label: 'Surat Jalan' },
  { value: 'spk', label: 'Surat Perintah Kerja' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'purchase_order', label: 'Purchase Order' },
  { value: 'delivery_note', label: 'Delivery Note' },
  { value: 'work_order', label: 'Work Order' },
  { value: 'quotation', label: 'Quotation' },
  { value: 'receipt', label: 'Receipt' }
];

const paperSizes = ['A4', 'A5', 'Letter', 'Legal'];
const orientations = ['portrait', 'landscape'];

export default function TemplateForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    template_name: '',
    template_code: '',
    document_type: 'surat_jalan',
    paper_size: 'A4',
    orientation: 'portrait',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    font_family: 'Arial',
    font_size: 10,
    header_template: '',
    footer_template: '',
    template_structure: '',
    custom_css: '',
    is_default: false,
    is_active: true
  });

  useEffect(() => {
    if (isEdit) {
      loadTemplate();
    }
  }, [id]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/documents/templates/${id}`);
      const template = response.data.template;
      setFormData({
        template_name: template.template_name || '',
        template_code: template.template_code || '',
        document_type: template.document_type || 'surat_jalan',
        paper_size: template.paper_size || 'A4',
        orientation: template.orientation || 'portrait',
        margins: template.margins || { top: 20, right: 20, bottom: 20, left: 20 },
        font_family: template.font_family || 'Arial',
        font_size: template.font_size || 10,
        header_template: template.header_template || '',
        footer_template: template.footer_template || '',
        template_structure: typeof template.template_structure === 'string' 
          ? template.template_structure 
          : JSON.stringify(template.template_structure, null, 2),
        custom_css: template.custom_css || '',
        is_default: template.is_default || false,
        is_active: template.is_active !== false
      });
    } catch (error) {
      toast.error('Failed to load template');
      navigate('/app/documents/templates');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else if (name.startsWith('margin_')) {
      const marginKey = name.replace('margin_', '');
      setFormData(prev => ({
        ...prev,
        margins: {
          ...prev.margins,
          [marginKey]: parseInt(value) || 0
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const generateTemplateCode = () => {
    const typePrefix = formData.document_type.toUpperCase().substring(0, 3);
    const timestamp = Date.now().toString().slice(-4);
    return `TPL-${typePrefix}-${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.template_name) {
      toast.error('Template name is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        template_code: formData.template_code || generateTemplateCode(),
        template_structure: formData.template_structure 
          ? JSON.parse(formData.template_structure) 
          : { sections: [] }
      };

      if (isEdit) {
        await axiosInstance.put(`/api/documents/templates/${id}`, payload);
        toast.success('Template updated successfully');
      } else {
        await axiosInstance.post('/api/documents/templates', payload);
        toast.success('Template created successfully');
      }
      
      navigate('/app/documents/templates');
    } catch (error: any) {
      console.error('Error saving template:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to save template');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/documents/templates')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <DocumentDuplicateIcon className="h-8 w-8" />
              {isEdit ? 'Edit Template' : 'New Template'}
            </h1>
            <p className="text-purple-100 mt-1">
              {isEdit ? 'Modify document template settings' : 'Create a new document template'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                name="template_name"
                value={formData.template_name}
                onChange={handleChange}
                placeholder="e.g., Standard Surat Jalan"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Code
              </label>
              <input
                type="text"
                name="template_code"
                value={formData.template_code}
                onChange={handleChange}
                placeholder="Auto-generated if empty"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type *
              </label>
              <select
                name="document_type"
                value={formData.document_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {documentTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-6 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_default"
                  checked={formData.is_default}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Set as default template</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>
        </div>

        {/* Page Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Page Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paper Size
              </label>
              <select
                name="paper_size"
                value={formData.paper_size}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {paperSizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orientation
              </label>
              <select
                name="orientation"
                value={formData.orientation}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {orientations.map(orient => (
                  <option key={orient} value={orient}>{orient.charAt(0).toUpperCase() + orient.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Family
              </label>
              <select
                name="font_family"
                value={formData.font_family}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size (pt)
              </label>
              <input
                type="number"
                name="font_size"
                value={formData.font_size}
                onChange={handleChange}
                min={8}
                max={24}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Margins */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Margins (mm)
            </label>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Top</label>
                <input
                  type="number"
                  name="margin_top"
                  value={formData.margins.top}
                  onChange={handleChange}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Right</label>
                <input
                  type="number"
                  name="margin_right"
                  value={formData.margins.right}
                  onChange={handleChange}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Bottom</label>
                <input
                  type="number"
                  name="margin_bottom"
                  value={formData.margins.bottom}
                  onChange={handleChange}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Left</label>
                <input
                  type="number"
                  name="margin_left"
                  value={formData.margins.left}
                  onChange={handleChange}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Header & Footer */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Header & Footer</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Header Template (HTML)
              </label>
              <textarea
                name="header_template"
                value={formData.header_template}
                onChange={handleChange}
                rows={4}
                placeholder="<div class='header'>Company Name</div>"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Footer Template (HTML)
              </label>
              <textarea
                name="footer_template"
                value={formData.footer_template}
                onChange={handleChange}
                rows={4}
                placeholder="<div class='footer'>Page {page} of {pages}</div>"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Template Structure */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Structure (JSON)</h2>
          
          <textarea
            name="template_structure"
            value={formData.template_structure}
            onChange={handleChange}
            rows={10}
            placeholder='{"sections": [{"type": "header", "content": "..."}, {"type": "table", "fields": [...]}]}'
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-2">
            Define the document structure in JSON format. Leave empty for default structure.
          </p>
        </div>

        {/* Custom CSS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom CSS</h2>
          
          <textarea
            name="custom_css"
            value={formData.custom_css}
            onChange={handleChange}
            rows={6}
            placeholder=".header { font-weight: bold; }&#10;.table { border-collapse: collapse; }"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/app/documents/templates')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckIcon className="h-5 w-5 mr-2" />
                {isEdit ? 'Update Template' : 'Create Template'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
