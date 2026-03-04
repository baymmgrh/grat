import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Users, AlertTriangle, CheckCircle, 
  Search, Filter, ChevronLeft, ChevronRight, TrendingUp,
  UserCheck, UserX, Timer
} from 'lucide-react';
import api from '../../utils/axiosConfig';

interface AttendanceRecord {
  id: number;
  attendance_date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  worked_hours: number | null;
  overtime_hours: number | null;
  attendee_name: string;
  notes: string | null;
}

interface MonthlySummary {
  name: string;
  total_days: number;
  present_days: number;
  late_days: number;
  total_worked_hours: number;
  total_overtime_hours: number;
}

interface DashboardStats {
  today: {
    date: string;
    total: number;
    present: number;
    late: number;
    clocked_out: number;
  };
  month: {
    year: number;
    month: number;
    total_records: number;
    late_records: number;
    late_percentage: number;
  };
}

const AttendanceReport: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [lateToday, setLateToday] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/api/attendance/dashboard/stats');
      setDashboardStats(response.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  };

  // Fetch late today
  const fetchLateToday = async () => {
    try {
      const response = await api.get('/api/attendance/today/late');
      setLateToday(response.data.late_employees || []);
    } catch (err) {
      console.error('Error fetching late today:', err);
    }
  };

  // Fetch attendance records
  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        page: currentPage.toString(),
        per_page: '20'
      });
      if (nameFilter) params.append('name', nameFilter);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await api.get(`/api/attendance/report?${params}`);
      setRecords(response.data.records);
      setTotalPages(response.data.pages);
      setTotalRecords(response.data.total);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch monthly summary
  const fetchMonthlySummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/attendance/summary/monthly?year=${selectedYear}&month=${selectedMonth}`);
      setMonthlySummary(response.data.summary);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchLateToday();
  }, []);

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchRecords();
    } else {
      fetchMonthlySummary();
    }
  }, [activeTab, startDate, endDate, nameFilter, statusFilter, currentPage, selectedMonth, selectedYear]);

  const formatTime = (datetime: string | null) => {
    if (!datetime) return '-';
    return new Date(datetime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { 
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Hadir</span>;
      case 'late':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Terlambat</span>;
      case 'absent':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Absen</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Absensi</h1>
          <p className="text-gray-500 mt-1">Rekap kehadiran karyawan</p>
        </div>
      </div>

      {/* Dashboard Stats */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Hadir Hari Ini</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.today.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tepat Waktu</p>
                <p className="text-2xl font-bold text-green-600">{dashboardStats.today.present}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Terlambat Hari Ini</p>
                <p className="text-2xl font-bold text-yellow-600">{dashboardStats.today.late}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">% Terlambat Bulan Ini</p>
                <p className="text-2xl font-bold text-purple-600">{dashboardStats.month.late_percentage}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Late Today Alert */}
      {lateToday.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">Karyawan Terlambat Hari Ini ({lateToday.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lateToday.map((emp, idx) => (
              <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                {emp.name} - {emp.clock_in}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'daily' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Harian
              </div>
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'monthly' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Rekap Bulanan
              </div>
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Filters */}
          {activeTab === 'daily' ? (
            <div className="flex flex-wrap gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tanggal Akhir</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nama</label>
                <input
                  type="text"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  placeholder="Cari nama..."
                  className="px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">Semua</option>
                  <option value="present">Hadir</option>
                  <option value="late">Terlambat</option>
                  <option value="absent">Absen</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Bulan</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 py-2 border rounded-lg"
                >
                  {monthNames.map((name, idx) => (
                    <option key={idx} value={idx + 1}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tahun</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border rounded-lg"
                >
                  {[2024, 2025, 2026].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : activeTab === 'daily' ? (
            <>
              {/* Daily Records Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Tanggal</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Nama</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Clock In</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Clock Out</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Jam Kerja</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Lembur</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-500">
                          Tidak ada data absensi
                        </td>
                      </tr>
                    ) : (
                      records.map((record) => (
                        <tr key={record.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{formatDate(record.attendance_date)}</td>
                          <td className="py-3 px-4 font-medium">{record.attendee_name || '-'}</td>
                          <td className="py-3 px-4">{formatTime(record.clock_in)}</td>
                          <td className="py-3 px-4">{formatTime(record.clock_out)}</td>
                          <td className="py-3 px-4">{record.worked_hours ? `${record.worked_hours} jam` : '-'}</td>
                          <td className="py-3 px-4">{record.overtime_hours ? `${record.overtime_hours} jam` : '-'}</td>
                          <td className="py-3 px-4">{getStatusBadge(record.status)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Menampilkan {records.length} dari {totalRecords} data
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border rounded-lg disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 border rounded-lg disabled:opacity-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Monthly Summary Table */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Nama</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Total Hari</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Hadir</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Terlambat</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Total Jam Kerja</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Total Lembur</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySummary.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        Tidak ada data absensi bulan {monthNames[selectedMonth - 1]} {selectedYear}
                      </td>
                    </tr>
                  ) : (
                    monthlySummary.map((summary, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{summary.name}</td>
                        <td className="py-3 px-4 text-center">{summary.total_days}</td>
                        <td className="py-3 px-4 text-center text-green-600 font-medium">{summary.present_days}</td>
                        <td className="py-3 px-4 text-center text-yellow-600 font-medium">{summary.late_days}</td>
                        <td className="py-3 px-4 text-center">{summary.total_worked_hours} jam</td>
                        <td className="py-3 px-4 text-center text-purple-600">{summary.total_overtime_hours} jam</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceReport;
