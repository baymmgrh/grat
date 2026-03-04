import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PlusIcon,
  PencilSquareIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import axiosInstance from '../../utils/axiosConfig'
import toast from 'react-hot-toast'

interface Vendor {
  id: number
  code: string
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  bank_name: string | null
  bank_account_number: string | null
  bank_account_name: string | null
  management_fee_percent: number
  contract_start: string | null
  contract_end: string | null
  is_active: boolean
  notes: string | null
  employee_count: number
}

export default function OutsourcingVendorList() {
  const navigate = useNavigate()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    management_fee_percent: '0',
    contract_start: '',
    contract_end: '',
    notes: ''
  })

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get('/api/hr/payroll/outsourcing-vendors')
      setVendors(res.data.vendors || [])
    } catch {
      toast.error('Gagal memuat data vendor')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        management_fee_percent: parseFloat(formData.management_fee_percent) || 0
      }
      if (editingVendor) {
        await axiosInstance.put(`/api/hr/payroll/outsourcing-vendors/${editingVendor.id}`, payload)
        toast.success('Vendor berhasil diupdate')
      } else {
        await axiosInstance.post('/api/hr/payroll/outsourcing-vendors', payload)
        toast.success('Vendor berhasil ditambahkan')
      }
      setShowForm(false)
      setEditingVendor(null)
      resetForm()
      fetchVendors()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan vendor')
    }
  }

  const resetForm = () => {
    setFormData({
      code: '', name: '', contact_person: '', phone: '', email: '',
      address: '', bank_name: '', bank_account_number: '', bank_account_name: '',
      management_fee_percent: '0', contract_start: '', contract_end: '', notes: ''
    })
  }

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setFormData({
      code: vendor.code,
      name: vendor.name,
      contact_person: vendor.contact_person || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      address: vendor.address || '',
      bank_name: vendor.bank_name || '',
      bank_account_number: vendor.bank_account_number || '',
      bank_account_name: vendor.bank_account_name || '',
      management_fee_percent: vendor.management_fee_percent?.toString() || '0',
      contract_start: vendor.contract_start || '',
      contract_end: vendor.contract_end || '',
      notes: vendor.notes || ''
    })
    setShowForm(true)
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Outsourcing</h1>
          <p className="text-sm text-gray-500">Kelola vendor/perusahaan outsourcing</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingVendor(null); setShowForm(true) }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <PlusIcon className="h-4 w-4" />
          Tambah Vendor
        </button>
      </div>

      {/* Vendor Cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Memuat data...</div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <BuildingOffice2Icon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada vendor outsourcing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map(vendor => (
            <div key={vendor.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{vendor.name}</h3>
                  <p className="text-xs text-gray-500">{vendor.code}</p>
                </div>
                <button
                  onClick={() => handleEdit(vendor)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 text-sm">
                {vendor.contact_person && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <UserGroupIcon className="h-4 w-4 text-gray-400" />
                    {vendor.contact_person}
                  </div>
                )}
                {vendor.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <PhoneIcon className="h-4 w-4 text-gray-400" />
                    {vendor.phone}
                  </div>
                )}
                {vendor.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                    {vendor.email}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm">
                  <UserGroupIcon className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-blue-700">{vendor.employee_count}</span>
                  <span className="text-gray-500">karyawan</span>
                </div>
                {vendor.management_fee_percent > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    Fee {vendor.management_fee_percent}%
                  </span>
                )}
              </div>

              {(vendor.contract_start || vendor.contract_end) && (
                <div className="mt-2 text-xs text-gray-400">
                  Kontrak: {vendor.contract_start ? new Date(vendor.contract_start).toLocaleDateString('id-ID') : '?'}
                  {' — '}
                  {vendor.contract_end ? new Date(vendor.contract_end).toLocaleDateString('id-ID') : 'sekarang'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {editingVendor ? 'Edit Vendor' : 'Tambah Vendor Baru'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingVendor(null) }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Kode Vendor</label>
                  <input type="text" className={inputClass} value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    placeholder="Auto-generate jika kosong" />
                </div>
                <div>
                  <label className={labelClass}>Nama Vendor <span className="text-red-500">*</span></label>
                  <input type="text" className={inputClass} value={formData.name} required
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="PT. Vendor Outsourcing" />
                </div>
                <div>
                  <label className={labelClass}>Contact Person</label>
                  <input type="text" className={inputClass} value={formData.contact_person}
                    onChange={e => setFormData({...formData, contact_person: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>Telepon</label>
                  <input type="text" className={inputClass} value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" className={inputClass} value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>Fee Manajemen (%)</label>
                  <input type="number" step="0.01" className={inputClass} value={formData.management_fee_percent}
                    onChange={e => setFormData({...formData, management_fee_percent: e.target.value})} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Alamat</label>
                <textarea className={inputClass} rows={2} value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Bank</label>
                  <input type="text" className={inputClass} value={formData.bank_name}
                    onChange={e => setFormData({...formData, bank_name: e.target.value})} placeholder="BCA, Mandiri, dll" />
                </div>
                <div>
                  <label className={labelClass}>No. Rekening</label>
                  <input type="text" className={inputClass} value={formData.bank_account_number}
                    onChange={e => setFormData({...formData, bank_account_number: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>Atas Nama</label>
                  <input type="text" className={inputClass} value={formData.bank_account_name}
                    onChange={e => setFormData({...formData, bank_account_name: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Kontrak Mulai</label>
                  <input type="date" className={inputClass} value={formData.contract_start}
                    onChange={e => setFormData({...formData, contract_start: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>Kontrak Berakhir</label>
                  <input type="date" className={inputClass} value={formData.contract_end}
                    onChange={e => setFormData({...formData, contract_end: e.target.value})} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Catatan</label>
                <textarea className={inputClass} rows={2} value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => { setShowForm(false); setEditingVendor(null) }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                  <CheckIcon className="h-4 w-4" />
                  {editingVendor ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
