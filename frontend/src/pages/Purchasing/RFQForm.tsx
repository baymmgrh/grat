import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  CalendarIcon as Calendar,
  CheckIcon as Save,
  CubeIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  HashtagIcon as Hash,
  PlusIcon as Plus,
  TrashIcon as Trash2
} from '@heroicons/react/24/outline';
interface Product {
  id: number;
  name: string;
  code: string;
  primary_uom: string;
}

interface RFQItem {
  id?: number;
  line_number: number;
  product_id: number | null;
  description: string;
  quantity: number;
  uom: string;
  required_date: string;
  specifications: string;
}

interface RFQFormData {
  title: string;
  description: string;
  issue_date: string;
  closing_date: string;
  items: RFQItem[];
}

const RFQForm: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<RFQFormData>({
    title: '',
    description: '',
    issue_date: new Date().toISOString().split('T')[0],
    closing_date: '',
    items: [
      {
        line_number: 1,
        product_id: null,
        description: '',
        quantity: 0,
        uom: '',
        required_date: '',
        specifications: ''
      }
    ]
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
    if (isEdit) {
      fetchRFQ();
    }
  }, [id]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchRFQ = async () => {
    try {
      const response = await fetch(`/api/purchasing/rfqs/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          title: data.title,
          description: data.description || '',
          issue_date: data.issue_date,
          closing_date: data.closing_date,
          items: data.items || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch RFQ:', error);
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
      !item.description.trim() || item.quantity <= 0
    );

    if (hasEmptyItems) {
      setError('All items must have description and quantity greater than 0');
      setLoading(false);
      return;
    }

    try {
      const url = isEdit 
        ? `/api/purchasing/rfqs/${id}` 
        : '/api/purchasing/rfqs';
      
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
        navigate('/app/purchasing/rfqs');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save RFQ');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index: number, field: keyof RFQItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index 
          ? { 
              ...item, 
              [field]: field === 'product_id' || field === 'quantity' || field === 'line_number'
                ? (value === '' ? (field === 'product_id' ? null : 0) : Number(value))
                : value
            }
          : item
      )
    }));

    // Auto-fill UOM when product is selected
    if (field === 'product_id' && value) {
      const selectedProduct = products.find(p => p.id === Number(value));
      if (selectedProduct) {
        setFormData(prev => ({
          ...prev,
          items: prev.items.map((item, i) => 
            i === index 
              ? { ...item, uom: selectedProduct.primary_uom }
              : item
          )
        }));
      }
    }
  };

  const addItem = () => {
    const newLineNumber = Math.max(...formData.items.map(item => item.line_number)) + 1;
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        line_number: newLineNumber,
        product_id: null,
        description: '',
        quantity: 0,
        uom: '',
        required_date: '',
        specifications: ''
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

  const getMinClosingDate = () => {
    const issueDate = new Date(formData.issue_date);
    issueDate.setDate(issueDate.getDate() + 1);
    return issueDate.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Request for Quotation' : 'New Request for Quotation'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update RFQ details and items' : 'Create new RFQ to request supplier quotations'}
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

          {/* RFQ Header Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              RFQ Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="inline h-4 w-4 mr-1" />
                RFQ Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter RFQ title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.description')}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter RFQ description and requirements..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
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
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Closing Date *
                </label>
                <input
                  type="date"
                  name="closing_date"
                  value={formData.closing_date}
                  onChange={handleInputChange}
                  required
                  min={getMinClosingDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* RFQ Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">RFQ Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus className="inline h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      <Hash className="inline h-4 w-4 mr-1" />
                      Line {item.line_number}
                    </h4>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <CubeIcon className="inline h-4 w-4 mr-1" />{t('production.product')}</label>
                      <select
                        value={item.product_id || ''}
                        onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Product (Optional)</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.code} - {product.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Required Date
                      </label>
                      <input
                        type="date"
                        value={item.required_date}
                        onChange={(e) => handleItemChange(index, 'required_date', e.target.value)}
                        min={formData.issue_date}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
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
                      placeholder="Enter item description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
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
                        placeholder="e.g., Pcs, Kg, Liter"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    </label>
                    <textarea
                      value={item.specifications}
                      onChange={(e) => handleItemChange(index, 'specifications', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter technical specifications, quality requirements, etc."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <strong>Summary:</strong> {formData.items.length} item(s) • 
              Total Quantity: {formData.items.reduce((sum, item) => sum + (item.quantity || 0), 0).toFixed(2)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/purchasing/rfqs')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <X className="inline h-4 w-4 mr-2" />{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="inline h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update RFQ' : 'Create RFQ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RFQForm;
