import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ArrowPathIcon,
  CubeIcon,
  BeakerIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import axiosInstance from '../../utils/axiosConfig'

interface InventoryItem {
  id: number
  item_type: 'product' | 'material'
  product_id: number | null
  material_id: number | null
  item_code: string
  item_name: string
  material_type: string | null
  category: string | null
  location_id: number
  location_code: string
  zone_name: string
  quantity_on_hand: number
  quantity_reserved: number
  quantity_available: number
  min_stock_level: number
  max_stock_level: number
  batch_number: string
  lot_number: string
  production_date: string | null
  expiry_date: string | null
  stock_status: string
  uom: string
  updated_at: string | null
}

interface Zone {
  id: number
  code: string
  name: string
  material_type: string
}

export default function InventoryListEnhanced() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Filters
  const [search, setSearch] = useState('')
  const [itemType, setItemType] = useState<string>('')
  const [zoneId, setZoneId] = useState<string>('')
  const [stockStatus, setStockStatus] = useState<string>('')
  const [categoryGroup, setCategoryGroup] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  // Summary
  const [summary, setSummary] = useState({
    total_products: 0,
    total_materials: 0,
    total_quantity: 0,
    low_stock_count: 0
  })

  useEffect(() => {
    fetchZones()
  }, [])

  useEffect(() => {
    fetchInventory()
  }, [currentPage, search, itemType, zoneId, stockStatus, categoryGroup])

  const fetchZones = async () => {
    try {
      const response = await axiosInstance.get('/api/warehouse/zones')
      setZones(response.data.zones || [])
    } catch (error) {
      console.error('Error fetching zones:', error)
    }
  }

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20'
      })
      
      if (search) params.append('search', search)
      if (itemType) params.append('item_type', itemType)
      if (zoneId) params.append('zone_id', zoneId)
      if (stockStatus) params.append('stock_status', stockStatus)
      if (categoryGroup) params.append('category_group', categoryGroup)

      const response = await axiosInstance.get(`/api/warehouse/inventory?${params}`)
      setInventory(response.data.inventory || [])
      setTotalItems(response.data.total || 0)
      setTotalPages(response.data.pages || 1)

      // Calculate summary
      const items = response.data.inventory || []
      const products = items.filter((i: InventoryItem) => i.item_type === 'product')
      const materials = items.filter((i: InventoryItem) => i.item_type === 'material')
      const totalQty = items.reduce((sum: number, i: InventoryItem) => sum + i.quantity_on_hand, 0)
      const lowStock = items.filter((i: InventoryItem) => i.quantity_on_hand <= i.min_stock_level && i.min_stock_level > 0)

      setSummary({
        total_products: products.length,
        total_materials: materials.length,
        total_quantity: totalQty,
        low_stock_count: lowStock.length
      })
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStockStatusBadge = (item: InventoryItem) => {
    const qty = item.quantity_on_hand
    const minStock = item.min_stock_level
    
    if (qty <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircleIcon className="h-3 w-3" />
          Habis
        </span>
      )
    }
    
    if (minStock > 0 && qty <= minStock) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ExclamationTriangleIcon className="h-3 w-3" />
          Stok Rendah
        </span>
      )
    }
    
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircleIcon className="h-3 w-3" />
        Tersedia
      </span>
    )
  }

  const getItemTypeBadge = (type: string) => {
    if (type === 'product') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CubeIcon className="h-3 w-3" />
          Produk
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        <BeakerIcon className="h-3 w-3" />
        Material
      </span>
    )
  }

  // Category group mapping
  const getCategoryGroup = (category: string): string => {
    const kainCategories = ['main_roll', 'jumbo_roll', 'spunbond', 'meltblown', 'kain', 'nonwoven']
    const packagingCategories = ['packaging', 'carton_box', 'inner_box', 'jerigen', 'botol']
    const aksesorisCategories = ['stc', 'fliptop', 'plastik']
    const chemicalCategories = ['parfum', 'chemical']
    
    const catLower = (category || '').toLowerCase()
    if (kainCategories.includes(catLower)) return 'Kain'
    if (packagingCategories.includes(catLower)) return 'Packaging'
    if (aksesorisCategories.includes(catLower)) return 'Aksesoris'
    if (chemicalCategories.includes(catLower)) return 'Chemical'
    return 'Lainnya'
  }

  const getCategoryColor = (category: string) => {
    const group = getCategoryGroup(category)
    switch (group) {
      case 'Kain':
        return 'bg-blue-100 text-blue-800'
      case 'Packaging':
        return 'bg-green-100 text-green-800'
      case 'Aksesoris':
        return 'bg-purple-100 text-purple-800'
      case 'Chemical':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      main_roll: 'Main Roll',
      jumbo_roll: 'Jumbo Roll',
      spunbond: 'Spunbond',
      meltblown: 'Melt Blown',
      kain: 'Kain',
      nonwoven: 'Nonwoven',
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
      tissue: 'Tissue',
      other_raw: 'Raw Material'
    }
    return labels[category?.toLowerCase()] || category || '-'
  }

  const handleExport = async () => {
    try {
      const response = await axiosInstance.get('/api/warehouse/inventory/export', {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting:', error)
      alert('Gagal export data')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventori Gudang</h1>
          <p className="text-gray-600">Kelola stok produk dan bahan baku</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export
          </button>
          <Link to="/app/warehouse/stock-input" className="btn-secondary inline-flex items-center gap-2">
            <BeakerIcon className="h-5 w-5" />
            Input Material
          </Link>
          <Link to="/app/warehouse/inventory/add-product" className="btn-primary inline-flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            Tambah Produk
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Produk</p>
              <p className="text-2xl font-bold text-blue-600">{summary.total_products}</p>
            </div>
            <CubeIcon className="h-10 w-10 text-blue-200" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Material</p>
              <p className="text-2xl font-bold text-purple-600">{summary.total_materials}</p>
            </div>
            <BeakerIcon className="h-10 w-10 text-purple-200" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Kuantitas</p>
              <p className="text-2xl font-bold text-green-600">{summary.total_quantity.toLocaleString()}</p>
            </div>
            <MapPinIcon className="h-10 w-10 text-green-200" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stok Rendah</p>
              <p className="text-2xl font-bold text-red-600">{summary.low_stock_count}</p>
            </div>
            <ExclamationTriangleIcon className="h-10 w-10 text-red-200" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kode, nama produk/material, atau batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary inline-flex items-center gap-2 ${showFilters ? 'bg-blue-50' : ''}`}
          >
            <FunnelIcon className="h-5 w-5" />
            Filter
          </button>
          <button onClick={fetchInventory} className="btn-secondary inline-flex items-center gap-2">
            <ArrowPathIcon className="h-5 w-5" />
            Refresh
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Item</label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                className="input w-full"
              >
                <option value="">Semua</option>
                <option value="product">Produk</option>
                <option value="material">Material</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select
                value={categoryGroup}
                onChange={(e) => setCategoryGroup(e.target.value)}
                className="input w-full"
              >
                <option value="">Semua Kategori</option>
                <option value="kain">🔵 Kain</option>
                <option value="packaging">🟢 Packaging</option>
                <option value="aksesoris">🟣 Aksesoris</option>
                <option value="chemical">🟠 Chemical</option>
                <option value="lainnya">⚪ Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zona Gudang</label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="input w-full"
              >
                <option value="">Semua Zona</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} ({zone.material_type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status Stok</label>
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value)}
                className="input w-full"
              >
                <option value="">Semua Status</option>
                <option value="available">Tersedia (Stok &gt; 0)</option>
                <option value="low_stock">Stok Rendah</option>
                <option value="out_of_stock">Habis (Stok = 0)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Inventory Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Memuat data...</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="p-8 text-center">
            <CubeIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Tidak ada data inventori</p>
            <Link to="/app/warehouse/stock-input" className="btn-primary mt-4 inline-flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              Input Stok Pertama
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lokasi</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stok</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tersedia</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reserved</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expired</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getItemTypeBadge(item.item_type)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                        {item.item_code}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{item.item_name}</div>
                        <div className="text-xs text-gray-500">{item.uom}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.category ? (
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(item.category)}`}>
                              {getCategoryGroup(item.category)}
                            </span>
                            <span className="text-xs text-gray-500">{getCategoryLabel(item.category)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.location_code}</div>
                        <div className="text-xs text-gray-500">{item.zone_name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-medium">
                        {item.quantity_on_hand.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-green-600 font-medium">
                        {item.quantity_available.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-orange-600">
                        {item.quantity_reserved.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {item.batch_number || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStockStatusBadge(item)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {item.expiry_date ? (
                          <span className={new Date(item.expiry_date) < new Date() ? 'text-red-600 font-medium' : 'text-gray-600'}>
                            {new Date(item.expiry_date).toLocaleDateString('id-ID')}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Menampilkan {inventory.length} dari {totalItems} item
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                <span className="text-sm text-gray-600">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
