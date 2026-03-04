import React, { useState, useEffect } from 'react';
import { 
  Calendar, User, FileText, Clock, CheckCircle, XCircle, 
  AlertTriangle, Loader2, ArrowLeft, Send, History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Get API base URL
const getApiBase = () => {
  const hostname = window.location.hostname;
  if (hostname === 'erp.graterp.my.id' || hostname.endsWith('.graterp.my.id')) {
    return 'https://api.graterp.my.id';
  }
  return `http://${hostname}:5000`;
};
const API_BASE = getApiBase();

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
  rejection_reason?: string;
  created_at: string;
}

const leaveTypes = [
  { value: 'sakit', label: 'Sakit', color: 'bg-red-100 text-red-800' },
  { value: 'izin', label: 'Izin', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'cuti_tahunan', label: 'Cuti Tahunan', color: 'bg-blue-100 text-blue-800' },
  { value: 'cuti_khusus', label: 'Cuti Khusus', color: 'bg-purple-100 text-purple-800' },
  { value: 'dinas_luar', label: 'Dinas Luar', color: 'bg-green-100 text-green-800' },
];

const toProperCase = (name: string): string => {
  return name.trim().split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

const StaffLeaveRequest: React.FC = () => {
  const navigate = useNavigate();
  
  // Company info state
  const [companyName, setCompanyName] = useState('');
  
  // Form state
  const [name, setName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Fetch company info on mount
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/settings/company/public`);
        const data = await response.json();
        if (data.name) {
          setCompanyName(data.name);
        }
      } catch (err) {
        console.error('Error fetching company info:', err);
      }
    };
    fetchCompanyInfo();
  }, []);

  // Calculate total days
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;
    
    let days = 0;
    const current = new Date(start);
    while (current <= end) {
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        days++;
      }
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const totalDays = calculateDays();

  // Check leave history
  const checkHistory = async () => {
    if (!name.trim()) {
      setError('Masukkan nama Anda terlebih dahulu');
      return;
    }

    setLoadingHistory(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/staff-leave/public/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_name: name })
      });

      const data = await response.json();
      
      if (response.ok) {
        setLeaveHistory(data.leave_requests || []);
        setIsLoggedIn(true);
        setShowHistory(true);
      } else {
        setError(data.error || 'Gagal mengambil data');
      }
    } catch (err) {
      setError('Gagal terhubung ke server');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Submit leave request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Nama wajib diisi');
      return;
    }
    if (!leaveType) {
      setError('Pilih tipe izin/cuti');
      return;
    }
    if (!startDate || !endDate) {
      setError('Tanggal mulai dan selesai wajib diisi');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('Tanggal selesai harus setelah tanggal mulai');
      return;
    }
    if (!reason.trim()) {
      setError('Alasan wajib diisi');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/staff-leave/public/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_name: name,
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason: reason
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Pengajuan berhasil! Nomor: ${data.leave_request.request_number}`);
        // Reset form
        setLeaveType('');
        setStartDate('');
        setEndDate('');
        setReason('');
        // Refresh history
        checkHistory();
      } else {
        setError(data.error || 'Gagal mengajukan izin/cuti');
      }
    } catch (err) {
      setError('Gagal terhubung ke server');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel leave request
  const handleCancel = async (requestId: number) => {
    if (!confirm('Yakin ingin membatalkan pengajuan ini?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/staff-leave/public/cancel/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_name: name })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Pengajuan berhasil dibatalkan');
        checkHistory();
      } else {
        setError(data.error || 'Gagal membatalkan pengajuan');
      }
    } catch (err) {
      setError('Gagal terhubung ke server');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Pengajuan Izin / Cuti</h1>
          <p className="text-gray-600 mt-2">Staff {companyName || 'Loading...'}</p>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => navigate('/public/attendance')}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Absensi
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        {/* Name Input / Login */}
        {!isLoggedIn ? (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              Masukkan Nama Anda
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={(e) => setName(toProperCase(e.target.value))}
                placeholder="Nama Lengkap"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={checkHistory}
                disabled={loadingHistory || !name.trim()}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingHistory ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Lanjutkan
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* User Info */}
            <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-sm text-gray-500">Staff</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  setName('');
                  setLeaveHistory([]);
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Ganti
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setShowHistory(false)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  !showHistory 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Ajukan Baru
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  showHistory 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <History className="h-4 w-4 inline mr-2" />
                Riwayat ({leaveHistory.length})
              </button>
            </div>

            {/* Form or History */}
            {!showHistory ? (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Form Pengajuan</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Leave Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipe Izin/Cuti
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {leaveTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setLeaveType(type.value)}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            leaveType === type.value
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className={`inline-block px-2 py-1 rounded text-xs ${type.color}`}>
                            {type.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Mulai
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Selesai
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Total Days */}
                  {totalDays > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Total: <strong>{totalDays} hari kerja</strong>
                      </p>
                    </div>
                  )}

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alasan
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      placeholder="Jelaskan alasan pengajuan izin/cuti..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Ajukan
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Riwayat Pengajuan</h2>
                {leaveHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Belum ada riwayat pengajuan
                  </p>
                ) : (
                  <div className="space-y-4">
                    {leaveHistory.map((req) => (
                      <div key={req.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{req.request_number}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(req.created_at).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(req.status)}`}>
                            {req.status_label}
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="text-gray-500">Tipe:</span>{' '}
                            <span className="font-medium">{req.leave_type_label}</span>
                          </p>
                          <p>
                            <span className="text-gray-500">Tanggal:</span>{' '}
                            {new Date(req.start_date).toLocaleDateString('id-ID')} - {new Date(req.end_date).toLocaleDateString('id-ID')}
                          </p>
                          <p>
                            <span className="text-gray-500">Durasi:</span>{' '}
                            {req.total_days} hari kerja
                          </p>
                          <p>
                            <span className="text-gray-500">Alasan:</span>{' '}
                            {req.reason}
                          </p>
                          {req.rejection_reason && (
                            <p className="text-red-600">
                              <span className="text-gray-500">Alasan Ditolak:</span>{' '}
                              {req.rejection_reason}
                            </p>
                          )}
                        </div>
                        {req.status === 'pending' && (
                          <button
                            onClick={() => handleCancel(req.id)}
                            className="mt-3 text-sm text-red-600 hover:text-red-700"
                          >
                            Batalkan Pengajuan
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StaffLeaveRequest;
