import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChartBarIcon,
  CalendarIcon,
  CogIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface DowntimeReason {
  reason: string;
  count: number;
  minutes: number;
  percentage: number;
}

interface CategoryData {
  category: string;
  minutes: number;
  percentage: number;
}

interface MachineDowntime {
  machine_id: number;
  machine_name: string;
  top_3_downtime: DowntimeReason[];
  downtime_by_category: CategoryData[];
  total_downtime: number;
  total_runtime: number;
}

interface RootCauseRecord {
  id?: number;
  machine_id: number;
  machine_name?: string;
  problem: string;
  category: string;
  occurrence_count: number;
  total_minutes: number;
  percentage: number;
  root_cause: string;
  corrective_action: string;
  preventive_action: string;
  status: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  mesin: 'bg-red-500',
  operator: 'bg-blue-500',
  material: 'bg-yellow-500',
  design: 'bg-purple-500',
  idle: 'bg-orange-500',
  others: 'bg-gray-500'
};

const CATEGORY_LABELS: Record<string, string> = {
  mesin: 'Mesin',
  operator: 'Operator',
  material: 'Material',
  design: 'Design',
  idle: 'Idle',
  others: 'Lainnya'
};

const DowntimeAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [machines, setMachines] = useState<MachineDowntime[]>([]);
  const [rootCauses, setRootCauses] = useState<RootCauseRecord[]>([]);
  const [period, setPeriod] = useState('');
  
  // Modal states
  const [showRootCauseModal, setShowRootCauseModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RootCauseRecord | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<MachineDowntime | null>(null);
  const [saving, setSaving] = useState(false);

  const months = [
    { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' }, { value: 4, label: 'April' },
    { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' }, { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
  ];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [downtimeRes, rootCauseRes] = await Promise.all([
        axiosInstance.get(`/api/oee/machine-downtime-analysis?year=${selectedYear}&month=${selectedMonth}`),
        axiosInstance.get(`/api/oee/downtime-root-causes?year=${selectedYear}&month=${selectedMonth}`)
      ]);
      setMachines(downtimeRes.data.machines);
      setPeriod(downtimeRes.data.period);
      setRootCauses(rootCauseRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddRootCause = (machine: MachineDowntime, reason?: DowntimeReason) => {
    setSelectedMachine(machine);
    setEditingRecord({
      machine_id: machine.machine_id,
      problem: reason?.reason || '',
      category: 'mesin',
      occurrence_count: reason?.count || 1,
      total_minutes: reason?.minutes || 0,
      percentage: reason?.percentage || 0,
      root_cause: '',
      corrective_action: '',
      preventive_action: '',
      status: 'open'
    });
    setShowRootCauseModal(true);
  };

  const openEditRootCause = (record: RootCauseRecord) => {
    setEditingRecord(record);
    setShowRootCauseModal(true);
  };

  const saveRootCause = async () => {
    if (!editingRecord) return;
    setSaving(true);
    try {
      await axiosInstance.post('/api/oee/downtime-root-causes', {
        ...editingRecord,
        year: selectedYear,
        month: selectedMonth
      });
      setShowRootCauseModal(false);
      setEditingRecord(null);
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteRootCause = async (id: number) => {
    if (!confirm('Hapus analisa ini?')) return;
    try {
      await axiosInstance.delete(`/api/oee/downtime-root-causes/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const formatNumber = (num: number) => num.toLocaleString('id-ID');

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/app/quality/objective/production')}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <ArrowLeftIcon className="h-5 w-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <ChartBarIcon className="h-7 w-7 text-amber-500" />
                Analisa Downtime & Root Cause
              </h1>
              <p className="text-slate-500 mt-1">Top 3 downtime per mesin dan analisa akar masalah</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-3 py-2">
            <CalendarIcon className="h-5 w-5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="border-0 focus:ring-0 text-sm font-medium text-slate-700"
            >
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border-0 focus:ring-0 text-sm font-medium text-slate-700"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Machine Downtime Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {machines.map(machine => (
          <div key={machine.machine_id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CogIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{machine.machine_name}</h3>
                    <p className="text-xs text-slate-500">
                      Total Downtime: {formatNumber(machine.total_downtime)} menit
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => openAddRootCause(machine)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  Root Cause
                </button>
              </div>
            </div>

            <div className="p-4">
              {/* Top 3 Downtime */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
                  Top 3 Downtime (Frekuensi)
                </h4>
                {machine.top_3_downtime.length > 0 ? (
                  <div className="space-y-2">
                    {machine.top_3_downtime.map((dt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100"
                        onClick={() => openAddRootCause(machine, dt)}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-red-100 text-red-600' :
                            idx === 1 ? 'bg-amber-100 text-amber-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-sm text-slate-700">{dt.reason}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-800">{dt.count}x</p>
                          <p className="text-xs text-slate-500">{dt.minutes}m ({dt.percentage}%)</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">Tidak ada data</p>
                )}
              </div>

              {/* Category Chart */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <ChartBarIcon className="h-4 w-4 text-blue-500" />
                  Downtime by Category
                </h4>
                {machine.downtime_by_category.length > 0 ? (
                  <div className="space-y-2">
                    {machine.downtime_by_category.map((cat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 w-16">{CATEGORY_LABELS[cat.category] || cat.category}</span>
                        <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${CATEGORY_COLORS[cat.category] || 'bg-gray-500'}`}
                            style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600 w-20 text-right">
                          {cat.minutes}m ({cat.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">Tidak ada data</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Root Cause Analysis Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">
            Laporan Pencapaian Tujuan & Sasaran - {period}
          </h2>
          <p className="text-sm text-slate-500">Analisa akar masalah dan tindakan perbaikan</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Mesin</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Problem</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-600">%</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-600">Menit</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Root Cause</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Corrective</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Preventive</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-600">Category</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-600">Status</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rootCauses.map(rc => (
                <tr key={rc.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-800">{rc.machine_name}</td>
                  <td className="px-3 py-2 text-slate-700">{rc.problem}</td>
                  <td className="px-3 py-2 text-center text-slate-700">{rc.percentage}%</td>
                  <td className="px-3 py-2 text-center text-slate-700">{rc.total_minutes}</td>
                  <td className="px-3 py-2 text-slate-600 max-w-xs truncate">{rc.root_cause || '-'}</td>
                  <td className="px-3 py-2 text-slate-600 max-w-xs truncate">{rc.corrective_action || '-'}</td>
                  <td className="px-3 py-2 text-slate-600 max-w-xs truncate">{rc.preventive_action || '-'}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${CATEGORY_COLORS[rc.category] || 'bg-gray-500'}`}>
                      {CATEGORY_LABELS[rc.category] || rc.category}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {rc.status === 'closed' ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <CheckCircleIcon className="h-4 w-4" /> Closed
                      </span>
                    ) : rc.status === 'in_progress' ? (
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <ClockIcon className="h-4 w-4" /> Progress
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600">
                        <XCircleIcon className="h-4 w-4" /> Open
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEditRootCause(rc)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => rc.id && deleteRootCause(rc.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rootCauses.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    Belum ada data analisa root cause
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Root Cause Modal */}
      {showRootCauseModal && editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingRecord.id ? 'Edit' : 'Tambah'} Root Cause Analysis
              </h3>
              <button onClick={() => setShowRootCauseModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[70vh] space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Problem</label>
                  <input
                    type="text"
                    value={editingRecord.problem}
                    onChange={(e) => setEditingRecord({...editingRecord, problem: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Masalah yang terjadi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={editingRecord.category}
                    onChange={(e) => setEditingRecord({...editingRecord, category: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="mesin">Mesin</option>
                    <option value="operator">Operator</option>
                    <option value="material">Material</option>
                    <option value="design">Design</option>
                    <option value="idle">Idle</option>
                    <option value="others">Lainnya</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Frekuensi</label>
                  <input
                    type="number"
                    value={editingRecord.occurrence_count}
                    onChange={(e) => setEditingRecord({...editingRecord, occurrence_count: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Menit</label>
                  <input
                    type="number"
                    value={editingRecord.total_minutes}
                    onChange={(e) => setEditingRecord({...editingRecord, total_minutes: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Persentase (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingRecord.percentage}
                    onChange={(e) => setEditingRecord({...editingRecord, percentage: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Root Cause (Akar Masalah)</label>
                <textarea
                  value={editingRecord.root_cause}
                  onChange={(e) => setEditingRecord({...editingRecord, root_cause: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  rows={2}
                  placeholder="Analisa akar masalah..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Corrective Action (Tindakan Perbaikan)</label>
                <textarea
                  value={editingRecord.corrective_action}
                  onChange={(e) => setEditingRecord({...editingRecord, corrective_action: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  rows={2}
                  placeholder="Tindakan perbaikan yang dilakukan..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preventive Action (Tindakan Pencegahan)</label>
                <textarea
                  value={editingRecord.preventive_action}
                  onChange={(e) => setEditingRecord({...editingRecord, preventive_action: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  rows={2}
                  placeholder="Tindakan pencegahan agar tidak terulang..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={editingRecord.status}
                  onChange={(e) => setEditingRecord({...editingRecord, status: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowRootCauseModal(false)} className="px-4 py-2 text-slate-600">
                Batal
              </button>
              <button
                onClick={saveRootCause}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DowntimeAnalysis;
