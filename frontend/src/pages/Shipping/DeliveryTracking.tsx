import React, { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext';
import { useGetDeliveryTrackingQuery } from '../../services/shippingApi'
import {
  CheckCircleIcon,
  ClockIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  TruckIcon

} from '@heroicons/react/24/outline';

export default function DeliveryTracking() {
  const { t } = useLanguage();
  const [trackingNumber, setTrackingNumber] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Fetch tracking data when search is performed
  const { data: trackingData, isLoading, error } = useGetDeliveryTrackingQuery(
    { tracking_number: searchQuery },
    { skip: !searchQuery }
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (trackingNumber.trim()) {
      setSearchQuery(trackingNumber.trim())
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'picked_up':
        return <TruckIcon className="h-5 w-5 text-blue-600" />
      case 'in_transit':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />
      case 'delivered':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
      default:
        return <MapPinIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    const statusTexts = {
      preparing: 'Mempersiapkan',
      picked_up: 'Diambil Kurir',
      in_transit: 'Dalam Perjalanan',
      out_for_delivery: 'Sedang Dikirim',
      delivered: 'Terkirim',
      failed: 'Gagal Kirim',
      returned: 'Dikembalikan'
    }
    return statusTexts[status as keyof typeof statusTexts] || status
  }

  const getStatusColor = (status: string) => {
    const colors = {
      preparing: 'text-gray-600 bg-gray-100',
      picked_up: 'text-blue-600 bg-blue-100',
      in_transit: 'text-yellow-600 bg-yellow-100',
      out_for_delivery: 'text-purple-600 bg-purple-100',
      delivered: 'text-green-600 bg-green-100',
      failed: 'text-red-600 bg-red-100',
      returned: 'text-orange-600 bg-orange-100'
    }
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Lacak Pengiriman</h1>
      </div>

      {/* Search Form */}
      <div className="card">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label htmlFor="tracking" className="block text-sm font-medium text-gray-700 mb-2">
              Nomor Resi / Tracking Number
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                id="tracking"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Masukkan nomor resi pengiriman..."
                className="input flex-1"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary inline-flex items-center gap-2"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
                {isLoading ? 'Mencari...' : 'Lacak'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Tracking Results */}
      {searchQuery && (
        <div className="space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="card bg-red-50 border-red-200">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3" />
                <span className="text-red-800">
                  Nomor resi tidak ditemukan atau terjadi kesalahan
                </span>
              </div>
            </div>
          )}

          {trackingData && (
            <>
              {/* Shipment Info */}
              <div className="card">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Informasi Pengiriman</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nomor Resi</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">
                      {trackingData.tracking_number}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('common.status')}</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trackingData.status)}`}>
                        {getStatusText(trackingData.status)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Kurir</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {trackingData.logistics_provider?.name || '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Estimasi Tiba</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {trackingData.estimated_delivery ? 
                        new Date(trackingData.estimated_delivery).toLocaleDateString('id-ID') : 
                        '-'
                      }
                    </dd>
                  </div>
                </div>
              </div>

              {/* Shipping Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Alamat Pengirim</h3>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900">{trackingData.shipping_order?.sender_name}</p>
                    <p>{trackingData.shipping_order?.sender_address}</p>
                    <p>{trackingData.shipping_order?.sender_phone}</p>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Alamat Penerima</h3>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900">{trackingData.shipping_order?.recipient_name}</p>
                    <p>{trackingData.shipping_order?.recipient_address}</p>
                    <p>{trackingData.shipping_order?.recipient_phone}</p>
                  </div>
                </div>
              </div>

              {/* Tracking Timeline */}
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Riwayat Pengiriman</h3>
                <div className="flow-root">
                  <ul className="-mb-8">
                    {trackingData.tracking_history?.map((event: any, eventIdx: number) => (
                      <li key={event.id}>
                        <div className="relative pb-8">
                          {eventIdx !== trackingData.tracking_history.length - 1 ? (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                                {getStatusIcon(event.status)}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900 font-medium">
                                  {getStatusText(event.status)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {event.description}
                                </p>
                                {event.location && (
                                  <p className="text-sm text-gray-500 flex items-center mt-1">
                                    <MapPinIcon className="h-4 w-4 mr-1" />
                                    {event.location}
                                  </p>
                                )}
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                <time dateTime={event.timestamp}>
                                  {new Date(event.timestamp).toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* CubeIcon Details */}
              {trackingData.shipping_order?.items && (
                <div className="card">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Detail Paket</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {trackingData.shipping_order.items.map((item: any) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.product_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.weight} kg
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.length} × {item.width} × {item.height} cm
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-medium text-blue-900 mb-3">Bantuan Pelacakan</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>• Nomor resi dapat ditemukan di email konfirmasi atau invoice pengiriman</p>
          <p>• Informasi tracking akan diperbarui setiap 2-4 jam</p>
          <p>• Hubungi customer service jika ada kendala dalam pengiriman</p>
          <p>• Simpan nomor resi untuk referensi di masa mendatang</p>
        </div>
      </div>
    </div>
  )
}
