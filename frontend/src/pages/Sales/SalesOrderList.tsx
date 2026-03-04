import React from 'react'
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGetSalesOrdersQuery } from '../../services/api'
import { format } from 'date-fns'
import {
  LinkIcon
,
  PlusIcon
} from '@heroicons/react/24/outline';
export default function SalesOrderList() {
    const { t } = useLanguage();

const { data, isLoading } = useGetSalesOrdersQuery({})

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      draft: 'badge-warning',
      confirmed: 'badge-info',
      in_production: 'badge-info',
      ready: 'badge-success',
      shipped: 'badge-success',
      delivered: 'badge-success',
      cancelled: 'badge-danger'
    }
    return badges[status] || 'badge-info'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
        <Link to="/app/sales/orders/new" className="btn-primary inline-flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Create Order
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
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Order Date</th>
                  <th>Required Date</th>
                  <th>{t('common.status')}</th>
                  <th>Priority</th>
                  <th>Total Amount</th>
                  <th>Items</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.orders?.map((order: any) => (
                  <tr key={order.id}>
                    <td className="font-medium">{order.order_number}</td>
                    <td>{order.customer_name}</td>
                    <td>{format(new Date(order.order_date), 'dd MMM yyyy')}</td>
                    <td>{order.required_date ? format(new Date(order.required_date), 'dd MMM yyyy') : '-'}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${order.priority === 'urgent' ? 'badge-danger' : 'badge-info'}`}>
                        {order.priority || 'normal'}
                      </span>
                    </td>
                    <td className="font-medium">Rp {order.total_amount?.toLocaleString() || '0'}</td>
                    <td>{order.item_count || 0}</td>
                    <td>
                      <div className="flex space-x-2">
                        <Link
                          to={`/app/sales/orders/${order.id}`}
                          className="text-primary-600 hover:text-primary-800 text-sm"
                        >
                        </Link>
                        <Link
                          to={`/app/sales/orders/${order.id}/workflow`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!data?.orders || data.orders.length === 0) && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            📋
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sales orders</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first sales order.</p>
          <div className="mt-6">
            <Link to="/app/sales/orders/new" className="btn-primary">
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Order
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
