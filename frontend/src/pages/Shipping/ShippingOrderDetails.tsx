import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  CalendarIcon as Calendar,
  CheckCircleIcon,
  ClockIcon,
  CubeIcon,
  DocumentTextIcon,
  EnvelopeIcon as Mail
,
  ExclamationTriangleIcon,
  MapPinIcon as MapPin,
  PencilIcon as Edit,
  PhoneIcon,
  PrinterIcon,
  TruckIcon,
  UserIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
interface ShippingOrderDetails {
  id: number;
  shipping_number: string;
  customer_id: number;
  customer_name: string;
  customer_address: string;
  customer_phone: string;
  customer_email: string;
  shipping_date: string;
  expected_delivery_date: string;
  actual_delivery_date: string;
  shipping_method: string;
  carrier: string;
  tracking_number: string;
  status: string;
  shipping_cost: number;
  insurance_cost: number;
  total_weight: number;
  total_volume: number;
  special_instructions: string;
  notes: string;
  created_by: string;
  created_at: string;
  items: ShippingItem[];
  tracking_history: TrackingEvent[];
}

interface ShippingItem {
  id: number;
  product_code: string;
  product_name: string;
  quantity: number;
  weight: number;
  dimensions: string;
  packaging_type: string;
  handling_instructions: string;
}

interface TrackingEvent {
  id: number;
  event_date: string;
  location: string;
  status: string;
  description: string;
  updated_by: string;
}

const ShippingOrderDetails: React.FC = () => {
  const { t } = useLanguage();

  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<ShippingOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/shipping/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data.shipping_order);
      } else {
        setError('Failed to fetch shipping order details');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/shipping/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchOrderDetails();
      } else {
        alert('Failed to update order status');
      }
    } catch (error) {
      alert('Error updating order status');
    }
  };

  const deleteOrder = async () => {
    if (!confirm('Are you sure you want to delete this shipping order?')) return;

    try {
      const response = await fetch(`/api/shipping/orders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        navigate('/app/shipping/orders');
      } else {
        alert('Failed to delete shipping order');
      }
    } catch (error) {
      alert('Error deleting shipping order');
    }
  };

  const printShippingLabel = () => {
    window.print();
  };

  const downloadPOD = async () => {
    try {
      const response = await fetch(`/api/shipping/orders/${id}/pod`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `POD_${order?.shipping_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      alert('Error downloading POD');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_transit': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'returned': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'confirmed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'in_transit': return <TruckIcon className="h-4 w-4" />;
      case 'delivered': return <CheckCircleIcon className="h-4 w-4" />;
      case 'cancelled': return <XCircleIcon className="h-4 w-4" />;
      case 'returned': return <ExclamationTriangleIcon className="h-4 w-4" />;
      default: return <CubeIcon className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Order</h3>
          <p className="text-gray-600 mb-4">{error || 'Shipping order not found'}</p>
          <Link
            to="/app/shipping/orders"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/app/shipping/orders"
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Shipping Order {order.shipping_number}
            </h1>
            <p className="text-gray-600">
              Created on {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {getStatusIcon(order.status)}
            {order.status.replace('_', ' ').toUpperCase()}
          </span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={printShippingLabel}
              className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <PrinterIcon className="h-4 w-4" />
            </button>
            <button
              onClick={downloadPOD}
              className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
            </button>
            <Link
              to={`/app/shipping/orders/${id}/edit`}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Edit className="h-4 w-4" />
            </Link>
            <button
              onClick={deleteOrder}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Date
                  </label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {new Date(order.shipping_date).toLocaleDateString()}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Delivery
                  </label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                    {order.expected_delivery_date 
                      ? new Date(order.expected_delivery_date).toLocaleDateString()
                      : 'Not specified'
                    }
                  </div>
                </div>
                
                {order.actual_delivery_date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Actual Delivery
                    </label>
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {new Date(order.actual_delivery_date).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Method
                  </label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Truck className="h-4 w-4 text-gray-400" />
                    {order.shipping_method}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                  </label>
                  <div className="text-gray-900">{order.carrier || 'Not specified'}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking Number
                  </label>
                  <div className="text-gray-900 font-mono">
                    {order.tracking_number || 'Not assigned'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Items</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('production.product')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.quantity')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CubeIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.product_code}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.product_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.weight} kg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.dimensions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.packaging_type}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tracking History */}
          {order.tracking_history && order.tracking_history.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tracking History</h3>
              
              <div className="space-y-4">
                {order.tracking_history.map((event, index) => (
                  <div key={event.id} className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                      }`}></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {event.status.replace('_', ' ').toUpperCase()}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {new Date(event.event_date).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                        <span>Updated by {event.updated_by}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">{order.customer_name}</span>
              </div>
              
            </div>
          </div>

          {/* Shipping Costs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Costs</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping Cost</span>
                <span className="text-gray-900">{formatCurrency(order.shipping_cost)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Insurance</span>
                <span className="text-gray-900">{formatCurrency(order.insurance_cost)}</span>
              </div>
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between font-medium">
                  <span className="text-gray-900">{t('products.bom.total_cost')}</span>
                  <span className="text-gray-900">
                    {formatCurrency(order.shipping_cost + order.insurance_cost)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CubeIcon Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">CubeIcon Information</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Weight</span>
                <span className="text-gray-900">{order.total_weight} kg</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Total Volume</span>
                <span className="text-gray-900">{order.total_volume} m³</span>
              </div>
            </div>
            
            {order.special_instructions && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Special Instructions</h4>
                <p className="text-sm text-gray-600">{order.special_instructions}</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-2">
              {order.status === 'pending' && (
                <button
                  onClick={() => updateOrderStatus('confirmed')}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Confirm Order
                </button>
              )}
              
              {order.status === 'confirmed' && (
                <button
                  onClick={() => updateOrderStatus('in_transit')}
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  Mark In Transit
                </button>
              )}
              
              {order.status === 'in_transit' && (
                <button
                  onClick={() => updateOrderStatus('delivered')}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Mark Delivered
                </button>
              )}
              
              {['pending', 'confirmed'].includes(order.status) && (
                <button
                  onClick={() => updateOrderStatus('cancelled')}
                  className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingOrderDetails;
