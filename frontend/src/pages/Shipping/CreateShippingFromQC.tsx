import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import toast from 'react-hot-toast'
import {
  TruckIcon,
  CheckCircleIcon,
  UserIcon,
  IdentificationIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  CubeIcon,
  ArrowLeftIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

interface ReadyForShippingItem {
  work_order_id: number
  work_order_number: string
  qc_inspection_id: number
  qc_number: string
  qc_date: string | null
  product_id: number
  product_code: string | null
  product_name: string
  quantity_produced: number
  quantity_passed: number
  uom: string
  batch_number: string | null
  sales_order_id: number | null
  sales_order_number: string | null
  customer_id: number | null
  customer_name: string
  delivery_address: string | null
  production_date: string | null
  notes: string | null
}

interface LogisticsProvider {
  id: number
  name: string
  service_type: string
}

export default function CreateShippingFromQC() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  
  const [readyItems, setReadyItems] = useState<ReadyForShippingItem[]>([])
  const [selectedItem, setSelectedItem] = useState<ReadyForShippingItem | null>(null)
  const [providers, setProviders] = useState<LogisticsProvider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [deliveryMethod, setDeliveryMethod] = useState<'expedition' | 'self_pickup'>('expedition')
  const [formData, setFormData] = useState({
    shipping_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    logistics_provider_id: '',
    tracking_number: '',
    
    // Vehicle & Driver Info
    vehicle_number: '',
    vehicle_type: '',
    driver_name: '',
    driver_phone: '',
    driver_id_number: '',      // KTP Supir
    driver_license_number: '', // SIM Supir
    
    // Self Pickup Info
    pickup_person_name: '',
    pickup_person_id: '',      // KTP Pengambil
    pickup_person_phone: '',
    pickup_authorization: '',
    
    shipping_address: '',
    shipping_cost: 0,
    total_weight: 0,
    number_of_packages: 1,
    notes: ''
  })

  // Fetch ready for shipping items
  useEffect(() => {
    fetchReadyItems()
    fetchProviders()
  }, [])

  const fetchReadyItems = async () => {
    try {
      const response = await fetch('/api/shipping/ready-for-shipping', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setReadyItems(data.ready_for_shipping || [])
      }
    } catch (error) {
      console.error('Error fetching ready items:', error)
      toast.error('Gagal memuat data')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/shipping/providers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setProviders(data.logistics_providers || [])
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
    }
  }

  const handleSelectItem = (item: ReadyForShippingItem) => {
    setSelectedItem(item)
    setFormData(prev => ({
      ...prev,
      shipping_address: item.delivery_address || ''
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedItem) {
      toast.error('Pilih item yang akan dikirim')
      return
    }

    if (deliveryMethod === 'expedition' && !formData.logistics_provider_id) {
      toast.error('Pilih provider logistik')
      return
    }

    if (deliveryMethod === 'self_pickup' && !formData.pickup_person_name) {
      toast.error('Isi nama pengambil')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        work_order_id: selectedItem.work_order_id,
        qc_inspection_id: selectedItem.qc_inspection_id,
        customer_id: selectedItem.customer_id,
        delivery_method: deliveryMethod,
        ...formData,
        logistics_provider_id: formData.logistics_provider_id ? parseInt(formData.logistics_provider_id) : null,
        shipping_cost: parseFloat(formData.shipping_cost.toString()) || 0,
        total_weight: parseFloat(formData.total_weight.toString()) || 0,
        number_of_packages: parseInt(formData.number_of_packages.toString()) || 1
      }

      const response = await fetch('/api/shipping/create-from-qc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Shipping ${result.shipping_number} berhasil dibuat!`)
        navigate('/app/shipping')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal membuat shipping')
      }
    } catch (error) {
      console.error('Error creating shipping:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/shipping')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Buat Pengiriman dari QC</h1>
            <p className="text-gray-600">Pilih produk yang sudah lulus QC untuk dikirim</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Ready Items List */}
        <div className="lg:col-span-1">
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              Siap Kirim ({readyItems.length})
            </h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : readyItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CubeIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Tidak ada item siap kirim</p>
                <p className="text-sm">Pastikan ada Work Order yang sudah lulus QC</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {readyItems.map((item) => (
                  <div
                    key={item.work_order_id}
                    onClick={() => handleSelectItem(item)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedItem?.work_order_id === item.work_order_id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-blue-600">{item.work_order_number}</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        QC Pass
                      </span>
                    </div>
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-sm text-gray-500">{item.product_code}</p>
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-gray-600">Qty: {item.quantity_passed.toLocaleString()} {item.uom}</span>
                      <span className="text-gray-500">{formatDate(item.qc_date)}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        <BuildingOfficeIcon className="h-4 w-4 inline mr-1" />
                        {item.customer_name}
                      </p>
                      {item.sales_order_number && (
                        <p className="text-xs text-gray-500">SO: {item.sales_order_number}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Shipping Form */}
        <div className="lg:col-span-2">
          {!selectedItem ? (
            <div className="card p-8 text-center">
              <TruckIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Pilih Item untuk Dikirim</h3>
              <p className="text-gray-500">Klik salah satu item di sebelah kiri untuk membuat pengiriman</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selected Item Info */}
              <div className="card p-4 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">Item yang Dipilih</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">Work Order</span>
                    <p className="font-medium">{selectedItem.work_order_number}</p>
                  </div>
                  <div>
                    <span className="text-blue-600">Produk</span>
                    <p className="font-medium">{selectedItem.product_name}</p>
                  </div>
                  <div>
                    <span className="text-blue-600">Quantity</span>
                    <p className="font-medium">{selectedItem.quantity_passed.toLocaleString()} {selectedItem.uom}</p>
                  </div>
                  <div>
                    <span className="text-blue-600">Customer</span>
                    <p className="font-medium">{selectedItem.customer_name}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Method Selection */}
              <div className="card p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Metode Pengiriman</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('expedition')}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      deliveryMethod === 'expedition'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <TruckIcon className={`h-8 w-8 mb-2 ${deliveryMethod === 'expedition' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <p className="font-semibold">Via Ekspedisi</p>
                    <p className="text-sm text-gray-500">Kirim melalui jasa ekspedisi/kurir</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('self_pickup')}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      deliveryMethod === 'self_pickup'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <UserIcon className={`h-8 w-8 mb-2 ${deliveryMethod === 'self_pickup' ? 'text-green-600' : 'text-gray-400'}`} />
                    <p className="font-semibold">Diambil Sendiri</p>
                    <p className="text-sm text-gray-500">Customer mengambil langsung</p>
                  </button>
                </div>
              </div>

              {/* Shipping Date */}
              <div className="card p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Tanggal Pengiriman
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Kirim *</label>
                    <input
                      type="date"
                      name="shipping_date"
                      value={formData.shipping_date}
                      onChange={handleInputChange}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimasi Tiba</label>
                    <input
                      type="date"
                      name="expected_delivery_date"
                      value={formData.expected_delivery_date}
                      onChange={handleInputChange}
                      className="input"
                    />
                  </div>
                </div>
              </div>

              {/* Expedition Info */}
              {deliveryMethod === 'expedition' && (
                <div className="card p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TruckIcon className="h-5 w-5" />
                    Informasi Ekspedisi
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Provider Logistik *</label>
                      <select
                        name="logistics_provider_id"
                        value={formData.logistics_provider_id}
                        onChange={handleInputChange}
                        className="input"
                        required={deliveryMethod === 'expedition'}
                      >
                        <option value="">Pilih Provider</option>
                        {providers.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} - {p.service_type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">No. Resi</label>
                      <input
                        type="text"
                        name="tracking_number"
                        value={formData.tracking_number}
                        onChange={handleInputChange}
                        className="input"
                        placeholder="Nomor resi pengiriman"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Vehicle & Driver Info */}
              <div className="card p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <IdentificationIcon className="h-5 w-5" />
                  {deliveryMethod === 'expedition' ? 'Informasi Kendaraan & Supir' : 'Informasi Pengambil'}
                </h3>
                
                {deliveryMethod === 'expedition' ? (
                  <div className="space-y-4">
                    {/* Vehicle Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nomor Polisi Kendaraan
                        </label>
                        <input
                          type="text"
                          name="vehicle_number"
                          value={formData.vehicle_number}
                          onChange={handleInputChange}
                          className="input"
                          placeholder="B 1234 ABC"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Jenis Kendaraan
                        </label>
                        <select
                          name="vehicle_type"
                          value={formData.vehicle_type}
                          onChange={handleInputChange}
                          className="input"
                        >
                          <option value="">Pilih Jenis</option>
                          <option value="Motor">Motor</option>
                          <option value="Mobil Box">Mobil Box</option>
                          <option value="Pickup">Pickup</option>
                          <option value="Truk Engkel">Truk Engkel</option>
                          <option value="Truk Fuso">Truk Fuso</option>
                          <option value="Truk Tronton">Truk Tronton</option>
                          <option value="Container">Container</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Driver Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nama Supir
                        </label>
                        <input
                          type="text"
                          name="driver_name"
                          value={formData.driver_name}
                          onChange={handleInputChange}
                          className="input"
                          placeholder="Nama lengkap supir"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          No. HP Supir
                        </label>
                        <input
                          type="tel"
                          name="driver_phone"
                          value={formData.driver_phone}
                          onChange={handleInputChange}
                          className="input"
                          placeholder="08xxxxxxxxxx"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          No. KTP Supir
                        </label>
                        <input
                          type="text"
                          name="driver_id_number"
                          value={formData.driver_id_number}
                          onChange={handleInputChange}
                          className="input"
                          placeholder="16 digit nomor KTP"
                          maxLength={16}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          No. SIM Supir
                        </label>
                        <input
                          type="text"
                          name="driver_license_number"
                          value={formData.driver_license_number}
                          onChange={handleInputChange}
                          className="input"
                          placeholder="Nomor SIM"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Self Pickup Info */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nama Pengambil *
                        </label>
                        <input
                          type="text"
                          name="pickup_person_name"
                          value={formData.pickup_person_name}
                          onChange={handleInputChange}
                          className="input"
                          placeholder="Nama lengkap pengambil"
                          required={deliveryMethod === 'self_pickup'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          No. HP Pengambil
                        </label>
                        <input
                          type="tel"
                          name="pickup_person_phone"
                          value={formData.pickup_person_phone}
                          onChange={handleInputChange}
                          className="input"
                          placeholder="08xxxxxxxxxx"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          No. KTP Pengambil *
                        </label>
                        <input
                          type="text"
                          name="pickup_person_id"
                          value={formData.pickup_person_id}
                          onChange={handleInputChange}
                          className="input"
                          placeholder="16 digit nomor KTP"
                          maxLength={16}
                          required={deliveryMethod === 'self_pickup'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nomor Polisi Kendaraan
                        </label>
                        <input
                          type="text"
                          name="vehicle_number"
                          value={formData.vehicle_number}
                          onChange={handleInputChange}
                          className="input"
                          placeholder="B 1234 ABC"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Surat Kuasa / Otorisasi
                      </label>
                      <textarea
                        name="pickup_authorization"
                        value={formData.pickup_authorization}
                        onChange={handleInputChange}
                        className="input"
                        rows={2}
                        placeholder="Nomor surat kuasa atau keterangan otorisasi"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Shipping Details */}
              <div className="card p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5" />
                  Detail Pengiriman
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alamat Tujuan
                    </label>
                    <textarea
                      name="shipping_address"
                      value={formData.shipping_address}
                      onChange={handleInputChange}
                      className="input"
                      rows={3}
                      placeholder="Alamat lengkap tujuan pengiriman"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jumlah Koli/Paket
                      </label>
                      <input
                        type="number"
                        name="number_of_packages"
                        value={formData.number_of_packages}
                        onChange={handleInputChange}
                        className="input"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Berat (kg)
                      </label>
                      <input
                        type="number"
                        name="total_weight"
                        value={formData.total_weight}
                        onChange={handleInputChange}
                        className="input"
                        step="0.1"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Biaya Kirim (Rp)
                      </label>
                      <input
                        type="number"
                        name="shipping_cost"
                        value={formData.shipping_cost}
                        onChange={handleInputChange}
                        className="input"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catatan
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="input"
                      rows={2}
                      placeholder="Catatan tambahan untuk pengiriman"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/app/shipping')}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <TruckIcon className="h-5 w-5 mr-2" />
                      Buat Pengiriman
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
