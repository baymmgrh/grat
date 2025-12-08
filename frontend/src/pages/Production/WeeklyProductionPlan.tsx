import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  PrinterIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
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
    <div className="p-4 bg-white min-h-screen print:p-0">
      {/* Header */}
      <div className="text-center mb-4 print:mb-2">
        <h1 className="text-xl font-bold text-gray-800 tracking-wider">PRODUCTION SCHEDULE</h1>
      </div>

      {/* Info Header */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm border-b pb-3">
        <div className="space-y-1">
          <div className="flex">
            <span className="w-24 font-semibold">Revision</span>
            <span>: 1</span>
          </div>
          <div className="flex">
            <span className="w-24 font-semibold">Create Date</span>
            <span>: {new Date().toLocaleDateString('id-ID')}</span>
          </div>
          <div className="flex">
            <span className="w-24 font-semibold">Periode</span>
            <span>: {getWeekPeriod()}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-red-700">{formatDateRange()}</p>
        </div>
      </div>

      {/* Week Navigation - Hide on print */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 rounded-lg border hover:bg-gray-50"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <span className="font-semibold px-4">Week {weekNumber}</span>
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 rounded-lg border hover:bg-gray-50"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Tambah Jadwal
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-1 text-sm"
          >
            <PrinterIcon className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      {/* Target Info */}
      <div className="mb-3 text-sm italic text-gray-600">
        Target efisiensi mesin : 50%
      </div>

      {/* Schedule Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-2 text-left font-semibold w-16" rowSpan={2}>MESIN</th>
              <th className="border px-2 py-2 text-left font-semibold w-48" rowSpan={2}>PRODUCT</th>
              <th className="border px-2 py-2 text-center font-semibold w-20" rowSpan={2}>ORDER (CTN)</th>
              <th className="border px-2 py-2 text-center font-semibold w-16" rowSpan={2}>Q/CTN</th>
              <th className="border px-2 py-2 text-center font-semibold w-20" rowSpan={2}>ORDER (PACK)</th>
              <th className="border px-2 py-2 text-center font-semibold w-32" rowSpan={2}>SPEK KAIN</th>
              <th className="border px-2 py-2 text-center font-semibold w-28" rowSpan={2}>NO SPK</th>
              {DAYS.map((day, idx) => (
                <th key={day} className="border px-1 py-1 text-center font-semibold" colSpan={2}>
                  <div>{day}</div>
                  <div className="text-red-600 font-bold">{weekDates[idx]?.getDate() || ''}</div>
                </th>
              ))}
              <th className="border px-2 py-2 text-center font-semibold print:hidden" rowSpan={2}>AKSI</th>
            </tr>
            <tr className="bg-gray-50">
              {DAYS.map((day) => (
                <React.Fragment key={`shift-${day}`}>
                  <th className="border px-1 py-1 text-center text-[10px] w-6">1</th>
                  <th className="border px-1 py-1 text-center text-[10px] w-6">2</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={18} className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </td>
              </tr>
            ) : Object.keys(groupedByMachine).length === 0 ? (
              <tr>
                <td colSpan={18} className="text-center py-8 text-gray-500">
                  Belum ada jadwal produksi untuk minggu ini
                </td>
              </tr>
            ) : (
              Object.entries(groupedByMachine).map(([machineCode, items]) => (
                <React.Fragment key={machineCode}>
                  {items.map((item, itemIdx) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {itemIdx === 0 && (
                        <td className="border px-2 py-2 font-semibold align-top" rowSpan={items.length}>
                          <span className={`px-2 py-1 rounded text-white text-[10px] ${item.color || 'bg-gray-500'}`}>
                            {machineCode}
                          </span>
                        </td>
                      )}
                      <td className="border px-2 py-1 text-[11px]">{item.product_name}</td>
                      <td className="border px-2 py-1 text-center">{item.order_ctn?.toLocaleString()}</td>
                      <td className="border px-2 py-1 text-center">{item.qty_per_ctn}</td>
                      <td className="border px-2 py-1 text-center">{item.order_pack?.toLocaleString()}</td>
                      <td className="border px-2 py-1 text-center text-[10px]">{item.spek_kain}</td>
                      <td className="border px-2 py-1 text-center text-[10px]">{item.no_spk}</td>
                      {weekDates.map((date) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const shifts = item.schedule_days?.[dateStr] || [];
                        return (
                          <React.Fragment key={dateStr}>
                            <td className="border px-0 py-0 w-6 h-6">
                              {shifts.includes(1) && (
                                <div className={`w-full h-6 ${item.color || 'bg-blue-500'}`}></div>
                              )}
                            </td>
                            <td className="border px-0 py-0 w-6 h-6">
                              {shifts.includes(2) && (
                                <div className={`w-full h-6 ${item.color || 'bg-blue-500'}`}></div>
                              )}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td className="border px-1 py-1 text-center print:hidden">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Notes Section */}
      <div className="mt-6 border-t pt-4">
        <h3 className="font-semibold mb-2">CATATAN :</h3>
        <div className="space-y-1">
          {notes.map((note, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm text-red-600">
              <span>{idx + 1}.</span>
              <span className="flex-1">{note}</span>
              <button
                onClick={() => handleRemoveNote(idx)}
                className="text-gray-400 hover:text-red-500 print:hidden"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2 print:hidden">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Tambah catatan..."
            className="flex-1 px-3 py-1 border rounded text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
          />
          <button
            onClick={handleAddNote}
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm"
          >
            Tambah
          </button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Tambah Jadwal Produksi</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mesin *</label>
                <select
                  value={formData.machine_id}
                  onChange={(e) => setFormData({ ...formData, machine_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Pilih Mesin</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Produk *</label>
                <select
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Pilih Produk</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Order (CTN)</label>
                <input
                  type="number"
                  value={formData.order_ctn}
                  onChange={(e) => setFormData({ ...formData, order_ctn: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Q/CTN</label>
                <input
                  type="number"
                  value={formData.qty_per_ctn}
                  onChange={(e) => setFormData({ ...formData, qty_per_ctn: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Spek Kain</label>
                <input
                  type="text"
                  value={formData.spek_kain}
                  onChange={(e) => setFormData({ ...formData, spek_kain: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">No SPK</label>
                <input
                  type="text"
                  value={formData.no_spk}
                  onChange={(e) => setFormData({ ...formData, no_spk: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Warna</label>
                <div className="flex gap-1 flex-wrap">
                  {SCHEDULE_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-6 h-6 rounded ${color} ${formData.color === color ? 'ring-2 ring-offset-1 ring-gray-800' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Schedule Grid */}
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Jadwal (klik untuk toggle)</label>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {DAYS.map((day, idx) => (
                        <th key={day} className="border px-2 py-1 text-center">
                          <div>{day}</div>
                          <div className="text-xs text-gray-500">{weekDates[idx]?.getDate()}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {weekDates.map((date) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const shifts = formData.schedule_days[dateStr] || [];
                        return (
                          <td key={dateStr} className="border p-1">
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => toggleScheduleDay(dateStr, 1)}
                                className={`w-8 h-8 rounded text-xs font-medium ${
                                  shifts.includes(1) ? formData.color + ' text-white' : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                              >
                                1
                              </button>
                              <button
                                onClick={() => toggleScheduleDay(dateStr, 2)}
                                className={`w-8 h-8 rounded text-xs font-medium ${
                                  shifts.includes(2) ? formData.color + ' text-white' : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                              >
                                2
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyProductionPlan;
