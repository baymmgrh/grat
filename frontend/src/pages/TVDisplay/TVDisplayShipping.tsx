import React, { useEffect, useState } from 'react'
import { useGetShippingOrdersQuery } from '../../services/shippingApi'
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
export default function TVDisplayShipping() {
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Fetch shipping data using RTK Query with auto-refresh
  const { data: shippingData, isLoading } = useGetShippingOrdersQuery({
    page: 1,
    per_page: 100
  }, {
    pollingInterval: 10000 // Auto-refresh every 10 seconds
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Process data for display
  const processedData = shippingData?.shipping_orders ? {
    total_shipments: shippingData.shipping_orders.length,
    preparing_count: shippingData.shipping_orders.filter((s: any) => s.status === 'preparing').length,
    packed_count: shippingData.shipping_orders.filter((s: any) => s.status === 'packed').length,
    shipped_count: shippingData.shipping_orders.filter((s: any) => s.status === 'shipped' || s.status === 'in_transit').length,
    delivered_count: shippingData.shipping_orders.filter((s: any) => s.status === 'delivered').length,
    active_shipments: shippingData.shipping_orders
      .filter((s: any) => ['preparing', 'packed', 'shipped', 'in_transit'].includes(s.status))
      .slice(0, 8) // Show only first 8 for TV display
  } : null

  if (isLoading || !processedData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <TruckIcon className="h-16 w-16 mx-auto mb-4 animate-pulse" />
          <p className="text-2xl">Loading Shipping Data...</p>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'preparing': return <ClockIcon className="h-6 w-6" />
      case 'packed': return <ExclamationTriangleIcon className="h-6 w-6" />
      case 'shipped':
      case 'in_transit': return <TruckIcon className="h-6 w-6" />
      case 'delivered': return <CheckCircleIcon className="h-6 w-6" />
      default: return <MapPinIcon className="h-6 w-6" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preparing': return 'bg-yellow-600'
      case 'packed': return 'bg-orange-600'
      case 'shipped':
      case 'in_transit': return 'bg-blue-600'
      case 'delivered': return 'bg-green-600'
      default: return 'bg-gray-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'preparing': return 'Preparing'
      case 'packed': return 'Packed'
      case 'shipped': return 'Shipped'
      case 'in_transit': return 'In Transit'
      case 'delivered': return 'Delivered'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Time */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
            📦 Shipping 
          </h1>
          <div className="text-right">
            <p className="text-2xl font-mono">{currentTime.toLocaleTimeString('id-ID')}</p>
            <p className="text-lg text-gray-400">{currentTime.toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
        </div>
        
        {/* Metrics Cards */}
        <div className="grid grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg mb-2">Total Orders</h3>
                <p className="text-4xl font-bold">{processedData.total_shipments}</p>
              </div>
              <TruckIcon className="h-12 w-12 opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg mb-2">Preparing</h3>
                <p className="text-4xl font-bold">{processedData.preparing_count}</p>
              </div>
              <ClockIcon className="h-12 w-12 opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-600 to-orange-700 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg mb-2">Packed</h3>
                <p className="text-4xl font-bold">{processedData.packed_count}</p>
              </div>
              <ExclamationTriangleIcon className="h-12 w-12 opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg mb-2">In Transit</h3>
                <p className="text-4xl font-bold">{processedData.shipped_count}</p>
              </div>
              <TruckIcon className="h-12 w-12 opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg mb-2">Delivered</h3>
                <p className="text-4xl font-bold">{processedData.delivered_count}</p>
              </div>
              <CheckCircleIcon className="h-12 w-12 opacity-80" />
            </div>
          </div>
        </div>

        {/* Active Shipments */}
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <MapPinIcon className="h-8 w-8" />
            Active Shipments
          </h2>
          
          <div className="grid grid-cols-2 gap-6">
            {processedData.active_shipments?.map((shipment: any) => (
              <div key={shipment.id} className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:border-gray-600 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-blue-400">{shipment.shipping_number}</h3>
                    <p className="text-gray-300 text-lg">{shipment.customer_name}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      📅 {new Date(shipment.shipping_date).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(shipment.status)}`}>
                      {getStatusIcon(shipment.status)}
                      {getStatusLabel(shipment.status)}
                    </span>
                    {shipment.tracking_number && (
                      <p className="text-sm text-gray-400 mt-2">
                        🔍 {shipment.tracking_number}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      shipment.status === 'preparing' ? 'w-1/4 bg-yellow-500' :
                      shipment.status === 'packed' ? 'w-2/4 bg-orange-500' :
                      shipment.status === 'shipped' || shipment.status === 'in_transit' ? 'w-3/4 bg-blue-500' :
                      shipment.status === 'delivered' ? 'w-full bg-green-500' :
                      'w-0'
                    }`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          {processedData.active_shipments?.length === 0 && (
            <div className="text-center py-12">
              <TruckIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400">No active shipments at the moment</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-gray-500">
          <p>🔄 Auto-refresh every 10 seconds | Last updated: {new Date().toLocaleTimeString('id-ID')}</p>
        </div>
      </div>
    </div>
  )
}
