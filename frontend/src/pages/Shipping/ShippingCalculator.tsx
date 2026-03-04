import React, { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext';
import { useGetLogisticsProvidersQuery } from '../../services/shippingApi'
import {
  BanknotesIcon,
  CalculatorIcon,
  ChartBarIcon as Calculator,
  CubeIcon,
  MapPinIcon,
  TruckIcon

} from '@heroicons/react/24/outline';

interface CalculatorResult {
  provider: string
  service_type: string
  base_cost: number
  weight_cost: number
  distance_cost: number
  total_cost: number
  estimated_days: number
}

export default function ShippingCalculator() {
  const { t } = useLanguage();
  const { data: providersData } = useGetLogisticsProvidersQuery({})
  
  const [formData, setFormData] = useState({
    origin_city: 'Tangerang',
    destination_city: '',
    weight: 0,
    length: 0,
    width: 0,
    height: 0,
    value: 0,
    service_type: 'regular'
  })
  
  const [results, setResults] = useState<CalculatorResult[]>([])
  const [isCalculating, setIsCalculating] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'weight' || name === 'length' || name === 'width' || name === 'height' || name === 'value' 
        ? parseFloat(value) || 0 
        : value
    }))
  }

  const calculateShippingCosts = () => {
    setIsCalculating(true)
    
    // Simulate calculation delay
    setTimeout(() => {
      const calculatedResults: CalculatorResult[] = []
      
      // Base costs by service type
      const baseCosts = {
        same_day: 50000,
        next_day: 35000,
        express: 25000,
        regular: 15000
      }
      
      // Estimated delivery days
      const deliveryDays = {
        same_day: 1,
        next_day: 1,
        express: 2,
        regular: 3
      }
      
      // Distance factor (simplified - in real app would use actual distance API)
      const distanceFactor = getDistanceFactor(formData.destination_city)
      
      // Calculate for each provider
      providersData?.logistics_providers?.forEach((provider: any) => {
        const serviceTypes = ['regular', 'express', 'same_day', 'next_day']
        
        serviceTypes.forEach(serviceType => {
          if (provider.service_type === serviceType || provider.service_type === 'all') {
            const baseCost = baseCosts[serviceType as keyof typeof baseCosts] || 15000
            const weightCost = formData.weight * 2000 // Rp 2000 per kg
            const distanceCost = baseCost * distanceFactor
            const totalCost = baseCost + weightCost + distanceCost
            
            calculatedResults.push({
              provider: provider.name,
              service_type: serviceType,
              base_cost: baseCost,
              weight_cost: weightCost,
              distance_cost: distanceCost,
              total_cost: totalCost,
              estimated_days: deliveryDays[serviceType as keyof typeof deliveryDays] + 
                            (distanceFactor > 1.5 ? 1 : 0)
            })
          }
        })
      })
      
      // Sort by total cost
      calculatedResults.sort((a, b) => a.total_cost - b.total_cost)
      
      setResults(calculatedResults)
      setIsCalculating(false)
    }, 1000)
  }

  const getDistanceFactor = (destination: string): number => {
    // Simplified distance calculation
    const distances: { [key: string]: number } = {
      'jakarta': 1.0,
      'bandung': 1.2,
      'surabaya': 2.0,
      'medan': 3.0,
      'makassar': 3.5,
      'bali': 2.5,
      'yogyakarta': 1.5,
      'semarang': 1.3,
      'palembang': 2.2,
      'balikpapan': 3.2
    }
    
    const city = destination.toLowerCase()
    return distances[city] || 1.5 // Default factor
  }

  const getServiceTypeLabel = (serviceType: string) => {
    const labels = {
      same_day: 'Same Day',
      next_day: 'Next Day',
      express: 'Express',
      regular: 'Regular'
    }
    return labels[serviceType as keyof typeof labels] || serviceType
  }

  const getServiceTypeColor = (serviceType: string) => {
    const colors = {
      same_day: 'bg-red-100 text-red-800',
      next_day: 'bg-orange-100 text-orange-800',
      express: 'bg-blue-100 text-blue-800',
      regular: 'bg-green-100 text-green-800'
    }
    return colors[serviceType as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Kalkulator Biaya Pengiriman</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator Form */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <CalculatorIcon className="h-5 w-5" />
            Detail Pengiriman
          </h2>
          
          <div className="space-y-4">
            {/* Origin & Destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPinIcon className="h-4 w-4 inline mr-1" />
                  Kota Asal
                </label>
                <input
                  type="text"
                  name="origin_city"
                  value={formData.origin_city}
                  onChange={handleInputChange}
                  className="input"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPinIcon className="h-4 w-4 inline mr-1" />
                  Kota Tujuan
                </label>
                <select
                  name="destination_city"
                  value={formData.destination_city}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="">Pilih Kota Tujuan</option>
                  <option value="jakarta">Jakarta</option>
                  <option value="bandung">Bandung</option>
                  <option value="surabaya">Surabaya</option>
                  <option value="medan">Medan</option>
                  <option value="makassar">Makassar</option>
                  <option value="bali">Bali</option>
                  <option value="yogyakarta">Yogyakarta</option>
                  <option value="semarang">Semarang</option>
                  <option value="palembang">Palembang</option>
                  <option value="balikpapan">Balikpapan</option>
                </select>
              </div>
            </div>

            {/* Weight & Dimensions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CubeIcon className="h-4 w-4 inline mr-1" />
                Berat (kg)
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                className="input"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Panjang (cm)
                </label>
                <input
                  type="number"
                  name="length"
                  value={formData.length}
                  onChange={handleInputChange}
                  min="0"
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lebar (cm)
                </label>
                <input
                  type="number"
                  name="width"
                  value={formData.width}
                  onChange={handleInputChange}
                  min="0"
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tinggi (cm)
                </label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  min="0"
                  className="input"
                />
              </div>
            </div>

            {/* Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BanknotesIcon className="h-4 w-4 inline mr-1" />
                Nilai Barang (Rp)
              </label>
              <input
                type="number"
                name="value"
                value={formData.value}
                onChange={handleInputChange}
                min="0"
                className="input"
              />
            </div>

            {/* Calculate Button */}
            <button
              onClick={calculateShippingCosts}
              disabled={isCalculating || !formData.destination_city || formData.weight < 0.1}
              className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CalculatorIcon className="h-5 w-5" />
              {isCalculating ? 'Menghitung...' : 'Hitung Biaya Pengiriman'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <TruckIcon className="h-5 w-5" />
            Hasil Perhitungan
          </h2>
          
          {isCalculating ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{result.provider}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getServiceTypeColor(result.service_type)}`}>
                        {getServiceTypeLabel(result.service_type)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        Rp {result.total_cost.toLocaleString('id-ID')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.estimated_days} hari
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Biaya Dasar:</span>
                      <span>Rp {result.base_cost.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Biaya Berat:</span>
                      <span>Rp {result.weight_cost.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Biaya Jarak:</span>
                      <span>Rp {result.distance_cost.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <CalculatorIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Masukkan detail pengiriman dan klik "Hitung Biaya Pengiriman" untuk melihat hasil</p>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-medium text-blue-900 mb-3">Tips Pengiriman</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>• <strong>Same Day:</strong> Pengiriman dalam hari yang sama (area terbatas)</p>
          <p>• <strong>Next Day:</strong> Pengiriman keesokan hari</p>
          <p>• <strong>Express:</strong> Pengiriman cepat 1-2 hari kerja</p>
          <p>• <strong>Regular:</strong> Pengiriman standar 2-3 hari kerja</p>
          <p>• Biaya dapat berubah berdasarkan kondisi aktual dan promo yang berlaku</p>
          <p>• Untuk pengiriman ke luar Jawa, estimasi waktu dapat bertambah 1-2 hari</p>
        </div>
      </div>
    </div>
  )
}
