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
interface Customer {
  id: number;
  company_name: string;
  code: string;
  email: string;
  phone: string;
}

interface SalesOrder {
  id: number;
  so_number: string;
  customer: {
    company_name: string;
  };
  total_amount: number;
  status: string;
}

interface Product {
  id: number;
  name: string;
  code: string;
  selling_price: number;
  primary_uom: string;
}

interface InvoiceItem {
  id?: number;
  line_number: number;
  product_id: number | null;
  description: string;
  quantity: number;
  uom: string;
  unit_price: number;
  discount_percent: number;
  tax_percent: number;
}

interface InvoiceFormData {
  invoice_type: string;
  invoice_date: string;
  due_date: string;
  sales_order_id: number | null;
  customer_id: number;
  currency: string;
  payment_terms: string;
  notes: string;
  items: InvoiceItem[];
}

const InvoiceForm: React.FC = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<InvoiceFormData>({
    invoice_type: 'sales',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    sales_order_id: null,
    customer_id: 0,
    currency: 'IDR',
    payment_terms: '30 days',
    notes: '',
    items: [{
      line_number: 1,
      product_id: null,
      description: '',
      quantity: 1,
      uom: '',
      unit_price: 0,
      discount_percent: 0,
      tax_percent: 11
    }]
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currencies = ['IDR', 'USD', 'EUR', 'SGD'];
  const paymentTerms = ['Cash', '15 days', '30 days', '45 days', '60 days', '90 days'];

  useEffect(() => {
    fetchCustomers();
    fetchSalesOrders();
    fetchProducts();
    if (isEdit) {
      fetchInvoice();
    }
  }, [id]);

  useEffect(() => {
    // Auto-set due date based on payment terms
    if (formData.invoice_date && formData.payment_terms !== 'Cash') {
      const invoiceDate = new Date(formData.invoice_date);
      const daysToAdd = parseInt(formData.payment_terms.split(' ')[0]) || 30;
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + daysToAdd);
      setFormData(prev => ({
        ...prev,
        due_date: dueDate.toISOString().split('T')[0]
      }));
    } else if (formData.payment_terms === 'Cash') {
      setFormData(prev => ({
        ...prev,
        due_date: formData.invoice_date
      }));
    }
  }, [formData.invoice_date, formData.payment_terms]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/sales/customers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const fetchSalesOrders = async () => {
    try {
      const response = await fetch('/api/sales/orders?status=confirmed,partial', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSalesOrders(data.sales_orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch sales orders:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products-new/?per_page=1000', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const mappedProducts = (data.products || []).map((p: any) => ({
          id: p.id,
          code: p.kode_produk || p.code,
          name: p.nama_produk || p.name,
          primary_uom: p.satuan || p.primary_uom || 'pcs',
          price: p.harga_jual || p.price || 0,
        }));
        setProducts(mappedProducts);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/finance/invoices/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          invoice_type: data.invoice_type,
          invoice_date: data.invoice_date,
          due_date: data.due_date || '',
          sales_order_id: data.sales_order_id,
          customer_id: data.customer_id,
          currency: data.currency,
          payment_terms: data.payment_terms || '30 days',
          notes: data.notes || '',
          items: data.items || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
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
      !item.description.trim() || item.quantity <= 0 || item.unit_price <= 0
    );

    if (hasEmptyItems) {
      setError('All items must have description, quantity and unit price');
      setLoading(false);
      return;
    }

    try {
      const url = isEdit 
        ? `/api/finance/invoices/${id}` 
        : '/api/finance/invoices';
      
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
        navigate('/app/sales/invoices');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save invoice');
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
      [name]: ['customer_id', 'sales_order_id'].includes(name) 
        ? (value === '' ? (name === 'sales_order_id' ? null : 0) : Number(value))
        : value
    }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = {
            ...item,
            [field]: ['product_id', 'quantity', 'unit_price', 'discount_percent', 'tax_percent', 'line_number'].includes(field)
              ? (value === '' ? (field === 'product_id' ? null : 0) : Number(value))
              : value
          };

          // Auto-fill product details when product is selected
          if (field === 'product_id' && value) {
            const selectedProduct = products.find(p => p.id === Number(value));
            if (selectedProduct) {
              updatedItem.description = selectedProduct.name;
              updatedItem.unit_price = selectedProduct.selling_price;
              updatedItem.uom = selectedProduct.primary_uom;
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
        product_id: null,
        description: '',
        quantity: 1,
        uom: '',
        unit_price: 0,
        discount_percent: 0,
        tax_percent: 11
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

  const calculateItemTotal = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.unit_price;
    const discountAmount = subtotal * (item.discount_percent / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (item.tax_percent / 100);
    return afterDiscount + taxAmount;
  };

  const getSubtotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);
  };

  const getTotalDiscount = () => {
    return formData.items.reduce((sum, item) => {
      const subtotal = item.quantity * item.unit_price;
      return sum + (subtotal * (item.discount_percent / 100));
    }, 0);
  };

  const getTotalTax = () => {
    return formData.items.reduce((sum, item) => {
      const subtotal = item.quantity * item.unit_price;
      const discountAmount = subtotal * (item.discount_percent / 100);
      const afterDiscount = subtotal - discountAmount;
      return sum + (afterDiscount * (item.tax_percent / 100));
    }, 0);
  };

  const getGrandTotal = () => {
    return formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const selectedCustomer = customers.find(c => c.id === formData.customer_id);
  const selectedSalesOrder = salesOrders.find(so => so.id === formData.sales_order_id);

  const getMinDueDate = () => {
    return formData.invoice_date;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Sales Invoice' : 'New Sales Invoice'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update invoice details and items' : 'Create new sales invoice for customer billing'}
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

          {/* Invoice Header Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Invoice Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="inline h-4 w-4 mr-1" />
                  Customer *
                </label>
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.code} - {customer.company_name}
                    </option>
                  ))}
                </select>
                {selectedCustomer && (
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedCustomer.email} • {selectedCustomer.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DocumentTextIcon className="inline h-4 w-4 mr-1" />
                  Reference Sales Order
                </label>
                <select
                  name="sales_order_id"
                  value={formData.sales_order_id || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No Sales Order Reference</option>
                  {salesOrders.map(so => (
                    <option key={so.id} value={so.id}>
                      {so.so_number} - {so.customer.company_name}
                    </option>
                  ))}
                </select>
                {selectedSalesOrder && (
                  <p className="mt-1 text-sm text-gray-500">
                    Amount: {selectedSalesOrder.total_amount.toLocaleString('id-ID')} • Status: {selectedSalesOrder.status}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Invoice Date *
                </label>
                <input
                  type="date"
                  name="invoice_date"
                  value={formData.invoice_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  min={getMinDueDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Invoice Items</h3>
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
                        <option value="">Select Product</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.code} - {product.name}
                          </option>
                        ))}
                      </select>
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

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                        Unit Price *
                      </label>
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
                        Discount (%)
                      </label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tax (%)
                      </label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Calculator className="inline h-4 w-4 mr-1" />{t('common.total')}</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                        {calculateItemTotal(item).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Invoice Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Invoice Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formData.currency} {getSubtotal().toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Discount:</span>
                  <span className="text-red-600">-{formData.currency} {getTotalDiscount().toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Tax:</span>
                  <span>{formData.currency} {getTotalTax().toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Grand Total:</span>
                  <span className="text-blue-600">{formData.currency} {getGrandTotal().toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DocumentTextIcon className="inline h-4 w-4 mr-1" />
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter invoice notes or special instructions..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/sales/invoices')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <X className="inline h-4 w-4 mr-2" />{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="inline h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
