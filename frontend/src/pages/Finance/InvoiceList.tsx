import React from 'react'
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGetInvoicesQuery } from '../../services/api'
import { format } from 'date-fns'
import {
  LinkIcon
,
  PlusIcon
} from '@heroicons/react/24/outline';
export default function InvoiceList() {
    const { t } = useLanguage();

const { data, isLoading } = useGetInvoicesQuery({})

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      draft: 'badge-warning',
      sent: 'badge-info',
      partial: 'badge-warning',
      paid: 'badge-success',
      overdue: 'badge-danger',
      cancelled: 'badge-danger'
    }
    return badges[status] || 'badge-info'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <Link to="/app/finance/invoices/new" className="btn-primary inline-flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Create Invoice
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
                  <th>Invoice Number</th>
                  <th>Type</th>
                  <th>Customer/Supplier</th>
                  <th>Invoice Date</th>
                  <th>Due Date</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Balance Due</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.invoices?.map((invoice: any) => (
                  <tr key={invoice.id}>
                    <td className="font-medium">{invoice.invoice_number}</td>
                    <td>
                      <span className={`badge ${invoice.invoice_type === 'sales' ? 'badge-success' : 'badge-info'}`}>
                        {invoice.invoice_type}
                      </span>
                    </td>
                    <td>{invoice.customer_name || invoice.supplier_name || '-'}</td>
                    <td>{format(new Date(invoice.invoice_date), 'dd MMM yyyy')}</td>
                    <td>{format(new Date(invoice.due_date), 'dd MMM yyyy')}</td>
                    <td className="font-medium">Rp {invoice.total_amount?.toLocaleString() || '0'}</td>
                    <td className="text-green-600">Rp {invoice.paid_amount?.toLocaleString() || '0'}</td>
                    <td className="text-red-600">Rp {invoice.balance_due?.toLocaleString() || '0'}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/finance/invoices/${invoice.id}`}
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
      {!isLoading && (!data?.invoices || data.invoices.length === 0) && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            💰
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first invoice.</p>
          <div className="mt-6">
            <Link to="/app/finance/invoices/new" className="btn-primary">
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Invoice
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
