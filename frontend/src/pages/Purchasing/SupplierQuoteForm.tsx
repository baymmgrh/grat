import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  BuildingOfficeIcon as Building,
  CalendarIcon as Calendar,
  ChartBarIcon as Calculator,
  CheckIcon as Save,
  CubeIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  HashtagIcon as Hash,
  PlusIcon as Plus,
  TrashIcon as Trash2
} from '@heroicons/react/24/outline';
interface Supplier {
  id: number;
  company_name: string;
  code: string;
}

interface RFQ {
  id: number;
  rfq_number: string;
  title: string;
  items: RFQItem[];
}

interface RFQItem {
  id: number;
  line_number: number;
  description: string;
  quantity: number;
  uom: string;
}

interface QuoteItem {
  id?: number;
  rfq_item_id: number | null;
  line_number: number;
  description: string;
  quantity: number;
  uom: string;
  unit_price: number;
  discount_percent: number;
  tax_percent: number;
  lead_time_days: number;
  notes: string;
}

interface QuoteFormData {
  supplier_id: number;
  rfq_id: number | null;
  quote_date: string;
  valid_until: string;
  currency: string;
  payment_terms: string;
  delivery_terms: string;
  lead_time_days: number;
  notes: string;
  items: QuoteItem[];
}

const SupplierQuoteForm: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<QuoteFormData>({
    supplier_id: 0,
    rfq_id: null,
    quote_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    currency: 'IDR',
    payment_terms: '30 days',
    delivery_terms: 'FOB',
    lead_time_days: 7,
    notes: '',
    items: [{
      rfq_item_id: null,
      line_number: 1,
      description: '',
      quantity: 0,
      uom: '',
      unit_price: 0,
      discount_percent: 0,
      tax_percent: 11,
      lead_time_days: 7,
      notes: ''
    }]
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rfqs, setRFQs] = useState<RFQ[]>([]);
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currencies = ['IDR', 'USD', 'EUR', 'SGD'];
  const paymentTerms = ['Cash', '15 days', '30 days', '45 days', '60 days', '90 days'];
  const deliveryTerms = ['FOB', 'CIF', 'EXW', 'DDP', 'DAP'];

  useEffect(() => {
    fetchSuppliers();
    fetchRFQs();
    if (isEdit) {
      fetchQuote();
    }
  }, [id]);

  useEffect(() => {
    if (formData.rfq_id && !isEdit) {
      const rfq = rfqs.find(r => r.id === formData.rfq_id);
      if (rfq) {
        setSelectedRFQ(rfq);
        const quoteItems: QuoteItem[] = rfq.items.map(item => ({
          rfq_item_id: item.id,
          line_number: item.line_number,
          description: item.description,
          quantity: item.quantity,
          uom: item.uom,
          unit_price: 0,
          discount_percent: 0,
          tax_percent: 11,
          lead_time_days: formData.lead_time_days,
          notes: ''
        }));
        setFormData(prev => ({ ...prev, items: quoteItems }));
      }
    }
  }, [formData.rfq_id, rfqs, isEdit, formData.lead_time_days]);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/purchasing/suppliers', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.suppliers || []);
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  };

  const fetchRFQs = async () => {
    try {
      const response = await fetch('/api/purchasing/rfqs?status=issued', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRFQs(data.rfqs || []);
      }
    } catch (error) {
      console.error('Failed to fetch RFQs:', error);
    }
  };

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/purchasing/quotes/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          supplier_id: data.supplier_id,
          rfq_id: data.rfq_id,
          quote_date: data.quote_date,
          valid_until: data.valid_until || '',
          currency: data.currency,
          payment_terms: data.payment_terms || '30 days',
          delivery_terms: data.delivery_terms || 'FOB',
          lead_time_days: data.lead_time_days || 7,
          notes: data.notes || '',
          items: data.items || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.items.length === 0) {
      setError('At least one item is required');
      setLoading(false);
      return;
    }

    const hasEmptyItems = formData.items.some(item => 
      !item.description.trim() || item.quantity <= 0 || item.unit_price <= 0
    );

    if (hasEmptyItems) {
      setError('All items must have description, quantity and unit price');
      setLoading(false);
      return;
    }

    try {
      const url = isEdit ? `/api/purchasing/quotes/${id}` : '/api/purchasing/quotes';
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
        navigate('/app/purchasing/quotes');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save quote');
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
      [name]: ['supplier_id', 'rfq_id', 'lead_time_days'].includes(name) 
        ? (value === '' ? (name === 'rfq_id' ? null : 0) : Number(value))
        : value
    }));
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index 
          ? { 
              ...item, 
              [field]: ['quantity', 'unit_price', 'discount_percent', 'tax_percent', 'lead_time_days', 'rfq_item_id'].includes(field)
                ? (value === '' ? (field === 'rfq_item_id' ? null : 0) : Number(value))
                : value
            }
          : item
      )
    }));
  };

  const addItem = () => {
    const newLineNumber = Math.max(...formData.items.map(item => item.line_number)) + 1;
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        rfq_item_id: null,
        line_number: newLineNumber,
        description: '',
        quantity: 0,
        uom: '',
        unit_price: 0,
        discount_percent: 0,
        tax_percent: 11,
        lead_time_days: formData.lead_time_days,
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

  const calculateItemTotal = (item: QuoteItem) => {
    const subtotal = item.quantity * item.unit_price;
    const discountAmount = subtotal * (item.discount_percent / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (item.tax_percent / 100);
    return afterDiscount + taxAmount;
  };

  const getGrandTotal = () => {
    return formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const getMinValidDate = () => {
    const quoteDate = new Date(formData.quote_date);
    quoteDate.setDate(quoteDate.getDate() + 1);
    return quoteDate.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Supplier Quote' : 'New Supplier Quote'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update quote details and pricing' : 'Create supplier quotation with pricing details'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <ExclamationCircleIcon className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Quote Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="inline h-4 w-4 mr-1" />
                  Supplier *
                </label>
                <select
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.code} - {supplier.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DocumentTextIcon className="inline h-4 w-4 mr-1" />
                  Reference RFQ
                </label>
                <select
                  name="rfq_id"
                  value={formData.rfq_id || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No RFQ Reference</option>
                  {rfqs.map(rfq => (
                    <option key={rfq.id} value={rfq.id}>
                      {rfq.rfq_number} - {rfq.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Quote Date *
                </label>
                <input
                  type="date"
                  name="quote_date"
                  value={formData.quote_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid Until
                </label>
                <input
                  type="date"
                  name="valid_until"
                  value={formData.valid_until}
                  onChange={handleInputChange}
                  min={getMinValidDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CurrencyDollarIcon className="inline h-4 w-4 mr-1" />
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {currencies.map(currency => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Terms
                </label>
                <select
                  name="payment_terms"
                  value={formData.payment_terms}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {paymentTerms.map(term => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Terms
                </label>
                <select
                  name="delivery_terms"
                  value={formData.delivery_terms}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {deliveryTerms.map(term => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lead Time (Days)
                </label>
                <input
                  type="number"
                  name="lead_time_days"
                  value={formData.lead_time_days}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Quote Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                      <button type="button" onClick={() => removeItem(index)} className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      required
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">UOM</label>
                      <input
                        type="text"
                        value={item.uom}
                        onChange={(e) => handleItemChange(index, 'uom', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price *</label>
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Calculator className="inline h-4 w-4 mr-1" />{t('common.total')}</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                        {calculateItemTotal(item).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                      <input
                        type="number"
                        value={item.discount_percent}
                        onChange={(e) => handleItemChange(index, 'discount_percent', e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tax (%)</label>
                      <input
                        type="number"
                        value={item.tax_percent}
                        onChange={(e) => handleItemChange(index, 'tax_percent', e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lead Time (Days)</label>
                      <input
                        type="number"
                        value={item.lead_time_days}
                        onChange={(e) => handleItemChange(index, 'lead_time_days', e.target.value)}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Grand Total:</span>
                <span className="text-xl font-bold text-blue-600">
                  {formData.currency} {getGrandTotal().toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/purchasing/quotes')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <X className="inline h-4 w-4 mr-2" />{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="inline h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update Quote' : 'Create Quote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierQuoteForm;
