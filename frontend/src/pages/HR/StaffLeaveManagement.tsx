import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle, XCircle, Clock, User, Calendar,
  Loader2, Filter, Search, ChevronDown, MapPin, Settings
} from 'lucide-react';
import axiosInstance from '../../lib/axios';

interface LeaveRequest {
  id: number;
  request_number: string;
  staff_name: string;
  leave_type: string;
  leave_type_label: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
  status_label: string;
  approver_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
}

interface OfficeLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_default: boolean;
  address?: string;
}

const StaffLeaveManagement: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: '',
    staff_name: '',
    leave_type: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0
  });
  
  // Office location state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locations, setLocations] = useState<OfficeLocation[]>([]);
  const [newLocation, setNewLocation] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radius_meters: '100',
    address: '',
    is_default: false
  });
  const [savingLocation, setSavingLocation] = useState(false);

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchRequests();
    fetchLocations();
  }, [filter, pagination.page]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.staff_name) params.append('staff_name', filter.staff_name);
      if (filter.leave_type) params.append('leave_type', filter.leave_type);
      params.append('page', pagination.page.toString());
      params.append('per_page', '20');

      const response = await axiosInstance.get(`/api/staff-leave/list?${params.toString()}`);
      setRequests(response.data.leave_requests || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
        pages: response.data.pages
      }));
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axiosInstance.get('/api/staff-leave/office-locations');
      setLocations(response.data.locations || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('Yakin ingin menyetujui pengajuan ini?')) return;
    
    try {
      await axiosInstance.post(`/api/staff-leave/approve/${id}`);
      fetchRequests();
    } catch (error) {
      console.error('Error approving:', error);
      alert('Gagal menyetujui pengajuan');
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    
    try {
      await axiosInstance.post(`/api/staff-leave/reject/${rejectingId}`, {
        reason: rejectReason || 'Ditolak oleh admin'
      });
      setShowRejectModal(false);
      setRejectingId(null);
      setRejectReason('');
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Gagal menolak pengajuan');
    }
  };

  const handleSaveLocation = async () => {
    if (!newLocation.name || !newLocation.latitude || !newLocation.longitude) {
      alert('Nama, latitude, dan longitude wajib diisi');
      return;
    }

    setSavingLocation(true);
    try {
      await axiosInstance.post('/api/staff-leave/office-locations', {
        name: newLocation.name,
        latitude: parseFloat(newLocation.latitude),
        longitude: parseFloat(newLocation.longitude),
        radius_meters: parseInt(newLocation.radius_meters) || 100,
        address: newLocation.address,
        is_default: newLocation.is_default
      });
      setNewLocation({ name: '', latitude: '', longitude: '', radius_meters: '100', address: '', is_default: false });
      fetchLocations();
      alert('Lokasi kantor berhasil disimpan');
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Gagal menyimpan lokasi');
    } finally {
      setSavingLocation(false);
    }
  };

  const handleDeleteLocation = async (id: number) => {
    if (!confirm('Yakin ingin menghapus lokasi ini?')) return;
    
    try {
      await axiosInstance.delete(`/api/staff-leave/office-locations/${id}`);
      fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('Gagal menghapus lokasi');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    switch (type) {
      case 'sakit':
        return 'bg-red-100 text-red-700';
      case 'izin':
        return 'bg-yellow-100 text-yellow-700';
      case 'cuti_tahunan':
        return 'bg-blue-100 text-blue-700';
      case 'cuti_khusus':
        return 'bg-purple-100 text-purple-700';
      case 'dinas_luar':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Pengajuan Izin/Cuti Staff
          </h1>
          {pendingCount > 0 && (
            <p className="text-sm text-yellow-600 mt-1">
              {pendingCount} pengajuan menunggu persetujuan
            </p>
          )}
        </div>
        <button
          onClick={() => setShowLocationModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          <Settings className="h-4 w-4" />
          Lokasi Kantor
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Staff</label>
            <input
              type="text"
              value={filter.staff_name}
              onChange={(e) => setFilter(prev => ({ ...prev, staff_name: e.target.value }))}
              placeholder="Cari nama..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
            <select
              value={filter.leave_type}
              onChange={(e) => setFilter(prev => ({ ...prev, leave_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Tipe</option>
              <option value="sakit">Sakit</option>
              <option value="izin">Izin</option>
              <option value="cuti_tahunan">Cuti Tahunan</option>
              <option value="cuti_khusus">Cuti Khusus</option>
              <option value="dinas_luar">Dinas Luar</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilter({ status: '', staff_name: '', leave_type: '' })}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Tidak ada data pengajuan
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Request</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durasi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">{req.request_number}</p>
                    <p className="text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString('id-ID')}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">{req.staff_name}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getLeaveTypeBadge(req.leave_type)}`}>
                      {req.leave_type_label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(req.start_date).toLocaleDateString('id-ID')} - {new Date(req.end_date).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {req.total_days} hari
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(req.status)}`}>
                      {req.status_label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {req.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Setujui"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(req.id);
                            setShowRejectModal(true);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Tolak"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {req.approver_name && `Oleh: ${req.approver_name}`}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Halaman {pagination.page} dari {pagination.pages} ({pagination.total} data)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Tolak Pengajuan</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Penolakan</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Masukkan alasan penolakan..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingId(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg"
              >
                Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Office Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Pengaturan Lokasi Kantor
              </h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              {/* Existing Locations */}
              {locations.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Lokasi Tersimpan</h4>
                  <div className="space-y-2">
                    {locations.map((loc) => (
                      <div key={loc.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {loc.name}
                            {loc.is_default && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Default</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            📍 {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                          </p>
                          <p className="text-sm text-gray-500">
                            📐 Radius: {loc.radius_meters} meter
                          </p>
                          {loc.address && (
                            <p className="text-sm text-gray-500">📮 {loc.address}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteLocation(loc.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Location */}
              <div>
                <h4 className="font-medium mb-3">Tambah Lokasi Baru</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lokasi</label>
                    <input
                      type="text"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Kantor Pusat"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                      <input
                        type="text"
                        value={newLocation.latitude}
                        onChange={(e) => setNewLocation(prev => ({ ...prev, latitude: e.target.value }))}
                        placeholder="-6.200000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                      <input
                        type="text"
                        value={newLocation.longitude}
                        onChange={(e) => setNewLocation(prev => ({ ...prev, longitude: e.target.value }))}
                        placeholder="106.816666"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Radius (meter)</label>
                    <input
                      type="number"
                      value={newLocation.radius_meters}
                      onChange={(e) => setNewLocation(prev => ({ ...prev, radius_meters: e.target.value }))}
                      placeholder="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Jarak maksimal dari titik lokasi yang diizinkan untuk absensi</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat (opsional)</label>
                    <input
                      type="text"
                      value={newLocation.address}
                      onChange={(e) => setNewLocation(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Jl. Contoh No. 123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={newLocation.is_default}
                      onChange={(e) => setNewLocation(prev => ({ ...prev, is_default: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="is_default" className="text-sm text-gray-700">Jadikan lokasi default</label>
                  </div>
                  <button
                    onClick={handleSaveLocation}
                    disabled={savingLocation}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                  >
                    {savingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Simpan Lokasi'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffLeaveManagement;
