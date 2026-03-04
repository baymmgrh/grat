import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  CogIcon,
  TrophyIcon,
  PencilSquareIcon,
  DocumentChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

interface MachineStat {
  machine_id: number;
  machine_name: string;
  machine_code?: string;
  target_monthly: number;
  actual_output: number;
  total_produced: number;
  total_reject: number;
  total_rework: number;
  achievement_pct: number;
  quality_rate: number;
  avg_efficiency: number;
  working_days: number;
  is_achieved: boolean;
  status: string;
  gap: number;
}

interface Summary {
  total_machines: number;
  machines_achieved: number;
  machines_not_achieved: number;
  achievement_rate: number;
  total_target: number;
  total_actual: number;
  overall_achievement_pct: number;
  overall_status: string;
}

interface QualityObjectiveData {
  department: string;
  year: number;
  month: number;
  month_name: string;
  period: string;
  summary: Summary;
  machines: MachineStat[];
}

const QualityObjectiveProduction: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<QualityObjectiveData | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [editTargets, setEditTargets] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);

  const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/api/oee/quality-objectives/production?year=${selectedYear}&month=${selectedMonth}`
      );
      setData(response.data);
      // Initialize edit targets
      const targets: Record<number, number> = {};
      response.data.machines.forEach((m: MachineStat) => {
        targets[m.machine_id] = m.target_monthly;
      });
      setEditTargets(targets);
    } catch (error) {
      console.error('Error fetching quality objectives:', error);
    } finally {
      setLoading(false);
    }
  };

  const openTargetModal = () => {
    if (data) {
      const targets: Record<number, number> = {};
      data.machines.forEach(m => {
        targets[m.machine_id] = m.target_monthly;
      });
      setEditTargets(targets);
    }
    setShowTargetModal(true);
  };

  const saveTargets = async () => {
    setSaving(true);
    try {
      const targets = Object.entries(editTargets).map(([machineId, targetQty]) => ({
        machine_id: parseInt(machineId),
        year: selectedYear,
        month: selectedMonth,
        target_quantity: targetQty
      }));
      
      await axiosInstance.post('/api/oee/machine-monthly-targets/bulk', { targets });
      setShowTargetModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving targets:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('id-ID');
  };

  const getAchievementColor = (pct: number) => {
    if (pct >= 100) return 'text-green-600';
    if (pct >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAchievementBg = (pct: number) => {
    if (pct >= 100) return 'bg-green-50 border-green-200';
    if (pct >= 80) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <TrophyIcon className="h-7 w-7 text-amber-500" />
              Quality Objective - Produksi
            </h1>
            <p className="text-slate-500 mt-1">Target pencapaian produksi per mesin</p>
          </div>
          
          {/* Period Selector & Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-3 py-2">
              <CalendarIcon className="h-5 w-5 text-slate-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="border-0 focus:ring-0 text-sm font-medium text-slate-700"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="border-0 focus:ring-0 text-sm font-medium text-slate-700"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button
              onClick={openTargetModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <PencilSquareIcon className="h-5 w-5" />
              Set Target
            </button>
            <button
              onClick={() => navigate('/app/quality/objective/downtime-analysis')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
            >
              <DocumentChartBarIcon className="h-5 w-5" />
              Analisa Downtime
            </button>
          </div>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Overall Achievement */}
            <div className={`rounded-xl p-4 border-2 ${data.summary.overall_achievement_pct >= 100 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pencapaian Keseluruhan</p>
                  <p className={`text-3xl font-bold mt-1 ${data.summary.overall_achievement_pct >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.summary.overall_achievement_pct}%
                  </p>
                </div>
                {data.summary.overall_achievement_pct >= 100 ? (
                  <CheckCircleIcon className="h-12 w-12 text-green-500" />
                ) : (
                  <XCircleIcon className="h-12 w-12 text-red-500" />
                )}
              </div>
              <p className={`text-sm mt-2 font-medium ${data.summary.overall_achievement_pct >= 100 ? 'text-green-700' : 'text-red-700'}`}>
                {data.summary.overall_status}
              </p>
            </div>

            {/* Machines Achieved */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Mesin Tercapai</p>
                  <p className="text-2xl font-bold text-green-600">{data.summary.machines_achieved}</p>
                </div>
              </div>
            </div>

            {/* Machines Not Achieved */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Mesin Tidak Tercapai</p>
                  <p className="text-2xl font-bold text-red-600">{data.summary.machines_not_achieved}</p>
                </div>
              </div>
            </div>

            {/* Achievement Rate */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Tingkat Keberhasilan</p>
                  <p className="text-2xl font-bold text-blue-600">{data.summary.achievement_rate}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Total Summary */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 mb-6 text-white">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-blue-200 text-sm">Total Target Bulanan</p>
                <p className="text-3xl font-bold mt-1">{formatNumber(data.summary.total_target)}</p>
                <p className="text-blue-200 text-xs">pcs</p>
              </div>
              <div className="text-center border-x border-blue-400">
                <p className="text-blue-200 text-sm">Total Aktual (Grade A)</p>
                <p className="text-3xl font-bold mt-1">{formatNumber(data.summary.total_actual)}</p>
                <p className="text-blue-200 text-xs">pcs</p>
              </div>
              <div className="text-center">
                <p className="text-blue-200 text-sm">Gap</p>
                <p className={`text-3xl font-bold mt-1 ${data.summary.total_actual >= data.summary.total_target ? 'text-green-300' : 'text-red-300'}`}>
                  {data.summary.total_actual >= data.summary.total_target ? '+' : ''}{formatNumber(data.summary.total_actual - data.summary.total_target)}
                </p>
                <p className="text-blue-200 text-xs">pcs</p>
              </div>
            </div>
          </div>

          {/* Machine Details Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <CogIcon className="h-5 w-5 text-slate-500" />
                Detail Pencapaian per Mesin - {data.period}
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Mesin</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Target</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Aktual (A)</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Gap</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Pencapaian</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Quality</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Hari Kerja</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.machines.map((machine, index) => (
                    <tr key={machine.machine_id} className={`hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${machine.is_achieved ? 'bg-green-100' : 'bg-red-100'}`}>
                            <CogIcon className={`h-5 w-5 ${machine.is_achieved ? 'text-green-600' : 'text-red-600'}`} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{machine.machine_name}</p>
                            {machine.machine_code && (
                              <p className="text-xs text-slate-400">{machine.machine_code}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-medium text-slate-700">{formatNumber(machine.target_monthly)}</p>
                        <p className="text-xs text-slate-400">pcs</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-medium text-slate-700">{formatNumber(machine.actual_output)}</p>
                        <p className="text-xs text-slate-400">
                          Total: {formatNumber(machine.total_produced)} | Reject: {formatNumber(machine.total_reject)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {machine.gap >= 0 ? (
                            <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`font-medium ${machine.gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {machine.gap >= 0 ? '+' : ''}{formatNumber(machine.gap)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full ${getAchievementBg(machine.achievement_pct)}`}>
                          <span className={`text-sm font-bold ${getAchievementColor(machine.achievement_pct)}`}>
                            {machine.achievement_pct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-medium ${machine.quality_rate >= 95 ? 'text-green-600' : machine.quality_rate >= 85 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {machine.quality_rate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-slate-600">{machine.working_days} hari</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {machine.is_achieved ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircleIcon className="h-4 w-4" />
                            Tercapai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            <XCircleIcon className="h-4 w-4" />
                            Tidak Tercapai
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {data.machines.length === 0 && (
              <div className="p-12 text-center">
                <CogIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Tidak ada data mesin untuk periode ini</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Target Modal */}
      {showTargetModal && data && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                Set Target Bulanan - {data.period}
              </h3>
              <button
                onClick={() => setShowTargetModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    Target diisi manual karena kapasitas mesin bisa berubah setiap bulan (penyusutan, maintenance, dll)
                  </p>
                </div>
              </div>
              
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-slate-600">Mesin</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-slate-600">Target (pcs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.machines.map(machine => (
                    <tr key={machine.machine_id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-700">{machine.machine_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={editTargets[machine.machine_id] || 0}
                          onChange={(e) => setEditTargets(prev => ({
                            ...prev,
                            [machine.machine_id]: parseInt(e.target.value) || 0
                          }))}
                          className="w-full text-right px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowTargetModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Batal
              </button>
              <button
                onClick={saveTargets}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Target'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityObjectiveProduction;
