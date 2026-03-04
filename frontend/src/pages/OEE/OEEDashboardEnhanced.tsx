import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale';
import toast from 'react-hot-toast'
import {
  BellIcon, ChartBarIcon, CheckCircleIcon, ClockIcon, CogIcon, ExclamationTriangleIcon,
  EyeIcon, ArrowPathIcon, SparklesIcon, BoltIcon, WrenchScrewdriverIcon, UserIcon,
  CubeIcon, PaintBrushIcon, EllipsisHorizontalIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  ChartPieIcon, DocumentChartBarIcon, LightBulbIcon, MagnifyingGlassIcon, ShieldCheckIcon,
  ExclamationCircleIcon, ArrowRightIcon, ClipboardDocumentCheckIcon, FireIcon, BeakerIcon
} from '@heroicons/react/24/outline';
import { useGetOEEDashboardQuery, useGetOEEAlertsQuery, useAcknowledgeAlertMutation, useResolveAlertMutation } from '../../services/api'

// Downtime categories with RCA templates
const DOWNTIME_CATEGORIES: Record<string, any> = {
  mesin: { 
    label: 'Mesin', max: 15, pic: 'MTC', 
    color: 'from-red-500 to-red-600', lightBg: 'bg-red-50', textColor: 'text-red-600', borderColor: 'border-red-200', icon: CogIcon,
    rcaTemplate: {
      why1: ['Mesin breakdown/rusak', 'Komponen aus/tumpul', 'Error sistem/sensor'],
      why2: ['Kurang maintenance preventif', 'Umur komponen habis', 'Kalibrasi tidak tepat'],
      why3: ['Jadwal PM tidak dipatuhi', 'Tidak ada spare part', 'Teknisi kurang terlatih'],
      why4: ['Tidak ada sistem monitoring', 'Budget maintenance terbatas', 'Kurang training'],
      why5: ['Manajemen tidak prioritas', 'Perencanaan kurang matang', 'Kultur kerja reaktif'],
      recommendations: ['Implementasi Preventive Maintenance terjadwal', 'Buat checklist daily inspection mesin', 'Training teknisi untuk troubleshooting', 'Siapkan safety stock spare part kritis']
    }
  },
  operator: { 
    label: 'Operator', max: 7, pic: 'Supervisor Produksi',
    color: 'from-orange-500 to-orange-600', lightBg: 'bg-orange-50', textColor: 'text-orange-600', borderColor: 'border-orange-200', icon: UserIcon,
    rcaTemplate: {
      why1: ['Setting mesin lama', 'Kesalahan operator', 'Operator baru/training'],
      why2: ['SOP tidak jelas', 'Skill belum memadai', 'Tidak ada standar waktu'],
      why3: ['Training kurang', 'Dokumentasi tidak lengkap', 'Supervisi kurang'],
      why4: ['Program training tidak ada', 'Tidak ada mentor', 'Beban kerja supervisor tinggi'],
      why5: ['Budget training minim', 'Turnover tinggi', 'Kultur tidak supportive'],
      recommendations: ['Buat SOP setting mesin dengan waktu standar', 'Program training berkala untuk operator', 'Implementasi sistem buddy/mentor', 'Standarisasi proses handover shift']
    }
  },
  material: { 
    label: 'Raw Material', max: 0, pic: 'Warehouse',
    color: 'from-yellow-500 to-yellow-600', lightBg: 'bg-yellow-50', textColor: 'text-yellow-600', borderColor: 'border-yellow-200', icon: CubeIcon,
    rcaTemplate: {
      why1: ['Material habis', 'Material cacat/defect', 'Tunggu material datang'],
      why2: ['Stock tidak cukup', 'QC incoming lemah', 'Lead time supplier lama'],
      why3: ['Forecast tidak akurat', 'Tidak ada IQC', 'Supplier tidak reliable'],
      why4: ['Data historis tidak ada', 'Budget QC terbatas', 'Tidak ada evaluasi supplier'],
      why5: ['Sistem inventory manual', 'Prioritas QC rendah', 'Tidak ada supplier development'],
      recommendations: ['Implementasi sistem reorder point otomatis', 'Tingkatkan incoming quality control', 'Evaluasi dan develop supplier alternatif', 'Buat safety stock untuk material kritis']
    }
  },
  design: { 
    label: 'Design Change', max: 8, pic: 'Supervisor Produksi',
    color: 'from-blue-500 to-blue-600', lightBg: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-200', icon: PaintBrushIcon,
    rcaTemplate: {
      why1: ['Changeover produk', 'Ganti packaging/label', 'Sanitasi/cleaning'],
      why2: ['Banyak varian produk', 'Lot size kecil', 'Standar kebersihan tinggi'],
      why3: ['Planning tidak optimal', 'Customer request', 'Regulasi ketat'],
      why4: ['Sistem scheduling manual', 'Tidak ada MOQ', 'Audit sering'],
      why5: ['Tools planning kurang', 'Negosiasi lemah', 'Industri regulated'],
      recommendations: ['Optimasi production scheduling', 'Implementasi SMED untuk quick changeover', 'Standarisasi proses cleaning/sanitasi', 'Negosiasi MOQ dengan customer']
    }
  },
  others: { 
    label: 'Others', max: 10, pic: 'Supervisor Produksi',
    color: 'from-gray-500 to-gray-600', lightBg: 'bg-gray-50', textColor: 'text-gray-600', borderColor: 'border-gray-200', icon: EllipsisHorizontalIcon,
    rcaTemplate: {
      why1: ['Istirahat/makan', 'Sholat', 'Meeting/briefing', 'Listrik padam'],
      why2: ['Jadwal istirahat tetap', 'Kewajiban ibadah', 'Koordinasi rutin'],
      why3: ['Regulasi ketenagakerjaan', 'Kultur perusahaan', 'Kebutuhan komunikasi'],
      why4: ['Hukum yang berlaku', 'Nilai perusahaan', 'Struktur organisasi'],
      why5: ['Faktor eksternal', 'Kebijakan manajemen', 'Kebutuhan bisnis'],
      recommendations: ['Optimalkan jadwal istirahat dengan rotasi', 'Sediakan mushola dekat area produksi', 'Efisienkan meeting dengan agenda jelas', 'Investasi genset/UPS untuk backup power']
    }
  }
};

