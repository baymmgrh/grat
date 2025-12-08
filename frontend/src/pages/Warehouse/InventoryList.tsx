import { useLanguage } from '../../contexts/LanguageContext';
import { useGetInventoryQuery, useGetWarehouseDashboardQuery } from '../../services/api';
import { Package, Layers, Box } from 'lucide-react';

export default function InventoryList() {
    const { t } = useLanguage();

const { data: inventory, isLoading } = useGetInventoryQuery({})
  const { data: dashboard } = useGetWarehouseDashboardQuery({})

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>

      {dashboard?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-blue-600">{dashboard.summary.total_items || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Products + Materials</p>
              </div>
              <Box className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-green-600">{dashboard.summary.total_products || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Finished Goods</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Materials</p>
                <p className="text-2xl font-bold text-purple-600">{dashboard.summary.total_materials || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Raw Materials</p>
              </div>
              <Layers className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Quantity</p>
                <p className="text-2xl font-bold text-orange-600">{dashboard.summary.total_quantity?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-500 mt-1">All Units</p>
              </div>
              <Box className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">{t('common.loading')}</div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Location</th>
                  <th>{t('common.quantity')}</th>
                  <th>Available</th>
                  <th>Reserved</th>
                  <th>Batch Number</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inventory?.inventory?.map((item: any) => (
                  <tr key={item.id}>
                    <td className="font-medium">{item.product_code}</td>
                    <td>{item.product_name}</td>
                    <td>{item.location_code}</td>
                    <td>{item.quantity}</td>
                    <td className="text-green-600 font-medium">{item.available_quantity}</td>
                    <td className="text-orange-600">{item.reserved_quantity}</td>
                    <td>{item.batch_number || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
