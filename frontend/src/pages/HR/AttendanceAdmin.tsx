import React, { useState } from 'react';
import { Search, Trash2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../utils/axiosConfig';

interface AttendanceRecord {
  id: number;
  name: string;
  jabatan: string | null;
  departemen: string | null;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
}

const AttendanceAdmin: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/attendance/admin/search?q=${encodeURIComponent(searchQuery)}`);
      setRecords(response.data.records || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal mencari data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record: AttendanceRecord) => {
    if (!confirm(`Yakin ingin menghapus data absensi "${record.name}" tanggal ${record.date}?`)) return;
    
    setDeletingId(record.id);
    setError(null);
    
    try {
      const response = await api.delete(`/api/attendance/admin/delete/${record.id}`);
      setSuccess(response.data.message || 'Data berhasil dihapus');
      setRecords(records.filter(r => r.id !== record.id));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal menghapus data');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      present: 'bg-green-100 text-green-800',
      late: 'bg-yellow-100 text-yellow-800',
      absent: 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Data Absensi</h1>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Cari nama staff (contoh: Test, nama double, dll)..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Cari
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Results */}
      {records.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <p className="text-sm text-gray-600">Ditemukan {records.length} data</p>
          </div>
          <div className="divide-y">
            {records.map(record => (
              <div key={record.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-gray-900">{record.name}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(record.status)}`}>
                      {record.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    <span>{record.date}</span>
                    {record.jabatan && <span> • {record.jabatan}</span>}
                    {record.departemen && <span> • {record.departemen}</span>}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Clock In: {record.clock_in || '-'} | Clock Out: {record.clock_out || '-'}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(record)}
                  disabled={deletingId === record.id}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  title="Hapus"
                >
                  {deletingId === record.id ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {records.length === 0 && searchQuery && !loading && (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          <p>Tidak ada data ditemukan untuk "{searchQuery}"</p>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h4 className="font-medium text-blue-900 mb-2">Tips:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Gunakan untuk menghapus data test atau nama double</li>
          <li>• Cari berdasarkan nama staff</li>
          <li>• Data yang dihapus tidak dapat dikembalikan</li>
        </ul>
      </div>
    </div>
  );
};

export default AttendanceAdmin;
