import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SignalIcon, ExclamationTriangleIcon, CheckCircleIcon,
  ClockIcon, PlayIcon, StopIcon,
  PencilSquareIcon, XMarkIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const STOP_CATEGORIES = [
  { value: 'mesin', label: 'Mesin Rusak' },
  { value: 'operator', label: 'Operator' },
  { value: 'material', label: 'Material Habis' },
  { value: 'design', label: 'Design/Setting' },
  { value: 'others', label: 'Lainnya' },
  { value: 'istirahat', label: 'Istirahat' },
];

const SHIFTS = [
  { value: 'shift_1', label: 'Shift 1 (07:00 - 15:00)' },
  { value: 'shift_2', label: 'Shift 2 (15:00 - 23:00)' },
  { value: 'shift_3', label: 'Shift 3 (23:00 - 07:00)' },
];

interface MachineRow {
  machine_id: number;
  machine_code: string;
  machine_name: string;
  machine_type: string;
  shift_productions: any[];
  wo_number: string;
  product_name: string;
  product_id: number | null;
  work_order_id: number | null;
  slots: Array<{ slot: number; label: string; desc: string; checked: boolean; data: any }>;
  checks_completed: number;
  total_slots: number;
  total_stop_minutes: number;
}

interface DashboardData {
  date: string;
  shift: string;
  shift_label: string;
  machine_expected_start: string;
  break_start: string;
  break_end: string;
  slots: Array<{ slot: number; label: string; desc: string }>;
  machines: MachineRow[];
  summary: {
    total_machines: number;
    total_checks: number;
    total_possible: number;
    completion_pct: number;
    running_count: number;
    stopped_count: number;
    delayed_count: number;
    total_stop_minutes: number;
  };
}

