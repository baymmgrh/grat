import { useState, useEffect } from 'react';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';

interface Department {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  employee_count?: number;
}

export default function Departments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ code: '', name: '', description: '' });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/api/hr/departments');
      setDepartments(response.data.departments || response.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingDept(null);
    setFormData({ code: '', name: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setFormData({ code: dept.code, name: dept.name, description: dept.description || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await axiosInstance.put(`/api/hr/departments/${editingDept.id}`, formData);
        toast.success('Departemen berhasil diupdate');
      } else {
        await axiosInstance.post('/api/hr/departments', formData);
        toast.success('Departemen berhasil ditambahkan');
      }
      setShowModal(false);
      fetchDepartments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menyimpan departemen');
    }
  };

  const handleDelete = async (dept: Department) => {
    if (!confirm(`Hapus departemen ${dept.name}?`)) return;
    try {
      await axiosInstance.delete(`/api/hr/departments/${dept.id}`);
      toast.success('Departemen berhasil dihapus');
      fetchDepartments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus departemen');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Departemen</h1>
          <p className="text-gray-600">Kelola data departemen perusahaan</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          Tambah Departemen
        </button>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari departemen..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data...</p>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
            <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <p className="mt-4 text-gray-600">Tidak ada departemen ditemukan</p>
          </div>
        ) : (
          filteredDepartments.map(dept => (
            <div key={dept.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                    <p className="text-sm text-gray-500">{dept.code}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(dept)}
                    className="p-1 text-gray-500 hover:text-blue-600"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(dept)}
                    className="p-1 text-gray-500 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {dept.description && (
                <p className="mt-2 text-sm text-gray-600">{dept.description}</p>
              )}
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <UserGroupIcon className="h-4 w-4" />
                <span>{dept.employee_count || 0} karyawan</span>
              </div>
              <span className={`mt-2 inline-block px-2 py-1 text-xs rounded-full ${
                dept.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {dept.is_active ? 'Aktif' : 'Non-aktif'}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingDept ? 'Edit Departemen' : 'Tambah Departemen'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kode</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Contoh: HRD"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Departemen</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Contoh: Human Resources Department"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Deskripsi departemen (opsional)"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
