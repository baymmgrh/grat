import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  LinkIcon
,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useGetShippingOrdersQuery } from '../../services/shippingApi'
import { format } from 'date-fns'
export default function ShippingOrderList() {
    const { t } = useLanguage();

const { data, isLoading } = useGetShippingOrdersQuery({})

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      preparing: 'badge-warning',
      packed: 'badge-info',
      shipped: 'badge-info',
      in_transit: 'badge-info',
      delivered: 'badge-success',
      cancelled: 'badge-danger'
    }
    return badges[status] || 'badge-info'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Shipping Orders</h1>
        <Link to="/shipping/orders/new" className="btn-primary inline-flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Create Shipment
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12">{t('common.loading')}</div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Shipping Number</th>
                  <th>Customer</th>
                  <th>Shipping Date</th>
                  <th>Expected Delivery</th>
                  <th>{t('common.status')}</th>
                  <th>Tracking Number</th>
                  <th>Driver</th>
                  <th>Vehicle</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.shipping_orders?.map((order: any) => (
                  <tr key={order.id}>
                    <td className="font-medium">{order.shipping_number}</td>
                    <td>{order.customer_name}</td>
                    <td>{format(new Date(order.shipping_date), 'dd MMM yyyy')}</td>
                    <td>{order.expected_delivery_date ? format(new Date(order.expected_delivery_date), 'dd MMM yyyy') : '-'}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{order.tracking_number || '-'}</td>
                    <td>{order.driver_name || '-'}</td>
                    <td>{order.vehicle_number || '-'}</td>
                    <td>
                      <Link
                        to={`/shipping/orders/${order.id}`}
                        className="text-primary-600 hover:text-primary-800 text-sm"
                      >
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!data?.shipping_orders || data.shipping_orders.length === 0) && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            🚚
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No shipments</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first shipment.</p>
          <div className="mt-6">
            <Link to="/shipping/orders/new" className="btn-primary">
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Shipment
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
