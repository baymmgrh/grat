import { useLanguage } from '../../contexts/LanguageContext';
import { useGetInventoryQuery, useGetWarehouseDashboardQuery } from '../../services/api';
import { Package, Layers, Box } from 'lucide-react';

export default function InventoryList() {
    const { t } = useLanguage();

const { data: inventory, isLoading } = useGetInventoryQuery({})
  const { data: dashboard } = useGetWarehouseDashboardQuery({})

  // Category group mapping
  const getCategoryGroup = (category: string): string => {
    const packagingCategories = ['packaging', 'carton_box', 'inner_box', 'jerigen', 'botol'];
    const aksesorisCategories = ['stc', 'fliptop', 'plastik'];
    const chemicalCategories = ['parfum', 'chemical'];
    
    const catLower = (category || '').toLowerCase();
    if (packagingCategories.includes(catLower)) return 'Packaging';
    if (aksesorisCategories.includes(catLower)) return 'Aksesoris';
    if (chemicalCategories.includes(catLower)) return 'Chemical';
    return 'Lainnya';
  };

  const getCategoryColor = (category: string) => {
    const group = getCategoryGroup(category);
    switch (group) {
      case 'Packaging':
        return 'bg-green-100 text-green-800';
      case 'Aksesoris':
        return 'bg-purple-100 text-purple-800';
      case 'Chemical':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      packaging: 'Packaging',
      carton_box: 'Carton Box',
      inner_box: 'Inner Box',
      jerigen: 'Jerigen',
      botol: 'Botol',
      stc: 'STC',
      fliptop: 'Fliptop',
      plastik: 'Plastik',
      parfum: 'Parfum',
      chemical: 'Chemical',
      nonwoven: 'Nonwoven',
      tissue: 'Tissue'
    };
    return labels[category?.toLowerCase()] || category || '-';
  };

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
                  <th>Code</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Kategori</th>
                  <th>Location</th>
                  <th>{t('common.quantity')}</th>
                  <th>Available</th>
                  <th>Reserved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inventory?.inventory?.map((item: any) => (
                  <tr key={item.id}>
                    <td className="font-medium">{item.item_code}</td>
                    <td>{item.item_name}</td>
                    <td>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.item_type === 'product' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.item_type === 'product' ? 'Product' : 'Material'}
                      </span>
                    </td>
                    <td>
                      {item.category ? (
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getCategoryColor(item.category)}`}>
                            {getCategoryGroup(item.category)}
                          </span>
                          <span className="text-xs text-gray-500">{getCategoryLabel(item.category)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td>{item.location_code}</td>
                    <td>{item.quantity_on_hand}</td>
                    <td className="text-green-600 font-medium">{item.quantity_available}</td>
                    <td className="text-orange-600">{item.quantity_reserved}</td>
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
