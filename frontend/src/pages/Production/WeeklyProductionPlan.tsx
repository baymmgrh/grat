import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  PrinterIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  XMarkIcon,
  ClipboardDocumentListIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
  CubeIcon,
  BoltIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface ScheduleItem {
  id: number;
  machine_id: number;
  machine_name: string;
  machine_code: string;
  product_id: number;
  product_name: string;
  product_code: string;
  order_ctn: number;
  qty_per_ctn: number;
  order_pack: number;
  spek_kain: string;
  no_spk: string;
  wo_id?: number; // Work Order ID for navigation
  wo_number?: string;
  status: string; // planned, wo_created, in_progress, completed
  color: string;
  schedule_days: { [key: string]: number[] }; // { "2025-12-08": [1, 2], "2025-12-09": [1] }
  notes: string;
}

interface Machine {
  id: number;
  code: string;
  name: string;
}

interface Product {
  id: number;
  code: string;
  name: string;
}

// Predefined colors for schedule blocks
const SCHEDULE_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-cyan-500',
  'bg-orange-400',
  'bg-pink-400',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-rose-500',
];

const DAYS = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];

const WeeklyProductionPlan: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Week navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [weekNumber, setWeekNumber] = useState(1);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    machine_id: '',
    product_id: '',
    order_ctn: '',
    qty_per_ctn: '',
    spek_kain: '',
    no_spk: '',
    color: SCHEDULE_COLORS[0],
    schedule_days: {} as { [key: string]: number[] },
    notes: '',
  });

  useEffect(() => {
    calculateWeekDates(currentDate);
    fetchData();
  }, [currentDate]);

  const calculateWeekDates = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday
    const monday = new Date(d.setDate(diff));
    
    const dates: Date[] = [];
    for (let i = 0; i < 5; i++) {
      const newDate = new Date(monday);
      newDate.setDate(monday.getDate() + i);
      dates.push(newDate);
    }
    setWeekDates(dates);
    
    // Calculate week number
    const startOfYear = new Date(monday.getFullYear(), 0, 1);
    const days = Math.floor((monday.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    setWeekNumber(Math.ceil((days + startOfYear.getDay() + 1) / 7));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [machinesRes, productsRes, schedulesRes] = await Promise.all([
        axiosInstance.get('/api/production/machines'),
        axiosInstance.get('/api/products'),
        axiosInstance.get(`/api/production/schedule-grid?week_start=${weekDates[0]?.toISOString().split('T')[0] || ''}`),
      ]);
      
      setMachines(machinesRes.data.machines || []);
      setProducts(productsRes.data.products || []);
      setScheduleItems(schedulesRes.data.schedules || []);
      setNotes(schedulesRes.data.notes || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const formatDateHeader = (date: Date) => {
    return date.getDate().toString();
  };

  const formatDateRange = () => {
    if (weekDates.length < 5) return '';
    const start = weekDates[0];
    const end = weekDates[4];
    const months = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
    return `DATE : ${start.getDate()} - ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
  };

  const getWeekPeriod = () => {
    if (weekDates.length < 5) return '';
    const months = ['DESEMBER', 'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER'];
    return `WEEK ${weekNumber} ${months[weekDates[0].getMonth()]} ${weekDates[0].getFullYear()}`;
  };

  const toggleScheduleDay = (dateStr: string, shift: number) => {
    const newSchedule = { ...formData.schedule_days };
    if (!newSchedule[dateStr]) {
      newSchedule[dateStr] = [];
    }
    
    const idx = newSchedule[dateStr].indexOf(shift);
    if (idx > -1) {
      newSchedule[dateStr].splice(idx, 1);
      if (newSchedule[dateStr].length === 0) {
        delete newSchedule[dateStr];
      }
    } else {
      newSchedule[dateStr].push(shift);
    }
    
    setFormData({ ...formData, schedule_days: newSchedule });
  };

  const handleAddItem = async () => {
    try {
      if (!formData.machine_id || !formData.product_id) {
        alert('Pilih mesin dan produk');
        return;
      }
      
      await axiosInstance.post('/api/production/schedule-grid', {
        ...formData,
        machine_id: parseInt(formData.machine_id),
        product_id: parseInt(formData.product_id),
        order_ctn: parseFloat(formData.order_ctn) || 0,
        qty_per_ctn: parseFloat(formData.qty_per_ctn) || 0,
      });
      
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal menambah jadwal');
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Hapus jadwal ini?')) return;
    try {
      await axiosInstance.delete(`/api/production/schedule-grid/${id}`);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal menghapus');
    }
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      setNotes([...notes, newNote.trim()]);
      setNewNote('');
    }
  };

  const handleRemoveNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      machine_id: '',
      product_id: '',
      order_ctn: '',
      qty_per_ctn: '',
      spek_kain: '',
      no_spk: '',
      color: SCHEDULE_COLORS[scheduleItems.length % SCHEDULE_COLORS.length],
      schedule_days: {},
      notes: '',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGenerateWO = async (scheduleId: number) => {
    if (!confirm('Generate Work Order dari jadwal ini?')) return;
    try {
      const response = await axiosInstance.post(`/api/production/schedule-grid/${scheduleId}/generate-wo`);
      alert(response.data.message);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal membuat Work Order');
    }
  };

  const handleGenerateAllWO = async () => {
    if (!confirm('Generate semua Work Order untuk hari ini?')) return;
    try {
      const response = await axiosInstance.post('/api/production/schedule-grid/generate-wo-batch', {
        date: new Date().toISOString().split('T')[0]
      });
      alert(response.data.message);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal membuat Work Orders');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'wo_created':
        return { bg: 'bg-blue-100 text-blue-700', icon: CheckCircleIcon, label: 'WO Dibuat' };
      case 'in_progress':
        return { bg: 'bg-amber-100 text-amber-700', icon: ClockIcon, label: 'Proses' };
      case 'completed':
        return { bg: 'bg-green-100 text-green-700', icon: CheckCircleIcon, label: 'Selesai' };
      default:
        return { bg: 'bg-slate-100 text-slate-600', icon: ClockIcon, label: 'Rencana' };
    }
  };

  // Group items by machine
  const groupedByMachine = scheduleItems.reduce((acc, item) => {
    const key = item.machine_code || 'OTHER';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as { [key: string]: ScheduleItem[] });

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen print:p-2 print:bg-white">
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden print:shadow-none print:rounded-none">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-4 print:py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <CalendarDaysIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wide">Production Schedule</h1>
                <p className="text-blue-100 text-sm">Jadwal Produksi Mingguan - PPIC</p>
              </div>
            </div>
            <div className="text-right print:hidden">
              <p className="text-white/80 text-sm">PT. Gratia Makmur Sentosa</p>
              <p className="text-white font-semibold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
        
        {/* Info Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Week Navigation */}
            <div className="flex items-center gap-3 print:hidden">
              <button
                onClick={() => navigateWeek(-1)}
                className="p-2 rounded-xl bg-white border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all shadow-sm"
              >
                <ChevronLeftIcon className="h-5 w-5 text-slate-600" />
              </button>
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-md">
                Week {weekNumber}
              </div>
              <button
                onClick={() => navigateWeek(1)}
                className="p-2 rounded-xl bg-white border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all shadow-sm"
              >
                <ChevronRightIcon className="h-5 w-5 text-slate-600" />
              </button>
            </div>
            
            {/* Period Info */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Periode</p>
                <p className="font-bold text-slate-800">{getWeekPeriod()}</p>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div className="text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Tanggal</p>
                <p className="font-bold text-blue-600">{formatDateRange()}</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2 print:hidden">
              <button
                onClick={() => { resetForm(); setShowAddModal(true); }}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 flex items-center gap-2 font-medium shadow-md hover:shadow-lg transition-all"
              >
                <PlusIcon className="h-5 w-5" />
                Tambah Jadwal
              </button>
              <button
                onClick={handleGenerateAllWO}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 flex items-center gap-2 font-medium shadow-md hover:shadow-lg transition-all"
                title="Generate semua Work Order untuk jadwal hari ini"
              >
                <BoltIcon className="h-5 w-5" />
                Generate WO Hari Ini
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 flex items-center gap-2 font-medium transition-all"
              >
                <PrinterIcon className="h-5 w-5 text-slate-600" />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6 print:hidden">
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Cog6ToothIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{Object.keys(groupedByMachine).length}</p>
              <p className="text-xs text-slate-500">Mesin Aktif</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-emerald-500">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <ClipboardDocumentListIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{scheduleItems.length}</p>
              <p className="text-xs text-slate-500">Total Jadwal</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-amber-500">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{scheduleItems.reduce((sum, i) => sum + (i.order_ctn || 0), 0).toLocaleString()}</p>
              <p className="text-xs text-slate-500">Total CTN</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-purple-500">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">5</p>
              <p className="text-xs text-slate-500">Hari Kerja</p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden print:shadow-none print:rounded-none">
        {/* Table Header Bar */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SparklesIcon className="h-5 w-5 text-amber-400" />
            <span className="text-white font-semibold">Jadwal Produksi Minggu Ini</span>
          </div>
          <div className="flex items-center gap-2 text-xs print:hidden">
            <span className="text-slate-400">Keterangan:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-slate-300">Shift Aktif</span>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <div className="w-4 h-4 rounded border-2 border-dashed border-slate-400"></div>
              <span className="text-slate-300">Kosong</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600">
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider" rowSpan={2}>
                  <div className="flex items-center gap-2">
                    <Cog6ToothIcon className="h-4 w-4" />
                    Mesin
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider" rowSpan={2}>
                  <div className="flex items-center gap-2">
                    <CubeIcon className="h-4 w-4" />
                    Produk
                  </div>
                </th>
                <th className="px-3 py-3 text-center text-xs font-bold text-white uppercase tracking-wider" rowSpan={2}>Order<br/><span className="text-blue-200 font-normal">(CTN)</span></th>
                <th className="px-3 py-3 text-center text-xs font-bold text-white uppercase tracking-wider" rowSpan={2}>Q/CTN</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-white uppercase tracking-wider" rowSpan={2}>Total<br/><span className="text-blue-200 font-normal">(Pack)</span></th>
                <th className="px-3 py-3 text-center text-xs font-bold text-white uppercase tracking-wider" rowSpan={2}>Spek<br/>Kain</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-white uppercase tracking-wider" rowSpan={2}>
                  <div className="flex items-center justify-center gap-1">
                    <DocumentTextIcon className="h-4 w-4" />
                    SPK/WO
                  </div>
                </th>
                {DAYS.map((day, idx) => (
                  <th key={day} className="px-1 py-2 text-center border-l border-blue-500/50" colSpan={2}>
                    <div className="text-[10px] font-bold text-blue-200 uppercase">{day}</div>
                    <div className="text-xl font-black text-white">{weekDates[idx]?.getDate() || ''}</div>
                  </th>
                ))}
                <th className="px-3 py-3 text-center text-xs font-bold text-white uppercase tracking-wider print:hidden" rowSpan={2}>Aksi</th>
              </tr>
              <tr className="bg-indigo-500/80">
                {DAYS.map((day) => (
                  <React.Fragment key={`shift-${day}`}>
                    <th className="px-2 py-1.5 text-center text-[10px] font-bold text-white border-l border-indigo-400/50">
                      <span className="bg-white/20 px-2 py-0.5 rounded">S1</span>
                    </th>
                    <th className="px-2 py-1.5 text-center text-[10px] font-bold text-white">
                      <span className="bg-white/20 px-2 py-0.5 rounded">S2</span>
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={18} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
                      <p className="text-slate-500">Memuat jadwal...</p>
                    </div>
                  </td>
                </tr>
              ) : Object.keys(groupedByMachine).length === 0 ? (
                <tr>
                  <td colSpan={18} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-slate-100 p-4 rounded-full">
                        <CalendarDaysIcon className="h-12 w-12 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-600">Belum Ada Jadwal</p>
                        <p className="text-slate-400">Klik "Tambah Jadwal" untuk membuat jadwal produksi</p>
                      </div>
                      <button
                        onClick={() => { resetForm(); setShowAddModal(true); }}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <PlusIcon className="h-5 w-5" />
                        Tambah Jadwal Pertama
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                Object.entries(groupedByMachine).map(([machineCode, items], groupIdx) => (
                  <React.Fragment key={machineCode}>
                    {items.map((item, itemIdx) => (
                      <tr key={item.id} className={`hover:bg-blue-50/50 transition-colors ${groupIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                        {itemIdx === 0 && (
                          <td className="px-3 py-3 align-top border-r border-slate-200" rowSpan={items.length}>
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-xs font-bold shadow-sm ${item.color || 'bg-slate-500'}`}>
                              <Cog6ToothIcon className="h-4 w-4" />
                              {machineCode}
                            </div>
                          </td>
                        )}
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg ${item.color || 'bg-slate-400'} flex items-center justify-center flex-shrink-0`}>
                              <CubeIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800 text-sm leading-tight">{item.product_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{item.product_code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg font-bold text-sm">
                            {item.order_ctn?.toLocaleString() || 0}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center text-slate-600 font-medium">{item.qty_per_ctn || 0}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold text-sm">
                            {item.order_pack?.toLocaleString() || 0}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center text-xs text-slate-500">{item.spek_kain || '-'}</td>
                        <td className="px-3 py-2 text-center">
                          {item.no_spk ? (
                            <button
                              onClick={() => {
                                // Try to extract WO ID from no_spk or use wo_id field
                                const woId = item.wo_id || item.no_spk.replace(/\D/g, '');
                                if (woId) {
                                  navigate(`/app/production/work-orders/${woId}`);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg text-xs font-semibold hover:from-emerald-600 hover:to-green-700 transition-all shadow-sm hover:shadow-md group"
                            >
                              <span className="font-mono">{item.no_spk}</span>
                              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        {weekDates.map((date) => {
                          const dateStr = date.toISOString().split('T')[0];
                          const shifts = item.schedule_days?.[dateStr] || [];
                          return (
                            <React.Fragment key={dateStr}>
                              <td className="px-0.5 py-1.5 border-l border-slate-100">
                                {shifts.includes(1) ? (
                                  <div className={`mx-auto w-7 h-7 rounded-lg ${item.color || 'bg-blue-500'} shadow-md flex items-center justify-center`}>
                                    <span className="text-[9px] font-bold text-white/90">S1</span>
                                  </div>
                                ) : (
                                  <div className="mx-auto w-7 h-7 rounded-lg border-2 border-dashed border-slate-200"></div>
                                )}
                              </td>
                              <td className="px-0.5 py-1.5">
                                {shifts.includes(2) ? (
                                  <div className={`mx-auto w-7 h-7 rounded-lg ${item.color || 'bg-blue-500'} shadow-md flex items-center justify-center`}>
                                    <span className="text-[9px] font-bold text-white/90">S2</span>
                                  </div>
                                ) : (
                                  <div className="mx-auto w-7 h-7 rounded-lg border-2 border-dashed border-slate-200"></div>
                                )}
                              </td>
                            </React.Fragment>
                          );
                        })}
                        <td className="px-2 py-2 text-center print:hidden">
                          <div className="flex items-center justify-center gap-1">
                            {!item.wo_id && item.status === 'planned' && (
                              <button
                                onClick={() => handleGenerateWO(item.id)}
                                className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                title="Generate Work Order"
                              >
                                <BoltIcon className="h-4 w-4" />
                              </button>
                            )}
                            {item.wo_id && (
                              <button
                                onClick={() => navigate(`/app/production/work-orders/${item.wo_id}`)}
                                className="p-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Lihat Work Order"
                              >
                                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Hapus"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes Section */}
      <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 print:shadow-none print:p-4 print:rounded-none">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-red-100 p-2 rounded-lg">
            <DocumentTextIcon className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="font-bold text-slate-800">Catatan Penting</h3>
        </div>
        
        {notes.length > 0 ? (
          <div className="space-y-2 mb-4">
            {notes.map((note, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
                <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{idx + 1}</span>
                <span className="flex-1 text-red-700 text-sm">{note}</span>
                <button
                  onClick={() => handleRemoveNote(idx)}
                  className="text-red-300 hover:text-red-600 transition-colors print:hidden"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm mb-4 italic">Belum ada catatan</p>
        )}
        
        <div className="flex gap-2 print:hidden">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Tulis catatan baru..."
            className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-red-400 focus:outline-none transition-colors"
            onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
          />
          <button
            onClick={handleAddNote}
            className="px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium transition-colors flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Tambah
          </button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <PlusIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Tambah Jadwal Produksi</h3>
                    <p className="text-blue-100 text-sm">Week {weekNumber} • {formatDateRange()}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6 text-white" />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mesin <span className="text-red-500">*</span></label>
                  <select
                    value={formData.machine_id}
                    onChange={(e) => setFormData({ ...formData, machine_id: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-400 focus:outline-none transition-colors"
                  >
                    <option value="">Pilih Mesin</option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Produk <span className="text-red-500">*</span></label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-400 focus:outline-none transition-colors"
                  >
                    <option value="">Pilih Produk</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Order (CTN)</label>
                  <input
                    type="number"
                    value={formData.order_ctn}
                    onChange={(e) => setFormData({ ...formData, order_ctn: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-400 focus:outline-none transition-colors"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Q/CTN</label>
                  <input
                    type="number"
                    value={formData.qty_per_ctn}
                    onChange={(e) => setFormData({ ...formData, qty_per_ctn: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-400 focus:outline-none transition-colors"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Spek Kain</label>
                  <input
                    type="text"
                    value={formData.spek_kain}
                    onChange={(e) => setFormData({ ...formData, spek_kain: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-400 focus:outline-none transition-colors"
                    placeholder="Contoh: 60x60"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">No SPK</label>
                  <input
                    type="text"
                    value={formData.no_spk}
                    onChange={(e) => setFormData({ ...formData, no_spk: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-400 focus:outline-none transition-colors"
                    placeholder="Contoh: SPK-001"
                  />
                </div>
              </div>
              
              {/* Color Picker */}
              <div className="mt-5">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Warna Penanda</label>
                <div className="flex gap-2 flex-wrap">
                  {SCHEDULE_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-xl ${color} transition-all ${formData.color === color ? 'ring-4 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Schedule Grid */}
              <div className="mt-5">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Jadwal Shift</label>
                <p className="text-xs text-slate-400 mb-3">Klik tombol shift untuk mengaktifkan/menonaktifkan</p>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="grid grid-cols-5 gap-3">
                    {weekDates.map((date, idx) => {
                      const dateStr = date.toISOString().split('T')[0];
                      const shifts = formData.schedule_days[dateStr] || [];
                      return (
                        <div key={dateStr} className="text-center">
                          <div className="text-xs font-bold text-slate-500 mb-1">{DAYS[idx]}</div>
                          <div className="text-lg font-bold text-slate-800 mb-2">{date.getDate()}</div>
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => toggleScheduleDay(dateStr, 1)}
                              className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                                shifts.includes(1) 
                                  ? formData.color + ' text-white shadow-md scale-105' 
                                  : 'bg-white border-2 border-slate-200 text-slate-400 hover:border-slate-300'
                              }`}
                            >
                              S1
                            </button>
                            <button
                              onClick={() => toggleScheduleDay(dateStr, 2)}
                              className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                                shifts.includes(2) 
                                  ? formData.color + ' text-white shadow-md scale-105' 
                                  : 'bg-white border-2 border-slate-200 text-slate-400 hover:border-slate-300'
                              }`}
                            >
                              S2
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 border-2 border-slate-200 rounded-xl hover:bg-slate-100 font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleAddItem}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium shadow-md transition-all"
              >
                Simpan Jadwal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyProductionPlan;
