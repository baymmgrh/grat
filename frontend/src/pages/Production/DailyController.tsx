import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CogIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PauseIcon,
  CubeIcon,
  ChartBarIcon,
  EyeIcon,
  Squares2X2Icon,
  DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import DailyControllerDetail from './DailyControllerDetail';

interface ShiftData {
  shift: number;
  sub_shift?: string | null;  // 'a', 'b', 'c' or null for legacy
  shift_production_id?: number;  // For ordering legacy data
  planned_runtime?: number;  // User input average time
  runtime_minutes: number;
  downtime_minutes: number;
  idle_time_minutes: number;
  waktu_tidak_tercatat?: number;
  grade_a: number;
  grade_a_carton: number;
  grade_b: number;
  grade_c: number;
  setting_sticker: number;
  setting_packaging: number;
  total: number;
  product_name?: string;
  pack_per_carton?: number;
  wo_number?: string;
  // Per sub-shift calculated fields
  machine_speed?: number;
  runtime?: number;
  efficiency?: number;
  // Early stop info
  early_stop?: boolean;
  early_stop_time?: string;
  early_stop_reason?: string;
  early_stop_notes?: string;
  operator_reassigned?: boolean;
  reassignment_task?: string;
}

interface DowntimeItem {
  reason: string;
  duration_minutes: number;
  frequency?: number;
}

interface ShiftSummary {
  shift: number;
  grade_a: number;
  grade_b: number;
  grade_c: number;
  total_output: number;
  downtime: number;
  idle: number;
  products: string[];
  average_time: number;
  machine_speed: number;
  runtime: number;
  waktu_tercatat: number;
  waktu_tidak_tercatat: number;
  efficiency: number;
  quality: number;
  target: number;
  machine_efficiency: number;
  top_3_downtime: DowntimeItem[];
}

interface MachineData {
  machine_id: number;
  machine_name: string;
  machine_code?: string;
  target_efficiency: number;
  date: string;
  shifts: ShiftData[];
  total_planned: number;
  total_runtime: number;
  total_downtime: number;
  total_idle: number;
  total_output: number;
  total_grade_a: number;
  total_grade_b: number;
  total_grade_c: number;
  total_target: number;
  products: string[];
  idle_breakdown: DowntimeItem[];
  top_3_downtime: DowntimeItem[];
  shift_summaries: ShiftSummary[];
  efficiency: number;
  machine_efficiency: number;
  quality: number;
  mrt: number;
  total_time: number;
  machine_speed: number;
  average_time: number;
  runtime: number;
  waktu_tercatat: number;
  waktu_tidak_tercatat: number;
}

