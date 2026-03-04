import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import axiosInstance from '../../lib/axios';

interface NotClockedOutRecord {
  id: number;
  name: string;
  jabatan: string | null;
  departemen: string | null;
  clock_in: string;
  clock_in_time: string;
  status: string;
  hours_since_clock_in: number;
}

const AttendanceNotClockedOut: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<NotClockedOutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<string>('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/attendance/dashboard/not-clocked-out');
      setRecords(response.data.records || []);
      setDate(response.data.date || '');
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timeStr: string) => {
    return timeStr;
  };

  const getStatusBadge = (hours: number) => {
    if (hours >= 10) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">⚠️ Sangat Lama</span>;
    } else if (hours >= 8) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Perlu Perhatian</span>;
    }
    return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Normal</span>;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Belum Clock Out Hari Ini</h1>
            <p className="text-gray-500 text-sm">
              {date && new Date(date).toLocaleDateString('id-ID', { 
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Update terakhir: {lastRefresh.toLocaleTimeString('id-ID')}
          </span>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{records.length}</p>
              <p className="text-sm text-gray-500">Belum Clock Out</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {records.filter(r => r.hours_since_clock_in >= 10).length}
              </p>
              <p className="text-sm text-gray-500">Lebih dari 10 Jam</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">17:00</p>
              <p className="text-sm text-gray-500">Jam Pulang Standar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-gray-500">Memuat data...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Semua Sudah Clock Out! 🎉</h3>
            <p className="text-gray-500">Tidak ada staff yang belum clock out hari ini.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jabatan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departemen</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durasi</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {records.map((record, index) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{record.name}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{record.jabatan || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{record.departemen || '-'}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{formatTime(record.clock_in)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {record.hours_since_clock_in.toFixed(1)} jam
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(record.hours_since_clock_in)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Note */}
      {records.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 <strong>Tips:</strong> Ingatkan staff untuk melakukan clock out sebelum pulang. 
            Staff dapat membuka halaman absensi dan data mereka akan otomatis terisi jika sudah clock in hari ini.
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendanceNotClockedOut;
