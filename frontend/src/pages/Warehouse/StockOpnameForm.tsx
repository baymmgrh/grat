import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';
import {
  ClipboardDocumentCheckIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

interface Zone {
  id: number;
  code: string;
  name: string;
  material_type: string;
}

interface User {
  id: number;
  full_name: string;
}

export default function StockOpnameForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [formData, setFormData] = useState({
    zone_id: '',
    opname_type: 'full',
    scheduled_date: new Date().toISOString().split('T')[0],
    assigned_to: '',
    notes: '',
  });

  useEffect(() => {
    fetchZones();
    fetchUsers();
  }, []);

  const fetchZones = async () => {
    try {
      const response = await axiosInstance.get('/api/stock-opname/zones');
      setZones(response.data.zones || []);
    } catch (error) {
      console.error('Error fetching zones:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/api/auth/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.scheduled_date) {
      toast.error('Tanggal jadwal harus diisi');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        zone_id: formData.zone_id ? parseInt(formData.zone_id) : null,
        opname_type: formData.opname_type,
        scheduled_date: formData.scheduled_date,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        notes: formData.notes || null,
      };

      const response = await axiosInstance.post('/api/stock-opname/orders', payload);
      toast.success('Perintah stok opname berhasil dibuat');
      navigate(`/app/warehouse/stock-opname/${response.data.order.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal membuat perintah opname');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/app/warehouse/stock-opname')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-600" />
            Buat Perintah Stok Opname
          </h1>
          <p className="text-gray-600">Buat perintah penghitungan fisik inventory</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Zone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zona Gudang
            </label>
            <select
              value={formData.zone_id}
              onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Zona</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.code} - {zone.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Kosongkan untuk menghitung semua zona
            </p>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipe Opname *
            </label>
            <select
              value={formData.opname_type}
              onChange={(e) => setFormData({ ...formData, opname_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="full">Full Count - Semua Barang</option>
              <option value="partial">Partial - Barang Tertentu</option>
              <option value="cycle">Cycle Count - Berdasarkan ABC Class</option>
            </select>
          </div>

          {/* Scheduled Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Jadwal *
            </label>
            <input
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ditugaskan Kepada
            </label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Penanggung Jawab</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catatan
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Catatan tambahan..."
          />
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">ℹ️ Informasi</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Sistem akan otomatis membuat daftar item berdasarkan zona yang dipilih</li>
            <li>• Setelah dibuat, Anda dapat memulai proses penghitungan</li>
            <li>• Hasil penghitungan akan dibandingkan dengan data sistem</li>
            <li>• Selisih dapat diapprove untuk membuat penyesuaian stok</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/app/warehouse/stock-opname')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Buat Perintah Opname'}
          </button>
        </div>
      </form>
    </div>
  );
}
