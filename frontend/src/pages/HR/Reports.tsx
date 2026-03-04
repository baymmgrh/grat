import { useState } from 'react';
import {
  DocumentChartBarIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const REPORT_TYPES: ReportType[] = [
  {
    id: 'employee_list',
    name: 'Daftar Karyawan',
    description: 'Laporan lengkap data karyawan aktif',
    icon: UserGroupIcon,
    color: 'blue'
  },
  {
    id: 'attendance_summary',
    name: 'Ringkasan Kehadiran',
    description: 'Laporan kehadiran per periode',
    icon: ClockIcon,
    color: 'green'
  },
  {
    id: 'leave_report',
    name: 'Laporan Cuti',
    description: 'Rekap penggunaan cuti karyawan',
    icon: CalendarIcon,
    color: 'purple'
  },
  {
    id: 'payroll_summary',
    name: 'Ringkasan Payroll',
    description: 'Laporan gaji per periode',
    icon: CurrencyDollarIcon,
    color: 'yellow'
  },
  {
    id: 'department_headcount',
    name: 'Headcount per Departemen',
    description: 'Jumlah karyawan per departemen',
    icon: DocumentChartBarIcon,
    color: 'indigo'
  }
];

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = async () => {
    if (!selectedReport) {
      toast.error('Pilih jenis laporan terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      const params: any = { report_type: selectedReport };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (department) params.department = department;

      const response = await axiosInstance.get('/api/hr/reports/generate', { params });
      if (response.data.success) {
        setReportData(response.data.data);
        toast.success('Laporan berhasil dibuat');
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error(error.response?.data?.error || 'Gagal membuat laporan');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'excel' | 'pdf') => {
    if (!selectedReport) {
      toast.error('Pilih jenis laporan terlebih dahulu');
      return;
    }

    try {
      const params: any = { 
        report_type: selectedReport,
        format,
        date_from: dateFrom,
        date_to: dateTo,
        department
      };

      const response = await axiosInstance.get('/api/hr/reports/export', { 
        params,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `hr_report_${selectedReport}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Laporan berhasil diexport ke ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Gagal mengexport laporan');
    }
  };

  const getColorClass = (color: string) => {
    const colors: { [key: string]: string } = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      indigo: 'bg-indigo-100 text-indigo-600'
    };
    return colors[color] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laporan HR</h1>
        <p className="text-gray-600">Generate dan export laporan HR</p>
      </div>

      {/* Report Types */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pilih Jenis Laporan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_TYPES.map(report => {
            const Icon = report.icon;
            const isSelected = selectedReport === report.id;
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`p-4 rounded-lg border-2 text-left transition ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getColorClass(report.color)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{report.name}</h3>
                    <p className="text-sm text-gray-500">{report.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FunnelIcon className="h-5 w-5" />
          Filter
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Departemen</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Semua Departemen</option>
              <option value="PRD">Production</option>
              <option value="HRD">Human Resources</option>
              <option value="ACC">Accounting</option>
              <option value="QC">Quality Control</option>
              <option value="MTC">Maintenance</option>
              <option value="PPIC">PPIC</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={generateReport}
            disabled={loading || !selectedReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Generate Laporan'}
          </button>
          <button
            onClick={() => exportReport('excel')}
            disabled={!selectedReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export Excel
          </button>
          <button
            onClick={() => exportReport('pdf')}
            disabled={!selectedReport}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Report Preview */}
      {reportData && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview Laporan</h2>
          <div className="overflow-x-auto">
            {reportData.headers && reportData.rows ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {reportData.headers.map((header: string, idx: number) => (
                      <th key={idx} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.rows.map((row: any[], rowIdx: number) => (
                    <tr key={rowIdx} className="hover:bg-gray-50">
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-3 text-sm text-gray-900">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DocumentChartBarIcon className="h-12 w-12 mx-auto mb-2" />
                <p>Tidak ada data untuk ditampilkan</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
