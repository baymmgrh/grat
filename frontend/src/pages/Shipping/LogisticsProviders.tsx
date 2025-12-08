import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext';
import {
  useGetLogisticsProvidersQuery,
  useCreateLogisticsProviderMutation,
  useUpdateLogisticsProviderMutation,
  useDeleteLogisticsProviderMutation
} from '../../services/shippingApi'
import {
  CheckCircleIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  TruckIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function LogisticsProviders() {
  const navigate = useNavigate()
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false)
  const [editingProvider, setEditingProvider] = useState<any>(null)
  
  // API hooks
  const { data: providersData, isLoading } = useGetLogisticsProvidersQuery({})
  const [createProvider, { isLoading: isCreating }] = useCreateLogisticsProviderMutation()
  const [updateProvider, { isLoading: isUpdating }] = useUpdateLogisticsProviderMutation()
  const [deleteProvider] = useDeleteLogisticsProviderMutation()

  const [formData, setFormData] = useState({
    name: '',
    service_type: 'regular',
    contact_info: '',
    pricing_model: 'weight_based',
    is_active: true
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingProvider) {
        await updateProvider({ id: editingProvider.id, ...formData }).unwrap()
      } else {
        await createProvider(formData).unwrap()
      }
      
      // Reset form
      setFormData({
        name: '',
        service_type: 'regular',
        contact_info: '',
        pricing_model: 'weight_based',
        is_active: true
      })
      setShowForm(false)
      setEditingProvider(null)
    } catch (error) {
      console.error('Error saving provider:', error)
    }
  }

  const handleEdit = (provider: any) => {
    setFormData({
      name: provider.name,
      service_type: provider.service_type,
      contact_info: provider.contact_info,
      pricing_model: provider.pricing_model,
      is_active: provider.is_active
    })
    setEditingProvider(provider)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus provider ini?')) {
      try {
        await deleteProvider(id).unwrap()
      } catch (error) {
        console.error('Error deleting provider:', error)
      }
    }
  }

  const getServiceTypeLabel = (serviceType: string) => {
    const labels = {
      regular: 'Regular',
      express: 'Express',
      same_day: 'Same Day',
      next_day: 'Next Day'
    }
    return labels[serviceType as keyof typeof labels] || serviceType
  }

  const getPricingModelLabel = (model: string) => {
    const labels = {
      weight_based: 'Berdasarkan Berat',
      distance_based: 'Berdasarkan Jarak',
      flat_rate: 'Tarif Tetap'
    }
    return labels[model as keyof typeof labels] || model
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Provider Logistik</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/shipping')}
            className="btn-outline"
          >
            Kembali ke Dashboard
          </button>
          <button 
            onClick={() => setShowForm(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Tambah Provider
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {editingProvider ? 'Edit Provider' : 'Tambah Provider Baru'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Provider
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kontak Info
                </label>
                <input
                  type="text"
                  name="contact_info"
                  value={formData.contact_info}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Email atau telepon"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model Pricing
                </label>
                <select
                  name="pricing_model"
                  value={formData.pricing_model}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="weight_based">Berdasarkan Berat</option>
                  <option value="distance_based">Berdasarkan Jarak</option>
                  <option value="flat_rate">Tarif Tetap</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Provider Aktif
                </label>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingProvider(null)
                    setFormData({
                      name: '',
                      service_type: 'regular',
                      contact_info: '',
                      pricing_model: 'weight_based',
                      is_active: true
                    })
                  }}
                  className="btn-outline"
                >
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="btn-primary"
                >
                  {isCreating || isUpdating ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Providers List */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Daftar Provider Logistik</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis Layanan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {providersData?.logistics_providers?.map((provider: any) => (
                <tr key={provider.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <TruckIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {provider.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getServiceTypeLabel(provider.service_type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getPricingModelLabel(provider.pricing_model)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {provider.contact_info || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      provider.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {provider.is_active ? (
                        <>
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="h-3 w-3 mr-1" />
                          Tidak Aktif
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(provider)}
                        className="text-blue-600 hover:text-blue-500"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(provider.id)}
                        className="text-red-600 hover:text-red-500"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(!providersData?.logistics_providers || providersData.logistics_providers.length === 0) && (
          <div className="text-center py-8">
            <TruckIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Belum ada provider logistik</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 btn-primary inline-flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Tambah Provider Pertama
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
