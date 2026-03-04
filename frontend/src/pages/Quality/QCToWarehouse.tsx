import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowRightIcon,
  CubeIcon,
  ClipboardDocumentCheckIcon,
  BuildingStorefrontIcon,
  ArrowLeftIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

interface PendingTransfer {
  id: number
  inspection_number: string
  inspection_date: string | null
  product_id: number
  product_name: string | null
  product_code: string | null
  work_order_id: number | null
  work_order_number: string | null
  batch_number: string | null
  quantity_passed: number
  disposition: string
  disposition_date: string | null
  total_checklist_items: number
  passed_checklist_items: number
  failed_checklist_items: number
}

interface WarehouseLocation {
  id: number
  location_code: string
  zone_name: string
  zone_material_type: string
  available: number
  capacity: number
  occupied: number
}

interface InventorySummary {
  released: number
  quarantine: number
  reject: number
}

export default function QCToWarehouse() {
  const navigate = useNavigate()
  
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([])
  const [locations, setLocations] = useState<WarehouseLocation[]>([])
  const [inventorySummary, setInventorySummary] = useState<InventorySummary>({ released: 0, quarantine: 0, reject: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [filterDisposition, setFilterDisposition] = useState<string>('')
  const [isTransferring, setIsTransferring] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [pendingRes, locationsRes, summaryRes] = await Promise.all([
        fetch('/api/quality/inspections/pending-transfer', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/warehouse/locations?material_type=finished_goods', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/quality/warehouse/by-status', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ])

      if (pendingRes.ok) {
        const data = await pendingRes.json()
        setPendingTransfers(data.pending_transfers || [])
      }

      if (locationsRes.ok) {
        const data = await locationsRes.json()
        setLocations(data.locations || [])
      }

      if (summaryRes.ok) {
        const data = await summaryRes.json()
        setInventorySummary(data.summary || { released: 0, quarantine: 0, reject: 0 })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Gagal memuat data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectItem = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    const filteredItems = getFilteredItems()
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredItems.map(i => i.id))
    }
  }

  const handleTransfer = async (inspectionId: number) => {
    if (!selectedLocation) {
      toast.error('Pilih lokasi warehouse terlebih dahulu')
      return
    }

    setIsTransferring(true)
    try {
      const response = await fetch(`/api/quality/inspections/${inspectionId}/transfer-to-warehouse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ location_id: parseInt(selectedLocation) })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message)
        fetchData()
        setSelectedItems(prev => prev.filter(i => i !== inspectionId))
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal transfer')
      }
    } catch (error) {
      console.error('Error transferring:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setIsTransferring(false)
    }
  }

  const handleBulkTransfer = async () => {
    if (selectedItems.length === 0) {
      toast.error('Pilih item yang akan ditransfer')
      return
    }

    if (!selectedLocation) {
      toast.error('Pilih lokasi warehouse terlebih dahulu')
      return
    }

    setIsTransferring(true)
    let successCount = 0
    let failCount = 0

    for (const id of selectedItems) {
      try {
        const response = await fetch(`/api/quality/inspections/${id}/transfer-to-warehouse`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ location_id: parseInt(selectedLocation) })
        })

        if (response.ok) {
          successCount++
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} item berhasil ditransfer`)
    }
    if (failCount > 0) {
      toast.error(`${failCount} item gagal ditransfer`)
    }

    fetchData()
    setSelectedItems([])
    setIsTransferring(false)
  }

  const getFilteredItems = () => {
    if (!filterDisposition) return pendingTransfers
    return pendingTransfers.filter(i => i.disposition === filterDisposition)
  }

  const getDispositionBadge = (disposition: string) => {
    switch (disposition) {
      case 'released':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3" />
            Released
          </span>
        )
      case 'quarantine':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ExclamationTriangleIcon className="h-3 w-3" />
            Quarantine
          </span>
        )
      case 'reject':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3" />
            Reject
          </span>
        )
      default:
        return null
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

  const filteredItems = getFilteredItems()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/quality')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transfer QC ke Warehouse</h1>
            <p className="text-gray-600">Transfer produk yang sudah lulus QC ke gudang barang jadi</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardDocumentCheckIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600">Pending Transfer</p>
              <p className="text-2xl font-bold text-blue-900">{pendingTransfers.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600">Stok Released</p>
              <p className="text-2xl font-bold text-green-900">{inventorySummary.released.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-yellow-600">Stok Quarantine</p>
              <p className="text-2xl font-bold text-yellow-900">{inventorySummary.quarantine.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-600">Stok Reject</p>
              <p className="text-2xl font-bold text-red-900">{inventorySummary.reject.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filterDisposition}
                onChange={(e) => setFilterDisposition(e.target.value)}
                className="input w-40"
              >
                <option value="">Semua Status</option>
                <option value="released">Released</option>
                <option value="quarantine">Quarantine</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <BuildingStorefrontIcon className="h-5 w-5 text-gray-400" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="input w-48"
              >
                <option value="">Pilih Lokasi Warehouse</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.location_code} ({loc.zone_name}) - Tersedia: {loc.available.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedItems.length > 0 && (
              <span className="text-sm text-gray-600">
                {selectedItems.length} item dipilih
              </span>
            )}
            <button
              onClick={handleBulkTransfer}
              disabled={selectedItems.length === 0 || !selectedLocation || isTransferring}
              className="btn-primary inline-flex items-center gap-2"
            >
              {isTransferring ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Memproses...
                </>
              ) : (
                <>
                  <ArrowRightIcon className="h-4 w-4" />
                  Transfer {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Pending Transfers Table */}
      <div className="card">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Pending Transfer ke Warehouse</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <CubeIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Tidak ada item pending</p>
            <p className="text-sm">Semua QC sudah ditransfer ke warehouse</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Inspeksi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty Passed</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Checklist</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disposition</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50 ${selectedItems.includes(item.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-medium text-blue-600">{item.inspection_number}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-xs text-gray-500">{item.product_code}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {item.work_order_number || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {item.batch_number || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.quantity_passed.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-green-600">{item.passed_checklist_items}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">{item.total_checklist_items}</span>
                        {item.failed_checklist_items > 0 && (
                          <span className="text-red-500 text-xs ml-1">({item.failed_checklist_items} fail)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getDispositionBadge(item.disposition)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.disposition_date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleTransfer(item.id)}
                        disabled={!selectedLocation || isTransferring}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Transfer <ArrowRightIcon className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="card p-4 bg-gray-50">
        <h3 className="font-medium text-gray-900 mb-3">Keterangan Disposition:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">Released</p>
              <p className="text-gray-600">Semua checklist PASS. Produk siap dijual/kirim.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Quarantine</p>
              <p className="text-gray-600">Sebagian checklist FAIL. Perlu review sebelum release.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Reject</p>
              <p className="text-gray-600">Semua checklist FAIL. Perlu rework, tidak bisa transfer.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
