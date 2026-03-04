import React, { useState, useEffect, useMemo } from 'react';
import {
  ChartBarIcon, ExclamationTriangleIcon,
  ClockIcon, CubeIcon, CogIcon, ChevronDownIcon, ChevronUpIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../utils/axiosConfig';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const GRADE_COLORS = { a: '#22C55E', b: '#F59E0B', c: '#EF4444' };
const DOWNTIME_COLORS: Record<string, string> = {
  mesin: '#EF4444', operator: '#F59E0B', material: '#3B82F6', design: '#8B5CF6', others: '#6B7280'
};
const CATEGORY_LABELS: Record<string, string> = {
  mesin: 'Mesin', operator: 'Operator', material: 'Material', design: 'Design', others: 'Lainnya'
};
const MONTHS = [
  { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
  { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
];

const fmtNum = (n: number) => n.toLocaleString('id-ID');
const fmtMin = (m: number) => {
  if (m >= 60) return `${Math.floor(m / 60)}j ${m % 60}m`;
  return `${m}m`;
};

const ProductionMonitoringDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
  const [weekNumber, setWeekNumber] = useState(0);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'overview' | 'daily' | 'products' | 'machines' | 'downtime'>('overview');

  useEffect(() => { fetchData(); }, [year, month, viewMode, weekNumber]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ year: String(year), month: String(month), view: viewMode });
      if (viewMode === 'weekly' && weekNumber > 0) params.set('week', String(weekNumber));
      const res = await axiosInstance.get(`/api/executive/production-monitoring?${params}`);
      if (res.data.success) setData(res.data.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const toggleDay = (date: string) => {
    setExpandedDays(prev => { const n = new Set(prev); n.has(date) ? n.delete(date) : n.add(date); return n; });
  };

  const dailyChartData = useMemo(() => {
    if (!data) return [];
    return data.daily_table.map((d: any) => ({
      date: d.date.split('-')[2], grade_a: d.day_summary.grade_a, grade_b: d.day_summary.grade_b,
      grade_c: d.day_summary.grade_c, ctn: d.day_summary.total_ctn,
      runtime: +(d.day_summary.runtime / 60).toFixed(1), downtime: +(d.day_summary.downtime / 60).toFixed(1),
      idle: +(d.day_summary.idle_time / 60).toFixed(1)
    }));
  }, [data]);

  const timePieData = useMemo(() => {
    if (!data) return [];
    const s = data.summary;
    return [
      { name: 'Runtime', value: s.runtime_minutes, color: '#22C55E' },
      { name: 'Downtime', value: s.downtime_minutes, color: '#EF4444' },
      { name: 'Idle Time', value: s.idle_time_minutes, color: '#F59E0B' }
    ].filter((d: any) => d.value > 0);
  }, [data]);

  const downtimePieData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.downtime_by_category)
      .filter(([_, v]) => (v as number) > 0)
      .map(([k, v]) => ({ name: CATEGORY_LABELS[k] || k, value: v as number, color: DOWNTIME_COLORS[k] || '#6B7280' }));
  }, [data]);

  if (loading) return <div className="flex items-center justify-center h-96"><LoadingSpinner /></div>;
  if (!data) return <div className="p-6 text-center text-gray-500">Tidak ada data tersedia</div>;

  const { summary, period } = data;
  const isCritical = summary.achievement_pct < 50;
  const isOnTrack = summary.achievement_pct >= 80;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'daily', label: 'Detail Harian', icon: ClockIcon },
    { id: 'products', label: 'Per Produk', icon: CubeIcon },
    { id: 'machines', label: 'Per Mesin', icon: CogIcon },
    { id: 'downtime', label: 'Downtime', icon: ExclamationTriangleIcon },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ChartBarIcon className="h-7 w-7" /> Production Monitoring Dashboard
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              Target vs Aktual &bull; {period.month_name} {period.year}
              {viewMode === 'weekly' && weekNumber > 0 && ` - Week ${weekNumber}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-white/20 rounded-lg p-0.5">
              <button onClick={() => { setViewMode('monthly'); setWeekNumber(0); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'monthly' ? 'bg-white text-blue-700' : 'text-white hover:bg-white/10'}`}>Monthly</button>
              <button onClick={() => setViewMode('weekly')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'weekly' ? 'bg-white text-blue-700' : 'text-white hover:bg-white/10'}`}>Weekly</button>
            </div>
            {viewMode === 'weekly' && period.weeks && (
              <select value={weekNumber} onChange={e => setWeekNumber(+e.target.value)}
                className="px-3 py-1.5 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none">
                <option value={0} className="text-gray-900">Semua Week</option>
                {period.weeks.map((w: any) => <option key={w.week} value={w.week} className="text-gray-900">{w.label}</option>)}
              </select>
            )}
            <select value={month} onChange={e => setMonth(+e.target.value)}
              className="px-3 py-1.5 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none">
              {MONTHS.map(m => <option key={m.value} value={m.value} className="text-gray-900">{m.label}</option>)}
            </select>
            <select value={year} onChange={e => setYear(+e.target.value)}
              className="px-3 py-1.5 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y} className="text-gray-900">{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. TARGET */}
        <div className="bg-white rounded-xl p-4 shadow-lg border">
          <p className="text-xs text-gray-500 font-medium">Target Bulanan</p>
          <p className="text-xl font-bold text-blue-600">{fmtNum(summary.target_ctn)} ctn</p>
          <p className="text-xs text-gray-500 mt-1">
            Per hari: <span className="font-semibold text-blue-500">{fmtNum(summary.daily_target_ctn || 0)} ctn</span>
          </p>
          <p className="text-[10px] text-gray-400">({summary.total_working_days || 22} hari kerja/bulan)</p>
        </div>
        {/* 2. GAP + Achievement % */}
        <div className="bg-white rounded-xl p-4 shadow-lg border">
          <p className="text-xs text-gray-500 font-medium">Gap dari Target</p>
          <p className={`text-xl font-bold ${summary.gap_ctn > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {summary.gap_ctn > 0 ? '-' : '+'}{fmtNum(Math.abs(Math.round(summary.gap_ctn)))} ctn
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Tercapai: <span className={`font-semibold ${summary.achievement_pct >= 80 ? 'text-green-600' : summary.achievement_pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{summary.achievement_pct}%</span> dari target
          </p>
          <p className="text-[10px] text-gray-400">Aktual {fmtNum(Math.round(summary.actual_ctn))} ctn &bull; Hari {summary.working_days}/{summary.total_working_days || 22}</p>
        </div>
        {/* 3. ACHIEVEMENT + WARNING */}
        <div className={`rounded-xl p-4 shadow-lg text-white relative overflow-hidden ${isCritical ? 'bg-gradient-to-br from-red-500 to-red-600' : isOnTrack ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-yellow-500 to-yellow-600'}`}>
          <p className="text-xs opacity-80 font-medium">Achievement</p>
          <p className="text-2xl font-bold">{summary.achievement_pct}%</p>
          <p className="text-[10px] opacity-80">
            Seharusnya: {summary.expected_achievement_pct || 0}% (hari ke-{summary.working_days})
          </p>
          {summary.is_behind && (
            <div className="mt-1 bg-white/20 rounded px-1.5 py-0.5 inline-flex items-center gap-1">
              <ExclamationTriangleIcon className="h-3 w-3" />
              <span className="text-[10px] font-bold">BEHIND {summary.behind_pct}%</span>
            </div>
          )}
        </div>
        {/* 4. GRADE A/B/C */}
        <div className="bg-white rounded-xl p-4 shadow-lg border">
          <p className="text-xs text-gray-500 font-medium">Grade A / B / C</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold text-green-600">{fmtNum(summary.total_grade_a)}</span>
            <span className="text-gray-400">/</span>
            <span className="text-sm font-semibold text-yellow-500">{fmtNum(summary.total_grade_b)}</span>
            <span className="text-gray-400">/</span>
            <span className="text-sm font-semibold text-red-500">{fmtNum(summary.total_grade_c)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Quality: {summary.quality_rate}% &bull; Reject: <span className="text-red-500 font-semibold">{summary.total_pcs > 0 ? ((summary.total_grade_c / summary.total_pcs) * 100).toFixed(2) : 0}%</span></p>
        </div>
        {/* 5. WAKTU (RT / DT / IDLE gabungan) */}
        <div className="bg-white rounded-xl p-4 shadow-lg border">
          <p className="text-xs text-gray-500 font-medium">Waktu Produksi <span className="text-gray-400">(Planned: {summary.planned_runtime_minutes > 0 ? (summary.planned_runtime_minutes / 60).toFixed(1) : 0}j)</span></p>
          {/* Stacked bar */}
          <div className="flex rounded-full h-3 overflow-hidden mt-2 mb-2">
            {summary.planned_runtime_minutes > 0 ? (<>
              <div className="bg-green-500" style={{ width: `${(summary.runtime_minutes / summary.planned_runtime_minutes * 100)}%` }} />
              <div className="bg-red-500" style={{ width: `${(summary.downtime_minutes / summary.planned_runtime_minutes * 100)}%` }} />
              <div className="bg-yellow-400" style={{ width: `${(summary.idle_time_minutes / summary.planned_runtime_minutes * 100)}%` }} />
            </>) : <div className="bg-gray-300 w-full" />}
          </div>
          <div className="space-y-0.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-green-600 font-medium">Runtime</span>
              <span className="text-gray-700">{summary.runtime_hours}j <span className="text-green-600 font-semibold">({summary.planned_runtime_minutes > 0 ? (summary.runtime_minutes / summary.planned_runtime_minutes * 100).toFixed(1) : 0}%)</span></span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500 font-medium">Downtime</span>
              <span className="text-gray-700">{summary.downtime_hours}j <span className="text-red-500 font-semibold">({summary.planned_runtime_minutes > 0 ? (summary.downtime_minutes / summary.planned_runtime_minutes * 100).toFixed(1) : 0}%)</span></span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-500 font-medium">Idle</span>
              <span className="text-gray-700">{summary.idle_time_hours}j <span className="text-yellow-500 font-semibold">({summary.planned_runtime_minutes > 0 ? (summary.idle_time_minutes / summary.planned_runtime_minutes * 100).toFixed(1) : 0}%)</span></span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">WO: {data.work_orders.completed}/{data.work_orders.total} selesai</p>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow border overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${activeTab === t.id ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'overview' && <OverviewTab data={data} dailyChartData={dailyChartData} timePieData={timePieData} downtimePieData={downtimePieData} />}
      {activeTab === 'daily' && <DailyTab data={data} expandedDays={expandedDays} toggleDay={toggleDay} />}
      {activeTab === 'products' && <ProductsTab data={data} />}
      {activeTab === 'machines' && <MachinesTab data={data} />}
      {activeTab === 'downtime' && <DowntimeTab data={data} downtimePieData={downtimePieData} />}
    </div>
  );
};

// ==================== OVERVIEW TAB ====================
const OverviewTab: React.FC<{ data: any; dailyChartData: any[]; timePieData: any[]; downtimePieData: any[] }> = ({ data, dailyChartData, timePieData, downtimePieData }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Daily Production Trend */}
      <div className="bg-white rounded-xl p-5 shadow border">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Trend Produksi Harian (pcs)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => fmtNum(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="grade_a" name="Grade A" fill={GRADE_COLORS.a} stackId="prod" />
              <Bar dataKey="grade_b" name="Grade B" fill={GRADE_COLORS.b} stackId="prod" />
              <Bar dataKey="grade_c" name="Grade C" fill={GRADE_COLORS.c} stackId="prod" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Time Distribution */}
      <div className="bg-white rounded-xl p-5 shadow border">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Distribusi Waktu</h3>
        <div className="h-72 flex items-center">
          {timePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={timePieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value"
                  label={({ name, value }) => `${name}: ${fmtMin(value)}`}>
                  {timePieData.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmtMin(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="w-full text-center text-gray-400">No data</p>}
        </div>
        <div className="flex justify-center gap-5 mt-2">
          {[{ l: 'Runtime', c: '#22C55E' }, { l: 'Downtime', c: '#EF4444' }, { l: 'Idle', c: '#F59E0B' }].map(x => (
            <div key={x.l} className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: x.c }} /><span className="text-xs text-gray-600">{x.l}</span></div>
          ))}
        </div>
      </div>
    </div>

    {/* Runtime / Downtime / Idle per Day */}
    <div className="bg-white rounded-xl p-5 shadow border">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Runtime / Downtime / Idle Harian (jam)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dailyChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => `${v} jam`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="runtime" name="Runtime" stroke="#22C55E" fill="#BBF7D0" />
            <Area type="monotone" dataKey="downtime" name="Downtime" stroke="#EF4444" fill="#FECACA" />
            <Area type="monotone" dataKey="idle" name="Idle" stroke="#F59E0B" fill="#FEF08A" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Product Achievement Summary (top 10) */}
    <div className="bg-white rounded-xl p-5 shadow border">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Achievement per Produk</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="px-3 py-2 text-left">Produk</th>
              <th className="px-3 py-2 text-right">Target (ctn)</th>
              <th className="px-3 py-2 text-right">Aktual (ctn)</th>
              <th className="px-3 py-2 text-right">Gap</th>
              <th className="px-3 py-2 text-right">A / B / C</th>
              <th className="px-3 py-2 text-right">Achievement</th>
              <th className="px-3 py-2 text-left">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.products.slice(0, 10).map((p: any, i: number) => (
              <tr key={i} className={`hover:bg-gray-50 ${p.achievement_pct < 50 ? 'bg-red-50/50' : ''}`}>
                <td className="px-3 py-2 font-medium text-gray-900">{p.product_name}</td>
                <td className="px-3 py-2 text-right text-gray-600">{fmtNum(p.target_ctn)}</td>
                <td className="px-3 py-2 text-right text-gray-600">{fmtNum(Math.round(p.actual_ctn))}</td>
                <td className={`px-3 py-2 text-right font-medium ${p.gap_ctn > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {p.gap_ctn > 0 ? '-' : '+'}{fmtNum(Math.abs(Math.round(p.gap_ctn)))}
                </td>
                <td className="px-3 py-2 text-right">
                  <span className="text-green-600">{fmtNum(p.grade_a)}</span>
                  <span className="text-gray-400"> / </span>
                  <span className="text-yellow-500">{fmtNum(p.grade_b)}</span>
                  <span className="text-gray-400"> / </span>
                  <span className="text-red-500">{fmtNum(p.grade_c)}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.achievement_pct >= 80 ? 'bg-green-100 text-green-700' : p.achievement_pct >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {p.achievement_pct}%
                  </span>
                </td>
                <td className="px-3 py-2 w-32">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${p.achievement_pct >= 80 ? 'bg-green-500' : p.achievement_pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(p.achievement_pct, 100)}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ==================== DAILY TAB ====================
const DailyTab: React.FC<{ data: any; expandedDays: Set<string>; toggleDay: (d: string) => void }> = ({ data, expandedDays, toggleDay }) => {
  const dayNames: Record<string, string> = {
    Monday: 'Senin', Tuesday: 'Selasa', Wednesday: 'Rabu', Thursday: 'Kamis',
    Friday: 'Jumat', Saturday: 'Sabtu', Sunday: 'Minggu'
  };

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-900">Detail Harian - Produksi per Hari per Produk</h3>
          <p className="text-xs text-gray-500 mt-0.5">Klik tanggal untuk melihat detail shift, mesin, dan work order</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100 text-gray-600 font-medium">
                <th className="px-3 py-2.5 text-left sticky left-0 bg-gray-100 z-10">Tanggal</th>
                <th className="px-3 py-2.5 text-left">Produk</th>
                <th className="px-2 py-2.5 text-right text-green-700">Grade A</th>
                <th className="px-2 py-2.5 text-right text-yellow-700">Grade B</th>
                <th className="px-2 py-2.5 text-right text-red-700">Grade C</th>
                <th className="px-2 py-2.5 text-right">Total (pcs)</th>
                <th className="px-2 py-2.5 text-right">Karton</th>
                <th className="px-2 py-2.5 text-right">Kumulatif</th>
                <th className="px-2 py-2.5 text-right">Target</th>
                <th className="px-2 py-2.5 text-right">Sisa</th>
                <th className="px-2 py-2.5 text-right text-green-700">RT</th>
                <th className="px-2 py-2.5 text-right text-red-700">DT</th>
                <th className="px-2 py-2.5 text-right text-yellow-700">Idle</th>
              </tr>
            </thead>
            <tbody>
              {data.daily_table.map((day: any, dayIdx: number) => {
                const isExpanded = expandedDays.has(day.date);
                const dateLabel = day.date.split('-').reverse().join('/');
                const dayLabel = dayNames[day.day_name] || day.day_name;

                return (
                  <React.Fragment key={day.date}>
                    {/* Day summary row */}
                    <tr className="bg-blue-50/60 hover:bg-blue-100/60 cursor-pointer border-t border-blue-200" onClick={() => toggleDay(day.date)}>
                      <td className="px-3 py-2 sticky left-0 bg-blue-50/60 z-10">
                        <div className="flex items-center gap-1.5">
                          {isExpanded ? <ChevronUpIcon className="h-3.5 w-3.5 text-blue-500" /> : <ChevronDownIcon className="h-3.5 w-3.5 text-blue-500" />}
                          <span className="font-semibold text-blue-800">{dateLabel}</span>
                          <span className="text-blue-500 text-[10px]">({dayLabel})</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-medium text-blue-700">{day.products.length} produk</td>
                      <td className="px-2 py-2 text-right font-semibold text-green-700">{fmtNum(day.day_summary.grade_a)}</td>
                      <td className="px-2 py-2 text-right font-semibold text-yellow-600">{fmtNum(day.day_summary.grade_b)}</td>
                      <td className="px-2 py-2 text-right font-semibold text-red-600">{fmtNum(day.day_summary.grade_c)}</td>
                      <td className="px-2 py-2 text-right font-semibold">{fmtNum(day.day_summary.total_pcs)}</td>
                      <td className="px-2 py-2 text-right font-semibold">{fmtNum(Math.round(day.day_summary.total_ctn))}</td>
                      <td className="px-2 py-2 text-right">-</td>
                      <td className="px-2 py-2 text-right">-</td>
                      <td className="px-2 py-2 text-right">-</td>
                      <td className="px-2 py-2 text-right text-green-700 font-medium">{fmtMin(day.day_summary.runtime)}</td>
                      <td className="px-2 py-2 text-right text-red-600 font-medium">{fmtMin(day.day_summary.downtime)}</td>
                      <td className="px-2 py-2 text-right text-yellow-600 font-medium">{fmtMin(day.day_summary.idle_time)}</td>
                    </tr>
                    {/* Product rows */}
                    {day.products.map((p: any, pIdx: number) => (
                      <tr key={`${day.date}-${pIdx}`} className="hover:bg-gray-50 border-t border-gray-100">
                        <td className="px-3 py-1.5 sticky left-0 bg-white z-10"></td>
                        <td className="px-3 py-1.5">
                          <span className="font-medium text-gray-800">{p.product_name}</span>
                          {p.product_code && <span className="text-[10px] text-gray-400 ml-1">({p.product_code})</span>}
                        </td>
                        <td className="px-2 py-1.5 text-right text-green-600">{fmtNum(Math.round(p.grade_a))}</td>
                        <td className="px-2 py-1.5 text-right text-yellow-500">{fmtNum(Math.round(p.grade_b))}</td>
                        <td className="px-2 py-1.5 text-right text-red-500">{fmtNum(Math.round(p.grade_c))}</td>
                        <td className="px-2 py-1.5 text-right">{fmtNum(Math.round(p.total_pcs))}</td>
                        <td className="px-2 py-1.5 text-right">{fmtNum(Math.round(p.total_ctn))}</td>
                        <td className="px-2 py-1.5 text-right text-blue-600 font-medium">{fmtNum(Math.round(p.cumulative_ctn))}</td>
                        <td className="px-2 py-1.5 text-right text-gray-500">{fmtNum(Math.round(p.target_monthly_ctn))}</td>
                        <td className={`px-2 py-1.5 text-right font-medium ${p.gap_ctn > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {p.gap_ctn > 0 ? '-' : '+'}{fmtNum(Math.abs(Math.round(p.gap_ctn)))}
                        </td>
                        <td className="px-2 py-1.5 text-right text-green-600">{fmtMin(p.runtime)}</td>
                        <td className="px-2 py-1.5 text-right text-red-500">{fmtMin(p.downtime)}</td>
                        <td className="px-2 py-1.5 text-right text-yellow-500">{fmtMin(p.idle_time)}</td>
                      </tr>
                    ))}
                    {/* Expanded: Top 5 Unplanned Downtime + All Downtime per Shift */}
                    {isExpanded && day.downtime_records && day.downtime_records.length > 0 && (() => {
                      const allRecords = day.downtime_records;
                      const unplannedRecords = allRecords.filter((d: any) => 
                        d.category === 'mesin' || d.category === 'idle'
                      );
                      
                      const shifts = [...new Set(allRecords.map((d: any) => d.shift))].sort();
                      const shiftColors: Record<number, string> = { 1: 'bg-blue-500', 2: 'bg-green-500', 3: 'bg-purple-500' };
                      const catColors: Record<string, string> = {
                        mesin: 'bg-red-100 text-red-700 border-red-300',
                        operator: 'bg-orange-100 text-orange-700 border-orange-300',
                        material: 'bg-blue-100 text-blue-700 border-blue-300',
                        design: 'bg-purple-100 text-purple-700 border-purple-300',
                        idle: 'bg-yellow-100 text-yellow-700 border-yellow-300',
                        others: 'bg-gray-100 text-gray-700 border-gray-300'
                      };
                      const catLabels: Record<string, string> = {
                        mesin: 'Mesin', operator: 'Operator', material: 'Material',
                        design: 'Design', idle: 'Idle', others: 'Lainnya'
                      };
                      
                      return (
                        <>
                          {/* TOP 5 UNPLANNED DOWNTIME SECTION */}
                          {unplannedRecords.length > 0 && (
                            <tr className="bg-gradient-to-r from-red-100 to-orange-100">
                              <td colSpan={13} className="px-6 py-2">
                                <span className="text-xs font-bold text-red-700 uppercase tracking-wider">
                                  ⚠️ Top 5 Unplanned Downtime (Mesin & Idle) per Shift
                                </span>
                              </td>
                            </tr>
                          )}
                          {shifts.map((shiftNum: number) => {
                            const shiftUnplanned = unplannedRecords
                              .filter((d: any) => d.shift === shiftNum)
                              .sort((a: any, b: any) => {
                                if (a.product_name !== b.product_name) return a.product_name.localeCompare(b.product_name);
                                if (a.machine_name !== b.machine_name) return a.machine_name.localeCompare(b.machine_name);
                                return b.duration_minutes - a.duration_minutes;
                              })
                              .slice(0, 5);
                            
                            if (shiftUnplanned.length === 0) return null;
                            
                            const totalUnplanned = unplannedRecords
                              .filter((d: any) => d.shift === shiftNum)
                              .reduce((s: number, d: any) => s + d.duration_minutes, 0);
                            
                            return (
                              <React.Fragment key={`top5-shift-${day.date}-${shiftNum}`}>
                                <tr className="bg-red-50/70">
                                  <td colSpan={13} className="px-6 py-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded text-white text-[10px] font-bold ${shiftColors[shiftNum] || 'bg-gray-500'}`}>
                                        Shift {shiftNum}
                                      </span>
                                      <span className="text-[10px] font-semibold text-red-600">
                                        Top 5 • Total Unplanned: {totalUnplanned}m
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                                {shiftUnplanned.map((dt: any, dtIdx: number) => (
                                  <tr key={`top5-${day.date}-${shiftNum}-${dtIdx}`} className="bg-red-50/40 text-[11px]">
                                    <td className="px-3 py-1 sticky left-0 bg-red-50/40 z-10 text-red-500 text-center font-bold">{dtIdx + 1}</td>
                                    <td className="px-3 py-1" colSpan={4}>
                                      <span className="text-gray-800 font-medium">{dt.reason}</span>
                                      <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-medium border ${catColors[dt.category]}`}>
                                        {catLabels[dt.category]}
                                      </span>
                                    </td>
                                    <td className="px-2 py-1 text-right font-bold text-red-600">{dt.duration_minutes}m</td>
                                    <td className="px-2 py-1 text-center">
                                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[9px] font-medium">{dt.pic}</span>
                                    </td>
                                    <td className="px-2 py-1 text-gray-600 text-[10px] font-medium">{dt.machine_name}</td>
                                    <td className="px-2 py-1 text-gray-500 text-[10px]" colSpan={2}>{dt.product_name}</td>
                                    <td className="px-2 py-1 text-blue-600 text-[10px]" colSpan={2}>{dt.wo_number}</td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            );
                          })}
                          
                          {/* ALL DOWNTIME SECTION */}
                          <tr className="bg-gradient-to-r from-slate-100 to-slate-200">
                            <td colSpan={13} className="px-6 py-2">
                              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                📋 Semua Downtime per Shift
                              </span>
                            </td>
                          </tr>
                          {shifts.map((shiftNum: number) => {
                            const shiftItems = allRecords
                              .filter((d: any) => d.shift === shiftNum)
                              .sort((a: any, b: any) => b.duration_minutes - a.duration_minutes);
                            const totalMin = shiftItems.reduce((s: number, d: any) => s + d.duration_minutes, 0);
                            
                            return (
                              <React.Fragment key={`all-shift-${day.date}-${shiftNum}`}>
                                <tr className="bg-slate-50/70">
                                  <td colSpan={13} className="px-6 py-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded text-white text-[10px] font-bold ${shiftColors[shiftNum] || 'bg-gray-500'}`}>
                                        Shift {shiftNum}
                                      </span>
                                      <span className="text-[10px] font-medium text-slate-600">
                                        {shiftItems.length} downtime • Total: {totalMin}m
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                                {shiftItems.map((dt: any, dtIdx: number) => (
                                  <tr key={`all-${day.date}-${shiftNum}-${dtIdx}`} className="bg-slate-50/30 text-[11px]">
                                    <td className="px-3 py-1 sticky left-0 bg-slate-50/30 z-10 text-gray-400 text-center">{dtIdx + 1}</td>
                                    <td className="px-3 py-1" colSpan={4}>
                                      <span className="text-gray-800 font-medium">{dt.reason}</span>
                                      <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-medium border ${catColors[dt.category] || catColors.others}`}>
                                        {catLabels[dt.category] || dt.category}
                                      </span>
                                    </td>
                                    <td className="px-2 py-1 text-right font-bold text-red-600">{dt.duration_minutes}m</td>
                                    <td className="px-2 py-1 text-center">
                                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[9px] font-medium">{dt.pic}</span>
                                    </td>
                                    <td className="px-2 py-1 text-gray-600 text-[10px] font-medium">{dt.machine_name}</td>
                                    <td className="px-2 py-1 text-gray-500 text-[10px]" colSpan={2}>{dt.product_name}</td>
                                    <td className="px-2 py-1 text-blue-600 text-[10px]" colSpan={2}>{dt.wo_number}</td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            );
                          })}
                        </>
                      );
                    })()}
                    {isExpanded && (!day.downtime_records || day.downtime_records.length === 0) && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={13} className="px-6 py-3 text-center text-gray-400 text-xs">
                          Tidak ada downtime tercatat untuk hari ini
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== PRODUCTS TAB ====================
const ProductsTab: React.FC<{ data: any }> = ({ data }) => {
  const chartData = data.products.map((p: any) => ({
    name: p.product_name.length > 15 ? p.product_name.substring(0, 15) + '...' : p.product_name,
    target: p.target_ctn, actual: Math.round(p.actual_ctn), gap: Math.round(Math.abs(p.gap_ctn))
  }));

  return (
    <div className="space-y-5">
      {/* Chart */}
      <div className="bg-white rounded-xl p-5 shadow border">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Target vs Aktual per Produk (karton)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => fmtNum(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="target" name="Target" fill="#93C5FD" />
              <Bar dataKey="actual" name="Aktual" fill="#22C55E" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Full Table */}
      <div className="bg-white rounded-xl p-5 shadow border">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Detail Lengkap per Produk</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-medium">
                <th className="px-3 py-2 text-left">Produk</th>
                <th className="px-2 py-2 text-right">Target (ctn)</th>
                <th className="px-2 py-2 text-right">Aktual (ctn)</th>
                <th className="px-2 py-2 text-right">Gap</th>
                <th className="px-2 py-2 text-right">Achievement</th>
                <th className="px-2 py-2 text-right text-green-700">Grade A</th>
                <th className="px-2 py-2 text-right text-yellow-700">Grade B</th>
                <th className="px-2 py-2 text-right text-red-700">Grade C</th>
                <th className="px-2 py-2 text-right">Total (pcs)</th>
                <th className="px-2 py-2 text-right">Quality</th>
                <th className="px-2 py-2 text-right">Runtime</th>
                <th className="px-2 py-2 text-right">Downtime</th>
                <th className="px-2 py-2 text-right">Idle</th>
                <th className="px-2 py-2 text-right">Pack/Ctn</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.products.map((p: any, i: number) => (
                <tr key={i} className={`hover:bg-gray-50 ${p.achievement_pct < 50 ? 'bg-red-50/50' : ''}`}>
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900">{p.product_name}</div>
                    {p.product_code && <div className="text-[10px] text-gray-400">{p.product_code}</div>}
                  </td>
                  <td className="px-2 py-2 text-right text-gray-600">{fmtNum(p.target_ctn)}</td>
                  <td className="px-2 py-2 text-right font-medium">{fmtNum(Math.round(p.actual_ctn))}</td>
                  <td className={`px-2 py-2 text-right font-medium ${p.gap_ctn > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {p.gap_ctn > 0 ? '-' : '+'}{fmtNum(Math.abs(Math.round(p.gap_ctn)))}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${p.achievement_pct >= 80 ? 'bg-green-100 text-green-700' : p.achievement_pct >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {p.achievement_pct}%
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right text-green-600 font-medium">{fmtNum(p.grade_a)}</td>
                  <td className="px-2 py-2 text-right text-yellow-500">{fmtNum(p.grade_b)}</td>
                  <td className="px-2 py-2 text-right text-red-500">{fmtNum(p.grade_c)}</td>
                  <td className="px-2 py-2 text-right">{fmtNum(p.total_pcs)}</td>
                  <td className="px-2 py-2 text-right">{p.quality_rate}%</td>
                  <td className="px-2 py-2 text-right text-green-600">{fmtMin(p.runtime)}</td>
                  <td className="px-2 py-2 text-right text-red-500">{fmtMin(p.downtime)}</td>
                  <td className="px-2 py-2 text-right text-yellow-500">{fmtMin(p.idle_time)}</td>
                  <td className="px-2 py-2 text-right text-gray-500">{p.pack_per_ctn}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold text-xs">
                <td className="px-3 py-2">TOTAL</td>
                <td className="px-2 py-2 text-right">{fmtNum(data.summary.target_ctn)}</td>
                <td className="px-2 py-2 text-right">{fmtNum(Math.round(data.summary.actual_ctn))}</td>
                <td className={`px-2 py-2 text-right ${data.summary.gap_ctn > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {data.summary.gap_ctn > 0 ? '-' : '+'}{fmtNum(Math.abs(Math.round(data.summary.gap_ctn)))}
                </td>
                <td className="px-2 py-2 text-right">{data.summary.achievement_pct}%</td>
                <td className="px-2 py-2 text-right text-green-600">{fmtNum(data.summary.total_grade_a)}</td>
                <td className="px-2 py-2 text-right text-yellow-500">{fmtNum(data.summary.total_grade_b)}</td>
                <td className="px-2 py-2 text-right text-red-500">{fmtNum(data.summary.total_grade_c)}</td>
                <td className="px-2 py-2 text-right">{fmtNum(data.summary.total_pcs)}</td>
                <td className="px-2 py-2 text-right">{data.summary.quality_rate}%</td>
                <td className="px-2 py-2 text-right text-green-600">{data.summary.runtime_hours}j</td>
                <td className="px-2 py-2 text-right text-red-500">{data.summary.downtime_hours}j</td>
                <td className="px-2 py-2 text-right text-yellow-500">{data.summary.idle_time_hours}j</td>
                <td className="px-2 py-2 text-right">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== MACHINES TAB ====================
const MachinesTab: React.FC<{ data: any }> = ({ data }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.machines.map((m: any, i: number) => {
        const totalTime = m.runtime + m.downtime + m.idle_time;
        const rtPct = totalTime > 0 ? (m.runtime / totalTime * 100) : 0;
        const dtPct = totalTime > 0 ? (m.downtime / totalTime * 100) : 0;
        const idlePct = totalTime > 0 ? (m.idle_time / totalTime * 100) : 0;
        return (
          <div key={i} className={`bg-white rounded-xl p-4 shadow border-l-4 ${m.avg_oee >= 60 ? 'border-l-green-500' : m.avg_oee >= 40 ? 'border-l-yellow-500' : 'border-l-red-500'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 text-sm">{m.machine_name}</h4>
              <span className={`text-lg font-bold ${m.avg_oee >= 60 ? 'text-green-600' : m.avg_oee >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                {m.avg_oee}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="bg-green-50 rounded-lg p-2">
                <p className="text-[10px] text-green-600 font-medium">Grade A</p>
                <p className="text-sm font-bold text-green-700">{fmtNum(m.grade_a)}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-2">
                <p className="text-[10px] text-yellow-600 font-medium">Grade B</p>
                <p className="text-sm font-bold text-yellow-600">{fmtNum(m.grade_b)}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-2">
                <p className="text-[10px] text-red-600 font-medium">Grade C</p>
                <p className="text-sm font-bold text-red-600">{fmtNum(m.grade_c)}</p>
              </div>
            </div>
            {/* Time bar */}
            <div className="flex rounded-full h-3 overflow-hidden mb-2">
              <div className="bg-green-500" style={{ width: `${rtPct}%` }} title={`Runtime: ${fmtMin(m.runtime)}`} />
              <div className="bg-red-500" style={{ width: `${dtPct}%` }} title={`Downtime: ${fmtMin(m.downtime)}`} />
              <div className="bg-yellow-400" style={{ width: `${idlePct}%` }} title={`Idle: ${fmtMin(m.idle_time)}`} />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500">
              <span className="text-green-600">RT: {fmtMin(m.runtime)}</span>
              <span className="text-red-500">DT: {fmtMin(m.downtime)}</span>
              <span className="text-yellow-500">Idle: {fmtMin(m.idle_time)}</span>
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-gray-500">
              <span>Total: {fmtNum(m.total_produced)} pcs</span>
              <span>Quality: {m.quality_rate}%</span>
              <span>{m.shift_count} shift</span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ==================== DOWNTIME TAB ====================
const DowntimeTab: React.FC<{ data: any; downtimePieData: any[] }> = ({ data, downtimePieData }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Category Pie */}
      <div className="bg-white rounded-xl p-5 shadow border">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Downtime per Kategori</h3>
        <div className="h-72 flex items-center">
          {downtimePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={downtimePieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value"
                  label={({ name, value }) => `${name}: ${fmtMin(value)}`}>
                  {downtimePieData.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmtMin(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="w-full text-center text-gray-400">No downtime data</p>}
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-2">
          {Object.entries(DOWNTIME_COLORS).map(([k, c]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
              <span className="text-xs text-gray-600">{CATEGORY_LABELS[k]}</span>
              <span className="text-xs text-gray-400">({fmtMin(data.downtime_by_category[k] || 0)})</span>
            </div>
          ))}
        </div>
      </div>
      {/* Category Breakdown Cards */}
      <div className="bg-white rounded-xl p-5 shadow border">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Breakdown Waktu Downtime</h3>
        <div className="space-y-3">
          {Object.entries(data.downtime_by_category).map(([k, v]) => {
            const total = Object.values(data.downtime_by_category).reduce((a: number, b: any) => a + b, 0) as number;
            const pct = total > 0 ? ((v as number) / total * 100) : 0;
            return (
              <div key={k}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">{CATEGORY_LABELS[k]}</span>
                  <span className="text-gray-500">{fmtMin(v as number)} ({pct.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: DOWNTIME_COLORS[k] }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    {/* Top Downtime Reasons - Single table with Unplanned/Planned indicator */}
    {(() => {
      const unplannedCategories = ['mesin', 'idle'];
      const sorted = [...data.top_downtime_reasons].sort((a: any, b: any) => {
        const aU = unplannedCategories.includes(a.category) ? 0 : 1;
        const bU = unplannedCategories.includes(b.category) ? 0 : 1;
        if (aU !== bU) return aU - bU;
        return b.total_minutes - a.total_minutes;
      });

      return (
        <div className="bg-white rounded-xl p-5 shadow border">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            <ExclamationTriangleIcon className="h-4 w-4 inline mr-1 text-red-500" />
            Top 10 Downtime
          </h3>
          {sorted.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Tipe</th>
                    <th className="px-3 py-2 text-left">Alasan</th>
                    <th className="px-3 py-2 text-left">Kategori</th>
                    <th className="px-3 py-2 text-right">Frekuensi</th>
                    <th className="px-3 py-2 text-right">Total Waktu</th>
                    <th className="px-3 py-2 text-left">Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sorted.map((item: any, idx: number) => {
                    const maxMin = sorted[0]?.total_minutes || 1;
                    const pct = (item.total_minutes / maxMin) * 100;
                    const isUnplanned = unplannedCategories.includes(item.category);
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${isUnplanned ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            {isUnplanned ? 'Unplanned' : 'Planned'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-700">{item.reason}</td>
                        <td className="px-3 py-2">
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium" style={{
                            backgroundColor: DOWNTIME_COLORS[item.category] ? DOWNTIME_COLORS[item.category] + '20' : '#F3F4F6',
                            color: DOWNTIME_COLORS[item.category] || '#6B7280'
                          }}>{CATEGORY_LABELS[item.category] || item.category}</span>
                        </td>
                        <td className="px-3 py-2 text-right">{item.count}x</td>
                        <td className="px-3 py-2 text-right font-medium text-red-600">{fmtMin(item.total_minutes)}</td>
                        <td className="px-3 py-2 w-36">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${isUnplanned ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <p className="text-center text-gray-400 py-6">Tidak ada data downtime</p>}
        </div>
      );
    })()}
  </div>
);

export default ProductionMonitoringDashboard;
