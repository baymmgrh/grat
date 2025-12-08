import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  BuildingOfficeIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  DocumentTextIcon,
  UsersIcon,
  BanknotesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import {
  useGetSuppliersQuery,
  useGetPurchaseOrdersQuery,
  useGetContractsQuery,
  useGetQuotesQuery
} from '../../services/api';

export default function Purchasing() {
  const [activeTab, setActiveTab] = useState('overview')
  
  // Get summary data
  const { data: suppliersData } = useGetSuppliersQuery({ per_page: 5 })
  const { data: purchaseOrdersData } = useGetPurchaseOrdersQuery({ per_page: 5 })
  const { data: contractsData } = useGetContractsQuery({ per_page: 5 })
  const { data: quotesData } = useGetQuotesQuery({ per_page: 5 })

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'suppliers', name: 'Suppliers', icon: BuildingOfficeIcon },
    { id: 'purchase-orders', name: 'Purchase Orders', icon: DocumentTextIcon },
    { id: 'quotes', name: 'Quotes & RFQs', icon: BanknotesIcon },
    { id: 'contracts', name: 'Contracts', icon: ClipboardDocumentListIcon },
    { id: 'price-comparison', name: 'Price Analysis', icon: ChartBarIcon },
  ]

  const stats = [
    {
      name: 'Active Suppliers',
      value: suppliersData?.total || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
      link: '/app/purchasing/suppliers'
    },
    {
      name: 'Purchase Orders',
      value: purchaseOrdersData?.total || 0,
      icon: DocumentTextIcon,
      color: 'bg-green-500',
      link: '/app/purchasing/purchase-orders'
    },
    {
      name: 'Active Contracts',
      value: contractsData?.contracts?.filter((c: any) => c.status === 'active').length || 0,
      icon: ClipboardDocumentListIcon,
      color: 'bg-purple-500',
      link: '/app/purchasing/contracts'
    },
    {
      name: 'Pending Quotes',
      value: quotesData?.quotes?.filter((q: any) => q.status === 'submitted').length || 0,
      icon: BanknotesIcon,
      color: 'bg-orange-500',
      link: '/app/purchasing/quotes'
    },
  ]

  const recentActivities = [
    {
      id: 1,
      type: 'po_created',
      title: 'New Purchase Order Created',
      description: 'PO-2024-001 for ABC Supplier',
      time: '2 hours ago',
      icon: DocumentTextIcon,
      color: 'text-blue-600'
    },
    {
      id: 2,
      type: 'supplier_added',
      title: 'New Supplier Added',
      description: 'XYZ Manufacturing registered',
      time: '4 hours ago',
      icon: BuildingOfficeIcon,
      color: 'text-green-600'
    },
    {
      id: 3,
      type: 'contract_approved',
      title: 'Contract Approved',
      description: 'Framework contract CON-2024-005',
      time: '1 day ago',
      icon: CheckCircleIcon,
      color: 'text-purple-600'
    },
    {
      id: 4,
      type: 'quote_received',
      title: 'Quote Received',
      description: 'Quote QUO-2024-012 from DEF Supplier',
      time: '2 days ago',
      icon: BanknotesIcon,
      color: 'text-orange-600'
    },
  ]

  const pendingApprovals = [
    {
      id: 1,
      type: 'purchase_order',
      title: 'PO-2024-003',
      description: 'Purchase Order - Rp 15,000',
      supplier: 'Tech Solutions Ltd',
      amount: 15000,
      priority: 'high'
    },
    {
      id: 2,
      type: 'contract',
      title: 'CON-2024-007',
      description: 'Service Contract - Annual',
      supplier: 'Maintenance Pro',
      amount: 50000,
      priority: 'normal'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchasing Management</h1>
          <p className="text-gray-600">Comprehensive procurement and supplier management system</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/app/purchasing/suppliers/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <BuildingOfficeIcon className="h-5 w-5" />
            Tambah Supplier
          </Link>
          <Link
            to="/app/purchasing/price-comparison"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ChartBarIcon className="h-5 w-5" />
            Price Analysis
          </Link>
          <Link
            to="/app/purchasing/purchase-orders/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <DocumentTextIcon className="h-5 w-5" />
            Create PO
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Link
                  key={stat.name}
                  to={stat.link}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                    const Icon = activity.icon
                    return (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg bg-gray-100`}>
                          <Icon className={`h-4 w-4 ${activity.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-500">{activity.description}</p>
                          <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Pending Approvals */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Pending Approvals</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {pendingApprovals.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <ClockIcon className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-500">{item.supplier}</p>
                          <p className="text-xs text-gray-400">{item.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ${item.amount.toLocaleString()}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Link
                    to="/app/purchasing/purchase-orders?status=pending_approval"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View all pending approvals →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/app/purchasing/suppliers/new"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Add Supplier</p>
                  <p className="text-sm text-gray-500">Register new supplier</p>
                </div>
              </Link>
              
              <Link
                to="/app/purchasing/rfqs/new"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <DocumentTextIcon className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Create RFQ</p>
                  <p className="text-sm text-gray-500">Request for quotation</p>
                </div>
              </Link>
              
              <Link
                to="/app/purchasing/contracts/new"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ClipboardDocumentListIcon className="h-6 w-6 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">New Contract</p>
                  <p className="text-sm text-gray-500">Create supplier contract</p>
                </div>
              </Link>
              
              <Link
                to="/app/purchasing/price-comparison"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChartBarIcon className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="font-medium text-gray-900">Price Analysis</p>
                  <p className="text-sm text-gray-500">Compare supplier prices</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Other tab contents would be rendered here based on activeTab */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Supplier Management</h3>
            <p className="mt-1 text-sm text-gray-500">
              This section will show the SupplierList component
            </p>
            <div className="mt-6">
              <Link
                to="/app/purchasing/suppliers"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Suppliers
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'purchase-orders' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Purchase Order Management</h3>
            <p className="mt-1 text-sm text-gray-500">
              This section will show the PurchaseOrderList component
            </p>
            <div className="mt-6">
              <Link
                to="/app/purchasing/purchase-orders"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Purchase Orders
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'contracts' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Contract Management</h3>
            <p className="mt-1 text-sm text-gray-500">
              This section will show the ContractList component
            </p>
            <div className="mt-6">
              <Link
                to="/app/purchasing/contracts"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Contracts
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'price-comparison' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Price Analysis</h3>
            <p className="mt-1 text-sm text-gray-500">
              This section will show the PriceComparison component
            </p>
            <div className="mt-6">
              <Link
                to="/app/purchasing/price-comparison"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Price Analysis
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