const DailyController: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [machines, setMachines] = useState<MachineData[]>([]);
  const [expandedMachine, setExpandedMachine] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'detail'>('ringkasan');

  useEffect(() => {
    fetchDailyData();
  }, [selectedDate]);

  const fetchDailyData = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/oee/daily-controller?date=${selectedDate}`);
      setMachines(response.data.machines || []);
    } catch (error) {
      console.error('Error fetching daily controller data:', error);
      setMachines([]);
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getShiftLabel = (shift: number) => {
    switch (shift) {
      case 1: return '06:30-15:00';
      case 2: return '15:00-23:00';
      case 3: return '23:00-06:30';
      default: return '';
    }
  };

  // Get custom time label based on planned_runtime for multi-product shifts
  const getCustomTimeLabel = (shift: ShiftData, index: number, shiftsInSameShift: ShiftData[]) => {
    // Only show custom time if there are multiple entries in the same shift number
    if (shiftsInSameShift.length <= 1) {
      return getShiftLabel(shift.shift);
    }

    // Calculate cumulative time for this entry
    const shiftStartTimes: { [key: number]: number } = { 1: 390, 2: 900, 3: 1380 }; // in minutes from midnight (06:30=390, 15:00=900, 23:00=1380)
    let startMinutes = shiftStartTimes[shift.shift] || 390;

    // Add up planned_runtime from previous entries in the same shift
    for (let i = 0; i < index; i++) {
      startMinutes += shiftsInSameShift[i].planned_runtime || 0;
    }

    const endMinutes = startMinutes + (shift.planned_runtime || 0);

    // Format time
    const formatTime = (mins: number) => {
      const hours = Math.floor((mins % 1440) / 60);
      const minutes = mins % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    return `${formatTime(startMinutes)}-${formatTime(endMinutes)}`;
  };

  // Get shift entry label (e.g., "Shift 1a", "Shift 1b" for multi-product)
  // Uses sub_shift from database if available, otherwise fallback to index-based
  const getShiftEntryLabel = (shift: ShiftData, index: number, shiftsInSameShift: ShiftData[]) => {
    if (shiftsInSameShift.length <= 1 && !shift.sub_shift) {
      return `Shift ${shift.shift}`;
    }
    // PRIORITY 1: Use sub_shift from database if available
    if (shift.sub_shift) {
      return `Shift ${shift.shift}${shift.sub_shift.toUpperCase()}`;
    }
    // PRIORITY 2: Fallback to index-based letters for legacy data
    // Sort by shift_production_id to ensure consistent ordering
    const sortedShifts = [...shiftsInSameShift].sort((a, b) => 
      (a.shift_production_id || 0) - (b.shift_production_id || 0)
    );
    const sortedIndex = sortedShifts.findIndex((s) => 
      s.shift_production_id === shift.shift_production_id
    );
    const letter = String.fromCharCode(97 + (sortedIndex >= 0 ? sortedIndex : index)); // 97 = 'a'
    return `Shift ${shift.shift}${letter}`;
  };

  const toggleExpand = (machineId: number) => {
    setExpandedMachine(expandedMachine === machineId ? null : machineId);
  };

  // Calculate totals
  const totalMachines = machines.length;
  const totalOutput = machines.reduce((sum, m) => sum + m.total_output, 0);
  const totalRuntime = machines.reduce((sum, m) => sum + m.total_runtime, 0);
  const totalDowntime = machines.reduce((sum, m) => sum + m.total_downtime, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ChartBarIcon className="h-7 w-7 text-blue-600" />
          Daily Controller
        </h1>
        <p className="text-slate-500 mt-1">Monitoring produksi semua mesin per hari</p>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 text-slate-600" />
          </button>

          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-lg font-semibold text-slate-800 border-none focus:ring-0 cursor-pointer"
            />
            <span className="text-slate-500">|</span>
            <span className="text-slate-600">{formatDate(selectedDate)}</span>
          </div>

          <button
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRightIcon className="h-5 w-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ringkasan')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'ringkasan'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
          >
            <Squares2X2Icon className="h-5 w-5" />
            Ringkasan
          </button>
          <button
            onClick={() => setActiveTab('detail')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'detail'
              ? 'bg-indigo-500 text-white shadow-md'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
          >
            <DocumentMagnifyingGlassIcon className="h-5 w-5" />
            Detail Lengkap
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'detail' ? (
        <DailyControllerDetail selectedDate={selectedDate} summaryData={machines} />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <CogIcon className="h-5 w-5 opacity-80" />
                <span className="text-sm opacity-80">Mesin Aktif</span>
              </div>
              <p className="text-3xl font-bold">{totalMachines}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <CubeIcon className="h-5 w-5 opacity-80" />
                <span className="text-sm opacity-80">Total Output</span>
              </div>
              <p className="text-3xl font-bold">{totalOutput.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <ClockIcon className="h-5 w-5 opacity-80" />
                <span className="text-sm opacity-80">Total Runtime</span>
              </div>
              <p className="text-3xl font-bold">{totalRuntime} <span className="text-lg">menit</span></p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <ExclamationTriangleIcon className="h-5 w-5 opacity-80" />
                <span className="text-sm opacity-80">Total Downtime</span>
              </div>
              <p className="text-3xl font-bold">{totalDowntime} <span className="text-lg">menit</span></p>
            </div>
          </div>

          {/* Machines List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : machines.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <CogIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600">Tidak ada data produksi</h3>
              <p className="text-slate-400 mt-1">Belum ada hasil produksi yang diinput untuk tanggal ini</p>
            </div>
          ) : (
            <div className="space-y-4">
              {machines.map((machine) => (
                <div
                  key={machine.machine_id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                >
                  {/* Machine Header - Always visible */}
                  <div
                    className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleExpand(machine.machine_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                          <CogIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-800 text-lg">{machine.machine_name}</h3>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              📅 {new Date(machine.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500">
                            {machine.products.length > 0 ? machine.products.join(', ') : 'No product'}
                          </p>
                        </div>
                      </div>

                      {/* Quick Stats - Per Shift Efficiency */}
                      <div className="flex items-center gap-3">
                        {/* Per-Shift Efficiency Badges */}
                        <div className="flex items-center gap-2">
                          {(machine.shift_summaries || []).map((ss) => {
                            return (
                              <div key={ss.shift} className="text-center px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 min-w-[90px]">
                                <p className="text-[10px] text-slate-400 font-medium">Shift {ss.shift}</p>
                                <p className={`text-base font-bold ${ss.efficiency >= 60 ? 'text-green-600' : ss.efficiency >= 42 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {ss.efficiency}%
                                  {ss.efficiency >= 60 && <span className="ml-0.5 text-[10px]">✓</span>}
                                  {ss.efficiency < 42 && <span className="ml-0.5 text-[10px]">⚠</span>}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                        <div className="h-8 w-px bg-slate-200"></div>
                        <div className="text-center px-2">
                          <p className="text-xs text-slate-400">Quality</p>
                          <p className={`text-lg font-bold ${machine.quality >= 95 ? 'text-green-600' : machine.quality >= 85 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {machine.quality}%
                          </p>
                        </div>
                        <div className="h-8 w-px bg-slate-200"></div>
                        <div className="text-center px-2">
                          <p className="text-xs text-slate-400">Output</p>
                          <p className="text-lg font-bold text-slate-800">{machine.total_output.toLocaleString()}</p>
                        </div>
                        <div className="text-center px-2">
                          <p className="text-xs text-slate-400">Runtime</p>
                          <p className="text-lg font-bold text-green-600">{machine.runtime}m</p>
                        </div>
                        <div className="text-center px-2">
                          <p className="text-xs text-slate-400">Down</p>
                          <p className="text-lg font-bold text-red-600">{machine.total_downtime}m</p>
                        </div>
                        <div className="text-center px-2">
                          <p className="text-xs text-slate-400">Idle</p>
                          <p className="text-lg font-bold text-orange-600">{machine.total_idle}m</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/app/production/machines/${machine.machine_id}`);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Detail"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedMachine === machine.machine_id && (
                    <div className="border-t border-slate-200 p-4 bg-slate-50">
                      <div className="grid grid-cols-2 gap-6">
                        {/* Shift Details */}
                        <div>
                          <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <ClockIcon className="h-4 w-4" />
                            Detail per Shift
                          </h4>
                          <div className="space-y-2">
                            {(() => {
                              // Group shifts by shift number for proper rendering
                              const shiftGroups: { [key: number]: ShiftData[] } = {};
                              machine.shifts.forEach(s => {
                                if (!shiftGroups[s.shift]) shiftGroups[s.shift] = [];
                                shiftGroups[s.shift].push(s);
                              });

                              return Object.entries(shiftGroups).map(([shiftNum, shiftsInGroup]) => {
                                const earlyStopEntry = shiftsInGroup.find(s => s.early_stop);
                                const isMultiProduct = shiftsInGroup.length > 1;

                                return (
                                  <React.Fragment key={`shift-group-${shiftNum}`}>
                                    {shiftsInGroup.map((shift, idx) => (
                                      <div key={`${shiftNum}-${idx}`} className="bg-white rounded-lg p-3 border border-slate-200">
                                        <div className="flex items-center justify-between mb-2">
                                          <div>
                                            <span className="font-medium text-slate-800">
                                              {getShiftEntryLabel(shift, idx, shiftsInGroup)}
                                            </span>
                                            <span className="text-xs text-slate-400 ml-2">
                                              ({getCustomTimeLabel(shift, idx, shiftsInGroup)})
                                            </span>
                                            {isMultiProduct && shift.planned_runtime && (
                                              <span className="text-xs text-blue-500 ml-1">
                                                [{shift.planned_runtime}m]
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {shift.efficiency !== undefined && (
                                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${shift.efficiency >= 60 ? 'bg-green-100 text-green-700' :
                                                shift.efficiency >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                  'bg-red-100 text-red-700'
                                                }`}>
                                                {shift.efficiency}%
                                              </span>
                                            )}
                                            <span className="text-sm text-blue-600 font-medium">{shift.total.toLocaleString()} pcs</span>
                                          </div>
                                        </div>
                                        {/* Show product name for multi-product shifts */}
                                        {isMultiProduct && shift.product_name && (
                                          <p className="text-xs text-indigo-600 font-medium mb-2 bg-indigo-50 px-2 py-1 rounded inline-block">
                                            📦 {shift.product_name}
                                          </p>
                                        )}
                                        <div className="grid grid-cols-6 gap-2 text-xs">
                                          <div className="bg-green-50 rounded p-1.5 text-center">
                                            <p className="text-slate-400">Grade A</p>
                                            <p className="font-bold text-green-600">{shift.grade_a.toLocaleString()}</p>
                                            {shift.grade_a_carton > 0 && (
                                              <p className="text-xs text-green-500">{shift.grade_a_carton} ctn</p>
                                            )}
                                          </div>
                                          <div className="bg-yellow-50 rounded p-1.5 text-center">
                                            <p className="text-slate-400">Grade B</p>
                                            <p className="font-bold text-yellow-600">{shift.grade_b.toLocaleString()}</p>
                                          </div>
                                          <div className="bg-red-50 rounded p-1.5 text-center">
                                            <p className="text-slate-400">Grade C</p>
                                            <p className="font-bold text-red-600">{shift.grade_c.toLocaleString()}</p>
                                          </div>
                                          <div className="bg-purple-50 rounded p-1.5 text-center">
                                            <p className="text-slate-400">Set Sticker</p>
                                            <p className="font-bold text-purple-600">{Math.round(shift.setting_sticker || 0).toLocaleString()}</p>
                                          </div>
                                          <div className="bg-indigo-50 rounded p-1.5 text-center">
                                            <p className="text-slate-400">Set Packaging</p>
                                            <p className="font-bold text-indigo-600">{Math.round(shift.setting_packaging || 0).toLocaleString()}</p>
                                          </div>
                                          <div className="bg-emerald-50 rounded p-1.5 text-center">
                                            <p className="text-slate-400">Runtime</p>
                                            <p className="font-bold text-emerald-600">{shift.runtime !== undefined ? shift.runtime : (shift.machine_speed && shift.machine_speed > 0 ? Math.round(shift.grade_a / shift.machine_speed) : (machine.machine_speed > 0 ? Math.round(shift.grade_a / machine.machine_speed) : 0))}m</p>
                                          </div>
                                          <div className="bg-red-50 rounded p-1.5 text-center">
                                            <p className="text-slate-400">Down</p>
                                            <p className="font-bold text-red-600">{shift.downtime_minutes}m</p>
                                          </div>
                                          <div className="bg-orange-50 rounded p-1.5 text-center">
                                            <p className="text-slate-400">Idle</p>
                                            <p className="font-bold text-orange-600">{shift.idle_time_minutes}m</p>
                                          </div>
                                          {/* Top 3 Downtime per Shift - inline in grid */}
                                          {(() => {
                                            const ss = (machine.shift_summaries || []).find((s: ShiftSummary) => s.shift === Number(shiftNum));
                                            if (!ss || !ss.top_3_downtime || ss.top_3_downtime.length === 0) return null;
                                            return (
                                              <div className="col-span-4 bg-red-50 rounded p-1.5">
                                                <p className="text-slate-400 text-center mb-1 flex items-center justify-center gap-1">
                                                  <ExclamationTriangleIcon className="h-3 w-3" /> Top Downtime
                                                </p>
                                                <div className="space-y-0.5">
                                                  {ss.top_3_downtime.map((dt: DowntimeItem, dtIdx: number) => (
                                                    <div key={dtIdx} className="flex items-center justify-between">
                                                      <div className="flex items-center gap-1">
                                                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${dtIdx === 0 ? 'bg-red-500' : dtIdx === 1 ? 'bg-orange-500' : 'bg-yellow-500'}`}>
                                                          {dtIdx + 1}
                                                        </span>
                                                        <span className="text-slate-600 text-[10px] truncate">{dt.reason}</span>
                                                      </div>
                                                      <span className="text-red-600 font-bold text-[10px] whitespace-nowrap">{dt.duration_minutes}m</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            );
                                          })()}
                                        </div>
                                        {shift.wo_number && (
                                          <p className="text-xs text-slate-400 mt-2">WO: {shift.wo_number}</p>
                                        )}
                                        {/* Early Stop - only for single-product shifts (shown inside card) */}
                                        {!isMultiProduct && shift.early_stop && (
                                          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="flex items-center gap-2 text-amber-700">
                                              <span className="text-sm font-medium">⚠️ Shift Berakhir Lebih Awal</span>
                                              {shift.early_stop_time && (
                                                <span className="text-xs bg-amber-100 px-2 py-0.5 rounded">
                                                  Jam {shift.early_stop_time}
                                                </span>
                                              )}
                                            </div>
                                            {shift.early_stop_reason && (
                                              <p className="text-xs text-amber-600 mt-1">
                                                Alasan: <span className="font-medium">{shift.early_stop_reason}</span>
                                              </p>
                                            )}
                                            {shift.early_stop_notes && (
                                              <p className="text-xs text-amber-600 mt-0.5">
                                                Catatan: {shift.early_stop_notes}
                                              </p>
                                            )}
                                            {shift.operator_reassigned && shift.reassignment_task && (
                                              <p className="text-xs text-blue-600 mt-1">
                                                👷 Operator dialihkan ke: <span className="font-medium">{shift.reassignment_task}</span>
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    {/* Early Stop Banner - AFTER all sub-shifts for multi-product */}
                                    {isMultiProduct && earlyStopEntry && (
                                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <div className="flex items-center gap-2 text-amber-700">
                                          <span className="text-sm font-medium">⚠️ Shift {shiftNum} Berakhir Lebih Awal</span>
                                          {earlyStopEntry.early_stop_time && (
                                            <span className="text-xs bg-amber-100 px-2 py-0.5 rounded">
                                              Jam {earlyStopEntry.early_stop_time}
                                            </span>
                                          )}
                                        </div>
                                        {earlyStopEntry.early_stop_reason && (
                                          <p className="text-xs text-amber-600 mt-1">
                                            Alasan: <span className="font-medium">{earlyStopEntry.early_stop_reason}</span>
                                          </p>
                                        )}
                                        {earlyStopEntry.early_stop_notes && (
                                          <p className="text-xs text-amber-600 mt-0.5">
                                            Catatan: {earlyStopEntry.early_stop_notes}
                                          </p>
                                        )}
                                        {earlyStopEntry.operator_reassigned && earlyStopEntry.reassignment_task && (
                                          <p className="text-xs text-blue-600 mt-1">
                                            👷 Operator dialihkan ke: <span className="font-medium">{earlyStopEntry.reassignment_task}</span>
                                          </p>
                                        )}
                                      </div>
                                    )}

                                  </React.Fragment>
                                );
                              });
                            })()}
                          </div>

                          {/* Time Distribution Pie Chart */}
                          <div className="mt-4">
                            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                              <ChartBarIcon className="h-4 w-4" />
                              Distribusi Waktu
                            </h4>
                            <div className="bg-white rounded-lg p-4 border border-slate-200">
                              <div className="flex items-center gap-4">
                                {/* Donut Chart */}
                                <div className="relative w-32 h-32">
                                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                    {(() => {
                                      const total = (machine.runtime || 0) + (machine.total_downtime || 0) + (machine.total_idle || 0);
                                      if (total === 0) return <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e5e7eb" strokeWidth="3" />;

                                      const runtime = (machine.runtime || 0) / total * 100;
                                      const downtime = (machine.total_downtime || 0) / total * 100;
                                      const idle = (machine.total_idle || 0) / total * 100;

                                      return (
                                        <>
                                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3"
                                            strokeDasharray={`${runtime} ${100 - runtime}`} strokeDashoffset="0" />
                                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="3"
                                            strokeDasharray={`${downtime} ${100 - downtime}`} strokeDashoffset={`${-runtime}`} />
                                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f97316" strokeWidth="3"
                                            strokeDasharray={`${idle} ${100 - idle}`} strokeDashoffset={`${-(runtime + downtime)}`} />
                                        </>
                                      );
                                    })()}
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                      <p className="text-lg font-bold text-slate-700">
                                        {(machine.runtime || 0) + (machine.total_downtime || 0) + (machine.total_idle || 0)}
                                      </p>
                                      <p className="text-xs text-slate-400">menit</p>
                                    </div>
                                  </div>
                                </div>
                                {/* Legend */}
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                      <span className="text-sm text-slate-600">Runtime</span>
                                    </div>
                                    <span className="font-semibold text-emerald-600">{machine.runtime || 0}m</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                      <span className="text-sm text-slate-600">Downtime</span>
                                    </div>
                                    <span className="font-semibold text-red-600">{machine.total_downtime || 0}m</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                      <span className="text-sm text-slate-600">Idle</span>
                                    </div>
                                    <span className="font-semibold text-orange-600">{machine.total_idle || 0}m</span>
                                  </div>
                                  {/* Idle breakdown details */}
                                  {machine.idle_breakdown && machine.idle_breakdown.length > 0 && (
                                    <div className="mt-1 ml-5 space-y-1">
                                      {machine.idle_breakdown.sort((a, b) => b.duration_minutes - a.duration_minutes).map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs">
                                          <span className="text-orange-500 truncate mr-2">• {item.reason}</span>
                                          <span className="text-orange-600 font-medium whitespace-nowrap">{item.duration_minutes}m</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Quality Breakdown */}
                          <div className="mt-4">
                            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                              <CubeIcon className="h-4 w-4" />
                              Quality Breakdown
                            </h4>
                            <div className="bg-white rounded-lg p-4 border border-slate-200">
                              {(() => {
                                const totalOutput = machine.total_output || 0;
                                const gradeA = machine.total_grade_a || 0;
                                const gradeB = machine.total_grade_b || 0;
                                const gradeC = machine.total_grade_c || 0;
                                const pctA = totalOutput > 0 ? (gradeA / totalOutput * 100).toFixed(1) : 0;
                                const pctB = totalOutput > 0 ? (gradeB / totalOutput * 100).toFixed(1) : 0;
                                const pctC = totalOutput > 0 ? (gradeC / totalOutput * 100).toFixed(1) : 0;

                                return (
                                  <div className="space-y-3">
                                    <div>
                                      <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-600">Grade A</span>
                                        <span className="font-semibold text-green-600">{pctA}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${pctA}%` }}></div>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-600">Grade B</span>
                                        <span className="font-semibold text-yellow-600">{pctB}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div className="bg-yellow-500 h-3 rounded-full transition-all" style={{ width: `${pctB}%` }}></div>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-600">Grade C</span>
                                        <span className="font-semibold text-red-600">{pctC}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div className="bg-red-500 h-3 rounded-full transition-all" style={{ width: `${pctC}%` }}></div>
                                      </div>
                                    </div>
                                    <div className="pt-2 border-t text-xs text-slate-500 text-center">
                                      Total: {totalOutput.toLocaleString()} pcs
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Daily Summary & Top Downtime */}
                        <div className="space-y-4">
                          {/* Per-Shift Efficiency Calculation */}
                          <div>
                            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                              <ChartBarIcon className="h-4 w-4" />
                              Efisiensi per Shift
                            </h4>
                            <div className="space-y-3">
                              {(machine.shift_summaries || []).map((ss) => {
                                return (
                                  <div key={ss.shift} className="bg-white rounded-lg p-4 border border-slate-200">
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="font-bold text-slate-700 text-base">Shift {ss.shift} <span className="text-xs font-normal text-slate-400">({ss.shift === 1 ? '06:30-15:00' : ss.shift === 2 ? '15:00-23:00' : '23:00-06:30'})</span></span>
                                      <div className="flex items-center gap-3">
                                        <span className={`px-2 py-1 rounded text-sm font-bold ${ss.efficiency >= 60 ? 'bg-green-100 text-green-700' : ss.efficiency >= 42 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                          Efisiensi: {ss.efficiency}%
                                        </span>
                                      </div>
                                    </div>
                                    {ss.products.length > 0 && (
                                      <p className="text-xs text-indigo-600 mb-2">📦 {ss.products.join(', ')}</p>
                                    )}
                                    <div className="space-y-1.5 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Speed Mesin:</span>
                                        <span className="font-medium">{ss.machine_speed?.toLocaleString() || 0} pcs/menit</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Grade A:</span>
                                        <span className="font-medium text-green-600">{ss.grade_a?.toLocaleString() || 0} pcs</span>
                                      </div>
                                      <div className="flex justify-between border-t pt-1.5">
                                        <span className="text-slate-500">Available Time:</span>
                                        <span className="font-bold text-slate-700">{ss.average_time} menit</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Runtime (A ÷ Speed):</span>
                                        <span className="font-bold text-blue-600">{ss.runtime} menit</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Downtime:</span>
                                        <span className="font-medium text-red-600">{ss.downtime} menit</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Idle:</span>
                                        <span className="font-medium text-orange-600">{ss.idle} menit</span>
                                      </div>
                                      <div className="flex justify-between border-t pt-1.5">
                                        <span className="text-slate-500">Waktu Tercatat:</span>
                                        <span className="font-bold text-green-600">{ss.waktu_tercatat} menit</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Waktu Tidak Tercatat:</span>
                                        <span className="font-bold text-red-600">{ss.waktu_tidak_tercatat} menit</span>
                                      </div>
                                      <div className={`flex justify-between p-2 rounded mt-1 ${ss.efficiency >= 60 ? 'bg-green-50' : ss.efficiency >= 42 ? 'bg-yellow-50' : 'bg-red-50'}`}>
                                        <span className="font-semibold text-slate-700">Efisiensi Mesin:</span>
                                        <span className={`text-lg font-bold ${ss.efficiency >= 60 ? 'text-green-600' : ss.efficiency >= 42 ? 'text-yellow-600' : 'text-red-600'}`}>
                                          {ss.efficiency}% <span className="text-xs font-normal">({ss.runtime}/{ss.average_time})</span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Daily Summary */}
                          <div>
                            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                              <CubeIcon className="h-4 w-4" />
                              Ringkasan Output
                            </h4>
                            <div className="bg-white rounded-lg p-4 border border-slate-200">
                              <div className="grid grid-cols-4 gap-3">
                                <div className="text-center">
                                  <p className="text-xs text-slate-400">Grade A</p>
                                  <p className="text-xl font-bold text-green-600">{machine.total_grade_a?.toLocaleString() || 0}</p>
                                  {machine.shifts[0]?.pack_per_carton > 0 && (
                                    <p className="text-xs text-green-500">
                                      {Math.floor(machine.total_grade_a / machine.shifts[0].pack_per_carton)} ctn
                                    </p>
                                  )}
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-slate-400">Grade B</p>
                                  <p className="text-xl font-bold text-yellow-600">{machine.total_grade_b?.toLocaleString() || 0}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-slate-400">Grade C</p>
                                  <p className="text-xl font-bold text-red-600">{machine.total_grade_c?.toLocaleString() || 0}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-slate-400">Total</p>
                                  <p className="text-xl font-bold text-blue-600">{machine.total_output?.toLocaleString() || 0}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Top 3 Downtime */}
                          <div>
                            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                              <ExclamationTriangleIcon className="h-4 w-4" />
                              Top 3 Downtime
                            </h4>
                            <div className="bg-white rounded-lg p-4 border border-slate-200">
                              {machine.top_3_downtime.length > 0 ? (
                                <div className="space-y-2">
                                  {machine.top_3_downtime.map((dt, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-orange-500' : 'bg-yellow-500'
                                          }`}>
                                          {idx + 1}
                                        </span>
                                        <span className="text-sm text-slate-700">{dt.reason}</span>
                                      </div>
                                      <span className="text-sm font-medium text-red-600">
                                        {dt.duration_minutes} menit {dt.frequency && dt.frequency > 1 ? `(${dt.frequency}x)` : ''}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-400 text-center">Tidak ada downtime</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DailyController;
