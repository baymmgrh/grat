import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  UserIcon,
  BriefcaseIcon,
  PhoneIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import {
  useGetDepartmentsQuery,
  useGetPositionsQuery,
  useCreateEmployeeMutation
} from '../../services/api'
import axiosInstance from '../../utils/axiosConfig'
import LoadingSpinner from '../../components/Common/LoadingSpinner'

interface EmployeeFormData {
  employee_number: string
  first_name: string
  last_name: string
  email: string
  phone: string
  mobile: string
  date_of_birth: string
  gender: string
  marital_status: string
  address: string
  city: string
  postal_code: string
  department_id: string
  position: string
  employment_type: string
  hire_date: string
  salary: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relation: string
}

export default function EmployeeForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  
  const { data: departments } = useGetDepartmentsQuery({})
  const { data: positions } = useGetPositionsQuery({})
  const [createEmployee] = useCreateEmployeeMutation()
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<EmployeeFormData>({
    defaultValues: {
      hire_date: new Date().toISOString().split('T')[0],
      employment_type: 'full_time'
    }
  })

  // Fetch employee data for edit mode
  useEffect(() => {
    if (isEdit && id) {
      setLoadingData(true)
      axiosInstance.get(`/api/hr/employees/${id}`)
        .then(res => {
          const emp = res.data.employee
          reset({
            employee_number: emp.employee_number || '',
            first_name: emp.first_name || '',
            last_name: emp.last_name || '',
            email: emp.email || '',
            phone: emp.phone || '',
            mobile: emp.mobile || '',
            date_of_birth: emp.date_of_birth ? emp.date_of_birth.split('T')[0] : '',
            gender: emp.gender || '',
            marital_status: emp.marital_status || '',
            address: emp.address || '',
            city: emp.city || '',
            postal_code: emp.postal_code || '',
            department_id: emp.department_id?.toString() || '',
            position: emp.position || '',
            employment_type: emp.employment_type || 'full_time',
            hire_date: emp.hire_date ? emp.hire_date.split('T')[0] : '',
            salary: emp.salary?.toString() || '',
            emergency_contact_name: emp.emergency_contact_name || '',
            emergency_contact_phone: emp.emergency_contact_phone || '',
            emergency_contact_relation: emp.emergency_contact_relation || ''
          })
        })
        .catch(() => {
          toast.error('Gagal memuat data karyawan')
          navigate('/app/hr/employees')
        })
        .finally(() => setLoadingData(false))
    }
  }, [id, isEdit, reset, navigate])

  const employmentTypes = [
    { value: 'full_time', label: 'Karyawan Tetap' },
    { value: 'contract', label: 'Kontrak' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'intern', label: 'Magang' },
    { value: 'outsource', label: 'Outsource' },
    { value: 'daily', label: 'Harian Lepas' }
  ]

  const genderOptions = [
    { value: 'male', label: 'Laki-laki' },
    { value: 'female', label: 'Perempuan' }
  ]

  const maritalOptions = [
    { value: 'single', label: 'Belum Menikah' },
    { value: 'married', label: 'Menikah' },
    { value: 'divorced', label: 'Cerai' },
    { value: 'widowed', label: 'Duda/Janda' }
  ]

  const relationOptions = [
    { value: 'spouse', label: 'Suami/Istri' },
    { value: 'parent', label: 'Orang Tua' },
    { value: 'sibling', label: 'Saudara Kandung' },
    { value: 'child', label: 'Anak' },
    { value: 'other', label: 'Lainnya' }
  ]

  const onSubmit = async (data: EmployeeFormData) => {
    setIsLoading(true)
    try {
      const payload = {
        ...data,
        department_id: data.department_id ? parseInt(data.department_id) : null,
        salary: data.salary ? parseFloat(data.salary) : null
      }

      if (isEdit) {
        await axiosInstance.put(`/api/hr/employees/${id}`, payload)
        toast.success('Data karyawan berhasil diperbarui!')
      } else {
        await createEmployee(payload).unwrap()
        toast.success('Karyawan baru berhasil ditambahkan!')
      }
      navigate('/app/hr/employees')
    } catch (error: any) {
      toast.error(error.data?.error || error.response?.data?.error || 'Gagal menyimpan data')
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingData) {
    return <LoadingSpinner />
  }

  const inputClass = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5"
  const errorClass = "mt-1 text-sm text-red-600"

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/hr/employees" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isEdit ? 'Perbarui informasi karyawan' : 'Lengkapi data karyawan baru'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Data Pribadi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <UserIcon className="h-6 w-6 text-white" />
              <h3 className="text-lg font-semibold text-white">Data Pribadi</h3>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={labelClass}>NIK / No. Karyawan <span className="text-red-500">*</span></label>
              <input
                type="text"
                {...register('employee_number', { required: 'NIK wajib diisi' })}
                className={`${inputClass} ${errors.employee_number ? 'border-red-300 bg-red-50' : ''}`}
                placeholder="Contoh: 001"
              />
              {errors.employee_number && <p className={errorClass}>{errors.employee_number.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Nama Depan <span className="text-red-500">*</span></label>
              <input
                type="text"
                {...register('first_name', { required: 'Nama depan wajib diisi' })}
                className={`${inputClass} ${errors.first_name ? 'border-red-300 bg-red-50' : ''}`}
                placeholder="Nama depan"
              />
              {errors.first_name && <p className={errorClass}>{errors.first_name.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Nama Belakang <span className="text-red-500">*</span></label>
              <input
                type="text"
                {...register('last_name', { required: 'Nama belakang wajib diisi' })}
                className={`${inputClass} ${errors.last_name ? 'border-red-300 bg-red-50' : ''}`}
                placeholder="Nama belakang"
              />
              {errors.last_name && <p className={errorClass}>{errors.last_name.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input type="email" {...register('email')} className={inputClass} placeholder="email@perusahaan.com" />
            </div>

            <div>
              <label className={labelClass}>No. Telepon</label>
              <input type="tel" {...register('phone')} className={inputClass} placeholder="08xxxxxxxxxx" />
            </div>

            <div>
              <label className={labelClass}>No. HP</label>
              <input type="tel" {...register('mobile')} className={inputClass} placeholder="08xxxxxxxxxx" />
            </div>

            <div>
              <label className={labelClass}>Tanggal Lahir</label>
              <input type="date" {...register('date_of_birth')} className={inputClass} max={new Date().toISOString().split('T')[0]} />
            </div>

            <div>
              <label className={labelClass}>Jenis Kelamin</label>
              <select {...register('gender')} className={inputClass}>
                <option value="">Pilih jenis kelamin</option>
                {genderOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Status Pernikahan</label>
              <select {...register('marital_status')} className={inputClass}>
                <option value="">Pilih status</option>
                {maritalOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Alamat</label>
              <textarea {...register('address')} rows={2} className={inputClass} placeholder="Alamat lengkap..." />
            </div>

            <div>
              <label className={labelClass}>Kota</label>
              <input type="text" {...register('city')} className={inputClass} placeholder="Kota" />
            </div>
          </div>
        </div>

        {/* Data Kepegawaian */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <BriefcaseIcon className="h-6 w-6 text-white" />
              <h3 className="text-lg font-semibold text-white">Data Kepegawaian</h3>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={labelClass}>Departemen</label>
              <select {...register('department_id')} className={inputClass}>
                <option value="">Pilih departemen</option>
                {departments?.departments?.map((dept: any) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Jabatan</label>
              <select {...register('position')} className={inputClass}>
                <option value="">Pilih jabatan</option>
                {positions?.positions?.map((pos: any) => (
                  <option key={pos.id} value={pos.name}>{pos.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Tipe Karyawan</label>
              <select {...register('employment_type')} className={inputClass}>
                {employmentTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Tanggal Masuk</label>
              <input type="date" {...register('hire_date')} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Gaji Pokok (Rp)</label>
              <input type="number" {...register('salary')} className={inputClass} placeholder="0" />
            </div>
          </div>
        </div>

        {/* Kontak Darurat */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="h-6 w-6 text-white" />
              <h3 className="text-lg font-semibold text-white">Kontak Darurat</h3>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={labelClass}>Nama Kontak</label>
              <input type="text" {...register('emergency_contact_name')} className={inputClass} placeholder="Nama lengkap" />
            </div>

            <div>
              <label className={labelClass}>No. Telepon</label>
              <input type="tel" {...register('emergency_contact_phone')} className={inputClass} placeholder="08xxxxxxxxxx" />
            </div>

            <div>
              <label className={labelClass}>Hubungan</label>
              <select {...register('emergency_contact_relation')} className={inputClass}>
                <option value="">Pilih hubungan</option>
                {relationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <Link to="/app/hr/employees" className="btn-secondary px-6 py-2.5">
            Batal
          </Link>
          <button
            type="submit"
            className="btn-primary px-6 py-2.5 flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <CheckIcon className="h-5 w-5" />
                {isEdit ? 'Simpan Perubahan' : 'Tambah Karyawan'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
