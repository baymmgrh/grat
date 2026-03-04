import React, { useState } from 'react'
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  BuildingStorefrontIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon
,
  TrashIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast'
import {
  useGetWarehouseZonesQuery,
  useCreateWarehouseZoneMutation,
  useUpdateWarehouseZoneMutation,
  useDeleteWarehouseZoneMutation
} from '../../services/api';
export default function WarehouseZones() {
    const { t } = useLanguage();

const [showModal, setShowModal] = useState(false)
  const [editingZone, setEditingZone] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const { data: zones, isLoading: zonesLoading, refetch } = useGetWarehouseZonesQuery({})
  const [createZone] = useCreateWarehouseZoneMutation()
  const [updateZone] = useUpdateWarehouseZoneMutation()
  const [deleteZone] = useDeleteWarehouseZoneMutation()

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    material_type: 'finished_goods',
    capacity: '',
    capacity_uom: 'KG'
  })

  const materialTypes = [
    { value: 'finished_goods', label: 'Finished Goods' },
    { value: 'raw_materials', label: 'Raw Materials' },
    { value: 'packaging_materials', label: 'Packaging Materials' },
    { value: 'chemical_materials', label: 'Chemical Materials' }
  ]

  const uomOptions = ['KG', 'TON', 'M3', 'PALLET', 'UNIT']

  const openCreateModal = () => {
    setEditingZone(null)
    setFormData({
      code: '',
      name: '',
      description: '',
      material_type: 'finished_goods',
      capacity: '',
      capacity_uom: 'KG'
    })
    setShowModal(true)
  }

  const openEditModal = (zone: any) => {
    setEditingZone(zone)
    setFormData({
      code: zone.code,
      name: zone.name,
      description: zone.description || '',
      material_type: zone.material_type,
      capacity: zone.capacity?.toString() || '',
      capacity_uom: zone.capacity_uom || 'KG'
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload = {
        ...formData,
        capacity: formData.capacity ? parseFloat(formData.capacity) : null
      }

      if (editingZone) {
        await updateZone({ id: editingZone.id, ...payload }).unwrap()
        toast.success('Zone updated successfully!')
      } else {
        await createZone(payload).unwrap()
        toast.success('Zone created successfully!')
      }

      setShowModal(false)
      refetch()
    } catch (error: any) {
      toast.error(error.data?.error || t('messages.operation_failed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (zone: any) => {
    if (!confirm(`Are you sure you want to delete zone "${zone.name}"?`)) return

    try {
      await deleteZone(zone.id).unwrap()
      toast.success('Zone deleted successfully!')
      refetch()
    } catch (error: any) {
      toast.error(error.data?.error || 'Delete failed')
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouse Zones</h1>
          <p className="text-gray-600">Manage warehouse zones and storage areas</p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary inline-flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Zone
        </button>
      </div>

      {/* Zone Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {materialTypes.map((type) => {
          const typeZones = zones?.zones?.filter((z: any) => z.material_type === type.value) || []
          return (
            <div key={type.value} className="card p-4">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <BuildingStorefrontIcon className="h-5 w-5 text-primary-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">{type.label}</p>
                  <p className="text-xl font-bold text-gray-900">{typeZones.length}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Zones Grid */}
      {zonesLoading ? (
        <div className="text-center py-12">Loading zones...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones?.zones?.map((zone: any) => (
            <div key={zone.id} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BuildingStorefrontIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">{zone.name}</h3>
                    <p className="text-sm text-gray-500">{zone.code}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(zone)}
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(zone)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Material Type</span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                    {materialTypes.find(t => t.value === zone.material_type)?.label}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Locations</span>
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">{zone.location_count}</span>
                  </div>
                </div>

                {zone.capacity && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Capacity</span>
                    <span className="text-sm font-medium">
                      {zone.capacity.toLocaleString()} {zone.capacity_uom}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t">
                  <Link
                    to={`/warehouse/zones/${zone.id}/locations`}
                    className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                  >
                    View Locations →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!zonesLoading && (!zones?.zones || zones.zones.length === 0) && (
        <div className="text-center py-12">
          <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No zones</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new warehouse zone.</p>
          <div className="mt-6">
            <button onClick={openCreateModal} className="btn-primary">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Zone
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">
              {editingZone ? 'Edit Zone' : 'Create New Zone'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Zone Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    className="input-field"
                    placeholder="e.g., FG-A"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Zone Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="input-field"
                    placeholder="e.g., Finished Goods Area A"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Material Type *</label>
                <select
                  value={formData.material_type}
                  onChange={(e) => handleInputChange('material_type', e.target.value)}
                  className="input-field"
                  required
                >
                  {materialTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('common.description')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Zone description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Capacity</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">UOM</label>
                  <select
                    value={formData.capacity_uom}
                    onChange={(e) => handleInputChange('capacity_uom', e.target.value)}
                    className="input-field"
                  >
                    {uomOptions.map((uom) => (
                      <option key={uom} value={uom}>{uom}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                  disabled={isLoading}
                >{t('common.cancel')}</button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : editingZone ? [t('common.update')] : t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