// ==================== MAIN COMPONENT ====================
const LiveMonitoringDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [checkDate, setCheckDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState('shift_1');
  const [editingSlot, setEditingSlot] = useState<{ machineId: number; slot: number; machine: MachineRow } | null>(null);
  const [showMismatch, setShowMismatch] = useState(false);
  const [mismatchData, setMismatchData] = useState<any>(null);
  const [mismatchCount, setMismatchCount] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ date: checkDate, shift });
      const res = await axiosInstance.get(`/api/live-monitoring/dashboard?${params}`);
      if (res.data.success) setData(res.data.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [checkDate, shift]);

  const fetchMismatchCount = useCallback(async () => {
    try {
      const params = new URLSearchParams({ date: checkDate, shift });
      const res = await axiosInstance.get(`/api/live-monitoring/mismatch-count?${params}`);
      if (res.data.success) setMismatchCount(res.data.count);
    } catch (e) { console.error(e); }
  }, [checkDate, shift]);

  const fetchMismatches = async () => {
    try {
      const params = new URLSearchParams({ date: checkDate, shift });
      const res = await axiosInstance.get(`/api/live-monitoring/mismatches?${params}`);
      if (res.data.success) { setMismatchData(res.data.data); setShowMismatch(true); }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); fetchMismatchCount(); }, [fetchData, fetchMismatchCount]);

  const handleSaveCheck = async (formData: any) => {
    try {
      setSaving(true);
      await axiosInstance.post('/api/live-monitoring/check', formData);
      setEditingSlot(null);
      fetchData();
      fetchMismatchCount();
    } catch (e) { console.error(e); alert('Gagal menyimpan'); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><LoadingSpinner /></div>;
  if (!data) return <div className="p-6 text-center text-gray-500">Tidak ada data</div>;

  const { summary } = data;
  const noMachines = data.machines.length === 0;

  return (
    <div className="p-4 md:p-6 space-y-5 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <SignalIcon className="h-7 w-7" /> Live Production Monitoring
            </h1>
            <p className="text-emerald-100 text-sm mt-1">
              Patrol Mesin Setiap 2 Jam &bull; {data.shift_label}
            </p>
            <p className="text-emerald-200 text-xs mt-0.5">
              Mesin mulai jam <strong>{data.machine_expected_start}</strong> &bull; Istirahat {data.break_start}-{data.break_end}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" value={checkDate} onChange={e => setCheckDate(e.target.value)}
              className="px-3 py-1.5 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none" />
            <select value={shift} onChange={e => setShift(e.target.value)}
              className="px-3 py-1.5 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none">
              {SHIFTS.map(s => <option key={s.value} value={s.value} className="text-gray-900">{s.label}</option>)}
            </select>
            <button onClick={fetchMismatches}
              className="relative px-4 py-1.5 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white text-sm font-medium transition flex items-center gap-1.5">
              <ExclamationTriangleIcon className="h-4 w-4" />
              Mismatch
              {mismatchCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {mismatchCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl p-3 shadow border">
          <p className="text-[10px] text-gray-500 uppercase font-medium">Mesin Terjadwal</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total_machines}</p>
          <p className="text-[10px] text-gray-400">Dari shift production</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow border">
          <p className="text-[10px] text-gray-500 uppercase font-medium">Patrol Selesai</p>
          <p className="text-2xl font-bold text-blue-600">{summary.total_checks}/{summary.total_possible}</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${summary.completion_pct}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow border">
          <p className="text-[10px] text-green-600 uppercase font-medium">Running</p>
          <p className="text-2xl font-bold text-green-600">{summary.running_count}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow border">
          <p className="text-[10px] text-red-600 uppercase font-medium">Stopped</p>
          <p className="text-2xl font-bold text-red-600">{summary.stopped_count}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow border">
          <p className="text-[10px] text-yellow-600 uppercase font-medium">Start Telat</p>
          <p className="text-2xl font-bold text-yellow-600">{summary.delayed_count}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow border">
          <p className="text-[10px] text-red-500 uppercase font-medium">Total Stop</p>
          <p className="text-2xl font-bold text-red-500">{summary.total_stop_minutes}m</p>
          <p className="text-[10px] text-gray-400">{(summary.total_stop_minutes / 60).toFixed(1)} jam</p>
        </div>
      </div>

      {noMachines ? (
        <div className="bg-white rounded-xl shadow border p-12 text-center">
          <ClockIcon className="h-16 w-16 text-gray-300 mx-auto mb-3" />
          <p className="text-lg font-semibold text-gray-500">Tidak ada mesin terjadwal</p>
          <p className="text-sm text-gray-400 mt-1">Belum ada input produksi (ShiftProduction) untuk tanggal & shift ini.</p>
        </div>
      ) : (
        /* MACHINE GRID */
        <div className="bg-white rounded-xl shadow border overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Patrol Check per Mesin</h3>
              <p className="text-xs text-gray-500 mt-0.5">Hanya mesin yang ada di jadwal produksi. Klik slot untuk input.</p>
            </div>
            <div className="flex gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-300" /> Running</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300" /> Stopped</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-dashed border-gray-300" /> Belum dicek</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-600 font-medium">
                  <th className="px-3 py-2.5 text-left sticky left-0 bg-gray-100 z-10 min-w-[180px]">Mesin / WO</th>
                  {data.slots.map(s => (
                    <th key={s.slot} className="px-2 py-2.5 text-center min-w-[150px]">
                      <div className="font-bold">{s.label}</div>
                      <div className="text-[10px] text-gray-400 font-normal">{s.desc}</div>
                    </th>
                  ))}
                  <th className="px-2 py-2.5 text-center min-w-[80px]">Total Stop</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.machines.map((m) => (
                  <tr key={m.machine_id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 sticky left-0 bg-white z-10 border-r">
                      <div className="font-semibold text-gray-900">{m.machine_name}</div>
                      <div className="text-[10px] text-gray-400">{m.machine_code}</div>
                      <div className="text-[10px] text-blue-600 mt-0.5 truncate max-w-[170px]">
                        {m.shift_productions.length > 1
                          ? `${m.wo_number} - ${m.shift_productions.map((sp: any) => sp.product_name).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i).join(', ')}`
                          : `${m.wo_number} - ${m.product_name}`
                        }
                      </div>
                    </td>
                    {m.slots.map((slot) => {
                      const d = slot.data;
                      const isRunning = d?.machine_status === 'running';
                      const isStopped = d?.machine_status === 'stopped';
                      return (
                        <td key={slot.slot} className="px-1 py-1 text-center">
                          <button
                            onClick={() => setEditingSlot({ machineId: m.machine_id, slot: slot.slot, machine: m })}
                            className={`w-full rounded-lg border px-2 py-2.5 transition hover:shadow-md min-h-[60px] ${
                              slot.checked
                                ? isRunning
                                  ? 'bg-green-50 border-green-300 text-green-700'
                                  : 'bg-red-50 border-red-300 text-red-700'
                                : 'bg-gray-50 border-dashed border-gray-300 text-gray-400 hover:border-blue-400'
                            }`}
                          >
                            {slot.checked && d ? (
                              <div>
                                <div className="flex items-center justify-center gap-1 mb-0.5">
                                  {isRunning ? <PlayIcon className="h-3.5 w-3.5" /> : <StopIcon className="h-3.5 w-3.5" />}
                                  <span className="font-bold text-[11px]">{isRunning ? 'Running' : 'Stopped'}</span>
                                </div>
                                {/* Slot 1: show start time */}
                                {slot.slot === 1 && d.actual_start_time && (
                                  <div className={`text-[9px] ${d.start_delayed ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                                    Start: {d.actual_start_time} {d.start_delayed ? '⚠ TELAT' : '✓'}
                                  </div>
                                )}
                                {/* Stopped: show time range + reason + duration */}
                                {isStopped && d.stop_from && d.stop_to && (
                                  <>
                                    <div className="text-[9px] mt-0.5 font-semibold">{d.stop_from} → {d.stop_to} ({d.stop_duration_minutes}m)</div>
                                    {d.stop_reason && <div className="text-[9px] mt-0.5 truncate max-w-[130px]">{d.stop_reason}</div>}
                                    {d.stop_category && <div className="text-[9px] mt-0.5 opacity-70">[{d.stop_category}]</div>}
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <PencilSquareIcon className="h-4 w-4" />
                                <span className="text-[9px] mt-0.5">Belum dicek</span>
                              </div>
                            )}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 text-center">
                      <div className={`text-sm font-bold ${m.total_stop_minutes > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {m.total_stop_minutes}m
                      </div>
                      <div className="text-[10px] text-gray-400">{m.checks_completed}/{m.total_slots} cek</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingSlot && data && (
        <CheckInputModal
          machineId={editingSlot.machineId}
          machine={editingSlot.machine}
          slot={editingSlot.slot}
          shift={shift}
          checkDate={checkDate}
          dashboardData={data}
          saving={saving}
          onSave={handleSaveCheck}
          onClose={() => setEditingSlot(null)}
        />
      )}

      {showMismatch && mismatchData && (
        <MismatchModal data={mismatchData} onClose={() => setShowMismatch(false)} />
      )}
    </div>
  );
};

// ==================== CHECK INPUT MODAL ====================
interface CheckInputModalProps {
  machineId: number;
  machine: MachineRow;
  slot: number;
  shift: string;
  checkDate: string;
  dashboardData: DashboardData;
  saving: boolean;
  onSave: (data: any) => void;
  onClose: () => void;
}

const CheckInputModal: React.FC<CheckInputModalProps> = ({ machineId, machine, slot, shift, checkDate, dashboardData, saving, onSave, onClose }) => {
  const slotInfo = dashboardData.slots.find(s => s.slot === slot);
  const existingData = machine.slots.find(s => s.slot === slot)?.data;
  const isSlot1 = slot === 1;

  const [status, setStatus] = useState(existingData?.machine_status || 'running');
  const [stopFrom, setStopFrom] = useState(existingData?.stop_from || '');
  const [stopTo, setStopTo] = useState(existingData?.stop_to || '');
  const [stopReason, setStopReason] = useState(existingData?.stop_reason || '');
  const [stopCategory, setStopCategory] = useState(existingData?.stop_category || 'mesin');
  const [actualStartTime, setActualStartTime] = useState(existingData?.actual_start_time || dashboardData.machine_expected_start);
  const [notes, setNotes] = useState(existingData?.notes || '');

  const calcDuration = useMemo(() => {
    if (!stopFrom || !stopTo) return 0;
    const [h1, m1] = stopFrom.split(':').map(Number);
    const [h2, m2] = stopTo.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60;
    return diff;
  }, [stopFrom, stopTo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'stopped' && (!stopFrom || !stopTo)) {
      alert('Jika mesin berhenti, wajib isi dari jam berapa sampai jam berapa.');
      return;
    }
    if (status === 'stopped' && !stopReason.trim()) {
      alert('Jika mesin berhenti, wajib isi alasan kenapa berhenti.');
      return;
    }
    onSave({
      check_date: checkDate,
      shift,
      time_slot: slot,
      machine_id: machineId,
      machine_status: status,
      product_id: machine.product_id,
      work_order_id: machine.work_order_id,
      product_name: machine.product_name,
      wo_number: machine.wo_number,
      stop_from: status === 'stopped' ? stopFrom : '',
      stop_to: status === 'stopped' ? stopTo : '',
      stop_reason: status === 'stopped' ? stopReason : '',
      stop_category: status === 'stopped' ? stopCategory : '',
      actual_start_time: isSlot1 ? actualStartTime : '',
      notes,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b bg-gray-50 rounded-t-2xl flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">{machine.machine_name}</h3>
            <p className="text-xs text-gray-500">Cek jam {slotInfo?.label} &bull; {slotInfo?.desc}</p>
            <p className="text-xs text-blue-600 mt-0.5">{machine.wo_number} - {machine.product_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Slot 1: Machine start time */}
          {isSlot1 && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <label className="block text-xs font-semibold text-blue-800 mb-1">
                Jam Mesin Mulai Jalan <span className="font-normal text-blue-600">(seharusnya {dashboardData.machine_expected_start})</span>
              </label>
              <input type="time" value={actualStartTime} onChange={e => setActualStartTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              {actualStartTime > dashboardData.machine_expected_start && (
                <p className="text-xs text-red-600 font-semibold mt-1">⚠ Mesin terlambat mulai!</p>
              )}
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Status Mesin Saat Dicek</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setStatus('running')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition ${
                  status === 'running' ? 'bg-green-100 border-green-400 text-green-700 ring-2 ring-green-400' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}>
                <PlayIcon className="h-5 w-5" /> Running
              </button>
              <button type="button" onClick={() => setStatus('stopped')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition ${
                  status === 'stopped' ? 'bg-red-100 border-red-400 text-red-700 ring-2 ring-red-400' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}>
                <StopIcon className="h-5 w-5" /> Stopped
              </button>
            </div>
          </div>

          {/* Stopped fields */}
          {status === 'stopped' && (
            <>
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-red-800 mb-1">Berhenti dari jam</label>
                    <input type="time" value={stopFrom} onChange={e => setStopFrom(e.target.value)} required
                      className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-red-800 mb-1">Sampai jam</label>
                    <input type="time" value={stopTo} onChange={e => setStopTo(e.target.value)} required
                      className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500" />
                  </div>
                </div>
                {calcDuration > 0 && (
                  <div className="text-center py-1.5 bg-red-100 rounded-lg">
                    <span className="text-red-700 text-sm font-bold">Durasi: {calcDuration} menit</span>
                    <span className="text-red-500 text-xs ml-1">({(calcDuration / 60).toFixed(1)} jam)</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-red-800 mb-1">Kategori</label>
                  <select value={stopCategory} onChange={e => setStopCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500">
                    {STOP_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-red-800 mb-1">Alasan Berhenti *</label>
                  <input type="text" value={stopReason} onChange={e => setStopReason(e.target.value)} required
                    className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                    placeholder="Contoh: Roll habis, mesin overheat, ganti produk dll" />
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Catatan</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="Opsional..." />
          </div>

          {/* Info from shift production */}
          {machine.shift_productions.length > 0 && (
            <div className="p-3 rounded-lg bg-gray-50 border text-xs">
              <p className="font-semibold text-gray-700 mb-1">Ref. Input Produksi:</p>
              {machine.shift_productions.map((sp, i) => (
                <div key={i} className="flex justify-between text-gray-600">
                  <span>{sp.wo_number}</span>
                  <span>T:{sp.target_quantity} A:{sp.actual_quantity} DT:{sp.downtime_minutes}m</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm transition disabled:opacity-50">
              {saving ? 'Menyimpan...' : existingData ? 'Update' : 'Simpan Check'}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition">Batal</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== MISMATCH MODAL ====================
const MismatchModal: React.FC<{ data: any; onClose: () => void }> = ({ data, onClose }) => {
  const sevCfg: Record<string, { label: string; color: string; bg: string }> = {
    high: { label: 'HIGH', color: 'text-red-700', bg: 'bg-red-100 border-red-300' },
    medium: { label: 'MEDIUM', color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-300' },
    low: { label: 'LOW', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300' },
  };
  const typeLabels: Record<string, string> = {
    start_delayed: 'Start Telat',
    running_no_input: 'Running tapi Tidak Ada Input',
    downtime_mismatch: 'Selisih Downtime',
    no_live_check: 'Belum Dicek',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b bg-red-50 rounded-t-2xl flex items-center justify-between">
          <div>
            <h3 className="font-bold text-red-900 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5" /> Mismatch Report
            </h3>
            <p className="text-xs text-red-600 mt-0.5">{data.date} &bull; {data.shift} &bull; {data.total_mismatches} temuan</p>
          </div>
          <button onClick={onClose} className="text-red-400 hover:text-red-600"><XMarkIcon className="h-5 w-5" /></button>
        </div>
        <div className="p-4 border-b flex gap-3">
          {Object.entries(data.by_severity).map(([sev, count]) => {
            const c = sevCfg[sev];
            return (
              <div key={sev} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${c.bg}`}>
                <span className={`text-xs font-bold ${c.color}`}>{c.label}</span>
                <span className={`text-lg font-bold ${c.color}`}>{count as number}</span>
              </div>
            );
          })}
        </div>
        <div className="p-4 space-y-3">
          {data.total_mismatches === 0 ? (
            <div className="text-center py-8">
              <CheckCircleIcon className="h-12 w-12 text-green-400 mx-auto mb-2" />
              <p className="text-green-700 font-medium">Tidak ada mismatch!</p>
              <p className="text-gray-500 text-sm">Data live monitoring sesuai dengan input produksi.</p>
            </div>
          ) : (
            data.mismatches.map((m: any, i: number) => {
              const c = sevCfg[m.severity];
              return (
                <div key={i} className={`p-4 rounded-xl border-l-4 bg-white shadow-sm ${
                  m.severity === 'high' ? 'border-l-red-500' : m.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${c.bg} ${c.color} border`}>{c.label}</span>
                    <span className="text-[10px] text-gray-500 px-1.5 py-0.5 rounded bg-gray-100">{typeLabels[m.type] || m.type}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{m.machine_name}</p>
                  <p className="text-xs text-gray-600 mt-1">{m.description}</p>
                  {m.stops && (
                    <div className="mt-2 space-y-1">
                      {m.stops.map((s: any, si: number) => (
                        <div key={si} className="text-[10px] px-2 py-1 rounded bg-red-50 text-red-700">
                          {s.from} → {s.to} ({s.dur}m) — {s.reason}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveMonitoringDashboard;
