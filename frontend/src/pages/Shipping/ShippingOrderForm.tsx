import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import {
  CalculatorIcon,
  ChartBarIcon as Calculator,
  PlusIcon,
  TrashIcon,
  TruckIcon

} from '@heroicons/react/24/outline';
import { useGetCustomersQuery } from '../../services/api'
import { useCreateShippingOrderMutation, useGetLogisticsProvidersQuery } from '../../services/shippingApi'

interface ShippingItem {
  product_name: string
  quantity: number
  weight: number
  length: number
  width: number
  height: number
  value: number
}

export default function ShippingOrderForm() {
  const navigate = useNavigate()
  const { t } = useLanguage();
  
  const [createShippingOrder, { isLoading: isCreating }] = useCreateShippingOrderMutation()
  const { data: providersData } = useGetLogisticsProvidersQuery({})
  const { data: customersData } = useGetCustomersQuery({})

  const [formData, setFormData] = useState({
    customer_id: '',
    logistics_provider_id: '',
    shipping_date: new Date().toISOString().split('T')[0],
    recipient_name: '',
    recipient_address: '',
    recipient_phone: '',
    sender_name: '',
    sender_address: '',
    sender_phone: '',
    service_type: 'regular',
    insurance_value: 0,
    cod_amount: 0,
    notes: ''
  })

  const [items, setItems] = useState<ShippingItem[]>([
    {
      product_name: '',
      quantity: 1,
      weight: 0,
      length: 0,
      width: 0,
      height: 0,
      value: 0
    }
  ])

  const [shippingCost, setShippingCost] = useState(0)
  const [totalWeight, setTotalWeight] = useState(0)
  const [totalValue, setTotalValue] = useState(0)

  // Calculate totals when items change
  useEffect(() => {
    const weight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0)
    const value = items.reduce((sum, item) => sum + (item.value * item.quantity), 0)
    setTotalWeight(weight)
    setTotalValue(value)
    
    // Simple shipping cost calculation (can be enhanced)
    const baseCost = 15000 // Base cost
    const weightCost = weight * 2000 // Per kg
    const distanceCost = 5000 // Flat rate for now
    setShippingCost(baseCost + weightCost + distanceCost)
  }, [items])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCustomerChange = (customerId: string) => {
    const customer = customersData?.customers?.find((c: any) => c.id === parseInt(customerId))
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
        recipient_name: customer.name,
        recipient_address: customer.address,
        recipient_phone: customer.phone
      }))
    }
  }

  const handleItemChange = (index: number, field: keyof ShippingItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const addItem = () => {
    setItems(prev => [...prev, {
      product_name: '',
      quantity: 1,
      weight: 0,
      length: 0,
      width: 0,
      height: 0,
      value: 0
    }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const shippingData = {
        ...formData,
        customer_id: parseInt(formData.customer_id),
        logistics_provider_id: parseInt(formData.logistics_provider_id),
        total_weight: totalWeight,
        total_value: totalValue,
        shipping_cost: shippingCost,
        items: items
      }

      await createShippingOrder(shippingData).unwrap()
      navigate('/app/shipping')
    } catch (error) {
      console.error('Error creating shipping order:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Buat Pengiriman Baru</h1>
        <button
          onClick={() => navigate('/app/shipping')}
          className="btn-outline"
        >
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Provider Selection */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Informasi Dasar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <select
                name="customer_id"
                value={formData.customer_id}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="input"
                required
              >
                <option value="">Pilih Pelanggan</option>
                {customersData?.customers?.map((customer: any) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.company}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider Logistik
              </label>
              <select
                name="logistics_provider_id"
                value={formData.logistics_provider_id}
                onChange={handleInputChange}
                className="input"
                required
              >
                <option value="">Pilih Provider</option>
                {providersData?.logistics_providers?.map((provider: any) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} - {provider.service_type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Kirim
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Layanan
              </label>
              <select
                name="service_type"
                value={formData.service_type}
                onChange={handleInputChange}
                className="input"
              >
                <option value="regular">Regular</option>
                <option value="express">Express</option>
                <option value="same_day">Same Day</option>
                <option value="next_day">Next Day</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sender Information */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Informasi Pengirim</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Pengirim
              </label>
              <input
                type="text"
                name="sender_name"
                value={formData.sender_name}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telepon Pengirim
              </label>
              <input
                type="tel"
                name="sender_phone"
                value={formData.sender_phone}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alamat Pengirim
              </label>
              <textarea
                name="sender_address"
                value={formData.sender_address}
                onChange={handleInputChange}
                rows={3}
                className="input"
                required
              />
            </div>
          </div>
        </div>

        {/* Recipient Information */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Informasi Penerima</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Penerima
              </label>
              <input
                type="text"
                name="recipient_name"
                value={formData.recipient_name}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telepon Penerima
              </label>
              <input
                type="tel"
                name="recipient_phone"
                value={formData.recipient_phone}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alamat Penerima
              </label>
              <textarea
                name="recipient_address"
                value={formData.recipient_address}
                onChange={handleInputChange}
                rows={3}
                className="input"
                required
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Item Pengiriman</h2>
            <button
              type="button"
              onClick={addItem}
              className="btn-outline inline-flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Tambah Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Item {index + 1}</h3>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-500"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Produk
                    </label>
                    <input
                      type="text"
                      value={item.product_name}
                      onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Berat (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={item.weight}
                      onChange={(e) => handleItemChange(index, 'weight', parseFloat(e.target.value))}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Panjang (cm)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={item.length}
                      onChange={(e) => handleItemChange(index, 'length', parseFloat(e.target.value))}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lebar (cm)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={item.width}
                      onChange={(e) => handleItemChange(index, 'width', parseFloat(e.target.value))}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tinggi (cm)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={item.height}
                      onChange={(e) => handleItemChange(index, 'height', parseFloat(e.target.value))}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nilai (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={item.value}
                      onChange={(e) => handleItemChange(index, 'value', parseFloat(e.target.value))}
                      className="input"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Options */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Opsi Tambahan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nilai Asuransi (Rp)
              </label>
              <input
                type="number"
                name="insurance_value"
                value={formData.insurance_value}
                onChange={handleInputChange}
                className="input"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                COD Amount (Rp)
              </label>
              <input
                type="number"
                name="cod_amount"
                value={formData.cod_amount}
                onChange={handleInputChange}
                className="input"
                min="0"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="input"
                placeholder="Catatan khusus untuk pengiriman..."
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="card bg-blue-50 border-blue-200">
          <h2 className="text-lg font-medium text-blue-900 mb-4 flex items-center gap-2">
            <CalculatorIcon className="h-5 w-5" />
            Ringkasan Pengiriman
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm font-medium text-blue-700">Total Berat</dt>
              <dd className="text-lg font-semibold text-blue-900">{totalWeight.toFixed(1)} kg</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-blue-700">Total Nilai</dt>
              <dd className="text-lg font-semibold text-blue-900">
                Rp {totalValue.toLocaleString('id-ID')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-blue-700">Estimasi Biaya Kirim</dt>
              <dd className="text-lg font-semibold text-blue-900">
                Rp {shippingCost.toLocaleString('id-ID')}
              </dd>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/app/shipping')}
            className="btn-outline"
          >
          </button>
          <button
            type="submit"
            disabled={isCreating}
            className="btn-primary inline-flex items-center gap-2"
          >
            <TruckIcon className="h-5 w-5" />
            {isCreating ? 'Membuat...' : 'Buat Pengiriman'}
          </button>
        </div>
      </form>
    </div>
  )
}
