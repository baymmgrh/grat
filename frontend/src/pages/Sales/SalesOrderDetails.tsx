import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGetSalesOrderQuery } from '../../services/api';
import { format } from 'date-fns';
import DocumentGenerateButton from '../../components/DocumentGenerateButton';
import {
  CalendarIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  EyeIcon,
  LinkIcon,
  PencilIcon,
  TruckIcon,
  UserIcon
} from '@heroicons/react/24/outline';
const SalesOrderDetails: React.FC = () => {
  const { t } = useLanguage();

  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, error } = useGetSalesOrderQuery(id!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading sales order...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <DocumentTextIcon className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sales Order Not Found</h3>
        <p className="text-gray-500 mb-4">The sales order you're looking for doesn't exist.</p>
        <Link to="/app/sales/orders" className="btn-primary">
          Back to Sales Orders
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800' },
      in_production: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      ready: { bg: 'bg-green-100', text: 'text-green-800' },
      shipped: { bg: 'bg-purple-100', text: 'text-purple-800' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800' }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return `px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { bg: string; text: string }> = {
      low: { bg: 'bg-gray-100', text: 'text-gray-800' },
      normal: { bg: 'bg-blue-100', text: 'text-blue-800' },
      high: { bg: 'bg-orange-100', text: 'text-orange-800' },
      urgent: { bg: 'bg-red-100', text: 'text-red-800' }
    };
    const config = priorityConfig[priority] || priorityConfig.normal;
    return `px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sales Order: {order.order_number}
            </h1>
            <p className="text-gray-600">Customer: {order.customer_name}</p>
          </div>
          <div className="flex space-x-3">
            <Link
              to={`/app/sales/orders/${id}/edit`}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <PencilIcon className="h-4 w-4" />{t('common.edit')}</Link>
            <Link
              to={`/app/sales/orders/${id}/workflow`}
              className="btn-primary inline-flex items-center gap-2"
            >
              <EyeIcon className="h-4 w-4" />
              View Workflow
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('common.status')}</p>
              <span className={getStatusBadge(order.status)}>
                {order.status}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ClipboardDocumentListIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Priority</p>
              <span className={getPriorityBadge(order.priority || 'normal')}>
                {order.priority || 'normal'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="font-semibold">Rp {order.total_amount?.toLocaleString('id-ID') || '0'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Date</p>
              <p className="font-semibold">
                {order.order_date ? format(new Date(order.order_date), 'dd MMM yyyy') : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer & Delivery Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2" />
            Customer & Delivery Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Customer</label>
              <p className="text-gray-900">{order.customer_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Customer PO Number</label>
              <p className="text-gray-900">{order.customer_po_number || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Required Date</label>
              <p className="text-gray-900">
                {order.required_date ? format(new Date(order.required_date), 'dd MMM yyyy') : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Promised Date</label>
              <p className="text-gray-900">
                {order.promised_date ? format(new Date(order.promised_date), 'dd MMM yyyy') : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Delivery Date</label>
              <p className="text-gray-900">
                {order.delivery_date ? format(new Date(order.delivery_date), 'dd MMM yyyy') : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Delivery Address</label>
              <p className="text-gray-900">{order.delivery_address || '-'}</p>
            </div>
          </div>
        </div>

        {/* Payment & Shipping Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <TruckIcon className="h-5 w-5 mr-2" />
            Payment & Shipping Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Payment Terms</label>
              <p className="text-gray-900">{order.payment_terms || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Payment Method</label>
              <p className="text-gray-900">{order.payment_method || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Shipping Method</label>
              <p className="text-gray-900">{order.shipping_method || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Shipping Cost</label>
              <p className="text-gray-900">Rp {order.shipping_cost?.toLocaleString('id-ID') || '0'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Subtotal</label>
              <p className="text-gray-900">Rp {order.subtotal?.toLocaleString('id-ID') || '0'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Tax Amount</label>
              <p className="text-gray-900">Rp {order.tax_amount?.toLocaleString('id-ID') || '0'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Discount Amount</label>
              <p className="text-gray-900">Rp {order.discount_amount?.toLocaleString('id-ID') || '0'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('production.product')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.description')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.quantity')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.total')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.items?.map((item: any, index: number) => (
                <tr key={item.id || index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.line_number || index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.product_name || item.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.quantity} {item.uom}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Rp {item.unit_price?.toLocaleString('id-ID') || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.discount_percent ? `${item.discount_percent}%` : '-'}
                    {item.discount_amount ? ` (Rp ${item.discount_amount.toLocaleString('id-ID')})` : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.tax_percent ? `${item.tax_percent}%` : '-'}
                    {item.tax_amount ? ` (Rp ${item.tax_amount.toLocaleString('id-ID')})` : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Rp {item.total_price?.toLocaleString('id-ID') || '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(!order.items || order.items.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            No items found for this sales order.
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Documents</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500 block mb-2">Surat Jalan (Delivery Note)</label>
            <DocumentGenerateButton
              transactionType="sales_order"
              transactionId={order.id}
              transactionNumber={order.order_number}
              label="Generate Surat Jalan"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      {(order.notes || order.internal_notes) && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
          <div className="space-y-4">
            {order.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500">Customer Notes</label>
                <p className="text-gray-900 mt-1">{order.notes}</p>
              </div>
            )}
            {order.internal_notes && (
              <div>
                <label className="text-sm font-medium text-gray-500">Internal Notes</label>
                <p className="text-gray-900 mt-1">{order.internal_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-wrap gap-3">
          {order.status === 'draft' && (
            <button className="btn-primary">
              Confirm Order
            </button>
          )}
          {order.status === 'confirmed' && (
            <Link to={`/app/sales/orders/${id}/workflow`} className="btn-primary">
              Start Production Workflow
            </Link>
          )}
          <Link to={`/app/sales/orders/${id}/edit`} className="btn-secondary">
            Edit Order
          </Link>
          <Link to="/app/sales/orders" className="btn-outline">
            Back to Orders
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SalesOrderDetails;
