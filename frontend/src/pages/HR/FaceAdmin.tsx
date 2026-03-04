import React, { useState, useEffect } from 'react';
import { Search, Trash2, RefreshCw, AlertCircle, CheckCircle, Users, Camera } from 'lucide-react';
import api from '../../utils/axiosConfig';

interface RegisteredFace {
  id: number;
  name: string;
  jabatan: string | null;
  departemen: string | null;
  is_active: boolean;
  created_at: string | null;
}

const FaceAdmin: React.FC = () => {
  const [registeredFaces, setRegisteredFaces] = useState<RegisteredFace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchRegisteredFaces();
  }, []);

  const fetchRegisteredFaces = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/face/list');
      setRegisteredFaces(response.data.staff || []);
    } catch (err) {
      console.error('Error fetching registered faces:', err);
      setError('Gagal memuat data wajah terdaftar');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFace = async (id: number, faceName: string) => {
    if (!confirm(`Yakin ingin menghapus data wajah "${faceName}"?`)) return;
    
    setDeletingId(id);
    setError(null);
    
    try {
      const response = await api.delete(`/api/face/delete/${id}`);
      setSuccess(`Data wajah "${faceName}" berhasil dihapus`);
      setRegisteredFaces(registeredFaces.filter(f => f.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal menghapus data');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredFaces = registeredFaces.filter(face =>
    face.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (face.jabatan && face.jabatan.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (face.departemen && face.departemen.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Camera className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kelola Data Wajah</h1>
            <p className="text-sm text-gray-500">Kelola data wajah terdaftar untuk absensi</p>
          </div>
        </div>
        <button
          onClick={fetchRegisteredFaces}
          disabled={loading}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{registeredFaces.length}</p>
            <p className="text-sm text-gray-500">Total Wajah Terdaftar</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">×</button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-600 hover:text-green-800">×</button>
        </div>
      )}

      {/* Search & List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, jabatan, atau departemen..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Memuat data...</p>
          </div>
        ) : filteredFaces.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : 'Belum ada wajah terdaftar'}
          </div>
        ) : (
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {filteredFaces.map(face => (
              <div key={face.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{face.name}</p>
                  <p className="text-sm text-gray-500">
                    {face.jabatan || '-'} • {face.departemen || '-'}
                  </p>
                  {face.created_at && (
                    <p className="text-xs text-gray-400 mt-1">
                      Terdaftar: {new Date(face.created_at).toLocaleDateString('id-ID')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteFace(face.id, face.name)}
                  disabled={deletingId === face.id}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  title="Hapus"
                >
                  {deletingId === face.id ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h4 className="font-medium text-blue-900 mb-2">Informasi:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Staff mendaftar wajah di halaman <code className="bg-blue-100 px-1 rounded">/public/face-registration</code></li>
          <li>• Untuk update foto: hapus data lama, staff daftar ulang dengan foto baru</li>
          <li>• Data yang dihapus tidak dapat dikembalikan</li>
        </ul>
      </div>
    </div>
  );
};

export default FaceAdmin;
