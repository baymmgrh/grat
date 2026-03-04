import React from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGetCustomerQuery } from '../../services/api';
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CreditCardIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  MapPinIcon,
  PencilIcon
,
  PhoneIcon,
  UserIcon
} from '@heroicons/react/24/outline';
const CustomerDetails: React.FC = () => {
  const { t } = useLanguage();

  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading, error } = useGetCustomerQuery(id!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading customer details...</span>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <UserIcon className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Not Found</h3>
        <p className="text-gray-500 mb-4">The customer you're looking for doesn't exist.</p>
        <Link
          to="/app/sales/customers"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/app/sales/customers"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Customers
          </Link>
        </div>
        <Link
          to={`/app/sales/customers/${id}/edit`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PencilIcon className="h-4 w-4 mr-2" />
          Edit Customer
        </Link>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <UserIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
              <p className="text-sm text-gray-500">Customer ID: {customer.customer_number || customer.id}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
              
              {customer.email && (
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{customer.email}</p>
                  </div>
                </div>
              )}

              {customer.phone && (
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Phone</p>
                    <p className="text-sm text-gray-600">{customer.phone}</p>
                  </div>
                </div>
              )}

              {customer.address && (
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Address</p>
                    <p className="text-sm text-gray-600">{customer.address}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
              
              {customer.company && (
                <div className="flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Company</p>
                    <p className="text-sm text-gray-600">{customer.company}</p>
                  </div>
                </div>
              )}

              {customer.job_title && (
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Job Title</p>
                    <p className="text-sm text-gray-600">{customer.job_title}</p>
                  </div>
                </div>
              )}

              {customer.industry && (
                <div className="flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Industry</p>
                    <p className="text-sm text-gray-600">{customer.industry}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
              
              <div className="flex items-center">
                <div className={`h-3 w-3 rounded-full mr-3 ${
                  customer.status === 'active' ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('common.status')}</p>
                  <p className={`text-sm capitalize ${
                    customer.status === 'active' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {customer.status || 'Active'}
                  </p>
                </div>
              </div>

              {customer.credit_limit && (
                <div className="flex items-center">
                  <CreditCardIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Credit Limit</p>
                    <p className="text-sm text-gray-600">Rp {customer.credit_limit.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              )}

              {customer.created_at && (
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Created</p>
                    <p className="text-sm text-gray-600">
                      {new Date(customer.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      {(customer.billing_address || customer.shipping_address || customer.notes) && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Additional Information</h2>
          </div>
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {customer.billing_address && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Billing Address</h3>
                  <p className="text-sm text-gray-600">{customer.billing_address}</p>
                </div>
              )}

              {customer.shipping_address && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Shipping Address</h3>
                  <p className="text-sm text-gray-600">{customer.shipping_address}</p>
                </div>
              )}

              {customer.notes && (
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
                  <p className="text-sm text-gray-600">{customer.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetails;
