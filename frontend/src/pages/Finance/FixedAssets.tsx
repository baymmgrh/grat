import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext';
import { formatRupiah } from '../../utils/currencyUtils';
import {
  ArrowDownTrayIcon,
  BuildingOfficeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilIcon
,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig'
import LoadingSpinner from '../../components/Common/LoadingSpinner'

interface FixedAsset {
  id: number
  asset_code: string
  asset_name: string
  category: string
  purchase_date: string
  cost: number
  accumulated_depreciation: number
  net_book_value: number
  useful_life: number
  depreciation_method: string
}

interface AssetSummary {
  total_cost: number
  total_accumulated_depreciation: number
  total_net_book_value: number
}

const FixedAssets = () => {
    const { t } = useLanguage();

const [assets, setAssets] = useState<FixedAsset[]>([])
  const [summary, setSummary] = useState<AssetSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadAssets()
  }, [])

  const loadAssets = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/api/finance/fixed-assets')
      setAssets(response.data.assets || [])
      setSummary(response.data.summary || null)
    } catch (error) {
      console.error('Error loading fixed assets:', error)
      setAssets([])
    } finally {
      setLoading(false)
    }
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID')
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'machinery':
        return '⚙️'
      case 'building':
        return '🏢'
      case 'vehicle':
        return '🚗'
      case 'equipment':
        return '🔧'
      case 'furniture':
        return '🪑'
      case 'computer':
        return '💻'
      default:
        return '📦'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'machinery':
        return 'bg-blue-100 text-blue-800'
      case 'building':
        return 'bg-green-100 text-green-800'
      case 'vehicle':
        return 'bg-purple-100 text-purple-800'
      case 'equipment':
        return 'bg-orange-100 text-orange-800'
      case 'furniture':
        return 'bg-pink-100 text-pink-800'
      case 'computer':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDepreciationRate = (asset: FixedAsset) => {
    return ((asset.accumulated_depreciation / asset.cost) * 100).toFixed(1)
  }

  const getRemainingLife = (asset: FixedAsset) => {
    const purchaseDate = new Date(asset.purchase_date)
    const currentDate = new Date()
    const yearsUsed = (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    return Math.max(0, asset.useful_life - yearsUsed).toFixed(1)
  }

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.asset_code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || asset.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const groupedAssets = filteredAssets.reduce((groups, asset) => {
    const category = asset.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(asset)
    return groups
  }, {} as Record<string, FixedAsset[]>)

  const categories = [...new Set(assets.map(asset => asset.category))]

  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null)
  const [formData, setFormData] = useState({
    asset_code: '',
    asset_name: '',
    category: '',
    acquisition_date: '',
    acquisition_cost: 0,
    useful_life_years: 10,
    depreciation_method: 'straight_line',
    salvage_value: 0,
    location: '',
    description: ''
  })

  const handleEditAsset = (asset: FixedAsset) => {
    setEditingAsset(asset)
    setFormData({
      asset_code: asset.asset_code,
      asset_name: asset.asset_name,
      category: asset.category,
      acquisition_date: asset.purchase_date,
      acquisition_cost: asset.cost,
      useful_life_years: asset.useful_life,
      depreciation_method: asset.depreciation_method.toLowerCase().replace(' ', '_'),
      salvage_value: 0,
      location: '',
      description: ''
    })
    setShowAddModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingAsset(null)
    setFormData({
      asset_code: '',
      asset_name: '',
      category: '',
      acquisition_date: '',
      acquisition_cost: 0,
      useful_life_years: 10,
      depreciation_method: 'straight_line',
      salvage_value: 0,
      location: '',
      description: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingAsset) {
        await axiosInstance.put(`/api/finance/fixed-assets/${editingAsset.id}`, formData)
        alert('Fixed asset updated successfully!')
      } else {
        await axiosInstance.post('/api/finance/fixed-assets', formData)
        alert('Fixed asset created successfully!')
      }
      handleCloseModal()
      loadAssets()
    } catch (error: any) {
      console.error('Error saving fixed asset:', error)
      alert(error.response?.data?.error || 'Failed to save fixed asset. Please try again.')
    }
  }

  const handleDeleteAsset = async (asset: FixedAsset) => {
    if (window.confirm(`Are you sure you want to delete this fixed asset?\n\nName: ${asset.asset_name}\nCode: ${asset.asset_code}\nCategory: ${asset.category}\nNet Book Value: ${formatRupiah(asset.net_book_value)}\n\nThis action cannot be undone.`)) {
      try {
        await axiosInstance.delete(`/api/finance/fixed-assets/${asset.id}`)
        alert(`Fixed asset "${asset.asset_name}" has been deleted successfully.`)
        loadAssets() // Reload the assets
      } catch (error) {
        console.error('Error deleting fixed asset:', error)
        alert('Failed to delete fixed asset. Please try again.')
      }
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🏢 Fixed Assets</h1>
          <p className="text-gray-600 mt-1">Manage asset depreciation and lifecycle tracking</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              const data = assets.map(asset => ({
                'Asset Code': asset.asset_code,
                'Asset Name': asset.asset_name,
                [t('products.bom.category')]: asset.category,
                'Purchase Date': formatDate(asset.purchase_date),
                'Cost': asset.cost,
                'Accumulated Depreciation': asset.accumulated_depreciation,
                'Net Book Value': asset.net_book_value,
                'Useful Life': asset.useful_life + ' years',
                'Method': asset.depreciation_method
              }))
              console.log('Exporting fixed assets data:', data)
              alert('Fixed assets export will be implemented soon!')
            }}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />{t('common.export')}</button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Asset
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="bg-blue-500 p-3 rounded-lg">
                <BuildingOfficeIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('products.bom.total_cost')}</p>
                <p className="text-2xl font-bold text-gray-900">{formatRupiah(summary.total_cost)}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="bg-red-500 p-3 rounded-lg">
                <span className="text-2xl text-white">📉</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Accumulated Depreciation</p>
                <p className="text-2xl font-bold text-red-600">{formatRupiah(summary.total_accumulated_depreciation)}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="bg-green-500 p-3 rounded-lg">
                <span className="text-2xl text-white">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Book Value</p>
                <p className="text-2xl font-bold text-green-600">{formatRupiah(summary.total_net_book_value)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search assets..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <button className="btn-secondary inline-flex items-center gap-2">
              <FunnelIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Assets by Category */}
      <div className="space-y-6">
        {Object.entries(groupedAssets).map(([category, categoryAssets]) => (
          <div key={category} className="card overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getCategoryIcon(category)}</span>
                  <h3 className="text-lg font-medium text-gray-900">{category}</h3>
                  <span className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
                    {categoryAssets.length} assets
                  </span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {formatRupiah(categoryAssets.reduce((sum, asset) => sum + asset.net_book_value, 0))}
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase Info
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Book Value
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categoryAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{asset.asset_name}</div>
                          <div className="text-sm text-gray-500">Code: {asset.asset_code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{formatDate(asset.purchase_date)}</div>
                          <div className="text-sm text-gray-500">{asset.depreciation_method}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">{formatRupiah(asset.cost)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-red-600">
                          {formatRupiah(asset.accumulated_depreciation)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getDepreciationRate(asset)}% depreciated
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-green-600">
                          {formatRupiah(asset.net_book_value)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            Number(getRemainingLife(asset)) > 2 ? 'bg-green-100 text-green-800' :
                            Number(getRemainingLife(asset)) > 0 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {Number(getRemainingLife(asset)) > 0 ? 
                              `${getRemainingLife(asset)} years left` : 
                              'Fully Depreciated'
                            }
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditAsset(asset)}
                            className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                            title="Edit Asset"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />{t('common.edit')}</button>
                          <button 
                            onClick={() => handleDeleteAsset(asset)}
                            className="text-red-600 hover:text-red-900 inline-flex items-center"
                            title="Delete Asset"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />{t('common.delete')}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editingAsset ? 'Edit Fixed Asset' : 'Add New Fixed Asset'}</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asset Code *
                  </label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    placeholder="FA001" 
                    value={formData.asset_code}
                    onChange={(e) => setFormData({...formData, asset_code: e.target.value})}
                    disabled={!!editingAsset}
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('products.bom.category')} *</label>
                  <select 
                    className="input w-full"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    <option value="">Select category</option>
                    <option value="Building">Building</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Furniture">Furniture</option>
                    <option value="IT Equipment">IT Equipment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset Name *
                </label>
                <input 
                  type="text" 
                  className="input w-full" 
                  placeholder="Production Machine A"
                  value={formData.asset_name}
                  onChange={(e) => setFormData({...formData, asset_name: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Acquisition Date *
                  </label>
                  <input 
                    type="date" 
                    className="input w-full"
                    value={formData.acquisition_date}
                    onChange={(e) => setFormData({...formData, acquisition_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Acquisition Cost *
                  </label>
                  <input 
                    type="number" 
                    className="input w-full" 
                    placeholder="250000"
                    value={formData.acquisition_cost}
                    onChange={(e) => setFormData({...formData, acquisition_cost: parseFloat(e.target.value) || 0})}
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Useful Life (Years) *
                  </label>
                  <input 
                    type="number" 
                    className="input w-full" 
                    placeholder="10"
                    value={formData.useful_life_years}
                    onChange={(e) => setFormData({...formData, useful_life_years: parseInt(e.target.value) || 10})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salvage Value
                  </label>
                  <input 
                    type="number" 
                    className="input w-full" 
                    placeholder="0"
                    value={formData.salvage_value}
                    onChange={(e) => setFormData({...formData, salvage_value: parseFloat(e.target.value) || 0})}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Depreciation Method *
                  </label>
                  <select 
                    className="input w-full"
                    value={formData.depreciation_method}
                    onChange={(e) => setFormData({...formData, depreciation_method: e.target.value})}
                    required
                  >
                    <option value="straight_line">Straight Line</option>
                    <option value="declining_balance">Declining Balance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    placeholder="Factory Floor A"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.description')}</label>
                <textarea 
                  className="input w-full" 
                  rows={3}
                  placeholder="Optional asset description..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                >{t('common.cancel')}</button>
                <button type="submit" className="btn-primary">
                  {editingAsset ? 'Update Asset' : 'Add Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filteredAssets.length === 0 && !loading && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No fixed assets found</h3>
          <p className="mt-1 text-sm text-gray-500">Start by adding your first fixed asset</p>
        </div>
      )}
    </div>
  )
}

export default FixedAssets