const CircularProgress = ({ value, size = 70, strokeWidth = 6, color = 'blue' }: { value: number; size?: number; strokeWidth?: number; color?: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  const colorMap: Record<string, string> = { green: '#22c55e', yellow: '#eab308', red: '#ef4444', blue: '#3b82f6', purple: '#8b5cf6', orange: '#f97316' };
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colorMap[color] || colorMap.blue} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-500" />
    </svg>
  );
};

const getApiBase = () => {
  const hostname = window.location.hostname;
  if (hostname === 'erp.graterp.my.id' || hostname.endsWith('.graterp.my.id')) {
    return 'https://api.graterp.my.id/api';
  }
  return `http://${hostname}:5000/api`;
};

export default function OEEDashboardEnhanced() {
  const [selectedMachine, setSelectedMachine] = useState<number | null>(null)
  const [dateRange, setDateRange] = useState(30)
  const [alertFilter, setAlertFilter] = useState('active')
  const [activeTab, setActiveTab] = useState<'overview' | 'rca' | 'machines' | 'alerts' | 'downtime'>('overview')
  const [selectedRCACategory, setSelectedRCACategory] = useState<string | null>(null)
  const [downtimeDetails, setDowntimeDetails] = useState<any[]>([])
  const [loadingDowntime, setLoadingDowntime] = useState(false)
  const [shiftProductions, setShiftProductions] = useState<any[]>([])
  const [editingRecord, setEditingRecord] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({ downtime_mesin: 0, downtime_operator: 0, downtime_material: 0, downtime_design: 0, downtime_others: 0 })
  const [saving, setSaving] = useState(false)
  
  const { data: dashboardData, isLoading, refetch } = useGetOEEDashboardQuery({ machine_id: selectedMachine || undefined, days: dateRange })
  const { data: alertsData, refetch: refetchAlerts } = useGetOEEAlertsQuery({ status: alertFilter, machine_id: selectedMachine || undefined })
  const [acknowledgeAlert] = useAcknowledgeAlertMutation()
  const [resolveAlert] = useResolveAlertMutation()

  const summary = dashboardData?.summary || {}
  const machinePerformance = dashboardData?.machine_performance || []
  const trendData = dashboardData?.trend_data || []
  const downtimeAnalysis = dashboardData?.downtime_analysis || []
  const alerts = alertsData?.alerts || []
  const totalDowntime = downtimeAnalysis.reduce((sum: number, d: any) => sum + (d.minutes || 0), 0);
  const activeAlertsCount = alerts.filter((a: any) => a.status === 'active').length;

  // Fetch downtime details when tab is active
  React.useEffect(() => {
    if (activeTab === 'downtime') {
      fetchDowntimeDetails();
      fetchShiftProductions();
    }
  }, [activeTab, selectedMachine]);

  const fetchDowntimeDetails = async () => {
    setLoadingDowntime(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ limit: '50' });
      if (selectedMachine) params.append('machine_id', selectedMachine.toString());
      
      const response = await fetch(`${getApiBase()}/oee/downtime?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setDowntimeDetails(data.records || []);
    } catch (error) {
      console.error('Error fetching downtime details:', error);
      setDowntimeDetails([]);
    } finally {
      setLoadingDowntime(false);
    }
  };

  const fetchShiftProductions = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ limit: '50' });
      if (selectedMachine) params.append('machine_id', selectedMachine.toString());
      
      const response = await fetch(`${getApiBase()}/oee/shift-production?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setShiftProductions(data.records || []);
    } catch (error) {
      console.error('Error fetching shift productions:', error);
      setShiftProductions([]);
    }
  };

  const openEditModal = (record: any) => {
    setEditingRecord(record);
    setEditForm({
      downtime_mesin: record.downtime_mesin || 0,
      downtime_operator: record.downtime_operator || 0,
      downtime_material: record.downtime_material || 0,
      downtime_design: record.downtime_design || 0,
      downtime_others: record.downtime_others || 0
    });
  };

  const saveDowntimeEdit = async () => {
    if (!editingRecord) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBase()}/oee/shift-production/${editingRecord.id}/downtime`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });
      
      if (response.ok) {
        toast.success('Downtime berhasil diupdate!');
        setEditingRecord(null);
        fetchShiftProductions();
        fetchDowntimeDetails();
        refetch();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal update downtime');
      }
    } catch (error) {
      console.error('Error saving downtime:', error);
      toast.error('Gagal update downtime');
    } finally {
      setSaving(false);
    }
  };

  const totalEditDowntime = editForm.downtime_mesin + editForm.downtime_operator + editForm.downtime_material + editForm.downtime_design + editForm.downtime_others;

  // RCA Analysis Engine
  const rcaAnalysis = useMemo(() => {
    if (!downtimeAnalysis || downtimeAnalysis.length === 0) return [];
    const categoryMap: Record<string, string> = { 'Mesin': 'mesin', 'Operator': 'operator', 'Raw Material': 'material', 'Material': 'material', 'Design Change': 'design', 'Design': 'design', 'Others': 'others', 'Other': 'others' };
    return downtimeAnalysis.map((item: any) => {
      const categoryKey = categoryMap[item.category] || 'others';
      const config = DOWNTIME_CATEGORIES[categoryKey];
      const percentOfTotal = totalDowntime > 0 ? (item.minutes / totalDowntime) * 100 : 0;
      const machineDays = summary.total_machine_days || 1;
      const avgPerMachineDay = item.minutes / machineDays;
      const percentPerShift = (avgPerMachineDay / 480) * 100;
      let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';
      if (config?.max > 0) {
        const ratio = percentPerShift / config.max;
        if (ratio >= 1.5) severity = 'critical';
        else if (ratio >= 1) severity = 'high';
        else if (ratio >= 0.7) severity = 'medium';
      } else if (percentOfTotal > 30) severity = 'high';
      else if (percentOfTotal > 20) severity = 'medium';
      const trend = percentOfTotal > 25 ? 'increasing' : percentOfTotal < 10 ? 'decreasing' : 'stable';
      const whyIndex = severity === 'critical' ? 0 : severity === 'high' ? 1 : 2;
      return {
        category: categoryKey, severity, totalDowntime: item.minutes, percentOfTotal, trend,
        topReasons: config?.rcaTemplate?.why1?.slice(0, 3) || [],
        whyAnalysis: {
          why1: config?.rcaTemplate?.why1?.[whyIndex] || '-',
          why2: config?.rcaTemplate?.why2?.[whyIndex] || '-',
          why3: config?.rcaTemplate?.why3?.[whyIndex] || '-',
          why4: config?.rcaTemplate?.why4?.[whyIndex] || '-',
          why5: config?.rcaTemplate?.why5?.[whyIndex] || '-',
        },
        recommendations: config?.rcaTemplate?.recommendations?.slice(0, 4) || [],
        estimatedImpact: severity === 'critical' ? 'Sangat Tinggi - Perlu tindakan segera' : severity === 'high' ? 'Tinggi - Prioritas minggu ini' : severity === 'medium' ? 'Sedang - Jadwalkan perbaikan' : 'Rendah - Monitor berkala',
        priority: severity === 'critical' ? 1 : severity === 'high' ? 2 : severity === 'medium' ? 3 : 4
      };
    }).sort((a: any, b: any) => a.priority - b.priority);
  }, [downtimeAnalysis, totalDowntime, summary.total_records]);

  const rcaSummary = useMemo(() => {
    const criticalCount = rcaAnalysis.filter((r: any) => r.severity === 'critical').length;
    const highCount = rcaAnalysis.filter((r: any) => r.severity === 'high').length;
    const totalRecommendations = rcaAnalysis.reduce((sum: number, r: any) => sum + r.recommendations.length, 0);
    return { criticalCount, highCount, totalRecommendations, overallHealth: criticalCount > 0 ? 'critical' : highCount > 0 ? 'warning' : 'good' };
  }, [rcaAnalysis]);

  const getOEEColor = (oee: number) => oee >= 85 ? 'text-green-600' : oee >= 60 ? 'text-yellow-600' : 'text-red-600';
  const getOEEBgGradient = (oee: number) => oee >= 85 ? 'from-green-500 to-emerald-600' : oee >= 60 ? 'from-yellow-500 to-amber-600' : 'from-red-500 to-rose-600';
  const getProgressColor = (value: number, target: number) => value / target >= 1 ? 'green' : value / target >= 0.7 ? 'yellow' : 'red';
  const getSeverityBadge = (severity: string) => ({ critical: 'bg-red-500 text-white', high: 'bg-orange-500 text-white', medium: 'bg-yellow-500 text-white', low: 'bg-blue-500 text-white' }[severity] || 'bg-gray-500 text-white');
  const getTrendIcon = (trend: string) => trend === 'increasing' ? <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" /> : trend === 'decreasing' ? <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" /> : <span className="text-gray-400">→</span>;
  const formatMinutes = (minutes: number) => { const h = Math.floor(minutes / 60), m = Math.round(minutes % 60); return h > 0 ? `${h}j ${m}m` : `${m}m`; };
  const COLORS = ['#EF4444', '#F97316', '#EAB308', '#3B82F6', '#6B7280'];

  const handleAcknowledgeAlert = async (alertId: number) => { try { await acknowledgeAlert(alertId).unwrap(); toast.success('Alert acknowledged'); refetchAlerts(); } catch (e: any) { toast.error(e.data?.error || 'Failed'); } };
  const handleResolveAlert = async (alertId: number, notes: string) => { try { await resolveAlert({ alertId, resolution_notes: notes }).unwrap(); toast.success('Alert resolved'); refetchAlerts(); } catch (e: any) { toast.error(e.data?.error || 'Failed'); } };

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
      <div className="text-center"><div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto"></div><p className="mt-4 text-gray-500">Memuat data OEE...</p></div>
    </div>
  );

  const hasData = summary.avg_oee !== undefined && summary.avg_oee !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg"><ChartBarIcon className="h-8 w-8 text-white" /></div>
            OEE Dashboard & RCA
          </h1>
          <p className="text-gray-500 mt-2 ml-14">Overall Equipment Effectiveness dengan Root Cause Analysis Otomatis</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white" value={selectedMachine || ''} onChange={(e) => setSelectedMachine(e.target.value ? Number(e.target.value) : null)}>
            <option value="">All Machines</option>
            {machinePerformance.map((m: any) => <option key={m.machine_id} value={m.machine_id}>{m.machine_name}</option>)}
          </select>
          <select className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white" value={dateRange} onChange={(e) => setDateRange(Number(e.target.value))}>
            <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
          </select>
          <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"><ArrowPathIcon className="h-5 w-5" />Refresh</button>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
          <DocumentChartBarIcon className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Belum Ada Data Produksi</h3>
          <p className="text-gray-500 mb-6">Data OEE dan RCA akan muncul setelah ada input produksi dari Work Order.</p>
          <Link to="/app/production/work-orders" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"><WrenchScrewdriverIcon className="h-5 w-5" />Lihat Work Orders</Link>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: 'overview', label: 'Overview', icon: ChartPieIcon, color: 'blue' },
              { id: 'downtime', label: 'Downtime Detail', icon: ClockIcon, color: 'orange', badge: downtimeAnalysis.length },
              { id: 'rca', label: 'RCA Analysis', icon: MagnifyingGlassIcon, color: 'purple', badge: rcaSummary.criticalCount },
              { id: 'machines', label: `Machines (${machinePerformance.length})`, icon: CogIcon, color: 'blue' },
              { id: 'alerts', label: 'Alerts', icon: BellIcon, color: 'blue', badge: activeAlertsCount }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap relative ${activeTab === tab.id ? `bg-${tab.color}-600 text-white shadow-lg` : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}>
                <tab.icon className="h-5 w-5 inline mr-2" />{tab.label}
                {tab.badge && tab.badge > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{tab.badge}</span>}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                <div className="bg-white rounded-2xl shadow-sm border p-5 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${getOEEBgGradient(summary.avg_oee || 0)} opacity-10 rounded-bl-full`}></div>
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Average OEE</p><p className={`text-4xl font-bold ${getOEEColor(summary.avg_oee || 0)} mt-1`}>{(summary.avg_oee || 0).toFixed(1)}%</p><p className="text-xs text-gray-400">Target: ≥ 85%</p></div>
                    <div className="relative"><CircularProgress value={summary.avg_oee || 0} color={getProgressColor(summary.avg_oee || 0, 85)} /><ChartBarIcon className={`h-5 w-5 ${getOEEColor(summary.avg_oee || 0)} absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`} /></div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-10 rounded-bl-full"></div>
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Efisiensi</p><p className={`text-4xl font-bold ${(summary.avg_availability || 0) >= 60 ? 'text-green-600' : 'text-red-600'} mt-1`}>{(summary.avg_availability || 0).toFixed(1)}%</p><p className="text-xs text-gray-400">Target: ≥ 60%</p></div>
                    <div className="relative"><CircularProgress value={summary.avg_availability || 0} color="blue" /><BoltIcon className="h-5 w-5 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" /></div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-600 opacity-10 rounded-bl-full"></div>
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Quality</p><p className={`text-4xl font-bold ${(summary.avg_quality || 0) >= 95 ? 'text-green-600' : 'text-yellow-600'} mt-1`}>{(summary.avg_quality || 0).toFixed(1)}%</p><p className="text-xs text-gray-400">Target: ≥ 95%</p></div>
                    <div className="relative"><CircularProgress value={summary.avg_quality || 0} color="green" /><CheckCircleIcon className="h-5 w-5 text-green-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" /></div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border p-5 cursor-pointer hover:shadow-md" onClick={() => setActiveTab('rca')}>
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">RCA Status</p><p className={`text-2xl font-bold mt-1 ${rcaSummary.overallHealth === 'critical' ? 'text-red-600' : rcaSummary.overallHealth === 'warning' ? 'text-orange-600' : 'text-green-600'}`}>{rcaSummary.criticalCount > 0 ? `${rcaSummary.criticalCount} Critical` : rcaSummary.highCount > 0 ? `${rcaSummary.highCount} High` : 'Good'}</p><p className="text-xs text-gray-400">{rcaSummary.totalRecommendations} rekomendasi</p></div>
                    <div className={`p-3 rounded-xl ${rcaSummary.overallHealth === 'critical' ? 'bg-red-100' : rcaSummary.overallHealth === 'warning' ? 'bg-orange-100' : 'bg-green-100'}`}><MagnifyingGlassIcon className={`h-8 w-8 ${rcaSummary.overallHealth === 'critical' ? 'text-red-600' : rcaSummary.overallHealth === 'warning' ? 'text-orange-600' : 'text-green-600'}`} /></div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl shadow-sm border p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><ArrowTrendingUpIcon className="h-5 w-5 text-blue-500" />OEE Trend</h3>
                  {trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={trendData}>
                        <defs><linearGradient id="colorOee" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tickFormatter={(v) => { try { return format(parseISO(v), 'dd MMM', { locale: idLocale }); } catch { return v; } }} stroke="#9ca3af" fontSize={12} />
                        <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={12} />
                        <Tooltip labelFormatter={(v) => { try { return format(parseISO(v as string), 'dd MMM yyyy', { locale: idLocale }); } catch { return v; } }} formatter={(v: number) => [`${v.toFixed(1)}%`, 'OEE']} />
                        <Area type="monotone" dataKey="oee" stroke="#3B82F6" strokeWidth={2} fill="url(#colorOee)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <div className="h-64 flex items-center justify-center text-gray-400">No trend data</div>}
                </div>
                <div className="bg-white rounded-2xl shadow-sm border p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><ClockIcon className="h-5 w-5 text-orange-500" />Downtime per Kategori {totalDowntime > 0 && <span className="text-sm font-normal text-gray-500">(Total: {formatMinutes(totalDowntime)})</span>}</h3>
                  {downtimeAnalysis.length > 0 ? (
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width="50%" height={220}>
                        <PieChart><Pie data={downtimeAnalysis} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="minutes" paddingAngle={2}>{downtimeAnalysis.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => [formatMinutes(v), 'Downtime']} /></PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {downtimeAnalysis.map((item: any, i: number) => <div key={i} className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-sm text-gray-600">{item.category}</span></div><span className="text-sm font-medium">{formatMinutes(item.minutes)} ({(item.minutes / totalDowntime * 100).toFixed(0)}%)</span></div>)}
                      </div>
                    </div>
                  ) : <div className="h-64 flex items-center justify-center text-gray-400">No downtime data</div>}
                </div>
              </div>

              {/* Quick RCA Preview */}
              {rcaAnalysis.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><LightBulbIcon className="h-5 w-5 text-yellow-500" />Quick RCA Insights</h3>
                    <button onClick={() => setActiveTab('rca')} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">Lihat Detail RCA <ArrowRightIcon className="h-4 w-4" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {rcaAnalysis.slice(0, 3).map((rca: any, i: number) => {
                      const config = DOWNTIME_CATEGORIES[rca.category];
                      const Icon = config?.icon || CogIcon;
                      return (
                        <div key={i} className={`p-4 rounded-xl border-2 cursor-pointer hover:shadow-md ${rca.severity === 'critical' ? 'bg-red-50 border-red-200' : rca.severity === 'high' ? 'bg-orange-50 border-orange-200' : rca.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`} onClick={() => { setActiveTab('rca'); setSelectedRCACategory(rca.category); }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2"><Icon className={`h-5 w-5 ${config?.textColor}`} /><span className="font-medium">{config?.label}</span></div>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getSeverityBadge(rca.severity)}`}>{rca.severity}</span>
                          </div>
                          <p className="text-sm text-gray-600">{formatMinutes(rca.totalDowntime)} ({rca.percentOfTotal.toFixed(1)}%)</p>
                          <p className="text-xs text-gray-500 mt-1">Top: {rca.topReasons[0]}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Downtime Detail Tab */}
          {activeTab === 'downtime' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {Object.entries(DOWNTIME_CATEGORIES).map(([key, config]) => {
                  const categoryData = downtimeAnalysis.find((d: any) => d.category?.toLowerCase() === key || d.category === config.label);
                  const minutes = categoryData?.minutes || 0;
                  const Icon = config.icon;
                  return (
                    <div key={key} className={`bg-white rounded-xl p-4 border-2 ${config.borderColor}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${config.color}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{config.label}</p>
                          <p className={`text-lg font-bold ${config.textColor}`}>{formatMinutes(minutes)}</p>
                          <p className="text-xs text-gray-400">Limit: {config.max}% /hari</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Downtime Records Table */}
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="p-5 border-b flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 text-orange-500" />
                    Detail Downtime Records
                  </h3>
                  <button onClick={fetchDowntimeDetails} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <ArrowPathIcon className="h-4 w-4" /> Refresh
                  </button>
                </div>
                
                {loadingDowntime ? (
                  <div className="p-12 text-center">
                    <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">Loading downtime data...</p>
                  </div>
                ) : downtimeDetails.length === 0 ? (
                  <div className="p-12 text-center">
                    <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Belum ada data downtime</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alasan</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Durasi</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {downtimeDetails.map((record: any, idx: number) => {
                          const categoryKey = record.downtime_category?.toLowerCase() || 'others';
                          const config = DOWNTIME_CATEGORIES[categoryKey] || DOWNTIME_CATEGORIES.others;
                          const Icon = config?.icon || CogIcon;
                          return (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {record.start_time ? format(parseISO(record.start_time), 'dd MMM yyyy HH:mm', { locale: idLocale }) : '-'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${config?.color}`}>
                                    <Icon className="h-4 w-4 text-white" />
                                  </div>
                                  <span className={`text-sm font-medium ${config?.textColor}`}>
                                    {config?.label || record.downtime_category}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-800 max-w-xs truncate" title={record.reason}>
                                {record.reason || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-right text-gray-800">
                                {formatMinutes(record.duration_minutes || 0)}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs rounded-full ${record.source === 'shift_production' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                  {record.source === 'shift_production' ? 'Work Order' : 'OEE Input'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Edit Production Records */}
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="p-5 border-b">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <WrenchScrewdriverIcon className="h-5 w-5 text-blue-500" />
                    Edit Kategori Downtime per Shift
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Klik tombol Edit untuk mengubah breakdown downtime per kategori</p>
                </div>
                
                {shiftProductions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">Belum ada data shift production</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mesin</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total DT</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mesin</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Operator</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Material</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Design</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Others</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">OEE</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {shiftProductions.map((sp: any) => (
                          <tr key={sp.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{sp.production_date ? format(parseISO(sp.production_date), 'dd MMM yyyy', { locale: idLocale }) : '-'}</td>
                            <td className="px-4 py-3 text-sm font-medium">{sp.machine_name}</td>
                            <td className="px-4 py-3 text-sm">{sp.product_name}</td>
                            <td className="px-4 py-3 text-sm text-center font-medium">{formatMinutes(sp.downtime_minutes)}</td>
                            <td className="px-4 py-3 text-sm text-center text-red-600">{sp.downtime_mesin || 0}</td>
                            <td className="px-4 py-3 text-sm text-center text-orange-600">{sp.downtime_operator || 0}</td>
                            <td className="px-4 py-3 text-sm text-center text-yellow-600">{sp.downtime_material || 0}</td>
                            <td className="px-4 py-3 text-sm text-center text-blue-600">{sp.downtime_design || 0}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-600">{sp.downtime_others || 0}</td>
                            <td className="px-4 py-3 text-sm text-center font-medium">{sp.oee_score?.toFixed(1)}%</td>
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => openEditModal(sp)} className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Downtime by Category Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <ChartPieIcon className="h-5 w-5 text-purple-500" />
                    Distribusi Downtime
                  </h3>
                  {downtimeAnalysis.length > 0 ? (
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width="50%" height={220}>
                        <PieChart>
                          <Pie data={downtimeAnalysis} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="minutes" paddingAngle={2}>
                            {downtimeAnalysis.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => [formatMinutes(v), 'Downtime']} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {downtimeAnalysis.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              <span className="text-sm text-gray-600">{item.category}</span>
                            </div>
                            <span className="text-sm font-medium">{formatMinutes(item.minutes)} ({(item.minutes / totalDowntime * 100).toFixed(0)}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-gray-400">No downtime data</div>
                  )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                    Limit vs Actual
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(DOWNTIME_CATEGORIES).map(([key, config]) => {
                      const categoryData = downtimeAnalysis.find((d: any) => d.category?.toLowerCase() === key || d.category === config.label);
                      const minutes = categoryData?.minutes || 0;
                      const machineDays = summary.total_machine_days || 1;
                      const percentOfShift = (minutes / machineDays / 480 * 100);
                      const isOverLimit = config.max > 0 && percentOfShift > config.max;
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600">{config.label}</span>
                            <span className={`text-sm font-medium ${isOverLimit ? 'text-red-600' : 'text-green-600'}`}>
                              {percentOfShift.toFixed(1)}% / {config.max}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${isOverLimit ? 'bg-red-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min((percentOfShift / (config.max || 100)) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rca' && (
            <>
              {/* RCA Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className={`bg-white rounded-xl p-4 border-2 ${rcaSummary.overallHealth === 'critical' ? 'border-red-300' : rcaSummary.overallHealth === 'warning' ? 'border-orange-300' : 'border-green-300'}`}>
                  <div className="flex items-center gap-3"><ShieldCheckIcon className={`h-8 w-8 ${rcaSummary.overallHealth === 'critical' ? 'text-red-600' : rcaSummary.overallHealth === 'warning' ? 'text-orange-600' : 'text-green-600'}`} /><div><p className="text-sm text-gray-500">Overall Status</p><p className={`font-bold ${rcaSummary.overallHealth === 'critical' ? 'text-red-600' : rcaSummary.overallHealth === 'warning' ? 'text-orange-600' : 'text-green-600'}`}>{rcaSummary.overallHealth === 'critical' ? 'Perlu Tindakan Segera' : rcaSummary.overallHealth === 'warning' ? 'Perlu Perhatian' : 'Baik'}</p></div></div>
                </div>
                <div className="bg-white rounded-xl p-4 border"><div className="flex items-center gap-3"><FireIcon className="h-8 w-8 text-red-600" /><div><p className="text-sm text-gray-500">Critical Issues</p><p className="text-lg font-bold text-red-600">{rcaSummary.criticalCount}</p></div></div></div>
                <div className="bg-white rounded-xl p-4 border"><div className="flex items-center gap-3"><ExclamationCircleIcon className="h-8 w-8 text-orange-600" /><div><p className="text-sm text-gray-500">High Priority</p><p className="text-lg font-bold text-orange-600">{rcaSummary.highCount}</p></div></div></div>
                <div className="bg-white rounded-xl p-4 border"><div className="flex items-center gap-3"><ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-600" /><div><p className="text-sm text-gray-500">Total Rekomendasi</p><p className="text-lg font-bold text-blue-600">{rcaSummary.totalRecommendations}</p></div></div></div>
              </div>

              {/* RCA Detail Cards */}
              <div className="space-y-4">
                {rcaAnalysis.map((rca: any, i: number) => {
                  const config = DOWNTIME_CATEGORIES[rca.category];
                  const Icon = config?.icon || CogIcon;
                  const isExpanded = selectedRCACategory === rca.category;
                  return (
                    <div key={i} className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden ${rca.severity === 'critical' ? 'border-red-300' : rca.severity === 'high' ? 'border-orange-300' : rca.severity === 'medium' ? 'border-yellow-300' : 'border-gray-200'}`}>
                      <div className={`p-5 cursor-pointer ${rca.severity === 'critical' ? 'bg-red-50' : rca.severity === 'high' ? 'bg-orange-50' : rca.severity === 'medium' ? 'bg-yellow-50' : 'bg-gray-50'}`} onClick={() => setSelectedRCACategory(isExpanded ? null : rca.category)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${config?.color}`}><Icon className="h-6 w-6 text-white" /></div>
                            <div>
                              <div className="flex items-center gap-2"><h3 className="text-lg font-bold">{config?.label}</h3><span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getSeverityBadge(rca.severity)}`}>{rca.severity.toUpperCase()}</span>{getTrendIcon(rca.trend)}</div>
                              <p className="text-sm text-gray-500">PIC: {config?.pic} | Downtime: {formatMinutes(rca.totalDowntime)} ({rca.percentOfTotal.toFixed(1)}%)</p>
                            </div>
                          </div>
                          <ArrowRightIcon className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="p-5 border-t">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold mb-4 flex items-center gap-2"><BeakerIcon className="h-5 w-5 text-purple-500" />5 Why Analysis</h4>
                              <div className="space-y-2">
                                {[{ l: 'Why 1', v: rca.whyAnalysis.why1, c: 'border-red-300 bg-red-50' }, { l: 'Why 2', v: rca.whyAnalysis.why2, c: 'border-orange-300 bg-orange-50' }, { l: 'Why 3', v: rca.whyAnalysis.why3, c: 'border-yellow-300 bg-yellow-50' }, { l: 'Why 4', v: rca.whyAnalysis.why4, c: 'border-blue-300 bg-blue-50' }, { l: 'Why 5 (Root)', v: rca.whyAnalysis.why5, c: 'border-purple-300 bg-purple-50' }].map((w, j) => (
                                  <div key={j} className={`p-3 rounded-lg border-l-4 ${w.c}`}><p className="text-xs font-medium text-gray-500">{w.l}</p><p className="text-sm">{w.v}</p></div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-4 flex items-center gap-2"><LightBulbIcon className="h-5 w-5 text-yellow-500" />Rekomendasi Perbaikan</h4>
                              <div className="space-y-2">
                                {rca.recommendations.map((rec: string, j: number) => (
                                  <div key={j} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{j + 1}</div>
                                    <p className="text-sm">{rec}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200"><p className="text-sm font-medium text-blue-800">Impact: {rca.estimatedImpact}</p></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'machines' && (
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50"><h3 className="font-semibold">Machine Performance</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50"><tr>{['Machine', 'Status', 'OEE', 'Downtime', 'Production', 'Actions'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>)}</tr></thead>
                  <tbody className="divide-y">
                    {machinePerformance.map((m: any) => (
                      <tr key={m.machine_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4"><div className="font-medium">{m.machine_name}</div><div className="text-xs text-gray-500">{m.machine_code}</div></td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${m.status === 'running' ? 'bg-green-100 text-green-800' : m.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{m.status}</span></td>
                        <td className="px-6 py-4"><span className={`font-bold ${getOEEColor(m.avg_oee)}`}>{m.avg_oee?.toFixed(1)}%</span></td>
                        <td className="px-6 py-4 text-gray-600">{m.total_downtime} min</td>
                        <td className="px-6 py-4 text-gray-600">{m.total_production?.toLocaleString()} units</td>
                        <td className="px-6 py-4"><button onClick={() => setSelectedMachine(m.machine_id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><EyeIcon className="h-4 w-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold">Alerts</h3>
                <select className="px-3 py-1.5 border rounded-lg text-sm" value={alertFilter} onChange={(e) => setAlertFilter(e.target.value)}><option value="active">Active</option><option value="acknowledged">Acknowledged</option><option value="resolved">Resolved</option></select>
              </div>
              <div className="divide-y">
                {alerts.length > 0 ? alerts.map((alert: any) => (
                  <div key={alert.id} className="p-5 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <ExclamationTriangleIcon className={`h-6 w-6 ${alert.severity === 'critical' ? 'text-red-500' : alert.severity === 'high' ? 'text-orange-500' : 'text-yellow-500'}`} />
                        <div>
                          <div className="flex items-center gap-2 mb-1"><h4 className="font-semibold">{alert.title}</h4><span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getSeverityBadge(alert.severity)}`}>{alert.severity}</span></div>
                          <p className="text-sm text-gray-600">{alert.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{alert.machine_name} | {format(parseISO(alert.alert_date), 'dd MMM yyyy HH:mm', { locale: idLocale })}</p>
                        </div>
                      </div>
                      {alert.status === 'active' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleAcknowledgeAlert(alert.id)} className="px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg">Acknowledge</button>
                          <button onClick={() => handleResolveAlert(alert.id, 'Resolved')} className="px-3 py-1.5 text-xs text-green-600 hover:bg-green-50 rounded-lg">Resolve</button>
                        </div>
                      )}
                    </div>
                  </div>
                )) : <div className="p-12 text-center text-gray-500"><CheckCircleIcon className="h-12 w-12 mx-auto text-green-400 mb-2" /><p>No {alertFilter} alerts</p></div>}
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Downtime Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Edit Kategori Downtime</h3>
              <p className="text-sm text-gray-500 mt-1">
                {editingRecord.production_date ? format(parseISO(editingRecord.production_date), 'dd MMM yyyy', { locale: idLocale }) : ''} - {editingRecord.machine_name}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Downtime Asli:</span>
                  <span className="font-bold">{formatMinutes(editingRecord.downtime_minutes)}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-600">Total dari Form:</span>
                  <span className={`font-bold ${totalEditDowntime !== editingRecord.downtime_minutes ? 'text-orange-600' : 'text-green-600'}`}>
                    {formatMinutes(totalEditDowntime)}
                  </span>
                </div>
              </div>

              {/* Mesin */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <CogIcon className="h-4 w-4 text-red-500" /> Downtime Mesin (menit)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.downtime_mesin}
                  onChange={(e) => setEditForm({ ...editForm, downtime_mesin: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <p className="text-xs text-gray-400 mt-1">Max: 15% dari shift (72 menit)</p>
              </div>

              {/* Operator */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <UserIcon className="h-4 w-4 text-orange-500" /> Downtime Operator (menit)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.downtime_operator}
                  onChange={(e) => setEditForm({ ...editForm, downtime_operator: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <p className="text-xs text-gray-400 mt-1">Max: 7% dari shift (34 menit)</p>
              </div>

              {/* Material */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <CubeIcon className="h-4 w-4 text-yellow-500" /> Downtime Material (menit)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.downtime_material}
                  onChange={(e) => setEditForm({ ...editForm, downtime_material: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
                <p className="text-xs text-gray-400 mt-1">Max: 0% (tidak boleh ada)</p>
              </div>

              {/* Design */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <PaintBrushIcon className="h-4 w-4 text-blue-500" /> Downtime Design Change (menit)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.downtime_design}
                  onChange={(e) => setEditForm({ ...editForm, downtime_design: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Max: 8% dari shift (38 menit)</p>
              </div>

              {/* Others */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <EllipsisHorizontalIcon className="h-4 w-4 text-gray-500" /> Downtime Lainnya (menit)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.downtime_others}
                  onChange={(e) => setEditForm({ ...editForm, downtime_others: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
                <p className="text-xs text-gray-400 mt-1">Max: 10% dari shift (48 menit)</p>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={saveDowntimeEdit}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
