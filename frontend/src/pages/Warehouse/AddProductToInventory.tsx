import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeftIcon,
  CubeIcon,
  MapPinIcon,
  CheckCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import axiosInstance from '../../utils/axiosConfig'

interface Product {
  id: number
  code: string
  name: string
  primary_uom: string
  category: string
}

interface Location {
  id: number
  location_code: string
  zone_name: string
  zone_material_type: string
  available: number
}

export default function AddProductToInventory() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [searchProduct, setSearchProduct] = useState('')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    location_id: '',
    quantity: '',
    batch_number: '',
    lot_number: '',
    production_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    stock_status: 'released',
    notes: ''
  })

  useEffect(() => {
    fetchProducts()
    fetchLocations()
  }, [])

  useEffect(() => {
    if (searchProduct.length > 0) {
      const filtered = products.filter(p =>
        p.code.toLowerCase().includes(searchProduct.toLowerCase()) ||
        p.name.toLowerCase().includes(searchProduct.toLowerCase())
      )
      setFilteredProducts(filtered)
      setShowProductDropdown(true)
    } else {
      setFilteredProducts([])
      setShowProductDropdown(false)
    }
  }, [searchProduct, products])

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get('/api/products-new/?per_page=1000')
      const mappedProducts = (response.data.products || []).map((p: any) => ({
        id: p.id,
        code: p.kode_produk || p.code,
        name: p.nama_produk || p.name,
        primary_uom: p.satuan || p.primary_uom || 'pcs',
      }))
      setProducts(mappedProducts)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchLocations = async () => {
    try {
      // Get locations for finished goods
      const response = await axiosInstance.get('/api/warehouse/locations?material_type=finished_goods&available_only=true&per_page=100')
      setLocations(response.data.locations || [])
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const selectProduct = (product: Product) => {
    setFormData({
      ...formData,
      product_id: product.id.toString(),
      product_name: `${product.code} - ${product.name}`
    })
    setSearchProduct(`${product.code} - ${product.name}`)
    setShowProductDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.product_id || !formData.location_id || !formData.quantity) {
      alert('Produk, lokasi, dan kuantitas wajib diisi')
      return
    }

    setLoading(true)
    try {
      const payload = {
        product_id: parseInt(formData.product_id),
        location_id: parseInt(formData.location_id),
        quantity: parseFloat(formData.quantity),
        batch_number: formData.batch_number || null,
        lot_number: formData.lot_number || null,
        production_date: formData.production_date || null,
        expiry_date: formData.expiry_date || null,
        stock_status: formData.stock_status,
        notes: formData.notes,
        reference_type: 'manual_input'
      }

      await axiosInstance.post('/api/warehouse/inventory/add', payload)
      alert('Produk berhasil ditambahkan ke inventori!')
      navigate('/app/warehouse/inventory')
    } catch (error: any) {
      console.error('Error adding to inventory:', error)
      alert(error.response?.data?.message || 'Gagal menambahkan produk ke inventori')
    } finally {
      setLoading(false)
    }
  }

  const generateBatchNumber = () => {
    const date = new Date()
    const batch = `BATCH-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    setFormData({ ...formData, batch_number: batch })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/warehouse/inventory" className="text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Produk ke Inventori</h1>
          <p className="text-gray-600">Input stok produk jadi ke gudang</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Selection */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CubeIcon className="h-5 w-5 text-blue-600" />
            Pilih Produk
          </h2>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cari Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              placeholder="Ketik kode atau nama produk..."
              className="input w-full"
              autoComplete="off"
            />
            
            {showProductDropdown && filteredProducts.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => selectProduct(product)}
                    className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium">{product.code}</span>
                      <span className="text-gray-600 ml-2">{product.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{product.primary_uom}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {formData.product_id && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800">Produk dipilih: {formData.product_name}</span>
            </div>
          )}
        </div>

        {/* Location & Quantity */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPinIcon className="h-5 w-5 text-green-600" />
            Lokasi & Kuantitas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lokasi Gudang <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                className="input w-full"
                required
              >
                <option value="">Pilih Lokasi</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.location_code} ({loc.zone_name}) - Tersedia: {loc.available.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kuantitas <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="0"
                min="0.01"
                step="0.01"
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomor Batch
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.batch_number}
                  onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  placeholder="BATCH-YYYYMMDD-XXXX"
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={generateBatchNumber}
                  className="btn-secondary px-3"
                  title="Generate Batch Number"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomor Lot
              </label>
              <input
                type="text"
                value={formData.lot_number}
                onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
                placeholder="LOT-XXXX"
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Produksi
              </label>
              <input
                type="date"
                value={formData.production_date}
                onChange={(e) => setFormData({ ...formData, production_date: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Kadaluarsa
              </label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status QC
              </label>
              <select
                value={formData.stock_status}
                onChange={(e) => setFormData({ ...formData, stock_status: e.target.value })}
                className="input w-full"
              >
                <option value="released">Released (Lulus QC)</option>
                <option value="quarantine">Quarantine (Ditahan)</option>
                <option value="reject">Reject (Ditolak)</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Catatan tambahan..."
              className="input w-full"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link to="/app/warehouse/inventory" className="btn-secondary">
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading || !formData.product_id || !formData.location_id || !formData.quantity}
            className="btn-primary inline-flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5" />
                Simpan ke Inventori
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
